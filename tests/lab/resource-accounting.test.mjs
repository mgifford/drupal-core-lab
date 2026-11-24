// Deterministic tests for resource accounting. No DDEV, no model, no network.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { makeEvent, validateEvent, publicEvent, totalTokens, iso } from '../../tools/resource/events.mjs';
import { appendEvents, loadEvents, readRaw } from '../../tools/resource/ledger.mjs';
import { aggregate, publicRows, tokensOf, cpuSecondsOf, costOf } from '../../tools/resource/aggregate.mjs';
import { classifyTool, classifyCommand, classifyWorkflow, issueFromText } from '../../tools/resource/classify.mjs';
import { parseBytes, parsePair, formatBytes } from '../../tools/resource/units.mjs';
import { parseTimeOutput } from '../../tools/resource/time-command.mjs';
import { loadBudgets, evaluateBudget } from '../../tools/resource/budgets.mjs';
import { assertPublic, publicProblems } from '../../tools/resource/public.mjs';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'resource-test-'));
const base = (over = {}) => ({
  event_type: 'ai-usage', occurred_at: '2026-11-23T10:00:00Z', duration_ms: 1000,
  issue: '3619127', variant: '3619127-pinned', task: { id: 'task-a', label: 'A task', execution_id: 'exec-a' },
  activity: 'code-exploration', tool: 'claude-code', model: 'claude-test', provider: 'anthropic',
  outcome: 'unknown', validation: 'unknown', source: { adapter: 'test', method: 'fixture', confidence: 'provider-reported', reference: 'local:test' },
  measurements: {
    tokens: { input_total: 100, uncached_input: 10, output: 20, cache_creation: 30, cache_read: 40, reasoning: 5, model_requests: 2, token_basis: 'provider-reported' },
    cost: { reported_usd: null, estimated_usd: 0.2, basis: 'client-reported-estimate', note: 'estimate' },
    tools: { invocations: 3, result_bytes: 1000, repeated_reads: 1, errors: 0 },
    context: { start_tokens: 500, average_tokens: 700, growth_tokens: null },
    latency: { api_ms: 500, tool_ms: 100 },
  },
  quality: { completeness: 'partial', missing: ['cpu', 'memory'], notes: [] },
  ...over,
});

test('events validate, required provenance is enforced, and missing differs from zero', () => {
  const e = makeEvent(base());
  assert.equal(validateEvent(e).ok, true, JSON.stringify(validateEvent(e).errors));
  assert.equal(totalTokens(e.measurements.tokens), 120);
  assert.equal(e.measurements.tokens.cache_read, 40);
  assert.equal(e.event_id.length, 64);
  const again = makeEvent(base());
  assert.equal(again.event_id, e.event_id, 'same content is the same immutable event');
  const changed = makeEvent(base({ measurements: { ...base().measurements, tokens: { ...base().measurements.tokens, output: 21 } } }));
  assert.notEqual(changed.event_id, e.event_id);
  const otherIssue = makeEvent(base({ issue: '3619128' }));
  assert.notEqual(otherIssue.event_id, e.event_id, 'issue attribution is part of event identity');
  const otherVariant = makeEvent(base({ variant: '3619127-latest' }));
  assert.notEqual(otherVariant.event_id, e.event_id, 'variant attribution is part of event identity');
  const missing = makeEvent(base({ measurements: { ...base().measurements, cost: { reported_usd: null, estimated_usd: null, basis: 'unavailable', note: null } }, quality: { completeness: 'partial', missing: ['cost'], notes: [] } }));
  assert.equal(costOf(missing).usd, null, 'missing cost is null, never zero');
  const zero = makeEvent(base({ measurements: { ...base().measurements, cost: { reported_usd: 0, estimated_usd: null, basis: 'provider-reported', note: null } } }));
  assert.equal(costOf(zero).usd, 0, 'a measured zero is kept');
  const bad = { ...e }; delete bad.issue; delete bad.source;
  assert.equal(validateEvent(bad).ok, false);
});

