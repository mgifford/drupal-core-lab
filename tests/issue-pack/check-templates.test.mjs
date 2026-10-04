// Tests for the check templates. Run: node --test tests/issue-pack/check-templates.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { labRoot } from '../../tools/compare/lib.mjs';
import { validatePack, loadYaml, checkProbe } from '../../tools/compare/pack-validate.mjs';
import { loadChecks, expandChecks, checkCatalogueText, CHECK_PARAM_TYPES } from '../../tools/compare/pack-checks.mjs';
import { available } from '../../tools/compare/emulation.mjs';

const yaml = loadYaml();
const cat = loadChecks(yaml);
const read = (p) => fs.readFileSync(path.join(labRoot, p), 'utf8');
const free = () => yaml.load(read('tests/issue-pack/fixtures/packs/example-free-form-recipe.yml'), { schema: yaml.CORE_SCHEMA });
const withChecks = (checks) => { const p = free(); p.variant.checks = checks; return validatePack(yaml.dump(p, { lineWidth: -1 }), { yaml }); };
const one = (use, kind, params) => { const r = expandChecks([{ use, kind, params }], cat); assert.deepEqual(r.errors, []); return r.checks[0]; };
const msgs = (r) => r.errors.map((e) => `${e.at}: ${e.msg}`).join('\n');

test('the catalogue loads with no problems and every template says where it was verified', () => {
  assert.deepEqual(cat.problems, []);
  assert.ok(cat.templates.size >= 10);
  for (const t of cat.templates.values()) assert.ok(t.verified.length > 20, t.name);
});

test('every template with typical values expands to a probe that passes the read-only screen', () => {
  const sample = { selector: '.file-upload-messages', what: 'The wrapper', text: 'too large', attribute: 'aria-live', value: 'assertive', field: 'title[0][value]' };
  for (const t of cat.templates.values()) {
    const params = Object.fromEntries(Object.keys(t.params).map((k) => [k, sample[k]]));
    const c = one(t.name, t.kinds[0], params);
    assert.deepEqual(checkProbe(c.probe), [], `${t.name}: ${c.probe}`);
    assert.ok(c.label.length >= 3 && c.label.length <= 200, t.name);
  }
});

test('the label and probe are generated from the same values', () => {
  const c = one('element_text_contains', 'fix', { selector: '#msg > p', what: 'The message', text: 'File too large' });
  assert.equal(c.label, 'The message contains the text File too large');
  assert.ok(c.probe.includes('"#msg > p"') && c.probe.includes('"file too large"'));
  assert.equal(c.expect, true);
});

test('a template check in a pack validates and replaces itself with the generated check', () => {
  const r = withChecks([
    { use: 'element_exists', kind: 'precondition', params: { selector: 'input[type=file]', what: 'The file input' } },
    { use: 'element_exists', kind: 'fix', params: { selector: '.file-upload-messages', what: 'The message wrapper' } },
  ]);
  assert.deepEqual(r.errors, [], msgs(r));
  assert.equal(r.pack.variant.checks[1].probe, 'document.querySelector(".file-upload-messages") !== null');
  assert.ok(!r.warnings.some((w) => /precondition|no fix/.test(w.msg)));
});

test('free-form checks and template checks can be mixed, and positions stay aligned in messages', () => {
  const r = withChecks([
    { label: 'Free form', probe: "document.title.length > 0", expect: true, kind: 'precondition' },
    { use: 'element_exists', kind: 'fix', params: { selector: 'div;alert(1)', what: 'x' } },
  ]);
  assert.match(msgs(r), /variant\.checks\[1\]\.params\.selector: must be a simple CSS selector/);
});

test('bad template use is explained', () => {
  assert.match(msgs(withChecks([{ use: 'nope', kind: 'fix' }])), /not a check template\. Available: .*element_exists/);
  assert.match(msgs(withChecks([{ use: 'no_js_errors', kind: 'fix' }])), /can be used as regression/);
  assert.match(msgs(withChecks([{ use: 'element_exists', kind: 'fix', params: { selector: 'a' } }])), /needs what/);
  assert.match(msgs(withChecks([{ use: 'element_exists', kind: 'fix', params: { selector: 'a', what: 'x y', extra: 1 } }])), /no parameter "extra"/);
  assert.match(msgs(withChecks([{ use: 'element_exists', kind: 'fix', probe: 'true', params: { selector: 'a', what: 'x y' } }])), /not a known key for a template check/);
  assert.match(msgs(withChecks([{ use: 'no_js_errors', kind: 'regression', params: { a: 'b' } }])), /takes none/);
});

