// A Coder workspace name may have capitals ("Compare"), but browsers send hostnames in lower case (Host, Origin, ancestorOrigins).
// The viewer must accept its own page at the lower-case address however the origins were typed, and must say that no browser window
// can be opened from a cloud workspace. Real local HTTP; no DDEV or browser.
//   node --test tests/lab/cloud-origins.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { noWindowReason } from '../../tools/compare/browser-launch.mjs';

const labRoot = fileURLToPath(new URL('../..', import.meta.url));

test('viewer: origins typed with capitals still accept the browser\'s lower-case Host and Origin', { timeout: 15000 }, async () => {
  const port = 20000 + Math.floor(Math.random() * 25000);
  const app = (project) => `https://${project}--Compare--Mike.coder.example`;   // as start-viewer.sh built them from CODER_WORKSPACE_NAME
  const env = { ...process.env, PORT: String(port), LAB_BIND: '127.0.0.1', LAB_EXTRA_ORIGINS: app('drupal-compare'), LAB_BEFORE_ORIGIN: app('drupal-compare-before'), LAB_AFTER_ORIGIN: app('drupal-compare-after'), CODER_AGENT_URL: 'https://coder.example' };
  const child = spawn(process.execPath, ['tools/compare/serve.mjs'], { cwd: labRoot, env, stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  for (const stream of [child.stdout, child.stderr]) stream.on('data', (data) => { output = (output + data).slice(-6000); });
  const exit = once(child, 'exit');
  const browserHost = 'drupal-compare--compare--mike.coder.example';
  const raw = (method, route, headers = {}, body = '') => new Promise((resolve, reject) => {
    const q = http.request({ host: '127.0.0.1', port, path: route, method, headers: { host: browserHost, ...headers } }, (r) => { let text = ''; r.on('data', (c) => (text += c)); r.on('end', () => resolve({ code: r.statusCode, text })); });
    q.on('error', reject); q.end(body);
  });
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Viewer did not start within 8 seconds. Output:\n' + output)), 8000);
      child.stdout.on('data', () => { if (output.includes('compare:')) { clearTimeout(timer); resolve(); } });
      child.once('exit', (code) => { clearTimeout(timer); reject(new Error(`Viewer exited ${code}. Output:\n${output}`)); });
    });
    const sameOrigin = { origin: `https://${browserHost}`, 'sec-fetch-site': 'same-origin' };
    const post = await raw('POST', '/api/state', sameOrigin, '{}');
    assert.equal(post.code, 200, `the viewer refused its own page: ${post.text}`);
    const v = JSON.parse((await raw('GET', '/variants.json', sameOrigin)).text);
    assert.deepEqual(v.origins, { before: 'https://drupal-compare-before--compare--mike.coder.example', after: 'https://drupal-compare-after--compare--mike.coder.example' });
    assert.equal((await raw('POST', '/api/state', { origin: 'https://evil.example' }, '{}')).code, 403, 'other origins are still refused');
    // The site proxies answer only their own hostname (DNS rebinding); the right one passes in any letter case and reaches the
    // site lookup, which fails here with "Not built" (no DDEV).
    const proxy = (host) => new Promise((resolve, reject) => { const q = http.request({ host: '127.0.0.1', port: port + 1, path: '/user/login', headers: { host } }, (r) => { r.resume(); r.on('end', () => resolve(r.statusCode)); }); q.on('error', reject); q.end(); });
    assert.equal(await proxy('attacker.example'), 403, 'a foreign Host is refused by the before proxy');
    assert.equal(await proxy('127.0.0.1:' + (port + 1)), 403, 'so is the bare address');
    assert.equal(await proxy('drupal-compare-before--compare--mike.coder.example'), 502, 'its own hostname reaches the site lookup');
    assert.equal(await proxy('Drupal-Compare-Before--Compare--Mike.coder.example'), 502, 'in any letter case');
    // A window opened from a cloud workspace would be on the remote machine: the viewer is told why, and opening one is refused.
    assert.match(v.noWindow, /cloud workspace/);
    const open = await raw('POST', '/api/emulation', sameOrigin, JSON.stringify({ open: true, mode: 'normal' }));
    assert.equal(open.code, 400); assert.match(JSON.parse(open.text).error, /cannot open: this lab runs in a cloud workspace.*DevTools > More tools > Rendering/);
  } finally { child.kill('SIGTERM'); await exit; }
});

