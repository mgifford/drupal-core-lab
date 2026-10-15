// Tests for tools/compare/capture.mjs, scripts/capture-patch.mjs and tools/compare/change-under-test.mjs (AI-usage Phase 5):
// edits made in an After environment become a patch file that reproduces them exactly, and a variant with nothing under test is refused.
// Throwaway git repositories; the CLI cases use one folder under envs/ and reports/issues/99000012, removed afterwards. No DDEV, no network.
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { labRoot } from '../../tools/compare/lib.mjs';
import { captureEdits, labFiles } from '../../tools/compare/capture.mjs';
import { changeUnderTest, noChangeProblem } from '../../tools/compare/change-under-test.mjs';
import { patchState, MARKER } from '../../tools/compare/patch-state.mjs';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'capture-test-'));
const issueDir = path.join(labRoot, 'reports/issues/99000012'), envDirA = path.join(labRoot, 'envs/zz-cap-after');
const cleanup = () => { fs.rmSync(root, { recursive: true, force: true }); fs.rmSync(issueDir, { recursive: true, force: true }); fs.rmSync(envDirA, { recursive: true, force: true }); };
after(cleanup); cleanup(); fs.mkdirSync(root);
let n = 0;
const git = (cwd, ...a) => spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...a], { cwd, encoding: 'utf8' });
const write = (f, text) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, text); };
function repo(dir = path.join(root, `env${++n}`)) {
  fs.mkdirSync(dir, { recursive: true }); git(dir, 'init', '-q', '-b', 'main');
  write(path.join(dir, '.gitignore'), 'ignored/\n'); write(path.join(dir, 'core/a.txt'), 'one\ntwo\nthree\n'); write(path.join(dir, 'core/b.txt'), 'b1\nb2\n'); fs.writeFileSync(path.join(dir, 'core/run.sh'), '#!/bin/sh\n', { mode: 0o644 });
  git(dir, 'add', '.'); git(dir, 'commit', '-q', '-m', 'base');
  return dir;
}
const modifyA = (word) => `diff --git a/core/a.txt b/core/a.txt\n--- a/core/a.txt\n+++ b/core/a.txt\n@@ -1,3 +1,3 @@\n one\n-two\n+${word}\n three\n`;
// the checkout the way git itself sees it, so "nothing was touched" can be compared
const snapshot = (dir) => ({ status: git(dir, 'status', '--porcelain', '--untracked-files=all').stdout, head: git(dir, 'rev-parse', 'HEAD').stdout, index: fs.readFileSync(path.join(git(dir, 'rev-parse', '--absolute-git-dir').stdout.trim(), 'index')).toString('hex') });
// apply a captured patch to a fresh copy of the base and return the file content, to prove it reproduces the edit
const replay = (dir, patches, patch) => { const copy = repo(); for (const p of [...patches, patch]) assert.equal(spawnSync('git', ['apply', '-'], { cwd: copy, input: p, encoding: 'utf8' }).status, 0); return copy; };

test('an edit to a tracked file becomes a patch that reproduces it, and nothing in the checkout is touched', () => {
  const dir = repo(); write(path.join(dir, 'core/a.txt'), 'one\nTWO\nthree\n');
  const before = snapshot(dir), c = captureEdits(dir, []);
  assert.equal(c.ok, true); assert.deepEqual(c.files, [{ status: 'M', path: 'core/a.txt' }]); assert.match(c.patch.toString(), /^diff --git a\/core\/a\.txt b\/core\/a\.txt/);
  assert.deepEqual(snapshot(dir), before, 'the checkout, its HEAD and its own index are as they were');
  assert.equal(fs.readFileSync(path.join(replay(dir, [], c.patch), 'core/a.txt'), 'utf8'), 'one\nTWO\nthree\n');
});

