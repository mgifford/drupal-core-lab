// Tests for tools/compare/patch-state.mjs: patches tracked by content instead of by file name (AI-usage Phase 1, slice A).
// Throwaway git repositories in a temp folder; no DDEV, no network. Run: node --test tests/lab/patch-state.test.mjs
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { patchFileList, treeMap, expectedMap, inspect, ensurePatches, patchState, runBlockReason, readState, MARKER, sha256 } from '../../tools/compare/patch-state.mjs';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'patch-state-test-'));
after(() => fs.rmSync(root, { recursive: true, force: true }));
let n = 0;
const git = (cwd, ...a) => spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...a], { cwd, encoding: 'utf8' });
const write = (f, text, mode) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, text); if (mode) fs.chmodSync(f, mode); };

// A "checkout" with a committed base, and a "lab root" holding patch files under p/.
function fixture() {
  const dir = path.join(root, `env${++n}`), lab = path.join(root, `lab${n}`);
  fs.mkdirSync(dir); git(dir, 'init', '-q', '-b', 'main');
  write(path.join(dir, 'core/a.txt'), 'one\ntwo\nthree\n'); write(path.join(dir, 'core/b.txt'), 'b1\nb2\n'); write(path.join(dir, 'core/other.txt'), 'untouched\n');
  git(dir, 'add', '.'); git(dir, 'commit', '-q', '-m', 'base');
  const put = (name, text) => { write(path.join(lab, 'p', name), text); return `p/${name}`; };
  return { dir, lab, put, file: (f) => path.join(dir, f), read: (f) => fs.readFileSync(path.join(dir, f), 'utf8') };
}
const modify = (word) => `diff --git a/core/a.txt b/core/a.txt\n--- a/core/a.txt\n+++ b/core/a.txt\n@@ -1,3 +1,3 @@\n one\n-two\n+${word}\n three\n`;
const addFile = (name, mode = '100644', body = 'hello') => `diff --git a/core/${name} b/core/${name}\nnew file mode ${mode}\n--- /dev/null\n+++ b/core/${name}\n@@ -0,0 +1 @@\n+${body}\n`;
const deleteB = 'diff --git a/core/b.txt b/core/b.txt\ndeleted file mode 100644\n--- a/core/b.txt\n+++ /dev/null\n@@ -1,2 +0,0 @@\n-b1\n-b2\n';
const ens = (f, patchPaths, extra = {}) => ensurePatches({ dir: f.dir, labRoot: f.lab, patchPaths, slug: 'zz', env: 'zz-env', side: 'after', ...extra });
const stateBytes = (f) => fs.readFileSync(path.join(git(f.dir, 'rev-parse', '--absolute-git-dir').stdout.trim(), 'lab-patches/state.json'), 'utf8');

test('the files a patch touches: modify, add, delete, both names of a rename', () => {
  assert.deepEqual(patchFileList(modify('X')), ['core/a.txt']);
  assert.deepEqual(patchFileList(addFile('new.txt')), ['core/new.txt']);
  assert.deepEqual(patchFileList(deleteB), ['core/b.txt']);
  assert.deepEqual(patchFileList('diff --git a/core/b.txt b/core/c.txt\nsimilarity index 100%\nrename from core/b.txt\nrename to core/c.txt\n'), ['core/b.txt', 'core/c.txt']);
  assert.deepEqual(patchFileList('--- a/x.txt\t2026\n+++ b/x.txt\t2026\n'), ['x.txt']);   // a plain `diff -u` patch with no diff --git line
});

test('a fresh checkout gets its patches applied and recorded; a second run verifies them and applies nothing', () => {
  const f = fixture(), p = [f.put('1.patch', modify('TWO-V1')), f.put('2.patch', addFile('new.sh', '100755'))];
  let r = ens(f, p); assert.equal(r.status, 'applied', r.lines.join('\n'));
  assert.equal(f.read('core/a.txt'), 'one\nTWO-V1\nthree\n'); assert.ok(fs.existsSync(f.file('core/new.sh')));
  const rec = readState(f.dir); assert.equal(rec.patches.length, 2); assert.equal(rec.patches[0].sha256, sha256(fs.readFileSync(path.join(f.lab, p[0]))));
  assert.equal(fs.readFileSync(path.join(f.dir, MARKER), 'utf8'), `${p[0]}\n${p[1]}\n`, 'the old name list is still written');
  const before = stateBytes(f); r = ens(f, p); assert.equal(r.status, 'verified'); assert.equal(stateBytes(f), before, 'a verified run writes nothing');
  assert.equal(inspect(f.dir, f.lab, p).state, 'verified');
});

