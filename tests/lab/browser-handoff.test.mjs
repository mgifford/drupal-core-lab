import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanHandoff, currentBrowser, handoffHash, readHandoff } from '../../tools/compare/browser-handoff.mjs';
import { installedBrowsers, openBrowser } from '../../tools/compare/browser-launch.mjs';

const snapshot = () => ({ version: 1, slug: '3615469-pinned', paths: { before: '/admin/config/development/maintenance', after: '/admin/config/development/maintenance' }, scroll: { before: { x: 0, y: 840 }, after: { x: 0, y: 840 } }, dock: { tab: 'checks', collapsed: false, large: true }, controls: { width: '768px', view: 'onion', theme: 'dark', dir: 'rtl', mirror: false, syncscroll: true, opacity: 65, amplify: 3, nojs: true }, forcedColors: true });

test('a comparison link round-trips pages, settings, scroll and forced-color notice', () => {
  assert.deepEqual(readHandoff(handoffHash(snapshot())), cleanHandoff(snapshot()));
  assert.equal(readHandoff(''), null);
});
test('handoff excludes arbitrary fields and rejects external paths and login URLs', () => {
  const s = snapshot(); s.password = 'not transferred'; s.controls.password = 'not transferred';
  assert(!JSON.stringify(cleanHandoff(s)).includes('password'));
  for (const path of ['https://example.test/', '//example.test/', '/user/reset/1/token/login', '/?pass-reset-token=value', '/\\example.test']) {
    s.paths.before = path; assert.throws(() => cleanHandoff(s));
  }
});
test('invalid choices are dropped and numeric values are bounded', () => {
  const s = snapshot(); s.controls.width = '100000px'; s.controls.opacity = 999; s.scroll.before.y = -20;
  const out = cleanHandoff(s); assert(!('width' in out.controls)); assert.equal(out.controls.opacity, 100); assert.equal(out.scroll.before.y, 0);
  assert.throws(() => readHandoff('#compare=' + 'x'.repeat(17000)));
});
test('Edge is identified before Chromium; Firefox and Safari are distinct', () => {
  assert.equal(currentBrowser('Chrome/130 Safari/537 Edg/130'), 'edge');
  assert.equal(currentBrowser('Chrome/130 Safari/537'), 'chrome');
  assert.equal(currentBrowser('Firefox/130'), 'firefox');
  assert.equal(currentBrowser('Version/18 Safari/605'), 'safari');
  assert.equal(currentBrowser('CriOS/130 Safari/605'), 'chrome');
});
test('only installed allowlisted browsers are offered, and cloud/headless sessions offer none', () => {
  const options = { platform: 'darwin', env: {}, home: '/Users/test', exists: p => ['/Applications/Safari.app', '/Applications/Firefox.app'].includes(p) };
  assert.deepEqual(installedBrowsers(options).map(b => b.id), ['firefox', 'safari']);
  assert.deepEqual(installedBrowsers({ ...options, env: { CODER_AGENT_URL: 'local-test' } }), []);
  assert.deepEqual(installedBrowsers({ platform: 'linux', env: {} }), []);
});
test('native launch receives a fixed executable and a viewer-only URL as separate arguments', async () => {
  const calls = [];
  await openBrowser('firefox', snapshot(), 'http://localhost:8100', { platform: 'darwin', browsers: [{ id: 'firefox', executable: '/Applications/Firefox.app' }], run: async (...args) => calls.push(args) });
  assert.equal(calls[0][0], '/usr/bin/open');
  assert.deepEqual(calls[0][1].slice(0, 2), ['-a', '/Applications/Firefox.app']);
  const url = new URL(calls[0][1][2]); assert.equal(url.origin, 'http://localhost:8100');
  assert.deepEqual(readHandoff(url.hash), cleanHandoff(snapshot()));
  await assert.rejects(openBrowser('safari', snapshot(), 'http://localhost:8100', { browsers: [] }));
});
