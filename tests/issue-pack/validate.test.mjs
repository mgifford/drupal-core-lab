// Tests for the issue pack validator. Run: node --test tests/issue-pack/
// Needs js-yaml: npm install --prefix tools/compare/.deps js-yaml@4. No network, no Docker, nothing is written.
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { labRoot, variants } from '../../tools/compare/lib.mjs';
import { validatePack, checkProbe, loadYaml, repairMessage } from '../../tools/compare/pack-validate.mjs';

const yaml = loadYaml();
// A free-form recipe pack (the original example). Most tests below change its recipe files, so they use this fixture; the worked example in docs/ now uses setup blocks.
const example = fs.readFileSync(path.join(labRoot, 'tests/issue-pack/fixtures/packs/example-free-form-recipe.yml'), 'utf8');
const docsExample = fs.readFileSync(path.join(labRoot, 'docs/examples/issue-pack-3415961.yml'), 'utf8');
const base = () => yaml.load(example, { schema: yaml.CORE_SCHEMA });
const run = (obj) => validatePack(typeof obj === 'string' ? obj : yaml.dump(obj, { lineWidth: -1 }), { yaml });
const has = (res, at, re) => res.errors.some((e) => e.at.startsWith(at) && re.test(e.msg));

test('the worked example in docs/ (setup blocks) is valid, with no warnings', () => {
  const r = run(docsExample);
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.warnings, []);
});

test('every check already in the repo passes the probe checker (no false positives)', () => {
  for (const v of variants()) for (const c of v.checks || []) assert.deepEqual(checkProbe(c.probe), [], `${v.slug}: ${c.label}`);
});

test('probes: reading properties of the same name as a forbidden call is allowed', () => {
  assert.deepEqual(checkProbe("document.querySelectorAll('details[open]').length"), []);
  assert.deepEqual(checkProbe("((r) => r.top < 10 && r.bottom > 0)(document.body.getBoundingClientRect())"), []);
  assert.deepEqual(checkProbe("document.querySelector('details').open"), []);
});

for (const [name, probe, re] of [
  ['network access', "fetch('/admin')", /fetch/],
  ['XMLHttpRequest', "new XMLHttpRequest()", /XMLHttpRequest/],
  ['an assignment', "(window.x = 1)", /assignment/],
  ['an increment', "(window.n++)", /\+\+/],
  ['window.top', "window.top.document.title", /top/],
  ['a bare location', "location.href", /location/],
  ['document.cookie', "document.cookie", /cookie/],
  ['a DOM write call', "document.body.setAttribute('x', 1)", /setAttribute/],
  ['a click call', "document.querySelector('a').click()", /click/],
  ['a template string', "`${1}`", /template/],
  ['a semicolon', "1; 2", /semicolon|expression/],
  ['eval', "eval('1')", /eval/],
  ['the Function constructor', "(function(){}).constructor('return 1')()", /constructor|Function/],
  ['a syntax error', "(1 +", /valid JavaScript/],
  ['an overlong probe', `${'1+'.repeat(250)}1`, /longer than 400/],
]) test(`probes: ${name} is rejected`, () => assert.ok(checkProbe(probe).some((p) => re.test(p)), `${probe} -> ${checkProbe(probe).join(' | ')}`));

test('a bad probe inside a pack is reported against its check', () => {
  const p = base(); p.variant.checks[1].probe = "fetch('/user/1/edit').then(r => r.text())";
  assert.ok(has(run(p), 'variant.checks[1].probe', /fetch/));
});

test('top-level: an unknown key is rejected', () => { const p = base(); p.exec = 'rm -rf /'; assert.ok(has(run(p), 'exec', /not a known top-level key/)); });
test('top-level: the wrong pack_version is rejected', () => { const p = base(); p.pack_version = 2; assert.ok(has(run(p), 'pack_version', /must be 1/)); });

test('review: a pack must stay a draft', () => { const p = base(); p.review.status = 'reviewed'; assert.ok(has(run(p), 'review.status', /draft/)); });
test('review: it must list what could not be verified', () => { const p = base(); p.review.unverified = []; assert.ok(has(run(p), 'review.unverified', /at least one/)); });

test('issue: nid, url and recipe name must agree', () => {
  const p = base(); p.issue.url = 'https://www.drupal.org/project/drupal/issues/1234567'; p.recipe.name = 'repro_1234567';
  const r = run(p); assert.ok(has(r, 'issue.url', /exactly/)); assert.ok(has(r, 'recipe.name', /repro_3415961/));
});
test('issue: a fork branch with a path trick is rejected', () => { const p = base(); p.issue.fork_branch = '../../etc/passwd'; assert.ok(has(run(p), 'issue.fork_branch', /branch name/)); });

