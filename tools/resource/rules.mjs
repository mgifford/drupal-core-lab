// Versioned deterministic classification rules for AI resource accounting.
//
// This file is data + small matchers, not a second monitoring framework. `classify.mjs` consumes it. A rule is named
// (stable id), versioned with the registry, and states the *kind* of evidence it uses:
//
//   structured_tool_arguments  the client gave structured arguments (tool name, file, command)
//   known_script_registry      a script whose purpose this repository documents
//   parsed_command             a shell command parsed into program + subcommand, without executing it
//   tool_name_rule             only the tool name was available
//   contextual_inference       more than one activity is possible; the dominant one is reported with a limitation
//   unclassified               no rule applies; the event stays Unknown with a reason code
//
// A new rule needs a test in tests/lab/resource-classification.test.mjs. Rules must never run a command, read a file,
// call a model or look at the network. If a command is ambiguous, return Unknown rather than guessing.

export const CLASSIFIER_VERSION = '2.0.0';
export const RULE_REGISTRY_VERSION = 1;

export const UNKNOWN_REASONS = Object.freeze({
  unrecognized_tool: 'The tool has no classification rule.',
  unrecognized_command: 'The command or script has no classification rule.',
  compound_command: 'A compound shell command contains operations whose purpose was not resolved.',
  ambiguous_activity: 'The evidence supports more than one activity and no single activity is justified.',
  missing_tool_details: 'The client recorded a tool call without enough detail to classify it.',
  model_only_request: 'The model request has no tool invocation, so it has no tool-based activity.',
  missing_task: 'No reliable task association exists (task attribution, not activity).',
  missing_issue: 'No reliable Drupal issue association exists (issue attribution, not activity).',
  incomplete_transcript: 'The transcript does not contain enough information to classify the operation.',
  unsupported_client: 'The AI client has no classification adapter.',
  missing_usage: 'Provider usage details are unavailable for this record.',
  parser_error: 'The command or record could not be parsed.',
  unclassified_other: 'None of the documented reasons applies.',
});

export const PROVENANCE = Object.freeze([
  'explicit_task_metadata', 'known_script_registry', 'structured_tool_arguments', 'parsed_command',
  'tool_name_rule', 'contextual_inference', 'unclassified',
]);

export const CONFIDENCE = Object.freeze(['deterministic', 'heuristic', 'unclassified']);

// Code-exploration subcategories. `history_investigation` and `change_inspection` are additions to the proposed list;
// the rest match docs/RESOURCE-MONITORING.md. A subcategory is only set when the evidence supports it.
export const EXPLORATION_SUBCATEGORIES = Object.freeze([
  'source_discovery', 'symbol_lookup', 'reference_tracing', 'dependency_investigation', 'test_discovery',
  'issue_history', 'failure_investigation', 'documentation_lookup', 'history_investigation', 'change_inspection',
  'repeated_lookup', 'exploration_other',
]);

