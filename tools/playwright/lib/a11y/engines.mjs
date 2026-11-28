// The optional scanner-engine interface, and the profiles an agent picks from.
//
// An adapter declares what it can and cannot inspect before it is allowed to run on a live page. The declaration is
// the contract: an engine that needs to navigate, or that cannot read the page Playwright MCP has open, is refused for
// a checkpoint instead of being run against a different page and reported as if it had seen the same state.
//
// Every declaration is data (capabilities()) so the report can print it, and the report prints it even when the engine
// did not run. "Not run" is never a pass.
//
// Engines considered and why they are not adapters yet (2026-11-27):
//   IBM Equal Access accessibility-checker (Apache-2.0): its API fetches a URL and renders it itself, so it cannot
//     inspect the exact state an agent reached. Kept as an adapter that declares that limitation and refuses.
//   Siteimprove Alfa (MIT): same URL-based model (alfa-cli audit <url>); no live-page API.
//   QualWeb (@qualweb/act-rules, ISC): evaluate({url}); needs its own navigation.
//   AccessLint (MIT): injects a browser bundle but its wrappers re-load the page; no live-page entry point.
//   Lighthouse (Apache-2.0): page-load audit in its own Chrome; cannot see states reached by clicking (already said
//     in docs/TESTING-TOOLS.md).
//   HTML_CodeSniffer (BSD-3-Clause): integrated here as `htmlcs`, because it injects into the live page.
// Open Scans (AGPL-3.0) was reviewed for reusable adapters: it has none for live pages (every engine is URL-based) and
// its code is not GPL-compatible, so only its vocabulary (observation vs disposition, "a silent engine is not a pass")
// is borrowed, with attribution in docs/DYNAMIC-A11Y-CHECKPOINTS.md.
import axe from './axe-engine.mjs';
import htmlcs from './htmlcs-engine.mjs';
import equalAccess from './equal-access-engine.mjs';
import fixture from './fixture-engine.mjs';

// The fields every adapter must declare. validateAdapter() names the missing one.
export const REQUIRED_CAPABILITIES = [
  'id', 'label', 'version', 'license', 'livePage', 'requiresInjectedJavaScript', 'requiresNavigation',
  'consumesDomSnapshot', 'iframes', 'shadowDom', 'computedStyles', 'preservesState', 'componentScope',
  'resultKinds', 'standards', 'ruleset',
];

export const PRODUCTION_ENGINES = [axe, htmlcs, equalAccess];

// Test-only engine; selectable only when the caller explicitly allows fixtures (the unit tests do, an agent cannot).
export const FIXTURE_ENGINE = fixture;

// Profiles: cheap checks first, and never every engine by default.
export const PROFILES = {
  quick: {
    label: 'Quick',
    what: 'axe-core plus focus and the focused element.',
    engines: ['axe-core'],
    collectors: ['focus'],
  },
  semantic: {
    label: 'Semantic',
    what: 'Accessibility tree, ARIA after JavaScript, unresolved ID references, landmarks, focus.',
    engines: [],
    collectors: ['tree', 'focus'],
  },
  visual: {
    label: 'Visual',
    what: 'Computed styles, colours and contrast where measurable, geometry, clipping, occlusion, screenshots.',
    engines: [],
    collectors: ['visual', 'screenshots', 'focus'],
  },
  dynamic: {
    label: 'Dynamic',
    what: 'Announcements, live regions, AJAX commands, focus transitions, silent changes, console errors.',
    engines: [],
    collectors: ['speech', 'ajax', 'focus', 'console'],
  },
  'multi-engine': {
    label: 'Multi-engine',
    what: 'Independent accessibility engines on the same live page (axe-core and HTML_CodeSniffer).',
    engines: ['axe-core', 'htmlcs'],
    collectors: ['focus'],
  },
  full: {
    label: 'Full',
    what: 'Every available independent engine plus every collector; the most expensive profile.',
    engines: ['axe-core', 'htmlcs'],
    collectors: ['tree', 'focus', 'visual', 'screenshots', 'speech', 'ajax', 'console'],
  },
};

export const ALL_COLLECTORS = ['tree', 'focus', 'visual', 'screenshots', 'speech', 'ajax', 'console'];

export class EngineError extends Error {
  constructor(problems) {
    super(`scanner adapter does not honour the interface: ${problems.join('; ')}`);
    this.name = 'EngineError';
    this.problems = problems;
  }
}

