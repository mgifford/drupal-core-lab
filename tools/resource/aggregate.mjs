// Deterministic aggregation. No model, no network, no clock-dependent decisions except the recorded dates.
import { totalTokens } from './events.mjs';

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
export function sumOrNull(values) { const v = values.map(num).filter((x) => x !== null); return v.length ? v.reduce((a, b) => a + b, 0) : null; }
export const maxOrNull = (values) => { const v = values.map(num).filter((x) => x !== null); return v.length ? Math.max(...v) : null; };
const round = (n, d = 2) => (num(n) == null ? null : Math.round(n * 10 ** d) / 10 ** d);
const rate = (part, whole) => (part == null || whole == null || whole === 0 ? null : part / whole);

export function tokensOf(event) { return totalTokens(event.measurements.tokens); }
export function cpuSecondsOf(event) {
  const c = event.measurements.cpu;
  if (num(c.total_seconds) != null) return c.total_seconds;
  if (num(c.cpu_percent) != null && num(event.duration_ms) != null) return c.cpu_percent / 100 * event.duration_ms / 1000;
  return null;
}
export function memoryOf(event) {
  const m = event.measurements.memory;
  const values = [m.peak_rss_bytes, m.peak_container_bytes, num(m.peak_php_mb) == null ? null : m.peak_php_mb * 1024 * 1024].map(num).filter((x) => x !== null);
  return values.length ? Math.max(...values) : null;
}
export function costOf(event) {
  const c = event.measurements.cost;
  if (num(c.reported_usd) != null) return { usd: c.reported_usd, basis: c.basis || 'provider-reported' };
  if (num(c.estimated_usd) != null) return { usd: c.estimated_usd, basis: c.basis || 'estimated' };
  return { usd: null, basis: 'unavailable' };
}

function emptyBucket() { return { events: 0, tokens: null, estimated_tokens: null, model_requests: null, cost_usd: null, cpu_seconds: null, peak_memory_bytes: null, tool_invocations: null, repeated_reads: null, duration_ms: null, outcomes: { success: 0, failure: 0, cancelled: 0, partial: 0, unknown: 0 }, tasks: new Set(), evidence: [] }; }
function add(bucket, { tokens = null, estimated = null, modelRequests = null, cost = null, cpu = null, memory = null, toolInvocations = null, repeatedReads = null, duration = null, outcome = 'unknown', task = null, evidence = null }) {
  bucket.events++;
  if (tokens != null) bucket.tokens = (bucket.tokens || 0) + tokens;
  if (estimated != null) bucket.estimated_tokens = (bucket.estimated_tokens || 0) + estimated;
  if (modelRequests != null) bucket.model_requests = (bucket.model_requests || 0) + modelRequests;
  if (cost != null) bucket.cost_usd = (bucket.cost_usd || 0) + cost;
  if (cpu != null) bucket.cpu_seconds = (bucket.cpu_seconds || 0) + cpu;
  if (memory != null) bucket.peak_memory_bytes = Math.max(bucket.peak_memory_bytes || 0, memory);
  if (toolInvocations != null) bucket.tool_invocations = (bucket.tool_invocations || 0) + toolInvocations;
  if (repeatedReads != null) bucket.repeated_reads = (bucket.repeated_reads || 0) + repeatedReads;
  if (duration != null) bucket.duration_ms = (bucket.duration_ms || 0) + duration;
  bucket.outcomes[outcome] = (bucket.outcomes[outcome] || 0) + 1;
  if (task) bucket.tasks.add(task);
  if (evidence) bucket.evidence.push(evidence);
}

