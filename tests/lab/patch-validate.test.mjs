// Tests for tools/compare/patch-validate.mjs and scripts/patch-validate.mjs: patch syntax told apart from source whitespace, the declared
// start revision, applying in a temporary index (the repository is never written), expected files, and full patch against interdiff
// (AGENTS.md rule 17). Temporary local repositories only; git runs with an empty configuration and safe.bareRepository=explicit, as in
// the hermetic selftest. Run: node --test tests/lab/patch-validate.test.mjs
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { openRepo, parsePatch, validatePatch, equivalence } from '../../tools/compare/patch-validate.mjs';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'patch-validate-test-'));
after(() => fs.rmSync(root, { recursive: true, force: true }));
fs.writeFileSync(path.join(root, 'gitconfig'), '');
Object.assign(process.env, { GIT_CONFIG_GLOBAL: path.join(root, 'gitconfig'), GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_PARAMETERS: "'safe.bareRepository=explicit'" });
const labRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
let n = 0;
const git = (args, o = {}) => spawnSync('git', ['-c', 'user.name=Lab', '-c', 'user.email=lab@example.test', ...args], { encoding: 'utf8', cwd: o.cwd || root, input: o.input });
const ok = (r) => { assert.equal(r.status, 0, `${r.stderr}${r.stdout}`); return r.stdout.trim(); };
const objectCount = (dir) => { let k = 0; (function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (e.isDirectory()) walk(path.join(d, e.name)); else k++; } })(path.join(dir, 'objects')); return k; };

// A bare "core" repository with two commits: base (a.txt has an empty line) and next (core changed b.txt). Returns shas and the repo.
function core() {
  const work = path.join(root, `work${++n}`), bare = path.join(root, `core${n}.git`);
  fs.mkdirSync(path.join(work, 'core'), { recursive: true }); ok(git(['init', '-q', '-b', 'main'], { cwd: work }));
  fs.writeFileSync(path.join(work, 'core/a.txt'), 'one\n\ntwo\nthree\n'); fs.writeFileSync(path.join(work, 'core/b.txt'), 'b1\nb2\nb3\n');
  ok(git(['add', '.'], { cwd: work })); ok(git(['commit', '-qm', 'base'], { cwd: work }));
  const base = ok(git(['rev-parse', 'HEAD'], { cwd: work }));
  fs.writeFileSync(path.join(work, 'core/b.txt'), 'b0\nb1\nb2\nb3\n'); ok(git(['commit', '-qam', 'core changes b'], { cwd: work }));
  const next = ok(git(['rev-parse', 'HEAD'], { cwd: work }));
  ok(git(['clone', '-q', '--bare', work, bare]));
  return { work, bare, base, next, repo: openRepo(bare) };
}
// A patch made by git from a real edit of the base, so its index lines and counts are right.
function diffOf(c, edit) {
  const dir = path.join(root, `edit${++n}`); ok(git(['clone', '-q', c.work, dir])); ok(git(['checkout', '-q', c.base], { cwd: dir }));
  edit(dir); ok(git(['add', '-A'], { cwd: dir }));
  return git(['diff', '--cached', '--full-index', '--no-color', c.base], { cwd: dir }).stdout;
}
const insertAfterBlank = (dir) => fs.writeFileSync(path.join(dir, 'core/a.txt'), 'one\n\nINSERTED\ntwo\nthree\n');
const status = (res, name) => (res.checks.find((c) => c.name === name) || {}).status;

test('a valid patch whose context includes an empty line (a lone space) is NOT rejected; git diff --check on the .patch file would flag it', () => {
  const c = core(), patch = diffOf(c, insertAfterBlank);
  assert.match(patch, /\n \n\+INSERTED\n/, 'the fixture really has an empty context line, written as a lone space');
  const res = validatePatch({ repo: c.repo, patch, base: c.base, expect: ['core/a.txt'] });
  assert.equal(res.ok, true, JSON.stringify(res.checks, null, 1));
  for (const name of ['parse', 'declared start revision', 'applies', 'whitespace of the resulting source', 'expected files']) assert.equal(status(res, name), 'ok', name);
  assert.match(res.checks[0].detail, /1 context line\(s\) are a lone space: an empty source line in diff syntax, not trailing whitespace/);
  // the control: the same file committed to a lab repository, checked the way that misled people
  const lab = path.join(root, `lab${++n}`); fs.mkdirSync(lab); ok(git(['init', '-q'], { cwd: lab })); fs.writeFileSync(path.join(lab, 'x.patch'), patch); ok(git(['add', '-N', 'x.patch'], { cwd: lab }));
  const check = git(['diff', '--check'], { cwd: lab });
  assert.notEqual(check.status, 0); assert.match(check.stdout, /x\.patch:\d+: trailing whitespace/);
});

