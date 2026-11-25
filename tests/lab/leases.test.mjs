// Local environment leases: TTL protection, PID-checked protection, expiry/staleness and release rules. No Docker, no network.
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { claimLease, releaseLease, leaseRows, leaseStatus, protectionMessage } from '../../tools/compare/leases.mjs';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'leases-'));
const file = path.join(dir, 'leases.json');
const t0 = Date.parse('2026-11-24T10:00:00Z');
after(() => fs.rmSync(dir, { recursive: true, force: true }));

test('a TTL claim is active without a PID, blocks destructive actions, and releases explicitly', () => {
  const lease = claimLease(file, { slug: '3619127-pinned', task: 'issue-3619127', operation: 'review', minutes: 30, now: t0, host: 'host-a' });
  assert.equal(lease.pid, null);
  assert.equal(leaseStatus(lease, { now: t0 + 1000, host: 'host-a' }), 'active');
  assert.match(protectionMessage(file, ['3619127-pinned'], { now: t0 + 1000, host: 'host-a' }), /active lease.*review.*issue-3619127/);
  assert.equal(protectionMessage(file, ['other'], { now: t0 + 1000, host: 'host-a' }), '');
  assert.deepEqual(releaseLease(file, { slug: '3619127-pinned', now: t0 + 2000, host: 'host-a' }), { released: true, lease: { ...lease } });
  assert.deepEqual(leaseRows(file, { now: t0 + 2000, host: 'host-a' }), []);
});

test('an expired or stale lease is not protected, and a PID lease refuses another owner', () => {
  fs.rmSync(file, { force: true });
  const expiring = claimLease(file, { slug: 'a', operation: 'test', minutes: 0.001, now: t0, host: 'host-a' });
  assert.equal(leaseStatus(expiring, { now: t0 + 1000, host: 'host-a' }), 'expired');
  const stale = claimLease(file, { slug: 'b', operation: 'test', minutes: 30, pid: 99999999, now: t0, host: 'host-a' });
  assert.equal(leaseStatus(stale, { now: t0 + 1000, host: 'host-a' }), 'stale');
  assert.match(protectionMessage(file, ['a', 'b'], { now: t0 + 1000, host: 'host-a' }), /^$/);

  const mine = claimLease(file, { slug: 'c', operation: 'build', minutes: 30, pid: process.pid, now: t0, host: 'host-a' });
  assert.equal(leaseStatus(mine, { now: t0 + 1000, host: 'host-a' }), 'active');
  assert.throws(() => claimLease(file, { slug: 'c', operation: 'other', minutes: 30, pid: process.pid + 1, now: t0 + 1000, host: 'host-a' }), /active lease/);
  assert.equal(releaseLease(file, { slug: 'c', pid: process.pid + 1, now: t0 + 2000, host: 'host-a' }).released, false);
  assert.equal(releaseLease(file, { slug: 'c', pid: process.pid + 1, force: true, now: t0 + 2000, host: 'host-a' }).released, true);
});

test('a remote-host lease is protected and the command can force an override', () => {
  fs.rmSync(file, { force: true });
  claimLease(file, { slug: 'remote', operation: 'work', minutes: 30, now: t0, host: 'other-host' });
  const rows = leaseRows(file, { now: t0 + 1000, host: 'host-a' });
  assert.equal(rows[0].status, 'active');
  assert.match(protectionMessage(file, ['remote'], { now: t0 + 1000, host: 'host-a' }), /active lease/);
  assert.equal(protectionMessage(file, ['remote'], { force: true, now: t0 + 1000, host: 'host-a' }), '');
  assert.throws(() => claimLease(file, { slug: 'remote', operation: 'local', minutes: 30, now: t0 + 1000, host: 'host-a' }), /active lease/);
  assert.equal(releaseLease(file, { slug: 'remote', now: t0 + 1000, host: 'host-a' }).released, false);
  assert.equal(releaseLease(file, { slug: 'remote', force: true, now: t0 + 1000, host: 'host-a' }).released, true);
});
