// Explicit task metadata for the resource ledger. This is intentionally a thin local record, not a second work tracker:
// the issue, variant, patch and evidence systems remain authoritative. A task record only says which development task a
// session belongs to, what it was expected to deliver, and whether a person has verified the outcome.
//
// Records are append-only JSONL under .lab-cache/resource-ledger/tasks.jsonl. The latest record for a task id wins. The
// description and evidence references are local-only and are never included in a public export.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { labRoot, LEDGER_DIR } from './ledger.mjs';
import { iso, safeText } from './events.mjs';

export const TASKS_FILE = path.join(LEDGER_DIR, 'tasks.jsonl');
export const TASK_STATES = Object.freeze(['planned', 'in_progress', 'blocked', 'paused', 'completed_claimed', 'completed_verified', 'abandoned', 'unknown']);
export const TASK_KINDS = Object.freeze(['issue-reproduction', 'patch-development', 'accessibility-evaluation', 'tooling', 'maintenance', 'investigation', 'documentation', 'other']);
export const DELIVERABLES = Object.freeze(['reproduction', 'variant', 'patch', 'interdiff', 'phpunit-test', 'playwright-evidence', 'accessibility-findings', 'lighthouse-measurements', 'comparison-evidence', 'documentation', 'issue-comment-draft', 'investigation-report', 'none', 'other']);

const TASK_ID = /^[A-Za-z0-9][A-Za-z0-9:._-]{0,79}$/;
const taskHash = (id) => crypto.createHash('sha256').update(String(id)).digest('hex').slice(0, 12);
export { taskHash };

export function validateTaskRecord(record) {
  const problems = [];
  if (!record || typeof record !== 'object') return ['record must be an object'];
  if (!TASK_ID.test(String(record.task_id || ''))) problems.push('task_id must be 1-80 safe characters');
  if (record.kind != null && !TASK_KINDS.includes(record.kind)) problems.push(`kind must be one of ${TASK_KINDS.join(', ')}`);
  if (record.state != null && !TASK_STATES.includes(record.state)) problems.push(`state must be one of ${TASK_STATES.join(', ')}`);
  if (record.expected_deliverable != null && !DELIVERABLES.includes(record.expected_deliverable)) problems.push(`expected_deliverable must be one of ${DELIVERABLES.join(', ')}`);
  if (record.verified != null && typeof record.verified !== 'boolean') problems.push('verified must be boolean or null');
  if (record.sessions != null && (!Array.isArray(record.sessions) || record.sessions.some((s) => typeof s !== 'string'))) problems.push('sessions must be an array of strings');
  if (record.evidence != null && (!Array.isArray(record.evidence) || record.evidence.some((s) => typeof s !== 'string'))) problems.push('evidence must be an array of strings');
  return problems;
}

export function loadTasks({ file = TASKS_FILE } = {}) {
  if (!fs.existsSync(file)) return [];
  const latest = new Map();
  for (const line of fs.readFileSync(file, 'utf8').split('\n').filter(Boolean)) {
    try {
      const record = JSON.parse(line);
      if (validateTaskRecord(record).length) continue;
      const prev = latest.get(record.task_id);
      if (!prev || String(record.recorded_at || '') >= String(prev.recorded_at || '')) latest.set(record.task_id, record);
    } catch { /* a malformed local line is skipped; validateTaskRecord is the gate for new records */ }
  }
  return [...latest.values()].sort((a, b) => String(b.recorded_at || '').localeCompare(String(a.recorded_at || '')) || a.task_id.localeCompare(b.task_id));
}

