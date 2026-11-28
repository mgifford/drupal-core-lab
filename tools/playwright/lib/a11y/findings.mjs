// From engine output to state-aware findings: normalise, fingerprint, dedupe, classify.
//
// Two rules drive everything here:
//   1. A finding is never counted once per checkpoint. The same rule failing the same element in several states is one
//      finding with several observations. It is one defect, not three.
//   2. Engines are not interchangeable. A finding keeps its engine and rule identifier; WCAG and ACT identifiers are
//      mappings, not evidence. Two engines agreeing is not proof; one engine failing alone is not noise.
//
// Fingerprints reuse the lab's frozen profiles in tools/a11y-fingerprints.js (a11y/pattern/v1, with state_key) rather
// than inventing a second scheme.
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { computeA11yPatternFingerprint, computeA11yOccurrenceFingerprint } = require('../../../a11y-fingerprints.js');

// A CSS locator at pattern level: positional selectors such as :nth-of-type(2) are removed, so a finding survives the
// element moving within its parent (an AJAX re-render, a reordered toolbar). The occurrence fingerprint keeps the
// page-level location; the pattern fingerprint is the identity used for deduplication.
export function normaliseSelector(selector) {
  return String(selector || '')
    .replace(/^#?HTMLCS[^ ]* /, '')
    // Drupal's Html::getUniqueId() suffix ("--" plus 11 characters) and the long numeric suffixes the toolbar and
    // navigation generate differ between two sites built from the same code. The lab's tree diff already normalises
    // these (lib/tree-format.mjs normaliseTree); a finding's identity must too, or two identical pages look different.
    .replace(/--(?=[a-z_-]*[A-Z0-9])[A-Za-z0-9_-]{11}(?![A-Za-z0-9_-])/g, '--RANDOM')
    .replace(/(?<![0-9A-Za-z])(?=[0-9a-f]*[a-f])(?=[0-9a-f]*\d)[0-9a-f]{32,64}(?![0-9A-Za-z])/g, 'HEX')
    .replace(/-\d{7,}(?![0-9])/g, '-RANDOM')
    .replace(/:nth-(of-type|child|last-of-type|last-child)\(\d+\)/g, '')
    .replace(/\s*>\s*/g, ' > ')
    .replace(/\s+/g, ' ')
    .trim() || '(unknown target)';
}

// The same normalisation for the HTML snippet a finding keeps, so a re-rendered page with different random ids is not
// reported as a changed finding.
export function normaliseHtml(html) {
  return String(html || '')
    .replace(/--(?=[a-z_-]*[A-Z0-9])[A-Za-z0-9_-]{11}(?![A-Za-z0-9_-])/g, '--RANDOM')
    .replace(/(?<![0-9A-Za-z])(?=[0-9a-f]*[a-f])(?=[0-9a-f]*\d)[0-9a-f]{32,64}(?![0-9A-Za-z])/g, 'HEX')
    .replace(/-\d{7,}(?![0-9])/g, '-RANDOM');
}

// An element identity that a person can recognise in a report, distinct from the selector (which changes with markup).
const short = (s, n = 80) => { const t = String(s ?? '').replace(/\s+/g, ' ').trim(); return t.length > n ? `${t.slice(0, n - 1)}…` : t; };

function semanticOf(target, element) {
  if (element && (element.role || element.name)) return { role: element.role || null, name: element.name || null, source: 'live-element' };
  const html = target?.html || '';
  const role = /role="([^"]{1,80})"/.exec(html)?.[1] || null;
  const label = /aria-label="([^"]{1,120})"/.exec(html)?.[1] || null;
  return { role, name: label, source: role || label ? 'html-attribute' : 'none' };
}