// Known lab scripts: basename -> activity, subcategory, rule id. Extend deliberately; unknown scripts stay Unknown.
// Keep in sync with docs/COMMANDS.md by name only, not by copying its prose.
export const LAB_SCRIPTS = Object.freeze({
  'code-map.mjs': { activity: 'code-exploration', subcategory: 'symbol_lookup', rule: 'script.code-map' },
  'code-map-benchmark.mjs': { activity: 'resource-measurement', rule: 'script.code-map-benchmark' },
  'session-usage.mjs': { activity: 'resource-measurement', rule: 'script.session-usage' },
  'context-size.mjs': { activity: 'resource-measurement', rule: 'script.context-size' },
  'usage-baseline.mjs': { activity: 'resource-measurement', rule: 'script.usage-baseline' },
  'measure-resources.mjs': { activity: 'resource-measurement', rule: 'script.measure-resources' },
  'resource.mjs': { activity: 'resource-measurement', rule: 'script.resource' },
  'resource-run.mjs': { activity: 'resource-measurement', rule: 'script.resource-run' },
  'resource-budget.mjs': { activity: 'resource-measurement', rule: 'script.resource-budget' },
  'model-eval.mjs': { activity: 'model-evaluation', rule: 'script.model-eval' },
  'lint.mjs': { activity: 'validation', rule: 'script.lint' },
  'try-tests.mjs': { activity: 'validation', rule: 'script.try-tests' },
  'css-build.mjs': { activity: 'validation', rule: 'script.css-build' },
  'selftest.mjs': { activity: 'validation', rule: 'script.selftest' },
  'coverage.mjs': { activity: 'validation', rule: 'script.coverage' },
  'check-draft.mjs': { activity: 'validation', rule: 'script.check-draft' },
  'check-docs.mjs': { activity: 'validation', rule: 'script.check-docs' },
  'ready-to-push.mjs': { activity: 'validation', rule: 'script.ready-to-push' },
  'skill-evals.mjs': { activity: 'validation', rule: 'script.skill-evals' },
  'viewer-security.mjs': { activity: 'validation', rule: 'script.viewer-security' },
  'doctor.mjs': { activity: 'environment-setup', rule: 'script.doctor' },
  'setup.mjs': { activity: 'environment-setup', rule: 'script.setup' },
  'serve.mjs': { activity: 'environment-setup', rule: 'script.serve' },
  'lab-env.mjs': { activity: 'environment-setup', rule: 'script.lab-env' },
  'test-mr.mjs': { activity: 'environment-setup', rule: 'script.test-mr' },
  'cloud-bootstrap.mjs': { activity: 'environment-setup', rule: 'script.cloud-bootstrap' },
  'build-cloud.mjs': { activity: 'documentation-generation', rule: 'script.build-cloud' },
  'issue-intake.mjs': { activity: 'issue-intake', rule: 'script.issue-intake' },
  'issue-status.mjs': { activity: 'issue-intake', rule: 'script.issue-status' },
  'issue-pack.mjs': { activity: 'issue-intake', rule: 'script.issue-pack' },
  'issue-from-url.mjs': { activity: 'issue-intake', rule: 'script.issue-from-url' },
  'issue-archive.mjs': { activity: 'issue-intake', rule: 'script.issue-archive' },
  'new-issue.mjs': { activity: 'issue-intake', rule: 'script.new-issue' },
  'bug-feature.mjs': { activity: 'issue-intake', rule: 'script.bug-feature' },
  'feedback.mjs': { activity: 'issue-intake', rule: 'script.feedback' },
  'index-issues.mjs': { activity: 'documentation-generation', rule: 'script.index-issues' },
  'run-readmes.mjs': { activity: 'documentation-generation', rule: 'script.run-readmes' },
  'make-bundle.mjs': { activity: 'documentation-generation', rule: 'script.make-bundle' },
  'coder-prompt.mjs': { activity: 'documentation-generation', rule: 'script.coder-prompt' },
  'make-demo-gif.mjs': { activity: 'documentation-generation', rule: 'script.make-demo-gif' },
  'capture-patch.mjs': { activity: 'patch-development', rule: 'script.capture-patch' },
  'patch-change.mjs': { activity: 'patch-development', rule: 'script.patch-change' },
  'axe-scan.mjs': { activity: 'accessibility-scanning', rule: 'script.axe-scan' },
  'lighthouse.mjs': { activity: 'lighthouse-testing', rule: 'script.lighthouse' },
  'walkthrough.mjs': { activity: 'playwright-testing', rule: 'script.walkthrough' },
  'tree-diff.mjs': { activity: 'playwright-testing', rule: 'script.tree-diff' },
  'resource-dashboard.mjs': { activity: 'validation', rule: 'script.resource-dashboard' },
  'lab-run.mjs': { activity: 'playwright-testing', rule: 'script.lab-run' },
  // tools/compare and tools/playwright entry points (session-usage labels these `lab:<basename>`)
  'pack-validate.mjs': { activity: 'issue-intake', rule: 'script.pack-validate' },
  'pack-prepare.mjs': { activity: 'issue-intake', rule: 'script.pack-prepare' },
  'pack-edit.mjs': { activity: 'issue-intake', rule: 'script.pack-edit' },
  'pack-checks.mjs': { activity: 'issue-intake', rule: 'script.pack-checks' },
  'pack-blocks.mjs': { activity: 'issue-intake', rule: 'script.pack-blocks' },
  'issue-summary.mjs': { activity: 'issue-intake', rule: 'script.issue-summary' },
  'issue-tracking.mjs': { activity: 'issue-intake', rule: 'script.issue-tracking' },
  'core-toolchain.mjs': { activity: 'environment-setup', rule: 'script.core-toolchain' },
  'patch-state.mjs': { activity: 'patch-development', rule: 'script.patch-state' },
  'change-under-test.mjs': { activity: 'patch-development', rule: 'script.change-under-test' },
  'capture.mjs': { activity: 'playwright-testing', rule: 'script.capture' },
  'browser-launch.mjs': { activity: 'playwright-testing', rule: 'script.browser-launch' },
  'emulation.mjs': { activity: 'playwright-testing', rule: 'script.emulation' },
  'media-preferences.mjs': { activity: 'accessibility-scanning', rule: 'script.media-preferences' },
  'diff.mjs': { activity: 'playwright-testing', rule: 'script.diff' },
  'findings.mjs': { activity: 'issue-intake', rule: 'script.findings' },
  'run-mark.mjs': { activity: 'validation', rule: 'script.run-mark' },
  'check-pins.mjs': { activity: 'validation', rule: 'script.check-pins' },
  'cloud-smoke.mjs': { activity: 'validation', rule: 'script.cloud-smoke' },
  'intake-benchmark.mjs': { activity: 'resource-measurement', rule: 'script.intake-benchmark' },
  'repair-benchmark.mjs': { activity: 'resource-measurement', rule: 'script.repair-benchmark' },
  'build-design-reference.mjs': { activity: 'documentation-generation', rule: 'script.build-design-reference' },
  'forced-colors-pair.mjs': { activity: 'accessibility-scanning', rule: 'script.forced-colors-pair' },
  'validate-forced-colors-patches.mjs': { activity: 'accessibility-scanning', rule: 'script.validate-forced-colors' },
  'lab-config.mjs': { activity: 'environment-setup', rule: 'script.lab-config' },
  'info-yml-repro.mjs': { activity: 'validation', rule: 'script.info-yml-repro' },
  'site-install.php': { activity: 'environment-setup', rule: 'script.site-install' },
  'add-language.php': { activity: 'environment-setup', rule: 'script.add-language' },
});

