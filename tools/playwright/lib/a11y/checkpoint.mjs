// A named accessibility checkpoint: the record of one meaningful application state, at one moment, on one side, with
// the evidence gathered there. This module is pure (no browser, no filesystem): it builds, validates and summarises the
// record, so the same code is used by the Playwright MCP bridge and by the deterministic scenario runner.
//
// The record is the canonical evidence. Markdown and HTML reports are generated from it, never the other way round.
import { findingTotals, manualChecks } from './findings.mjs';

export const SCHEMA = 'lab-a11y-checkpoint/1';
export const STATUSES = ['captured', 'state-not-reached', 'refused', 'tool-error'];
export const SIDES = ['before', 'after'];

const ID_RE = /^[a-z0-9][a-z0-9._-]{0,79}$/;
export const validId = (id) => typeof id === 'string' && ID_RE.test(id);

// Problems with a checkpoint record, as short strings; empty when complete. Used before a record is written and by the
// tests, so a report can never publish a checkpoint that is missing its provenance.
export function checkpointProblems(c) {
  const p = [];
  if (!c || typeof c !== 'object') return ['not an object'];
  if (c.schema !== SCHEMA) p.push(`schema must be ${SCHEMA}`);
  if (!validId(c.id)) p.push('id must be a lower-case identifier ([a-z0-9._-], 1-80 characters starting with a letter or digit)');
  if (!Number.isInteger(c.sequence) || c.sequence < 1) p.push('sequence must be a positive integer');
  if (!c.when || Number.isNaN(Date.parse(c.when))) p.push('when must be an ISO timestamp');
  if (!STATUSES.includes(c.status)) p.push(`status must be one of ${STATUSES.join(', ')}`);
  if (c.issue != null && !/^\d+$/.test(String(c.issue))) p.push('issue must be a drupal.org issue number or null');
  if (c.side != null && !SIDES.includes(c.side)) p.push('side must be before, after or null');
  if (!c.scenario || typeof c.scenario.id !== 'string' || !c.scenario.id) p.push('scenario.id is required');
  if (!c.provenance || !c.provenance.source) p.push('provenance.source is required');
  if (!c.environment || !c.environment.browser) p.push('environment.browser is required');
  if (!c.page || typeof c.page.path !== 'string') p.push('page.path is required');
  if (!c.evidence || !Array.isArray(c.evidence.engines)) p.push('evidence.engines is required');
  if (!Array.isArray(c.findings)) p.push('findings must be an array');
  if (!Array.isArray(c.manual)) p.push('manual must be an array');
  if (!c.state || !c.state.readiness) p.push('state.readiness is required');
  return p;
}

// The provenance block of a checkpoint: everything needed to know what was measured, without trusting the caller.
export function provenanceOf({ source, mcp = null, scenario = null, variant = null, issue = null, side = null, core = null, page = null, patchState = null }) {
  return {
    source,
    ...(mcp ? { mcp } : {}),
    scenario,
    variant,
    issue,
    side,
    core: core || null,
    patchState: patchState || null,
    page: page ? { origin: page.origin, host: page.host, path: page.path, queryNames: page.queryNames || [] } : null,
  };
}

// Build the record. Fields the caller does not supply are explicit nulls or empty lists: no silent defaults that read as
// evidence. interactive/collector output arrives from capture.mjs.
export function createCheckpoint({
  id, sequence, label, status = 'captured', when = new Date().toISOString(),
  provenance, scenario, environment, page,
  interaction = {}, focus = {}, state = {}, evidence = {}, findings = [], manual = [], limits = [],
  resources = {}, note = null,
}) {
  const record = {
    schema: SCHEMA,
    id,
    sequence,
    label: label || id,
    status,
    when,
    issue: provenance?.issue ?? null,
    variant: provenance?.variant ?? null,
    side: provenance?.side ?? null,
    scenario,
    provenance,
    environment,
    page,
    interaction,
    focus,
    state,
    evidence,
    findings,
    manual,
    limits,
    resources,
    ...(note ? { note } : {}),
  };
  return record;
}

