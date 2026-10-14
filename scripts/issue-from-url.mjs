// Point at a Drupal core issue that has a merge request and get a Before/After pair to test.
//   node scripts/issue-from-url.mjs <issue URL or number> [--pack <file>] [--out <file>] [--ai-recipe] [--mr N] [--no-import] [--dry-run]
//
// A thin front door over scripts/issue-pack.mjs, so it never hides a step:
//   1. no pack file yet  -> run `issue-pack prepare`, print exactly what to do next, and stop. Run this command again afterwards.
//   2. a pack file found -> `issue-pack validate` (printing the repair message on failure), then `issue-pack import`.
//   3. print the next commands (check-patches, build the -latest pair, open the viewer, and the phpunit note for a test-only issue).
// It reads the issue from drupal.org, writes files only under reports/, recipes/ and the prompt's own output, posts nothing and
// commits nothing. Everything it imports is a DRAFT until a person has run it.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { labRoot } from '../tools/compare/lib.mjs';

const args = process.argv.slice(2);
const VALUE_FLAGS = ['--pack', '--out', '--mr'];
const valueOf = (flag) => { const i = args.indexOf(flag); if (i < 0) return undefined; const v = args[i + 1]; if (v === undefined || v.startsWith('--')) { console.error(`${flag} needs a value`); process.exit(2); } return v; };
// The issue URL or number is the one argument that is not a flag and not the value of one.
const positional = [];
for (let i = 0; i < args.length; i++) { const a = args[i]; if (a.startsWith('--')) { if (VALUE_FLAGS.includes(a)) i++; continue; } positional.push(a); }
const input = positional[0];
if (!input) { console.error('usage: node scripts/issue-from-url.mjs <issue URL or number> [--pack <file>] [--out <file>] [--ai-recipe] [--mr N] [--no-import] [--dry-run]'); process.exit(2); }

const nid = String(input).match(/issues\/(\d{5,8})/) ? String(input).match(/issues\/(\d{5,8})/)[1] : (/^\d{5,8}$/.test(String(input).trim()) ? String(input).trim() : null);
if (!nid) { console.error(`Not an issue URL or number: ${input}\nUse https://www.drupal.org/project/drupal/issues/<nid> or just the number.`); process.exit(2); }

const packArg = valueOf('--pack');
if (packArg && !fs.existsSync(packArg)) { console.error(`--pack: no such file: ${packArg}`); process.exit(2); }
const outDir = (() => { const o = valueOf('--out'); return o ? path.dirname(path.resolve(o)) : (fs.existsSync(path.join(os.homedir(), 'Desktop')) ? path.join(os.homedir(), 'Desktop') : process.cwd()); })();
const candidates = [
  packArg,
  path.join(outDir, `issue-pack-${nid}.yml`),
  path.join(labRoot, 'reports/issues', nid, 'PACK.yml'),
  path.join(process.cwd(), `issue-pack-${nid}.yml`),
].filter(Boolean);
const pack = candidates.find((p) => fs.existsSync(p));
const run = (a) => { const r = spawnSync('node', a, { cwd: labRoot, stdio: 'inherit' }); return r.status ?? 1; };

console.log(`#${nid}: from an issue URL to a tested Before/After\n`);

if (!pack) {
  const a = [path.join(labRoot, 'scripts/issue-pack.mjs'), 'prepare', input];
  const out = valueOf('--out'); if (out) a.push('--out', out);
  const mr = valueOf('--mr'); if (mr) a.push('--mr', mr);
  if (args.includes('--ai-recipe')) a.push('--ai-recipe');
  a.push('--no-copy');   // the prompt can be 80 KB; print the path rather than copy silently
  if (run(a) !== 0) process.exit(1);
  console.log(`\nNext: paste the prompt file into a chat. Save the assistant's reply as:\n  ${path.join(outDir, `issue-pack-${nid}.yml`)}\nThen run this command again.`);
  process.exit(0);
}

console.log(`Using pack: ${path.relative(labRoot, pack) || pack}\n`);
const val = run([path.join(labRoot, 'scripts/issue-pack.mjs'), 'validate', pack]);
if (val !== 0) {
  console.log(`\nThe pack did not validate. Ask the chat to fix it:\n  node scripts/issue-pack.mjs validate ${path.relative(labRoot, pack)} --repair --no-copy`);
  console.log('(paste what it prints into the same chat, save the reply over the pack, then run this command again)');
  process.exit(1);
}
if (args.includes('--no-import') || args.includes('--dry-run')) {
  console.log(`\nThe pack is valid. Run this command again without ${args.includes('--dry-run') ? '--dry-run' : '--no-import'} to import it.`);
  process.exit(0);
}
if (run([path.join(labRoot, 'scripts/issue-pack.mjs'), 'import', pack]) !== 0) process.exit(1);

console.log(`\nNext:
  node tools/compare/setup.mjs ${nid}-pinned --check-patches      do the patches apply to the pinned core?
  node tools/compare/setup.mjs ${nid}-latest                      build the day-to-day pair (current core), 10-20 min
  node scripts/lab-env.mjs start ${nid}-latest --browser          both sites and the viewer
  Read reports/issues/${nid}/SUMMARY.md and run every step and check yourself; the import is a DRAFT.
  If the issue changes only tests: run the merge request's tests in each envs/ checkout and keep the logs under
  reports/issues/${nid}/phpunit/ (see docs/ISSUE-TO-LAB.md).`);
process.exit(0);
