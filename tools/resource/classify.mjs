// Deterministic activity classification. It uses tool names, script registries and parsed shell structure; it never reads
// message text, executes a command or calls a model. A session can mix activities; `allocateActivity` and
// `allocateOperations` create an explicit, derived token split and label the method and its limitations.
//
// Backwards compatibility: `classifyTool()` still returns an activity string. New code should use
// `classifyLabelDetailed()` / `classifyOperation()` so that the rule, provenance, confidence and Unknown reason travel
// with the classification.
import {
  CLASSIFIER_VERSION, RULE_REGISTRY_VERSION, UNKNOWN_REASONS, PROVENANCE, CONFIDENCE,
  EXPLORATION_SUBCATEGORIES, TOOL_RULES, NAVIGATION, PLUMBING, classifyShell, classifyArgv,
  primaryActivity, isStrongPrimary, hasMultipleStrong, dominantSubcategory, scriptRule,
} from './rules.mjs';

export { CLASSIFIER_VERSION, RULE_REGISTRY_VERSION, UNKNOWN_REASONS, PROVENANCE, CONFIDENCE, EXPLORATION_SUBCATEGORIES };

const ACTIVITY_METHOD = 'tool-call share; derived';
export const ALLOCATION_METHOD_VERSION = 'legacy-tool-call-share-v1';

const base = (activity, extra = {}) => ({
  activity: activity || 'unknown',
  subcategory: null,
  rule_id: 'unclassified',
  rule_version: RULE_REGISTRY_VERSION,
  classifier_version: CLASSIFIER_VERSION,
  provenance: 'unclassified',
  confidence: activity && activity !== 'unknown' ? 'deterministic' : 'unclassified',
  unknown_reason: activity && activity !== 'unknown' ? null : 'unclassified_other',
  components: [],
  notes: [],
  ...extra,
});

function finish(d) {
  const out = base(d.activity, d);
  if (out.activity !== 'unknown') out.unknown_reason = null;
  if (out.unknown_reason && !UNKNOWN_REASONS[out.unknown_reason]) out.unknown_reason = 'unclassified_other';
  out.components = (out.components || []).map((c) => ({
    activity: c.activity || 'unknown',
    rule_id: c.rule_id || 'unclassified',
    subcategory: c.subcategory || null,
    ...(c.activity === 'unknown' && c.unknown_reason ? { unknown_reason: c.unknown_reason } : {}),
  }));
  return out;
}

// Classify a full tool label as recorded by scripts/session-usage.mjs. This is the fallback path when the raw tool
// arguments are not available; it deliberately cannot see a loop body, so `Bash/for` stays Unknown.
export function classifyLabelDetailed(label) {
  const text = String(label || '').trim();
  if (!text) return finish({ activity: 'unknown', unknown_reason: 'missing_tool_details', rule_id: 'label.empty' });
  if (text.startsWith('Bash/lab:')) {
    const scripts = text.slice('Bash/lab:'.length).split('+').map((name) => name.trim().replace(/^lab:/, '')).filter(Boolean);
    if (!scripts.length) return finish({ activity: 'unknown', unknown_reason: 'missing_tool_details', rule_id: 'label.lab-empty' });
    const results = scripts.map((name) => {
      const file = /\.(?:mjs|cjs|js|php)$/.test(name) ? name : `${name}.mjs`;
      const rule = scriptRule(file);
      if (rule) return { activity: rule.activity, rule_id: rule.rule_id, provenance: 'known_script_registry', confidence: 'deterministic', components: [{ activity: rule.activity, rule_id: rule.rule_id }] };
      return classifyOperation({ tool: 'Bash', command: `node scripts/${file}` });
    });
    return combine(results, { source: 'known_script_registry' });
  }
  if (text.startsWith('Bash/')) {
    const rest = text.slice('Bash/'.length).trim();
    if (!rest) return finish({ activity: 'unknown', unknown_reason: 'missing_tool_details', rule_id: 'label.bash-empty' });
    if (['for', 'while', 'until'].includes(rest)) return finish({ activity: 'unknown', unknown_reason: 'compound_command', rule_id: 'label.loop-without-body', notes: ['The label records only the loop keyword, not its body.'] });
    if (rest === 'S') return finish({ activity: 'unknown', unknown_reason: 'unrecognized_command', rule_id: 'label.unrecognized' });
    return finish(classifyShell(rest));
  }
  const rule = toolRule(text);
  if (rule) return finish({ ...rule, components: [rule] });
  return finish({ activity: 'unknown', unknown_reason: 'unrecognized_tool', rule_id: 'tool.unknown' });
}

