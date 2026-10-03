// Tests for the setup building blocks. Run: node --test tests/issue-pack/blocks.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { labRoot } from '../../tools/compare/lib.mjs';
import { validatePack, loadYaml, repairMessage } from '../../tools/compare/pack-validate.mjs';
import { loadCatalogue, validateSetup, expandSetup, catalogueText, describeSetup, PARAM_TYPES } from '../../tools/compare/pack-blocks.mjs';

const yaml = loadYaml();
const cat = loadCatalogue(yaml);
const read = (p) => fs.readFileSync(path.join(labRoot, p), 'utf8');
const free = () => yaml.load(read('tests/issue-pack/fixtures/packs/example-free-form-recipe.yml'), { schema: yaml.CORE_SCHEMA });
const run = (obj) => validatePack(yaml.dump(obj, { lineWidth: -1 }), { yaml });
const withSetup = (setup, extra = {}) => { const p = free(); delete p.recipe; p.setup = setup; return Object.assign(p, extra); };
const data = (t) => yaml.load(t, { schema: yaml.CORE_SCHEMA });
const noName = (r) => { const c = { ...r }; delete c.name; delete c.description; return c; };
const expand = (setup, nid = '3618230', title = 'T') => { const v = validateSetup(setup, cat); assert.deepEqual(v.errors, []); return expandSetup(v.entries, cat, { nid, title }, yaml); };
const FILE_FIELD = { use: 'file_field_with_size_limit', params: { field: 'attachment', label: 'Attachment', limit: '1 KB', extensions: 'txt' } };
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'blocks-test-'));

test('the catalogue loads with no problems and has the three prototype blocks, each saying where it was verified', () => {
  assert.deepEqual(cat.problems, []);
  assert.deepEqual([...cat.blocks.keys()].sort(), ['article_content_type', 'file_field_with_size_limit', 'image_media_type']);
  for (const b of cat.blocks.values()) assert.ok(b.verified.length >= 20 && /core a19dfee86688/.test(b.verified), `${b.name} names the core commit it was applied on`);
});

test('the blocks expand into exactly the recipes that were verified on real core (#3618230: all three files; #3415961: recipe.yml)', () => {
  const e = expand([FILE_FIELD]);
  const committed = (f) => read(`reports/issues/3618230/recipe/${f}`);
  assert.deepEqual(Object.keys(e.files).sort(), ['config/field.field.node.article.field_attachment.yml', 'config/field.storage.node.field_attachment.yml', 'recipe.yml']);
  assert.deepEqual(noName(data(e.files['recipe.yml'])), noName(data(committed('recipe.yml'))));
  for (const f of ['config/field.storage.node.field_attachment.yml', 'config/field.field.node.article.field_attachment.yml']) assert.deepEqual(data(e.files[f]), data(committed(f)), f);
  const e2 = expand([{ use: 'article_content_type' }, { use: 'image_media_type' }], '3415961');
  assert.deepEqual(noName(data(e2.files['recipe.yml'])), noName(data(free().recipe.files['recipe.yml'])));
  assert.deepEqual(Object.keys(e2.files), ['recipe.yml']);
});

test('a block can require another: it is added once, first, and marked as automatic', () => {
  const e = expand([FILE_FIELD]);
  assert.deepEqual(e.used.map((u) => [u.name, u.auto]), [['article_content_type', true], ['file_field_with_size_limit', false]]);
  assert.deepEqual(data(e.files['recipe.yml']).recipes, ['core/tests/fixtures/recipes/article_content_type']);
  const both = expand([{ use: 'article_content_type' }, FILE_FIELD, { use: 'article_content_type' }]);
  assert.equal(both.used.filter((u) => u.name === 'article_content_type').length, 1, 'deduplicated');
});

test('a block marked once cannot be used twice: a clear error, and the identical-config conflict is the reason', () => {
  const two = validateSetup([FILE_FIELD, { use: 'file_field_with_size_limit', params: { field: 'second' } }], cat);
  assert.ok(two.errors.some((e) => e.at === 'setup[1].use' && /file_field_with_size_limit can be used at most once in a pack[^]*set X by hand/.test(e.msg)), JSON.stringify(two.errors));
  assert.equal(validateSetup([FILE_FIELD], cat).errors.length, 0);
  assert.ok(validateSetup([{ use: 'article_content_type' }, { use: 'article_content_type' }], cat).errors.length === 0, 'blocks without once may repeat');
  assert.throws(() => expand([FILE_FIELD, { use: 'file_field_with_size_limit', params: { field: 'second' } }]), /at most once|AssertionError/);
});

