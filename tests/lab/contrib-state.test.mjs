// Tests for tools/compare/contrib-state.mjs: contrib modules and their patches tracked by content (AI-usage slice E).
// A throwaway "contrib project" (a local git repository), a lab folder holding patches, and an environment (a git repository, for its git
// directory). No DDEV, no network. Run: node --test tests/lab/contrib-state.test.mjs
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { inspectContrib, ensureContrib, contribState, sideState, treeMapOf } from '../../tools/compare/contrib-state.mjs';
import { runBlockReason } from '../../tools/compare/patch-state.mjs';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'contrib-state-test-'));
after(() => fs.rmSync(root, { recursive: true, force: true }));
let n = 0;
const git = (cwd, ...a) => spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...a], { cwd, encoding: 'utf8' });
const w = (f, text, mode) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, text); if (mode) fs.chmodSync(f, mode); };

// The contrib project: commit A, then commit B (the README and one more file change).
const up = path.join(root, 'zmod-upstream'); fs.mkdirSync(up); git(up, 'init', '-q', '-b', 'main');
w(path.join(up, 'zmod.info.yml'), 'name: Zmod\n'); w(path.join(up, 'js/a.js'), 'one\ntwo\nthree\n'); w(path.join(up, 'README.md'), 'readme A\n'); w(path.join(up, 'bin/run.sh'), '#!/bin/sh\n', 0o755);
git(up, 'add', '.'); git(up, 'commit', '-q', '-m', 'A'); const A = git(up, 'rev-parse', 'HEAD').stdout.trim();
w(path.join(up, 'README.md'), 'readme B\n'); w(path.join(up, 'js/b.js'), 'b\n'); git(up, 'add', '.'); git(up, 'commit', '-q', '-m', 'B'); const B = git(up, 'rev-parse', 'HEAD').stdout.trim();
const patchJs = (word) => `diff --git a/js/a.js b/js/a.js\n--- a/js/a.js\n+++ b/js/a.js\n@@ -1,3 +1,3 @@\n one\n-two\n+${word}\n three\n`;

function setup() {
  const k = ++n, lab = path.join(root, `lab${k}`), dir = path.join(root, `env${k}`), sharedRoot = path.join(root, `shared${k}`);
  fs.mkdirSync(dir); git(dir, 'init', '-q', '-b', 'main'); w(path.join(dir, 'core/x.txt'), 'x\n'); git(dir, 'add', '.'); git(dir, 'commit', '-q', '-m', 'base');
  const put = (name, text) => { w(path.join(lab, 'p', name), text); return `p/${name}`; };
  const mod = (commit = A) => [{ name: 'zmod', url: up, commit }];
  const m = (f) => path.join(dir, 'modules/contrib/zmod', f);
  const args = (extra = {}) => ({ dir, labRoot: lab, modules: mod(), patches: [], sharedRoot, slug: 'zz-latest', env: 'zz-env', side: 'after', ...extra });
  return { lab, dir, sharedRoot, put, mod, m, read: (f) => fs.readFileSync(m(f), 'utf8'), args, ens: (extra) => ensureContrib(args(extra)), gitd: () => git(dir, 'rev-parse', '--absolute-git-dir').stdout.trim() };
}
const patch = (file) => [{ module: 'zmod', patch: file }];