test('new, deleted, executable and binary files are all captured and replay exactly; ignored files are not', () => {
  const dir = repo(); write(path.join(dir, 'core/new.txt'), 'brand new\n'); fs.rmSync(path.join(dir, 'core/b.txt')); fs.chmodSync(path.join(dir, 'core/run.sh'), 0o755);
  fs.writeFileSync(path.join(dir, 'core/blob.bin'), Buffer.from([0, 1, 2, 255, 254, 0, 9])); write(path.join(dir, 'ignored/x.txt'), 'never\n');
  const c = captureEdits(dir, []); assert.equal(c.ok, true);
  assert.deepEqual(c.files.map((f) => `${f.status} ${f.path}`).sort(), ['A core/blob.bin', 'A core/new.txt', 'D core/b.txt', 'M core/run.sh']);
  const copy = replay(dir, [], c.patch);
  assert.equal(fs.readFileSync(path.join(copy, 'core/new.txt'), 'utf8'), 'brand new\n'); assert.equal(fs.existsSync(path.join(copy, 'core/b.txt')), false);
  assert.ok(fs.statSync(path.join(copy, 'core/run.sh')).mode & 0o100, 'the executable bit survives'); assert.deepEqual([...fs.readFileSync(path.join(copy, 'core/blob.bin'))], [0, 1, 2, 255, 254, 0, 9]);
  assert.equal(fs.existsSync(path.join(copy, 'ignored/x.txt')), false);
});

test('declared patches are not captured again: only the edit on top of them', () => {
  const dir = repo(); const declared = Buffer.from(modifyA('declared'));
  spawnSync('git', ['apply', '-'], { cwd: dir, input: declared });   // the environment holds the declared patch...
  write(path.join(dir, 'core/b.txt'), 'b1\nB2\n');                      // ...and one more edit
  const c = captureEdits(dir, [declared]); assert.equal(c.ok, true); assert.deepEqual(c.files, [{ status: 'M', path: 'core/b.txt' }]);
  assert.doesNotMatch(c.patch.toString(), /core\/a\.txt/);
  assert.equal(fs.readFileSync(path.join(replay(dir, [declared], c.patch), 'core/b.txt'), 'utf8'), 'b1\nB2\n');
});

test('an environment that holds exactly the declared patches has nothing to capture', () => {
  const dir = repo(); const declared = Buffer.from(modifyA('declared')); spawnSync('git', ['apply', '-'], { cwd: dir, input: declared });
  const c = captureEdits(dir, [declared]); assert.equal(c.ok, true); assert.equal(c.patch.length, 0); assert.deepEqual(c.files, []);
});

test("the lab's own marker file and recipe copy are left out when asked, an extra path too", () => {
  const dir = repo(); write(path.join(dir, MARKER), 'p/x.patch\n'); write(path.join(dir, 'recipes/repro_1/recipe.yml'), 'name: x\n'); write(path.join(dir, 'core/scratch.txt'), 's\n'); write(path.join(dir, 'core/real.txt'), 'r\n');
  assert.deepEqual(labFiles('repro_1'), [MARKER, '.lab-contrib-patches-applied', 'recipes/repro_1']);
  assert.deepEqual(labFiles(null, ['toolbar']).slice(2), ['.lab-contrib-toolbar', 'modules/contrib/toolbar']);
  const c = captureEdits(dir, [], { exclude: [...labFiles('repro_1'), 'core/scratch.txt'] }); assert.deepEqual(c.files, [{ status: 'A', path: 'core/real.txt' }]);
  assert.equal(captureEdits(dir, []).files.length, 4, 'without the exclusions all four show');
});

test('a contrib module the lab extracted (and its markers) is not captured as new files', () => {
  const dir = repo(); write(path.join(dir, 'modules/contrib/toolbar/toolbar.module'), '<?php\n'); write(path.join(dir, '.lab-contrib-toolbar'), 'abc\n'); write(path.join(dir, '.lab-contrib-patches-applied'), 'p\n'); write(path.join(dir, 'core/real.txt'), 'r\n');
  assert.deepEqual(captureEdits(dir, [], { exclude: labFiles(null, ['toolbar']) }).files, [{ status: 'A', path: 'core/real.txt' }]);
  assert.equal(captureEdits(dir, []).files.length, 4, 'without the exclusions all four show');
});

