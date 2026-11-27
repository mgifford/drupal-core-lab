// Unit tests for the resource preflight. No Docker, no host measurement: every case uses a synthetic snapshot.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GiB, parseDfKb, parseSwapUsage, parseMemoryPressure, parseDockerPs, parseDockerMemUsage,
  assessResources, criticalReason, DEFAULTS,
} from '../../tools/compare/preflight.mjs';

const snapshot = (over = {}) => ({
  measured_at: '2026-01-01T00:00:00.000Z',
  host: {
    disk: { totalBytes: 228 * GiB, freeBytes: 20 * GiB },
    memory: { freePercent: 50, swapUsedBytes: 1 * GiB, swapTotalBytes: 7 * GiB },
    ...(over.host || {}),
  },
  docker: { memTotalBytes: 8 * GiB, labUsedBytes: 1 * GiB, labContainers: 8, projects: 4, pairs: 2, ...(over.docker || {}) },
  ...(over.root || {}),
});

test('parse df -kP output', () => {
  const out = 'Filesystem 1024-blocks Used Available Capacity Mounted on\n/dev/disk3s1s1 239369984 13700000 11000000 55% /\n';
  assert.deepEqual(parseDfKb(out), { totalBytes: 239369984 * 1024, freeBytes: 11000000 * 1024 });
  assert.equal(parseDfKb(''), null);
});

test('parse macOS swap usage', () => {
  assert.deepEqual(parseSwapUsage('total = 7168.00M  used = 5726.38M  free = 1441.62M  (encrypted)'),
    { totalBytes: 7168 * 1024 ** 2, usedBytes: 5726.38 * 1024 ** 2 });
  assert.equal(parseSwapUsage('nothing'), null);
});

test('parse memory_pressure output', () => {
  assert.equal(parseMemoryPressure('System-wide memory free percentage: 34%'), 34);
  assert.equal(parseMemoryPressure('no percentage'), null);
});

test('parse docker ps labels: viewer is not a pair', () => {
  const out = [
    'ddev-drupal-compare-web\tdrupal-compare',
    'ddev-repro-baseline-a-web\trepro-baseline-a',
    'ddev-repro-issue-a-web\trepro-issue-a',
    'ddev-repro-baseline-a-chrome\trepro-baseline-a',
  ].join('\n');
  assert.deepEqual(parseDockerPs(out), { labContainers: 4, projects: 3, pairs: 1 });
});

test('parse docker stats memory usage', () => {
  assert.equal(parseDockerMemUsage('453MiB / 7.748GiB\n1.5GiB / 7.748GiB\n'), 453 * 1024 ** 2 + 1.5 * GiB);
  assert.equal(parseDockerMemUsage(''), null);
});

test('healthy host passes', () => {
  const r = assessResources(snapshot());
  assert.equal(r.level, 'pass');
  assert.ok(r.checks.every((c) => c.status === 'pass'));
});

test('disk warns at 10 GB and blocks below 8 GB', () => {
  const warn = assessResources(snapshot({ host: { disk: { totalBytes: 228 * GiB, freeBytes: 10 * GiB } } }));
  assert.equal(warn.level, 'warn');
  assert.equal(warn.checks.find((c) => c.key === 'disk').status, 'warn');
  const block = assessResources(snapshot({ host: { disk: { totalBytes: 228 * GiB, freeBytes: 5 * GiB } } }));
  assert.equal(block.level, 'block');
  assert.equal(block.checks.find((c) => c.key === 'disk').status, 'block');
});

test('low free memory and high swap block', () => {
  const mem = assessResources(snapshot({ host: { memory: { freePercent: 10, swapUsedBytes: 1 * GiB, swapTotalBytes: 7 * GiB } } }));
  assert.equal(mem.level, 'block');
  const swap = assessResources(snapshot({ host: { memory: { freePercent: 50, swapUsedBytes: 6 * GiB, swapTotalBytes: 7 * GiB } } }));
  assert.equal(swap.level, 'block');
  assert.equal(swap.checks.find((c) => c.key === 'swap').status, 'block');
});

test('Docker memory above 85 percent blocks, above 70 warns', () => {
  const warn = assessResources(snapshot({ docker: { memTotalBytes: 8 * GiB, labUsedBytes: 6 * GiB, pairs: 2 } }));
  assert.equal(warn.checks.find((c) => c.key === 'docker').status, 'warn');
  const block = assessResources(snapshot({ docker: { memTotalBytes: 8 * GiB, labUsedBytes: 7.2 * GiB, pairs: 2 } }));
  assert.equal(block.level, 'block');
});

test('more than two pairs warns but never blocks on its own', () => {
  const r = assessResources(snapshot({ docker: { memTotalBytes: 8 * GiB, labUsedBytes: 1 * GiB, pairs: 6 } }));
  assert.equal(r.level, 'warn');
  assert.equal(r.checks.find((c) => c.key === 'pairs').status, 'warn');
});

test('unmeasured resources warn rather than pretend to pass', () => {
  const r = assessResources({ host: { disk: null, memory: {} }, docker: {} });
  assert.equal(r.level, 'warn');
  assert.ok(r.checks.some((c) => c.status === 'unknown'));
});

test('criticalReason is host-only, for the watchdog', () => {
  assert.match(criticalReason({ disk: { freeBytes: 5 * GiB }, memory: { freePercent: 50, swapTotalBytes: 0 } }), /disk/);
  assert.match(criticalReason({ disk: { freeBytes: 20 * GiB }, memory: { freePercent: 5, swapTotalBytes: 0 } }), /memory/);
  assert.equal(criticalReason({ disk: { freeBytes: 20 * GiB }, memory: { freePercent: 50, swapTotalBytes: 0 } }), '');
  assert.equal(DEFAULTS.disk.block_gb, 8);
});
