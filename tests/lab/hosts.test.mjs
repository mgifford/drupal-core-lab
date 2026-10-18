// Tests for tools/compare/hosts.mjs (AI-usage Phase 5): the hosts a build needs, and a blocked one is named before the build starts.
// Both the host probe and its HTTPS transport are injected. Static tests require no external network.
import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { hostsFor, checkHosts, httpsProbe, DEFAULT_CORE_URL } from '../../tools/compare/hosts.mjs';

const names = (l) => l.map((h) => h.host);

test('a core-only variant needs drupalcode for core, plus Composer, npm and GitHub', () => {
  assert.deepEqual(names(hostsFor({ core: { url: DEFAULT_CORE_URL } })), ['git.drupalcode.org', 'repo.packagist.org', 'github.com', 'registry.npmjs.org']);
  assert.deepEqual(names(hostsFor({})), names(hostsFor({ core: { url: DEFAULT_CORE_URL } })), 'no core.url means the default');
});

test('a contrib module adds its own host, and says it has no mirror option', () => {
  const h = hostsFor({ core: {}, contrib: [{ name: 'toolbar', url: 'https://git.drupalcode.org/project/toolbar.git' }, { name: 'x', url: 'https://example.test/x.git' }] });
  assert.deepEqual(names(h), ['git.drupalcode.org', 'example.test', 'repo.packagist.org', 'github.com', 'registry.npmjs.org']);
  const dc = h.find((x) => x.host === 'git.drupalcode.org'); assert.equal(dc.why.length, 2); assert.match(dc.why.join(), /contrib module toolbar.*no mirror option/);
});

test('a core mirror replaces the core host but not the contrib one', () => {
  const h = hostsFor({ core: {}, contrib: [{ name: 'toolbar', url: 'https://git.drupalcode.org/project/toolbar.git' }] }, { coreUrl: 'https://github.com/drupal/drupal.git' });
  assert.deepEqual(h.find((x) => x.host === 'git.drupalcode.org').why.map((w) => w.split(' ')[0]), ['contrib']);
  assert.match(h.find((x) => x.host === 'github.com').why.join(), /Drupal core/);
});

test('checkHosts reports each host with the probe\'s answer, and a blocked one is not hidden', async () => {
  const blocked = new Set(['git.drupalcode.org', 'repo.packagist.org']);
  const r = await checkHosts(hostsFor({ core: {} }), async (host) => (blocked.has(host) ? { ok: false, detail: 'ECONNRESET' } : { ok: true, detail: 'HTTP 200' }));
  assert.deepEqual(r.filter((x) => !x.ok).map((x) => x.host), ['git.drupalcode.org', 'repo.packagist.org']); assert.equal(r.length, 4);
  assert.equal(r.find((x) => x.host === 'git.drupalcode.org').detail, 'ECONNRESET'); assert.ok(r.every((x) => Array.isArray(x.why) && x.why.length));
});

const transport = action => (options, callback) => {
  const request = new EventEmitter(); request.destroy = () => {}; request.end = () => queueMicrotask(() => action(request, callback, options)); return request;
};
test('the HTTPS probe reports a DNS error without relying on external DNS or proxies', async () => {
  const result = await httpsProbe('lab-no-such-host.invalid', 4000, transport(request => request.emit('error', { code: 'ENOTFOUND' })));
  assert.equal(result.ok, false); assert.equal(result.detail, 'ENOTFOUND');
});
test('the HTTPS probe counts an HTTP response as reachable, including denied responses', async () => {
  let drained = false;
  const result = await httpsProbe('example.test', 4000, transport((request, callback, options) => {
    assert.equal(options.method, 'HEAD'); assert.equal(options.timeout, 4000);
    callback({ statusCode: 403, resume() { drained = true; } });
  }));
  assert.equal(result.ok, true); assert.equal(result.detail, 'HTTP 403'); assert.equal(drained, true);
});
test('the HTTPS probe reports a timeout and closes the request', async () => {
  let destroyed = false;
  const result = await httpsProbe('example.test', 4000, transport(request => { request.destroy = () => { destroyed = true; }; request.emit('timeout'); }));
  assert.equal(result.ok, false); assert.match(result.detail, /no answer in 4 s/); assert.equal(destroyed, true);
});
