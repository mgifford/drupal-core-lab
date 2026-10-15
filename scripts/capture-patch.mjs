// Capture the edits made in an After environment as a patch file, for an issue that has no merge request yet (AI-usage Phase 5).
//   node scripts/capture-patch.mjs <slug>                          list what would be captured; writes nothing
//   node scripts/capture-patch.mjs <slug> --name <name> [--exclude <path>...]
//        writes reports/issues/<nid>/branches/<nid>-<name>.patch, lists it in the variant's after.patches (and clears after.authoring),
//        adds a row to BRANCHES.md, and records the environment against the new patch list (the files hold the same bytes either way).
// What is captured: every change in the After checkout beyond the variant's declared patches, tracked or new, that git does not ignore
// (the lab's own marker file and recipe copy are left out). The patch is checked to round-trip before anything is written. Nothing is
// pushed or posted; to share the change, open a merge request from it on drupal.org yourself.
// A second capture adds a second patch on top of the first. It does not rewrite the first.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { labRoot, rawVariants, variants, envDir } from '../tools/compare/lib.mjs';
import { captureEdits, labFiles } from '../tools/compare/capture.mjs';
import { spawnSync } from 'node:child_process';
import { ensurePatches, inspect } from '../tools/compare/patch-state.mjs';

const args = process.argv.slice(2), slug = args.find((a) => !a.startsWith('--') && !['--name', '--exclude'].includes(args[args.indexOf(a) - 1]));
const val = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : null; };
const vals = (n) => args.flatMap((a, i) => (args[i - 1] === `--${n}` && !a.startsWith('--') ? [a] : []));
const fail = (m, code = 1) => { console.error(m); process.exit(code); };
if (!slug) fail('usage: node scripts/capture-patch.mjs <slug> [--name <name> [--exclude <path>...]]', 2);
const v = variants().find((x) => x.slug === slug); if (!v) fail(`No variant ${slug}.`);
const nid = v.issue || ((v.after.patches || [])[0] || '').match(/reports\/issues\/(\d+)\//)?.[1]; if (!nid) fail(`${slug} has no issue number (set "issue" in the variant).`);
const dir = envDir(v.after.env); if (!fs.existsSync(dir)) fail(`The After environment ${v.after.env} does not exist. Build it first: node tools/compare/setup.mjs ${slug}`);
const declared = v.after.patches || [], bufs = declared.map((p) => fs.readFileSync(path.join(labRoot, p)));
const cap = captureEdits(dir, bufs, { exclude: [...labFiles(v.recipe, (v.contrib || []).map((m) => m.name)), ...vals('exclude')] });
if (!cap.ok) fail(`Nothing captured: ${cap.error}`);
const name = val('name');
console.log(`${v.after.env}: ${cap.files.length ? `${cap.files.length} file(s) changed beyond the ${declared.length} declared patch(es):` : `nothing changed beyond the ${declared.length} declared patch(es); nothing to capture.`}`);
for (const f of cap.files.slice(0, 40)) console.log(`  ${f.status}  ${f.path}`);
if (cap.files.length > 40) console.log(`  ... and ${cap.files.length - 40} more`);
if (!cap.files.length) process.exit(0);
if (!name) { console.log(`\nNothing written. To keep it as a patch: node scripts/capture-patch.mjs ${slug} --name <short-name>   (add --exclude <path> for files that are not part of the change)`); process.exit(0); }
if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) fail('--name is lower-case letters, digits and hyphens.', 2);

const rel = `reports/issues/${nid}/branches/${nid}-${name}.patch`, file = path.join(labRoot, rel);
if (fs.existsSync(file)) fail(`${rel} already exists; choose another --name (a second capture is a second patch).`);
if (declared.includes(rel)) fail(`${rel} is already listed.`);

// list it in the variant where it is written (the issue's own variants.json, or tools/compare/variants.json for the older issues)
const issueFile = path.join(labRoot, 'reports/issues', nid, 'variants.json');
const candidates = [issueFile, path.join(labRoot, 'tools/compare/variants.json')].filter((f) => fs.existsSync(f));
const home = candidates.find((f) => JSON.parse(fs.readFileSync(f, 'utf8')).some((x) => x.slug === slug)); if (!home) fail(`Could not find ${slug} in a variants file.`);
const list = JSON.parse(fs.readFileSync(home, 'utf8')), entry = list.find((x) => x.slug === slug);
if (JSON.stringify(list, null, 2) + '\n' !== fs.readFileSync(home, 'utf8')) fail(`${path.relative(labRoot, home)} is not in the standard two-space format, so it would be reformatted. Add "${rel}" to ${slug}'s after.patches by hand, then re-run with the patch file already in place.`);

fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, cap.patch);
entry.after = { ...(entry.after || {}), patches: [...declared, rel] }; delete entry.after.authoring;
fs.writeFileSync(home, `${JSON.stringify(list, null, 2)}\n`);

const branches = path.join(labRoot, 'reports/issues', nid, 'BRANCHES.md'), sha = crypto.createHash('sha256').update(cap.patch).digest('hex').slice(0, 8);
const baseCommit = spawnSync('git', ['rev-parse', '--short=12', 'HEAD'], { cwd: dir, encoding: 'utf8' }).stdout.trim();
const row = `| [\`branches/${nid}-${name}.patch\`](branches/${nid}-${name}.patch) | authored in the lab (no merge request), captured from \`${v.after.env}\` on ${new Date().toISOString().slice(0, 10)} with \`scripts/capture-patch.mjs\`; sha256 ${sha} | - | ${baseCommit} | - | ${cap.files.length} |\n`;
if (fs.existsSync(branches)) fs.appendFileSync(branches, (fs.readFileSync(branches, 'utf8').endsWith('\n') ? '' : '\n') + row);
else fs.writeFileSync(branches, `# Branch patches for #${nid}\n\n| Patch | Source | Tip | Base | Base date and subject | Files |\n|---|---|---|---|---|---|\n${row}`);

// A change made only of new files leaves the tracked files clean, which setup reads as "patches not applied yet" and would try to apply on top of
// the files already there. The patch holds those files byte for byte (it was checked to round-trip), so take them out and let it put them back.
if (inspect(dir, labRoot, [...declared, rel]).state === 'fresh') for (const f of cap.files.filter((x) => x.status === 'A')) fs.rmSync(path.join(dir, f.path), { force: true });
// record the environment against the new patch list: restore the files the patches touch, apply the patches, record the hashes
const r = ensurePatches({ dir, labRoot, patchPaths: [...declared, rel], refresh: true, slug, env: v.after.env, side: 'after' });
console.log(`\nWrote ${rel} (${cap.patch.length} bytes, sha256 ${sha}) and listed it in ${slug} (${path.relative(labRoot, home)}).`);
for (const l of r.lines) console.log(l);
if (r.status === 'failed' || r.status === 'blocked') fail(`The patch is written, but the environment could not be recorded against it (${r.status}). Run: node tools/compare/setup.mjs ${slug} --refresh-patches`);
console.log(`Next: add the patch to the variants of the same issue that should carry it (for example the other of -pinned and -latest), then run the evaluator and: node scripts/coverage.mjs ${nid}`);