function toolRule(name) {
  for (const r of TOOL_RULES) if (r.match.test(name)) return { activity: r.activity, subcategory: r.subcategory || null, rule_id: r.rule, provenance: r.provenance || 'tool_name_rule', confidence: 'deterministic' };
  return null;
}

// Classify one tool invocation when the client exposed structured arguments. `command` is only used for Bash; it is
// parsed, never executed, and is not stored in the event.
export function classifyOperation(op = {}) {
  const tool = String(op.tool || op.name || '');
  if (!tool) return finish({ activity: 'unknown', unknown_reason: 'missing_tool_details', rule_id: 'operation.no-tool' });
  if (tool === 'Bash') {
    if (!op.command || !String(op.command).trim()) return finish({ activity: 'unknown', unknown_reason: 'missing_tool_details', rule_id: 'operation.bash-no-command' });
    const d = classifyShell(String(op.command));
    return finish({ ...d, provenance: d.provenance || 'parsed_command' });
  }
  const rule = toolRule(tool);
  if (rule) return finish({ ...rule, components: [rule] });
  return finish({ activity: 'unknown', unknown_reason: 'unrecognized_tool', rule_id: 'tool.unknown' });
}

function combine(results, { source = 'parsed_command' } = {}) {
  const known = results.filter((r) => r.activity !== 'unknown');
  const unknown = results.filter((r) => r.activity === 'unknown');
  const activities = [...new Set(known.map((r) => r.activity))];
  const provenance = known.some((r) => r.provenance === 'known_script_registry') ? 'known_script_registry' : source;
  if (activities.length === 1 && unknown.length === 0) {
    const sub = known.find((r) => r.subcategory)?.subcategory || null;
    return finish({ activity: activities[0], subcategory: sub, rule_id: known[0].rule_id, provenance, confidence: 'deterministic', components: known });
  }
  if (activities.length > 1) {
    if (hasMultipleStrong(known)) return finish({ activity: 'unknown', unknown_reason: 'ambiguous_activity', rule_id: 'combine.ambiguous-strong', provenance: 'contextual_inference', confidence: 'heuristic', components: [...known, ...unknown], notes: [`More than one strong activity is present (${activities.join(', ')}); no primary is asserted.`] });
    const primary = primaryActivity(known);
    const sub = primary === 'code-exploration' ? dominantSubcategory(known) : (known.find((c) => c.activity === primary)?.subcategory || null);
    return finish({ activity: primary, subcategory: sub, rule_id: `combine.primary:${known.find((c) => c.activity === primary)?.rule_id || primary}`, provenance: 'contextual_inference', confidence: 'heuristic', components: [...known, ...unknown], notes: [`Primary-operation rule chose ${primary} from ${activities.join(', ')}; no token split is asserted.`] });
  }
  if (activities.length === 1) return finish({ activity: 'unknown', unknown_reason: 'compound_command', rule_id: 'combine.partial', provenance: 'contextual_inference', confidence: 'heuristic', components: [...known, ...unknown] });
  return finish({ activity: 'unknown', unknown_reason: unknown[0]?.unknown_reason || 'unclassified_other', rule_id: unknown[0]?.rule_id || 'combine.unknown', components: unknown });
}

// Backwards-compatible string API.
export function classifyTool(label) { return classifyLabelDetailed(label).activity; }
export function classifyCommand(argv = []) { return classifyArgv(argv).activity; }
export const classifyToolDetailed = classifyLabelDetailed;