export function recordTask(input, { file = TASKS_FILE, now = iso() } = {}) {
  const record = {
    task_id: String(input.task_id || input.id || '').trim(),
    recorded_at: now,
    issue: input.issue == null || input.issue === '' ? null : String(input.issue),
    variant: input.variant == null || input.variant === '' ? null : String(input.variant),
    label: input.label == null ? null : safeText(input.label, 160),
    description: input.description == null ? null : safeText(input.description, 500),
    kind: input.kind ?? null,
    state: input.state || 'in_progress',
    expected_deliverable: input.expected_deliverable ?? null,
    verified: input.verified == null ? null : !!input.verified,
    sessions: [...new Set((input.sessions || []).map((s) => String(s).split(/[\\/]/).pop()).filter(Boolean))].sort(),
    evidence: [...new Set((input.evidence || []).map((s) => safeText(s, 300)).filter(Boolean))].sort(),
    started_at: input.started_at ?? null,
    ended_at: input.ended_at ?? null,
  };
  const problems = validateTaskRecord(record);
  if (problems.length) throw new Error(`invalid task record: ${problems.join('; ')}`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.appendFileSync(file, `${JSON.stringify(record)}\n`);
  return record;
}

// A task can span several sessions; a session maps to at most one explicit task. A session that contains several
// development tasks cannot be split from the transcript alone, so it remains mapped to its declared task or unfiled.
export function taskForSession(tasks, sessionFile) {
  const base = String(sessionFile || '').split(/[\\/]/).pop();
  if (!base) return null;
  return (tasks || []).find((t) => (t.sessions || []).includes(base)) || null;
}

// Task-level resource summaries for explicit task ids only. Session pseudo-tasks (claude-session:...) are reported as a
// separate coverage measure, not as development tasks. No description or evidence path enters this object.
export function taskSummaries(events, { tasks = [] } = {}) {
  const registry = new Map(tasks.map((t) => [t.task_id, t]));
  const groups = new Map();
  for (const e of events || []) {
    const id = e.task?.id;
    if (!id || id === 'unfiled' || /^claude-session:|^model-eval|^monitor:/.test(id)) continue;
    if (!registry.has(id) && !e.task?.kind && !e.task?.state) continue;
    const g = groups.get(id) || { task_id: id, task_hash: taskHash(id), events: 0, tokens: null, model_requests: null, cost_usd: null, cpu_seconds: null, duration_ms: null, sessions: new Set(), states: new Set(), kinds: new Set(), deliverables: new Set(), verified: null, issue: e.issue ?? null, variant: e.variant ?? null, tokens_events: 0 };
    g.events++;
    const t = e.measurements?.tokens || {};
    const total = typeof t.input_total === 'number' ? t.input_total + (t.output || 0) : null;
    if (total != null) { g.tokens = (g.tokens || 0) + total; g.tokens_events++; }
    if (t.model_requests != null) g.model_requests = (g.model_requests || 0) + t.model_requests;
    const cost = e.measurements?.cost || {};
    const usd = typeof cost.reported_usd === 'number' ? cost.reported_usd : typeof cost.estimated_usd === 'number' ? cost.estimated_usd : null;
    if (usd != null) g.cost_usd = (g.cost_usd || 0) + usd;
    const cpu = e.measurements?.cpu?.total_seconds;
    if (typeof cpu === 'number') g.cpu_seconds = (g.cpu_seconds || 0) + cpu;
    if (typeof e.duration_ms === 'number') g.duration_ms = (g.duration_ms || 0) + e.duration_ms;
    if (e.task?.execution_id) g.sessions.add(e.task.execution_id);
    if (e.task?.state) g.states.add(e.task.state);
    if (e.task?.kind) g.kinds.add(e.task.kind);
    if (e.task?.expected_deliverable) g.deliverables.add(e.task.expected_deliverable);
    if (typeof e.task?.verified === 'boolean') g.verified = e.task.verified;
    if (!g.issue && e.issue) g.issue = e.issue;
    if (!g.variant && e.variant) g.variant = e.variant;
    groups.set(id, g);
  }
  for (const t of tasks) if (!groups.has(t.task_id)) groups.set(t.task_id, { task_id: t.task_id, task_hash: taskHash(t.task_id), events: 0, tokens: null, model_requests: null, cost_usd: null, cpu_seconds: null, duration_ms: null, sessions: new Set(), states: new Set(), kinds: new Set(), deliverables: new Set(), verified: null, issue: t.issue ?? null, variant: t.variant ?? null, tokens_events: 0 });
  return [...groups.values()].map((g) => {
    const reg = registry.get(g.task_id);
    const states = [...new Set([...g.states, ...(reg?.state ? [reg.state] : [])])];
    const kinds = [...new Set([...g.kinds, ...(reg?.kind ? [reg.kind] : [])])];
    return {
      task_hash: g.task_hash, declared: !!reg || g.kinds.size > 0 || g.states.size > 0, issue: g.issue, variant: g.variant,
      kind: kinds[0] || null, state: reg?.state || states[0] || 'unknown',
      expected_deliverable: [...new Set([...g.deliverables, ...(reg?.expected_deliverable ? [reg.expected_deliverable] : [])])][0] || null,
      verified: reg ? reg.verified : g.verified,
      sessions: g.sessions.size, events: g.events, tokens: g.tokens, model_requests: g.model_requests,
      cost_usd: g.cost_usd == null ? null : Math.round(g.cost_usd * 100) / 100,
      cpu_seconds: g.cpu_seconds == null ? null : Math.round(g.cpu_seconds * 1000) / 1000,
      duration_seconds: g.duration_ms == null ? null : Math.round(g.duration_ms / 100) / 10,
      data_completeness: g.tokens_events === g.events ? 'complete' : g.tokens_events ? 'partial' : 'unavailable',
    };
  }).sort((a, b) => (b.tokens ?? -1) - (a.tokens ?? -1) || a.task_hash.localeCompare(b.task_hash));
}

export const taskFileRelative = path.relative(labRoot, TASKS_FILE);
