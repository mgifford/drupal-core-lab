// One axe-core run against a page that is already open in Playwright: the shared implementation behind
// lib/lab-run.mjs axeScan() (scripted evaluators), the Playwright MCP checkpoint bridge and the scenario runner.
//
// Why a module of its own: the lab's compact axeScan report (10 nodes a rule, 300 characters of HTML) is right for a
// results.json an agent reads, and wrong for evidence. A checkpoint keeps the complete raw engine output next to the
// compact summary, and both come from the same run so they cannot disagree. Nothing here launches a browser, navigates
// or touches page state: it runs axe on the document as it is now.
//
// Options (all optional; the defaults are exactly what lab-run.mjs used before checkpoints existed):
//   tags          WCAG tags, default WCAG_TAGS
//   rules         rule ids to run INSTEAD of tags (axe's runOnly type 'rule')
//   include       selector(s) scoping the scan to matching elements and their subtrees
//   exclude       selector(s) removed from the scan
//   bestPractice  add axe's best-practice rules (tag best-practice)
//   resultTypes   axe resultTypes, default violations + incomplete (needs review)
//   nodes         how many nodes per rule the compact report keeps, default 10
//   raw           return the complete engine output (default true here; axeScan() passes false)
//   iframes       allow axe to inject into same-origin frames Playwright can reach (default true)
import AxeBuilder from '@axe-core/playwright';

export const ENGINE = { id: 'axe-core', label: 'axe-core', license: 'MPL-2.0', packageName: 'axe-core' };
export const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
export const DEFAULT_RESULT_TYPES = ['violations', 'incomplete'];

const asList = (x) => (x == null ? [] : Array.isArray(x) ? x : [x]).filter((s) => typeof s === 'string' && s.length);

// The axe-core version actually loaded, read from the package the engine runs, not from package.json of this repo.
// Synchronous: a capability declaration is data, and validateAdapter() checks it without awaiting.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let _version = null;
export function axeVersionSync() {
  if (_version) return _version;
  try { _version = require('axe-core/package.json').version; } catch { _version = 'unknown'; }
  return _version;
}
export async function axeVersion() { return axeVersionSync(); }

// What a checkpoint records about the engine, independently of what it found.
export function axeCapabilities() {
  return {
    id: ENGINE.id,
    label: ENGINE.label,
    version: axeVersionSync(),
    license: ENGINE.license,
    livePage: true,                 // runs on the page already open in Playwright
    requiresInjectedJavaScript: true, // @axe-core/playwright injects axe-core into the page for the duration of the run
    requiresNavigation: false,      // never navigates
    consumesDomSnapshot: false,     // reads the live DOM
    iframes: true,                  // same-origin frames Playwright can evaluate; cross-origin frames are skipped
    shadowDom: true,                // axe walks open shadow roots; closed roots are not reachable
    computedStyles: true,           // colour-contrast, target-size and similar rules need layout
    preservesState: true,           // read-only: no clicks, no focus moves, no navigation
    componentScope: true,           // include/exclude selectors
    resultKinds: ['violations', 'incomplete', 'passes', 'inapplicable'],
    standards: ['WCAG 2.0 A/AA', 'WCAG 2.1 A/AA', 'WCAG 2.2 A/AA', 'axe best-practice'],
    ruleset: 'axe-core default ruleset; best-practice rules only when requested',
  };
}

// Selectors from an agent or a scenario file: plain strings, a bounded count and length, no control characters.
// A selector is not a security boundary (it only reaches the page's DOM) but it becomes evidence, so it is bounded.
export function normaliseSelectors(value, name) {
  const list = asList(value);
  if (list.length > 50) throw new Error(`${name}: at most 50 selectors, got ${list.length}`);
  return list.map((s) => {
    if (s.length > 300) throw new Error(`${name}: a selector is longer than 300 characters`);
    if (/[\u0000-\u001f]/.test(s)) throw new Error(`${name}: a selector contains control characters`);
    return s;
  });
}

