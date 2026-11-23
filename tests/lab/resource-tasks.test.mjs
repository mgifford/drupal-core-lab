// Deterministic tests for explicit task identity and task-level resource summaries. No model, no DDEV, no network.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { makeEvent, validateEvent } from '../../tools/resource/events.mjs';
import { recordTask, loadTasks, taskForSession, taskSummaries, taskHash, TASK_STATES } from '../../tools/resource/tasks.mjs';
import { aggregate, publicRows } from '../../tools/resource/aggregate.mjs';
import { assertPublic } from '../../tools/resource/public.mjs';
import { collectClaude } from '../../tools/resource/adapters/claude.mjs';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'resource-tasks-'));
const tasksFile = path.join(tmp, 'tasks.jsonl');

test('task records are append-only, latest state wins, and a session maps to one declared task', () => {
  recordTask({ task_id: 'issue-3619127', issue: '3619127', kind: 'accessibility-evaluation', state: 'in_progress', expected_deliverable: 'accessibility-findings', sessions: ['a.jsonl'], description: 'local only' }, { file: tasksFile, now: '2026-01-01T00:00:00Z' });
  recordTask({ task_id: 'issue-3619127', issue: '3619127', kind: 'accessibility-evaluation', state: 'completed_verified', verified: true, expected_deliverable: 'accessibility-findings', sessions: ['a.jsonl', 'b.jsonl'] }, { file: tasksFile, now: '2026-01-02T00:00:00Z' });
  const tasks = loadTasks({ file: tasksFile });
  assert.equal(tasks.length, 1);
  assert.equal(tasks[0].state, 'completed_verified');
  assert.equal(tasks[0].verified, true);
  assert.deepEqual(tasks[0].sessions, ['a.jsonl', 'b.jsonl']);
  assert.equal(taskForSession(tasks, '/tmp/a.jsonl')?.task_id, 'issue-3619127');
  assert.equal(taskForSession(tasks, '/tmp/other.jsonl'), null);
  assert.throws(() => recordTask({ task_id: 'bad id', state: 'in_progress' }, { file: tasksFile }), /invalid task record/);
  assert.throws(() => recordTask({ task_id: 'x', state: 'not-a-state' }, { file: tasksFile }), /invalid task record/);
  assert.ok(TASK_STATES.includes('completed_verified'));
});

test('task summaries count explicit tasks, exclude session pseudo-tasks, and expose no description or evidence', () => {
  const base = (over = {}) => ({
    event_type: 'ai-request', occurred_at: '2026-01-01T00:00:00Z', duration_ms: null,
    issue: '3619127', variant: 'v1', task: { id: 'issue-3619127', label: 'T', execution_id: 'a.jsonl', kind: 'accessibility-evaluation', state: 'completed_verified', expected_deliverable: 'accessibility-findings', verified: true },
    activity: 'accessibility-scanning', tool: 'claude-code', model: 'm', provider: 'anthropic', outcome: 'success', validation: 'passed',
    source: { adapter: 'test', method: 'fixture', confidence: 'provider-reported', reference: 'local:test' },
    measurements: { tokens: { input_total: 100, uncached_input: 1, output: 20, cache_creation: 0, cache_read: 99, reasoning: 0, model_requests: 1, token_basis: 'provider-reported' }, cost: { reported_usd: null, estimated_usd: 0.5, basis: 'estimated', note: null } },
    quality: { completeness: 'partial', missing: [], notes: [] },
    ...over,
  });
  const e1 = makeEvent(base());
  const e2 = makeEvent(base({ task: { id: 'tooling-resource', label: 'R', execution_id: 'c.jsonl', kind: null, state: null, expected_deliverable: null, verified: null }, activity: 'resource-measurement', measurements: { ...base().measurements, tokens: { input_total: 50, uncached_input: 0, output: 10, cache_creation: 0, cache_read: 50, reasoning: 0, model_requests: 1, token_basis: 'provider-reported' } } }));
  const pseudo = makeEvent(base({ task: { id: 'claude-session:a.jsonl', label: 'S', execution_id: 'a.jsonl' } }));
  for (const e of [e1, e2, pseudo]) assert.equal(validateEvent(e).ok, true, JSON.stringify(validateEvent(e).errors));
  const tasks = loadTasks({ file: tasksFile });
  const byTask = taskSummaries([e1, e2, pseudo], { tasks });
  assert.equal(byTask.length, 1, 'only declared/explicit tasks are task-level rows');
  assert.equal(byTask.find((t) => t.task_hash === taskHash('issue-3619127')).tokens, 120);
  assert.equal(byTask.find((t) => t.task_hash === taskHash('issue-3619127')).declared, true);
  assert.equal(byTask.find((t) => t.task_hash === taskHash('issue-3619127')).verified, true);
  assert.equal(JSON.stringify(byTask).includes('local only'), false);
  const s = aggregate([e1, e2, pseudo]);
  assert.equal(s.by_task.length, 1);
  assert.equal(s.attribution.task.declared_tasks, 1);
  assert.equal(s.attribution.task.verified_tasks, 1);
  const pub = { events: publicRows([e1, e2, pseudo]), by_task: s.by_task, attribution: s.attribution };
  assert.doesNotThrow(() => assertPublic(pub, 'task public summary'));
  assert.equal(JSON.stringify(pub).includes('a.jsonl'), false);
});


test('a declared session is mapped to its explicit task through the adapter', () => {
  const dir = path.join(tmp, 'adapter'); fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'mapped.jsonl');
  const lines = [
    { type: 'assistant', timestamp: '2026-01-01T00:00:00Z', version: '2.1.0', message: { id: 'm1', model: 'claude-test', usage: { input_tokens: 10, output_tokens: 5 }, content: [{ type: 'tool_use', id: 't1', name: 'Read', input: { file_path: '/x' } }] } },
    { type: 'user', timestamp: '2026-01-01T00:00:01Z', message: { content: [{ type: 'tool_result', tool_use_id: 't1', content: 'ok' }] } },
  ];
  fs.writeFileSync(file, `${lines.map((l) => JSON.stringify(l)).join('\n')}\n`);
  const registry = path.join(tmp, 'adapter-tasks.jsonl');
  recordTask({ task_id: 'issue-1', issue: '1', kind: 'issue-reproduction', state: 'in_progress', expected_deliverable: 'reproduction', sessions: ['mapped.jsonl'] }, { file: registry });
  const r = collectClaude({ files: [file], tasksFile: registry });
  assert.equal(r.errors.length, 0, r.errors.join('; '));
  const session = r.events.find((e) => e.event_type === 'ai-usage');
  const request = r.events.find((e) => e.event_type === 'ai-request');
  assert.equal(session.task.id, 'issue-1');
  assert.equal(request.task.id, 'issue-1');
  assert.equal(request.task.kind, 'issue-reproduction');
  assert.equal(request.task.state, 'in_progress');
  assert.equal(r.metadata.explicit_tasks, 1);
});
