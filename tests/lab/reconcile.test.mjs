// Unit tests for the environment reconciliation decision. No Docker, no sessions, no files.
import test from 'node:test';
import assert from 'node:assert/strict';
import { decideEnvironment } from '../../tools/compare/reconcile.mjs';

const lease = (over = {}) => ({ slug: 'a', status: 'active', session: 'session-abc', ...over });

test('no lease, old project: stop', () => {
  assert.equal(decideEnvironment({ projectAgeMinutes: 60 }).action, 'stop');
});

test('recent evidence protects even without a lease', () => {
  assert.equal(decideEnvironment({ projectAgeMinutes: 60, recentEvidence: true }).action, 'protect');
});

test('an active process protects', () => {
  assert.equal(decideEnvironment({ projectAgeMinutes: 60, processActive: true }).action, 'protect');
});

test('a project inside the grace window is unknown', () => {
  assert.equal(decideEnvironment({ projectAgeMinutes: 3, graceMinutes: 30 }).action, 'unknown');
});

test('an active lease without a session protects, as a person may be using it', () => {
  assert.deepEqual(decideEnvironment({ lease: lease({ session: null }), projectAgeMinutes: 60 }), { action: 'protect', reason: 'active lease (no session: assume a person is using it)' });
});

test('an active session lease protects', () => {
  assert.equal(decideEnvironment({ lease: lease(), sessionAgeMinutes: 2, projectAgeMinutes: 60 }).action, 'protect');
});

test('a lease whose session has been idle past the grace window stops', () => {
  const r = decideEnvironment({ lease: lease(), sessionAgeMinutes: 40, projectAgeMinutes: 120, graceMinutes: 30 });
  assert.equal(r.action, 'stop');
  assert.match(r.reason, /session idle/);
});

test('a lease naming an unreadable session is unknown', () => {
  assert.equal(decideEnvironment({ lease: lease(), sessionAgeMinutes: null, projectAgeMinutes: 60 }).action, 'unknown');
});

test('expired and stale leases stop', () => {
  assert.equal(decideEnvironment({ lease: { slug: 'a', status: 'expired', session: null }, projectAgeMinutes: 60 }).action, 'stop');
  assert.equal(decideEnvironment({ lease: { slug: 'a', status: 'stale', session: null }, projectAgeMinutes: 60 }).action, 'stop');
});

test('an unreadable lease is unknown', () => {
  assert.equal(decideEnvironment({ lease: { slug: 'a', status: 'unknown' }, projectAgeMinutes: 60 }).action, 'unknown');
});


test('an expired lease with a still-active session keeps the environment', () => {
  assert.equal(decideEnvironment({ lease: lease({ status: 'expired' }), sessionAgeMinutes: 2, projectAgeMinutes: 120 }).action, 'protect');
});
