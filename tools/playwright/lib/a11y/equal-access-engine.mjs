// IBM Equal Access (accessibility-checker, Apache-2.0) is a candidate second engine. It is NOT installed and, more
// importantly, its API (`checker.getCompliance(url)`) loads the page in its own browser engine: running it for a
// checkpoint would evaluate a freshly loaded page, not the state the agent reached. That is exactly what this feature
// must not do, so the adapter declares the limitation and the registry refuses it for checkpoints instead of pretending
// it saw the same page.
//
// It is kept as a real adapter so the capability interface is exercised by a second, differently-shaped engine: when a
// live-page entry point is available it can be wired in without changing the checkpoint pipeline.
import { createRequire } from 'node:module';

export const ENGINE = { id: 'equal-access', label: 'IBM Equal Access', license: 'Apache-2.0', packageName: 'accessibility-checker' };

let _pkg = null;
function resolvePackage() {
  if (_pkg !== null) return _pkg;
  try {
    const req = createRequire(import.meta.url);
    _pkg = req('accessibility-checker/package.json') || false;
  } catch {
    _pkg = false;
  }
  return _pkg || null;
}

export function equalAccessCapabilities() {
  const pkg = resolvePackage();
  return {
    id: ENGINE.id,
    label: ENGINE.label,
    version: pkg ? pkg.version : 'not installed',
    license: ENGINE.license,
    livePage: false,                 // getCompliance(url) renders the page itself
    requiresInjectedJavaScript: false,
    requiresNavigation: true,
    consumesDomSnapshot: false,
    iframes: true,
    shadowDom: true,
    computedStyles: true,
    preservesState: false,           // it would load a different page instance
    componentScope: false,
    resultKinds: ['violation', 'recommendation', 'potential'],
    standards: ['WCAG 2.2 A/AA', 'IBM Equal Access rulesets'],
    ruleset: 'accessibility-checker rulesets (not applicable to live checkpoints yet)',
    ...(pkg ? {} : { unavailableReason: 'accessibility-checker is not installed (optional: npm --prefix tools/playwright install accessibility-checker)' }),
    livePageVerdict: 'not suitable for dynamic checkpoints: no API to inspect an existing page object',
  };
}

export default {
  id: ENGINE.id,
  label: ENGINE.label,
  license: ENGINE.license,
  packageName: ENGINE.packageName,
  capabilities: equalAccessCapabilities,
  async available() { return !!resolvePackage(); },
  async run() {
    return {
      engine: { id: ENGINE.id, label: ENGINE.label, version: resolvePackage()?.version || 'not installed', license: ENGINE.license },
      compact: null,
      full: null,
      findings: [],
      execution: { engine: ENGINE.id, status: 'unsupported', error: 'needs its own page navigation; cannot inspect the page Playwright MCP has open', executedRuns: 0, failedRuns: 0, skipped: [] },
      timings: { ms: 0 },
    };
  },
};