export function buildOptions(options = {}) {
  const o = options || {};
  const tags = asList(o.tags), rules = asList(o.rules);
  if (tags.length && rules.length) throw new Error('axe: pass tags or rules, not both (axe\'s runOnly takes one type)');
  const bestPractice = o.bestPractice === true;
  return {
    runOnly: rules.length ? { type: 'rule', values: rules } : { type: 'tag', values: tags.length ? (bestPractice ? [...tags, 'best-practice'] : tags) : [...WCAG_TAGS, ...(bestPractice ? ['best-practice'] : [])] },
    include: normaliseSelectors(o.include, 'include'),
    exclude: normaliseSelectors(o.exclude, 'exclude'),
    resultTypes: asList(o.resultTypes).length ? asList(o.resultTypes) : DEFAULT_RESULT_TYPES,
    nodes: Number.isInteger(o.nodes) && o.nodes > 0 ? Math.min(o.nodes, 1000) : 10,
    raw: o.raw !== false,
    iframes: o.iframes !== false,
    standardTags: tags.length ? tags : WCAG_TAGS,
  };
}

// axe's tags carry both conformance levels (wcag2a, wcag22aa) and success criteria (wcag111, wcag1410, wcag258).
// Only the criterion tags name a WCAG SC; the level tags are kept out of the mapping so "2a" never appears as a criterion.
const wcagTags = (tags) => (tags || []).filter((t) => /^wcag\d+$/.test(t));
const wcagSC = (tags) => wcagTags(tags).map((t) => { const d = t.replace(/^wcag/, ''); return `${d[0]}.${d[1]}.${d.slice(2)}`; });
const actTags = (tags) => (tags || []).filter((t) => /^act/.test(t));

// Target selectors are trees (arrays of strings) when a node is inside a frame or a shadow root. Flattening them
// loses which level belongs to which frame, so both forms are kept: `target` for reading, `targetTree` for reuse.
const targetOf = (n) => ({
  // `target` keeps the lab's historical flattened string (space-joined) so existing results.json readers are unchanged;
  // `targetTree` is the structured location a frame or shadow boundary must not lose.
  target: Array.isArray(n.target) ? n.target.join(' ') : String(n.target || ''),
  targetTree: Array.isArray(n.target) ? n.target.map(String) : [String(n.target || '')],
  framePath: (n.target || []).length > 1 ? (n.target || []).slice(0, -1) : [],
  html: String(n.html || '').slice(0, 500),
  impact: n.impact || null,
  failureSummary: String(n.failureSummary || '').slice(0, 1200),
  ...(n.xpath ? { xpath: n.xpath } : {}),
  ...(n.ancestry ? { ancestry: n.ancestry } : {}),
});

// Engine-neutral raw findings: one per failing/incomplete node. findings.mjs fingerprints, dedupes and classifies
// these; nothing here invents a WCAG mapping (axe's own wcag* tags are kept as they are).
export function findingsFromAxe(results, version = 'unknown') {
  const out = [];
  const add = (list, outcome) => {
    for (const rule of list || []) {
      for (const node of rule.nodes || []) {
        out.push({
          engine: { id: ENGINE.id, version },
          outcome,
          ruleId: rule.id,
          ruleLabel: rule.help || rule.id,
          impact: rule.impact || null,
          wcag: wcagSC(rule.tags),
          actRuleIds: actTags(rule.tags).map((t) => t.replace(/^act/, '')),
          helpUrl: rule.helpUrl || null,
          target: targetOf(node),
          html: String(node.html || '').slice(0, 500),
          message: String(node.failureSummary || rule.help || '').slice(0, 1200),
          ...(node.any?.length ? { checksRun: node.any.map((c) => c.id).filter(Boolean) } : {}),
        });
      }
    }
  };
  add(results.violations, 'violation');
  add(results.incomplete, 'incomplete');
  return out;
}