test('ledger dedupes identical events and supersedes a newer snapshot of the same source', () => {
  const file = path.join(tmp, 'ledger.jsonl');
  const first = makeEvent({ ...base(), source_key: 'session:abc' });
  const a = appendEvents([first], { file });
  assert.equal(a.added.length, 1);
  const b = appendEvents([first], { file });
  assert.equal(b.added.length, 0); assert.equal(b.skipped.length, 1);
  const second = makeEvent({ ...base({ measurements: { ...base().measurements, tokens: { ...base().measurements.tokens, output: 99 } } }), source_key: 'session:abc' });
  const c = appendEvents([second], { file });
  assert.equal(c.added.length, 1);
  assert.equal(c.added[0].supersedes, first.event_id);
  assert.equal(c.added[0].revision, 2);
  const loaded = loadEvents({ file });
  assert.equal(loaded.events.length, 1);
  assert.equal(loaded.events[0].event_id, second.event_id);
  assert.equal(loaded.events[0].measurements.tokens.output, 99);
  assert.equal(readRaw(file).invalid.length, 0);
  const attributed = makeEvent({ ...base({ issue: '3619128' }), source_key: 'session:abc' });
  const d = appendEvents([attributed], { file });
  assert.equal(d.added.length, 1, 'a changed issue supersedes the existing snapshot');
  assert.equal(d.added[0].supersedes, second.event_id);
  assert.equal(loadEvents({ file }).events[0].issue, '3619128');
  fs.appendFileSync(file, '{not json}\n');
  const partial = loadEvents({ file });
  assert.equal(partial.invalid.length, 1, 'an interrupted line is reported, not fatal');
  assert.equal(partial.events.length, 1);
});

test('aggregation keeps provider-reported tokens, estimates, cost, CPU and GitHub measurements separate', () => {
  const e1 = makeEvent({ ...base(), measurements: { ...base().measurements, allocations: [{ activity: 'code-exploration', tokens: 105, cpu_seconds: null, method: 'test' }] } });
  const e2 = makeEvent({ ...base({ event_type: 'process', activity: 'validation', tool: 'resource-run', issue: '3619127', task: { id: 'task-b', label: 'B', execution_id: 'b' }, measurements: { ...base().measurements, tokens: { input_total: null, uncached_input: null, output: null, cache_creation: null, cache_read: null, reasoning: null, model_requests: null, token_basis: 'unavailable' }, cost: { reported_usd: null, estimated_usd: null, basis: 'unavailable', note: null }, cpu: { user_seconds: 1, system_seconds: 1, total_seconds: 2, cpu_percent: 200, measurement: 'measured', source: 'time' }, memory: { peak_rss_bytes: 100 * 1024 * 1024, measurement: 'measured' } }, commit: 'a'.repeat(40) }) });
  const e3 = makeEvent({ ...base({ event_type: 'github-actions', activity: 'validation', tool: 'github-actions', issue: '3619127', task: { id: 'task-ci', label: 'CI', execution_id: 'run-1' }, duration_ms: 60000, outcome: 'success', validation: 'passed', private: { run_id: 1 }, measurements: { ...base().measurements, tokens: { input_total: null, uncached_input: null, output: null, cache_creation: null, cache_read: null, reasoning: null, model_requests: null, token_basis: 'unavailable' }, cost: { reported_usd: null, estimated_usd: null, basis: 'unavailable', note: null }, github: { workflow: 'Lab self-test', job: 'check', event: 'push', runner: 'ubuntu-latest', attempt: 1, potentially_superseded: false, billable_minutes: null, queue_seconds: 2 } } }) });
  const e4 = makeEvent({ ...base({ event_type: 'ai-usage', activity: 'model-evaluation', tool: 'claude-cli', model: 'claude-eval', task: { id: 'task-eval', label: 'Eval', execution_id: 'e' }, measurements: { ...base().measurements, tokens: { input_total: 50, uncached_input: null, output: 10, cache_creation: null, cache_read: null, reasoning: null, model_requests: 1, token_basis: 'provider-reported' }, cost: { reported_usd: null, estimated_usd: 0.1, basis: 'client-reported-estimate', note: null } } }) });
  const s = aggregate([e1, e2, e3, e4]);
  assert.equal(s.totals.ai.tokens, 180, '120 from event 1 plus input_total 50 + output 10 from event 4');
  assert.ok(Math.abs(s.totals.ai.cost_estimated_usd - 0.3) < 1e-9);
  assert.equal(s.totals.ai.cost_reported_usd, null);
  assert.equal(s.totals.cpu.total_seconds, 2);
  assert.equal(s.totals.cpu.measured_seconds, 2);
  assert.equal(s.totals.cpu.peak_memory_bytes, 100 * 1024 * 1024);
  assert.equal(s.totals.github.runs, 1);
  assert.equal(s.totals.github.jobs, 1);
  assert.equal(s.totals.github.duration_seconds, 60);
  assert.equal(s.totals.tasks.measured, 4);
  assert.equal(s.totals.tasks.success, 1);
  assert.equal(s.totals.tasks.unknown, 3);
  const activity = Object.fromEntries(s.by_activity.map((a) => [a.activity, a]));
  assert.equal(activity['code-exploration'].tokens, 105);
  assert.equal(activity.validation.cpu_seconds, 2);
  assert.equal(activity['model-evaluation'].tokens, 60);
  assert.equal(s.by_issue.find((i) => i.issue === '3619127').tokens, 180);
  const rows = publicRows([e1, e2, e3, e4]);
  assert.ok(rows.length >= 3);
  assert.doesNotThrow(() => assertPublic({ events: rows }, 'rows'));
  const json = JSON.stringify(rows);
  assert.doesNotMatch(json, /private|source_key|title|command|local:test/);
});

