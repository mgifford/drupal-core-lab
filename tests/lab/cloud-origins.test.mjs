// A Coder workspace name may have capitals ("Compare"), but browsers send hostnames in lower case (Host, Origin, ancestorOrigins).
// The viewer must accept its own page at the lower-case address however the origins were typed. Real local HTTP; no DDEV or browser.
//   node --test tests/lab/cloud-origins.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';

const labRoot = fileURLToPath(new URL('../..', import.meta.url));

test('viewer: origins typed with capitals still accept the browser\'s lower-case Host and Origin', { timeout: 15000 }, async () => {
  const port = 20000 + Math.floor(Math.random() * 25000);
  const app = (project) => `https://${project}--Compare--Mike.coder.example`;   // as start-viewer.sh built them from CODER_WORKSPACE_NAME
  const env = { ...process.env, PORT: String(port), LAB_BIND: '127.0.0.1', LAB_EXTRA_ORIGINS: app('drupal-compare'), LAB_BEFORE_ORIGIN: app('drupal-compare-before'), LAB_AFTER_ORIGIN: app('drupal-compare-after') };
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
  } finally { child.kill('SIGTERM'); await exit; }
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
