// Tests for tools/compare/hosts.mjs (AI-usage Phase 5): the hosts a build needs, and a blocked one is named before the build starts.
// The probe is injected, so nothing here needs a network; one case uses a name that cannot resolve (.invalid, RFC 2606).
import test from 'node:test';
import assert from 'node:assert/strict';
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

test('the real probe says not reachable for a name that cannot resolve', async () => {
  const r = await httpsProbe('lab-no-such-host.invalid', 4000);
  assert.equal(r.ok, false); assert.match(r.detail, /ENOTFOUND|EAI_AGAIN|ECONN|no answer/);
});