export function aggregate(events, { now = new Date() } = {}) {
  const all = events || [];
  const monitoring = all.filter((e) => e.activity === 'monitoring');
  const data = all.filter((e) => e.activity !== 'monitoring');
  const tokens = data.filter((e) => e.measurements.tokens.token_basis === 'provider-reported').map(tokensOf);
  const estimated = data.filter((e) => e.measurements.tokens.token_basis === 'estimated').map(tokensOf);
  const reportedCosts = data.map(costOf).filter((c) => c.basis === 'provider-reported').map((c) => c.usd).filter((x) => x != null);
  const estimatedCosts = data.map(costOf).filter((c) => ['client-reported-estimate', 'estimated', 'subscription-allowance'].includes(c.basis)).map((c) => c.usd).filter((x) => x != null);
  const github = data.filter((e) => e.event_type === 'github-actions');
  const tasks = new Map();
  for (const e of data) {
    const prev = tasks.get(e.task.id) || { id: e.task.id, outcomes: new Set(), events: 0, first: e.occurred_at, last: e.occurred_at };
    prev.outcomes.add(e.outcome); prev.events++; if (String(e.occurred_at) < prev.first) prev.first = e.occurred_at; if (String(e.occurred_at) > prev.last) prev.last = e.occurred_at;
    tasks.set(e.task.id, prev);
  }
  const taskList = [...tasks.values()].map((t) => ({ id: t.id, events: t.events, outcome: t.outcomes.has('failure') ? 'failure' : t.outcomes.has('success') ? 'success' : t.outcomes.has('cancelled') ? 'cancelled' : 'unknown', first: t.first, last: t.last }));
  const totals = {
    ai: {
      tokens: sumOrNull(tokens), estimated_tokens: sumOrNull(estimated),
      uncached_input: sumOrNull(data.map((e) => e.measurements.tokens.uncached_input)),
      output: sumOrNull(data.map((e) => e.measurements.tokens.output)),
      cache_creation: sumOrNull(data.map((e) => e.measurements.tokens.cache_creation)),
      cache_read: sumOrNull(data.map((e) => e.measurements.tokens.cache_read)),
      reasoning: sumOrNull(data.map((e) => e.measurements.tokens.reasoning)),
      model_requests: sumOrNull(data.map((e) => e.measurements.tokens.model_requests)),
      tool_invocations: sumOrNull(data.map((e) => e.measurements.tools.invocations)),
      tool_result_bytes: sumOrNull(data.map((e) => e.measurements.tools.result_bytes)),
      repeated_reads: sumOrNull(data.map((e) => e.measurements.tools.repeated_reads)),
      tool_errors: sumOrNull(data.map((e) => e.measurements.tools.errors)),
      cost_reported_usd: sumOrNull(reportedCosts), cost_estimated_usd: sumOrNull(estimatedCosts),
      cost_basis: reportedCosts.length ? 'provider-reported' : estimatedCosts.length ? 'client-reported-estimate' : 'unavailable',
    },
    cpu: {
      measured_seconds: sumOrNull(data.filter((e) => e.measurements.cpu.measurement === 'measured').map(cpuSecondsOf)),
      sampled_seconds: sumOrNull(data.filter((e) => ['sampled', 'derived'].includes(e.measurements.cpu.measurement)).map(cpuSecondsOf)),
      total_seconds: sumOrNull(data.map(cpuSecondsOf)),
      peak_memory_bytes: maxOrNull(data.map(memoryOf)),
      processes_measured: data.filter((e) => e.event_type === 'process' || e.event_type === 'container').length,
    },
    github: {
      runs: new Set(github.map((e) => e.private?.run_id || e.task.execution_id)).size,
      jobs: github.length,
      duration_seconds: sumOrNull(github.map((e) => num(e.duration_ms) == null ? null : e.duration_ms / 1000)),
      success: github.filter((e) => e.outcome === 'success').length,
      failure: github.filter((e) => e.outcome === 'failure').length,
      cancelled: github.filter((e) => e.outcome === 'cancelled').length,
      other: github.filter((e) => !['success', 'failure', 'cancelled'].includes(e.outcome)).length,
      potentially_superseded: new Set(github.filter((e) => e.measurements.github.potentially_superseded === true).map((e) => e.private?.run_id || e.task.execution_id)).size,
      billable_minutes: null,
    },
    tasks: {
      measured: taskList.length,
      success: taskList.filter((t) => t.outcome === 'success').length,
      failure: taskList.filter((t) => t.outcome === 'failure').length,
      unknown: taskList.filter((t) => t.outcome === 'unknown').length,
    },
    monitoring: {
      events: monitoring.length,
      cpu_seconds: sumOrNull(monitoring.map(cpuSecondsOf)),
      peak_memory_bytes: maxOrNull(monitoring.map(memoryOf)),
      duration_ms: sumOrNull(monitoring.map((e) => e.duration_ms)),
    },
  };

  // Activity: use the explicit derived allocation when a session has one, otherwise the event's own activity.
  const byActivity = new Map();
  const addActivity = (activity, values) => { const b = byActivity.get(activity) || emptyBucket(); add(b, values); byActivity.set(activity, b); };
  for (const e of data) {
    const t = tokensOf(e), cost = costOf(e).usd, cpu = cpuSecondsOf(e), mem = memoryOf(e), duration = e.duration_ms;
    const allocations = e.measurements.allocations?.length ? e.measurements.allocations : null;
    if (allocations && t != null) {
      for (const a of allocations) {
        const share = t ? (a.tokens ?? 0) / t : 0;
        addActivity(a.activity, {
          tokens: a.tokens, modelRequests: e.measurements.tokens.model_requests == null ? null : Math.round(e.measurements.tokens.model_requests * share),
          cost: cost == null ? null : cost * share, cpu: a.cpu_seconds ?? (cpu == null ? null : cpu * share),
          memory: share >= 1 ? mem : null, toolInvocations: null, repeatedReads: null,
          duration: duration == null ? null : duration * share, outcome: e.outcome, task: e.task.id, evidence: e.event_id.slice(0, 12),
        });
      }
    } else {
      addActivity(e.activity, { tokens: t, modelRequests: e.measurements.tokens.model_requests, cost, cpu, memory: mem, toolInvocations: e.measurements.tools.invocations, repeatedReads: e.measurements.tools.repeated_reads, duration, outcome: e.outcome, task: e.task.id, evidence: e.event_id.slice(0, 12) });
    }
  }
  const totalActivityTokens = sumOrNull([...byActivity.values()].map((b) => b.tokens));
  const activityRows = [...byActivity.entries()].map(([activity, b]) => ({
    activity, events: b.events, tasks: b.tasks.size, tokens: b.tokens, share: rate(b.tokens, totalActivityTokens),
    model_requests: b.model_requests, cost_usd: round(b.cost_usd), cpu_seconds: round(b.cpu_seconds), peak_memory_bytes: b.peak_memory_bytes,
    tool_invocations: b.tool_invocations, repeated_reads: b.repeated_reads, duration_seconds: b.duration_ms == null ? null : round(b.duration_ms / 1000, 1),
    outcomes: b.outcomes, method: 'derived from tool-call share where a session has allocations; otherwise the event activity',
  })).sort((a, b) => (b.tokens ?? -1) - (a.tokens ?? -1) || a.activity.localeCompare(b.activity));

  const byIssue = new Map();
  for (const e of data) {
    const k = e.issue || 'unattributed';
    const b = byIssue.get(k) || { issue: e.issue, ...emptyBucket(), success: 0, failure: 0 };
    add(b, { tokens: tokensOf(e), modelRequests: e.measurements.tokens.model_requests, cost: costOf(e).usd, cpu: cpuSecondsOf(e), memory: memoryOf(e), duration: e.duration_ms, outcome: e.outcome, task: e.task.id, evidence: e.event_id.slice(0, 12) });
    if (e.outcome === 'success') b.success++; if (e.outcome === 'failure') b.failure++;
    byIssue.set(k, b);
  }
  const issueRows = [...byIssue.values()].map((b) => ({ issue: b.issue, events: b.events, tasks: b.tasks.size, tokens: b.tokens, model_requests: b.model_requests, cost_usd: round(b.cost_usd), cpu_seconds: round(b.cpu_seconds), duration_seconds: round(b.duration_ms == null ? null : b.duration_ms / 1000, 1), peak_memory_bytes: b.peak_memory_bytes, success: b.success, failure: b.failure, outcomes: b.outcomes, evidence: b.evidence.slice(0, 8) })).sort((a, b) => (b.tokens ?? -1) - (a.tokens ?? -1));

  const githubWorkflows = [...new Set(github.map((e) => e.measurements.github.workflow || 'Unknown'))].map((workflow) => {
    const es = github.filter((e) => (e.measurements.github.workflow || 'Unknown') === workflow);
    const runIds = new Set(es.map((e) => e.private?.run_id || e.task.execution_id));
    return { workflow, jobs: es.length, runs: runIds.size, duration_seconds: round(sumOrNull(es.map((e) => num(e.duration_ms) == null ? null : e.duration_ms / 1000)), 1), success: es.filter((e) => e.outcome === 'success').length, failure: es.filter((e) => e.outcome === 'failure').length, other: es.filter((e) => !['success', 'failure'].includes(e.outcome)).length, potentially_superseded: es.filter((e) => e.measurements.github.potentially_superseded === true).length };
  }).sort((a, b) => (b.duration_seconds ?? -1) - (a.duration_seconds ?? -1));

  const modelRows = [...new Map(data.filter((e) => e.model).map((e) => [e.model, e])).keys()].map((model) => {
    const es = data.filter((e) => e.model === model);
    return { model, provider: [...new Set(es.map((e) => e.provider).filter(Boolean))].join(', ') || null, events: es.length, tokens: sumOrNull(es.map(tokensOf)), model_requests: sumOrNull(es.map((e) => e.measurements.tokens.model_requests)), cost_usd: round(sumOrNull(es.map((e) => costOf(e).usd))) };
  }).sort((a, b) => (b.tokens ?? -1) - (a.tokens ?? -1));
  const toolRows = [...new Set(data.map((e) => e.tool))].map((tool) => {
    const es = data.filter((e) => e.tool === tool);
    return { tool, events: es.length, tokens: sumOrNull(es.map(tokensOf)), cpu_seconds: round(sumOrNull(es.map(cpuSecondsOf))), model_requests: sumOrNull(es.map((e) => e.measurements.tokens.model_requests)), cost_usd: round(sumOrNull(es.map((e) => costOf(e).usd))) };
  }).sort((a, b) => (b.tokens ?? -1) - (a.tokens ?? -1));

  const trendMap = new Map();
  for (const e of data) {
    const date = String(e.occurred_at).slice(0, 10);
    const b = trendMap.get(date) || { date, events: 0, tokens: null, model_requests: null, cost_usd: null, cpu_seconds: null, github_seconds: null };
    b.events++; if (tokensOf(e) != null) b.tokens = (b.tokens || 0) + tokensOf(e); if (e.measurements.tokens.model_requests != null) b.model_requests = (b.model_requests || 0) + e.measurements.tokens.model_requests;
    if (costOf(e).usd != null) b.cost_usd = (b.cost_usd || 0) + costOf(e).usd; if (cpuSecondsOf(e) != null) b.cpu_seconds = (b.cpu_seconds || 0) + cpuSecondsOf(e); if (e.event_type === 'github-actions' && e.duration_ms != null) b.github_seconds = (b.github_seconds || 0) + e.duration_ms / 1000;
    trendMap.set(date, b);
  }
  const trend = [...trendMap.values()].sort((a, b) => a.date.localeCompare(b.date)).map((b) => ({ ...b, cost_usd: round(b.cost_usd), cpu_seconds: round(b.cpu_seconds), github_seconds: round(b.github_seconds, 1) }));

  const dates = data.map((e) => String(e.occurred_at).slice(0, 10)).filter(Boolean).sort();
  const quality = {
    tokens: { status: tokens.length ? 'provider-reported' : estimated.length ? 'estimated' : 'unavailable', events: tokens.length + estimated.length, note: 'Provider-reported token counts; estimated prompt bytes are kept separate and are never shown as exact tokens.' },
    cost: { status: reportedCosts.length ? 'provider-reported' : estimatedCosts.length ? 'client-reported-estimate' : 'unavailable', events: reportedCosts.length + estimatedCosts.length, note: 'Client-reported estimates may reflect subscription allowance, not an invoice. Missing cost is not zero.' },
    cpu: { status: totals.cpu.measured_seconds != null ? 'measured' : totals.cpu.sampled_seconds != null ? 'derived/sampled' : 'unavailable', events: data.filter((e) => cpuSecondsOf(e) != null).length, note: 'CPU-seconds are measured by the process wrapper, or derived from sampled container percentages. They are not hardware cycle counts.' },
    memory: { status: totals.cpu.peak_memory_bytes != null ? 'measured/sampled' : 'unavailable', events: data.filter((e) => memoryOf(e) != null).length, note: 'Peak RSS and container peaks are different measurements; PHP peak is per request.' },
    github: { status: github.length ? 'provider-reported' : 'unavailable', events: github.length, note: 'Durations and conclusions come from the GitHub API; billable minutes and runner CPU are unavailable.' },
    events: { total: data.length, complete: data.filter((e) => e.quality.completeness === 'complete').length, partial: data.filter((e) => e.quality.completeness === 'partial').length, estimated: data.filter((e) => e.quality.completeness === 'estimated').length, unavailable: data.filter((e) => e.quality.completeness === 'unavailable').length },
    sources: Object.fromEntries([...new Set(data.map((e) => `${e.source.adapter}:${e.source.confidence}`))].sort().map((k) => [k, data.filter((e) => `${e.source.adapter}:${e.source.confidence}` === k).length])),
    missing: [...new Set(data.flatMap((e) => e.quality.missing || []))].sort(),
  };

  const summary = {
    schema_version: '1.0.0',
    generated_at: new Date().toISOString(),
    period: { from: dates[0] || null, to: dates.at(-1) || null },
    completeness: quality.events.partial + quality.events.unavailable > 0 ? 'partial' : 'complete',
    totals, by_activity: activityRows, by_issue: issueRows, by_model: modelRows, by_tool: toolRows, github_workflows: githubWorkflows, trend,
    quality,
  };
  const priorityRank = { high: 0, medium: 1, low: 2 };
  summary.opportunities = findOpportunities(data, summary).sort((a, b) => (priorityRank[a.priority] ?? 9) - (priorityRank[b.priority] ?? 9));
  return summary;
}