test('a declared patch that does not apply to the base commit is an error, not a silent empty capture', () => {
  const dir = repo(); const c = captureEdits(dir, [Buffer.from(modifyA('x').replace('-two', '-nope'))]);
  assert.equal(c.ok, false); assert.match(c.error, /declared patch 1 does not apply to the base commit/);
});

test('change-under-test: an After with no patch is named, authoring is the one declared exception', () => {
  assert.equal(changeUnderTest({ after: { patches: ['a'] } }).empty, false); assert.equal(changeUnderTest({ after: { contribPatches: [{ module: 'm', patch: 'p' }] } }).empty, false);
  assert.equal(changeUnderTest({ after: { patches: [] } }).empty, true); assert.equal(changeUnderTest({}).empty, true);
  assert.match(noChangeProblem({ slug: 'z-latest', after: { patches: [] } }), /z-latest: after lists no patch and no contrib patch, so After would equal Before.*"authoring": true.*capture-patch\.mjs z-latest/);
  assert.equal(noChangeProblem({ slug: 'z', after: { patches: [], authoring: true } }), null); assert.equal(noChangeProblem({ slug: 'z', after: { patches: ['a'] } }), null);
  assert.match(noChangeProblem({ slug: 'z', after: { authoring: 'yes' } }), /no patch/, 'only the boolean true counts');
});

// the command line, on one variant whose After environment is the throwaway repository envs/zz-cap-after
const run = (...a) => spawnSync('node', [path.join(labRoot, 'scripts/capture-patch.mjs'), ...a], { cwd: labRoot, encoding: 'utf8' });
const variantsFile = path.join(issueDir, 'variants.json'), listVariants = () => JSON.parse(fs.readFileSync(variantsFile, 'utf8'));
const writeVariants = (list) => fs.writeFileSync(variantsFile, `${JSON.stringify(list, null, 2)}\n`);

test('capture-patch.mjs: lists, then writes the patch, lists it in the variant, adds a BRANCHES row and records the environment; a second run finds nothing', () => {
  fs.mkdirSync(issueDir, { recursive: true }); repo(envDirA);
  writeVariants([{ slug: 'zz-cap-latest', issue: '99000012', core: { ref: 'main' }, before: { env: 'zz-cap-before' }, after: { env: 'zz-cap-after', authoring: true } }]);
  write(path.join(envDirA, 'core/a.txt'), 'one\nAUTHORED\nthree\n'); write(path.join(envDirA, 'core/added.txt'), 'new file\n');
  let r = run('zz-cap-latest'); assert.equal(r.status, 0, r.stderr); assert.match(r.stdout, /2 file\(s\) changed beyond the 0 declared/); assert.match(r.stdout, /M {2}core\/a\.txt/); assert.match(r.stdout, /A {2}core\/added\.txt/); assert.match(r.stdout, /Nothing written/);
  assert.equal(fs.existsSync(path.join(issueDir, 'branches')), false, 'listing writes nothing');
  r = run('zz-cap-latest', '--name', 'first'); assert.equal(r.status, 0, r.stderr + r.stdout);
  const rel = 'reports/issues/99000012/branches/99000012-first.patch'; assert.ok(fs.existsSync(path.join(labRoot, rel)));
  const v = listVariants()[0]; assert.deepEqual(v.after.patches, [rel]); assert.equal('authoring' in v.after, false, 'the authoring flag is cleared once there is a patch');
  assert.match(fs.readFileSync(path.join(issueDir, 'BRANCHES.md'), 'utf8'), /99000012-first\.patch.*authored in the lab \(no merge request\)/);
  assert.equal(fs.readFileSync(path.join(envDirA, 'core/a.txt'), 'utf8'), 'one\nAUTHORED\nthree\n'); assert.equal(fs.readFileSync(path.join(envDirA, 'core/added.txt'), 'utf8'), 'new file\n');
  const st = patchState(envDirA, labRoot, [rel]); assert.equal(st.state, 'verified', `the environment is recorded against the new patch: ${JSON.stringify(st.reasons)}`);
  r = run('zz-cap-latest'); assert.match(r.stdout, /nothing changed beyond the 1 declared patch/);
  // a second round of edits is a second patch on top of the first, and the first is not rewritten
  const first = fs.readFileSync(path.join(labRoot, rel), 'utf8'); write(path.join(envDirA, 'core/b.txt'), 'b1\nSECOND\n');
  r = run('zz-cap-latest', '--name', 'second'); assert.equal(r.status, 0, r.stderr + r.stdout); assert.equal(fs.readFileSync(path.join(labRoot, rel), 'utf8'), first);
  assert.deepEqual(listVariants()[0].after.patches, [rel, 'reports/issues/99000012/branches/99000012-second.patch']); assert.equal(patchState(envDirA, labRoot, listVariants()[0].after.patches).state, 'verified');
  r = run('zz-cap-latest', '--name', 'second'); assert.equal(r.status, 0); assert.match(r.stdout, /nothing changed beyond the 2 declared patch/);   // nothing new: no third patch, and the name is not reused
  assert.equal(fs.existsSync(path.join(issueDir, 'branches/99000012-third.patch')), false);
});