// The compact report an agent reads. Same shape axeScan() has always returned, plus the fields a checkpoint adds.
export function compactResult(results, { url = '', nodes = 10 } = {}) {
  const byRule = (list) => Object.fromEntries((list || []).map((x) => [x.id, x.nodes.length]));
  const keep = (list) => (list || []).map((x) => ({
    id: x.id,
    impact: x.impact || null,
    help: x.help,
    helpUrl: x.helpUrl,
    tags: wcagTags(x.tags),
    ...(actTags(x.tags).length ? { actTags: actTags(x.tags) } : {}),
    nodes: (x.nodes || []).slice(0, nodes).map(targetOf),
    nodeCount: (x.nodes || []).length,
  }));
  return {
    total: (results.violations || []).reduce((n, x) => n + x.nodes.length, 0),
    rules: byRule(results.violations),
    violations: keep(results.violations),
    incomplete: keep(results.incomplete),
    incompleteTotal: (results.incomplete || []).reduce((n, x) => n + x.nodes.length, 0),
    passes: Object.keys(byRule(results.passes)).length,
    inapplicable: Object.keys(byRule(results.inapplicable)).length,
    url,
    testedAt: results.timestamp || null,
    engineVersion: results.testEngine?.version || null,
  };
}

// Run axe on the live page. Returns { compact, full, execution, timings }.
// execution.status is one of executed | partial | failed | not-run, so a crashed or skipped run is never read as "clean".
export async function runAxe(page, options = {}, { nodes, url } = {}) {
  const opts = buildOptions(options);
  const started = Date.now();
  const build = (legacy) => {
    let builder = new AxeBuilder({ page }).options({ resultTypes: opts.resultTypes, runOnly: opts.runOnly });
    for (const s of opts.include) builder = builder.include(s);
    for (const s of opts.exclude) builder = builder.exclude(s);
    if (legacy) builder = builder.setLegacyMode(true);
    return builder;
  };
  const version = axeVersionSync();
  try {
    let results;
    try {
      results = await build(false).analyze();
    } catch (error) {
      // axe-core's default runner needs a second page in the same context to finish a run (axe.finishRun). A page in a
      // single-page context cannot provide one; its legacy runner evaluates every same-origin frame without it. The
      // difference is recorded: cross-origin frames are not tested in legacy mode.
      if (!/browser\.newContext|popup blockers/i.test(String(error.message))) throw error;
      opts.legacyMode = true;
      results = await build(true).analyze();
    }
    const compact = compactResult(results, { url: url || page.url(), nodes: nodes ?? opts.nodes });
    return {
      engine: { id: ENGINE.id, label: ENGINE.label, version, license: ENGINE.license },
      compact,
      full: opts.raw ? results : null,
      findings: findingsFromAxe(results, version),
      execution: { engine: ENGINE.id, version, status: 'executed', error: null, executedRuns: 1, failedRuns: 0, skipped: [] },
      options: { ...opts, raw: opts.raw },
      timings: { ms: Date.now() - started },
    };
  } catch (error) {
    // A scan that threw proves nothing. It is recorded as failed, never as a clean result.
    return {
      engine: { id: ENGINE.id, label: ENGINE.label, version, license: ENGINE.license },
      compact: { total: 0, rules: {}, violations: [], incomplete: [], incompleteTotal: 0, passes: 0, inapplicable: 0, url: url || page.url(), error: String(error.message).slice(0, 500) },
      full: null,
      findings: [],
      execution: { engine: ENGINE.id, version, status: 'failed', error: String(error.message).slice(0, 500), executedRuns: 0, failedRuns: 1, skipped: [] },
      options: { ...opts, raw: opts.raw },
      timings: { ms: Date.now() - started },
    };
  }
}

// The engine adapter the checkpoint registry loads (see engines.mjs for the interface).
export default {
  id: ENGINE.id,
  label: ENGINE.label,
  license: ENGINE.license,
  packageName: ENGINE.packageName,
  capabilities: axeCapabilities,
  async available() { return true; },
  async run(page, options, context) { return runAxe(page, options, context); },
};