export function frameAndShadowContext(targetTree) {
  // Engines hand back a list of selectors: the last one is the element, earlier ones are the frames or shadow roots that
  // contain it. Which kind each boundary is cannot be told from the selector alone, so it is named as a boundary, not guessed.
  const tree = Array.isArray(targetTree) ? targetTree.filter(Boolean) : [];
  return {
    targetTree: tree.map(String),
    selector: tree.length ? String(tree[tree.length - 1]) : null,
    contextPath: tree.slice(0, -1).map(String),
    contextKinds: tree.slice(0, -1).map(() => 'frame-or-shadow-boundary'),
  };
}

// One engine finding -> the lab's finding record. Everything needed to reproduce and to compare is kept; nothing is
// flattened away. `provenance` is filled by the checkpoint, not here.
export function normaliseFinding(raw, { side = null, checkpointId = null, scenarioId = null, pagePath = null, testProfile = null, element = null } = {}) {
  const target = raw.target || {};
  const ctx = frameAndShadowContext(target.targetTree || (target.target ? [target.target] : []));
  const selector = ctx.selector || target.target || '(unknown target)';
  const normalized = normaliseSelector(selector);
  const engineId = raw.engine?.id || 'unknown';
  const pattern = computeA11yPatternFingerprint(normalized, engineId, raw.ruleId, null);
  const occurrence = computeA11yOccurrenceFingerprint(pattern.fingerprint, pagePath || '/', testProfile || null);
  const identity = {
    selector,
    normalizedSelector: normalized,
    xpath: target.xpath || null,
    html: short(target.html || raw.html || '', 300),
    htmlNormalised: normaliseHtml(short(target.html || raw.html || '', 300)),
    semantic: semanticOf(target, element),
    context: ctx,
  };
  return {
    schema: 'lab-a11y-finding/1',
    fingerprint: pattern.fingerprint,
    displayId: pattern.displayId,
    occurrenceFingerprint: occurrence.fingerprint,
    occurrenceDisplayId: occurrence.displayId,
    engine: { id: engineId, version: raw.engine?.version || 'unknown' },
    outcome: raw.outcome || 'violation',
    ruleId: raw.ruleId,
    ruleLabel: raw.ruleLabel || raw.ruleId,
    impact: raw.impact ?? null,
    engineSeverity: raw.engineSeverity ?? null,
    wcag: raw.wcag || [],
    actRuleIds: raw.actRuleIds || [],
    helpUrl: raw.helpUrl || null,
    element: identity,
    observedFailure: short(raw.message || raw.ruleLabel || '', 600),
    expectedBehaviour: expectedFor(raw),
    evidenceRef: null,               // the checkpoint sets this to the raw engine output
    confidence: confidenceFor(raw),
    reviewStatus: raw.outcome === 'incomplete' ? 'needs-review' : 'unreviewed',
    provenance: { scenarioId, checkpointId, side, pagePath },
    observations: [],
    manual: false,
  };
}

// What should have happened, in the engine's terms. Kept separate from WCAG wording, which is a mapping.
function expectedFor(raw) {
  const wcag = (raw.wcag || []).join(', ');
  if (raw.outcome === 'incomplete') return `The engine could not decide automatically${wcag ? ` (WCAG ${wcag})` : ''}; a person must review it.`;
  if (raw.impact === 'critical' || raw.impact === 'serious') return wcag ? `WCAG ${wcag}: the element should satisfy this requirement.` : 'The element should satisfy the rule the engine applied.';
  return wcag ? `WCAG ${wcag}: the element should satisfy this requirement.` : 'The element should satisfy the rule the engine applied.';
}

function confidenceFor(raw) {
  if (raw.outcome === 'incomplete') return 'needs-review';
  if (raw.impact === 'critical' || raw.impact === 'serious') return 'high';
  if (raw.impact === 'moderate' || raw.impact === 'minor') return 'medium';
  return 'engine-reported';
}

// Attach one observation (where and when it was seen) to a finding.
export function addObservation(finding, observation) {
  finding.observations.push({
    checkpointId: observation.checkpointId,
    side: observation.side || null,
    scenarioId: observation.scenarioId || null,
    when: observation.when,
    pagePath: observation.pagePath || null,
    outcome: observation.outcome || finding.outcome,
    evidenceRef: observation.evidenceRef || null,
    sequence: observation.sequence ?? null,
  });
  return finding;
}

