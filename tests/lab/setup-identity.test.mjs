// setup.mjs and environment identity, end to end on a tiny local "Drupal" (no real DDEV, no network): Before and After on one base, a pinned
// variant's commit, and a site whose recipe changed after it was set up. --checkout-only builds the worktrees; the recipe case runs the full
// setup with stand-in `ddev`, `docker` and `npm` that do nothing, because the check stops it before any of them is used. Only the
// zz-ident-* environments, refs/lab/zz-ident and the commit's ref are created; all are removed afterwards. Run: node --test tests/lab/setup-identity.test.mjs
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { labRoot } from '../../tools/compare/lib.mjs';
import { lock, unlock } from './e2e-lock.mjs';

await lock();   // one end-to-end setup test at a time (they share envs/core.git and envs/.setup.lock)

const git = (cwd, ...a) => spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...a], { cwd, encoding: 'utf8' });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'setup-identity-test-'));
const issueDir = path.join(labRoot, 'reports/issues/99000006'), recipeDir = path.join(labRoot, 'recipes/zz_ident_rcp'), bare = path.join(labRoot, 'envs/core.git');
const bareExisted = fs.existsSync(bare);
const env = (side) => path.join(labRoot, 'envs', `zz-ident-${side}`);
const PATCH = 'reports/issues/99000006/p.patch';
const out = (r) => `${r.stdout}\n${r.stderr}`;
let pinRef = '';

function cleanup() {
  for (const side of ['before', 'after']) { if (fs.existsSync(bare)) git(bare, 'worktree', 'remove', '--force', env(side)); fs.rmSync(env(side), { recursive: true, force: true }); }
  if (fs.existsSync(bare)) { git(bare, 'worktree', 'prune'); if (bareExisted) { git(bare, 'update-ref', '-d', 'refs/lab/zz-ident'); if (pinRef) git(bare, 'update-ref', '-d', pinRef); } else fs.rmSync(bare, { recursive: true, force: true }); }
  fs.rmSync(issueDir, { recursive: true, force: true }); fs.rmSync(recipeDir, { recursive: true, force: true });
}
after(() => { cleanup(); fs.rmSync(tmp, { recursive: true, force: true }); unlock(); });
cleanup();

const up = path.join(tmp, 'upstream'); fs.mkdirSync(path.join(up, 'core'), { recursive: true });
git(up, 'init', '-q', '-b', 'zz-ident'); fs.writeFileSync(path.join(up, 'core/x.txt'), 'one\ntwo\nthree\n'); git(up, 'add', '.'); git(up, 'commit', '-q', '-m', 'A');
const A = git(up, 'rev-parse', 'HEAD').stdout.trim();
fs.mkdirSync(issueDir, { recursive: true }); fs.mkdirSync(recipeDir, { recursive: true }); fs.writeFileSync(path.join(recipeDir, 'recipe.yml'), 'name: zz_ident_rcp\nweight: 0\n');
fs.writeFileSync(path.join(labRoot, PATCH), 'diff --git a/core/x.txt b/core/x.txt\n--- a/core/x.txt\n+++ b/core/x.txt\n@@ -1,3 +1,3 @@\n one\n-two\n+PATCHED\n three\n');
const writeVariants = (extra = []) => fs.writeFileSync(path.join(issueDir, 'variants.json'), JSON.stringify([{ slug: 'zz-ident-latest', issue: '99000006', core: { url: up, ref: 'zz-ident' }, recipe: 'zz_ident_rcp', before: { env: 'zz-ident-before' }, after: { env: 'zz-ident-after', patches: [PATCH] } }, ...extra]));
writeVariants();
const run = (slug, ...extra) => spawnSync('node', [path.join(labRoot, 'tools/compare/setup.mjs'), slug, `--core-from=${up}`, ...extra], { cwd: labRoot, encoding: 'utf8' });
const co = (slug = 'zz-ident-latest') => run(slug, '--checkout-only');
const head = (side) => git(env(side), 'rev-parse', 'HEAD').stdout.trim();
const removeAfter = () => { git(bare, 'worktree', 'remove', '--force', env('after')); fs.rmSync(env('after'), { recursive: true, force: true }); };

