// HTML_CodeSniffer (Squiz) as the lab's second accessibility engine. It runs entirely in the page the agent already
// has open: the bundle is injected for the duration of the run, the standard is evaluated against the live DOM, and
// nothing is clicked, focused or navigated. It never launches a browser of its own.
//
// Deliberately NOT treated as axe: different failure conditions, different rule identifiers, no axe impact levels and
// no ACT identifiers. A finding keeps `engine.id` and the engine's own `code`, so agreement between engines is
// visible but never mistaken for proof.
//
// Licence: BSD-3-Clause (GPL-compatible), installed from npm, not vendored.
import { createRequire } from 'node:module';

export const ENGINE = { id: 'htmlcs', label: 'HTML_CodeSniffer', license: 'BSD-3-Clause', packageName: 'html_codesniffer' };
export const DEFAULT_STANDARD = 'WCAG2AA';
const STANDARDS = ['WCAG2A', 'WCAG2AA', 'WCAG2AAA'];

let _resolved = null;
function resolvePackage() {
  if (_resolved) return _resolved;
  try {
    const req = createRequire(import.meta.url);
    const main = req.resolve('html_codesniffer/build/HTMLCS.js');
    const pkg = req('html_codesniffer/package.json');
    _resolved = { main, version: pkg.version };
  } catch {
    _resolved = { main: null, version: null };
  }
  return _resolved;
}

export function htmlcsPath() { return resolvePackage().main; }
export function htmlcsVersion() { return resolvePackage().version || 'not installed'; }

export function htmlcsCapabilities() {
  const { version, main } = resolvePackage();
  return {
    id: ENGINE.id,
    label: ENGINE.label,
    version: version || 'not installed',
    license: ENGINE.license,
    livePage: true,
    requiresInjectedJavaScript: true,
    requiresNavigation: false,
    consumesDomSnapshot: false,
    iframes: true,                 // evaluated frame by frame; frames the page does not allow are reported, not guessed
    shadowDom: false,              // HTML_CodeSniffer walks light DOM only
    computedStyles: true,          // its contrast checks read computed colours and layout
    preservesState: true,
    componentScope: 'filter',      // runs on the document, then keeps messages inside the requested scope
    resultKinds: ['error', 'warning', 'notice'],
    standards: ['WCAG 2.0 A/AA/AAA (HTML_CodeSniffer standards)'],
    ruleset: `HTML_CodeSniffer ${version || '(not installed)'} standard ${DEFAULT_STANDARD}; error = violation, warning = needs review, notice = manual review only`,
    ...(main ? {} : { unavailableReason: 'html_codesniffer is not installed: npm --prefix tools/playwright install html_codesniffer' }),
  };
}