test('patch bytes changed under the SAME file name: blocked, nothing touched (the defect this replaces)', () => {
  const f = fixture(), p = [f.put('x.patch', modify('TWO-V1'))]; assert.equal(ens(f, p).status, 'applied');
  const state = stateBytes(f), tree = f.read('core/a.txt');
  f.put('x.patch', modify('TWO-V2-DIFFERENT'));
  const r = ens(f, p);
  assert.equal(r.status, 'blocked'); assert.match(r.lines.join('\n'), /BLOCKED[\s\S]*changed since it was applied[\s\S]*--refresh-patches/);
  assert.equal(f.read('core/a.txt'), tree); assert.equal(stateBytes(f), state);
  assert.equal(patchState(f.dir, f.lab, p).state, 'mismatch');
});

test('a patched file edited afterwards is blocked and named; an edit to another file is reported and left alone', () => {
  const f = fixture(), p = [f.put('x.patch', modify('TWO-V1'))]; ens(f, p);
  fs.appendFileSync(f.file('core/other.txt'), 'my own edit\n');
  let r = ens(f, p); assert.equal(r.status, 'verified'); assert.match(r.lines.join('\n'), /WARNING: tracked files changed outside the patches[^\n]*core\/other\.txt[^\n]*Left as they are/);
  assert.equal(f.read('core/other.txt'), 'untouched\nmy own edit\n');
  fs.appendFileSync(f.file('core/a.txt'), 'edit inside the patched file\n');
  r = ens(f, p); assert.equal(r.status, 'blocked'); assert.deepEqual(r.info.differing, ['core/a.txt']); assert.match(r.lines.join('\n'), /files that differ[^\n]*core\/a\.txt/);
  assert.equal(f.read('core/other.txt'), 'untouched\nmy own edit\n');
});

test('a name list with no content record is verified by content, or blocked; never taken on trust', () => {
  const f = fixture(), p = [f.put('x.patch', modify('TWO-V1'))];
  git(f.dir, 'apply', path.join(f.lab, p[0])); fs.writeFileSync(path.join(f.dir, MARKER), `${p[0]}\n`);   // an environment from the old setup.mjs
  assert.equal(inspect(f.dir, f.lab, p).state, 'unverified'); assert.equal(patchState(f.dir, f.lab, p).state, 'unverified');
  let r = ens(f, p); assert.equal(r.status, 'upgraded'); assert.equal(readState(f.dir).patches[0].path, p[0]); assert.equal(ens(f, p).status, 'verified');
  // the same, but the tree does not hold what the patch produces
  const g = fixture(), q = [g.put('x.patch', modify('TWO-V1'))];
  git(g.dir, 'apply', path.join(g.lab, q[0])); fs.writeFileSync(path.join(g.dir, MARKER), `${q[0]}\n`);
  g.put('x.patch', modify('TWO-V2'));   // the file changed after the old marker was written: the old logic said "already applied"
  r = ens(g, q); assert.equal(r.status, 'blocked'); assert.deepEqual(r.info.differing, ['core/a.txt']); assert.equal(readState(g.dir), null, 'a blocked run records nothing');
});

test('a modified tree with no marker at all is not "assumed" patched', () => {
  const f = fixture(), p = [f.put('x.patch', modify('TWO-V1'))];
  fs.appendFileSync(f.file('core/other.txt'), 'unrelated\n');   // modified, no marker, patch not applied
  let r = ens(f, p); assert.equal(r.status, 'blocked'); assert.match(r.lines.join('\n'), /no record of any patch/); assert.equal(f.read('core/a.txt'), 'one\ntwo\nthree\n');
  const g = fixture(), q = [g.put('x.patch', modify('TWO-V1'))]; git(g.dir, 'apply', path.join(g.lab, q[0]));   // modified, no marker, patch applied: provable
  assert.equal(ens(g, q).status, 'upgraded');
});

test('--refresh-patches restores the touched files, saves local edits as a diff, applies the current patches, keeps other edits', () => {
  const f = fixture(), p = [f.put('x.patch', modify('TWO-V1')), f.put('y.patch', addFile('only-in-v1.txt'))]; ens(f, p);
  fs.appendFileSync(f.file('core/a.txt'), 'local edit in a patched file\n'); fs.appendFileSync(f.file('core/other.txt'), 'edit elsewhere\n');
  f.put('x.patch', modify('TWO-V2'));
  assert.equal(ens(f, p).status, 'blocked');
  f.put('y.patch', addFile('only-in-v2.txt'));   // the new version of the second patch adds a different file
  const r = ens(f, p, { refresh: true }); assert.equal(r.status, 'refreshed', r.lines.join('\n'));
  assert.equal(f.read('core/a.txt'), 'one\nTWO-V2\nthree\n');
  assert.equal(fs.existsSync(f.file('core/only-in-v1.txt')), false, 'a file only the old patch added is removed'); assert.ok(fs.existsSync(f.file('core/only-in-v2.txt')));
  assert.equal(f.read('core/other.txt'), 'untouched\nedit elsewhere\n');
  const backup = (r.lines.join('\n').match(/saved in (\S+\.diff)/) || [])[1]; assert.ok(backup && fs.existsSync(backup), r.lines.join('\n'));
  assert.match(fs.readFileSync(backup, 'utf8'), /local edit in a patched file/);
  assert.equal(ens(f, p).status, 'verified');
});

