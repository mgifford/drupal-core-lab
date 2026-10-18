// Scaffold a new issue in the lab: folder, patch from the issue fork branch (with provenance), REPRODUCE.md,
// status and evidence templates, a recipe stub, and pinned + latest variants in tools/compare/variants.json.
//   node scripts/new-issue.mjs <nid> --branch <fork-branch> [--title "<title>"] [--depth 300] [--dry-run]
//   node scripts/new-issue.mjs <nid> --authoring [--title "<title>"]   there is no merge request or fork branch yet: scaffold the folder and the variants with "after.authoring": true, pinned to current core main; write the fix in the After environment and capture it with scripts/capture-patch.mjs
//   node scripts/new-issue.mjs <nid> --branch <fork-branch> --refresh     the merge request got a new push: extract the patch again, say what changed, and touch nothing else
// The core commit the patch was based on is pinned, so the reproduction can be repeated later exactly.
// Needs envs/core.git (created by tools/compare/setup.mjs). Network access to git.drupalcode.org.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { labRoot } from '../tools/compare/lib.mjs';
import { renderIssueSummary } from '../tools/compare/issue-summary.mjs';
import { NEW_ISSUE_MATRIX } from '../tools/compare/coverage-matrix.mjs';
import { upsertBranchRow, comparePatch } from '../tools/compare/branch-patch.mjs';
import { recordChange } from '../tools/compare/patch-change.mjs';

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
const nid = args.find((a) => /^\d{5,8}$/.test(a));
const branch = flag('branch'); const title = flag('title', `Issue ${nid}`); const depth = flag('depth', '300');
const dry = args.includes('--dry-run'), refresh = args.includes('--refresh'), authoring = args.includes('--authoring');
if (!nid || (!branch && !authoring) || (branch && authoring)) { console.error('usage: node scripts/new-issue.mjs <nid> --branch <fork-branch> [--title "<title>"] | <nid> --authoring')  /* the branch and --authoring exclude each other */; console.error('       full form: --branch <fork-branch> [--title "<title>"] [--depth 300] [--variants-file <path>] [--dry-run]'); process.exit(2); }
const bare = path.join(labRoot, 'envs/core.git');
if (!fs.existsSync(bare)) { console.error('envs/core.git does not exist yet. Run: node tools/compare/setup.mjs <any-slug> (it creates the shared core clone), or: git init --bare envs/core.git && git -C envs/core.git remote add origin https://git.drupalcode.org/project/drupal.git'); process.exit(1); }
// Auto-gc and maintenance off: after the first shallow fetch git starts a background cleanup, which makes the second fetch fail
// with "shallow file has changed since we read it".
const git = (a, o = {}) => spawnSync('git', ['-c', 'gc.auto=0', '-c', 'maintenance.auto=false', '-C', bare, ...a], { encoding: 'utf8', ...o });
const must = (r, what) => { if (r.status !== 0) { console.error(`${what} failed:\n${r.stderr || r.stdout}`); process.exit(1); } return r.stdout.trim(); };
const dir = path.join(labRoot, 'reports/issues', nid);
const date = new Date().toISOString().slice(0, 10);
const forkUrl = flag('fork-url', `https://git.drupalcode.org/issue/drupal-${nid}.git`);
const branchRef = `refs/lab/issue-${nid}/${branch}`;

const patchRel = branch ? `reports/issues/${nid}/branches/${branch}.patch` : null, patchFile = patchRel && path.join(labRoot, patchRel);
// A patch that is already there is never replaced by accident: a second run used to overwrite it and BRANCHES.md without a word.
if (branch && fs.existsSync(patchFile) && !refresh) { console.error(`${patchRel} already exists. To extract it again from the branch tip: node scripts/new-issue.mjs ${nid} --branch ${branch} --refresh`); process.exit(1); }
// (the folders issue-intake.mjs makes, intake/ and handoffs/, do not count as an existing issue)
if (authoring && fs.existsSync(dir) && fs.readdirSync(dir).some((f) => !['intake', 'handoffs'].includes(f))) { console.error(`reports/issues/${nid} already exists; --authoring creates a new issue folder. To add the first patch to an existing one: node scripts/capture-patch.mjs <slug> --name <name>`); process.exit(1); }
if (refresh && !fs.existsSync(patchFile)) { console.error(`--refresh updates a patch that is already there, and ${patchRel} is not. Run without --refresh to create the issue folder.`); process.exit(1); }
console.log(authoring ? `Fetching core main (depth ${depth}); no issue fork is read: --authoring ...` : `Fetching core main and ${forkUrl} ${branch} (depth ${depth}) ...`);
if (dry) { console.log('(dry run: nothing is fetched or written)'); process.exit(0); }
must(git(['fetch', '--depth', depth, 'origin', '+refs/heads/main:refs/lab/new-issue/main']), 'fetch core main');
if (!authoring && git(['remote', 'get-url', `f${nid}`]).status !== 0) must(git(['remote', 'add', `f${nid}`, forkUrl]), 'add fork remote');
if (!authoring) must(git(['fetch', '--depth', depth, `f${nid}`, `+refs/heads/${branch}:${branchRef}`]), 'fetch issue branch');
const mb = authoring ? { status: 0, stdout: must(git(['rev-parse', 'refs/lab/new-issue/main']), 'rev-parse main') } : git(['merge-base', 'refs/lab/new-issue/main', branchRef]);
if (mb.status !== 0) { console.error(`No common ancestor within depth ${depth}. The branch is older than the fetched history: re-run with a larger --depth (for example 1500).`); process.exit(1); }
const base = mb.stdout.trim();
const tip = authoring ? '-' : must(git(['rev-parse', '--short=8', branchRef]), 'rev-parse');
const files = authoring ? [] : must(git(['diff', '--name-only', base, branchRef]), 'diff').split('\n').filter(Boolean);
const patch = authoring ? '' : must(git(['diff', '--no-color', '--full-index', base, branchRef], { maxBuffer: 256 * 1024 * 1024 }), 'diff');
const baseInfo = must(git(['log', '-1', '--format=%cs %s', base]), 'log');