// A script whose basename starts with one of these prefixes is still known without a per-issue entry.
const SCRIPT_PREFIXES = Object.freeze([
  { prefix: 'evaluate-', activity: 'playwright-testing', rule: 'script.evaluate-<issue>' },
  { prefix: 'walkthrough-', activity: 'playwright-testing', rule: 'script.walkthrough-<issue>' },
  { prefix: 'viewer-', activity: 'playwright-testing', rule: 'script.viewer-<mode>' },
  { prefix: 'mirror-', activity: 'playwright-testing', rule: 'script.mirror-<mode>' },
  { prefix: 'flow-', activity: 'playwright-testing', rule: 'script.flow-<mode>' },
  { prefix: 'frameload-', activity: 'playwright-testing', rule: 'script.frameload-<mode>' },
  { prefix: 'forced-', activity: 'accessibility-scanning', rule: 'script.forced-<mode>' },
  { prefix: 'label-', activity: 'accessibility-scanning', rule: 'script.label-<mode>' },
]);

export function scriptRule(file) {
  const base = String(file || '').split(/[\\/]/).pop();
  if (!base) return null;
  if (LAB_SCRIPTS[base]) return { ...LAB_SCRIPTS[base], rule_id: LAB_SCRIPTS[base].rule };
  for (const p of SCRIPT_PREFIXES) if (base.startsWith(p.prefix) && /\.(mjs|cjs|js)$/.test(base)) return { activity: p.activity, rule_id: p.rule };
  return null;
}

// Git is classified by subcommand, not by the executable.
export const GIT_RULES = Object.freeze({
  grep: { activity: 'code-exploration', subcategory: 'source_discovery', rule: 'git.source-search' },
  diff: { activity: 'code-exploration', subcategory: 'change_inspection', rule: 'git.diff' },
  status: { activity: 'environment-setup', subcategory: null, rule: 'git.status' },
  log: { activity: 'code-exploration', subcategory: 'history_investigation', rule: 'git.history' },
  show: { activity: 'code-exploration', subcategory: 'history_investigation', rule: 'git.history' },
  blame: { activity: 'code-exploration', subcategory: 'history_investigation', rule: 'git.blame' },
  apply: { activity: 'patch-development', rule: 'git.apply' },
  commit: { activity: 'patch-development', rule: 'git.commit' },
  add: { activity: 'patch-development', rule: 'git.add' },
  fetch: { activity: 'environment-setup', rule: 'git.sync' },
  pull: { activity: 'environment-setup', rule: 'git.sync' },
  push: { activity: 'environment-setup', rule: 'git.sync' },
  checkout: { activity: 'environment-setup', rule: 'git.checkout' },
  switch: { activity: 'environment-setup', rule: 'git.checkout' },
  branch: { activity: 'environment-setup', rule: 'git.branch' },
  remote: { activity: 'environment-setup', rule: 'git.remote' },
  submodule: { activity: 'environment-setup', rule: 'git.submodule' },
  worktree: { activity: 'environment-setup', rule: 'git.worktree' },
  rev_parse: { activity: 'environment-setup', rule: 'git.rev-parse' },
  'rev-parse': { activity: 'environment-setup', rule: 'git.rev-parse' },
  stash: { activity: 'patch-development', rule: 'git.stash' },
  restore: { activity: 'environment-setup', rule: 'git.restore' },
  reset: { activity: 'environment-setup', rule: 'git.reset' },
  clean: { activity: 'environment-setup', rule: 'git.clean' },
  config: { activity: 'environment-setup', rule: 'git.config' },
  init: { activity: 'environment-setup', rule: 'git.init' },
  clone: { activity: 'environment-setup', rule: 'git.clone' },
  merge: { activity: 'patch-development', rule: 'git.merge' },
  rebase: { activity: 'patch-development', rule: 'git.rebase' },
  am: { activity: 'patch-development', rule: 'git.am' },
  format_patch: { activity: 'patch-development', rule: 'git.format-patch' },
  'format-patch': { activity: 'patch-development', rule: 'git.format-patch' },
});

// Tool names are matched exactly (case-insensitive for MCP-style names) so an unknown tool is never guessed.
export const TOOL_RULES = Object.freeze([
  { match: /^(Read|NotebookRead)$/i, activity: 'code-exploration', subcategory: 'source_discovery', rule: 'tool.read', provenance: 'tool_name_rule' },
  { match: /^(Grep|Glob)$/i, activity: 'code-exploration', subcategory: 'source_discovery', rule: 'tool.search', provenance: 'tool_name_rule' },
  { match: /^(Edit|Write|MultiEdit|NotebookEdit)$/i, activity: 'patch-development', rule: 'tool.edit', provenance: 'tool_name_rule' },
  { match: /^(WebFetch|WebSearch)$/i, activity: 'code-exploration', subcategory: 'documentation_lookup', rule: 'tool.web-lookup', provenance: 'tool_name_rule' },
  { match: /^ToolSearch$/i, activity: 'code-exploration', subcategory: 'exploration_other', rule: 'tool.search-tools', provenance: 'tool_name_rule' },
  { match: /^mcp__.*(Browser|Playwright)/i, activity: 'playwright-testing', rule: 'mcp.browser', provenance: 'tool_name_rule' },
  { match: /^mcp__.*(coder|ddev)/i, activity: 'environment-setup', rule: 'mcp.environment', provenance: 'tool_name_rule' },
  { match: /^mcp__ccd_turn__/i, activity: 'issue-analysis', rule: 'mcp.turn', provenance: 'tool_name_rule' },
  { match: /^mcp__ccd_pr__/i, activity: 'issue-intake', rule: 'mcp.pull-request', provenance: 'tool_name_rule' },
  { match: /^mcp__ccd_issue__/i, activity: 'issue-intake', rule: 'mcp.issue', provenance: 'tool_name_rule' },
  { match: /^mcp__ccd_session_mgmt__get_usage$/i, activity: 'resource-measurement', rule: 'mcp.session-usage', provenance: 'tool_name_rule' },
  { match: /^mcp__ccd_session/i, activity: 'environment-setup', rule: 'mcp.session', provenance: 'tool_name_rule' },
  { match: /^mcp__terminal__/i, activity: 'environment-setup', rule: 'mcp.terminal', provenance: 'tool_name_rule' },
  { match: /^mcp__scheduled-tasks__/i, activity: 'infrastructure', rule: 'mcp.scheduled-task', provenance: 'tool_name_rule' },
  { match: /^Monitor$/i, activity: 'infrastructure', rule: 'tool.monitor', provenance: 'tool_name_rule' },
  { match: /^Skill$/i, activity: 'environment-setup', rule: 'tool.skill', provenance: 'tool_name_rule' },
  { match: /^AskUserQuestion$/i, activity: 'issue-analysis', rule: 'tool.question', provenance: 'tool_name_rule' },
  { match: /^SendUserFile$/i, activity: 'documentation-generation', rule: 'tool.send-file', provenance: 'tool_name_rule' },
]);