// Deduplicate a list of normalised findings by fingerprint. Returns { findings, byFingerprint }.
export function dedupeFindings(findings) {
  const byFingerprint = new Map();
  for (const f of findings) {
    const seen = byFingerprint.get(f.fingerprint);
    if (!seen) { byFingerprint.set(f.fingerprint, f); continue; }
    for (const o of f.observations) addObservation(seen, o);
    if (!seen.engineSeverity && f.engineSeverity) seen.engineSeverity = f.engineSeverity;
    if (seen.reviewStatus === 'unreviewed' && f.reviewStatus === 'needs-review') seen.reviewStatus = f.reviewStatus;
  }
  return { findings: [...byFingerprint.values()], byFingerprint };
}

// Apply a set of findings (deduped) to a checkpoint's normalised finding list, merging observations rather than
// repeating the finding. Returns the checkpoint's own copy so the session can keep a running set.
export function mergeCheckpointFindings(running, checkpointFindings, { checkpointId, side, scenarioId, when, pagePath, sequence }) {
  for (const f of checkpointFindings) {
    const key = f.fingerprint;
    const existing = running.get(key);
    if (!existing) {
      const copy = { ...f, observations: [] };
      running.set(key, copy);
      addObservation(copy, { checkpointId, side, scenarioId, when, pagePath, outcome: f.outcome, sequence });
      continue;
    }
    addObservation(existing, { checkpointId, side, scenarioId, when, pagePath, outcome: f.outcome, sequence });
    if (existing.reviewStatus === 'unreviewed' && f.reviewStatus === 'needs-review') existing.reviewStatus = 'needs-review';
  }
  return running;
}

// How a finding present on both sides is classified. Never "fixed" or "new" from absence alone: an engine that did not
// run, or a state that was not reached, explains absence too.
export const CLASSIFICATIONS = [
  'new-regression', 'existing-failure', 'resolved-failure', 'changed-finding', 'state-not-reached',
  'not-applicable', 'tool-error', 'unsupported-capability', 'manual-review-required',
];

export function classifyPair({ before, after, sameState, enginesExecuted = [], enginesUnsupported = [] }) {
  const b = new Set(before.map((f) => f.fingerprint));
  const a = new Set(after.map((f) => f.fingerprint));
  const rows = [];
  for (const f of after) {
    if (!b.has(f.fingerprint)) rows.push({ change: 'new-regression', fingerprint: f.fingerprint, displayId: f.displayId, engine: f.engine.id, ruleId: f.ruleId, finding: f });
    else {
      const old = before.find((x) => x.fingerprint === f.fingerprint);
      const changed = old && (old.outcome !== f.outcome || old.impact !== f.impact || (old.element.htmlNormalised || old.element.html) !== (f.element.htmlNormalised || f.element.html));
      rows.push({ change: changed ? 'changed-finding' : 'existing-failure', fingerprint: f.fingerprint, displayId: f.displayId, engine: f.engine.id, ruleId: f.ruleId, finding: f, before: old });
    }
  }
  for (const f of before) if (!a.has(f.fingerprint)) rows.push({ change: 'resolved-failure', fingerprint: f.fingerprint, displayId: f.displayId, engine: f.engine.id, ruleId: f.ruleId, finding: f });
  for (const id of enginesUnsupported) rows.push({ change: 'unsupported-capability', engine: id, finding: null });
  for (const id of enginesExecuted) if (!rows.some((r) => r.engine === id)) rows.push({ change: 'no-change', engine: id, finding: null });
  if (!sameState) for (const r of rows) if (r.change === 'new-regression' || r.change === 'resolved-failure') r.unreliableBecause = 'the two sides did not reach equivalent states';
  return rows;
}

