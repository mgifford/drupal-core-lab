// Normalized resource events. Every adapter builds the same shape through makeEvent(); nothing writes to the ledger
// without schema validation. The event id is deterministic, so importing the same immutable source twice is a no-op.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { validateAgainst } from '../observability/schema.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
export const SCHEMA_PATH = path.join(here, 'events.schema.json');
export const SCHEMA_VERSION = '1.0.0';
const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));

export const ACTIVITIES = [
  'issue-intake', 'issue-analysis', 'code-exploration', 'patch-development', 'model-evaluation',
  'phpunit-execution', 'playwright-testing', 'accessibility-scanning', 'lighthouse-testing', 'validation',
  'environment-setup', 'composer-install', 'cache-rebuild', 'documentation-generation',
  'resource-measurement', 'github-actions', 'infrastructure', 'monitoring', 'unknown',
];

export const iso = (d = new Date()) => new Date(d).toISOString().replace(/\.\d{3}Z$/, 'Z');
export const day = (d) => iso(d).slice(0, 10);
export const sha256 = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
export const safeText = (s, max = 300) => String(s ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
const sortObject = (x) => {
  if (Array.isArray(x)) return x.map(sortObject);
  if (x && typeof x === 'object') return Object.fromEntries(Object.keys(x).sort().map((k) => [k, sortObject(x[k])]));
  return x;
};
export const stableStringify = (x) => JSON.stringify(sortObject(x));

export function blankMeasurements() {
  return {
    tokens: { input_total: null, uncached_input: null, output: null, cache_creation: null, cache_read: null, reasoning: null, model_requests: null, token_basis: 'unavailable' },
    cost: { reported_usd: null, estimated_usd: null, basis: 'unavailable', note: null },
    tools: { invocations: null, result_bytes: null, repeated_reads: null, errors: null },
    context: { start_tokens: null, average_tokens: null, growth_tokens: null },
    latency: { api_ms: null, tool_ms: null },
    cpu: { user_seconds: null, system_seconds: null, total_seconds: null, cpu_percent: null, measurement: 'unavailable', source: null },
    memory: { peak_rss_bytes: null, peak_container_bytes: null, peak_php_mb: null, measurement: 'unavailable' },
    io: { read_ops: null, write_ops: null, read_bytes: null, write_bytes: null, measurement: 'unavailable' },
    network: { rx_bytes: null, tx_bytes: null, measurement: 'unavailable' },
    github: { workflow: null, job: null, event: null, runner: null, attempt: null, potentially_superseded: null, billable_minutes: null, queue_seconds: null },
  };
}

const deepMerge = (base, update) => {
  if (update === undefined) return base;
  if (update === null || typeof update !== 'object' || Array.isArray(update)) return update;
  const out = { ...(base && typeof base === 'object' && !Array.isArray(base) ? base : {}) };
  for (const [k, v] of Object.entries(update)) out[k] = deepMerge(out[k], v);
  return out;
};

// Build a valid event. `source_key` identifies a mutable snapshot (for example a transcript file); a later import of the
// same source_key supersedes the earlier event instead of being counted twice.
export function makeEvent(input) {
  const event = {
    schema_version: SCHEMA_VERSION,
    event_type: input.event_type,
    recorded_at: input.recorded_at || iso(),
    occurred_at: input.occurred_at,
    duration_ms: input.duration_ms ?? null,
    project: input.project || 'drupal-core-lab',
    issue: input.issue ?? null,
    variant: input.variant ?? null,
    task: { id: input.task?.id || 'unfiled', label: input.task?.label ?? null, execution_id: input.task?.execution_id ?? null },
    activity: input.activity || 'unknown',
    tool: input.tool || 'unknown',
    model: input.model ?? null,
    provider: input.provider ?? null,
    environment: {
      os: input.environment?.os ?? `${process.platform} ${process.arch}`,
      node: input.environment?.node ?? process.version,
      runner: input.environment?.runner ?? 'local',
      ddev: input.environment?.ddev ?? null,
      docker: input.environment?.docker ?? null,
    },
    outcome: input.outcome || 'unknown',
    validation: input.validation || 'unknown',
    commit: input.commit ?? null,
    patch: input.patch ?? null,
    source: {
      adapter: input.source?.adapter || 'manual',
      method: input.source?.method || 'unknown',
      confidence: input.source?.confidence || 'unavailable',
      reference: input.source?.reference ?? null,
    },
    measurements: deepMerge(blankMeasurements(), input.measurements || {}),
    quality: {
      completeness: input.quality?.completeness || 'partial',
      missing: [...new Set(input.quality?.missing || [])].sort(),
      notes: (input.quality?.notes || []).map((n) => safeText(n, 400)),
    },
    source_key: input.source_key ?? null,
    supersedes: input.supersedes ?? null,
    revision: input.revision ?? 1,
    private: input.private && typeof input.private === 'object' ? input.private : undefined,
  };
  if (event.private === undefined) delete event.private;
  event.event_id = eventId(event);
  return event;
}

// The id covers the content an adapter measured, not the collection time. For a mutable snapshot, source_key plus the
// snapshot marker makes a new revision when the source has grown; for an immutable record the same input is skipped.
export function eventId(event) {
  const material = {
    adapter: event.source?.adapter, event_type: event.event_type, occurred_at: event.occurred_at,
    duration_ms: event.duration_ms, source_key: event.source_key || null,
    measurements: event.measurements, task: event.task?.id || null, activity: event.activity,
    outcome: event.outcome, commit: event.commit,
  };
  return sha256(stableStringify(material));
}

export function validateEvent(event) {
  return validateAgainst(event, schema);
}

export function assertEvent(event) {
  const result = validateEvent(event);
  if (!result.ok) throw new Error(`resource event does not validate: ${result.errors.slice(0, 8).map((e) => `${e.path || '/'} ${e.message}`).join('; ')}`);
  return event;
}

// The public allowlist. It names every field that may be published; a new event field is invisible until it is added
// here deliberately. Never spread the raw event into a public object.
export function publicEvent(event) {
  const e = event;
  const m = e.measurements;
  const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
  return {
    id: e.event_id.slice(0, 16),
    date: day(e.occurred_at),
    event_type: e.event_type,
    issue: e.issue,
    variant: e.variant,
    activity: e.activity,
    tool: e.tool,
    model: e.model,
    provider: e.provider,
    outcome: e.outcome,
    validation: e.validation,
    duration_seconds: num(e.duration_ms) == null ? null : Math.round(e.duration_ms / 100) / 10,
    quality: { completeness: e.quality.completeness, missing: e.quality.missing.slice(0, 20) },
    tokens: {
      total: totalTokens(m.tokens), input_total: num(m.tokens.input_total),
      uncached_input: num(m.tokens.uncached_input), output: num(m.tokens.output), cache_creation: num(m.tokens.cache_creation),
      cache_read: num(m.tokens.cache_read), reasoning: num(m.tokens.reasoning), model_requests: num(m.tokens.model_requests),
      basis: m.tokens.token_basis,
    },
    cost: {
      reported_usd: num(m.cost.reported_usd), estimated_usd: num(m.cost.estimated_usd), basis: m.cost.basis,
    },
    tools: { invocations: num(m.tools.invocations), result_bytes: num(m.tools.result_bytes), repeated_reads: num(m.tools.repeated_reads), errors: num(m.tools.errors) },
    cpu: { total_seconds: num(m.cpu.total_seconds), cpu_percent: num(m.cpu.cpu_percent), measurement: m.cpu.measurement },
    memory: { peak_rss_bytes: num(m.memory.peak_rss_bytes), peak_container_bytes: num(m.memory.peak_container_bytes), peak_php_mb: num(m.memory.peak_php_mb), measurement: m.memory.measurement },
    github: {
      workflow: m.github.workflow, job: m.github.job, event: m.github.event, runner: m.github.runner,
      attempt: num(m.github.attempt), potentially_superseded: m.github.potentially_superseded,
    },
    source: { adapter: e.source.adapter, confidence: e.source.confidence },
    allocations: (m.allocations || []).map((a) => ({ activity: a.activity, tokens: num(a.tokens), cpu_seconds: num(a.cpu_seconds), method: a.method })),
  };
}

export const totalTokens = (t) => {
  const parts = [t.uncached_input, t.cache_creation, t.cache_read, t.reasoning].filter((v) => typeof v === 'number' && Number.isFinite(v));
  const input = typeof t.input_total === 'number' ? t.input_total : (parts.length ? parts.reduce((a, b) => a + b, 0) : null);
  const output = typeof t.output === 'number' ? t.output : null;
  return input === null && output === null ? null : (input || 0) + (output || 0);
};

export const publicFields = Object.freeze([
  'id', 'date', 'event_type', 'issue', 'variant', 'activity', 'tool', 'model', 'provider', 'outcome', 'validation',
  'duration_seconds', 'quality', 'tokens', 'cost', 'tools', 'cpu', 'memory', 'github', 'source', 'allocations',
]);
