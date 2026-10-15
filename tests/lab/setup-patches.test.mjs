// tools/compare/setup.mjs and its patch step, end to end, on a tiny local "Drupal" (no DDEV, no network): the acceptance cases of
// AI-usage Phase 1, slice A. setup.mjs --checkout-only builds the worktrees and applies the patches; --core-from takes the core from a
// local repository and leaves the shared envs/core.git's remote alone. Only refs/lab/zz-patchid and the two zz-patchid-* environments are
// created, and all are removed afterwards. Run: node --test tests/lab/setup-patches.test.mjs
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
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'setup-patches-test-'));
const issueDir = path.join(labRoot, 'reports/issues/99000004'), bare = path.join(labRoot, 'envs/core.git');
const bareExisted = fs.existsSync(bare);
const env = (side) => path.join(labRoot, 'envs', `zz-patchid-${side}`);
const SLUG = 'zz-patchid-latest', PATCH = 'reports/issues/99000004/p.patch';
const patchText = (word) => `diff --git a/core/x.txt b/core/x.txt\n--- a/core/x.txt\n+++ b/core/x.txt\n@@ -1,3 +1,3 @@\n one\n-two\n+${word}\n three\n`;
const gitDirOf = (d) => git(d, 'rev-parse', '--absolute-git-dir').stdout.trim();

function cleanup() {
  for (const side of ['before', 'after']) {
    if (fs.existsSync(bare)) git(bare, 'worktree', 'remove', '--force', env(side));
    fs.rmSync(env(side), { recursive: true, force: true });
  }
  if (fs.existsSync(bare)) { git(bare, 'worktree', 'prune'); if (bareExisted) git(bare, 'update-ref', '-d', 'refs/lab/zz-patchid'); else fs.rmSync(bare, { recursive: true, force: true }); }
  fs.rmSync(issueDir, { recursive: true, force: true });
}
after(() => { cleanup(); fs.rmSync(tmp, { recursive: true, force: true }); unlock(); });
cleanup();

const up = path.join(tmp, 'upstream'); fs.mkdirSync(path.join(up, 'core'), { recursive: true });
git(up, 'init', '-q', '-b', 'zz-patchid'); fs.writeFileSync(path.join(up, 'core/x.txt'), 'one\ntwo\nthree\n'); fs.writeFileSync(path.join(up, 'core/other.txt'), 'untouched\n'); git(up, 'add', '.'); git(up, 'commit', '-q', '-m', 'base');
fs.mkdirSync(issueDir, { recursive: true });
fs.writeFileSync(path.join(issueDir, 'variants.json'), JSON.stringify([{ slug: SLUG, issue: '99000004', core: { url: up, ref: 'zz-patchid' }, before: { env: 'zz-patchid-before' }, after: { env: 'zz-patchid-after', patches: [PATCH] } }]));
const setPatch = (word) => fs.writeFileSync(path.join(labRoot, PATCH), patchText(word));
const setup = (...extra) => spawnSync('node', [path.join(labRoot, 'tools/compare/setup.mjs'), SLUG, '--checkout-only', `--core-from=${up}`, ...extra], { cwd: labRoot, encoding: 'utf8' });
const x = () => fs.readFileSync(path.join(env('after'), 'core/x.txt'), 'utf8').split('\n')[1];
const out = (r) => `${r.stdout}\n${r.stderr}`;

test('slice A through setup.mjs: build, reuse, block on changed bytes, refresh, and never trust a missing or name-only record', (t) => {
  setPatch('TWO-V1');
  let r = setup();
  if (r.status === 2 && /Another setup is already running/.test(out(r))) return t.skip('another setup.mjs is running in this checkout');
  assert.equal(r.status, 0, out(r));
  assert.match(out(r), /applied and recorded 1 patch\(es\) in zz-patchid-after/); assert.equal(x(), 'TWO-V1');

  // acceptance 3: no change, reused, nothing applied
  r = setup(); assert.equal(r.status, 0, out(r)); assert.match(out(r), /patches verified by content in zz-patchid-after/); assert.doesNotMatch(out(r), /git apply|applied and recorded/);

  // acceptance 4: an unrelated edit in the patched tree is reported, not reset
  fs.appendFileSync(path.join(env('after'), 'core/other.txt'), 'my edit\n');
  r = setup(); assert.equal(r.status, 0, out(r)); assert.match(out(r), /WARNING: tracked files changed outside the patches[^\n]*core\/other\.txt/); assert.equal(fs.readFileSync(path.join(env('after'), 'core/other.txt'), 'utf8'), 'untouched\nmy edit\n');

  // acceptance 1: same file name, different bytes: BLOCKED (exit 4), tree untouched. Before this change: "patch already applied", old change kept.
  setPatch('TWO-V2-DIFFERENT');
  r = setup(); assert.equal(r.status, 4, out(r)); assert.match(r.stderr, /BLOCKED: zz-patchid-after does not match its patches[\s\S]*changed since it was applied[\s\S]*setup\.mjs zz-patchid-latest --refresh-patches/); assert.equal(x(), 'TWO-V1');
  assert.doesNotMatch(out(r), /already applied|assuming/);
  const gd = gitDirOf(env('after'));

  // the explicit refresh: files restored, current patch applied, the unrelated edit kept, recorded
  r = setup('--refresh-patches'); assert.equal(r.status, 0, out(r)); assert.match(out(r), /refreshed zz-patchid-after/); assert.equal(x(), 'TWO-V2-DIFFERENT');
  assert.equal(fs.readFileSync(path.join(env('after'), 'core/other.txt'), 'utf8'), 'untouched\nmy edit\n');
  r = setup(); assert.equal(r.status, 0, out(r)); assert.match(out(r), /verified by content/);

  // acceptance 5: an old environment with only a name list: verified by content when the files prove it, and said so
  fs.rmSync(path.join(gd, 'lab-patches'), { recursive: true, force: true });
  r = setup(); assert.equal(r.status, 0, out(r)); assert.match(out(r), /verified by content[^\n]*had no content record; recorded now/);
  // ... and blocked when they do not (the patch file changed after that old marker was written)
  fs.rmSync(path.join(gd, 'lab-patches'), { recursive: true, force: true }); setPatch('TWO-V3');
  r = setup(); assert.equal(r.status, 4, out(r)); assert.match(r.stderr, /only a list of patch names[\s\S]*do not equal what the patches produce/); assert.equal(x(), 'TWO-V2-DIFFERENT');

  // acceptance 2: no marker at all, a modified tree, the patch not applied: blocked, not "assuming patches are applied"
  git(env('after'), 'checkout', '--', 'core/x.txt'); fs.rmSync(path.join(env('after'), '.lab-patches-applied'), { force: true }); fs.rmSync(path.join(gd, 'lab-patches'), { recursive: true, force: true });
  r = setup(); assert.equal(r.status, 4, out(r)); assert.match(r.stderr, /no record of any patch/); assert.doesNotMatch(out(r), /assuming/); assert.equal(x(), 'two');
  // refresh from that state applies the current patch
  r = setup('--refresh-patches'); assert.equal(r.status, 0, out(r)); assert.equal(x(), 'TWO-V3');
});

test('--dry-run still only prints the plan', (t) => {
  setPatch('TWO-V4');
  const r = setup('--dry-run');
  if (r.status === 2 && /Another setup is already running/.test(out(r))) return t.skip('another setup.mjs is running in this checkout');
  assert.equal(r.status, 0, out(r)); assert.match(out(r), /\$ git apply/); assert.doesNotMatch(out(r), /BLOCKED/); assert.equal(x(), 'TWO-V3');
});
