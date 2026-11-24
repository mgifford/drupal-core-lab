// Resource budget configuration and deterministic checks. The default mode is observe. Enforcement is limited to
// operations started through scripts/resource-run.mjs; provider-side model calls are not intercepted.
import fs from 'node:fs';
import path from 'node:path';
import { parseConfig } from '../compare/lab-config.mjs';
import { labRoot, LEDGER_DIR, appendEvents } from './ledger.mjs';
import { makeEvent, iso } from './events.mjs';
import { repetitionGroups } from './repetition.mjs';

export const BUDGET_FILE = path.join(labRoot, 'resource-budgets.yml');
export const RUNNING_FILE = path.join(LEDGER_DIR, 'running.json');
export const MODES = ['observe', 'warn', 'enforce'];
const LIMITS = {
  max_ai_requests_per_task: 'ai_requests', max_provider_tokens_per_task: 'tokens',
  max_estimated_spend_usd: 'spend_usd', max_repeated_exploratory_calls: 'repeated_exploratory',
  max_unsuccessful_iterations: 'unsuccessful_iterations', max_process_duration_seconds: 'process_duration_seconds',
  max_concurrent_cpu_jobs: 'concurrent_cpu_jobs', max_test_repetitions: 'test_repetitions',
};
const DEFAULTS = { mode: 'observe', limits: Object.fromEntries(Object.keys(LIMITS).map((k) => [k, 0])), overrides: {} };

export function loadBudgets(file = BUDGET_FILE) {
  if (!fs.existsSync(file)) return { config: JSON.parse(JSON.stringify(DEFAULTS)), source: 'defaults (no resource-budgets.yml)', problems: [] };
  const parsed = parseConfig(fs.readFileSync(file, 'utf8'));
  const problems = [...parsed.problems], config = JSON.parse(JSON.stringify(DEFAULTS)), raw = parsed.value || {};
  if (raw.mode != null) {
    if (!MODES.includes(raw.mode)) problems.push(`mode must be one of ${MODES.join(', ')}`);
    else config.mode = raw.mode;
  }
  if (raw.limits && typeof raw.limits === 'object') {
    for (const [k, v] of Object.entries(raw.limits)) {
      if (!LIMITS[k]) problems.push(`unknown limit "${k}"`);
      else if (typeof v !== 'number' || v < 0) problems.push(`limit ${k} must be a non-negative number`);
      else config.limits[k] = v;
    }
  }
  if (raw.overrides && typeof raw.overrides === 'object') {
    for (const [key, value] of Object.entries(raw.overrides)) {
      if (!value || typeof value !== 'object') { problems.push(`override ${key} must be a mapping`); continue; }
      const out = {};
      for (const [k, v] of Object.entries(value)) {
        if (!LIMITS[k]) problems.push(`override ${key}: unknown limit ${k}`);
        else if (typeof v !== 'number' || v < 0) problems.push(`override ${key}.${k} must be a non-negative number`);
        else out[k] = v;
      }
      config.overrides[key] = out;
    }
  }
  return { config, source: path.relative(labRoot, file), problems };
}

export function limitsFor(config, { task = null, issue = null } = {}) {
  const out = { ...config.limits };
  const keys = [];
  if (issue) keys.push(String(issue), `issue_${issue}`);
  if (task) keys.push(String(task), `task_${task}`);
  for (const key of keys) for (const [k, v] of Object.entries(config.overrides[key] || {})) out[k] = v;
  return out;
}

export function readRunning(file = RUNNING_FILE) {
  try {
    const rows = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!Array.isArray(rows)) return [];
    const alive = rows.filter((r) => { try { process.kill(r.pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } });
    if (alive.length !== rows.length) fs.writeFileSync(file, JSON.stringify(alive));
    return alive;
  } catch { return []; }
}
export function registerRunning(record, file = RUNNING_FILE) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const rows = readRunning(file).filter((r) => r.pid !== record.pid);
  rows.push(record); fs.writeFileSync(file, JSON.stringify(rows));
}
export function unregisterRunning(pid, file = RUNNING_FILE) {
  try { const rows = readRunning(file).filter((r) => r.pid !== pid); fs.writeFileSync(file, JSON.stringify(rows)); } catch { /* none */ }
}

const sum = (xs) => { const v = xs.filter((x) => typeof x === 'number' && Number.isFinite(x)); return v.length ? v.reduce((a, b) => a + b, 0) : null; };
const totalTokens = (e) => {
  const t = e.measurements.tokens;
  const input = [t.input_total, t.uncached_input, t.cache_creation, t.cache_read, t.reasoning].find((x) => typeof x === 'number');
  const raw = [t.uncached_input, t.cache_creation, t.cache_read, t.reasoning].filter((x) => typeof x === 'number');
  const inTotal = typeof t.input_total === 'number' ? t.input_total : (raw.length ? raw.reduce((a, b) => a + b, 0) : null);
  return inTotal == null && typeof t.output !== 'number' ? null : (inTotal || 0) + (t.output || 0);
};
const cost = (e) => typeof e.measurements.cost.reported_usd === 'number' ? e.measurements.cost.reported_usd : (typeof e.measurements.cost.estimated_usd === 'number' ? e.measurements.cost.estimated_usd : null);

