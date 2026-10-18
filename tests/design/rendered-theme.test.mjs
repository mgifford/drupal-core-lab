import test from 'node:test';
import assert from 'node:assert/strict';
import { assessRenderedTheme, checkRenderedTheme } from '../../tools/playwright/lib/rendered-theme.mjs';
test('missing actual theme is unverified despite supporting stylesheet evidence', () => {
  const result = assessRenderedTheme({ theme: null, source: 'unavailable', path: '/admin', themeAssets: [{ name: 'default_admin' }] }, 'default_admin');
  assert.equal(result.status, 'unverified'); assert.equal(result.actual, null);
});
test('explicit hints distinguish confirmed and mismatching themes', () => {
  assert.equal(assessRenderedTheme({ theme: 'default_admin', source: 'settings-json' }, 'default_admin').status, 'confirmed');
  assert.equal(assessRenderedTheme({ theme: 'other', source: 'drupalSettings' }, 'default_admin').status, 'mismatch');
});
test('deferred hints can resolve; genuine absence remains unverified after bounded wait', async () => {
  let calls = 0;
  const deferred = { evaluate: async () => ({ theme: calls++ ? 'default_admin' : null, source: 'drupalSettings' }), waitForFunction: async () => {} };
  assert.equal((await checkRenderedTheme(deferred, 'default_admin')).status, 'confirmed');
  const missing = { evaluate: async () => ({ theme: null, source: 'unavailable' }), waitForFunction: async () => { const e = new Error('timeout'); e.name = 'TimeoutError'; throw e; } };
  assert.equal((await checkRenderedTheme(missing, 'default_admin')).status, 'unverified');
});
test('wrong themes and page failures are still errors', async () => {
  await assert.rejects(checkRenderedTheme({ evaluate: async () => ({ theme: 'other', source: 'drupalSettings' }) }, 'default_admin'), /Expected default_admin, got other/);
  await assert.rejects(checkRenderedTheme({ evaluate: async () => ({ theme: null }), waitForFunction: async () => { throw new Error('Page closed'); } }, 'default_admin'), /Page closed/);
});