test('a patch that does not apply fails before anything is changed, with or without refresh', () => {
  const f = fixture(), p = [f.put('x.patch', modify('TWO-V1'))]; ens(f, p);
  const before = f.read('core/a.txt');
  f.put('x.patch', 'diff --git a/core/a.txt b/core/a.txt\n--- a/core/a.txt\n+++ b/core/a.txt\n@@ -1,3 +1,3 @@\n one\n-no such line\n+x\n three\n');
  const r = ens(f, p, { refresh: true }); assert.equal(r.status, 'failed'); assert.match(r.lines.join('\n'), /does not apply to the base commit[\s\S]*Nothing was changed/);
  assert.equal(f.read('core/a.txt'), before);
  const g = fixture(); const bad = [g.put('x.patch', 'diff --git a/core/a.txt b/core/a.txt\n--- a/core/a.txt\n+++ b/core/a.txt\n@@ -1,3 +1,3 @@\n one\n-no such line\n+x\n three\n')];
  const r2 = ens(g, bad); assert.equal(r2.status, 'failed'); assert.equal(g.read('core/a.txt'), 'one\ntwo\nthree\n'); assert.equal(readState(g.dir), null);
});

test('additions, deletions and the executable bit are part of the identity; the throwaway index predicts the real result', () => {
  const f = fixture(), p = [f.put('1.patch', modify('TWO-V1')), f.put('2.patch', addFile('run.sh', '100755')), f.put('3.patch', deleteB)];
  const predicted = expectedMap(f.dir, p.map((x) => fs.readFileSync(path.join(f.lab, x)))); assert.ok(predicted.ok);
  assert.equal(ens(f, p).status, 'applied');
  assert.deepEqual(treeMap(f.dir, Object.keys(predicted.map)), predicted.map); assert.equal(fs.existsSync(f.file('core/b.txt')), false);
  fs.chmodSync(f.file('core/run.sh'), 0o644);
  const r = ens(f, p); assert.equal(r.status, 'blocked'); assert.deepEqual(r.info.differing, ['core/run.sh']);
  fs.chmodSync(f.file('core/run.sh'), 0o755); fs.writeFileSync(f.file('core/b.txt'), 'back again\n');
  assert.equal(ens(f, p).status, 'blocked');
});

test('the checkout itself is not touched by checking: its index and tree are the same afterwards', () => {
  const f = fixture(), p = [f.put('x.patch', modify('TWO-V1'))]; git(f.dir, 'apply', path.join(f.lab, p[0]));
  const snap = () => `${git(f.dir, 'status', '--porcelain').stdout}${fs.readFileSync(path.join(f.dir, '.git/index')).length}${sha256(fs.readFileSync(path.join(f.dir, '.git/index')))}`;
  const a = snap(); inspect(f.dir, f.lab, p, { deep: true }); assert.equal(snap(), a);
});

test('what a run records and when it must not start', () => {
  const f = fixture(), p = [f.put('x.patch', modify('TWO-V1'))];
  assert.equal(patchState(f.dir, f.lab, p).state, 'fresh'); assert.match(runBlockReason({ before: patchState(f.dir, f.lab, []), after: patchState(f.dir, f.lab, p) }, 'zz-latest'), /after environment does not match its patches \(the patches are not applied\)[\s\S]*setup\.mjs zz-latest --refresh-patches/);
  ens(f, p); const ok = patchState(f.dir, f.lab, p); assert.equal(ok.state, 'verified'); assert.equal(ok.current[0].sha256, ok.recorded.patches[0].sha256); assert.equal(runBlockReason({ before: { state: 'none' }, after: ok }, 'zz'), '');
  f.put('x.patch', modify('TWO-V2')); const stale = patchState(f.dir, f.lab, p); assert.equal(stale.state, 'mismatch'); assert.match(runBlockReason({ after: stale }, 'zz'), /^BLOCKED: the after environment/);
  assert.equal(runBlockReason({ after: { state: 'unverified' } }, 'zz'), '', 'a name-only record may run (it is reported in the results)');
  assert.equal(patchState(path.join(root, 'no-such-checkout'), f.lab, p).state, 'unknown');
});