test('recipe: file names may not escape the recipe folder', () => {
  const p = base(); p.recipe.files['../../evil.yml'] = 'a: 1'; p.recipe.files['config/../x.yml'] = 'a: 1';
  const r = run(p); assert.ok(has(r, 'recipe.files.../../evil.yml', /file names/)); assert.ok(has(r, 'recipe.files.config/../x.yml', /file names/));
});
test('recipe: recipe.yml is required and must be YAML', () => {
  const p = base(); p.recipe.files['config/other.yml'] = 'a: 1'; delete p.recipe.files['recipe.yml']; assert.ok(has(run(p), 'recipe.files', /must include recipe.yml/));
  const q = base(); q.recipe.files['recipe.yml'] = 'name: [unclosed'; assert.ok(has(run(q), 'recipe.files.recipe.yml', /not valid YAML/));
});
test('recipe: dependencies must be repo or core recipes, not paths elsewhere', () => {
  const p = base(); p.recipe.files['recipe.yml'] += '\n'; const doc = yaml.load(p.recipe.files['recipe.yml']); doc.recipes.push('../../tmp/evil', 'https://evil.example/r'); p.recipe.files['recipe.yml'] = yaml.dump(doc);
  assert.ok(has(run(p), 'recipe.files.recipe.yml.recipes', /must be a recipe name/));
});
test('recipe: install entries must be machine names', () => {
  const p = base(); const doc = yaml.load(p.recipe.files['recipe.yml']); doc.install = ['Bad Name; rm']; p.recipe.files['recipe.yml'] = yaml.dump(doc);
  assert.ok(has(run(p), 'recipe.files.recipe.yml.install', /machine name/));
});
test('recipe: unknown recipe keys are rejected', () => {
  const p = base(); const doc = yaml.load(p.recipe.files['recipe.yml']); doc.post_install = 'curl evil'; p.recipe.files['recipe.yml'] = yaml.dump(doc);
  assert.ok(has(run(p), 'recipe.files.recipe.yml.post_install', /not a known recipe key/));
});

test('variant: pages must be site paths, not hosts', () => {
  const p = base(); p.variant.pages = ['https://evil.example/x', '//evil.example/y']; assert.ok(has(run(p), 'variant.pages', /site paths/));
});
test('variant: HTML-like tags in text are rejected, but => and a lone > are fine', () => {
  const p = base(); p.variant.steps[0].text = 'Click <img src=x onerror=alert(1)> now'; assert.ok(has(run(p), 'variant.steps[0].text', /HTML-like/));
  const q = base(); q.variant.steps[0].text = "Set 'a' => TRUE and check that 3 > 2"; assert.equal(has(run(q), 'variant.steps[0].text', /HTML-like/), false);
});
test('variant: unknown keys are rejected (the importer sets core, environments and patches)', () => {
  const p = base(); p.variant.after = { patches: ['https://evil.example/p.patch'] }; assert.ok(has(run(p), 'variant.after', /not a known key/));
});
test('variant: a step how must be recipe, mirror or each', () => { const p = base(); p.variant.steps[0].how = 'shell'; assert.ok(has(run(p), 'variant.steps[0].how', /recipe, mirror or each/)); });

test('URLs: outside the allow list is an error in the recipe or variant, a warning in the summary', () => {
  const p = base(); p.variant.steps[0].lookFor = 'See http://evil.example/page for details'; assert.ok(has(run(p), 'variant.steps[0].lookFor', /not an https drupal\.org/));
  const q = base(); q.summary += ' See https://example.org/writeup for more detail on the behaviour.'; const r = run(q);
  assert.equal(r.errors.length, 0); assert.ok(r.warnings.some((w) => w.at === 'summary'));
});
test('secrets: a token in the notes is rejected', () => {
  const p = base(); p.notes = 'My token is ghp_abcdefghijklmnopqrstuvwxyz0123456789'; assert.ok(has(run(p), 'notes', /secret/));
});

test('YAML: anchors and aliases are rejected', () => {
  const t = example.replace('  fork_branch:', '  extra: &x { a: 1 }\n  other: *x\n  fork_branch:'); assert.ok(has(run(t), 'pack', /anchors\/aliases/));
});
test('YAML: duplicate keys and broken YAML are reported as errors, not crashes', () => {
  assert.ok(has(run('a: 1\na: 2\n'), 'pack', /not valid YAML/));
  assert.ok(has(run('issue: [unclosed'), 'pack', /not valid YAML/));
  assert.ok(has(run(''), 'pack', /empty|mapping/));
  assert.ok(has(run('- just\n- a list\n'), 'pack', /mapping/));
});
test('size: a pack over 200 KB is rejected before parsing', () => { assert.ok(has(run(`${example}\n# ${'x'.repeat(210 * 1024)}`), 'pack', /larger than/)); });
test('a pack cannot execute anything while being validated', () => {
  const p = base(); p.variant.checks[1].probe = "(globalThis.__packRan = true)"; run(p); assert.equal(globalThis.__packRan, undefined);
});