test('a fresh environment gets the module at its commit with the patches applied and recorded; the second run verifies and writes nothing', () => {
  const f = setup(), p = f.put('p1.patch', patchJs('TWO-V1'));
  let r = f.ens({ patches: patch(p) }); assert.equal(r.status, 'applied', r.lines.join('\n')); assert.match(r.lines.join('\n'), /extracted contrib zmod @ [0-9a-f]{12} into zz-env and applied p1\.patch [0-9a-f]{8}/);
  assert.equal(f.read('js/a.js'), 'one\nTWO-V1\nthree\n'); assert.equal(f.read('README.md'), 'readme A\n'); assert.equal(fs.existsSync(f.m('js/b.js')), false, 'commit A, not B');
  assert.ok(fs.statSync(f.m('bin/run.sh')).mode & 0o100, 'the executable bit survives');
  assert.equal(fs.existsSync(path.join(f.dir, '.git')), true); assert.equal(fs.existsSync(f.m('.git')), false, 'the module has no .git directory');
  assert.equal(fs.readFileSync(path.join(f.dir, '.lab-contrib-zmod'), 'utf8'), `${A}\n`); assert.equal(fs.readFileSync(path.join(f.dir, '.lab-contrib-patches-applied'), 'utf8'), `${p}\n`, 'the old markers are still written');
  const rec = path.join(f.gitd(), 'lab-patches/contrib.json'), before = fs.readFileSync(rec, 'utf8');
  r = f.ens({ patches: patch(p) }); assert.equal(r.status, 'verified'); assert.equal(fs.readFileSync(rec, 'utf8'), before, 'a verified run writes nothing');
  assert.equal(contribState({ dir: f.dir, labRoot: f.lab, modules: f.mod(), patches: patch(p) }).state, 'verified');
});

test('a commit pin changed in the variant: blocked with both commits named, nothing touched; refresh extracts the new commit and keeps the old folder as a backup', () => {
  const f = setup(), p = f.put('p1.patch', patchJs('TWO-V1')); f.ens({ patches: patch(p) });
  let r = f.ens({ modules: f.mod(B), patches: patch(p) });
  assert.equal(r.status, 'blocked'); assert.match(r.lines.join('\n'), new RegExp(`BLOCKED[\\s\\S]*module zmod is at ${A.slice(0, 12)} but the variant pins ${B.slice(0, 12)}[\\s\\S]*setup\\.mjs zz-latest --refresh-patches`));
  assert.equal(f.read('README.md'), 'readme A\n');
  r = f.ens({ modules: f.mod(B), patches: patch(p), refresh: true }); assert.equal(r.status, 'refreshed', r.lines.join('\n'));
  assert.equal(f.read('README.md'), 'readme B\n'); assert.equal(f.read('js/a.js'), 'one\nTWO-V1\nthree\n'); assert.ok(fs.existsSync(f.m('js/b.js')));
  const backup = (r.lines.join('\n').match(/saved in ([^\s)]+)/) || [])[1]; assert.ok(backup && fs.readFileSync(path.join(backup, 'README.md'), 'utf8') === 'readme A\n', r.lines.join('\n'));
  assert.equal(f.ens({ modules: f.mod(B), patches: patch(p) }).status, 'verified');
});

test('a contrib patch whose bytes changed under the SAME file name is blocked (the old marker said "already applied")', () => {
  const f = setup(), p = f.put('p1.patch', patchJs('TWO-V1')); f.ens({ patches: patch(p) });
  f.put('p1.patch', patchJs('TWO-V2-DIFFERENT'));
  let r = f.ens({ patches: patch(p) }); assert.equal(r.status, 'blocked'); assert.match(r.lines.join('\n'), /contrib patch p\/p1\.patch changed since it was applied/); assert.equal(f.read('js/a.js'), 'one\nTWO-V1\nthree\n');
  assert.equal(contribState({ dir: f.dir, labRoot: f.lab, modules: f.mod(), patches: patch(p) }).state, 'mismatch');
  r = f.ens({ patches: patch(p), refresh: true }); assert.equal(r.status, 'refreshed'); assert.equal(f.read('js/a.js'), 'one\nTWO-V2-DIFFERENT\nthree\n');
});