export function classifyWorkflow(workflow = '', job = '') {
  const text = `${workflow} ${job}`;
  if (/publish cloud|pages/i.test(text)) return 'documentation-generation';
  if (/issue status/i.test(text)) return 'issue-intake';
  if (/pins check|build pins/i.test(text)) return 'environment-setup';
  if (/info.yml linter/i.test(text)) return 'validation';
  if (/self-test|cloud\/ is up to date|check/i.test(text)) return 'validation';
  return 'github-actions';
}

export function issueFromText(...parts) {
  for (const part of parts.filter(Boolean)) {
    const s = String(part);
    const explicit = s.match(/(?:#|issue\s*[#:]?\s*|\/issues\/)(\d{5,7})\b/i) || s.match(/\bissue[-/](\d{5,7})\b/i);
    if (explicit) return explicit[1];
  }
  return null;
}

export function variantFromText(...parts) {
  for (const part of parts.filter(Boolean)) {
    const m = String(part).match(/\b(\d{5,7}-[a-z0-9][a-z0-9-]{0,50})\b/i);
    if (m) return m[1];
  }
  return null;
}

// Aggregate a set of tool labels into activity weights. Used by the legacy session path and by tests.
function bucketsFromLabels(tools) {
  const buckets = new Map();
  for (const [label, tool] of Object.entries(tools || {})) {
    const calls = Number(tool?.calls) || 0;
    if (!calls) continue;
    const d = classifyLabelDetailed(label);
    const key = d.activity === 'unknown' ? `unknown:${d.unknown_reason || 'unclassified_other'}` : d.activity;
    const b = buckets.get(key) || { activity: d.activity, reason: d.unknown_reason, calls: 0, rule_id: d.rule_id, provenance: d.provenance, subcategory: d.subcategory };
    b.calls += calls;
    buckets.set(key, b);
  }
  return buckets;
}

function bucketsFromOperations(operations) {
  const buckets = new Map();
  for (const op of operations || []) {
    const d = classifyOperation(op);
    const key = d.activity === 'unknown' ? `unknown:${d.unknown_reason || 'unclassified_other'}` : d.activity;
    const b = buckets.get(key) || { activity: d.activity, reason: d.unknown_reason, calls: 0, rule_id: d.rule_id, provenance: d.provenance, subcategory: d.subcategory };
    b.calls += 1;
    buckets.set(key, b);
  }
  return buckets;
}

function allocateBuckets(buckets, tokens, cpuSeconds) {
  const totalCalls = [...buckets.values()].reduce((n, b) => n + b.calls, 0);
  if (!totalCalls) return { activity: 'unknown', allocations: [], classification: { version: CLASSIFIER_VERSION, method: 'tool-call-share', provenance: 'unclassified', confidence: 'unclassified', unknown_reasons: [{ reason: 'missing_tool_details', operations: 0 }], components: [] } };
  const ordered = [...buckets.values()].sort((a, b) => b.calls - a.calls || a.activity.localeCompare(b.activity) || String(a.reason).localeCompare(String(b.reason)));
  const allocations = [];
  let allocated = 0;
  ordered.forEach((b, i) => {
    const share = b.calls / totalCalls;
    const isLast = i === ordered.length - 1;
    const t = tokens == null ? null : (isLast ? tokens - allocated : Math.round(tokens * share));
    const c = cpuSeconds == null ? null : Math.round(cpuSeconds * share * 1000) / 1000;
    if (t !== null) allocated += t;
    const entry = { activity: b.activity, tokens: t, cpu_seconds: c, method: ACTIVITY_METHOD };
    if (b.activity === 'unknown') entry.reason = b.reason || 'unclassified_other';
    allocations.push(entry);
  });
  const unknownReasons = ordered.filter((b) => b.activity === 'unknown').map((b) => ({ reason: b.reason || 'unclassified_other', operations: b.calls }));
  return {
    activity: ordered[0].activity,
    allocations,
    classification: {
      version: CLASSIFIER_VERSION,
      method: 'tool-call-share',
      method_version: ALLOCATION_METHOD_VERSION,
      provenance: 'contextual_inference',
      confidence: 'heuristic',
      unknown_reasons: unknownReasons,
      components: ordered.map((b) => ({ activity: b.activity, operations: b.calls, ...(b.activity === 'unknown' ? { unknown_reason: b.reason || 'unclassified_other' } : {}) })),
      notes: ['Tokens are split by tool-call share, not provider per-tool accounting.'],
    },
  };
}

// Allocate a session's tokens to activities by tool-call share. The result is explicitly derived; it is not a provider
// measurement of per-activity tokens. `method_version` makes the historical method distinguishable from request-level
// accounting.
export function allocateActivity(tools = {}, tokens = null, cpuSeconds = null) {
  return allocateBuckets(bucketsFromLabels(tools), tokens, cpuSeconds);
}

// Request-level path: every tool operation contributes one call. A request with several operations is not split by
// tokens here; the caller decides whether the request has one activity or stays Unknown/ambiguous.
export function allocateOperations(operations = [], tokens = null, cpuSeconds = null) {
  return allocateBuckets(bucketsFromOperations(operations), tokens, cpuSeconds);
}

// Aggregate exploration subcategories from classified operations (session or request level).
export function explorationSubcategories(operations = []) {
  const out = {};
  for (const op of operations) {
    const d = classifyOperation(op);
    if (d.activity === 'code-exploration' && d.subcategory) out[d.subcategory] = (out[d.subcategory] || 0) + 1;
  }
  return out;
}

// Classify a provider request from the operations it invoked. A tool-free request stays Unknown with a specific reason;
// it is still counted. A request with several distinct activities stays Unknown/ambiguous rather than dividing its
// provider-reported tokens among tools.
export function classifyRequestOperations(operations = []) {
  if (!operations.length) return finish({ activity: 'unknown', unknown_reason: 'model_only_request', rule_id: 'request.no-tools' });
  const detailed = operations.map((op) => classifyOperation(op));
  const known = detailed.filter((d) => d.activity !== 'unknown');
  const activities = [...new Set(known.map((d) => d.activity))];
  const components = detailed.map((d) => ({ activity: d.activity, rule_id: d.rule_id, subcategory: d.subcategory, ...(d.activity === 'unknown' ? { unknown_reason: d.unknown_reason } : {}) }));
  if (activities.length === 1 && known.length === detailed.length) {
    const counts = new Map();
    for (const d of known) if (d.subcategory) counts.set(d.subcategory, (counts.get(d.subcategory) || 0) + 1);
    const subcategory = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] || null;
    return finish({ activity: activities[0], subcategory, rule_id: known[0].rule_id, provenance: [...new Set(known.map((d) => d.provenance))].length === 1 ? known[0].provenance : 'contextual_inference', confidence: 'deterministic', components });
  }
  if (activities.length > 1) {
    if (hasMultipleStrong(known)) return finish({ activity: 'unknown', unknown_reason: 'ambiguous_activity', rule_id: 'request.ambiguous-strong', provenance: 'contextual_inference', confidence: 'heuristic', components, notes: [`More than one strong activity is present (${activities.join(', ')}); the request's tokens are not divided among tools.`] });
    const primary = primaryActivity(known);
    const subcategory = primary === 'code-exploration' ? dominantSubcategory(known) : null;
    return finish({ activity: primary, subcategory, rule_id: `request.primary:${known.find((d) => d.activity === primary)?.rule_id || primary}`, provenance: 'contextual_inference', confidence: 'heuristic', components, notes: [`Primary-operation rule chose ${primary} from ${activities.join(', ')}; the request's tokens are not divided among tools.`] });
  }
  if (activities.length === 1) {
    const primary = activities[0];
    if (isStrongPrimary(primary)) return finish({ activity: primary, subcategory: primary === 'code-exploration' ? dominantSubcategory(known) : null, rule_id: `request.primary:${known[0].rule_id}`, provenance: 'contextual_inference', confidence: 'heuristic', components, notes: [`${primary} is the primary operation; ${detailed.length - known.length} part(s) of the request remain unclassified.`] });
    return finish({ activity: 'unknown', unknown_reason: 'compound_command', rule_id: 'request.partial', provenance: 'contextual_inference', confidence: 'heuristic', components });
  }
  return finish({ activity: 'unknown', unknown_reason: detailed[0]?.unknown_reason || 'unrecognized_tool', rule_id: detailed[0]?.rule_id || 'request.unknown', components });
}
