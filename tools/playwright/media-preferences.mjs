// Standalone real-browser check: no Drupal, DDEV or viewer server required.
// node tools/playwright/media-preferences.mjs
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
process.env.LAB_BROWSER_PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), 'lab-media-'));
process.env.LAB_EMULATION_HEADLESS = '1';
const em = await import('../compare/emulation.mjs');
const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.end(req.url === '/' ? '<title>Preferences test</title><iframe src="/before"></iframe><iframe src="/after"></iframe>' : '<style>@media(prefers-reduced-motion:reduce){body{border-style:double}}</style><p>Media query fixture</p>');
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const snapshot = async expected => {
  const state = await em.status();
  assert.equal(state.frames.length, 2);
  for (const frame of state.frames) for (const [key, value] of Object.entries(expected)) assert.equal(frame.media[key].value, value, key);
  return state;
};
try {
  await em.open(`http://127.0.0.1:${server.address().port}/`, 'normal');
  let state = await em.status();
  assert.ok(state.preferences && Object.values(state.preferences).every(value => value === null));
  await em.setPreferences({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await snapshot({ colorScheme: 'dark', reducedMotion: 'reduce' });
  // Trusted keyboard not required for query changes; verify no document reload.
  const frame = em.windowPage().frames()[1];
  await frame.evaluate(() => { window.preferenceTestMarker = 'same document'; });
  await em.setPreferences({ forcedColors: 'active', contrast: 'more' });
  await snapshot({ colorScheme: 'dark', reducedMotion: 'reduce', forcedColors: 'active', contrast: 'more' });
  assert.equal(await frame.evaluate(() => window.preferenceTestMarker), 'same document');
  assert.equal(await frame.evaluate(() => getComputedStyle(document.body).borderTopStyle), 'double');
  // Rapid requests must compose rather than racing to overwrite the whole list.
  await Promise.all([em.setPreferences({ contrast: 'less' }), em.setPreferences({ reducedMotion: 'no-preference' })]);
  await snapshot({ contrast: 'less', reducedMotion: 'no-preference', colorScheme: 'dark' });
  state = await em.status();
  for (const key of ['reducedTransparency', 'reducedData', 'invertedColors']) {
    const value = key === 'invertedColors' ? 'inverted' : 'reduce';
    if (state.supported[key]) { await em.setPreferences({ [key]: value }); await snapshot({ [key]: value }); }
    else await assert.rejects(em.setPreferences({ [key]: value }), /not supported/);
  }
  await em.setMode('forced-light'); await snapshot({ colorScheme: 'light', forcedColors: 'active' });
  assert.equal((await em.status()).preferences.reducedMotion, null);
  await em.setMode('forced-dark'); await snapshot({ colorScheme: 'dark', forcedColors: 'active' });
  await em.setMode('normal');
  assert.ok(Object.values((await em.status()).preferences).every(value => value === null));
  console.log('PASS: both frames, combined preferences, live CSS, no reload, serialized requests, presets, unsupported features, reset');
} finally {
  await em.close(); await new Promise(resolve => server.close(resolve));
  fs.rmSync(process.env.LAB_BROWSER_PROFILE, { recursive: true, force: true });
}