test('defaults are filled in when params are left out, and the generated description names the blocks', () => {
  const e = expand([{ use: 'file_field_with_size_limit' }]);
  assert.match(e.files['config/field.field.node.article.field_attachment.yml'], /max_filesize: '1 KB'/);
  assert.match(data(e.files['recipe.yml']).description, /built from the setup blocks: article_content_type, file_field_with_size_limit/);
});

for (const [name, params, re] of [
  ['an uppercase or spaced field name', { field: 'Bad Name' }, /not valid: lowercase letters, digits and underscores/],
  ['a field name that tries to add YAML', { field: 'a: b' }, /not valid/],
  ['a limit with the wrong unit', { limit: '1 GB' }, /not valid: a number then KB or MB/],
  ['a limit that is only a number', { limit: 1 }, /not valid: a number then KB or MB/],
  ['a limit with a newline and extra keys', { limit: "1 KB'\nmalicious: true" }, /not valid/],
  ['a label with a quote (which would end the YAML string)', { label: "O'Brien" }, /not valid: letters, digits, spaces/],
  ['a label with a colon', { label: 'a: b' }, /not valid/],
  ['a label that is too long', { label: 'x'.repeat(41) }, /not valid/],
  ['uppercase extensions', { extensions: 'TXT' }, /not valid: lowercase extensions/],
  ['too many extensions', { extensions: 'a b c d e f g' }, /not valid/],
  ['an unknown parameter', { colour: 'red' }, /is not a parameter of file_field_with_size_limit \(parameters: field, label, limit, extensions\)/],
]) test(`param validation rejects ${name}`, () => {
  const v = validateSetup([{ use: 'file_field_with_size_limit', params }], cat);
  assert.ok(v.errors.length >= 1 && v.errors.some((e) => re.test(e.msg)), JSON.stringify(v.errors));
  assert.deepEqual(v.entries, [], 'nothing is expanded when a value is rejected');
});

test('an unknown block is refused with the list of what exists and the instruction to use needs', () => {
  const v = validateSetup([{ use: 'drupal_magic' }], cat);
  assert.match(v.errors[0].msg, /"drupal_magic" is not a building block in the catalogue \(available: article_content_type, file_field_with_size_limit, image_media_type\)/);
  assert.match(v.errors[0].msg, /list it under needs/);
  assert.ok(v.errors[0].at === 'setup[0].use');
});

test('structure errors: empty, too long, not a list, wrong keys, params not a mapping', () => {
  assert.match(validateSetup([], cat).errors[0].msg, /1 to 10 building blocks/);
  assert.match(validateSetup(Array.from({ length: 11 }, () => ({ use: 'article_content_type' })), cat).errors[0].msg, /1 to 10/);
  assert.match(validateSetup({ use: 'x' }, cat).errors[0].msg, /1 to 10/);
  assert.match(validateSetup(['article_content_type'], cat).errors[0].msg, /must have use/);
  assert.ok(validateSetup([{ use: 'article_content_type', run: 'rm -rf /' }], cat).errors.some((e) => /not a known key/.test(e.msg)));
  assert.match(validateSetup([{ use: 'file_field_with_size_limit', params: ['a'] }], cat).errors[0].msg, /mapping/);
});

test('in a pack: setup is expanded and checked like a recipe, and the pack gets the expanded recipe and the list of blocks used', () => {
  const r = run(withSetup([{ use: 'article_content_type' }, { use: 'image_media_type' }]));
  assert.deepEqual(r.errors, []);
  assert.equal(r.pack.recipe.name, 'repro_3415961'); assert.deepEqual(Object.keys(r.pack.recipe.files), ['recipe.yml']);
  assert.deepEqual(r.setupUsed.map((u) => u.name), ['article_content_type', 'image_media_type']);
});

test('a pack must have exactly one of setup and recipe', () => {
  const both = free(); both.setup = [{ use: 'article_content_type' }]; assert.ok(run(both).errors.some((e) => e.at === 'setup' && /either setup .* or recipe .*not both/.test(e.msg)));
  const neither = free(); delete neither.recipe; assert.ok(run(neither).errors.some((e) => e.at === 'setup' && /is required: list the building blocks/.test(e.msg)));
});

test('a bad setup entry gives the errors for that entry and no confusing recipe error', () => {
  const r = run(withSetup([{ use: 'file_field_with_size_limit', params: { limit: '1 GB' } }]));
  assert.ok(r.errors.some((e) => e.at === 'setup[0].params.limit'));
  assert.ok(!r.errors.some((e) => e.at.startsWith('recipe')), 'no recipe errors on top of the real one');
});

test('the state heuristics see the expanded recipe: a field block sets configuration, a bare Article block does not', () => {
  const steps = (p) => { p.variant.steps[3].text += ' Use a file over the configured limit.'; return p; };
  const w = (r) => r.warnings.find((x) => /recipe sets no configuration/.test(x.msg));
  assert.equal(w(run(steps(withSetup([FILE_FIELD])))), undefined);
  assert.ok(w(run(steps(withSetup([{ use: 'article_content_type' }])))));
});