test('viewer: a headless emulation window (scripted checks) is not refused on a machine without a display', { timeout: 15000 }, async () => {
  const port = 20000 + Math.floor(Math.random() * 25000);
  const env = { ...process.env, PORT: String(port), LAB_BIND: '127.0.0.1', LAB_EMULATION_HEADLESS: '1', CODER_AGENT_URL: 'https://coder.example' };
  for (const key of ['LAB_EXTRA_ORIGINS', 'LAB_BEFORE_ORIGIN', 'LAB_AFTER_ORIGIN']) delete env[key];
  const child = spawn(process.execPath, ['tools/compare/serve.mjs'], { cwd: labRoot, env, stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  for (const stream of [child.stdout, child.stderr]) stream.on('data', (data) => { output = (output + data).slice(-6000); });
  const exit = once(child, 'exit');
  try {
    for (let i = 0; i < 40 && !output.includes('compare:'); i++) await new Promise((r) => setTimeout(r, 200));
    const body = await new Promise((resolve, reject) => http.get({ host: '127.0.0.1', port, path: '/variants.json', headers: { host: `localhost:${port}` } }, (r) => { let t = ''; r.on('data', (c) => (t += c)); r.on('end', () => resolve(t)); }).on('error', reject));
    assert.equal(JSON.parse(body).noWindow, '');
  } finally { child.kill('SIGTERM'); await exit; }
});

// The site proxies answer only their own hostname, in each way the lab runs: localhost ports, local DDEV (nginx in tools/compare/site
// forwards Host drupal-compare-before.ddev.site) and DDEV Coder (covered above). A request that gets past the check reaches the site
// lookup, which fails here with "Not built" (502): no DDEV sites in a test.
for (const [mode, env, own, foreign] of [
  ['localhost', {}, (port) => `before.localhost:${port + 1}`, (port) => `localhost:${port + 1}`],
  ['local DDEV', { COMPARE_DDEV: '1' }, () => 'drupal-compare-before.ddev.site', () => 'drupal-compare.ddev.site'],
]) {
  test(`site proxy, ${mode}: its own hostname passes, any other is refused`, { timeout: 15000 }, async () => {
    const port = 20000 + Math.floor(Math.random() * 25000);
    const childEnv = { ...process.env, PORT: String(port), LAB_BIND: '127.0.0.1', ...env };
    for (const key of ['LAB_EXTRA_ORIGINS', 'LAB_BEFORE_ORIGIN', 'LAB_AFTER_ORIGIN', 'CODER_AGENT_URL', ...(env.COMPARE_DDEV ? [] : ['COMPARE_DDEV'])]) delete childEnv[key];
    const child = spawn(process.execPath, ['tools/compare/serve.mjs'], { cwd: labRoot, env: childEnv, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    for (const stream of [child.stdout, child.stderr]) stream.on('data', (data) => { output = (output + data).slice(-6000); });
    const exit = once(child, 'exit');
    const proxy = (host) => new Promise((resolve, reject) => { const q = http.request({ host: '127.0.0.1', port: port + 1, path: '/user/login', headers: { host } }, (r) => { r.resume(); r.on('end', () => resolve(r.statusCode)); }); q.on('error', reject); q.end(); });
    try {
      for (let i = 0; i < 40 && !output.includes('compare:'); i++) await new Promise((r) => setTimeout(r, 200));
      assert.equal(await proxy(own(port)), 502, `${own(port)} reaches the site lookup`);
      assert.equal(await proxy(own(port).toUpperCase()), 502, 'in any letter case');
      assert.equal(await proxy(foreign(port)), 403, `${foreign(port)} is refused`);
      assert.equal(await proxy('attacker.example'), 403);
    } finally { child.kill('SIGTERM'); await exit; }
  });
}

test('noWindowReason: a cloud workspace or a Linux machine without a display cannot show a window', () => {
  assert.match(noWindowReason({ platform: 'linux', env: { CODER_AGENT_URL: 'https://coder.example', DISPLAY: ':0' } }), /cloud workspace/);
  assert.match(noWindowReason({ platform: 'darwin', env: { CODESPACES: 'true' } }), /cloud workspace/);
  assert.match(noWindowReason({ platform: 'linux', env: {} }), /no display/);
  assert.equal(noWindowReason({ platform: 'linux', env: { WAYLAND_DISPLAY: 'wayland-0' } }), '');
  assert.equal(noWindowReason({ platform: 'darwin', env: {} }), '');
});

test('start-viewer.sh, cloud-smoke.mjs and test-mr.mjs build Coder app addresses in lower case', () => {
  const sh = spawnSync('bash', ['-c', `source <(sed -n '/^DOMAIN=/,/^APP()/p' tools/compare/cloud/start-viewer.sh) && APP drupal-compare`],
    { cwd: labRoot, encoding: 'utf8', env: { ...process.env, CODER_WORKSPACE_NAME: 'Compare', CODER_WORKSPACE_OWNER_NAME: 'Mike', CODER_AGENT_URL: 'https://Coder.Example/' } });
  assert.equal(sh.stdout.trim(), 'https://drupal-compare--compare--mike.coder.example', sh.stderr);
  for (const file of ['scripts/cloud-smoke.mjs', 'scripts/test-mr.mjs']) {
    const text = fs.readFileSync(path.join(labRoot, file), 'utf8');
    assert.match(text, /--\$\{(?:ws|process\.env\.CODER_WORKSPACE_NAME)\}--[^\n]*\.toLowerCase\(\)/, `${file} lower-cases the app address`);
  }
});