test('an edit in a patched file is blocked and named (the edit is kept in the backup); an edit in another file is outside the patches: reported, left alone, recorded', () => {
  const f = setup(), p = f.put('p1.patch', patchJs('TWO-V1')); f.ens({ patches: patch(p) });
  fs.appendFileSync(f.m('README.md'), 'my note\n');
  let r = f.ens({ patches: patch(p) }); assert.equal(r.status, 'verified'); assert.match(r.lines.join('\n'), /WARNING: files in modules\/contrib\/zmod changed outside the patches in zz-env: README\.md\. Left as they are; a run records them\./); assert.match(f.read('README.md'), /my note/);
  const q = contribState({ dir: f.dir, labRoot: f.lab, modules: f.mod(), patches: patch(p) }); assert.equal(q.state, 'verified'); assert.deepEqual(q.outside, ['modules/contrib/zmod/README.md']);
  fs.appendFileSync(f.m('js/a.js'), 'edited inside the patched file\n');
  r = f.ens({ patches: patch(p) }); assert.equal(r.status, 'blocked'); assert.deepEqual(r.info.mods.zmod.differing, ['modules/contrib/zmod/js/a.js']);
  r = f.ens({ patches: patch(p), refresh: true }); assert.equal(r.status, 'refreshed'); assert.equal(f.read('js/a.js'), 'one\nTWO-V1\nthree\n'); assert.equal(f.read('README.md'), 'readme A\n', 'a refresh restores the whole module');
  const backup = (r.lines.join('\n').match(/saved in ([^\s)]+)/) || [])[1]; assert.match(fs.readFileSync(path.join(backup, 'js/a.js'), 'utf8'), /edited inside the patched file/); assert.match(fs.readFileSync(path.join(backup, 'README.md'), 'utf8'), /my note/);
});

test('the Before side: an edit in the module is a dirty baseline (setup warns, a run refuses); a deleted file is an edit too', () => {
  const f = setup(); f.ens({ side: 'before', env: 'baseline-z' });
  fs.appendFileSync(f.m('js/a.js'), '// dd();\n'); fs.rmSync(f.m('README.md'));
  const r = f.ens({ side: 'before', env: 'baseline-z' }); assert.equal(r.status, 'verified'); assert.match(r.lines.join('\n'), /WARNING: baseline-z is a baseline and has files in modules\/contrib\/zmod its variant does not declare: README\.md, js\/a\.js\. Left as they are; setup carries on, but a run refuses/);
  const st = sideState(f.dir, f.lab, [], { modules: f.mod(), patches: [] }); assert.deepEqual(st.outside.sort(), ['modules/contrib/zmod/README.md', 'modules/contrib/zmod/js/a.js']);
  assert.match(runBlockReason({ before: st, after: { state: 'none', outside: [] } }, 'zz-latest', { before: 'baseline-z' }), /^BLOCKED: the Before environment \(baseline-z\) has tracked changes its variant does not declare: modules\/contrib\/zmod\/README\.md/);
});

test('an environment built before this change (marker files only) is verified by content, or blocked; never taken on trust', () => {
  const f = setup(), p = f.put('p1.patch', patchJs('TWO-V1'));
  f.ens({ patches: patch(p) }); fs.rmSync(path.join(f.gitd(), 'lab-patches'), { recursive: true });   // what the old setup.mjs left: the module folder and the two marker files
  assert.equal(inspectContrib({ dir: f.dir, labRoot: f.lab, modules: f.mod(), patches: patch(p), sharedRoot: f.sharedRoot }).state, 'unverified');
  assert.equal(sideState(f.dir, f.lab, [], { modules: f.mod(), patches: patch(p) }).state, 'unverified');
  let r = f.ens({ patches: patch(p) }); assert.equal(r.status, 'upgraded'); assert.match(r.lines.join('\n'), /verified by content[^\n]*had no content record; recorded now/); assert.equal(f.ens({ patches: patch(p) }).status, 'verified');
  // the marker's commit is not the variant's
  fs.rmSync(path.join(f.gitd(), 'lab-patches'), { recursive: true }); fs.writeFileSync(path.join(f.dir, '.lab-contrib-zmod'), `${B}\n`);
  r = f.ens({ patches: patch(p) }); assert.equal(r.status, 'blocked'); assert.match(r.lines.join('\n'), new RegExp(`the marker says ${B.slice(0, 12)} but the variant pins ${A.slice(0, 12)}`));
  // the patch file changed after the old marker was written
  fs.writeFileSync(path.join(f.dir, '.lab-contrib-zmod'), `${A}\n`); f.put('p1.patch', patchJs('TWO-V2'));
  r = f.ens({ patches: patch(p) }); assert.equal(r.status, 'blocked'); assert.match(r.lines.join('\n'), /do not equal the commit with the patches applied/); assert.equal(f.read('js/a.js'), 'one\nTWO-V1\nthree\n');
});