// The compact object returned to an agent. Bounded on purpose: an agent gets counts, the rules that failed and at most
// twelve findings; the full evidence stays on disk. Never the whole DOM, never every axe node.
export function compactCheckpoint(c, { maxFindings = 12 } = {}) {
  const totals = findingTotals(c.findings);
  const top = [...c.findings]
    .sort((a, b) => (rank(a.impact) - rank(b.impact)) || a.ruleId.localeCompare(b.ruleId))
    .slice(0, maxFindings)
    .map((f) => ({
      id: f.displayId,
      engine: f.engine.id,
      rule: f.ruleId,
      outcome: f.outcome,
      impact: f.impact,
      wcag: f.wcag,
      target: String(f.element?.selector || '').slice(0, 140),
      html: String(f.element?.html || '').slice(0, 140),
      observedAt: Math.max(1, (f.observations || []).length),
    }));
  return {
    checkpoint: { id: c.id, label: c.label, sequence: c.sequence, status: c.status, when: c.when },
    provenance: { issue: c.issue, variant: c.variant, side: c.side, core: c.provenance?.core?.commit || null, source: c.provenance?.source },
    where: { path: c.page?.path, theme: c.environment?.theme, viewport: c.environment?.viewport, colorScheme: c.environment?.colorScheme, forcedColors: c.environment?.forcedColors, reducedMotion: c.environment?.reducedMotion },
    state: { ready: c.state?.readiness?.satisfied, dialogs: (c.state?.application?.dialogs || []).filter((d) => d.open).length, expanded: c.state?.application?.expanded?.length || 0, focused: c.focus?.active ? `${c.focus.active.role || c.focus.active.tag}${c.focus.active.name ? ` "${String(c.focus.active.name).slice(0, 60)}"` : ''}` : null, brokenRefs: c.state?.application?.aria?.brokenRefs?.length || 0 },
    engines: (c.evidence?.engines || []).map((e) => ({ engine: e.engine, version: e.version, status: e.status, error: e.error || null, violations: e.counts?.violations ?? null, incomplete: e.counts?.incomplete ?? null })),
    totals,
    findings: top,
    moreFindings: Math.max(0, totals.distinct - top.length),
    manual: c.manual.filter((m) => m.requiresPerson).map((m) => m.id),
    evidence: c.evidence?.dir ? { dir: c.evidence.dir, summary: c.evidence.summary || null, report: c.evidence.report || null } : null,
    limits: c.limits,
    resources: { scanMs: c.resources?.scanMs ?? null, evidenceBytes: c.resources?.evidenceBytes ?? null, screenshots: c.resources?.screenshots ?? 0 },
    next: totals.distinct ? 'Read the full findings in the evidence directory before reporting; incomplete engine results are questions, not passes.' : 'No automated findings here. That is not proof of accessibility: run the manual checks for this checkpoint.',
  };
}

const rank = (impact) => ({ critical: 0, serious: 1, moderate: 2, minor: 3 }[impact] ?? 4);

// Readiness conditions. An explicit condition, never a sleep: the caller says what it is waiting for, and a state that
// is not reached is a result (`state-not-reached`), not a failed scan.
export const READINESS = {
  selector: (v) => ({ kind: 'selector', selector: String(v.selector), state: v.state || 'visible', timeoutMs: clampTimeout(v.timeoutMs) }),
  function: (v) => ({ kind: 'function', expression: String(v.expression).slice(0, 2000), timeoutMs: clampTimeout(v.timeoutMs) }),
  networkIdle: (v) => ({ kind: 'networkIdle', timeoutMs: clampTimeout(v.timeoutMs) }),
  none: () => ({ kind: 'none', timeoutMs: 0 }),
};

export function readinessOf(input) {
  if (!input) return READINESS.none();
  if (typeof input === 'string') return READINESS.selector({ selector: input });
  if (input.selector) return READINESS.selector(input);
  if (input.expression) return READINESS.function(input);
  if (input.networkIdle || input.kind === 'networkIdle') return READINESS.networkIdle(input);
  throw new Error('readiness must be a selector string, { selector }, { expression } or { networkIdle: true }');
}

const clampTimeout = (ms) => Math.max(250, Math.min(Number(ms) || 10000, 120000));