test('an empty context line that lost its leading space is accepted, and counted', () => {
  const c = core(), patch = diffOf(c, insertAfterBlank).replace('\n \n+INSERTED', '\n\n+INSERTED');
  const res = validatePatch({ repo: c.repo, patch, base: c.base });
  assert.equal(res.ok, true, JSON.stringify(res.checks, null, 1));
  assert.equal(res.parse.strippedContext, 1); assert.match(res.checks[0].detail, /lost their leading space/);
});

test('whitespace is judged in the resulting source: an added line with trailing spaces fails, naming the source file and line', () => {
  const c = core(), patch = diffOf(c, (d) => fs.writeFileSync(path.join(d, 'core/a.txt'), 'one\n\nINSERTED   \ntwo\nthree\n'));
  const res = validatePatch({ repo: c.repo, patch, base: c.base });
  assert.equal(status(res, 'whitespace of the resulting source'), 'FAIL');
  assert.deepEqual(res.whitespace.map((w) => [w.file, w.line]), [['core/a.txt', 3]]);
  assert.equal(status(res, 'applies'), 'ok', 'whitespace is reported, not a reason to refuse the patch');
});

test('broken hunk counts are a parse failure with the patch line; the patch is not applied', () => {
  const c = core(), patch = diffOf(c, insertAfterBlank).replace(/@@ -1,4 \+1,5 @@/, '@@ -1,4 +1,9 @@');
  const p = parsePatch(patch);
  assert.match(p.errors.join(' '), /ends inside the hunk|ends early/);
  const res = validatePatch({ repo: c.repo, patch, base: c.base });
  assert.equal(status(res, 'parse'), 'FAIL'); assert.equal(status(res, 'applies'), 'skip');
  assert.match(parsePatch('just prose\n').errors[0], /not a unified diff/);
});

test('declared start revision: unknown commit, and a patch made against another version of a file', () => {
  const c = core(), patch = diffOf(c, (d) => fs.writeFileSync(path.join(d, 'core/b.txt'), 'b1\nCHANGED\nb3\n'));
  assert.match(validatePatch({ repo: c.repo, patch, base: 'f'.repeat(40) }).checks[1].detail, /is not a commit/);
  const res = validatePatch({ repo: c.repo, patch, base: c.next });   // core changed b.txt in next, so the pre-image is not next's
  assert.equal(status(res, 'declared start revision'), 'FAIL');
  assert.match(res.checks[1].detail, /made against other versions of: core\/b\.txt/);
});

test('applies only in reverse: said so; expected files missing and extra are named', () => {
  const c = core(), patch = diffOf(c, insertAfterBlank);
  const dir = path.join(root, `rev${++n}`); ok(git(['clone', '-q', c.work, dir])); insertAfterBlank(dir); ok(git(['commit', '-qam', 'already'], { cwd: dir }));
  const bare = path.join(root, `rev${n}.git`); ok(git(['clone', '-q', '--bare', dir, bare])); const head = ok(git([`--git-dir=${bare}`, 'rev-parse', 'HEAD']));
  const res = validatePatch({ repo: openRepo(bare), patch, base: head, expect: ['core/a.txt', 'core/tests/fixture.txt'] });
  assert.equal(status(res, 'applies'), 'FAIL'); assert.match(res.checks.find((x) => x.name === 'applies').detail, /applies in reverse/);
  assert.match(res.checks.find((x) => x.name === 'expected files').detail, /missing: core\/tests\/fixture\.txt/);
  assert.match(validatePatch({ repo: c.repo, patch, base: c.base, expect: [] }).checks.at(-1).detail, /not expected: core\/a\.txt/);
});

