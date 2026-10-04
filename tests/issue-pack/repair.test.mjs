// Tests for the paste-back repair message (`issue-pack.mjs validate --repair`). Run: node --test tests/issue-pack/repair.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { labRoot } from '../../tools/compare/lib.mjs';
import { validatePack, loadYaml, repairMessage, readRecipeDir } from '../../tools/compare/pack-validate.mjs';

const yaml = loadYaml();
const draft = fs.readFileSync(path.join(labRoot, 'tests/issue-pack/fixtures/packs/llm-draft-recipe-sets-no-state.yml'), 'utf8');
const example = fs.readFileSync(path.join(labRoot, 'docs/examples/issue-pack-3415961.yml'), 'utf8');
const msgFor = (text, opts) => repairMessage(validatePack(text, { yaml }), opts);
const cli = (...a) => spawnSync('node', [path.join(labRoot, 'scripts/issue-pack.mjs'), 'validate', ...a], { encoding: 'utf8' });
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'repair-test-'));

test('warnings only: a numbered list with the validator\'s own words and what to do about each', () => {
  const m = msgFor(draft);
  assert.match(m, /^Your issue pack passed the validator, with warnings\. Fix ONLY these problems/);
  assert.match(m, /\n1\. \[warning\] /); assert.match(m, /\n2\. \[warning\] /);
  assert.match(m, /recipe sets no configuration/); assert.match(m, /What to do: Either \(a\) add the configuration to the recipe[^\n]*do not invent config keys[^\n]*\(b\) change the step/);
  assert.match(m, /no fix check[^\n]*\n   What to do: Add one fix check from the CHECK TEMPLATES/);
});

test('errors: says it did not pass, lists errors before warnings, and gives the plain-words hint for tags', () => {
  const p = yaml.load(example, { schema: yaml.CORE_SCHEMA }); p.summary += ' Use <div class="x"> here.';
  const m = msgFor(yaml.dump(p, { lineWidth: -1 }));
  assert.match(m, /^Your issue pack did not pass the validator\./);
  assert.match(m, /1\. \[error\] summary: may not contain HTML-like tags[^\n]*\n   What to do: Rewrite it in plain words\. Do not write angle brackets around tag names, not even inside backticks/);
});

test('a clean pack gives no message at all', () => { assert.equal(msgFor(example), ''); });

test('an attached recipe is added verbatim, and the message says the person supplies it and that it was not checked', () => {
  const m = msgFor(draft, { recipeFiles: { 'recipe.yml': "name: 'x'\n", 'config/a.yml': 'id: a\n' } });
  assert.match(m, /The person supplies these files and says they build on current Drupal core; you have not checked them/);
  assert.match(m, /\n--- recipe\.yml\nname: 'x'\n/); assert.match(m, /\n--- config\/a\.yml\nid: a\n/); assert.match(m, /\n--- end of recipe files$/);
  assert.doesNotMatch(m, /known to apply/);
});

test('readRecipeDir reads recipe.yml and config/*.yml only, and refuses a missing recipe.yml or an oversized file', () => {
  const d = tmp(); fs.mkdirSync(path.join(d, 'config')); fs.writeFileSync(path.join(d, 'recipe.yml'), 'name: a\n'); fs.writeFileSync(path.join(d, 'config/b.yml'), 'id: b\n');
  fs.writeFileSync(path.join(d, 'config/skip me.yml'), 'x: 1\n'); fs.writeFileSync(path.join(d, 'config/c.txt'), 'x'); fs.writeFileSync(path.join(d, 'notes.md'), 'x');
  assert.deepEqual(Object.keys(readRecipeDir(d)), ['recipe.yml', 'config/b.yml']);
  assert.throws(() => readRecipeDir(tmp()), /has no recipe\.yml/);
  fs.writeFileSync(path.join(d, 'config/big.yml'), 'a: ' + 'x'.repeat(20001));
  assert.throws(() => readRecipeDir(d), /larger than 20000/);
});

test('the command prints the block with --repair, exits 0 for warnings only, and does not copy with --no-copy', () => {
  const f = path.join(labRoot, 'tests/issue-pack/fixtures/packs/llm-draft-recipe-sets-no-state.yml');
  const r = cli(f, '--repair', '--no-copy');
  assert.equal(r.status, 0);
  assert.match(r.stdout, /----- COPY EVERYTHING BETWEEN THESE LINES INTO THE SAME CHAT -----\nYour issue pack passed the validator, with warnings\./);
  assert.match(r.stdout, /\n----- END -----\n/); assert.match(r.stdout, /Not copied to the clipboard/);
  assert.doesNotMatch(r.stdout, /Copied to the clipboard with/);
});

test('the command says there is nothing to repair for a clean pack, and without --repair prints no block', () => {
  const ex = path.join(labRoot, 'docs/examples/issue-pack-3415961.yml');
  assert.match(cli(ex, '--repair', '--no-copy').stdout, /Nothing to repair: no errors and no warnings\./);
  assert.doesNotMatch(cli(path.join(labRoot, 'tests/issue-pack/fixtures/packs/llm-draft-recipe-sets-no-state.yml')).stdout, /COPY EVERYTHING/);
});

test('the command attaches a recipe folder, and refuses a missing value or a bad folder before doing anything else', () => {
  const f = path.join(labRoot, 'tests/issue-pack/fixtures/packs/llm-draft-recipe-sets-no-state.yml');
  const d = tmp(); fs.writeFileSync(path.join(d, 'recipe.yml'), "name: 'attached'\n");
  assert.match(cli(f, '--repair', '--no-copy', '--attach-recipe', d).stdout, /\n--- recipe\.yml\nname: 'attached'\n/);
  const a = cli(f, '--repair', '--attach-recipe'); assert.equal(a.status, 2); assert.match(a.stderr, /--attach-recipe needs a folder/);
  const b = cli(f, '--repair', '--no-copy', '--attach-recipe', path.join(d, 'nope')); assert.equal(b.status, 2); assert.match(b.stderr, /--attach-recipe: .*no recipe\.yml|ENOENT|has no recipe/);
});

test('the command still exits 1 and prints the block when the pack has errors', () => {
  const d = tmp(); const p = yaml.load(example, { schema: yaml.CORE_SCHEMA }); p.pack_version = 9; const f = path.join(d, 'bad.yml'); fs.writeFileSync(f, yaml.dump(p, { lineWidth: -1 }));
  const r = cli(f, '--repair', '--no-copy'); assert.equal(r.status, 1);
  assert.match(r.stdout, /Your issue pack did not pass the validator\./); assert.match(r.stderr, /Not valid:/);
});
