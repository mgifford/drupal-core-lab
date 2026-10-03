// Tests for --recipe: a recipe folder the person trusts replaces the assistant's own. Run: node --test tests/issue-pack/graft.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { labRoot } from '../../tools/compare/lib.mjs';
import { validatePack, loadYaml, graftRecipe } from '../../tools/compare/pack-validate.mjs';

const yaml = loadYaml();
const FIX = path.join(labRoot, 'tests/issue-pack/fixtures/packs/llm-draft-recipe-sets-no-state.yml');
const draft = fs.readFileSync(FIX, 'utf8');
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'graft-test-'));
const files = { 'recipe.yml': "name: 'trusted'\nrecipes:\n  - core/tests/fixtures/recipes/article_content_type\nconfig:\n  actions: {}\n", 'config/field.x.yml': 'id: node.article.x\n' };
const recipeDir = () => { const d = tmp(); fs.mkdirSync(path.join(d, 'config')); for (const [f, b] of Object.entries(files)) fs.writeFileSync(path.join(d, f), b); return d; };
const cli = (cmd, ...a) => spawnSync('node', [path.join(labRoot, 'scripts/issue-pack.mjs'), cmd, ...a], { encoding: 'utf8' });

test('graftRecipe replaces only the recipe files, keeps everything else, records it in review.unverified, and still validates', () => {
  const grafted = graftRecipe(draft, yaml, files, 'my/recipe');
  assert.match(grafted, /^# The recipe in this pack was replaced by issue-pack\.mjs --recipe my\/recipe\n/);
  const before = yaml.load(draft, { schema: yaml.CORE_SCHEMA }), after = yaml.load(grafted, { schema: yaml.CORE_SCHEMA });
  assert.deepEqual(after.recipe.files, files); assert.equal(after.recipe.name, before.recipe.name);
  for (const k of ['issue', 'sources', 'summary', 'variant', 'notes']) assert.deepEqual(after[k], before[k], `${k} is untouched`);
  assert.equal(after.review.unverified.length, before.review.unverified.length + 1);
  assert.match(after.review.unverified.at(-1), /supplied by the person \(from my\/recipe\).*assistant did not write or check them/);
  assert.deepEqual(validatePack(grafted, { yaml }).errors, []);
});

test('with a recipe that sets configuration, the "recipe sets no configuration" warning goes away and the other warnings stay', () => {
  const warnings = (t) => validatePack(t, { yaml }).warnings.map((w) => w.msg);
  assert.ok(warnings(draft).some((m) => /recipe sets no configuration/.test(m)));
  const after = warnings(graftRecipe(draft, yaml, files, 'd'));
  assert.ok(!after.some((m) => /recipe sets no configuration/.test(m)));
  assert.ok(after.some((m) => /no fix check/.test(m)));
});

test('text that is not YAML is returned unchanged so the validator reports it; a missing recipe section is created', () => {
  assert.equal(graftRecipe('a: [unclosed', yaml, files, 'd'), 'a: [unclosed');
  assert.equal(graftRecipe('- a\n- b\n', yaml, files, 'd'), '- a\n- b\n');
  const doc = yaml.load(draft, { schema: yaml.CORE_SCHEMA }); delete doc.recipe;
  const out = yaml.load(graftRecipe(yaml.dump(doc), yaml, files, 'd'), { schema: yaml.CORE_SCHEMA });
  assert.equal(out.recipe.name, 'repro_3618230'); assert.deepEqual(out.recipe.files, files);
});

test('validate --recipe says which recipe it uses, and checks the pack with it', () => {
  const d = recipeDir();
  const r = cli('validate', FIX, '--recipe', d);
  assert.equal(r.status, 0);
  assert.match(r.stdout, new RegExp(`Using the recipe from ${d.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\(2 file\\(s\\)\\) instead of the one in the pack\\.`));
  assert.doesNotMatch(r.stdout, /recipe sets no configuration/); assert.match(r.stdout, /no fix check/);
});

test('--recipe needs a folder, and a folder without recipe.yml is refused before anything else', () => {
  const a = cli('validate', FIX, '--recipe'); assert.equal(a.status, 2); assert.match(a.stderr, /--recipe needs a folder/);
  const b = cli('validate', FIX, '--recipe', tmp()); assert.equal(b.status, 2); assert.match(b.stderr, /--recipe: .*has no recipe\.yml/);
});

test('import --recipe --dry-run plans to write the supplied recipe (file count) and fetches nothing', () => {
  const nid = '9999991'; const d = tmp(); const pack = path.join(d, 'p.yml');
  fs.writeFileSync(pack, draft.replaceAll('3618230', nid));
  const r = cli('import', pack, '--recipe', recipeDir(), '--dry-run');
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /write recipes\/repro_9999991\/ \(2 file\(s\)\)/);
  assert.match(r.stdout, /dry run: nothing was fetched or written/);
  assert.ok(!fs.existsSync(path.join(labRoot, 'reports/issues', nid)) && !fs.existsSync(path.join(labRoot, 'recipes/repro_9999991')));
});