test('classification uses deterministic tool and workflow names and marks uncertainty unknown', () => {
  assert.equal(classifyTool('Read'), 'code-exploration');
  assert.equal(classifyTool('Bash/lab:measure-resources'), 'resource-measurement');
  assert.equal(classifyTool('Bash/ddev drupal cache'), 'cache-rebuild');
  assert.equal(classifyTool('Bash/composer install'), 'composer-install');
  assert.equal(classifyTool('mcp__Claude_Browser__browser_batch'), 'playwright-testing');
  assert.equal(classifyTool('Bash/for'), 'unknown');
  assert.equal(classifyCommand(['node', 'scripts/lint.mjs', 'x']), 'validation');
  assert.equal(classifyWorkflow('Lab self-test', 'check'), 'validation');
  assert.equal(classifyWorkflow('Weekly issue status', 'check'), 'issue-intake');
  assert.equal(issueFromText('fix issue #3619127'), '3619127');
  assert.equal(issueFromText('review the code'), null);
});

test('byte and time parsers keep measured zero and missing distinct', () => {
  assert.equal(parseBytes('1KiB'), 1024);
  assert.equal(parseBytes('1.5MiB'), 1572864);
  assert.deepEqual(parsePair('12MiB / 1GiB'), [12582912, 1073741824]);
  assert.equal(formatBytes(0), '0 B');
  const mac = parseTimeOutput('        0.00 real         0.00 user         0.00 sys\n              868352  maximum resident set size\n                   0  block input operations\n                   2  block output operations\n', 'darwin');
  assert.equal(mac.wall_ms, 0); assert.equal(mac.user_seconds, 0); assert.equal(mac.max_rss_bytes, 868352); assert.equal(mac.read_ops, 0); assert.equal(mac.write_ops, 2);
  const linux = parseTimeOutput('\tUser time (seconds): 1.25\n\tSystem time (seconds): 0.50\n\tElapsed (wall clock) time (h:mm:ss or m:ss): 0:03.00\n\tMaximum resident set size (kbytes): 2048\n', 'linux');
  assert.equal(linux.user_seconds, 1.25); assert.equal(linux.system_seconds, 0.5); assert.equal(linux.wall_ms, 3000); assert.equal(linux.max_rss_bytes, 2097152);
});

test('public allowlist rejects private fields, paths and secret-shaped strings', () => {
  assert.doesNotThrow(() => assertPublic({ events: [publicEvent(makeEvent(base()))], totals: { tokens: 1 } }));
  assert.throws(() => assertPublic({ private: { x: 1 } }), /forbidden public field/);
  assert.throws(() => assertPublic({ nested: { title: 'a transcript title' } }), /forbidden public field/);
  assert.throws(() => assertPublic({ note: '/Users/person/.claude/projects/x' }), /private path/);
  assert.throws(() => assertPublic({ note: 'ghp_abcdefghijklmnopqrstuvwxyz0123456789' }), /secret-shaped/);
  assert.ok(publicProblems({ source_key: 'x' }).length > 0);
});