// Runs in the page of one frame. Returns messages with a CSS selector and an XPath, so a finding can be reproduced
// without the MCP element reference (those are session-scoped and never regression locators).
const IN_PAGE_RUN = async ({ standard, scope }) => {
  if (!window.HTMLCS) throw new Error('HTML_CodeSniffer was not injected into this frame');
  const root = scope ? document.querySelector(scope) : document;
  if (scope && !root) return { error: `scope not found: ${scope}`, messages: [] };
  const messages = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('HTML_CodeSniffer timed out after 60s')), 60000);
    try {
      window.HTMLCS.process(standard, document, () => { clearTimeout(timer); resolve(window.HTMLCS.getMessages()); });
    } catch (e) { clearTimeout(timer); reject(e); }
  });
  const unique = (sel) => { try { return document.querySelectorAll(sel).length === 1; } catch { return false; } };
  const cssPath = (el) => {
    if (!el || el.nodeType !== 1) return null;
    if (el.id && unique('#' + CSS.escape(el.id))) return '#' + CSS.escape(el.id);
    const parts = [];
    let node = el;
    while (node && node.nodeType === 1 && node !== document.documentElement && parts.length < 8) {
      let part = node.localName;
      if (node.id && unique('#' + CSS.escape(node.id))) { parts.unshift('#' + CSS.escape(node.id)); break; }
      const parent = node.parentElement;
      if (parent) {
        const same = [...parent.children].filter((c) => c.localName === node.localName);
        if (same.length > 1) part += `:nth-of-type(${same.indexOf(node) + 1})`;
      }
      parts.unshift(part);
      node = parent;
    }
    return parts.length ? parts.join(' > ') : null;
  };
  const xpath = (el) => {
    if (!el || el.nodeType !== 1) return null;
    const bits = [];
    for (let node = el; node && node.nodeType === 1; node = node.parentElement) {
      const i = node.parentElement ? [...node.parentElement.children].filter((c) => c.localName === node.localName).indexOf(node) + 1 : 1;
      bits.unshift(`${node.localName}[${i}]`);
      if (node === document.documentElement) break;
    }
    return '/' + bits.join('/');
  };
  const scopeOk = (el) => !root || root === document || root === el || (el && root.contains && root.contains(el));
  return {
    messages: messages.filter((m) => m.element !== document && m.element !== document.documentElement ? scopeOk(m.element) : !scope).map((m) => ({
      type: m.type,
      code: m.code,
      msg: m.msg,
      selector: cssPath(m.element),
      xpath: xpath(m.element),
      tag: m.element && m.element.localName ? m.element.localName : null,
      html: m.element && m.element.outerHTML ? String(m.element.outerHTML).slice(0, 500) : null,
      values: m.data && typeof m.data === 'object' ? Object.fromEntries(Object.entries(m.data).slice(0, 8).map(([k, v]) => [k, String(v).slice(0, 200)])) : null,
    })),
    total: messages.length,
  };
};

// Which frame holds the element a message points at is part of the location: [frameUrl, selector]. The main frame is
// just [selector]. A finding inside a same-origin frame is therefore reproducible, not flattened onto the top document.
const frameLabel = (frame, page) => (frame === page.mainFrame() ? '' : frame.url() || 'about:blank');

export function findingsFromHtmlcs(messages, page, version) {
  const out = [];
  for (const m of messages || []) {
    if (![1, 2].includes(m.type)) continue;   // type 1 error, type 2 warning; type 3 is a manual-review prompt
    const frame = m.frame;
    const wcag = (() => {
      const hit = /Guideline(\d+)_(\d+)\.(\d+)_(\d+)_(\d+)/.exec(m.code || '');
      return hit ? [`${hit[3]}.${hit[4]}.${hit[5]}`] : [];
    })();
    out.push({
      engine: { id: ENGINE.id, version },
      outcome: m.type === 1 ? 'violation' : 'incomplete',
      ruleId: m.code,
      ruleLabel: m.msg,
      impact: null,                       // HTML_CodeSniffer has no axe impact level; do not invent one
      engineSeverity: m.type === 1 ? 'error' : 'warning',
      wcag,
      actRuleIds: [],
      helpUrl: 'https://squizlabs.github.io/HTML_CodeSniffer/',
      target: {
        target: [frame ? frameLabel(frame, page) : '', m.selector].filter(Boolean).join(' >>> ') || (m.tag || 'document'),
        targetTree: [frame ? frameLabel(frame, page) : '', m.selector].filter(Boolean),
        framePath: frame && frame !== page.mainFrame() ? [frame.url()] : [],
        html: m.html || '',
        failureSummary: null,
      },
      html: m.html || '',
      message: m.msg,
      ...(m.values ? { data: m.values } : {}),
    });
  }
  return out;
}