const row = `| [\`branches/${branch}.patch\`](branches/${branch}.patch) | ${forkUrl} \`${branch}\` | ${tip} | ${base.slice(0, 12)} | ${baseInfo} | ${files.length} |`;
const intro = `# Branch patches for #${nid}\n\nExtracted ${date} from ${forkUrl} with \`git diff <merge-base> <branch tip>\`: only the branch's own changes.\nNot rebased onto current \`main\`. The MR on drupal.org is the source of truth.\n\n`;
const branchesFile = path.join(dir, 'BRANCHES.md'), readBranches = () => (fs.existsSync(branchesFile) ? fs.readFileSync(branchesFile, 'utf8') : '');
if (refresh) {
  // Only the one patch and its row change. Variants, recipe, steps, checks, evidence and comment draft are not touched.
  const c = comparePatch(fs.readFileSync(patchFile), patch + '\n');
  if (!c.changed) { console.log(`#${nid} ${branch}: unchanged. The branch tip ${tip} gives the same changes${c.bytesDiffer ? ' (the stored file differs only in the abbreviated object names on its index lines, so it was left alone and its hash is unchanged)' : ''}; nothing was written.`); process.exit(0); }
  fs.writeFileSync(patchFile, patch + '\n'); fs.writeFileSync(branchesFile, upsertBranchRow(readBranches(), branch, row, intro));
  console.log(`#${nid} ${branch}: CHANGED. Wrote ${patchRel} (sha256 ${c.oldSha.slice(0, 8)} -> ${c.newSha.slice(0, 8)}), tip ${tip}, base ${base.slice(0, 12)}, ${files.length} file(s)${c.added.length ? `; added: ${c.added.join(', ')}` : ''}${c.removed.length ? `; no longer touched: ${c.removed.join(', ')}` : ''}. Its row in BRANCHES.md is updated; nothing else was.`);
  // A patch that changes says so: keep the version it replaced and add a row to PATCH-CHANGES.md (skipped for a patch git has never seen).
  const rec = recordChange(labRoot, patchRel, { base: 'HEAD', by: 'scripts/new-issue.mjs --refresh', reason: `the merge request branch ${branch} moved: tip ${tip}, base ${base.slice(0, 12)}` });
  console.log(rec.status === 'recorded' ? `Recorded in ${rec.row} (the version it replaced is kept at ${rec.kept}).` : `Change not recorded (${rec.status}${rec.error ? `: ${rec.error}` : ''}).`);
  const lists = JSON.parse(fs.readFileSync(path.join(labRoot, 'tools/compare/variants.json'), 'utf8')).concat(fs.existsSync(path.join(dir, 'variants.json')) ? JSON.parse(fs.readFileSync(path.join(dir, 'variants.json'), 'utf8')) : []);
  const users = lists.filter((x) => x.issue === nid && ((x.after && x.after.patches) || []).includes(patchRel));
  console.log(`\nNext:\n${users.map((x) => `  node tools/compare/setup.mjs ${x.slug} --refresh-patches   (${x.core && x.core.commit ? `pins core ${String(x.core.commit).slice(0, 12)}; the patch is now based on ${base.slice(0, 12)}: run --check-patches and re-pin if they differ` : 'follows core main'})`).join('\n') || '  (no variant lists this patch)'}\n  node scripts/coverage.mjs ${nid}   (runs recorded against the old patch are now marked stale)\n  node scripts/issue-status.mjs ${nid} --write`);
  process.exit(0);
}
fs.mkdirSync(path.join(dir, 'branches'), { recursive: true });
if (authoring) fs.writeFileSync(branchesFile, `# Branch patches for #${nid}\n\nThere is no merge request or issue fork branch for this issue (checked ${date}). The fix is written in the lab: node scripts/capture-patch.mjs ${nid}-latest --name <name> turns the edits made in the After environment into a patch file and adds a row here.\nUntil then the variants say "authoring": true and After holds nothing to test.\n\n| Patch | Source | Tip | Base | Base date and subject | Files |\n|---|---|---|---|---|---|\n`);
else {
  fs.writeFileSync(patchFile, patch + '\n');
  fs.writeFileSync(branchesFile, upsertBranchRow(readBranches(), branch, row, intro));
}
const sub = (t) => t.replaceAll('<NID>', nid).replaceAll('<TITLE>', title).replaceAll('<PINNED>', base.slice(0, 12)).replaceAll('<DATE>', date).replaceAll('<nid>', nid);
for (const [tpl, out] of [['REPRODUCE.md', 'REPRODUCE.md'], ['EVIDENCE.md', 'EVIDENCE.md'], ['ISSUE-COMMENT-DRAFT.md', 'ISSUE-COMMENT-DRAFT.md']]) {
  const dst = path.join(dir, out); if (fs.existsSync(dst)) { console.log(`kept existing ${out}`); continue; }
  fs.writeFileSync(dst, sub(fs.readFileSync(path.join(labRoot, 'reports/_templates', tpl), 'utf8')));
}
const summaryFile = path.join(dir, 'SUMMARY.md');
if (!fs.existsSync(summaryFile)) fs.writeFileSync(summaryFile, renderIssueSummary({
  nid, title, metadata: `Selected base: \`${base}\`. Prepared: ${date}.\nFork branch: ${branch || 'none (local authoring)'}.`,
}));
else console.log('kept existing SUMMARY.md');
const status = path.join(dir, `STATUS-${date}.md`);
if (!fs.existsSync(status)) fs.writeFileSync(status, `# #${nid} status snapshot (${date})\n\nFill in from the issue page: title, status, tags, MR link, related issues, unresolved review threads, blockers.\nRe-check on drupal.org before relying on it.\n`);

