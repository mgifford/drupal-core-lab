// Real-core check of the CSS build service with issue #3636143's imported merge request (needs envs/core.git, a built core checkout with node_modules, and Corepack):
//   node tests/lab/real/css-build-real.mjs [--write]
// It works in a scratch worktree of the same core commit as baseline-3636143-latest, with that checkout's node_modules linked in, so no lab environment is touched:
//   1. the imported MR patch is applied and checked with core's own `yarn run build:css --check` (the MR's source and compiled files)
//   2. the source is then made stale on purpose (a declaration added to navigation.pcss.css without recompiling), which core's check must report
//   3. a build without --corrective is refused and writes nothing; with --corrective the compiled file is rebuilt, the imported patch file is byte-for-byte unchanged,
//      and a follow-up interdiff and a full proposal are written (to a temp folder, or reports/issues/3636143/css-build/ with --write)
// Not part of the normal self-test: it needs a real checkout and the network-free but heavy toolchain. Exit 0 when every step behaves as stated, 1 otherwise, 77 when it cannot run.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { labRoot, envDir } from '../../../tools/compare/lib.mjs';
import { analyze, emitFollowup } from '../../../tools/compare/css-build.mjs';

const WRITE = process.argv.includes('--write');
const git = (cwd, ...a) => spawnSync('git', a, { cwd, encoding: 'utf8' });
const base = envDir('baseline-3636143-latest'), bare = path.join(labRoot, 'envs/core.git');
const skip = (m) => { console.error(`cannot run: ${m}`); process.exit(77); };
if (!fs.existsSync(path.join(base, 'core/node_modules'))) skip('envs/baseline-3636143-latest has no core/node_modules');
const commit = git(base, 'rev-parse', 'HEAD').stdout.trim();
const mr = path.join(labRoot, 'reports/issues/3636143/branches/3636143-regression-the-toggle.patch');
if (!fs.existsSync(mr)) skip('the MR patch is not in this checkout');
const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'css-real-'));
const wt = path.join(scratch, 'core-checkout');
const ok = []; const bad = [];
const check = (name, cond, detail = '') => (cond ? ok : bad).push(`${name}${detail ? `: ${detail}` : ''}`);
try {
  if (git(bare, 'worktree', 'add', '-q', '--detach', wt, commit).status !== 0) skip('cannot make a worktree of core at ' + commit);
  fs.symlinkSync(path.join(base, 'core/node_modules'), path.join(wt, 'core/node_modules'));
  if (git(wt, 'apply', mr).status !== 0) skip('the MR patch does not apply to ' + commit.slice(0, 12));
  const variant = { slug: 'real-3636143', issue: '3636143', before: { env: 'scratch', patches: [] }, after: { env: 'scratch', patches: [mr] } };
  const patchHash = sha(mr), run = (o = {}) => analyze({ slug: variant.slug, variant, dir: wt, mode: 'host', install: false, ...o });

  let r = run();
  console.log(`1. imported MR as submitted: ${r.overall} (${r.entries.map((e) => `${path.basename(e.source)} ${e.state}`).join(', ')}); Node ${r.tools?.node}, Yarn ${r.tools?.yarn}`);
  check('the MR as submitted is consistent on this core (the CI mismatch of an earlier MR head is not present in this revision)', r.overall === 'PASS', r.overall);
  check('the MR is imported, so it would not be rewritten', r.entries.every((e) => e.origin === 'imported'));

  // The imported MR, made stale on purpose: a copy of its patch without the compiled file's hunk, which is what a merge request that forgot to recompile looks like.
  const stalePatch = path.join(scratch, 'mr-without-compiled.patch');
  fs.writeFileSync(stalePatch, fs.readFileSync(mr, 'utf8').split(/^(?=diff --git )/m).filter((blk) => !/^diff --git a\/\S+navigation\.css /.test(blk)).join(''));
  git(wt, 'reset', '-q', '--hard'); git(wt, 'clean', '-fdq', '-e', 'core/node_modules');
  if (git(wt, 'apply', stalePatch).status !== 0) skip('the stale copy of the patch does not apply');
  const staleVariant = { ...variant, after: { env: 'scratch', patches: [stalePatch] } };
  const run2 = (o = {}) => analyze({ slug: variant.slug, variant: staleVariant, dir: wt, mode: 'host', install: false, ...o });
  r = run2();
  console.log(`2. imported patch whose source changed but compiled file did not: ${r.overall}`);
  check('a stale compiled file in an imported patch is detected by core\'s own check', r.overall === 'FAIL' && r.entries.some((e) => e.state === 'stale' && e.origin === 'imported'), r.overall);

  const staleHash = sha(stalePatch);
  const cssFile = path.join(wt, 'core/themes/default_admin/css/components/navigation.css'), h0 = sha(cssFile);
  r = run2({ build: true });
  check('a build without --corrective is refused and writes nothing', r.overall === 'FAIL' && sha(cssFile) === h0 && r.entries.some((e) => e.refused));
  r = run2({ build: true, corrective: true });
  console.log(`3. corrective build: ${r.overall}, rebuilt ${r.built.join(', ') || 'nothing'}`);
  check('the corrective build rebuilds the compiled file and the check then passes', r.overall === 'PASS' && r.built.length === 1 && sha(cssFile) !== h0);
  check('the imported patch files are byte for byte unchanged', sha(mr) === patchHash && sha(stalePatch) === staleHash);
  r = run2({ build: true, corrective: true });
  check('a second build changes nothing (idempotent)', r.built.length === 0 && r.overall === 'PASS');
  const outDir = WRITE ? path.join(labRoot, 'reports/issues/3636143/css-build') : path.join(scratch, 'out');
  const f = emitFollowup({ variant: staleVariant, dir: wt, res: r, outDir, day: new Date().toISOString().slice(0, 10) });
  check('a follow-up interdiff and a full proposal are written', !!f && !f.error && fs.existsSync(f.interdiff) && fs.existsSync(f.full), f?.error || '');
  if (f && !f.error) {
    const inter = fs.readFileSync(f.interdiff, 'utf8'), full = fs.readFileSync(f.full, 'utf8');
    check('the interdiff holds only the compiled file the imported patch lacked', /navigation\.css/.test(inter) && !/navigation\.pcss\.css/.test(inter));
    check('the full proposal holds both the source and the compiled file', /navigation\.pcss\.css/.test(full) && /navigation\.css/.test(full));
    console.log(`   interdiff: ${path.relative(labRoot, f.interdiff)}\n   full:      ${path.relative(labRoot, f.full)}`);
  }
} finally {
  git(bare, 'worktree', 'remove', '--force', wt);
  if (!WRITE) fs.rmSync(scratch, { recursive: true, force: true });
}
console.log(`\n${bad.length ? 'FAILED' : 'OK'}: ${ok.length} step(s) as stated${bad.length ? `, ${bad.length} not: ${bad.join('; ')}` : ''}`);
for (const o of ok) console.log(`  ok  ${o}`);
process.exit(bad.length ? 1 : 0);