// Static checks on an adapter module. Returns [] when it honours the interface.
export function validateAdapter(adapter) {
  const problems = [];
  if (!adapter || typeof adapter !== 'object') return ['not an object'];
  for (const k of ['id', 'label']) if (typeof adapter[k] !== 'string' || !adapter[k]) problems.push(`${k} missing`);
  if (typeof adapter.capabilities !== 'function') problems.push('capabilities() missing');
  if (typeof adapter.available !== 'function') problems.push('available() missing');
  if (typeof adapter.run !== 'function') problems.push('run() missing');
  if (problems.length) return problems;
  const caps = adapter.capabilities();
  if (caps && typeof caps.then === 'function') problems.push('capabilities() must be synchronous; call run() for the version');
  else for (const k of REQUIRED_CAPABILITIES) if (!(k in (caps || {}))) problems.push(`capabilities() is missing ${k}`);
  return problems;
}

export function engineList({ allowFixtures = false } = {}) {
  return allowFixtures ? [...PRODUCTION_ENGINES, FIXTURE_ENGINE] : PRODUCTION_ENGINES;
}

export async function describeEngines({ allowFixtures = false } = {}) {
  const out = [];
  for (const adapter of engineList({ allowFixtures })) {
    const caps = await adapter.capabilities();
    out.push({ ...caps, available: await adapter.available() });
  }
  return out;
}

// Resolve a profile name and per-checkpoint overrides into the engines and collectors to run.
// Unknown names are an error the agent sees, not a silent fallback: a typo must not turn into a smaller scan.
export function resolveProfile(name = 'quick', overrides = {}, { allowFixtures = false, availableEngines = null } = {}) {
  const profile = PROFILES[name];
  if (!profile) throw new Error(`unknown profile "${name}"; use one of ${Object.keys(PROFILES).join(', ')}`);
  const engines = overrides.engines ? [...overrides.engines] : [...profile.engines];
  const collectors = overrides.collectors ? [...overrides.collectors] : [...profile.collectors];
  const known = new Set([...engineList({ allowFixtures }).map((e) => e.id)]);
  for (const e of engines) if (!known.has(e)) throw new Error(`unknown engine "${e}"; use one of ${[...known].join(', ')}`);
  for (const c of collectors) if (!ALL_COLLECTORS.includes(c)) throw new Error(`unknown collector "${c}"; use one of ${ALL_COLLECTORS.join(', ')}`);
  const warnings = [];
  if (availableEngines) for (const e of engines) if (!availableEngines.includes(e)) warnings.push(`${e} is not installed and will be reported as not run`);
  return { name, label: profile.label, engines, collectors, warnings };
}

// A checkpoint runs the selected engines in order, cheapest first, on the same page. No browser is launched here:
// `page` is the page Playwright MCP or the scenario runner already has open.
export async function runEngines(page, { engines = [], options = {}, allowFixtures = false } = {}) {
  const modules = new Map(engineList({ allowFixtures }).map((m) => [m.id, m]));
  const results = [];
  for (const id of engines) {
    const adapter = modules.get(id);
    if (!adapter) { results.push({ engine: { id }, execution: { engine: id, status: 'not-run', error: 'unknown engine', executedRuns: 0, failedRuns: 0, skipped: [] }, findings: [], compact: null, timings: { ms: 0 } }); continue; }
    const caps = await adapter.capabilities();
    if (!(await adapter.available())) {
      results.push({ engine: { id, label: caps.label, version: caps.version }, execution: { engine: id, version: caps.version, status: 'not-run', error: caps.unavailableReason || `${caps.label} is not installed`, executedRuns: 0, failedRuns: 0, skipped: [] }, findings: [], compact: null, timings: { ms: 0 } });
      continue;
    }
    if (!caps.livePage || caps.requiresNavigation) {
      // The engine cannot inspect the page the agent reached without loading it again. That is reported, never faked.
      results.push({ engine: { id, label: caps.label, version: caps.version }, execution: { engine: id, version: caps.version, status: 'unsupported', error: `${caps.label} needs its own navigation and cannot inspect the live page state`, executedRuns: 0, failedRuns: 0, skipped: [] }, findings: [], compact: null, timings: { ms: 0 } });
      continue;
    }
    const engineOptions = (options.engines && options.engines[id]) || options;
    results.push(await adapter.run(page, engineOptions, options.context || {}));
  }
  return results;
}

// One sentence per engine for the checkpoint summary and the report.
export function executionLine(r) {
  const s = r.execution?.status || 'not-run';
  const label = r.engine?.label || r.execution?.engine || 'engine';
  const version = r.engine?.version || r.execution?.version || '';
  if (s === 'executed') return `${label} ${version}: executed${r.findings?.length ? `, ${r.findings.length} finding(s)` : ', no findings'}`;
  if (s === 'partial') return `${label} ${version}: partially executed (${(r.execution.skipped || []).length} frame(s) skipped)`;
  if (s === 'failed') return `${label} ${version}: FAILED (${r.execution.error})`;
  if (s === 'unsupported') return `${label} ${version}: unsupported for live checkpoints (${r.execution.error})`;
  return `${label} ${version}: not run (${r.execution?.error || 'unavailable'})`;
}