test('budgets start in observe mode, warn, enforce, honour overrides, and leave spend advisory', () => {
  const file = path.join(tmp, 'resource-budgets.yml');
  fs.writeFileSync(file, `mode: enforce\nlimits:\n  max_ai_requests_per_task: 1\n  max_estimated_spend_usd: 1\n  max_concurrent_cpu_jobs: 1\noverrides:\n  issue_3619127:\n    max_ai_requests_per_task: 5\n`);
  const loaded = loadBudgets(file);
  assert.deepEqual(loaded.problems, []);
  assert.equal(loaded.config.mode, 'enforce');
  const events = [makeEvent({ ...base(), task: { id: 'task-a', label: 'A', execution_id: 'e' }, issue: '3619127', measurements: { ...base().measurements, tokens: { ...base().measurements.tokens, model_requests: 3 } } })];
  const noOverride = evaluateBudget({ config: { ...loaded.config, overrides: {} }, events, task: 'task-a', issue: '3619127' });
  assert.equal(noOverride.action, 'refuse');
  assert.ok(noOverride.exceeded.includes('ai_requests'));
  const override = evaluateBudget({ config: loaded.config, events, task: 'task-a', issue: '3619127' });
  assert.equal(override.action, 'allow');
  const running = evaluateBudget({ config: { ...loaded.config, overrides: {} }, events, task: 'task-a', running: [{ pid: 1 }, { pid: 2 }] });
  assert.equal(running.action, 'refuse');
  const spend = makeEvent({ ...base(), measurements: { ...base().measurements, tokens: { ...base().measurements.tokens, model_requests: 0 }, cost: { reported_usd: 2, estimated_usd: null, basis: 'provider-reported', note: null } } });
  const spendResult = evaluateBudget({ config: { ...loaded.config, overrides: {} }, events: [spend], task: 'task-a' });
  assert.equal(spendResult.checks.find((c) => c.key === 'spend_usd').status, 'exceeded');
  assert.equal(spendResult.checks.find((c) => c.key === 'spend_usd').enforceable, false);
  assert.equal(spendResult.action, 'warn');
  assert.equal(evaluateBudget({ config: { ...loaded.config, mode: 'observe' }, events, task: 'task-a', issue: '3619127' }).action, 'record');
  const planned = evaluateBudget({ config: { ...loaded.config, mode: 'enforce', overrides: {} }, events, task: 'task-a', issue: '3619127', additionalAiRequests: 10 });
  assert.equal(planned.observed.ai_requests, 13);
  assert.equal(planned.action, 'refuse');
  const testEvent = (i) => makeEvent({ ...base({ event_type: 'process', activity: 'validation', tool: 'resource-run', task: { id: 'tests', label: 'T', execution_id: `e${i}` }, outcome: 'failure', measurements: { ...base().measurements, tokens: { ...base().measurements.tokens, model_requests: 0 }, cost: { reported_usd: null, estimated_usd: null, basis: 'unavailable', note: null } }, private: { command_hash: 'same', exit_status: 1 } }) });
  const repetition = evaluateBudget({ config: { ...loaded.config, mode: 'enforce', limits: { ...loaded.config.limits, max_test_repetitions: 1, max_unsuccessful_iterations: 1 } }, events: [testEvent(1), testEvent(2)], task: 'tests' });
  assert.equal(repetition.observed.test_repetitions, 2);
  assert.ok(repetition.exceeded.includes('test_repetitions'));
  assert.ok(repetition.exceeded.includes('unsuccessful_iterations'));
  assert.equal(repetition.action, 'refuse');
});

test('the committed public summary and its dashboard copy pass the export allowlist', () => {
  const summary = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'reports/resources/summary.json'), 'utf8'));
  assert.doesNotThrow(() => assertPublic(summary, 'reports/resources/summary.json'));
  const cloud = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'cloud/resources.json'), 'utf8'));
  assert.doesNotThrow(() => assertPublic(cloud, 'cloud/resources.json'));
  assert.ok(Array.isArray(summary.events) && summary.events.length > 0);
  assert.equal(summary.privacy.missing_is_not_zero, true);
});

test('a transcript with a repeated message id is counted once by the Claude adapter', async () => {
  const dir = path.join(tmp, 'claude'); fs.mkdirSync(dir);
  const file = path.join(dir, 'session.jsonl');
  const usage = { input_tokens: 10, output_tokens: 5, cache_creation_input_tokens: 2, cache_read_input_tokens: 3 };
  const lines = [
    { type: 'assistant', timestamp: '2026-01-01T00:00:00Z', version: '2.1.0', message: { id: 'm1', model: 'claude-test', usage, content: [{ type: 'text', text: 'x' }] } },
    { type: 'assistant', timestamp: '2026-01-01T00:00:01Z', version: '2.1.0', message: { id: 'm1', model: 'claude-test', usage, content: [{ type: 'tool_use', id: 't1', name: 'Read', input: { file_path: '/x' } }] } },
    { type: 'user', timestamp: '2026-01-01T00:00:02Z', message: { content: [{ type: 'tool_result', tool_use_id: 't1', content: 'ok' }] } },
  ];
  fs.writeFileSync(file, lines.map((l) => JSON.stringify(l)).join('\n') + '\n');
  const { collectClaude } = await import('../../tools/resource/adapters/claude.mjs');
  const r = collectClaude({ files: [file] });
  assert.equal(r.errors.length, 0, r.errors.join('; '));
  assert.equal(r.events.length, 2, 'one counted request event plus one uncounted session roll-up');
  const session = r.events.find((e) => e.event_type === 'ai-usage');
  const request = r.events.find((e) => e.event_type === 'ai-request');
  assert.equal(session.accounting.counted, false);
  assert.equal(session.reconciliation.status, 'matched');
  assert.equal(request.measurements.tokens.model_requests, 1, 'one message.id is one model request');
  assert.equal(request.measurements.tokens.input_total, 15);
  assert.equal(request.measurements.tokens.output, 5);
  assert.equal(request.measurements.tools.invocations, 1);
  assert.equal(request.activity, 'code-exploration');
  assert.equal(request.classification.provenance, 'tool_name_rule');
  assert.equal(request.source.adapter, 'claude-transcripts');
  const s = aggregate(r.events);
  assert.equal(s.totals.ai.tokens, 20, 'request usage is counted once; the roll-up is not added');
  assert.equal(s.reconciliation.status.matched, 1);
});
