// Observe-only capacity advice: leases and wrapped operations count, reviews do not, and nothing is enforced without a caller.
import test from 'node:test';
import assert from 'node:assert/strict';
import { activeHeavyWork, capacityDecision } from '../../tools/compare/scheduler.mjs';

const running = [
  { pid: 101, activity: 'phpunit-execution', task: 'issue-1', issue: '1' },
  { pid: 102, activity: 'composer', task: 'issue-2', issue: '2' },
];
const leases = [
  { pid: null, status: 'active', operation: 'review', task: 'issue-1' },
  { pid: 102, status: 'active', operation: 'test', task: 'issue-2' },
  { pid: null, status: 'active', operation: 'build', task: 'issue-3' },
  { pid: 103, status: 'expired', operation: 'test', task: 'issue-4' },
];

test('active heavy work counts tests/builds once and ignores reviews/expired leases', () => {
  const active = activeHeavyWork({ running, leases });
  assert.deepEqual(active.map((a) => [a.source, a.activity]), [['operation', 'phpunit-execution'], ['operation', 'composer'], ['lease', 'build']]);
  assert.equal(active.filter((a) => a.pid === 102).length, 1, 'a wrapped operation and its own lease are not double counted');
});

test('observe records, warn warns, enforce refuses; a review never counts as heavy', () => {
  assert.equal(capacityDecision({ running, leases, kind: 'test', mode: 'observe', limit: 2 }).action, 'record');
  assert.equal(capacityDecision({ running, leases, kind: 'build', mode: 'warn', limit: 2 }).action, 'warn');
  assert.equal(capacityDecision({ running, leases, kind: 'setup', mode: 'enforce', limit: 2 }).action, 'refuse');
  assert.equal(capacityDecision({ running, leases, kind: 'review', mode: 'enforce', limit: 2 }).action, 'allow');
  const under = capacityDecision({ running: running.slice(0, 1), leases: [], kind: 'test', mode: 'enforce', limit: 2 });
  assert.equal(under.action, 'allow');
  assert.equal(under.active_count, 1);
});

test('memory pressure is reported without pretending it is measured work', () => {
  const d = capacityDecision({ running: [], leases: [], kind: 'test', mode: 'warn', limit: 2, memoryPercent: 91 });
  assert.equal(d.action, 'warn');
  assert.match(d.reasons.join(' '), /memory pressure 91%/);
  assert.equal(d.active_count, 0);
});
