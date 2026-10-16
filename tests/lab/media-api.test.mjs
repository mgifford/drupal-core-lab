// Real local HTTP security checks; no DDEV or browser required.
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';

test('media API retains Host/Origin guards and serves the browser-safe schema', { timeout: 15000 }, async () => {
  const port = 20000 + Math.floor(Math.random() * 25000);
  const child = spawn(process.execPath, ['tools/compare/serve.mjs'], { cwd: fileURLToPath(new URL('../..', import.meta.url)), env: { ...process.env, PORT: String(port), LAB_BIND: '127.0.0.1' }, stdio: ['ignore', 'pipe', 'pipe'] });
  const exit = once(child, 'exit');
  const raw = (method, route, headers = {}, body = '') => new Promise((resolve, reject) => {
    const q = http.request({ host: '127.0.0.1', port, path: route, method, headers: { host: `localhost:${port}`, ...headers } }, r => { let text = ''; r.on('data', c => text += c); r.on('end', () => resolve({ code: r.statusCode, text })); });
    q.on('error', reject); q.end(body);
  });
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Viewer did not start')), 8000);
      child.stdout.on('data', data => { if (String(data).includes('compare:')) { clearTimeout(timer); resolve(); } });
      child.once('error', reject);
      child.once('exit', code => { clearTimeout(timer); reject(new Error(`Viewer exited ${code}`)); });
    });
    assert.equal((await raw('GET', '/media-preferences.mjs')).code, 200);
    assert.equal((await raw('POST', '/api/emulation', { origin: 'https://evil.example' }, '{}')).code, 403);
    assert.equal((await raw('POST', '/api/emulation', { host: 'evil.example' }, '{}')).code, 403);
    assert.equal((await raw('POST', '/api/emulation', { 'sec-fetch-site': 'cross-site' }, '{}')).code, 403);
    assert.equal((await raw('POST', '/api/emulation', {}, '{')).code, 400);
    assert.equal((await raw('POST', '/api/emulation', {}, JSON.stringify({ preferences: { reducedMotion: 'reduce' } }))).code, 400);
    const state = JSON.parse((await raw('GET', '/api/emulation')).text);
    assert.equal(state.open, false);
    assert.ok(Object.values(state.preferences).every(value => value === null));
  } finally { child.kill('SIGTERM'); await exit; }
});
