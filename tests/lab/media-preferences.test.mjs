import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { defaults, mergePreferences, mediaFeatures, applyPreferences, observePreferences, FEATURES } from '../../tools/compare/media-preferences.mjs';

test('combine preferences, change one without clearing others, then return one to the browser default', () => {
  const first = mergePreferences(defaults(), { forcedColors: 'active', colorScheme: 'dark', reducedMotion: 'reduce' });
  const second = mergePreferences(first, { contrast: 'less' });
  assert.deepEqual(mediaFeatures(second), [
    { name: 'prefers-color-scheme', value: 'dark' }, { name: 'forced-colors', value: 'active' },
    { name: 'prefers-contrast', value: 'less' }, { name: 'prefers-reduced-motion', value: 'reduce' },
  ]);
  assert.equal(mergePreferences(second, { reducedMotion: null }).forcedColors, 'active');
  assert.equal(mediaFeatures(defaults()).length, 0);
});
test('reject unsupported features, arbitrary queries, malformed bodies and values before sending anything to Chromium', async () => {
  let calls = 0; const session = { send: async () => { calls++; } };
  for (const patch of [[], null, { unknown: 'reduce' }, { contrast: 'high' }, { colorScheme: '__proto__' }]) {
    await assert.rejects(applyPreferences(session, defaults(), patch, {}));
  }
  await assert.rejects(applyPreferences(session, defaults(), { reducedData: 'reduce' }, { reducedData: false }), /not supported/);
  assert.equal(calls, 0);
  assert.equal(mergePreferences(defaults(), { reducedData: null }, { reducedData: false }).reducedData, null);
});
test('failed CDP calls preserve prior settings; successful calls send the complete combined feature list', async () => {
  const old = mergePreferences(defaults(), { reducedMotion: 'reduce' });
  await assert.rejects(applyPreferences({ send: async () => { throw new Error('disconnected'); } }, old, { colorScheme: 'dark' }, {}), /disconnected/);
  assert.equal(old.colorScheme, null);
  const calls = [];
  const next = await applyPreferences({ send: async (...args) => { calls.push(args); } }, old, { contrast: 'more' }, {});
  assert.equal(next.reducedMotion, 'reduce');
  assert.deepEqual(calls, [['Emulation.setEmulatedMedia', { features: [{ name: 'prefers-contrast', value: 'more' }, { name: 'prefers-reduced-motion', value: 'reduce' }] }]]);
});
test('an unknown media query is marked unsupported instead of pretending the default matched', () => {
  globalThis.matchMedia = q => ({ matches: ['(prefers-color-scheme: dark)', '(prefers-reduced-motion: reduce)'].includes(q) });
  try {
    const observed = observePreferences(FEATURES);
    assert.deepEqual(observed.colorScheme, { supported: true, value: 'dark' });
    assert.deepEqual(observed.invertedColors, { supported: false, value: null });
  } finally { delete globalThis.matchMedia; }
});
test('every preference has a labelled control and the observed values table is separate from requested overrides', () => {
  const html = fs.readFileSync(new URL('../../tools/compare/index.html', import.meta.url), 'utf8');
  for (const key of Object.keys(FEATURES)) {
    assert.ok(html.includes(`for="media-${key}"`));
    assert.ok(html.includes(`id="media-${key}" data-media="${key}"`));
  }
  assert.match(html, /Actual media-query values in each frame/);
  assert.match(html, /id="emulopen"/); assert.match(html, /id="emulbox"/);
});