export function evaluateBudget({ config, events, task = null, issue = null, activity = null, running = [], starting = false, additionalAiRequests = 0 }) {
  const limits = limitsFor(config, { task, issue });
  const selected = (events || []).filter((e) => e.activity !== 'monitoring'
    && (!task || e.task.id === task)
    && (!issue || e.issue === issue)
    && (!activity || e.activity === activity));
  const observed = {
    ai_requests: (() => { const base = sum(selected.map((e) => e.measurements.tokens.model_requests)); return base == null && !additionalAiRequests ? null : (base || 0) + additionalAiRequests; })(),
    tokens: sum(selected.map(totalTokens)),
    spend_usd: sum(selected.map(cost)),
    repeated_exploratory: (() => {
      const reads = sum(selected.map((e) => e.measurements.tools.repeated_reads));
      const lookups = sum(selected.map((e) => e.measurements.exploration?.repeated_lookups));
      return reads == null && lookups == null ? null : (reads || 0) + (lookups || 0);
    })(),
    unsuccessful_iterations: selected.filter((e) => e.outcome === 'failure').length,
    process_duration_seconds: selected.length ? Math.max(...selected.map((e) => (typeof e.duration_ms === 'number' ? e.duration_ms / 1000 : 0))) : null,
    concurrent_cpu_jobs: running.length + (starting ? 1 : 0),
    test_repetitions: (() => {
      const tests = selected.filter((e) => ['phpunit-execution', 'playwright-testing', 'validation'].includes(e.activity) && e.private?.command_hash);
      if (!tests.length) return null;
      const { groups } = repetitionGroups(tests);
      return groups.length ? Math.max(...groups.map((g) => g.runs)) : null;
    })(),
    repeated_unchanged_failures: (() => {
      const { summary } = repetitionGroups(selected);
      return summary.process_operations ? summary.unchanged_failure_runs : null;
    })(),
  };
  const checks = [];
  for (const [limitKey, key] of Object.entries(LIMITS)) {
    const limit = limits[limitKey];
    const value = observed[key];
    if (!limit || limit <= 0) { checks.push({ key, limit: null, observed: value, status: 'not-set', enforceable: true, note: 'No limit configured.' }); continue; }
    if (value == null) { checks.push({ key, limit, observed: null, status: 'unavailable', enforceable: false, note: 'No measurement for this limit.' }); continue; }
    const enforceable = !['spend_usd', 'process_duration_seconds'].includes(key);   // spend is provider-side; duration is known only after a run
    const note = enforceable ? '' : key === 'spend_usd' ? 'Reported for advice only; the provider, not the lab, controls actual spending.' : 'Reported for advice only; duration is known only after a run, so a wrapper cannot enforce it before starting.';
    checks.push({ key, limit, observed: value, status: value > limit ? 'exceeded' : 'ok', enforceable, note });
  }
  const exceeded = checks.filter((c) => c.status === 'exceeded');
  const enforceableExceeded = exceeded.filter((c) => c.enforceable);
  const action = config.mode === 'enforce' ? (enforceableExceeded.length ? 'refuse' : (exceeded.length ? 'warn' : 'allow')) : config.mode === 'warn' ? (exceeded.length ? 'warn' : 'allow') : 'record';
  return { mode: config.mode, action, status: exceeded.length ? 'exceeded' : (checks.some((c) => c.status === 'unavailable') ? 'partial' : 'ok'), task, issue, activity, observed, limits, checks, exceeded: exceeded.map((c) => c.key), notes: ['Enforcement applies only to commands started through scripts/resource-run.mjs. Provider-side model calls are outside repository control.'] };
}

// Record an explicit override or refusal. The reason stays local; public summaries never include it.
export function recordBudgetDecision({ decision, mode, task, issue = null, reason = null, exceeded = [], source = 'resource-budgets.yml' }) {
  const event = makeEvent({
    event_type: 'budget', occurred_at: iso(), task: { id: task, label: `Budget ${decision}`, execution_id: null },
    activity: 'monitoring', tool: 'resource-budget', outcome: decision === 'refused' ? 'failure' : 'success', validation: 'not-run', issue,
    source: { adapter: 'resource-budget', method: 'preflight', confidence: 'measured', reference: source },
    measurements: {}, quality: { completeness: 'complete', missing: [], notes: ['Budget decision recorded separately from the activity it authorised or refused.'] },
    private: { decision, mode, reason, exceeded },
  });
  appendEvents([event]); return event;
}

export function formatBudget(result) {
  const lines = [`Resource budget (${result.mode}${result.task ? `, task ${result.task}` : ''}${result.issue ? `, issue ${result.issue}` : ''}): ${result.status}, action ${result.action}`];
  for (const c of result.checks) {
    if (c.status === 'not-set') continue;
    lines.push(`  ${c.status === 'exceeded' ? 'EXCEEDED' : c.status === 'unavailable' ? 'unavailable' : 'ok'} ${c.key}: ${c.observed ?? '—'} / ${c.limit ?? '—'}${c.note ? ` (${c.note})` : ''}`);
  }
  if (result.observed?.repeated_unchanged_failures) lines.push(`  info repeated_unchanged_failures: ${result.observed.repeated_unchanged_failures} (identical command/revision/patch/environment/result; inspect before calling it waste)`);
  return lines.join('\n');
}