// The manual-review questions a checkpoint raises, from what is present rather than from a fixed list. These are for a
// person (or an agent preparing the test, never replacing the person): they are stored separately from findings.
export function manualChecks(state = {}, { findings = [], side = null } = {}) {
  const checks = [];
  const add = (id, question, procedure, why) => checks.push({ id, question, procedure, why, side, result: 'not-run', requiresPerson: true, automated: false });
  if (state.dialogs?.length) {
    add('dialog-context', 'Does the dialog give enough context when it opens (name, purpose, what happens next)?', 'Open the dialog with the keyboard; listen to the first announcement and the focus target.', 'A dialog that opens without a name or that starts focus in the wrong place is hard to use with a screen reader.');
    add('dialog-focus-return', 'After the dialog closes, does focus return to the control that opened it?', 'Open with Enter, close with Escape; observe where focus lands.', 'Losing focus on close strands keyboard users.');
  }
  if (state.details?.some((d) => d.open)) add('details-disclosure', 'Is it clear, when a details element expands, that new content appeared and what it is?', 'Toggle with Enter and listen.', 'The state change must be perceivable without sight.');
  if (state.messages?.length) add('status-understandable', 'Is the status or error message understandable on its own, without seeing where it appeared?', 'Trigger it; read/listen to the message in isolation.', 'A message that only makes sense visually is not a status message for everyone.');
  if (state.formErrors?.length) add('error-association', 'Is each validation error programmatically associated with its field, and does the summary link reach it?', 'Submit an invalid form; use the summary link; inspect the field name/description.', 'An error a screen reader does not connect to its field is not usable.');
  if (state.focusTrail?.length >= 3) add('focus-order', 'Does the focus order follow a logical sequence through this component?', 'Tab through it from the previous control to the next, noting each stop.', 'A logical order is required by WCAG 2.4.3 and cannot be scanned.');
  if (findings.some((f) => /image|img|icon|svg|graphic/i.test(`${f.ruleId} ${f.element?.html || ''}`))) add('icon-recognisable', 'Is the icon recognisable and, where it conveys meaning, is its name meaningful in this context?', 'Compare the icon with its accessible name and with what a sighted user sees.', 'Automated tools cannot judge whether a name is meaningful.');
  if (state.focused?.role === 'textbox' || state.focused?.role === 'combobox') add('task-complete-keyboard', 'Can a keyboard user complete the task this control belongs to without a pointer?', 'Complete the flow with Tab, arrows, Enter and Escape only.', 'A task that needs a pointer fails WCAG 2.1.1.');
  if (findings.some((f) => f.engine?.id === 'htmlcs' && f.outcome === 'incomplete')) add('engine-needs-review', 'Review the engine results marked as needing review; they are not passes.', 'Read the incomplete results and decide each one.', 'An incomplete engine result is a question, not a clean result.');
  add('screen-reader-repeat', 'Does a screen reader announce anything unnecessarily repetitive at this state?', 'Use a real screen reader (not a simulation) and listen.', 'Repetition and verbosity are quality barriers automated tools cannot measure.');
  return checks;
}

// Counts for a report: one entry per distinct finding, never per observation.
export function findingTotals(findings = []) {
  const byImpact = {}, byEngine = {}, byOutcome = {}, byWcag = {};
  for (const f of findings) {
    const impact = f.impact || 'unrated';
    byImpact[impact] = (byImpact[impact] || 0) + 1;
    byEngine[f.engine.id] = (byEngine[f.engine.id] || 0) + 1;
    byOutcome[f.outcome] = (byOutcome[f.outcome] || 0) + 1;
    for (const w of f.wcag || []) byWcag[w] = (byWcag[w] || 0) + 1;
  }
  return { distinct: findings.length, observations: findings.reduce((n, f) => n + (f.observations?.length || 1), 0), byImpact, byEngine, byOutcome, byWcag };
}

export { computeA11yPatternFingerprint, computeA11yOccurrenceFingerprint };
