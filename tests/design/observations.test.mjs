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