// Signals in inline code (a heredoc body or `node -e` / `python3 -c` argument). Used only to choose between writing,
// testing and reading; the code is never executed and its text is never stored. This is deterministic and heuristic.
export function inlineCodeSignals(code) {
  const s = String(code || '').slice(0, 200000);
  const write = /(?:writeFileSync|appendFileSync|renameSync|copyFileSync|unlinkSync|write_text|json\.dump|shutil\.copy|open\s*\([^)]*['"]w|replaceAll\s*\(|\.replace\s*\()/;
  const test = /(?:pytest|unittest|\bassert\b|--test\b|expect\s*\()/;
  const read = /(?:readFileSync|readFile\s*\(|read_text|json\.load|open\s*\([^)]*['"]r|existsSync|statSync|require\s*\(\s*['"][^'"]+\.json)/;
  if (write.test(s)) return { activity: 'patch-development', rule_id: 'inline.write-signal', provenance: 'contextual_inference', confidence: 'heuristic', note: 'Inline code contains a file-write signal; content was not executed or stored.' };
  if (test.test(s)) return { activity: 'validation', rule_id: 'inline.test-signal', provenance: 'contextual_inference', confidence: 'heuristic', note: 'Inline code contains a test signal; content was not executed or stored.' };
  if (read.test(s)) return { activity: 'code-exploration', rule_id: 'inline.read-signal', provenance: 'contextual_inference', confidence: 'heuristic', note: 'Inline code contains a file-read signal; content was not executed or stored.' };
  return null;
}

export const NAVIGATION = new Set(['cd', 'pushd', 'popd', 'export', 'set', 'unset', 'source', '.', ':', 'true', 'false', '[', ']', '[[', ']]', 'test', 'tee', 'sleep']);
export const WRAPPERS = new Set(['sudo', 'time', 'nohup', 'command', 'exec', 'nice', 'stdbuf', 'xargs', 'timeout']);
export const SHELL_CONTROL = new Set(['for', 'while', 'until', 'if', 'elif', 'then', 'else', 'do', 'done', 'fi', 'case', 'esac', 'select', '{', '}', '!', 'break', 'continue']);
export const PLUMBING = new Set(['echo', 'printf', 'tee', 'true', 'false', ':', 'sleep']);

export function argvRule(argv) {
  let a = argv.map((x) => String(x));
  // strip leading assignments and wrappers, then look at the program
  while (a.length && (/^[A-Za-z_][A-Za-z0-9_]*=/.test(a[0]) || WRAPPERS.has(a[0]))) a = a.slice(1);
  if (!a.length) return { activity: 'environment-setup', rule_id: 'shell.assignment-only', provenance: 'parsed_command' };
  const program = a[0].replace(/^.*\//, '');
  const sub = a[1] || '';

  if (program === 'git') {
    const g = GIT_RULES[sub];
    if (g) return { activity: g.activity, subcategory: g.subcategory || null, rule_id: g.rule, provenance: 'parsed_command' };
    return { activity: 'unknown', unknown_reason: 'unrecognized_command', rule_id: 'git.unknown', provenance: 'parsed_command' };
  }
  if (program === 'ddev') {
    if (sub === 'composer') return { activity: 'composer-install', rule_id: 'ddev.composer', provenance: 'parsed_command' };
    if (sub === 'phpunit') return { activity: 'phpunit-execution', rule_id: 'ddev.phpunit', provenance: 'parsed_command' };
    if ((sub === 'drush' || sub === 'drupal') && a.some((x) => /^cache(:rebuild)?$/.test(x))) return { activity: 'cache-rebuild', rule_id: 'ddev.cache-rebuild', provenance: 'parsed_command' };
    if (sub === 'exec') {
      const inner = classifyArgv(a.slice(2));
      if (inner.activity !== 'unknown') return { ...inner, rule_id: `ddev.exec:${inner.rule_id}`, provenance: 'parsed_command' };
      return { activity: 'environment-setup', rule_id: 'ddev.exec', provenance: 'parsed_command' };
    }
    return { activity: 'environment-setup', rule_id: 'ddev', provenance: 'parsed_command' };
  }
  if (program === 'composer') return { activity: 'composer-install', rule_id: 'composer', provenance: 'parsed_command' };
  if (program === 'phpunit') return { activity: 'phpunit-execution', rule_id: 'phpunit', provenance: 'parsed_command' };
  if (program === 'php' && a[1] === '-r') return { activity: 'unknown', unknown_reason: 'unrecognized_command', rule_id: 'php.inline', provenance: 'parsed_command' };
  if (program === 'php' && a[1]) return { activity: 'phpunit-execution', rule_id: 'php.script', provenance: 'parsed_command' };
  if (program === 'node' || program === 'bun' || program === 'deno') return classifyJs(a, program);
  if (program === 'npm' || program === 'pnpm' || program === 'yarn') {
    const command = a[1] === 'run' ? a[2] : a[1];
    if (command === 'test' || command === 'lint' || command === 'check') return { activity: 'validation', rule_id: 'javascript.test', provenance: 'parsed_command' };
    if (command === 'install' || command === 'ci' || command === 'add' || command === 'remove') return { activity: 'environment-setup', rule_id: 'javascript.install', provenance: 'parsed_command' };
    return { activity: 'environment-setup', rule_id: 'javascript.run', provenance: 'parsed_command' };
  }
  if (program === 'npx') {
    if (/playwright/.test(a[1] || '')) return { activity: 'playwright-testing', rule_id: 'npx.playwright', provenance: 'parsed_command' };
    if (/axe|lighthouse/.test(a[1] || '')) return { activity: 'accessibility-scanning', rule_id: 'npx.axe', provenance: 'parsed_command' };
    return { activity: 'unknown', unknown_reason: 'unrecognized_command', rule_id: 'npx.unknown', provenance: 'parsed_command' };
  }
  if (program === 'gh') {
    if (sub === 'run' || sub === 'workflow') return { activity: 'github-actions', rule_id: 'gh.actions', provenance: 'parsed_command' };
    if (['issue', 'pr', 'api'].includes(sub)) return { activity: 'issue-intake', rule_id: 'gh.issue', provenance: 'parsed_command' };
    return { activity: 'environment-setup', rule_id: 'gh.other', provenance: 'parsed_command' };
  }
  if (program === 'python' || program === 'python3') return classifyPython(a, program);
  if (['cd', 'pushd', 'popd', 'export', 'set', 'unset', 'source'].includes(program)) return { activity: 'environment-setup', rule_id: 'shell.navigation', provenance: 'parsed_command' };
  if (program === 'coder') return { activity: 'environment-setup', rule_id: 'cli.coder', provenance: 'parsed_command' };
  if (program === 'claude' || program === 'llm') return { activity: 'model-evaluation', rule_id: 'cli.model', provenance: 'contextual_inference', confidence: 'heuristic' };
  if (['grep', 'rg', 'ag', 'ack'].includes(program)) return { activity: 'code-exploration', subcategory: 'source_discovery', rule_id: 'shell.search', provenance: 'parsed_command' };
  if (['find', 'ls', 'tree', 'fd'].includes(program)) return { activity: 'code-exploration', subcategory: 'source_discovery', rule_id: 'shell.list', provenance: 'parsed_command' };
  if (['cat', 'sed', 'awk', 'head', 'tail', 'wc', 'less', 'more', 'xxd', 'od', 'cut', 'sort', 'uniq', 'tr', 'column'].includes(program)) return { activity: 'code-exploration', subcategory: 'symbol_lookup', rule_id: 'shell.read-span', provenance: 'parsed_command' };
  if (program === 'jq') return { activity: 'code-exploration', subcategory: 'exploration_other', rule_id: 'shell.json-inspect', provenance: 'parsed_command' };
  if (['curl', 'wget'].includes(program)) {
    const text = a.join(' ');
    if (/drupal\.org|drupalcode\.org/.test(text)) return { activity: 'issue-intake', rule_id: 'network.drupal', provenance: 'parsed_command' };
    if (/localhost|127\.0\.0\.1|\[::1\]/.test(text)) return { activity: 'environment-setup', rule_id: 'network.local-readiness', provenance: 'parsed_command' };
    return { activity: 'unknown', unknown_reason: 'unrecognized_command', rule_id: 'network.unknown', provenance: 'parsed_command' };
  }
  if (['docker', 'podman'].includes(program)) {
    if (sub === 'exec') {
      const inner = classifyArgv(a.slice(2));
      if (inner.activity !== 'unknown') return { ...inner, rule_id: `container.exec:${inner.rule_id}`, provenance: 'parsed_command' };
    }
    return { activity: 'infrastructure', rule_id: 'container', provenance: 'parsed_command' };
  }
  if (['ssh', 'scp', 'rsync', 'kill', 'pkill', 'pgrep', 'ps', 'top', 'sleep', 'open', 'lsof', 'netstat', 'ss'].includes(program)) return { activity: 'infrastructure', rule_id: 'system.process', provenance: 'parsed_command' };
  if (['chmod', 'chown', 'mkdir', 'cp', 'mv', 'rm', 'ln', 'touch', 'mktemp', 'tar', 'unzip', 'zip', 'gzip', 'gunzip'].includes(program)) return { activity: 'environment-setup', rule_id: 'filesystem', provenance: 'parsed_command' };
  if (['date', 'pwd', 'whoami', 'uname', 'which', 'type', 'env', 'printenv', 'id', 'df', 'du', 'seq'].includes(program)) return { activity: 'environment-setup', rule_id: 'system.info', provenance: 'parsed_command' };
  if (program === 'drush') {
    if (a[1] === 'cr' || a[1] === 'cache:rebuild') return { activity: 'cache-rebuild', rule_id: 'drush.cache-rebuild', provenance: 'parsed_command' };
    return { activity: 'environment-setup', rule_id: 'drush', provenance: 'parsed_command' };
  }
  if (['echo', 'printf', 'cat-file', 'seq', 'tee'].includes(program)) return { activity: 'unknown', unknown_reason: 'unrecognized_command', rule_id: 'shell.print', provenance: 'parsed_command' };
  if (program === 'bash' || program === 'sh' || program === 'zsh') {
    const c = a.indexOf('-c');
    if (c >= 0 && a[c + 1]) return { ...classifyShell(a[c + 1]), rule_id: `shell.inline:${classifyShell(a[c + 1]).rule_id}` };
    if (a[1]) {
      const s = scriptRule(a[1]);
      if (s) return { ...s, provenance: 'known_script_registry' };
    }
    return { activity: 'unknown', unknown_reason: 'compound_command', rule_id: 'shell.inline-unknown', provenance: 'unclassified' };
  }
  if (/\.(mjs|cjs|js)$/.test(program)) {
    const s = scriptRule(program);
    if (s) return { ...s, provenance: 'known_script_registry' };
    return { activity: 'unknown', unknown_reason: 'unrecognized_command', rule_id: 'script.unknown', provenance: 'unclassified' };
  }
  return { activity: 'unknown', unknown_reason: 'unrecognized_command', rule_id: 'command.unknown', provenance: 'unclassified' };
}

function classifyJs(a, program) {
  if (a.includes('--test') || a.includes('--check')) return { activity: 'validation', rule_id: 'node.test', provenance: 'parsed_command' };
  const scriptIndex = a.findIndex((x, i) => i > 0 && !x.startsWith('-') && /\.(mjs|cjs|js)$/.test(x));
  if (scriptIndex > 0) {
    const s = scriptRule(a[scriptIndex]);
    if (s) return { ...s, provenance: 'known_script_registry' };
    return { activity: 'unknown', unknown_reason: 'unrecognized_command', rule_id: 'script.unknown', provenance: 'unclassified' };
  }
  const evalIndex = a.findIndex((x) => ['-e', '-p', '--eval', '--print'].includes(x));
  if (evalIndex >= 0 && a[evalIndex + 1]) {
    const signal = inlineCodeSignals(a[evalIndex + 1]);
    if (signal) return signal;
    return { activity: 'unknown', unknown_reason: 'unrecognized_command', rule_id: 'node.inline', provenance: 'parsed_command' };
  }
  return { activity: 'unknown', unknown_reason: 'missing_tool_details', rule_id: 'node.no-script', provenance: 'unclassified' };
}

function classifyPython(a, program) {
  if (a[1] === '-m' && /pytest|unittest/.test(a[2] || '')) return { activity: 'validation', rule_id: 'python.tests', provenance: 'parsed_command' };
  if (a[1] === '-m' && /http\.server/.test(a[2] || '')) return { activity: 'environment-setup', rule_id: 'python.http-server', provenance: 'parsed_command' };
  if (a[1] === '-c' && a[2]) { const signal = inlineCodeSignals(a[2]); if (signal) return signal; }
  if (a[1] === '-c' || a[1] === '-') return { activity: 'unknown', unknown_reason: 'unrecognized_command', rule_id: 'python.inline', provenance: 'parsed_command' };
  const script = a[1];
  if (script) {
    const s = scriptRule(script);
    if (s) return { ...s, provenance: 'known_script_registry' };
  }
  return { activity: 'unknown', unknown_reason: 'unrecognized_command', rule_id: 'python.unknown', provenance: 'unclassified' };
}

// A conservative shell splitter. It never evaluates, expands or executes anything. Quotes are honoured; `$(...)` and
// backticks are reported as opaque because resolving them would need evaluation. Heredocs are opaque.
export function parseShell(command, depth = 0) {
  const raw = String(command || '');
  if (!raw.trim()) return { segments: [], opaque: false, parser_error: false, heredoc: false };
  if (depth > 3) return { segments: [], opaque: true, parser_error: false, heredoc: false };
  const heredoc = /<<-?\s*['"]?[A-Za-z_][A-Za-z0-9_]*/.test(raw);
  // A heredoc body is data, not shell. Parse only the command line; the body is never evaluated.
  const line = heredoc && raw.includes('\n') ? raw.slice(0, raw.indexOf('\n')) : raw;
  const opaque = heredoc || /\$\(|`|<\s*\(|>\s*\(/.test(line);
  // Redirections are plumbing, not operations. They are dropped from the token list, never expanded or executed.
  const parts = []; let cur = ''; let quote = null; let escaped = false;
  const push = () => { if (cur.trim()) parts.push(cur.trim()); cur = ''; };
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (escaped) { cur += ch; escaped = false; continue; }
    if (ch === '\\' && quote !== "'") { cur += ch; escaped = true; continue; }
    if (quote) { cur += ch; if (ch === quote) quote = null; continue; }
    if (ch === '"' || ch === "'") { quote = ch; cur += ch; continue; }
    if (ch === ';' || ch === '\n' || (ch === '&' && line[i + 1] === '&') || (ch === '|' && line[i + 1] === '|')) {
      push(); if (ch !== ';' && ch !== '\n') i++; parts.push(';'); continue;
    }
    if (ch === '&') {
      // part of a redirection such as 2>&1 or &>, not a command separator
      if (line[i - 1] === '>' || line[i + 1] === '>') { cur += ch; continue; }
      push(); parts.push(';'); continue;
    }
    if (ch === '|') { push(); parts.push(';'); continue; }
    cur += ch;
  }
  push();
  const segments = parts.filter((p) => p !== ';').map((p) => splitWords(p)).filter((a) => a.length);
  return { segments, opaque, parser_error: quote != null, heredoc };
}

function splitWords(s) {
  const words = []; let cur = ''; let quote = null; let escaped = false;
  for (const ch of String(s)) {
    if (escaped) { cur += ch; escaped = false; continue; }
    if (ch === '\\' && quote !== "'") { escaped = true; continue; }
    if (quote) { if (ch === quote) quote = null; else cur += ch; continue; }
    if (ch === '"' || ch === "'") { quote = ch; continue; }
    if (/\s/.test(ch)) { if (cur) { words.push(cur); cur = ''; } continue; }
    cur += ch;
  }
  if (cur) words.push(cur);
  const out = []; let skipNext = false;
  for (const w of words) {
    if (skipNext) { skipNext = false; continue; }
    if (/^\d*(?:>>?|<)/.test(w)) { if (/^\d*(?:>>?|<)$/.test(w)) skipNext = true; continue; }
    out.push(w);
  }
  return out;
}

// Deterministic primary-operation choice for a compound command or a multi-tool request: the activity with the most
// operations wins; ties use a documented precedence. Every component is still recorded and the result is heuristic.
// This is not an assertion that the other operations' tokens were unnecessary or caused by the primary one.
export const PRIMARY_PRECEDENCE = Object.freeze([
  'patch-development', 'validation', 'phpunit-execution', 'playwright-testing', 'accessibility-scanning',
  'lighthouse-testing', 'issue-intake', 'issue-analysis', 'documentation-generation', 'model-evaluation',
  'resource-measurement', 'environment-setup', 'composer-install', 'cache-rebuild', 'github-actions',
  'infrastructure', 'code-exploration',
]);
const STRONG_PRIMARY = new Set(['patch-development', 'validation', 'phpunit-execution', 'playwright-testing', 'accessibility-scanning', 'lighthouse-testing', 'issue-intake', 'issue-analysis', 'documentation-generation']);
export function primaryActivity(components) {
  const known = components.filter((c) => c.activity !== 'unknown');
  if (!known.length) return null;
  const counts = new Map();
  for (const c of known) counts.set(c.activity, (counts.get(c.activity) || 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || PRIMARY_PRECEDENCE.indexOf(a[0]) - PRIMARY_PRECEDENCE.indexOf(b[0]))[0][0];
}
export function isStrongPrimary(activity) { return STRONG_PRIMARY.has(activity); }
export function dominantSubcategory(components) {
  const counts = new Map();
  for (const c of components) if (c.subcategory) counts.set(c.subcategory, (counts.get(c.subcategory) || 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] || null;
}

// A read of repository state that often rides along a substantive command (`node scripts/lint.mjs && git status`).
// When a substantive operation is present, these do not create a second activity; alone they keep their activity.
const INCIDENTAL = new Set(['git.status', 'git.rev-parse', 'git.branch', 'git.remote', 'git.config', 'system.info']);
function isIncidental(component) { return INCIDENTAL.has(component.rule_id); }

// Classify one shell command. Returns a component list plus the conservative aggregate.
export function classifyShell(command, depth = 0) {
  const parsed = parseShell(command, depth);
  if (parsed.parser_error && parsed.heredoc) return { activity: 'unknown', unknown_reason: 'compound_command', rule_id: 'shell.heredoc-ambiguous', provenance: 'unclassified', components: [], notes: ['A heredoc body was not parsed; the command line could not be split safely.'] };
  if (parsed.parser_error) return { activity: 'unknown', unknown_reason: 'parser_error', rule_id: 'shell.parse-error', provenance: 'unclassified', components: [], notes: ['Unbalanced quote; the command was not evaluated.'] };
  if (parsed.heredoc) {
    const line = String(command).split('\n')[0];
    const writes = /(?:^|&&|;|\|\|)\s*(?:cat|tee)\b[^;&|]*>/.test(line) || /(?:^|&&|;|\|\|)\s*tee\s+\S/.test(line) || /(?:^|&&|;|\|\|)\s*cp\s+/.test(line);
    if (writes) {
      return { activity: 'patch-development', rule_id: 'shell.heredoc-write', provenance: 'parsed_command', confidence: 'deterministic', components: [{ activity: 'patch-development', rule_id: 'shell.heredoc-write', provenance: 'parsed_command' }], notes: ['A heredoc or copy writes a file; its contents were not read or executed.'] };
    }
    if (/(?:^|&&|;|\|\|)\s*(?:node|python3?|perl)\b/.test(line)) {
      const body = String(command).includes('\n') ? String(command).slice(String(command).indexOf('\n') + 1) : '';
      const signal = inlineCodeSignals(body);
      if (signal) return { activity: signal.activity, rule_id: signal.rule_id, provenance: signal.provenance, confidence: signal.confidence, components: [{ activity: signal.activity, rule_id: signal.rule_id }], notes: [signal.note] };
      return { activity: 'unknown', unknown_reason: 'unrecognized_command', rule_id: 'shell.heredoc-inline-code', provenance: 'unclassified', components: [], notes: ['Inline code was supplied through a heredoc; its purpose is not determinable from the command line.'] };
    }
  }
  const components = [];
  let control = 0;
  for (const argv of parsed.segments) {
    let a = argv.slice();
    while (a.length && String(a[0]).startsWith('(')) { a[0] = String(a[0]).replace(/^\(+/, ''); if (!a[0]) a.shift(); }
    while (a.length && String(a[a.length - 1]).endsWith(')')) { a[a.length - 1] = String(a[a.length - 1]).replace(/\)+$/, ''); if (!a[a.length - 1]) a.pop(); }
    // Strip loop/if keywords. A header (`for ...`, `while ...`) carries no operation; `do` and `then` introduce the body.
    while (a.length && SHELL_CONTROL.has(a[0])) {
      if (['for', 'while', 'until', 'if', 'case', 'select', 'elif'].includes(a[0])) { control++; break; }
      if (['do', 'then', 'else', '{', '!'].includes(a[0])) { a = a.slice(1); continue; }
      break;
    }
    if (!a.length) continue;
    if (a.every((x) => /^[A-Za-z_][A-Za-z0-9_]*=/.test(x)) && parsed.segments.length > 1) continue;
    if (SHELL_CONTROL.has(a[0])) {
      // A while/until condition is a wait or readiness check; it is execution time, not a loop body.
      if (['while', 'until'].includes(a[0]) && parsed.segments.length > 1) components.push({ activity: 'environment-setup', rule_id: 'shell.wait-condition', provenance: 'parsed_command' });
      continue;
    }
    if (NAVIGATION.has(a[0]) && parsed.segments.length > 1) continue;
    if (PLUMBING.has(a[0]) && parsed.segments.length > 1) continue;
    if (isPipePlumbing(a, parsed.segments.length)) continue;
    const r = argvRule(a);
    components.push(r);
  }
  const resolvedAll = components.filter((c) => c.activity !== 'unknown');
  const substantive = resolvedAll.filter((c) => !isIncidental(c));
  const resolved = substantive.length ? substantive : resolvedAll;
  const unresolved = components.filter((c) => c.activity === 'unknown');
  const activities = [...new Set(resolved.map((c) => c.activity))];
  if (!components.length) {
    return { activity: 'unknown', unknown_reason: parsed.opaque ? 'compound_command' : 'unrecognized_command', rule_id: 'shell.empty', provenance: 'unclassified', components: [], notes: control ? ['The shell control structure had no classifiable body.'] : [] };
  }
  if (activities.length === 1 && unresolved.length === 0) {
    const sub = resolved.find((c) => c.subcategory)?.subcategory || null;
    return { activity: activities[0], subcategory: sub, rule_id: resolved[0].rule_id, provenance: parsed.opaque ? 'contextual_inference' : (resolved[0].provenance || 'parsed_command'), confidence: parsed.opaque ? 'heuristic' : (resolved[0].confidence || 'deterministic'), components: resolved, notes: parsed.opaque ? ['Command contains a substitution or heredoc; only the resolvable parts were classified.'] : [] };
  }
  if (activities.length === 0) {
    return { activity: 'unknown', unknown_reason: unresolved[0]?.unknown_reason || (parsed.segments.length > 1 ? 'compound_command' : 'unrecognized_command'), rule_id: unresolved[0]?.rule_id || 'shell.unknown', provenance: 'unclassified', components: unresolved, notes: parsed.opaque ? ['Command contains a substitution or heredoc.'] : [] };
  }
  if (activities.length > 1) {
    const primary = primaryActivity(resolved);
    const subcategory = primary === 'code-exploration' ? dominantSubcategory(resolved) : null;
    return { activity: primary, subcategory, rule_id: `shell.primary:${resolved.find((c) => c.activity === primary)?.rule_id || primary}`, provenance: 'contextual_inference', confidence: 'heuristic', components: [...resolved, ...unresolved], notes: [`Primary-operation rule chose ${primary} from ${activities.join(', ')}; no token split is asserted.`] };
  }
  // one resolvable activity plus an unresolved part: keep the uncertainty explicit
  return { activity: 'unknown', unknown_reason: 'compound_command', rule_id: 'shell.partial', provenance: 'contextual_inference', confidence: 'heuristic', components: [...resolved, ...unresolved], notes: ['Part of the compound command could not be classified.'] };
}

// A bare `tail`/`head`/`cat` at the end of a pipeline is output plumbing, not a read of a named file.
function isPipePlumbing(argv, segmentCount) {
  if (segmentCount < 2) return false;
  const program = String(argv[0] || '').replace(/^.*\//, '');
  if (!['tail', 'head', 'cat', 'tee', 'cut', 'sort', 'uniq', 'tr', 'column'].includes(program)) return false;
  const operands = argv.slice(1).filter((x) => !x.startsWith('-'));
  return operands.length === 0;
}

export function classifyArgv(argv, depth = 0) {
  const r = argvRule(argv);
  return { ...r, components: [r] };
}