// Public rows are aggregates, not individual sessions. That removes transcript titles, paths and precise working
// patterns while still supporting every dashboard filter.
export function publicRows(events) {
  const groups = new Map();
  for (const e of events) {
    if (e.activity === 'monitoring') continue;
    const key = [String(e.occurred_at).slice(0, 10), e.issue || 'unattributed', e.variant || '', e.activity, e.tool, e.model || '', e.provider || '', e.measurements.tokens.token_basis, costOf(e).basis, e.measurements.cpu.measurement, e.quality.completeness].join('|');
    const g = groups.get(key) || {
      date: String(e.occurred_at).slice(0, 10), issue: e.issue, variant: e.variant, activity: e.activity, tool: e.tool, model: e.model, provider: e.provider,
      token_basis: e.measurements.tokens.token_basis, cost_basis: costOf(e).basis, cpu_measurement: e.measurements.cpu.measurement,
      quality: e.quality.completeness, events: 0, tokens: null, uncached_input: null, output: null, cache_creation: null, cache_read: null, reasoning: null, model_requests: null, cost_usd: null, cpu_seconds: null, duration_seconds: null,
      tool_invocations: null, repeated_reads: null, github_runs: 0, github_seconds: null, peak_memory_bytes: null, outcomes: { success: 0, failure: 0, cancelled: 0, partial: 0, unknown: 0 }, evidence_ids: [],
    };
    g.events++;
    if (tokensOf(e) != null) g.tokens = (g.tokens || 0) + tokensOf(e);
    for (const key of ['uncached_input', 'output', 'cache_creation', 'cache_read', 'reasoning']) if (typeof e.measurements.tokens[key] === 'number') g[key] = (g[key] || 0) + e.measurements.tokens[key];
    if (e.measurements.tokens.model_requests != null) g.model_requests = (g.model_requests || 0) + e.measurements.tokens.model_requests;
    if (costOf(e).usd != null) g.cost_usd = (g.cost_usd || 0) + costOf(e).usd;
    if (cpuSecondsOf(e) != null) g.cpu_seconds = (g.cpu_seconds || 0) + cpuSecondsOf(e);
    if (e.duration_ms != null) g.duration_seconds = (g.duration_seconds || 0) + e.duration_ms / 1000;
    if (e.measurements.tools.invocations != null) g.tool_invocations = (g.tool_invocations || 0) + e.measurements.tools.invocations;
    if (e.measurements.tools.repeated_reads != null) g.repeated_reads = (g.repeated_reads || 0) + e.measurements.tools.repeated_reads;
    if (e.event_type === 'github-actions') { g.github_runs++; if (e.duration_ms != null) g.github_seconds = (g.github_seconds || 0) + e.duration_ms / 1000; }
    const mem = memoryOf(e); if (mem != null) g.peak_memory_bytes = Math.max(g.peak_memory_bytes || 0, mem);
    g.outcomes[e.outcome] = (g.outcomes[e.outcome] || 0) + 1;
    if (g.evidence_ids.length < 5) g.evidence_ids.push(e.event_id.slice(0, 12));
    groups.set(key, g);
  }
  return [...groups.values()].map((g) => ({ ...g, cost_usd: round(g.cost_usd), cpu_seconds: round(g.cpu_seconds), duration_seconds: round(g.duration_seconds, 1), github_seconds: round(g.github_seconds, 1) })).sort((a, b) => b.date.localeCompare(a.date) || String(a.activity).localeCompare(String(b.activity)));
}