export async function runHtmlcs(page, options = {}, context = {}) {
  const opts = options || {};
  const standard = STANDARDS.includes(opts.standard) ? opts.standard : DEFAULT_STANDARD;
  const types = Array.isArray(opts.types) && opts.types.length ? opts.types.map(Number).filter((n) => [1, 2, 3].includes(n)) : [1, 2];
  const scope = (Array.isArray(opts.include) ? opts.include : opts.include ? [opts.include] : [])[0] || null;
  const exclude = (Array.isArray(opts.exclude) ? opts.exclude : opts.exclude ? [opts.exclude] : []);
  const started = Date.now();
  const { main, version } = resolvePackage();
  const engine = { id: ENGINE.id, label: ENGINE.label, version: version || 'not installed', license: ENGINE.license };
  if (!main) {
    return {
      engine,
      compact: { total: 0, rules: {}, violations: [], incomplete: [], error: 'html_codesniffer is not installed' },
      full: null,
      findings: [],
      execution: { engine: ENGINE.id, version, status: 'not-run', error: 'html_codesniffer is not installed', executedRuns: 0, failedRuns: 0, skipped: [] },
      options: { standard, types, include: scope ? [scope] : [], exclude },
      timings: { ms: Date.now() - started },
    };
  }
  const perFrame = [];
  const skipped = [];
  let injected = false;
  for (const frame of page.frames()) {
    const label = frameLabel(frame, page);
    if (frame.isDetached()) { skipped.push({ frame: label, reason: 'detached' }); continue; }
    try {
      await frame.addScriptTag({ path: main });
      injected = true;
    } catch (error) {
      skipped.push({ frame: label, reason: `cannot inject: ${String(error.message).split('\n')[0].slice(0, 160)}` });
      continue;
    }
    try {
      const run = await frame.evaluate(IN_PAGE_RUN, { standard, scope });
      if (run.error) { skipped.push({ frame: label, reason: run.error }); continue; }
      perFrame.push({ frame, page, ...run });
    } catch (error) {
      skipped.push({ frame: label, reason: `evaluation failed: ${String(error.message).split('\n')[0].slice(0, 160)}` });
    }
  }
  const messages = perFrame.flatMap((r) => (r.messages || []).map((m) => ({ ...m, frame: r.frame })));
  const kept = messages.filter((m) => types.includes(m.type) && !exclude.some((sel) => m.selector && m.selector.includes(sel)));
  const findings = findingsFromHtmlcs(kept, page, version);
  const byRule = {};
  for (const f of findings) byRule[f.ruleId] = (byRule[f.ruleId] || 0) + 1;
  const compact = {
    total: findings.filter((f) => f.outcome === 'violation').length,
    rules: byRule,
    violations: findingsByRule(findings, 'violation'),
    incomplete: findingsByRule(findings, 'incomplete'),
    incompleteTotal: findings.filter((f) => f.outcome === 'incomplete').length,
    notices: messages.filter((m) => m.type === 3).length,
    framesScanned: perFrame.length,
    framesSkipped: skipped.length,
    url: page.url().replace(/^https?:\/\/[^/]+/, ''),
  };
  const execution = {
    engine: ENGINE.id,
    version,
    status: skipped.length ? 'partial' : 'executed',
    error: null,
    executedRuns: perFrame.length,
    failedRuns: 0,
    skipped,
  };
  return {
    engine,
    compact,
    full: opts.raw === false ? null : { standard, perFrame: perFrame.map((r) => ({ frame: frameLabel(r.frame, page), total: r.total, messages: r.messages })), skipped },
    findings,
    execution,
    options: { standard, types, include: scope ? [scope] : [], exclude },
    timings: { ms: Date.now() - started },
  };
}

function findingsByRule(findings, outcome) {
  const groups = new Map();
  for (const f of findings.filter((x) => x.outcome === outcome)) {
    const g = groups.get(f.ruleId) || { id: f.ruleId, help: f.message, impact: null, nodes: [] };
    if (outcome === 'violation') g.nodes.push({ target: f.target.target, targetTree: f.target.targetTree, framePath: f.target.framePath, html: f.target.html });
    groups.set(f.ruleId, g);
  }
  return outcome === 'violation' ? [...groups.values()] : [...groups.values()].map((g) => ({ ...g, nodes: [] }));
}

export default {
  id: ENGINE.id,
  label: ENGINE.label,
  license: ENGINE.license,
  packageName: ENGINE.packageName,
  capabilities: htmlcsCapabilities,
  async available() { return !!resolvePackage().main; },
  async run(page, options, context) { return runHtmlcs(page, options, context); },
};
