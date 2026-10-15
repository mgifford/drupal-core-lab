// A contrib module and its patch through the full setup.mjs, end to end on tiny local repositories: stand-in `ddev`, `docker` and `npm` that
// do nothing stand in for the slow parts (the contrib step does not use them). Built first with --checkout-only, then a full run. Only
// the zz-contrib-* environments, envs/.contrib/zzcontrib.git and refs/lab/zz-contrib are created; all are removed afterwards.
// Run: node --test tests/lab/setup-contrib.test.mjs
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
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'setup-contrib-test-'));
const issueDir = path.join(labRoot, 'reports/issues/99000007'), bare = path.join(labRoot, 'envs/core.git'), shared = path.join(labRoot, 'envs/.contrib/zzcontrib.git');
const bareExisted = fs.existsSync(bare), sharedExisted = fs.existsSync(shared), sharedParentExisted = fs.existsSync(path.dirname(shared));
const env = (side) => path.join(labRoot, 'envs', `zz-contrib-${side}`);
const PATCH = 'reports/issues/99000007/contrib.patch';
const patchText = (word) => `diff --git a/js/a.js b/js/a.js\n--- a/js/a.js\n+++ b/js/a.js\n@@ -1,3 +1,3 @@\n one\n-two\n+${word}\n three\n`;
const out = (r) => `${r.stdout}\n${r.stderr}`;

function cleanup() {
  for (const side of ['before', 'after']) { if (fs.existsSync(bare)) git(bare, 'worktree', 'remove', '--force', env(side)); fs.rmSync(env(side), { recursive: true, force: true }); }
  if (fs.existsSync(bare)) { git(bare, 'worktree', 'prune'); if (bareExisted) git(bare, 'update-ref', '-d', 'refs/lab/zz-contrib'); else fs.rmSync(bare, { recursive: true, force: true }); }
  if (!sharedExisted) fs.rmSync(shared, { recursive: true, force: true });
  if (!sharedParentExisted) fs.rmSync(path.dirname(shared), { recursive: true, force: true });
  fs.rmSync(issueDir, { recursive: true, force: true });
}
after(() => { cleanup(); fs.rmSync(tmp, { recursive: true, force: true }); unlock(); });
cleanup();

// a tiny "Drupal core" and a tiny contrib project
const core = path.join(tmp, 'core-upstream'); fs.mkdirSync(path.join(core, 'core'), { recursive: true }); git(core, 'init', '-q', '-b', 'zz-contrib');
fs.writeFileSync(path.join(core, 'core/x.txt'), 'x\n'); fs.writeFileSync(path.join(core, 'core/phpunit.xml.dist'), '<phpunit/>\n'); git(core, 'add', '.'); git(core, 'commit', '-q', '-m', 'core');
const mod = path.join(tmp, 'zzcontrib-upstream'); fs.mkdirSync(path.join(mod, 'js'), { recursive: true }); git(mod, 'init', '-q', '-b', 'main');
fs.writeFileSync(path.join(mod, 'js/a.js'), 'one\ntwo\nthree\n'); fs.writeFileSync(path.join(mod, 'zzcontrib.info.yml'), 'name: Z\n'); git(mod, 'add', '.'); git(mod, 'commit', '-q', '-m', 'A');
const A = git(mod, 'rev-parse', 'HEAD').stdout.trim();
fs.mkdirSync(issueDir, { recursive: true }); fs.writeFileSync(path.join(labRoot, PATCH), patchText('PATCHED-V1'));
fs.writeFileSync(path.join(issueDir, 'variants.json'), JSON.stringify([{ slug: 'zz-contrib-latest', issue: '99000007', core: { url: core, ref: 'zz-contrib' }, contrib: [{ name: 'zzcontrib', url: mod, commit: A }], before: { env: 'zz-contrib-before' }, after: { env: 'zz-contrib-after', contribPatches: [{ module: 'zzcontrib', patch: PATCH }] } }]));
const bin = path.join(tmp, 'bin'); fs.mkdirSync(bin);
for (const tool of ['ddev', 'docker', 'npm']) fs.writeFileSync(path.join(bin, tool), '#!/bin/sh\nexit 0\n', { mode: 0o755 });
const base = ['--core-from=' + core];
const co = () => spawnSync('node', [path.join(labRoot, 'tools/compare/setup.mjs'), 'zz-contrib-latest', '--checkout-only', ...base], { cwd: labRoot, encoding: 'utf8' });
const full = (...extra) => spawnSync('node', [path.join(labRoot, 'tools/compare/setup.mjs'), 'zz-contrib-latest', ...base, ...extra], { cwd: labRoot, encoding: 'utf8', env: { ...process.env, PATH: `${bin}:${process.env.PATH}` } });
const js = (side) => fs.readFileSync(path.join(env(side), 'modules/contrib/zzcontrib/js/a.js'), 'utf8').split('\n')[1];

test('contrib through setup.mjs: extracted and patched on the After side only, verified on a re-run, BLOCKED when the patch bytes change, refreshed on request', (t) => {
  let r = co();
  if (r.status === 2 && /Another setup is already running/.test(out(r))) return t.skip('another setup.mjs is running in this checkout');
  assert.equal(r.status, 0, out(r));
  for (const side of ['before', 'after']) { fs.mkdirSync(path.join(env(side), '.ddev/commands/web'), { recursive: true }); fs.writeFileSync(path.join(env(side), '.ddev/config.yaml'), ''); fs.writeFileSync(path.join(env(side), '.ddev/commands/web/drupal'), ''); fs.mkdirSync(path.join(env(side), 'vendor'), { recursive: true }); fs.writeFileSync(path.join(env(side), 'vendor/autoload.php'), '<?php\n'); }

  r = full(); assert.equal(r.status, 0, out(r));
  assert.match(out(r), new RegExp(`extracted contrib zzcontrib @ ${A.slice(0, 12)} into zz-contrib-before`)); assert.match(out(r), /extracted contrib zzcontrib @ [0-9a-f]{12} into zz-contrib-after and applied contrib\.patch [0-9a-f]{8}/);
  assert.equal(js('before'), 'two', 'the Before module is the pinned commit, unpatched'); assert.equal(js('after'), 'PATCHED-V1');

  r = full(); assert.equal(r.status, 0, out(r)); assert.match(out(r), /contrib zzcontrib @ [0-9a-f]{12} verified by content in zz-contrib-after: contrib\.patch/); assert.doesNotMatch(out(r), /extracted contrib/);

  // before this change: "contrib patch already applied", the old change kept, exit 0
  fs.writeFileSync(path.join(labRoot, PATCH), patchText('PATCHED-V2-DIFFERENT'));
  r = full(); assert.equal(r.status, 4, out(r)); assert.match(r.stderr, /BLOCKED: zz-contrib-after does not match its contrib modules and patches[\s\S]*contrib patch reports\/issues\/99000007\/contrib\.patch changed since it was applied[\s\S]*setup\.mjs zz-contrib-latest --refresh-patches/); assert.doesNotMatch(out(r), /already applied/); assert.equal(js('after'), 'PATCHED-V1');

  r = full('--refresh-patches'); assert.equal(r.status, 0, out(r)); assert.match(out(r), /refreshed contrib zzcontrib @ [0-9a-f]{12} in zz-contrib-after \(old folder saved in /); assert.equal(js('after'), 'PATCHED-V2-DIFFERENT');
  r = full(); assert.equal(r.status, 0, out(r)); assert.match(out(r), /verified by content/);
});