function findOpportunities(events, summary) {
  const out = [];
  const push = (o) => out.push({ classification: 'possible-inefficiency', confidence: 'derived', ...o });
  const sessions = events.filter((e) => e.event_type === 'ai-usage' && e.source.adapter === 'claude-transcripts');
  const total = summary.totals.ai.tokens;
  const exploreTokens = (summary.by_activity.find((a) => a.activity === 'code-exploration') || {}).tokens;
  if (total && exploreTokens && exploreTokens / total >= 0.10) push({
    id: 'code-exploration-share', priority: 'high', heading: 'A material share of tokens is code exploration',
    measurement: { tokens: exploreTokens, share: Math.round(1000 * exploreTokens / total) / 1000, unit: 'share of provider-reported tokens' },
    evidence_event_ids: sessions.filter((e) => (e.measurements.allocations || []).some((a) => a.activity === 'code-exploration')).map((e) => e.event_id.slice(0, 12)).slice(0, 8),
    recommendation: 'When a lookup needs several reads, try `node scripts/code-map.mjs <env|folder> <symbol|file>` once before a grep/sed chain; measure the next session before changing instructions.',
    limitations: 'The allocation is derived from tool-call share, not provider per-tool token accounting. Complex accessibility work may legitimately need this exploration.',
  });
  const repeated = events.filter((e) => (e.measurements.tools.repeated_reads || 0) > 0);
  if (repeated.length) push({
    id: 'repeated-reads', priority: 'low', heading: 'Some sessions re-read the same file spans',
    measurement: { repeated_reads: repeated.reduce((n, e) => n + e.measurements.tools.repeated_reads, 0), sessions: repeated.length, unit: 'repeated reads' },
    evidence_event_ids: repeated.map((e) => e.event_id.slice(0, 12)).slice(0, 8),
    recommendation: 'Check whether a targeted range or `code-map.mjs` would answer the same question; do not change agent instructions from one session alone.',
    limitations: 'The client records repeated exact Read ranges; it does not know whether the second read was necessary.',
  });
  const highContext = sessions.filter((e) => (e.measurements.context.start_tokens || 0) >= 70000 || (e.measurements.context.average_tokens || 0) >= 300000);
  if (highContext.length) push({
    id: 'large-context', priority: 'high', heading: 'Several sessions start or average a large context',
    measurement: { sessions: highContext.length, max_start_tokens: Math.max(...highContext.map((e) => e.measurements.context.start_tokens || 0)), max_average_tokens: Math.max(...highContext.map((e) => e.measurements.context.average_tokens || 0)), unit: 'tokens' },
    evidence_event_ids: highContext.map((e) => e.event_id.slice(0, 12)).slice(0, 8),
    recommendation: 'Measure the starting context with `node scripts/context-size.mjs` before changing AGENTS.md, skills or memory files. The client re-reads context on every call, so a smaller start can matter more than a single large result.',
    limitations: 'A large context is not waste by itself; it may carry essential evidence. The existing 2026-10-15 option-C work already reduced AGENTS.md from 8.6k to 2.9k tokens.',
  });
  const rebuild = events.filter((e) => ['composer-install', 'environment-setup', 'cache-rebuild'].includes(e.activity));
  if (rebuild.length >= 2) {
    const byKey = new Map();
    for (const e of rebuild) { const k = `${e.activity}|${e.variant || ''}|${e.commit || ''}`; byKey.set(k, (byKey.get(k) || 0) + 1); }
    const repeatedRebuilds = [...byKey.entries()].filter(([, n]) => n >= 2).reduce((n, [, c]) => n + c, 0);
    if (repeatedRebuilds) push({
      id: 'repeated-environment-work', priority: 'medium', heading: 'The same environment work appears more than once',
      measurement: { events: repeatedRebuilds, unit: 'activity events with the same activity, variant and commit' },
      evidence_event_ids: rebuild.slice(0, 8).map((e) => e.event_id.slice(0, 12)),
      recommendation: 'Check whether the environment was unchanged before re-running Composer, cache rebuild or setup; `setup.mjs` is resumable and `lab-env.mjs status` shows what exists.',
      limitations: 'An activity label does not prove the work was redundant; a failed or partial build can legitimately need a rerun.',
    });
  }
  if (summary.totals.github.potentially_superseded > 0) push({
    id: 'superseded-ci', priority: 'medium', heading: 'Some GitHub Actions runs overlap a later run',
    measurement: { runs: summary.totals.github.potentially_superseded, unit: 'potentially superseded runs' },
    evidence_event_ids: events.filter((e) => e.measurements.github.potentially_superseded === true).map((e) => e.event_id.slice(0, 12)).slice(0, 8),
    recommendation: 'Review whether a push triggered CI that a later push made obsolete. Concurrency groups and a short debounce can reduce this; do not cancel a run that is producing needed evidence.',
    limitations: 'Overlap is inferred from GitHub timestamps. A run may have been useful despite a later run.',
  });
  if (summary.totals.ai.cost_estimated_usd != null && summary.totals.ai.cost_estimated_usd > 0 && summary.totals.ai.model_requests) {
    const per = summary.totals.ai.cost_estimated_usd / summary.totals.ai.model_requests;
    if (per > 0.2) push({
      id: 'high-cost-per-request', priority: 'medium', heading: 'The client-estimated cost per model request is material',
      measurement: { usd_per_request: Math.round(per * 1000) / 1000, model_requests: summary.totals.ai.model_requests, unit: 'client-estimated USD per request' },
      evidence_event_ids: sessions.slice(0, 5).map((e) => e.event_id.slice(0, 12)),
      recommendation: 'Inspect the largest sessions and their cache-read share. Reduce repeated context reads only after measuring; a subscription may not incur this charge.',
      limitations: 'The cost is the client’s estimate, not an invoice; subscription allowances may price individual calls differently.',
    });
  }
  return out;
}