test('identity through setup.mjs: one base for the pair, a pin that must match, and a recipe that changed', (t) => {
  let r = co();
  if (r.status === 2 && /Another setup is already running/.test(out(r))) return t.skip('another setup.mjs is running in this checkout');
  assert.equal(r.status, 0, out(r)); assert.equal(head('before'), A); assert.equal(head('after'), A);

  // upstream moves on; the After environment is lost; before, a rebuild put it on the newest core and the pair silently differed
  fs.appendFileSync(path.join(up, 'core/x.txt'), 'four\n'); git(up, 'commit', '-q', '-am', 'B'); const B = git(up, 'rev-parse', 'HEAD').stdout.trim();
  removeAfter();
  r = co(); assert.equal(r.status, 0, out(r));
  assert.match(out(r), new RegExp(`zz-ident-after: created at ${A.slice(0, 12)}, the commit of zz-ident-before`)); assert.equal(head('after'), A, 'After stands on the base Before has'); assert.equal(fs.readFileSync(path.join(env('after'), 'core/x.txt'), 'utf8'), 'one\nPATCHED\nthree\n');
  assert.equal(co().status, 0, 'a pair on one base passes again');

  // a pair that is already on two bases (an After made by hand at the newest core): blocked before anything is touched
  removeAfter(); assert.equal(git(bare, 'worktree', 'add', '--detach', env('after'), B).status, 0);
  r = co(); assert.equal(r.status, 4, out(r));
  assert.match(r.stderr, new RegExp(`BLOCKED: the environments of zz-ident-latest[\\s\\S]*Before \\(zz-ident-before\\) is at ${A.slice(0, 12)} and After \\(zz-ident-after\\) is at ${B.slice(0, 12)}[\\s\\S]*lab-env\\.mjs delete zz-ident-latest --yes, then node tools/compare/setup\\.mjs zz-ident-latest`));
  assert.equal(head('after'), B); assert.equal(fs.readFileSync(path.join(env('after'), 'core/x.txt'), 'utf8'), 'one\ntwo\nthree\nfour\n', 'the patch was not applied to a pair that is blocked');

  // a pinned variant: the pair stands on A, the variant pins B
  removeAfter(); assert.equal(co().status, 0); pinRef = `refs/lab/${B.slice(0, 12)}`;
  writeVariants([{ slug: 'zz-ident-pinned', issue: '99000006', core: { url: up, commit: B }, recipe: 'zz_ident_rcp', before: { env: 'zz-ident-before' }, after: { env: 'zz-ident-after', patches: [PATCH] } }]);
  r = co('zz-ident-pinned'); assert.equal(r.status, 4, out(r)); assert.match(r.stderr, new RegExp(`zz-ident-before is at ${A.slice(0, 12)} but the variant pins ${B.slice(0, 12)}`));

  // a site that exists holds an older recipe than recipes/zz_ident_rcp now: the full setup stops, before any ddev call
  const bin = path.join(tmp, 'bin'); fs.mkdirSync(bin, { recursive: true });
  for (const tool of ['ddev', 'docker', 'npm']) fs.writeFileSync(path.join(bin, tool), '#!/bin/sh\nexit 0\n', { mode: 0o755 });
  fs.mkdirSync(path.join(env('before'), 'sites/default'), { recursive: true }); fs.writeFileSync(path.join(env('before'), 'sites/default/settings.php'), '<?php\n');
  fs.cpSync(recipeDir, path.join(env('before'), 'recipes/zz_ident_rcp'), { recursive: true });
  fs.writeFileSync(path.join(recipeDir, 'recipe.yml'), 'name: zz_ident_rcp\nweight: 10\n');   // the recipe is edited after the site was set up
  r = spawnSync('node', [path.join(labRoot, 'tools/compare/setup.mjs'), 'zz-ident-latest', `--core-from=${up}`], { cwd: labRoot, encoding: 'utf8', env: { ...process.env, PATH: `${bin}:${process.env.PATH}` } });
  assert.equal(r.status, 4, out(r)); assert.match(r.stderr, /BLOCKED[\s\S]*the recipe applied to zz-ident-before \([0-9a-f]{12}\) is not recipes\/zz_ident_rcp as it is now[\s\S]*lab-env\.mjs reset zz-ident-latest --yes/); assert.doesNotMatch(r.stderr, /delete/);
});
