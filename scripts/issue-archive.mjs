// Archive one issue in place once drupal.org has closed it (fixed upstream, duplicate, won't fix, outdated and so on). The folder, its
// evidence and its pinned variants stay where they are, so links to them keep working. See docs/ISSUE-LIFECYCLE.md.
//   node scripts/issue-archive.mjs <nid> [--reason fixed|duplicate|wont-fix|works-as-designed|outdated|cannot-reproduce|other]
//        [--commit <core commit with the change>] [--duplicate-of <nid>] [--note "<text>"] [--dry-run] [--force]
// Writes reports/issues/<nid>/ARCHIVED.md; marks the issue's variants that follow a core branch (no pinned commit) as retired, since
// that branch now holds the change and their patch no longer applies (a pinned variant still builds); then rebuilds cloud/ and
// reports/issues/README.md. --reason defaults to what the issue's status.json says. --force replaces an existing ARCHIVED.md.
// It changes files only; review them and commit. To undo: delete ARCHIVED.md and the "retired" entries (or revert that commit).
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { labRoot, variants } from '../tools/compare/lib.mjs';
import { issueDir, readStatus, readArchived, reasonFromStatus, REASONS, markRetired, archivedMarkdown } from '../tools/compare/issue-tracking.mjs';

const args = process.argv.slice(2);
const val = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : ''; };
const DRY = args.includes('--dry-run'), FORCE = args.includes('--force');
const fail = (msg) => { console.error(msg); process.exit(2); };
const nid = args.find((a) => /^\d{5,8}$/.test(a));
if (!nid) fail('usage: node scripts/issue-archive.mjs <nid> [--reason <reason>] [--commit <sha>] [--duplicate-of <nid>] [--note "<text>"] [--dry-run] [--force]');
const dir = issueDir(labRoot, nid);
if (!fs.existsSync(dir)) fail(`No folder reports/issues/${nid}/.`);
if (readArchived(dir) && !FORCE) fail(`#${nid} is already archived (reports/issues/${nid}/ARCHIVED.md). --force replaces the record.`);

const status = readStatus(dir);
const reasonKey = val('reason') || (status ? reasonFromStatus(status.statusCode) : '');
if (!REASONS[reasonKey]) {
  fail(status ? `drupal.org says #${nid} is "${status.status}" (status.json, ${status.since}), which is not closed. Archive it anyway with --reason <${Object.keys(REASONS).join('|')}>, or wait for the issue to close.`
    : `No status.json for #${nid}: run node scripts/issue-status.mjs ${nid} --write first, or name the reason: --reason <${Object.keys(REASONS).join('|')}>.`);
}
const commit = val('commit'), duplicateOf = val('duplicate-of').replace(/^#/, ''), note = val('note');
if (commit && !/^[0-9a-f]{7,40}$/i.test(commit)) fail(`--commit ${commit} is not a commit hash.`);
if (duplicateOf && !/^\d{5,8}$/.test(duplicateOf)) fail(`--duplicate-of ${duplicateOf} is not an issue number.`);

const today = new Date().toISOString().slice(0, 10);
const mine = variants().filter((v) => String(v.issue) === nid);
const toRetire = mine.filter((v) => !v.retired && !(v.core && v.core.commit));
const kept = mine.filter((v) => !toRetire.includes(v) && !v.retired).map((v) => v.slug);
const retiredNote = `${today}: #${nid} archived (${REASONS[reasonKey]}); this variant follows core ${toRetire[0]?.core?.ref || 'main'}, which now holds the change`;
// Where each variant is defined: tools/compare/variants.json wins over the issue's own variants.json (tools/compare/lib.mjs rawVariants).
const files = [path.join(labRoot, 'tools/compare/variants.json'), path.join(dir, 'variants.json')].filter((f) => fs.existsSync(f));
const edits = new Map();
for (const v of toRetire) {
  const file = files.find((f) => JSON.parse(fs.readFileSync(f, 'utf8')).some((x) => x.slug === v.slug));
  if (!file) fail(`Could not find where ${v.slug} is defined.`);
  edits.set(file, markRetired(edits.get(file) || fs.readFileSync(file, 'utf8'), v.slug, retiredNote));
}
const record = archivedMarkdown({ nid, title: status ? status.title : '', date: today, reason: REASONS[reasonKey], status, commit, duplicateOf, retired: toRetire.map((v) => v.slug), kept, note });

console.log(`${DRY ? 'Would archive' : 'Archiving'} #${nid}: ${REASONS[reasonKey]}.`);
console.log(`  ${DRY ? 'would write' : 'writes'} reports/issues/${nid}/ARCHIVED.md`);
for (const v of toRetire) console.log(`  ${DRY ? 'would retire' : 'retires'} ${v.slug} (follows core ${v.core?.ref || 'main'})`);
if (kept.length) console.log(`  keeps ${kept.join(', ')} (pinned to a core commit; still builds)`);
if (DRY) { console.log('\nDry run: nothing was changed.'); process.exit(0); }

for (const [file, text] of edits) fs.writeFileSync(file, text);
fs.writeFileSync(path.join(dir, 'ARCHIVED.md'), record);
for (const script of ['scripts/build-cloud.mjs', 'scripts/index-issues.mjs']) {
  const r = spawnSync(process.execPath, [path.join(labRoot, script)], { cwd: labRoot, encoding: 'utf8' });
  if (r.status !== 0) { console.error(`${script} failed: ${(r.stderr || r.stdout).trim().split('\n')[0]}`); process.exit(1); }
}
console.log(`\nDone. Review and commit: reports/issues/${nid}/ARCHIVED.md, ${[...edits.keys()].map((f) => path.relative(labRoot, f)).join(', ')}${edits.size ? ', ' : ''}cloud/, reports/issues/README.md.`);
if (toRetire.length) console.log(`To free disk on the machine that built them: ${toRetire.map((v) => `node scripts/lab-env.mjs retire ${v.slug} --yes`).join('; ')}.`);