test('validation writes nothing to the repository: no objects, refs or index', () => {
  const c = core(), patch = diffOf(c, insertAfterBlank), before = objectCount(c.bare), refs = ok(git([`--git-dir=${c.bare}`, 'for-each-ref']));
  assert.equal(validatePatch({ repo: c.repo, patch, base: c.base }).ok, true);
  assert.equal(objectCount(c.bare), before); assert.equal(ok(git([`--git-dir=${c.bare}`, 'for-each-ref'])), refs);
  assert.equal(fs.existsSync(path.join(c.bare, 'index')), false);
});

test('rule 17: full patch and interdiff equivalent, a difference named, and the same change on a core base that moved', () => {
  const c = core();
  // the prior proposal (an MR tip) on base: changes a.txt one way; the revision changes it again
  const mr = path.join(root, `mr${++n}`); ok(git(['clone', '-q', c.work, mr])); ok(git(['checkout', '-q', '-b', 'mr', c.base], { cwd: mr }));
  fs.writeFileSync(path.join(mr, 'core/a.txt'), 'one\n\nFIRST\ntwo\nthree\n'); ok(git(['commit', '-qam', 'mr'], { cwd: mr }));
  ok(git(['push', '-q', c.bare, 'mr:refs/heads/mr'], { cwd: mr })); const tip = ok(git(['rev-parse', 'HEAD'], { cwd: mr }));
  fs.writeFileSync(path.join(mr, 'core/a.txt'), 'one\n\nSECOND\ntwo\nthree\n'); fs.writeFileSync(path.join(mr, 'core/b.txt'), 'b1\nb2\nb3\nb4\n');
  const interdiff = git(['diff', '--full-index', 'HEAD'], { cwd: mr }).stdout;
  const full = git(['diff', '--full-index', c.base], { cwd: mr }).stdout;
  let eq = equivalence({ repo: c.repo, full, fullBase: c.base, interdiff, priorTip: tip });
  assert.equal(eq.state, 'equivalent', eq.detail); assert.deepEqual(eq.files.map((f) => f.result), ['same', 'same']);
  // a full patch that left out the b.txt change
  const partial = full.split(/(?=^diff --git )/m).filter((x) => !x.includes('core/b.txt')).join('');
  eq = equivalence({ repo: c.repo, full: partial, fullBase: c.base, interdiff, priorTip: tip });
  assert.equal(eq.state, 'differs'); assert.match(eq.detail, /core\/b\.txt/);
  // the same proposal rerolled onto `next`, where core added b0 to b.txt: equivalent, allowing for the base
  const rr = path.join(root, `rr${++n}`); ok(git(['clone', '-q', c.work, rr])); ok(git(['checkout', '-q', c.next], { cwd: rr }));
  fs.writeFileSync(path.join(rr, 'core/a.txt'), 'one\n\nSECOND\ntwo\nthree\n'); fs.writeFileSync(path.join(rr, 'core/b.txt'), 'b0\nb1\nb2\nb3\nb4\n');
  const rerolled = git(['diff', '--full-index', c.next], { cwd: rr }).stdout;
  eq = equivalence({ repo: c.repo, full: rerolled, fullBase: c.next, interdiff, priorTip: tip, priorBase: c.base });
  assert.equal(eq.state, 'equivalent', eq.detail); assert.equal(eq.files.find((f) => f.file === 'core/b.txt').result, 'same change, core base differs');
});

test('scripts/patch-validate.mjs: exit 0 for a valid patch in a bare repository under safe.bareRepository=explicit, 1 with a failure, 2 without a repository', () => {
  const c = core(), file = path.join(root, `p${++n}.patch`); fs.writeFileSync(file, diffOf(c, insertAfterBlank));
  const run = (...a) => spawnSync('node', [path.join(labRoot, 'scripts/patch-validate.mjs'), ...a], { encoding: 'utf8', cwd: root });
  let r = run(file, '--base', c.base, '--repo', c.bare, '--expect', 'core/a.txt');
  assert.equal(r.status, 0, r.stdout + r.stderr); assert.match(r.stdout, /ok {4}whitespace of the resulting source/);
  r = run(file, '--base', c.base, '--repo', c.bare, '--expect', 'core/other.txt'); assert.equal(r.status, 1); assert.match(r.stdout, /FAIL {2}expected files/);
  r = run(file, '--base', c.base, '--repo', path.join(root, 'nowhere.git')); assert.equal(r.status, 2);
});