test('the Article warning follows the blocks: no warning with the Article block (or a block that requires it), a warning with the image block alone', () => {
  const warn = (r) => r.warnings.find((x) => /does not create the Article content type/.test(x.msg));
  const base = (setup) => { const p = withSetup(setup); p.variant.pages = ['/node/add/article']; return run(p); };
  assert.equal(warn(base([{ use: 'article_content_type' }])), undefined);
  assert.equal(warn(base([FILE_FIELD])), undefined);
  assert.ok(warn(base([{ use: 'image_media_type' }])));
});

test('needs: a missing block is a warning that names it and says the step must be by hand; an existing block is pointed out; bad entries are errors', () => {
  const r = run(withSetup([{ use: 'article_content_type' }], { needs: [{ block: 'ckeditor5_toolbar_item', why: 'the scenario needs a toolbar button added to a text format' }, { block: 'image_media_type', why: 'x is here' }] }));
  assert.deepEqual(r.errors, []);
  assert.ok(r.warnings.some((w) => w.at === 'needs[0]' && /does not exist yet: ckeditor5_toolbar_item[^]*sets it up by hand/.test(w.msg)));
  assert.ok(r.warnings.some((w) => w.at === 'needs[1]' && /already exists in the catalogue/.test(w.msg)));
  assert.ok(run(withSetup([{ use: 'article_content_type' }], { needs: [{ block: 'Bad Name', why: 'long enough' }] })).errors.some((e) => e.at === 'needs[0].block'));
  assert.ok(run(withSetup([{ use: 'article_content_type' }], { needs: [{ block: 'ok_name' }] })).errors.some((e) => e.at === 'needs[0].why'));
  assert.ok(run(withSetup([{ use: 'article_content_type' }], { needs: 'nope' })).errors.some((e) => e.at === 'needs'));
});

test('the repair message explains the setup errors in plain words', () => {
  const m = repairMessage(run(withSetup([{ use: 'drupal_magic' }])));
  assert.match(m, /not a building block in the catalogue[^\n]*\n   What to do: Use only blocks from the SETUP CATALOGUE in the prompt/);
  assert.match(repairMessage(run(withSetup([{ use: 'file_field_with_size_limit', params: { limit: '9 GB' } }]))), /What to do: Use only the parameters the catalogue lists/);
});

test('--recipe replaces setup entirely (and the pack then validates as a free-form recipe pack)', () => {
  const d = tmp(); fs.writeFileSync(path.join(d, 'recipe.yml'), "name: 'x'\nconfig:\n  actions: {}\n");
  const f = path.join(d, 'p.yml'); fs.writeFileSync(f, yaml.dump(withSetup([{ use: 'article_content_type' }]), { lineWidth: -1 }));
  const r = spawnSync('node', [path.join(labRoot, 'scripts/issue-pack.mjs'), 'validate', f, '--recipe', d], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr); assert.doesNotMatch(r.stdout, /not both/); assert.doesNotMatch(r.stdout, /setup blocks:/);
});

test('a malformed block file is reported as a catalogue problem: no verified note, an undeclared placeholder, a missing requirement, a cycle, a bad file name', () => {
  const d = tmp();
  const w = (n, body) => fs.writeFileSync(path.join(d, `${n}.yml`), body);
  const ok = (n, extra = '') => `name: ${n}\ntitle: "A block called ${n}"\ndescription: "A description that is long enough to be accepted here."\nparams: {}\nverified: "Applied on core abc123456789 in a test build for this block."\nrecipe:\n  recipes: [core/recipes/x]\n${extra}`;
  w('no_verified', ok('no_verified').replace(/verified:.*\n/, ''));
  w('placeholder', ok('placeholder', 'files:\n  "config/a.yml": "x: {{missing}}"\n'));
  w('needs_ghost', ok('needs_ghost', 'requires: [ghost]\n'));
  w('cycle_a', ok('cycle_a', 'requires: [cycle_b]\n')); w('cycle_b', ok('cycle_b', 'requires: [cycle_a]\n'));
  w('bad_file', ok('bad_file', 'files:\n  "../escape.yml": "x: 1"\n'));
  w('wrong_name', ok('other_name'));
  const p = loadCatalogue(yaml, d).problems.join('\n');
  assert.match(p, /no_verified\.yml: verified is required/); assert.match(p, /placeholder\.yml: uses \{\{missing\}\}/); assert.match(p, /needs_ghost\.yml: requires "ghost"/);
  assert.match(p, /cycle_a\.yml: requires itself/); assert.match(p, /bad_file\.yml: file "..\/escape\.yml" must be config\/<name>\.yml/); assert.match(p, /wrong_name\.yml: name must equal the file name/);
});

