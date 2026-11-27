// Unit tests for host capacity samples. No Docker or host measurement is required: the snapshot and assessment are
// injected, so the event shape, aggregation and public allowlist can be checked deterministically.
import test from 'node:test';
import assert from 'node:assert/strict';
import { hostEvent } from '../../tools/resource/adapters/host.mjs';
import { validateEvent } from '../../tools/resource/events.mjs';
import { aggregate } from '../../tools/resource/aggregate.mjs';
import { assertPublic } from '../../tools/resource/public.mjs';

const snapshot = {
  host: {
    disk: { totalBytes: 200 * 1024 ** 3, usedBytes: 180 * 1024 ** 3, freeBytes: 20 * 1024 ** 3 },
    memory: { freePercent: 35, swapUsedBytes: 2 * 1024 ** 3, swapTotalBytes: 4 * 1024 ** 3 },
    platform: 'darwin',
  },
  docker: { memTotalBytes: 8 * 1024 ** 3, labUsedBytes: 6 * 1024 ** 3, labContainers: 10, projects: 5, pairs: 5 },
};
const assessment = { level: 'warn', checks: [{ key: 'swap', status: 'warn', value: '50% of 4.0 GB' }] };

test('a host sample is a valid event with measured values', () => {
  const e = hostEvent({ snapshot, assessment, now: new Date('2026-11-27T12:00:00Z'), durationMs: 12 });
  assert.equal(validateEvent(e).ok, true);
  assert.equal(e.event_type, 'host-sample');
  assert.equal(e.activity, 'monitoring');
  assert.equal(e.measurements.host.level, 'warn');
  assert.equal(e.measurements.host.disk_free_bytes, 20 * 1024 ** 3);
  assert.equal(e.measurements.host.memory_free_percent, 35);
  assert.equal(e.measurements.host.swap_used_percent, 50);
  assert.equal(e.measurements.host.docker_used_percent, 75);
  assert.equal(e.measurements.host.lab_pairs, 5);
});

test('missing values stay null and the level is unknown', () => {
  const e = hostEvent({ snapshot: { host: {}, docker: {} }, assessment: { level: 'unknown', checks: [] }, now: new Date('2026-11-27T12:00:00Z') });
  assert.equal(validateEvent(e).ok, true);
  assert.equal(e.measurements.host.disk_free_bytes, null);
  assert.equal(e.measurements.host.level, 'unknown');
});

test('aggregation exposes the latest sample and a capped series', () => {
  const a = hostEvent({ snapshot, assessment, now: new Date('2026-11-27T12:00:00Z') });
  const b = hostEvent({ snapshot: { ...snapshot, docker: { ...snapshot.docker, pairs: 2 } }, assessment: { level: 'pass', checks: [] }, now: new Date('2026-11-27T12:05:00Z') });
  const summary = aggregate([a, b]);
  assert.equal(summary.host.samples, 2);
  assert.equal(summary.host.latest.level, 'pass');
  assert.equal(summary.host.latest.lab_pairs, 2);
  assert.equal(summary.host.series.length, 2);
  assert.deepEqual(summary.host.levels, { pass: 1, warn: 1, block: 0, unknown: 0 });
  assert.equal(summary.host.latest.event_id, b.event_id.slice(0, 12));
});

test('the host summary passes the public allowlist', () => {
  const summary = aggregate([hostEvent({ snapshot, assessment, now: new Date('2026-11-27T12:00:00Z') })]);
  assert.doesNotThrow(() => assertPublic(summary));
  assert.equal(summary.host.latest.disk_free_bytes, 20 * 1024 ** 3);
});