// ---- steps must not rely on state the recipe never creates (warning heuristic) ----
const stateWarning = (res) => res.warnings.find((w) => /recipe sets no configuration/.test(w.msg));
const withStep = (p, text) => { p.variant.steps[3].text = `${p.variant.steps[3].text} ${text}`; return p; };

test('a real chat draft whose steps say "the configured limit" but whose recipe sets none gets the warning (and is still valid)', () => {
  const text = fs.readFileSync(path.join(labRoot, 'tests/issue-pack/fixtures/packs/llm-draft-recipe-sets-no-state.yml'), 'utf8');
  const r = run(text);
  assert.deepEqual(r.errors, []);
  const w = stateWarning(r);
  assert.ok(w, 'warns that the recipe sets nothing');
  assert.equal(w.at, 'variant.steps[2].text');
  assert.match(w.msg, /"configured"/);
  assert.ok(r.warnings.some((x) => /no fix check/.test(x.msg)), 'its other gap is still reported');
});

test('the warning also fires on lookFor and on the description, and names the word that triggered it', () => {
  const a = run(withStep(base(), 'Use a file that exceeds the maximum size.'));
  assert.equal(stateWarning(a).at, 'variant.steps[3].text'); assert.match(stateWarning(a).msg, /"maximum"/);
  const b = base(); b.variant.steps[3].lookFor = 'The upload limit message appears.'; assert.equal(stateWarning(run(b)).at, 'variant.steps[3].lookFor');
  const c = base(); c.variant.description += ' Uses the default threshold.'; assert.equal(stateWarning(run(c)).at, 'variant.description');
});

test('no warning when the recipe sets configuration, as a config section or as config files', () => {
  const p = withStep(base(), 'Use a file over the configured limit.');
  assert.ok(stateWarning(run(p)), 'sanity: it warns without configuration');
  const withSection = structuredClone(p); const doc = yaml.load(withSection.recipe.files['recipe.yml']); doc.config = { actions: {} }; withSection.recipe.files['recipe.yml'] = yaml.dump(doc);
  assert.equal(stateWarning(run(withSection)), undefined);
  const withFile = structuredClone(p); withFile.recipe.files['config/x.yml'] = 'a: 1';
  assert.equal(stateWarning(run(withFile)), undefined);
});

test('no warning when the pack admits the setup is by hand in review.unverified', () => {
  const p = withStep(base(), 'Use a file over the configured limit.');
  p.review.unverified.push('The size limit is not set by the recipe; the person must set it by hand');
  assert.equal(stateWarning(run(p)), undefined);
});

test('the worked example and a repaired real draft stay free of warnings', () => {
  assert.deepEqual(run(example).warnings, []);
});

// ---- the Article content type (the lab's Standard install of current core does not have it) ----
const articleWarning = (res) => res.warnings.find((w) => /does not create the Article content type/.test(w.msg));

test('a real chat draft that visits /node/add/article without creating the Article type gets the warning, plus the others it earned', () => {
  const r = run(fs.readFileSync(path.join(labRoot, 'tests/issue-pack/fixtures/packs/llm-draft-no-article-no-checks.yml'), 'utf8'));
  assert.deepEqual(r.errors, []);
  assert.ok(articleWarning(r)); assert.ok(stateWarning(r)); assert.ok(r.warnings.some((w) => /no fix check/.test(w.msg)));
  assert.equal(articleWarning(r).at, 'recipe.files.recipe.yml');
});

test('no Article warning when the recipe applies the fixture recipe or ships the node type config, or the pack does not use the page', () => {
  const draftNo = () => { const p = base(); p.recipe.files['recipe.yml'] = "name: 'x'\ntype: 'Testing'\ninstall:\n  - file\n"; p.variant.pages = ['/node/add/article']; return p; };
  assert.ok(articleWarning(run(draftNo())));
  const a = draftNo(); a.recipe.files['recipe.yml'] += 'recipes:\n  - core/tests/fixtures/recipes/article_content_type\n'; assert.equal(articleWarning(run(a)), undefined);
  const b = draftNo(); b.recipe.files['config/node.type.article.yml'] = 'type: article\n'; assert.equal(articleWarning(run(b)), undefined);
  const c = draftNo(); c.variant.pages = ['/admin/content']; c.variant.demo = { start: '/admin/content' }; c.variant.steps = c.variant.steps.map((x) => ({ ...x, text: x.text.replace('/node/add/article', '/admin/content') })); assert.equal(articleWarning(run(c)), undefined);
});

