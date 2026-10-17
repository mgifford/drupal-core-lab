// Real local HTTP security checks; no DDEV or browser required.
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';

test('media API retains Host/Origin guards and serves the browser-safe schema', { timeout: 15000 }, async () => {
  const port = 20000 + Math.floor(Math.random() * 25000);
  const child = spawn(process.execPath, ['tools/compare/serve.mjs'], { cwd: fileURLToPath(new URL('../..', import.meta.url)), env: { ...process.env, PORT: String(port), LAB_BIND: '127.0.0.1' }, stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  for (const stream of [child.stdout, child.stderr]) stream.on('data', data => { output = (output + data).slice(-6000); });
  const exit = once(child, 'exit');
  const raw = (method, route, headers = {}, body = '') => new Promise((resolve, reject) => {
    const q = http.request({ host: '127.0.0.1', port, path: route, method, headers: { host: `localhost:${port}`, ...headers } }, r => { let text = ''; r.on('data', c => text += c); r.on('end', () => resolve({ code: r.statusCode, text })); });
    q.on('error', reject); q.end(body);
  });
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Viewer did not start within 8 seconds. Startup output:\n' + output)), 8000);
      child.stdout.on('data', data => { if (output.includes('compare:')) { clearTimeout(timer); resolve(); } });
      child.once('error', reject);
      child.once('exit', code => { clearTimeout(timer); reject(new Error(`Viewer exited ${code}. Startup output:\n${output}`)); });
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

// A populated Lab with slow DDEV must still serve its viewer/API immediately.
test('viewer listens before slow DDEV lookups and warms only the selected pair', { timeout: 10000 }, async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'viewer-startup-'));
  let child, exited;
  try {
    const compare = path.join(root, 'tools/compare'); fs.mkdirSync(compare, { recursive: true });
    const original = fileURLToPath(new URL('../../tools/compare/', import.meta.url));
    for (const name of fs.readdirSync(original).filter(name => name.endsWith('.mjs'))) fs.copyFileSync(path.join(original, name), path.join(compare, name));
    const variant = (slug, before, after) => ({ slug, before: { env: before }, after: { env: after } });
    fs.writeFileSync(path.join(compare, 'variants.json'), JSON.stringify([variant('selected', 'one', 'two'), variant('unselected', 'three', 'four')]));
    for (const env of ['one', 'two', 'three', 'four']) {
      const config = path.join(root, 'envs', env, '.ddev'); fs.mkdirSync(config, { recursive: true });
      fs.writeFileSync(path.join(config, 'config.yaml'), 'name: startup-test\n');
    }
    const bin = path.join(root, 'bin'); fs.mkdirSync(bin);
    const calls = path.join(root, 'calls.txt');
    fs.writeFileSync(path.join(bin, 'ddev'), `#!/usr/bin/env node
const fs = require('node:fs'), path = require('node:path');
fs.appendFileSync(process.env.STARTUP_TEST_CALLS, path.basename(process.cwd()) + '\\n');
setTimeout(() => console.log(JSON.stringify({raw:{hostname:'fixture.test'}})), 2500);
`, { mode: 0o755 });
    const port = 20000 + Math.floor(Math.random() * 25000);
    const env = { ...process.env, PORT: String(port), LAB_BIND: '127.0.0.1', PATH: bin + path.delimiter + process.env.PATH, STARTUP_TEST_CALLS: calls };
    for (const key of ['COMPARE_DDEV', 'LAB_BEFORE_ORIGIN', 'LAB_AFTER_ORIGIN', 'LAB_EXTRA_ORIGINS']) delete env[key];
    child = spawn(process.execPath, ['tools/compare/serve.mjs', 'selected'], { cwd: root, env, stdio: ['ignore', 'pipe', 'pipe'] });
    exited = once(child, 'exit');
    let output = '';
    for (const stream of [child.stdout, child.stderr]) stream.on('data', data => { output = (output + data).slice(-6000); });
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Startup waited for DDEV. Output:\n' + output)), 2000);
      child.stdout.on('data', () => { if (output.includes('compare:')) { clearTimeout(timer); resolve(); } });
      child.once('error', error => { clearTimeout(timer); reject(error); });
      child.once('exit', code => { clearTimeout(timer); reject(new Error(`Viewer exited ${code}: ${output}`)); });
    });
    // Child startup can race with its DDEV subprocess scheduling; wait only for
    // their invocation records, never for the deliberately delayed responses.
    const deadline = Date.now() + 1500;
    while ((!fs.existsSync(calls) || fs.readFileSync(calls, 'utf8').trim().split(/\s+/).length < 2) && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 20));
    assert.deepEqual(fs.readFileSync(calls, 'utf8').trim().split(/\s+/).sort(), ['one', 'two']);
  } finally {
    if (child && child.exitCode === null && child.signalCode === null) child.kill('SIGTERM');
    if (exited) await exited;
    fs.rmSync(root, { recursive: true, force: true });
  }
});
