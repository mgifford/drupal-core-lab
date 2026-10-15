// Tests for tools/compare/env-state.mjs: environment identity (common base, pinned commit, applied recipe), observed against requested.
// Throwaway git repositories and folders; no DDEV, no network. Run: node --test tests/lab/env-state.test.mjs
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { dirHash, headOf, recipeStatus, identity, blockMessage, identityRecord } from '../../tools/compare/env-state.mjs';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'env-state-test-'));
after(() => fs.rmSync(root, { recursive: true, force: true }));
let n = 0;
const git = (cwd, ...a) => spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...a], { cwd, encoding: 'utf8' });
const w = (f, text) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, text); };

// A lab with recipes/rcp, and a function that makes an "environment": a git repo with a base commit and, optionally, a copy of the recipe.
function lab() {
  const L = path.join(root, `lab${++n}`); w(path.join(L, 'recipes/rcp/recipe.yml'), 'name: rcp\nweight: 0\n'); w(path.join(L, 'recipes/rcp/config/a.yml'), 'a: 1\n');
  const envs = path.join(L, 'envs'); fs.mkdirSync(envs);
  const envDir = (e) => path.join(envs, e);
  const make = (e, { commits = 1, recipe = true } = {}) => {
    const d = envDir(e); fs.mkdirSync(d); git(d, 'init', '-q', '-b', 'main');
    for (let i = 0; i < commits; i++) { w(path.join(d, 'core/x.txt'), `v${i}\n`); git(d, 'add', '.'); git(d, 'commit', '-q', '-m', `c${i}`); }
    if (recipe) fs.cpSync(path.join(L, 'recipes/rcp'), path.join(d, 'recipes/rcp'), { recursive: true });
    return d;
  };
  return { L, envDir, make, v: (extra = {}) => ({ slug: 'zz-latest', before: { env: 'b' }, after: { env: 'a' }, recipe: 'rcp', ...extra }) };
}

test('a folder hash follows content, file names and nesting, and is null for a missing folder', () => {
  const L = lab(), d = path.join(L.L, 'recipes/rcp'), h = dirHash(d);
  assert.match(h, /^[0-9a-f]{64}$/); assert.equal(dirHash(d), h); assert.equal(dirHash(path.join(L.L, 'nope')), null);
  const copy = path.join(L.L, 'copy'); fs.cpSync(d, copy, { recursive: true }); assert.equal(dirHash(copy), h, 'the same files anywhere hash the same');
  fs.appendFileSync(path.join(copy, 'config/a.yml'), 'b: 2\n'); assert.notEqual(dirHash(copy), h);
  fs.cpSync(d, `${copy}2`, { recursive: true }); fs.renameSync(path.join(`${copy}2`, 'config/a.yml'), path.join(`${copy}2`, 'config/b.yml')); assert.notEqual(dirHash(`${copy}2`), h, 'a renamed file is a different recipe');
});

test('the recipe a site holds against the recipe now: same, differs, never applied, missing, none', () => {
  const L = lab(), e = L.make('b');
  assert.equal(recipeStatus(e, L.L, 'rcp').status, 'same'); assert.equal(recipeStatus(e, L.L, '').status, 'none');
  w(path.join(L.L, 'recipes/rcp/recipe.yml'), 'name: rcp\nweight: 10\n');   // the recipe is edited after the site was set up (the real #3618230 case: weight 10 became 0)
  const r = recipeStatus(e, L.L, 'rcp'); assert.equal(r.status, 'differs'); assert.notEqual(r.applied, r.current);
  assert.equal(recipeStatus(L.make('c', { recipe: false }), L.L, 'rcp').status, 'never-applied'); assert.equal(recipeStatus(e, L.L, 'gone').status, 'missing-in-lab');
});

test('identity: a pair on one base with the current recipe has no problems', () => {
  const L = lab(); L.make('b', { commits: 2 }); fs.cpSync(L.envDir('b'), L.envDir('a'), { recursive: true });   // same repo, same HEAD
  const id = identity(L.v(), { labRoot: L.L, envDir: L.envDir }); assert.deepEqual(id.problems, []); assert.equal(blockMessage(id), '');
  assert.equal(id.sides.before.head, id.sides.after.head); assert.equal(id.sides.before.head, headOf(L.envDir('b')));
});

test('identity: different base commits are a problem, named with both commits and the rebuild command', () => {
  const L = lab(); L.make('b', { commits: 1 }); L.make('a', { commits: 2 });
  const id = identity(L.v(), { labRoot: L.L, envDir: L.envDir }); assert.deepEqual(id.problems.map((p) => p.kind), ['base']);
  const m = blockMessage(id); assert.match(m, /^BLOCKED: the environments of zz-latest/); assert.match(m, /Before \(b\) is at [0-9a-f]{12} and After \(a\) is at [0-9a-f]{12}/); assert.match(m, /lab-env\.mjs delete zz-latest --yes, then node tools\/compare\/setup\.mjs zz-latest/); assert.doesNotMatch(m, /reset/);
});