// Equivalent Before/After states: compare the facts a person would use to decide "these are the same thing, in two
// builds", not "both pages answer 200". A failure is recorded, and a comparison on non-equivalent states is refused
// rather than silently made.
//
// expectations:
//   states: [{ path, truthy?, equals?, countMin? }]   facts both sides must share
//   content: string[]                                text that must be visible on both sides
//   dialogOpen: boolean                              both sides have an open dialog
//   focus: "role:name" (informational unless allowDifferentFocus is false)
export function equivalence(before, after, expectations = {}) {
  const checks = [];
  const add = (name, pass, detail) => checks.push({ name, pass: !!pass, detail });
  if (!before || !after) return { equivalent: false, checks: [{ name: 'both sides captured', pass: false, detail: 'a side is missing' }] };
  add('same scenario', before.scenario?.id === after.scenario?.id, `${before.scenario?.id} vs ${after.scenario?.id}`);
  add('same checkpoint', before.id === after.id, `${before.id} vs ${after.id}`);
  add('same route', before.page?.path === after.page?.path, `${before.page?.path} vs ${after.page?.path}`);
  add('same viewport', JSON.stringify(before.environment?.viewport) === JSON.stringify(after.environment?.viewport), `${JSON.stringify(before.environment?.viewport)} vs ${JSON.stringify(after.environment?.viewport)}`);
  for (const key of ['colorScheme', 'forcedColors', 'reducedMotion', 'contrast']) {
    add(`same ${key}`, before.environment?.[key] === after.environment?.[key], `${before.environment?.[key]} vs ${after.environment?.[key]}`);
  }
  add('both reached a captured state', before.status === 'captured' && after.status === 'captured', `${before.status} / ${after.status}`);
  if (expectations.dialogOpen) {
    const open = (c) => (c.state?.application?.dialogs || []).some((d) => d.open);
    add('a dialog is open on both sides', open(before) && open(after), `before=${open(before)} after=${open(after)}`);
  }
  for (const exp of expectations.states || []) {
    const b = readPath(before, exp.path), a = readPath(after, exp.path);
    let pass;
    if (Object.hasOwn(exp, 'equals')) pass = deepEqual(b, exp.equals) && deepEqual(a, exp.equals);
    else if (Object.hasOwn(exp, 'countMin')) pass = Array.isArray(b) && Array.isArray(a) && b.length >= exp.countMin && a.length >= exp.countMin;
    else { const want = exp.truthy === undefined ? true : !!exp.truthy; pass = Boolean(b) === want && Boolean(a) === want; }
    add(`state: ${exp.path}`, pass, `before=${shortJson(b)} after=${shortJson(a)}`);
  }
  if (expectations.content?.length) {
    const text = (c) => String(c.state?.application?.visibleText || '');
    const missing = (c) => expectations.content.filter((s) => !text(c).includes(s));
    add('expected content present on both sides', missing(before).length === 0 && missing(after).length === 0, `missing Before: ${JSON.stringify(missing(before))}; missing After: ${JSON.stringify(missing(after))}`);
  }
  if (expectations.focus) {
    const f = (c) => `${c.focus?.active?.role || ''}:${c.focus?.active?.name || ''}`;
    const same = f(before) === f(after);
    add('focus as expected', same && f(before) === expectations.focus, `before=${f(before)} after=${f(after)} expected ${expectations.focus}`);
  }
  return { equivalent: checks.every((c) => c.pass), checks };
}

function deepEqual(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
function shortJson(v) {
  if (v === undefined) return 'undefined';
  if (Array.isArray(v)) return `${v.length} item(s)`;
  if (v && typeof v === 'object') return Object.keys(v).length ? `${Object.keys(v).length} field(s)` : '{}';
  return JSON.stringify(v);
}

function readPath(obj, dotted) {
  let cur = obj;
  for (const part of String(dotted).split('.')) {
    if (cur == null) return undefined;
    cur = cur[part];
  }
  return cur;
}

// The manual checklist for a checkpoint: derived from what is present, stored separately from automated findings.
export function checkpointManual(state, { findings = [], side = null } = {}) {
  return manualChecks(state, { findings, side });
}

export { findingTotals };