test('the repair message gives the plain instruction for the Article warning', () => {
  const m = repairMessage(run(fs.readFileSync(path.join(labRoot, 'tests/issue-pack/fixtures/packs/llm-draft-no-article-no-checks.yml'), 'utf8')));
  assert.match(m, /does not create the Article content type[^\n]*\n   What to do: Add core\/tests\/fixtures\/recipes\/article_content_type to the recipes: list/);
});

// ---- probes that read nothing, and packs in which nothing tells Before from After ----
const FIXP = (n) => fs.readFileSync(path.join(labRoot, `tests/issue-pack/fixtures/packs/${n}`), 'utf8');
const wMsg = (res, re) => res.warnings.find((w) => re.test(w.msg));

test('a real chat draft whose only check is the probe "true" gets the warning against that check', () => {
  const r = run(FIXP('llm-draft-constant-probe.yml'));
  assert.deepEqual(r.errors, []);
  const w = wMsg(r, /does not read anything from the page/);
  assert.ok(w); assert.equal(w.at, 'variant.checks[0].probe');
});

test('probes that name the page are not flagged, including every check already in the repo and the worked example', () => {
  for (const v of variants()) for (const [i, c] of (v.checks || []).entries()) { const r = run((() => { const p = base(); p.variant.checks[0].probe = c.probe; return p; })()); assert.equal(wMsg(r, /does not read anything/), undefined, `${v.slug} check ${i}`); }
  assert.deepEqual(run(example).warnings, []);
});

test('other constant probes are flagged too: false, a number, a comparison of literals, typeof of a literal', () => {
  for (const probe of ['false', '1 === 1', "'a' === 'a'", '42', "typeof 'x' === 'string'"]) {
    const p = base(); p.variant.checks[0].probe = probe; assert.ok(wMsg(run(p), /does not read anything from the page/), probe);
  }
});

test('a real chat draft in which both manual questions expect the same answer on both sides and there is no check gets the warning', () => {
  const r = run(FIXP('llm-draft-nothing-tells-before-from-after.yml'));
  assert.deepEqual(r.errors, []);
  const w = wMsg(r, /nothing in this pack can tell Before from After/); assert.ok(w); assert.equal(w.at, 'variant');
});

test('the warning goes away with a fix check or with a question whose answer differs, and the repair message explains it', () => {
  const p = JSON.parse(JSON.stringify(yaml.load(FIXP('llm-draft-nothing-tells-before-from-after.yml'), { schema: yaml.CORE_SCHEMA })));
  const a = structuredClone(p); a.variant.observe[0].expectAfter = false; assert.equal(wMsg(run(a), /nothing in this pack can tell/), undefined);
  const b = structuredClone(p); b.variant.checks = [{ label: 'the wrapper exists', probe: "document.querySelector('.x') !== null", expect: true, kind: 'fix' }]; assert.equal(wMsg(run(b), /nothing in this pack can tell/), undefined);
  assert.match(repairMessage(run(FIXP('llm-draft-nothing-tells-before-from-after.yml'))), /nothing in this pack can tell Before from After[^\n]*\n   What to do: Add a fix check that compares something the change adds or alters, or a manual question/);
  assert.match(repairMessage(run(FIXP('llm-draft-constant-probe.yml'))), /does not read anything from the page[^\n]*\n   What to do: Replace it with a probe that looks at the page/);
});

test('validate prints what the pack can test: counts of automatic checks, differing questions and recipe content', () => {
  const out = (n) => spawnSync('node', [path.join(labRoot, 'scripts/issue-pack.mjs'), 'validate', path.join(labRoot, `tests/issue-pack/fixtures/packs/${n}`)], { encoding: 'utf8' }).stdout;
  const a = out('llm-draft-nothing-tells-before-from-after.yml');
  assert.match(a, /What this pack can test:\n  automatic checks: 0 \(precondition 0, fix 0, regression 0\)\n  manual questions that expect a different answer on Before and After: 0 of 2\n  recipe: applies 0 other recipe\(s\), no config section, 0 config file\(s\)/);
  const b = out('llm-draft-constant-probe.yml');
  assert.match(b, /automatic checks: 1 \(precondition 1, fix 0, regression 0\)/); assert.match(b, /different answer on Before and After: 1 of 1/); assert.match(b, /applies 1 other recipe\(s\)/);
});
