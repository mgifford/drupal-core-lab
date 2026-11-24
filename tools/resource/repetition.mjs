// Deterministic repeated-operation fingerprints. A "repetition" is deliberately narrow: the same measured command,
// the same Git revision, the same patch identity, the same execution environment and the same result signature. A
// repeat under changed conditions is recorded separately, not called waste. A repeated success may be a deliberate
// repeatability check; a repeated failure may be a real iteration. This module only ranks candidates for inspection.
import { stableStringify, sha256 } from './events.mjs';

const safe = (v) => (v == null ? null : String(v).slice(0, 200));

export function operationFingerprint(event) {
  const p = event.private || {};
  const result = p.result_signature
    ? `sig:${p.result_signature}`
    : `exit:${p.exit_status ?? ''}|signal:${p.signal ?? ''}|timeout:${p.timed_out ? '1' : '0'}|error:${p.error ? '1' : '0'}`;
  const fields = {
    command_hash: safe(p.command_hash),
    activity: event.activity || null,
    commit: event.commit || null,
    patch: event.patch || null,
    runner: event.environment?.runner || null,
    ddev: event.environment?.ddev || null,
    docker: event.environment?.docker || null,
    test_ids: (p.test_ids || []).map((x) => String(x)).sort(),
    result,
  };
  return { key: sha256(stableStringify(fields)), fields, command_key: sha256(stableStringify({ command_hash: fields.command_hash, activity: fields.activity })) };
}

const isProcess = (e) => e.event_type === 'process' && e.private?.command_hash;

export function repetitionGroups(events = []) {
  const groups = new Map();
  for (const event of events.filter(isProcess)) {
    const fp = operationFingerprint(event);
    const g = groups.get(fp.key) || {
      group_hash: fp.key.slice(0, 12), command_key: fp.command_key.slice(0, 12), activity: event.activity,
      runs: 0, success: 0, failure: 0, cancelled: 0, unknown: 0, commits: new Set(), patches: new Set(),
      first: event.occurred_at, last: event.occurred_at, evidence: [], conditions: fp.fields,
    };
    g.runs++;
    if (event.outcome === 'success') g.success++; else if (event.outcome === 'failure') g.failure++; else if (event.outcome === 'cancelled') g.cancelled++; else g.unknown++;
    if (event.commit) g.commits.add(event.commit);
    if (event.patch) g.patches.add(event.patch);
    if (String(event.occurred_at) < String(g.first)) g.first = event.occurred_at;
    if (String(event.occurred_at) > String(g.last)) g.last = event.occurred_at;
    if (g.evidence.length < 6) g.evidence.push(event.event_id.slice(0, 12));
    groups.set(fp.key, g);
  }
  const commandGroups = new Map();
  for (const g of groups.values()) {
    const c = commandGroups.get(g.command_key) || { command_key: g.command_key, activity: g.activity, condition_groups: 0, runs: 0 };
    c.condition_groups++; c.runs += g.runs; commandGroups.set(g.command_key, c);
  }
  const list = [...groups.values()].map((g) => ({
    group_hash: g.group_hash, command_key: g.command_key, activity: g.activity, runs: g.runs,
    success: g.success, failure: g.failure, cancelled: g.cancelled, unknown: g.unknown,
    repeated_runs: Math.max(0, g.runs - 1), unchanged_failures: Math.max(0, g.failure - 1), unchanged_successes: Math.max(0, g.success - 1),
    commits: g.commits.size, patches: g.patches.size, conditions: g.conditions, first: g.first, last: g.last, evidence: g.evidence,
    diagnostic: g.failure > 1 ? 'repeated_unchanged_failure' : g.success > 1 ? 'repeated_unchanged_success' : null,
  })).sort((a, b) => b.runs - a.runs || a.group_hash.localeCompare(b.group_hash));
  const repeated = list.filter((g) => g.runs > 1);
  const changed = [...commandGroups.values()].filter((c) => c.condition_groups > 1);
  return {
    groups: list,
    summary: {
      process_operations: list.reduce((n, g) => n + g.runs, 0),
      groups: list.length,
      repeated_groups: repeated.length,
      repeated_runs: repeated.reduce((n, g) => n + g.repeated_runs, 0),
      unchanged_failure_groups: list.filter((g) => g.failure > 1).length,
      unchanged_failure_runs: list.reduce((n, g) => n + g.unchanged_failures, 0),
      unchanged_success_groups: list.filter((g) => g.success > 1).length,
      unchanged_success_runs: list.reduce((n, g) => n + g.unchanged_successes, 0),
      commands_with_changed_conditions: changed.length,
      commands_with_changed_condition_runs: changed.reduce((n, c) => n + c.runs, 0),
      note: 'A repetition is the same command, revision, patch, environment and result signature. A repeated success may be a deliberate repeatability check; a repeated failure may be a real iteration. Inspect before calling either waste.',
    },
  };
}

// Public rows: no command hash, no result signature, no paths. A group hash is only a citation key.
export function repetitionRows(events = []) {
  const { groups } = repetitionGroups(events);
  return groups.filter((g) => g.runs > 1).map((g) => ({
    group_hash: g.group_hash, activity: g.activity, runs: g.runs,
    success: g.success, failure: g.failure, cancelled: g.cancelled, unknown: g.unknown,
    repeated_runs: g.repeated_runs, unchanged_failures: g.unchanged_failures, unchanged_successes: g.unchanged_successes,
    commits: g.commits, patches: g.patches, first: String(g.first).slice(0, 10), last: String(g.last).slice(0, 10), diagnostic: g.diagnostic,
  }));
}