test('a patch that does not apply to the commit, or is for a module the variant does not list, fails before anything is changed', () => {
  const f = setup(), bad = f.put('bad.patch', 'diff --git a/js/a.js b/js/a.js\n--- a/js/a.js\n+++ b/js/a.js\n@@ -1,3 +1,3 @@\n one\n-no such line\n+x\n three\n');
  let r = f.ens({ patches: patch(bad) }); assert.equal(r.status, 'failed'); assert.match(r.lines.join('\n'), /does not apply to [0-9a-f]{12}[\s\S]*Nothing was changed/); assert.equal(fs.existsSync(f.m('zmod.info.yml')), false, 'no half-built module'); assert.equal(fs.existsSync(path.join(f.gitd(), 'lab-patches/contrib.json')), false);
  r = f.ens({ patches: [{ module: 'other', patch: bad }] }); assert.equal(r.status, 'failed'); assert.match(r.lines.join('\n'), /for module "other", which the variant does not list/);
  const good = f.put('p1.patch', patchJs('TWO-V1')); f.ens({ patches: patch(good) });
  r = f.ens({ patches: patch(bad), refresh: true }); assert.equal(r.status, 'failed'); assert.equal(f.read('js/a.js'), 'one\nTWO-V1\nthree\n', 'a refresh with a patch that does not apply leaves the module as it was');
});

test('the quick state a run uses needs no shared clone and no network; a module that disappeared is a mismatch; no modules is none', () => {
  const f = setup(), p = f.put('p1.patch', patchJs('TWO-V1')); f.ens({ patches: patch(p) });
  fs.rmSync(f.sharedRoot, { recursive: true });
  assert.equal(contribState({ dir: f.dir, labRoot: f.lab, modules: f.mod(), patches: patch(p) }).state, 'verified');
  fs.rmSync(path.join(f.dir, 'modules/contrib/zmod'), { recursive: true });
  const s = contribState({ dir: f.dir, labRoot: f.lab, modules: f.mod(), patches: patch(p) }); assert.equal(s.state, 'mismatch'); assert.match(s.reasons.join(), /the folder modules\/contrib\/zmod is missing/);
  assert.equal(contribState({ dir: f.dir, labRoot: f.lab, modules: [], patches: [] }).state, 'none');
  assert.equal(sideState(f.dir, f.lab, [], { modules: [], patches: [] }).state, 'none', 'a variant with no contrib behaves as before');
  const blocked = runBlockReason({ before: { state: 'none', outside: [] }, after: sideState(f.dir, f.lab, [], { modules: f.mod(), patches: patch(p) }) }, 'zz-latest', {});
  assert.match(blocked, /^BLOCKED: the after environment does not match its patches \(the folder modules\/contrib\/zmod is missing\)/);
});

test('treeMapOf: content, executable bit, links; a missing folder is empty', () => {
  const d = path.join(root, 'tm'); w(path.join(d, 'a/b.txt'), 'x'); w(path.join(d, 'run.sh'), '#!/bin/sh\n', 0o755); fs.symlinkSync('a/b.txt', path.join(d, 'ln'));
  const m = treeMapOf(d); assert.deepEqual(Object.keys(m).sort(), ['a/b.txt', 'ln', 'run.sh']); assert.match(m['run.sh'], /:x$/); assert.equal(m.ln, 'link:a/b.txt'); assert.deepEqual(treeMapOf(path.join(root, 'nope')), {});
});