test('two blocks that set the same thing differently are a conflict, not a silent overwrite; identical settings merge', () => {
  const d = tmp();
  const blk = (n, v) => `name: ${n}\ntitle: "Block ${n}"\ndescription: "A description that is long enough to be accepted here."\nparams: {}\nverified: "Applied on core abc123456789 in a test build."\nrecipe:\n  config_actions:\n    some.config:\n      setThing: ${v}\nfiles:\n  "config/shared.yml": "value: ${v}"\n`;
  fs.writeFileSync(path.join(d, 'one.yml'), blk('one', 'a')); fs.writeFileSync(path.join(d, 'two.yml'), blk('two', 'b')); fs.writeFileSync(path.join(d, 'three.yml'), blk('three', 'a'));
  const c = loadCatalogue(yaml, d); assert.deepEqual(c.problems, []);
  const ex = (names) => { const v = validateSetup(names.map((n) => ({ use: n })), c); return expandSetup(v.entries, c, { nid: '1234567', title: 't' }, yaml); };
  assert.throws(() => ex(['one', 'two']), /two blocks set config\.actions\.some\.config\.setThing to different values/);
  assert.doesNotThrow(() => ex(['one', 'three']));
});

test('the catalogue text for the prompt lists every block with its parameters and what it adds automatically', () => {
  const t = catalogueText(cat);
  for (const n of cat.blocks.keys()) assert.match(t, new RegExp(`^- ${n}: `, 'm'));
  assert.match(t, /parameters: field \(machine_name, default "attachment"\)[^\n]*limit \(size, default "1 KB"\)/);
  assert.match(t, /also adds automatically: article_content_type\n  use this block at most once per pack/);
});

test('describeSetup tells the reader which blocks built the setup and where each was verified', () => {
  const lines = describeSetup(expand([FILE_FIELD]).used);
  assert.match(lines[0], /^- article_content_type \[added automatically\]\. Verified: Core fixture recipe/);
  assert.match(lines[1], /^- file_field_with_size_limit \(field: attachment, label: Attachment, limit: 1 KB, extensions: txt\)\. Verified: Applied on core a19dfee86688/);
});

test('REAL PACK: the committed #3618230 pack, with its recipe swapped for one setup block, validates clean and builds the same recipe', () => {
  const real = yaml.load(read('reports/issues/3618230/PACK.yml'), { schema: yaml.CORE_SCHEMA });
  const committedFiles = real.recipe.files; delete real.recipe; real.setup = [FILE_FIELD];
  const r = run(real);
  assert.deepEqual(r.errors, []); assert.deepEqual(r.warnings, []);
  assert.deepEqual(noName(data(r.pack.recipe.files['recipe.yml'])), noName(data(committedFiles['recipe.yml'])));
  for (const f of Object.keys(committedFiles).filter((x) => x.startsWith('config/'))) assert.deepEqual(data(r.pack.recipe.files[f]), data(committedFiles[f]), f);
});

test('the CLI: validate prints the blocks used, import --dry-run plans the expanded files, and the prompt carries the catalogue', () => {
  const nid = '9999992'; const d = tmp(); const f = path.join(d, 'p.yml');
  const p = JSON.parse(JSON.stringify(withSetup([FILE_FIELD]))); fs.writeFileSync(f, yaml.dump(p, { lineWidth: -1 }).replaceAll('3415961', nid));
  const cli = (...a) => spawnSync('node', [path.join(labRoot, 'scripts/issue-pack.mjs'), ...a], { encoding: 'utf8' });
  const v = cli('validate', f); assert.match(v.stdout, /setup blocks: article_content_type \(added automatically\), file_field_with_size_limit/);
  const i = cli('import', f, '--dry-run'); assert.equal(i.status, 0, i.stderr); assert.match(i.stdout, /write recipes\/repro_9999992\/ \(3 file\(s\)\)/);
  assert.ok(!fs.existsSync(path.join(labRoot, 'recipes/repro_9999992')));
  const pr = cli('prompt').stdout; assert.match(pr, /^SETUP CATALOGUE/m); assert.match(pr, /^- file_field_with_size_limit: /m); assert.doesNotMatch(pr, /\{\{[A-Z]+\}\}/);
});

test('every parameter type has a pattern that rejects newlines, quotes and colons', () => {
  for (const [name, t] of Object.entries(PARAM_TYPES)) for (const bad of ['a\nb', "a'b", 'a: b', 'a"b', '{{x}}']) assert.equal(t.re.test(bad), false, `${name} must reject ${JSON.stringify(bad)}`);
});
