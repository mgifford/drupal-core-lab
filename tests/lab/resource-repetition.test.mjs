// Deterministic tests for repeated-operation fingerprints. No model, no DDEV, no network.
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeEvent } from '../../tools/resource/events.mjs';
import { operationFingerprint, repetitionGroups, repetitionRows } from '../../tools/resource/repetition.mjs';
import { aggregate } from '../../tools/resource/aggregate.mjs';
import { evaluateBudget } from '../../tools/resource/budgets.mjs';
import { assertPublic } from '../../tools/resource/public.mjs';

const event = (over = {}) => makeEvent({
  event_type: 'process', occurred_at: '2026-01-01T00:00:00Z', duration_ms: 1000,
  issue: '1', variant: null, task: { id: 'task-a', label: 'A', execution_id: 'e' }, activity: 'validation',
  tool: 'node', outcome: 'failure', validation: 'failed', commit: 'a'.repeat(40), patch: null,
  source: { adapter: 'process-wrapper', method: 'fixture', confidence: 'measured', reference: null },
  measurements: {}, quality: { completeness: 'partial', missing: [], notes: [] },
  private: { command_hash: 'cmd', exit_status: 1 },
  ...over,
});

test('a repetition requires identical command, revision, patch, environment and result signature', () => {
  const a = event();
  const b = event({ occurred_at: '2026-01-01T00:01:00Z' });
  assert.equal(operationFingerprint(a).key, operationFingerprint(b).key);
  const changedCommit = event({ commit: 'b'.repeat(40) });
  const changedPatch = event({ patch: 'patch-2' });
  const changedEnv = event({ environment: { os: 'linux', node: 'v22', runner: 'ci', ddev: null, docker: null } });
  const changedResult = event({ private: { command_hash: 'cmd', exit_status: 2 } });
  const changedTest = event({ private: { command_hash: 'cmd', exit_status: 1, test_ids: ['Test::other'] } });
  for (const e of [changedCommit, changedPatch, changedEnv, changedResult, changedTest]) assert.notEqual(operationFingerprint(a).key, operationFingerprint(e).key);

  const same = repetitionGroups([a, b]);
  assert.equal(same.groups.length, 1);
  assert.equal(same.groups[0].runs, 2);
  assert.equal(same.groups[0].failure, 2);
  assert.equal(same.summary.repeated_groups, 1);
  assert.equal(same.summary.unchanged_failure_runs, 1);
  assert.match(same.summary.note, /not proof|may be/i);

  const different = repetitionGroups([a, b, changedCommit]);
  assert.equal(different.groups.length, 2);
  assert.equal(different.summary.commands_with_changed_conditions, 1);
});

test('repetition rows are public-safe and preserve the day, not the precise time', () => {
  const rows = repetitionRows([event(), event({ occurred_at: '2026-01-02T23:59:00Z' })]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].first, '2026-01-01');
  assert.equal(rows[0].last, '2026-01-02');
  assert.equal(JSON.stringify(rows).includes('cmd'), false);
  assert.doesNotThrow(() => assertPublic({ rows }, 'repetition rows'));
});

test('budgets use the fingerprint group and report unchanged failures without treating every repeat as waste', () => {
  const events = [event(), event(), event({ occurred_at: '2026-01-01T00:02:00Z', outcome: 'success', validation: 'passed' })];
  const config = { mode: 'observe', limits: { max_test_repetitions: 1, max_unsuccessful_iterations: 99 }, overrides: {} };
  const b = evaluateBudget({ config, events, task: 'task-a' });
  assert.equal(b.observed.test_repetitions, 3);
  assert.equal(b.observed.repeated_unchanged_failures, 1);
  assert.equal(b.observed.repeated_exploratory, null);
  assert.equal(b.action, 'record');
  const s = aggregate(events);
  assert.equal(s.repetition.groups.length, 1);
  assert.equal(s.repetition.groups[0].runs, 3);
  assert.equal(s.repetition.unchanged_failure_runs, 1);
  assert.doesNotThrow(() => assertPublic({ repetition: s.repetition }, 'repetition summary'));
});
