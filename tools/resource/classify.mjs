// Deterministic activity classification. It uses tool labels, script names and workflow names, never message text.
// A session can mix activities; `allocateActivity` creates an explicit, derived token split and labels the method.
const MAP = [
  [/^Read$|^Grep$|^Glob$|^NotebookRead$/, 'code-exploration'],
  [/^Edit$|^Write$|^NotebookEdit$|^MultiEdit$/, 'patch-development'],
  [/^Bash\/lab:measure-resources/, 'resource-measurement'],
  [/^Bash\/lab:(evaluate|walkthrough|tree-diff|screenreader|viewer-|mirror|frameload|flow)/, 'playwright-testing'],
  [/^Bash\/lab:(axe|forced-window|a11y|label-)/, 'accessibility-scanning'],
  [/^Bash\/lab:lighthouse/, 'lighthouse-testing'],
  [/^Bash\/lab:(lint|try-tests|css-build|selftest|doctor|coverage|check-|ready-to-push)/, 'validation'],
  [/^Bash\/lab:(issue-intake|issue-status|issue-pack|new-issue|issue-from-url|bug-feature|feedback)/, 'issue-intake'],
  [/^Bash\/lab:(build-cloud|index-issues|run-readmes|make-bundle|coder-prompt)/, 'documentation-generation'],
  [/^Bash\/(ddev phpunit|phpunit)/, 'phpunit-execution'],
  [/^Bash\/(ddev composer|composer)/, 'composer-install'],
  [/^Bash\/ddev drupal cache|^Bash\/ddev.*cache/, 'cache-rebuild'],
  [/^Bash\/ddev/, 'environment-setup'],
  [/^Bash\/lab:lab-env/, 'environment-setup'],
  [/^Bash\/(cd|pwd)/, 'environment-setup'],
  [/^Bash\/(rm|cp|mv|mkdir|chmod|ln|tar|unzip|zip)\b/, 'environment-setup'],
  [/^Bash\/(node|npm test|npx playwright|python3|python)\b/, 'validation'],
  [/^Bash\/(for|while|until|if|S|sh|bash)\b/, 'unknown'],
  [/^Bash\/pkill|^Bash\/kill/, 'infrastructure'],
  [/^Bash\/(docker|podman)/, 'infrastructure'],
  [/^Bash\/(gh|gitlab)/, 'issue-intake'],
  [/^Bash\/(git|rg|grep|cat|sed|ls|find|head|tail|wc|awk|less|tree)\b/, 'code-exploration'],
  [/^Bash\/lab:code-map/, 'code-exploration'],
  [/^Bash\/lab:/, 'unknown'],
  [/^mcp__.*Browser|^mcp__.*Playwright/, 'playwright-testing'],
  [/^mcp__.*(coder|ddev)/i, 'environment-setup'],
  [/^mcp__ccd_turn__|^mcp__.*(plan|review)/i, 'issue-analysis'],
  [/^ToolSearch$/, 'code-exploration'],
  [/^Bash\/(gh|curl|wget)/, 'unknown'],
];
export function classifyTool(label) {
  const text = String(label || '');
  for (const [re, activity] of MAP) if (re.test(text)) return activity;
  if (/^Bash\/node .*scripts\/|^Bash\/node scripts\//.test(text)) return 'unknown';
  if (/^Bash\//.test(text)) return 'unknown';
  return 'unknown';
}

export function classifyCommand(argv = []) {
  const command = argv.map((x) => String(x)).join(' ');
  if (/\bphpunit\b/.test(command)) return 'phpunit-execution';
  if (/\bplaywright\b|evaluate-\d+|walkthrough\.mjs|tree-diff\.mjs/.test(command)) return 'playwright-testing';
  if (/\blighthouse\b/.test(command)) return 'lighthouse-testing';
  if (/\baxe\b|a11y|forced-window/.test(command)) return 'accessibility-scanning';
  if (/\bcomposer\b/.test(command)) return 'composer-install';
  if (/\bddev\b.*\bcache\b|\bdrupal\b.*\bcache\b/.test(command)) return 'cache-rebuild';
  if (/\blint\.mjs|try-tests|css-build|selftest|check-draft|coverage\.mjs/.test(command)) return 'validation';
  if (/\bissue-(intake|status|pack)|new-issue|issue-from-url/.test(command)) return 'issue-intake';
  if (/\bbuild-cloud|index-issues|run-readmes|make-bundle/.test(command)) return 'documentation-generation';
  if (/\bmeasure-resources|resource\.mjs|resource-run/.test(command)) return 'resource-measurement';
  if (/\bgit\b|\bgrep\b|\brg\b|\bcat\b|\bsed\b|\bfind\b/.test(command)) return 'code-exploration';
  if (/\bnode\b/.test(command)) return 'unknown';
  return 'unknown';
}

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

// Allocate a session's tokens to activities by tool-call share. The result is explicitly derived; it is not a provider
// measurement of per-activity tokens.
export function allocateActivity(tools = {}, tokens = null, cpuSeconds = null) {
  const weights = new Map(), details = new Map();
  let totalCalls = 0;
  for (const [label, tool] of Object.entries(tools || {})) {
    const activity = classifyTool(label);
    const calls = Number(tool?.calls) || 0;
    const bytes = Number(tool?.resultBytes) || 0;
    const weight = calls || (bytes ? 1 : 0);
    if (!weight) continue;
    totalCalls += weight;
    weights.set(activity, (weights.get(activity) || 0) + weight);
    const d = details.get(activity) || { activity, tool_calls: 0, result_bytes: 0 };
    d.tool_calls += calls; d.result_bytes += bytes; details.set(activity, d);
  }
  if (!totalCalls) return { activity: 'unknown', allocations: [] };
  const ordered = [...weights.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const allocations = [];
  let allocated = 0;
  ordered.forEach(([activity, weight], i) => {
    const share = weight / totalCalls;
    const isLast = i === ordered.length - 1;
    const t = tokens == null ? null : (isLast ? tokens - allocated : Math.round(tokens * share));
    const c = cpuSeconds == null ? null : Math.round(cpuSeconds * share * 1000) / 1000;
    if (t !== null) allocated += t;
    allocations.push({ activity, tokens: t, cpu_seconds: c, method: 'tool-call share; derived' });
  });
  return { activity: ordered[0][0], allocations };
}
