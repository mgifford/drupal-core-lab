// Is a stored patch what it says it is? Read-only (tools/compare/patch-validate.mjs); never edits the patch, the repository or Before.
//   node scripts/patch-validate.mjs <patch> --base <rev> [--expect <file>...] [--repo <dir>] [--json]
//        parses it (a context line that is a lone space is an empty source line, not trailing whitespace), checks the declared start
//        revision and each file's pre-image blob, applies it in a temporary index, compares the files it changes with --expect, and
//        checks whitespace in the RESULTING source (git diff --cached --check), not in the .patch file
//   node scripts/patch-validate.mjs <full.patch> --base <rev> --interdiff <interdiff.patch> --prior-tip <rev> [--prior-base <rev>]
//        also: the interdiff on the prior proposal and the full patch on its base give the same result (AGENTS.md rule 17)
// --repo defaults to the shared core clone, envs/core.git (in a worktree of the lab: the main checkout's). Exit 0 all pass, 1 a check
// failed, 2 usage or no repository. A corrected patch is a new version with provenance: node scripts/patch-change.mjs record <patch> ...
import fs from 'node:fs';
import path from 'node:path';
import { labRoot } from '../tools/compare/lib.mjs';
import { primaryCheckout } from '../tools/compare/deps.mjs';
import { openRepo, validatePatch, equivalence } from '../tools/compare/patch-validate.mjs';

const args = process.argv.slice(2);
const val = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : ''; };
const list = (n) => { const i = args.indexOf(`--${n}`); if (i < 0) return null; const out = []; for (const a of args.slice(i + 1)) { if (a.startsWith('--')) break; out.push(...a.split(',').filter(Boolean)); } return out; };
const usage = () => { console.error('usage: node scripts/patch-validate.mjs <patch> --base <rev> [--expect <file>...] [--interdiff <patch> --prior-tip <rev> [--prior-base <rev>]] [--repo <dir>] [--json]'); process.exit(2); };
const patchArg = args[0]; if (!patchArg || patchArg.startsWith('--')) usage();
if (!fs.existsSync(patchArg)) { console.error(`${patchArg} does not exist`); process.exit(2); }
const repoDir = val('repo') || path.join(primaryCheckout(labRoot) || labRoot, 'envs/core.git');
const repo = openRepo(repoDir);
if (!repo.ok) { console.error(`${repo.error}.${val('repo') ? '' : ' The shared core clone is created by: node tools/compare/setup.mjs <slug>. Or name a repository with --repo <dir>.'}`); process.exit(2); }

const res = validatePatch({ repo, patch: fs.readFileSync(patchArg), base: val('base'), expect: list('expect') });
let eq = null;
if (val('interdiff')) {
  if (!val('prior-tip')) usage();
  eq = equivalence({ repo, full: fs.readFileSync(patchArg), fullBase: val('base'), interdiff: fs.readFileSync(val('interdiff')), priorTip: val('prior-tip'), priorBase: val('prior-base') });
  res.checks.push({ name: 'full patch and interdiff equivalent (rule 17)', status: eq.state === 'equivalent' ? 'ok' : eq.state === 'unknown' ? 'WARN' : 'FAIL', detail: eq.detail });
}
const failed = res.checks.some((c) => c.status === 'FAIL');
if (args.includes('--json')) console.log(JSON.stringify({ patch: patchArg, repo: repo.dir, ok: !failed, checks: res.checks, files: res.files, whitespace: res.whitespace, equivalence: eq }, null, 1));
else {
  console.log(`patch-validate ${patchArg} (read-only; repository ${repo.dir}${repo.shallow ? ', shallow' : ''})`);
  for (const c of res.checks) console.log(`${c.status.padEnd(4)}  ${c.name}${c.detail ? `: ${c.detail}` : ''}`);
  if (eq && eq.files.length) for (const f of eq.files) console.log(`        ${f.result.padEnd(30)} ${f.file}`);
  if (failed && /^reports\/issues\/\d+\/branches\//.test(path.relative(labRoot, path.resolve(patchArg)))) console.log('\nThe stored patch is left as it is (it is the evidence). A corrected version gets provenance: node scripts/patch-change.mjs record <patch> --by "<who>" --reason "<why>".');
}
process.exit(failed ? 1 : 0);
