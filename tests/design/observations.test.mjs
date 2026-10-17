import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import { browserThemeContext } from '../../tools/compare/theme-context.mjs';
import { compareObservations, printDelta } from '../../tools/playwright/lib/design-observations.mjs';
const obs = (theme, nodes) => ({ context: { theme }, nodes });
const node = (key, hidden = false, weight = '400') => ({ key, hidden, tag: 'p', style: { fontWeight: weight } });
test('theme metadata preserves distinct contrast modes and redacts reset paths', () => {
  const result = vm.runInNewContext('(' + browserThemeContext.toString() + ')()', {
    window: { drupalSettings: { ajaxPageState: { theme: 'default_admin' } } },
    document: { documentElement: { lang: 'fa', dir: 'rtl', classList: ['high-contrast', 'dark-mode', 'other'] } },
    location: { pathname: '/user/reset/1/secret/login' },
    matchMedia: query => ({ matches: query === '(forced-colors: active)' || query === '(prefers-contrast: more)' }),
  });
  assert.equal(result.path, '/[one-time-login]'); assert.equal(result.theme, 'default_admin');
  assert.equal(result.forcedColors, true); assert.equal(result.prefersContrast, 'more'); assert.equal(result.darkPreference, false);
  assert.equal(result.themeModeMarkers.join(','), 'high-contrast,dark-mode');
});
test('unknown theme remains unknown, not configured-theme fallback', () => {
  const result = vm.runInNewContext('(' + browserThemeContext.toString() + ')()', {
    window: {}, document: { documentElement: { lang: '', dir: 'ltr', classList: [] }, querySelector: () => null },
    location: { pathname: '/user/login' }, matchMedia: () => ({ matches: false }),
  });
  assert.equal(result.theme, null); assert.equal(result.source, 'unavailable');
});
test('paired findings match by identity, not equal totals', () => {
  const delta = compareObservations(obs('a', [node('old')]), obs('b', [node('new')]));
  assert.equal(delta.themeChanged, true); assert.equal(delta.changes.length, 2);
  assert.deepEqual(delta.changes.map(row => row.kind), ['unmatched-before', 'unmatched-after']);
});
test('print content removals, additions and styling are separate observations', () => {
  const s = obs('a', [node('hidden'), node('shown', true), node('style')]);
  const p = obs('a', [node('hidden', true), node('shown'), node('style', false, '700')]);
  const delta = printDelta(s, p);
  assert.deepEqual(delta.hiddenInPrint, ['hidden']); assert.deepEqual(delta.revealedInPrint, ['shown']);
  assert.equal(delta.changes.length, 3);
});
test('unchanged snapshot does not produce a false difference', () => {
  const s = obs('a', [node('same')]); assert.equal(compareObservations(s, s).changes.length, 0);
});
test('actual serialized proxy script parses, including theme-context probe', () => {
  const source = fs.readFileSync(new URL('../../tools/compare/serve.mjs', import.meta.url), 'utf8');
  const start = source.indexOf('const SYNC = '), end = source.indexOf('\nfunction proxyFor', start);
  assert.ok(start >= 0 && end > start);
  const sync = vm.runInNewContext(source.slice(start, end) + '\nSYNC', { VIEWER_ORIGINS: ['http://localhost:8100'], browserThemeContext });
  const script = sync('before', { theme: 'auto' }).replace(/^<script>/, '').replace(/<\/script>$/, '');
  new vm.Script(script); assert.ok(script.includes('theme-context'));
});

test('reduced motion is independent of contrast and unsupported preferences stay unknown', () => {
  const result = vm.runInNewContext('(' + browserThemeContext.toString() + ')()', {
    window: {}, document: { documentElement: { lang: 'en', dir: 'ltr', classList: [] }, querySelector: () => null },
    location: { pathname: '/' }, matchMedia: query => ({ matches: query === '(prefers-reduced-motion: reduce)' || query === '(prefers-contrast: no-preference)' }),
  });
  assert.equal(result.reducedMotion, 'reduce'); assert.equal(result.prefersContrast, 'no-preference');
  assert.equal(result.forcedColors, false); assert.equal(result.reducedTransparency, null); assert.equal(result.reducedData, null);
});

