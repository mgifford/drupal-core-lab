// Public infrastructure accounting: sampled container roles, CPU and memory, without container names or local paths.
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeEvent } from '../../tools/resource/events.mjs';
import { aggregate, publicRows } from '../../tools/resource/aggregate.mjs';
import { assertPublic } from '../../tools/resource/public.mjs';

const base = (over = {}) => ({
  event_type: 'container', occurred_at: '2026-11-24T10:00:00Z', duration_ms: 5000,
  issue: '3619127', variant: '3619127-pinned', task: { id: 'docker-sample:t', label: 'Docker sample', execution_id: null },
  activity: 'infrastructure', tool: 'ddev-web', model: null, provider: null, outcome: 'unknown', validation: 'not-run',
  source: { adapter: 'docker-stats', method: 'fixture', confidence: 'measured', reference: null },
  measurements: {
    cpu: { user_seconds: null, system_seconds: null, total_seconds: 2, cpu_percent: 40, measurement: 'derived', source: 'fixture' },
    memory: { peak_rss_bytes: null, peak_container_bytes: 300 * 1024 * 1024, peak_php_mb: null, measurement: 'sampled' },
    io: { read_ops: null, write_ops: null, read_bytes: 10, write_bytes: 20, measurement: 'derived' },
    network: { rx_bytes: 1, tx_bytes: 2, measurement: 'sampled' },
  },
  quality: { completeness: 'partial', missing: ['tokens'], notes: [] },
  private: { container: 'ddev-repro-issue-3619127-vanilla-web', site: 'repro-issue-3619127-vanilla', role: 'web' },
  ...over,
});

test('infrastructure rolls up container roles with CPU and peak memory, not private names', () => {
  const events = [
    makeEvent(base()),
    makeEvent(base({ tool: 'ddev-chrome', measurements: { ...base().measurements, cpu: { ...base().measurements.cpu, total_seconds: 1, cpu_percent: 20 }, memory: { ...base().measurements.memory, peak_container_bytes: 500 * 1024 * 1024 } }, private: { container: 'ddev-repro-issue-3619127-vanilla-chrome', site: 'repro-issue-3619127-vanilla', role: 'chrome' } })),
    makeEvent(base({ occurred_at: '2026-11-24T10:00:05Z', task: { id: 'docker-sample:t2', label: 'Docker sample', execution_id: null }, private: { container: 'ddev-repro-issue-3619127-vanilla-web', site: 'repro-issue-3619127-vanilla', role: 'web' } })),
  ];
  const s = aggregate(events);
  assert.equal(s.infrastructure.samples, 3);
  assert.equal(s.infrastructure.containers, 2);
  const web = s.infrastructure.roles.find((r) => r.role === 'web');
  const chrome = s.infrastructure.roles.find((r) => r.role === 'chrome');
  assert.deepEqual({ containers: web.containers, events: web.events, cpu: web.cpu_seconds, mem: web.peak_memory_bytes }, { containers: 1, events: 2, cpu: 4, mem: 300 * 1024 * 1024 });
  assert.equal(chrome.cpu_seconds, 1);
  assert.equal(chrome.peak_memory_bytes, 500 * 1024 * 1024);
  assert.match(s.infrastructure.note, /sampled/i);
  assert.doesNotMatch(JSON.stringify(s.infrastructure), /ddev-repro/);
  assert.doesNotThrow(() => assertPublic(s, 'infrastructure summary'));
  const rows = publicRows(events);
  assert.equal(JSON.stringify(rows).includes('ddev-repro'), false);
});