test('parameter patterns reject anything that could change the probe', () => {
  const ok = ['a', '.x', '#x', 'div.x > p', 'input[type=file]', 'input[name="title[0][value]"]', '[aria-live]', 'ul li a'];
  const no = ['', 'a;b', 'a, b', 'a:hover', 'a"b', "a'b", 'a`b', 'a\\b', '*', 'a)b', 'a b c d e', '[onclick=alert(1)]', 'a\nb'];
  for (const s of ok) assert.ok(CHECK_PARAM_TYPES.selector.re.test(s), s);
  for (const s of no) assert.ok(!CHECK_PARAM_TYPES.selector.re.test(s), JSON.stringify(s));
  for (const s of ['x"y', 'a\nb', 'a`b', '<b>']) { assert.ok(!CHECK_PARAM_TYPES.text.re.test(s), s); assert.ok(!CHECK_PARAM_TYPES.value.re.test(s), s); }
});

test('the catalogue text lists every template with its parameters', () => {
  const t = checkCatalogueText(cat);
  for (const n of cat.templates.keys()) assert.ok(t.includes(`- ${n}:`), n);
  assert.match(t, /selector \(selector:/);
});

const pw = available();
test('generated probes give the right answers in Chromium', { skip: !pw && 'Playwright is not installed' }, async () => {
  const { chromium } = await import(pathToFileURL(path.join(labRoot, 'tools/playwright/node_modules/@playwright/test/index.mjs')).href);
  let browser; try { browser = await chromium.launch(); } catch (e) { return; } // Chromium itself missing: skip quietly
  try {
    const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
    await page.setContent(`<body><div id="msg" class="file-upload-messages"><p>File is TOO large</p></div>
      <button id="b" aria-expanded="true">Go</button><input name="title[0][value]" id="t" type="file">
      <div role="alert">Upload failed</div><ul><li class="i">1</li><li class="i">2</li></ul>
      <div style="margin-top:3000px" id="far">far</div></body>`);
    const ev = (use, params) => page.evaluate(one(use, cat.templates.get(use).kinds[0], params).probe);
    assert.equal(await ev('element_exists', { selector: '.file-upload-messages', what: 'x y' }), true);
    assert.equal(await ev('element_exists', { selector: '.nope', what: 'x y' }), false);
    assert.equal(await ev('element_absent', { selector: '.nope', what: 'x y' }), true);
    assert.equal(await ev('element_absent', { selector: '#msg', what: 'x y' }), false);
    assert.equal(await ev('element_text_contains', { selector: '#msg p', what: 'x y', text: 'too large' }), true);
    assert.equal(await ev('element_text_contains', { selector: '#msg p', what: 'x y', text: 'fine' }), false);
    assert.equal(await ev('element_text_contains', { selector: '.nope', what: 'x y', text: 'a' }), false);
    assert.equal(await ev('attribute_equals', { selector: '#b', what: 'x y', attribute: 'aria-expanded', value: 'true' }), true);
    assert.equal(await ev('attribute_equals', { selector: '#b', what: 'x y', attribute: 'aria-expanded', value: 'false' }), false);
    assert.equal(await ev('attribute_equals', { selector: '#b', what: 'x y', attribute: 'aria-live', value: 'true' }), false);
    assert.equal(await ev('live_region_has_text', { text: 'upload failed' }), true);
    assert.equal(await ev('live_region_has_text', { text: 'something else' }), false);
    assert.equal(await ev('element_count_same', { selector: '.i', what: 'items' }), 2);
    assert.equal(await ev('element_in_view', { selector: '#b', what: 'x y' }), true);
    assert.equal(await ev('element_in_view', { selector: '#far', what: 'x y' }), false);
    assert.equal(await ev('element_in_view', { selector: '.nope', what: 'x y' }), false);
    assert.equal(await ev('focus_is_on', { selector: '#t', what: 'x y' }), false);
    await page.focus('#t');
    assert.equal(await ev('focus_is_on', { selector: '#t', what: 'x y' }), true);
    await page.evaluate(() => { window.__cmpFocused = ['title[0][value]']; window.__cmpErrors = ['boom', 'ResizeObserver loop limit exceeded']; });
    assert.equal(await ev('focus_was_on', { field: 'title[0][value]' }), true);
    assert.equal(await ev('focus_was_on', { field: 'other' }), false);
    assert.equal(await ev('no_js_errors', {}), 1);
    await page.evaluate(() => { window.__cmpErrors = ['ResizeObserver loop limit exceeded']; });
    assert.equal(await ev('no_js_errors', {}), 0);
  } finally { await browser.close(); }
});

test('a template check that cannot be expanded reports only its own problems', () => {
  const r = withChecks([{ use: 'element_exists', kind: 'fix', params: { selector: 'a', what: 'x'.repeat(70) } }]);
  assert.deepEqual(r.errors.map((e) => e.at), ['variant.checks[0].params.what']);
});

test('a pack cannot skip validation by claiming its check failed to expand', () => {
  const r = withChecks([{ __failed: true, label: 'x y z', probe: 'location.href = "http://evil"', expect: true, kind: 'fix' }]);
  assert.ok(r.errors.some((e) => e.at === 'variant.checks[0].__failed' || /probe/.test(e.at)), msgs(r));
});