// recipe stub
const recipe = `repro_${nid}`; const rdir = path.join(labRoot, 'recipes', recipe);
if (!fs.existsSync(rdir)) { fs.mkdirSync(rdir, { recursive: true }); fs.writeFileSync(path.join(rdir, 'recipe.yml'), `name: 'Repro: #${nid} ${title.replace(/'/g, '')}'\ndescription: 'Starting state for the steps to reproduce #${nid}. Edit: list the modules to install and any content types or config the steps need.'\ntype: 'Testing'\n# A dependency name containing '/' is resolved from the Drupal root, for example:\n# recipes:\n#   - core/tests/fixtures/recipes/article_content_type\ninstall: []\n`); }

// variants: pinned (to the commit the patch was based on) and latest
// --variants-file <path> (relative to the lab root) writes the two new variants there instead of into tools/compare/variants.json;
// scripts/issue-pack.mjs uses reports/issues/<nid>/variants.json so the shared file is never edited by an import.
const vfArg = flag('variants-file');
const vf = vfArg ? path.join(labRoot, vfArg) : path.join(labRoot, 'tools/compare/variants.json');
fs.mkdirSync(path.dirname(vf), { recursive: true });
const all = fs.existsSync(vf) ? JSON.parse(fs.readFileSync(vf, 'utf8')) : [];
const pinned = `${nid}-pinned`, latest = `${nid}-latest`;
if (!all.some((x) => x.slug === pinned)) {
  all.push({ slug: pinned, issue: nid, label: `#${nid}: ${title}, pinned core`, description: 'TODO: what to do and what to look for.', status: 'stub: fill in pages, steps, expected, checks, observe',
    core: { url: 'https://git.drupalcode.org/project/drupal.git', commit: base },
    before: { env: `baseline-${nid}` }, after: authoring ? { env: `issue-${nid}`, patches: [], authoring: true } : { env: `issue-${nid}`, patches: [`reports/issues/${nid}/branches/${branch}.patch`] },
    pages: ['/'], login: true, recipe, steps: [], expected: 'TODO', actual: 'TODO', checks: [], observe: [],
    coverage: { note: 'The combinations that count as tested for this issue (scripts/coverage.mjs). Edit to fit the question the issue asks.', matrix: NEW_ISSUE_MATRIX } });
  all.push({ slug: latest, extends: pinned, label: `#${nid}: same steps against the LATEST core main`, core: { ref: 'main', commit: null }, before: { env: `baseline-${nid}-latest` }, after: { env: `issue-${nid}-latest` } });
  fs.writeFileSync(vf, JSON.stringify(all, null, 2) + '\n');
}
console.log(`\nCreated reports/issues/${nid}/ (patch: ${files.length} files, base ${base.slice(0, 12)} ${baseInfo}), recipes/${recipe}/, variants ${pinned} and ${latest}.\n\nNext:\n  1. Edit tools/compare/variants.json (${pinned}): pages, steps, expected, checks, observe.\n  2. Edit recipes/${recipe}/recipe.yml so the starting state exists.\n  3. node tools/compare/setup.mjs ${pinned} --check-patches   then   node tools/compare/setup.mjs ${pinned}\n  4. node tools/compare/serve.mjs ${pinned}   and follow reports/issues/${nid}/REPRODUCE.md`);