test('capture-patch.mjs: a change made only of new files is still recorded, and bad names or unknown variants are refused', () => {
  fs.rmSync(issueDir, { recursive: true, force: true }); fs.rmSync(envDirA, { recursive: true, force: true }); fs.mkdirSync(issueDir, { recursive: true }); repo(envDirA);
  writeVariants([{ slug: 'zz-cap-latest', issue: '99000012', core: { ref: 'main' }, before: { env: 'zz-cap-before' }, after: { env: 'zz-cap-after', authoring: true } }]);
  write(path.join(envDirA, 'core/only-new.txt'), 'only a new file\n');
  let r = run('zz-cap-latest', '--name', 'Bad Name'); assert.equal(r.status, 2); assert.match(r.stderr, /lower-case/);
  r = run('zz-nope', '--name', 'x'); assert.notEqual(r.status, 0); assert.match(r.stderr, /No variant zz-nope/);
  r = run('zz-cap-latest', '--name', 'newonly'); assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.equal(fs.readFileSync(path.join(envDirA, 'core/only-new.txt'), 'utf8'), 'only a new file\n'); assert.equal(patchState(envDirA, labRoot, listVariants()[0].after.patches).state, 'verified');
});

test('setup.mjs stops with BLOCKED (exit 4) for a variant whose After has nothing to test, before it fetches or builds anything', () => {
  fs.rmSync(issueDir, { recursive: true, force: true }); fs.mkdirSync(issueDir, { recursive: true });
  writeVariants([{ slug: 'zz-cap-empty', issue: '99000012', core: { ref: 'main' }, before: { env: 'zz-cap-before' }, after: { env: 'zz-cap-after', patches: [] } }]);
  const r = spawnSync('node', [path.join(labRoot, 'tools/compare/setup.mjs'), 'zz-cap-empty', '--dry-run'], { cwd: labRoot, encoding: 'utf8' });
  assert.equal(r.status, 4, r.stdout + r.stderr); assert.match(r.stderr, /BLOCKED: zz-cap-empty: after lists no patch/);
  writeVariants([{ slug: 'zz-cap-empty', issue: '99000012', core: { ref: 'main' }, before: { env: 'zz-cap-before' }, after: { env: 'zz-cap-after', patches: [], authoring: true } }]);
  const ok = spawnSync('node', [path.join(labRoot, 'tools/compare/setup.mjs'), 'zz-cap-empty', '--dry-run'], { cwd: labRoot, encoding: 'utf8' }); assert.doesNotMatch(ok.stderr, /BLOCKED/);
});
