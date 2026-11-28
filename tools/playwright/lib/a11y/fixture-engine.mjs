// A deterministic second engine for the lab's own tests. It exists to prove that adding an engine is a module plus a
// declaration, not a change to the checkpoint pipeline, without installing another real scanner.
//
// It is NOT available to an agent: engines.mjs adds it only when the caller passes allowFixtures, which only the test
// harness does. It reads attributes a fixture page sets on purpose:
//   data-fixture-finding="rule-id"     a violation
//   data-fixture-review="rule-id"      an incomplete / needs-review result
//   data-fixture-wcag="1.4.3"          comma-separated WCAG success criteria
//   data-fixture-act="abc12"           comma-separated ACT rule ids
//   data-fixture-impact="serious"      axe-like impact label (fixture only)
export const ENGINE = { id: 'fixture-engine', label: 'Fixture engine (tests only)', license: 'GPL-2.0-or-later', packageName: null };

export function fixtureCapabilities() {
  return {
    id: ENGINE.id,
    label: ENGINE.label,
    version: '1.0.0',
    license: ENGINE.license,
    livePage: true,
    requiresInjectedJavaScript: false,
    requiresNavigation: false,
    consumesDomSnapshot: false,
    iframes: false,
    shadowDom: false,
    computedStyles: false,
    preservesState: true,
    componentScope: true,
    resultKinds: ['violation', 'incomplete'],
    standards: ['fixture'],
    ruleset: 'attributes set by a fixture page; test harness only',
  };
}

const IN_PAGE = (options) => {
  const include = (options.include || []).map((s) => { try { return document.querySelector(s); } catch { return null; } }).filter(Boolean);
  const inScope = (el) => !include.length || include.some((root) => root === el || root.contains(el));
  const selectorFor = (el) => {
    if (el.id) return '#' + CSS.escape(el.id);
    const path = [];
    for (let n = el; n && n.nodeType === 1 && n !== document.documentElement; n = n.parentElement) {
      let part = n.localName;
      const p = n.parentElement;
      if (p) { const same = [...p.children].filter((c) => c.localName === n.localName); if (same.length > 1) part += `:nth-of-type(${same.indexOf(n) + 1})`; }
      path.unshift(part);
    }
    return path.join(' > ');
  };
  const out = [];
  for (const el of document.querySelectorAll('[data-fixture-finding],[data-fixture-review]')) {
    if (!inScope(el)) continue;
    const violation = el.hasAttribute('data-fixture-finding');
    const ruleId = el.getAttribute(violation ? 'data-fixture-finding' : 'data-fixture-review');
    const split = (v) => String(v || '').split(',').map((s) => s.trim()).filter(Boolean);
    out.push({
      outcome: violation ? 'violation' : 'incomplete',
      ruleId,
      impact: el.getAttribute('data-fixture-impact') || null,
      wcag: split(el.getAttribute('data-fixture-wcag')),
      actRuleIds: split(el.getAttribute('data-fixture-act')),
      target: selectorFor(el),
      html: String(el.outerHTML).slice(0, 400),
      message: el.getAttribute('data-fixture-message') || `fixture finding ${ruleId}`,
    });
  }
  return out;
};

export default {
  id: ENGINE.id,
  label: ENGINE.label,
  license: ENGINE.license,
  packageName: ENGINE.packageName,
  capabilities: fixtureCapabilities,
  async available() { return true; },
  async run(page, options = {}) {
    const started = Date.now();
    const raw = await page.evaluate(IN_PAGE, { include: options.include || [], exclude: options.exclude || [] });
    const findings = raw.map((r) => ({
      engine: { id: ENGINE.id, version: '1.0.0' },
      outcome: r.outcome,
      ruleId: r.ruleId,
      ruleLabel: r.message,
      impact: r.impact,
      wcag: r.wcag,
      actRuleIds: r.actRuleIds,
      helpUrl: null,
      target: { target: r.target, targetTree: [r.target], framePath: [], html: r.html, failureSummary: null },
      html: r.html,
      message: r.message,
    }));
    return {
      engine: { id: ENGINE.id, label: ENGINE.label, version: '1.0.0', license: ENGINE.license },
      compact: { total: findings.filter((f) => f.outcome === 'violation').length, rules: Object.fromEntries(findings.map((f) => [f.ruleId, 1])), violations: [], incomplete: [], incompleteTotal: findings.filter((f) => f.outcome === 'incomplete').length, url: page.url() },
      full: options.raw === false ? null : { raw },
      findings,
      execution: { engine: ENGINE.id, version: '1.0.0', status: 'executed', error: null, executedRuns: 1, failedRuns: 0, skipped: [] },
      options: { include: options.include || [], exclude: options.exclude || [] },
      timings: { ms: Date.now() - started },
    };
  },
};