const referenceNode = (id, overrides = {}) => ({ ...node('nav'), references: { 'aria-labelledby': [{ id, exists: true, count: 1,
  target: { key: 'html>body>span', tag: 'span', role: null, textHash: 'same-text', ariaLabelHash: 'no-label', hidden: false, nestedNameReference: false, ...overrides } }] } });
test('generated reference IDs are evidence, not a semantic difference when targets match', () => {
  const delta = compareObservations(obs('a', [referenceNode('random-123456')]), obs('a', [referenceNode('random-789012')]));
  assert.equal(delta.changes.length, 0); assert.equal(delta.referenceIdChanges.length, 1);
});
test('changed target text, changed target location and duplicate IDs remain differences', () => {
  for (const overrides of [{ textHash: 'changed' }, { key: 'other-target' }]) {
    assert.equal(compareObservations(obs('a', [referenceNode('id')]), obs('a', [referenceNode('id', overrides)])).changes.length, 1);
  }
  const duplicate = referenceNode('id'); duplicate.references['aria-labelledby'][0].count = 2;
  assert.equal(compareObservations(obs('a', [referenceNode('id')]), obs('a', [duplicate])).changes.length, 1);
});
test('broken references and ordered targets are never suppressed', () => {
  const broken = referenceNode('id'); broken.references['aria-labelledby'][0] = { id: 'missing', exists: false, count: 0, target: null };
  assert.equal(compareObservations(obs('a', [referenceNode('id')]), obs('a', [broken])).changes.length, 1);
  const ordered = referenceNode('id'); ordered.references['aria-labelledby'].push({ ...ordered.references['aria-labelledby'][0], id: 'second', target: { ...ordered.references['aria-labelledby'][0].target, key: 'second' } });
  const reversed = structuredClone(ordered); reversed.references['aria-labelledby'].reverse();
  assert.equal(compareObservations(obs('a', [ordered]), obs('a', [reversed])).changes.length, 1);
});
test('older snapshots without target signatures retain raw reference differences', () => {
  const b = referenceNode('id'), a = referenceNode('other');
  delete b.references['aria-labelledby'][0].target; delete a.references['aria-labelledby'][0].target;
  assert.equal(compareObservations(obs('a', [b]), obs('a', [a])).changes.length, 1);
});
test('nested ARIA naming references retain raw differences for separate name review', () => {
  assert.equal(compareObservations(obs('a', [referenceNode('id', { nestedNameReference: true })]), obs('a', [referenceNode('other', { nestedNameReference: true })])).changes.length, 1);
});
test('print summary separates restyling and visibility with deliberate positive and unchanged controls', () => {
  const original = obs('a', [node('sample')]);
  assert.equal(printDelta(original, original).restyledInPrint.length, 0);
  const delta = printDelta(original, obs('a', [node('sample', false, '700')]));
  assert.deepEqual(delta.restyledInPrint, ['sample']); assert.deepEqual(delta.hiddenInPrint, []);
});
test('semantic label content changes are detected without recording literal text', () => {
  const b = { ...node('header'), semanticText: { textHash: 'empty' } };
  const a = { ...b, semanticText: { textHash: 'operations' } };
  assert.ok(compareObservations(obs('a', [b]), obs('a', [a])).changes[0].different.semanticText);
});
test('theme asset evidence is supporting only and excludes external URLs and queries', () => {
  const result = vm.runInNewContext('(' + browserThemeContext.toString() + ')()', {
    window: {}, document: { documentElement: { lang: '', dir: 'ltr', classList: [] }, querySelector: () => null,
      querySelectorAll: () => [{ href: 'https://lab.test/core/themes/default_admin/css/base/print.css?token=secret' }, { href: 'https://external.test/themes/fake/style.css' }] },
    URL, location: { pathname: '/user/login', href: 'https://lab.test/user/login', origin: 'https://lab.test' }, matchMedia: () => ({ matches: false }),
  });
  assert.equal(result.theme, null); assert.equal(result.themeAssets[0].name, 'default_admin');
  assert.equal(result.themeAssets[0].confidence, 'supporting-only'); assert.equal(result.themeAssets.length, 1);
  assert.ok(!JSON.stringify(result).includes('secret'));
});