test('identity: a pinned variant needs the pinned commit, given in full or abbreviated; an unpinned one has no pin check', () => {
  const L = lab(); const b = L.make('b'); fs.cpSync(b, L.envDir('a'), { recursive: true }); const head = headOf(b);
  for (const pin of [head, head.slice(0, 12)]) assert.deepEqual(identity(L.v({ core: { commit: pin } }), { labRoot: L.L, envDir: L.envDir }).problems, []);
  const bad = identity(L.v({ core: { commit: 'f'.repeat(40) } }), { labRoot: L.L, envDir: L.envDir }); assert.deepEqual(bad.problems.map((p) => p.kind), ['pin', 'pin']); assert.match(bad.problems[0].text, /b is at [0-9a-f]{12} but the variant pins ffffffffffff/);
  assert.deepEqual(identity(L.v({ core: { ref: 'main' } }), { labRoot: L.L, envDir: L.envDir }).problems, []);
});

test('identity: the applied recipe, on each side, against the recipe now: blocked, with the reset command (not the rebuild)', () => {
  const L = lab(); const b = L.make('b'); fs.cpSync(b, L.envDir('a'), { recursive: true });
  w(path.join(L.L, 'recipes/rcp/recipe.yml'), 'name: rcp\nweight: 10\n');
  const id = identity(L.v(), { labRoot: L.L, envDir: L.envDir }); assert.deepEqual(id.problems.map((p) => p.kind), ['recipe', 'recipe']);
  const m = blockMessage(id); assert.match(m, /the recipe applied to b \([0-9a-f]{12}\) is not recipes\/rcp as it is now \([0-9a-f]{12}\)/); assert.match(m, /the recipe applied to a/); assert.match(m, /lab-env\.mjs reset zz-latest --yes/); assert.doesNotMatch(m, /delete/);
  fs.rmSync(path.join(L.envDir('a'), 'recipes'), { recursive: true });   // one side never got a recipe
  assert.match(identity(L.v(), { labRoot: L.L, envDir: L.envDir }).problems.map((p) => p.text).join('\n'), /was never applied to a/);
  fs.cpSync(path.join(L.L, 'recipes/rcp'), path.join(L.envDir('a'), 'recipes/rcp'), { recursive: true }); fs.cpSync(path.join(L.L, 'recipes/rcp'), path.join(L.envDir('b'), 'recipes/rcp'), { recursive: true });
  assert.deepEqual(identity(L.v(), { labRoot: L.L, envDir: L.envDir }).problems, [], 'after the recipe is applied again the pair is fine');
});

test('identity: a missing environment is skipped, a variant with no recipe has no recipe check, and checks can be chosen', () => {
  const L = lab(); L.make('b', { commits: 1 });
  assert.deepEqual(identity(L.v(), { labRoot: L.L, envDir: L.envDir, checks: ['base', 'pin'] }).problems, []);   // After does not exist: nothing to compare
  L.make('a', { commits: 2 });
  assert.deepEqual(identity(L.v({ recipe: undefined }), { labRoot: L.L, envDir: L.envDir, checks: ['recipe'] }).problems, []);
  assert.deepEqual(identity(L.v(), { labRoot: L.L, envDir: L.envDir, checks: ['recipe'] }).problems.map((p) => p.kind), [], 'base is not a recipe problem');
  assert.deepEqual(identity(L.v(), { labRoot: L.L, envDir: L.envDir, checks: ['base'] }).problems.map((p) => p.kind), ['base']);
});

test('what a run records: the pin, both base commits, and the recipe as requested and as applied', () => {
  const L = lab(); const b = L.make('b'); fs.cpSync(b, L.envDir('a'), { recursive: true });
  const rec = identityRecord(identity(L.v({ core: { commit: headOf(b) } }), { labRoot: L.L, envDir: L.envDir }));
  assert.equal(rec.pin, headOf(b)); assert.deepEqual(rec.base, { before: headOf(b), after: headOf(b) }); assert.deepEqual(rec.recipe, { name: 'rcp', current: dirHash(path.join(L.L, 'recipes/rcp')), before: dirHash(path.join(b, 'recipes/rcp')), after: dirHash(path.join(L.envDir('a'), 'recipes/rcp')) }); assert.deepEqual(rec.problems, []);
  assert.equal(identityRecord(identity(L.v({ recipe: undefined }), { labRoot: L.L, envDir: L.envDir })).recipe, null);
});
