#!/usr/bin/env node
/**
 * Merge multi-scanner crawl shards into a structured accessibility report.
 *
 * Runs three scanners: axe-core, IBM Equal Access, Virtual Screen Reader.
 * Cross-references findings across all three tools.
 *
 * Follows ACCESSIBILITY_BUG_REPORTING_BEST_PRACTICES:
 * https://mgifford.github.io/ACCESSIBILITY.md/examples/ACCESSIBILITY_BUG_REPORTING_BEST_PRACTICES.html
 *
 * Usage:
 *   node merge-results.js
 *
 * Reads all multi-scanner-*.json files from reports/.tmp-crawl/ and writes:
 *   - reports/multi-scanner-results.json (full structured data)
 *   - reports/MULTI-SCANNER-REPORT-latest.md (human-readable)
 *   - reports/bugs-multi-scanner.json (deduplicated bug reports)
 */
const fs = require('fs');
const path = require('path');
const {
  generateMultiScannerId,
  computeA11yPatternFingerprint,
  computeA11yOccurrenceFingerprint,
} = require('../../../tools/a11y-fingerprints');

const CRAWL_DIR = path.resolve(__dirname, '../../../reports/.tmp-crawl');
const REPORTS_DIR = path.resolve(__dirname, '../../../reports');
const PREFIX = 'MS';
const MOBILE_BREAKPOINT = 768;

// ── WCAG mapping for all rule types ──────────────────────────────────────────

const WCAG_MAP = {
  // Virtual SR rules
  'empty-link':      { sc: '4.1.2', name: 'Name, Role, Value', level: 'A' },
  'empty-button':    { sc: '4.1.2', name: 'Name, Role, Value', level: 'A' },
  'image-no-alt':    { sc: '1.1.1', name: 'Non-text Content', level: 'A' },
  'heading-skip':    { sc: '1.3.1', name: 'Info and Relationships', level: 'A' },
  'missing-main':    { sc: '1.3.1', name: 'Info and Relationships', level: 'A' },
  'missing-nav':     { sc: '1.3.1', name: 'Info and Relationships', level: 'A' },
  'input-no-label':  { sc: '1.3.1', name: 'Info and Relationships', level: 'A' },
  // axe-core rules
  'color-contrast':  { sc: '1.4.3', name: 'Contrast (Minimum)', level: 'AA' },
  'link-name':       { sc: '4.1.2', name: 'Name, Role, Value', level: 'A' },
  'button-name':     { sc: '4.1.2', name: 'Name, Role, Value', level: 'A' },
  'image-alt':       { sc: '1.1.1', name: 'Non-text Content', level: 'A' },
  'label':           { sc: '1.3.1', name: 'Info and Relationships', level: 'A' },
  'region':          { sc: '1.3.1', name: 'Info and Relationships', level: 'A' },
  'heading-order':   { sc: '1.3.1', name: 'Info and Relationships', level: 'A' },
  'aria-allowed-attr': { sc: '4.1.2', name: 'Name, Role, Value', level: 'A' },
  'aria-required-attr': { sc: '4.1.2', name: 'Name, Role, Value', level: 'A' },
  'aria-valid-attr':  { sc: '4.1.2', name: 'Name, Role, Value', level: 'A' },
  'aria-valid-attr-value': { sc: '4.1.2', name: 'Name, Role, Value', level: 'A' },
  'aria-roles':       { sc: '4.1.2', name: 'Name, Role, Value', level: 'A' },
  'html-has-lang':    { sc: '3.1.1', name: 'Language of Page', level: 'A' },
  'html-lang-valid':  { sc: '3.1.1', name: 'Language of Page', level: 'A' },
  'document-title':   { sc: '2.4.2', name: 'Page Titled', level: 'A' },
  'bypass':           { sc: '2.4.1', name: 'Bypass Blocks', level: 'A' },
  'scrollable-region-focusable': { sc: '2.1.1', name: 'Keyboard', level: 'A' },
  'target-size':      { sc: '2.5.8', name: 'Target Size (Minimum)', level: 'AA' },
  'meta-viewport':    { sc: '1.4.4', name: 'Resize Text', level: 'AA' },
};

// IBM Equal Access rule IDs → WCAG mapping
const IBM_EA_WCAG_MAP = {
  'WCAG20_Input_HasLabel':      { sc: '1.3.1', name: 'Info and Relationships', level: 'A' },
  'WCAG20_A_HasText':           { sc: '4.1.2', name: 'Name, Role, Value', level: 'A' },
  'WCAG20_Body_HasBanner':      { sc: '1.3.1', name: 'Info and Relationships', level: 'A' },
  'WCAG20_Body_HasMain':        { sc: '1.3.1', name: 'Info and Relationships', level: 'A' },
  'RPT_Html_Semantics':         { sc: '1.3.1', name: 'Info and Relationships', level: 'A' },
  'WCAG21_Label_ErrorMsg':      { sc: '1.3.1', name: 'Info and Relationships', level: 'A' },
  'WCAG20_Img_HasAlt':          { sc: '1.1.1', name: 'Non-text Content', level: 'A' },
  'WCAG20_Html_HasLang':        { sc: '3.1.1', name: 'Language of Page', level: 'A' },
  'WCAG20_Doc_HasTitle':        { sc: '2.4.2', name: 'Page Titled', level: 'A' },
  'WCAG20_Fieldset_HasLegend':  { sc: '1.3.1', name: 'Info and Relationships', level: 'A' },
  'Rpt_Aria_ValidRole':         { sc: '4.1.2', name: 'Name, Role, Value', level: 'A' },
  'Rpt_Aria_ValidProperty':     { sc: '4.1.2', name: 'Name, Role, Value', level: 'A' },
  'Rpt_Aria_RequiredProperties': { sc: '4.1.2', name: 'Name, Role, Value', level: 'A' },
  'Rpt_Aria_EmptyPropertyValue': { sc: '4.1.2', name: 'Name, Role, Value', level: 'A' },
  'meta_refresh':               { sc: '2.2.1', name: 'Timing Adjustable', level: 'A' },
  'video_alt_broken':           { sc: '1.2.1', name: 'Audio-only and Video-only', level: 'A' },
};

function lookupWcag(ruleId) {
  return WCAG_MAP[ruleId] || IBM_EA_WCAG_MAP[ruleId] || { sc: 'unknown', name: 'Unknown', level: 'A' };
}

const SEVERITY_MAP = {
  critical: 'critical',
  serious: 'high',
  moderate: 'medium',
  minor: 'low',
  violation: 'high',
  potentialviolation: 'medium',
  recommendation: 'low',
};

// ── ID generation ────────────────────────────────────────────────────────────

function detectScreenType(viewport) {
  return viewport && viewport.width < MOBILE_BREAKPOINT ? 'mobile' : 'desktop';
}

function generateId(inputs, prefix) {
  // Retained as a thin call-through so existing call sites in this file
  // don't need to change; generation itself now lives in
  // tools/a11y-fingerprints.js (shared with core/tests/playwright/scripts/analyze-patterns.js).
  return generateMultiScannerId(inputs);
}

/**
 * Computes the MS- instance/pattern IDs (unchanged) plus the dual-written
 * a11y/pattern/v1 / a11y/occurrence/v1 fingerprints for one finding.
 *
 * toolNamespace identifies which scanner produced this finding (e.g.
 * "axe-core", "ibm-equal-access", "guidepup-virtual-sr", or "multi-scanner"
 * for a cross-tool confirmed/investigate finding) and becomes
 * a11y/pattern/v1's rule.namespace.
 *
 * MS-'s own pattern identity includes screenType (unlike DRU-, which
 * excludes it — see tools/a11y-fingerprints.js). The dual-write preserves
 * that same identity boundary by passing screenType as state_key, an
 * explicit, named part of the pattern contract, rather than folding it into
 * the locator value.
 */
function computeIds(pagePath, selector, ruleId, screenType, toolNamespace) {
  const instanceId = generateId(`${pagePath}|${selector}|${ruleId}|${screenType}`, PREFIX);
  const patternId = generateId(`${selector}|${ruleId}|${screenType}`, PREFIX);
  const a11yPattern = computeA11yPatternFingerprint(
    selector,
    toolNamespace,
    ruleId,
    `drupal-core/screen-type/${screenType}`,
  );
  const a11yOccurrence = computeA11yOccurrenceFingerprint(a11yPattern.fingerprint, pagePath, null);
  return {
    instanceId,
    patternId,
    a11yPatternFingerprint: a11yPattern.fingerprint,
    a11yPatternDisplayId: a11yPattern.displayId,
    a11yOccurrenceFingerprint: a11yOccurrence.fingerprint,
    a11yOccurrenceDisplayId: a11yOccurrence.displayId,
  };
}

// ── Load shards ──────────────────────────────────────────────────────────────

// Support both old virtual-sr-*.json and new multi-scanner-*.json
const files = fs.readdirSync(CRAWL_DIR)
  .filter(f => (f.startsWith('multi-scanner-') || f.startsWith('virtual-sr-')) && f.endsWith('.json'))
  .sort();

if (files.length === 0) {
  console.log('No shards found in', CRAWL_DIR);
  process.exit(0);
}

const allRecords = [];
for (const file of files) {
  const data = JSON.parse(fs.readFileSync(path.join(CRAWL_DIR, file), 'utf8'));
  allRecords.push(...data);
  console.log(`  ${file}: ${data.length} records`);
}

// ── Build deduplicated bug reports ───────────────────────────────────────────

const bugs = new Map(); // key → bug object

function addBug(bug) {
  const key = `${bug.rule_id}|${bug.xpath}|${bug.screen_type}|${bug.color_mode}`;
  if (bugs.has(key)) {
    const existing = bugs.get(key);
    existing.frequency.instances_on_page += 1;
    if (!existing.affected_pages.includes(bug.page)) {
      existing.affected_pages.push(bug.page);
      existing.frequency.pages_affected = existing.affected_pages.length;
    }
    if (!existing.affected_themes.includes(bug.theme)) {
      existing.affected_themes.push(bug.theme);
    }
    existing.urls.push(bug.url);
  } else {
    bugs.set(key, bug);
  }
}

for (const record of allRecords) {
  const screenType = detectScreenType(record.viewport);
  const pagePath = record.path;
  const baseUrl = process.env.DRUPAL_BASE_URL || 'https://drupal-core.ddev.site';
  const crossRef = record.crossRef || {};

  // Confirmed findings (2+ tools agree)
  for (const f of (crossRef.confirmed ?? [])) {
    const wcag = lookupWcag(f.rule);
    const tools = (f.tools || ['unknown']).join(' + ');
    const selector = `[data-confirmed="${f.rule}"]`;
    const ids = computeIds(pagePath, selector, f.rule, screenType, 'multi-scanner-confirmed');

    addBug({
      instance_id: ids.instanceId,
      pattern_id: ids.patternId,
      a11y_pattern_fingerprint: ids.a11yPatternFingerprint,
      a11y_pattern_display_id: ids.a11yPatternDisplayId,
      a11y_occurrence_fingerprint: ids.a11yOccurrenceFingerprint,
      a11y_occurrence_display_id: ids.a11yOccurrenceDisplayId,
      rule_id: f.rule,
      tool: tools,
      wcag_sc: wcag.sc,
      wcag_level: wcag.level,
      wcag_name: wcag.name,
      severity: 'high',
      confidence: f.confidence || 'confirmed',
      summary: `[CONFIRMED by ${tools}] ${f.rule} — ${f.description} (WCAG ${wcag.sc})`,
      description: `${f.description}. Confirmed by: ${tools}.`,
      impact: ['blind', 'low-vision', 'motor'],
      screen_type: screenType,
      color_mode: record.colorScheme,
      url: `${baseUrl}${record.path}`,
      xpath: `//${f.rule}`,
      xpath_full: `//body`,
      html_snippet: `<!-- ${f.rule}: confirmed by ${tools} -->`,
      theme: record.theme,
      page: record.page,
      page_path: record.path,
      viewport: `${record.viewport.width}x${record.viewport.height}`,
      frequency: { instances_on_page: 1, pages_affected: 1, total_pages_scanned: allRecords.length },
      affected_themes: [record.theme],
      affected_pages: [record.page],
      urls: [`${baseUrl}${record.path}`],
      environment: {
        browser: 'Chromium (Playwright)',
        os: process.platform,
        screen_reader: 'Guidepup Virtual SR (simulated)',
        tool_version: tools,
      },
      steps_to_reproduce: [
        `Navigate to ${baseUrl}${record.path}`,
        `Run accessibility scan (${tools})`,
        `Observe: ${f.description}`,
      ],
    });
  }

  // Investigate findings (1 tool flags it)
  for (const f of (crossRef.investigate ?? [])) {
    const wcag = lookupWcag(f.rule);
    const tools = (f.tools || ['unknown']).join(' + ');
    const selector = `[data-investigate="${f.rule}"]`;
    const ids = computeIds(pagePath, selector, f.rule, screenType, 'multi-scanner-investigate');

    addBug({
      instance_id: ids.instanceId,
      pattern_id: ids.patternId,
      a11y_pattern_fingerprint: ids.a11yPatternFingerprint,
      a11y_pattern_display_id: ids.a11yPatternDisplayId,
      a11y_occurrence_fingerprint: ids.a11yOccurrenceFingerprint,
      a11y_occurrence_display_id: ids.a11yOccurrenceDisplayId,
      rule_id: f.rule,
      tool: tools,
      wcag_sc: wcag.sc,
      wcag_level: wcag.level,
      wcag_name: wcag.name,
      severity: 'medium',
      confidence: 'investigate',
      summary: `[INVESTIGATE] ${f.rule} — ${f.description} (WCAG ${wcag.sc})`,
      description: `${f.description}. Detected by: ${tools}. Manual review recommended.`,
      impact: ['blind', 'low-vision'],
      screen_type: screenType,
      color_mode: record.colorScheme,
      url: `${baseUrl}${record.path}`,
      xpath: `//${f.rule}`,
      xpath_full: `//body`,
      html_snippet: `<!-- ${f.rule}: detected by ${tools} -->`,
      theme: record.theme,
      page: record.page,
      page_path: record.path,
      viewport: `${record.viewport.width}x${record.viewport.height}`,
      frequency: { instances_on_page: 1, pages_affected: 1, total_pages_scanned: allRecords.length },
      affected_themes: [record.theme],
      affected_pages: [record.page],
      urls: [`${baseUrl}${record.path}`],
      environment: {
        browser: 'Chromium (Playwright)',
        os: process.platform,
        screen_reader: 'Guidepup Virtual SR (simulated)',
        tool_version: tools,
      },
      steps_to_reproduce: [
        `Navigate to ${baseUrl}${record.path}`,
        `Run accessibility scan (${tools})`,
        `Observe: ${f.description}`,
      ],
    });
  }

  // Axe-only findings
  for (const f of (crossRef.axeOnly ?? [])) {
    const wcag = lookupWcag(f.rule);
    const selector = `[data-axe-rule="${f.rule}"]`;
    const ids = computeIds(pagePath, selector, f.rule, screenType, 'axe-core');

    addBug({
      instance_id: ids.instanceId,
      pattern_id: ids.patternId,
      a11y_pattern_fingerprint: ids.a11yPatternFingerprint,
      a11y_pattern_display_id: ids.a11yPatternDisplayId,
      a11y_occurrence_fingerprint: ids.a11yOccurrenceFingerprint,
      a11y_occurrence_display_id: ids.a11yOccurrenceDisplayId,
      rule_id: f.rule,
      tool: 'axe-core',
      wcag_sc: wcag.sc,
      wcag_level: wcag.level,
      wcag_name: wcag.name,
      severity: SEVERITY_MAP[f.severity] || 'medium',
      confidence: 'axe-only',
      summary: `[AXE-ONLY] ${f.rule} — ${f.description} (WCAG ${wcag.sc})`,
      description: `${f.description}. Detected by axe-core only — may be visual/structural.`,
      impact: ['low-vision', 'motor'],
      screen_type: screenType,
      color_mode: record.colorScheme,
      url: `${baseUrl}${record.path}`,
      xpath: `//${f.rule}`,
      xpath_full: `//body`,
      html_snippet: `<!-- ${f.rule}: axe-core only -->`,
      theme: record.theme,
      page: record.page,
      page_path: record.path,
      viewport: `${record.viewport.width}x${record.viewport.height}`,
      frequency: { instances_on_page: 1, pages_affected: 1, total_pages_scanned: allRecords.length },
      affected_themes: [record.theme],
      affected_pages: [record.page],
      urls: [`${baseUrl}${record.path}`],
      environment: {
        browser: 'Chromium (Playwright)',
        os: process.platform,
        tool_version: 'axe-core',
      },
      steps_to_reproduce: [
        `Navigate to ${baseUrl}${record.path}`,
        'Run axe-core WCAG 2.2 audit',
        `Observe: ${f.description}`,
      ],
    });
  }

  // IBM EA-only findings
  for (const f of (crossRef.ibmEAOnly ?? [])) {
    const wcag = lookupWcag(f.rule);
    const selector = `[data-ibmea-rule="${f.rule}"]`;
    const ids = computeIds(pagePath, selector, f.rule, screenType, 'ibm-equal-access');

    addBug({
      instance_id: ids.instanceId,
      pattern_id: ids.patternId,
      a11y_pattern_fingerprint: ids.a11yPatternFingerprint,
      a11y_pattern_display_id: ids.a11yPatternDisplayId,
      a11y_occurrence_fingerprint: ids.a11yOccurrenceFingerprint,
      a11y_occurrence_display_id: ids.a11yOccurrenceDisplayId,
      rule_id: f.rule,
      tool: 'IBM Equal Access',
      wcag_sc: wcag.sc,
      wcag_level: wcag.level,
      wcag_name: wcag.name,
      severity: 'medium',
      confidence: 'ibmea-only',
      summary: `[IBM-EA-ONLY] ${f.rule} — ${f.description} (WCAG ${wcag.sc})`,
      description: `${f.description}. Detected by IBM Equal Access only.`,
      impact: ['blind', 'low-vision'],
      screen_type: screenType,
      color_mode: record.colorScheme,
      url: `${baseUrl}${record.path}`,
      xpath: `//${f.rule}`,
      xpath_full: `//body`,
      html_snippet: `<!-- ${f.rule}: IBM EA only -->`,
      theme: record.theme,
      page: record.page,
      page_path: record.path,
      viewport: `${record.viewport.width}x${record.viewport.height}`,
      frequency: { instances_on_page: 1, pages_affected: 1, total_pages_scanned: allRecords.length },
      affected_themes: [record.theme],
      affected_pages: [record.page],
      urls: [`${baseUrl}${record.path}`],
      environment: {
        browser: 'Chromium (Playwright)',
        os: process.platform,
        tool_version: 'IBM Equal Access (accessibility-checker)',
      },
      steps_to_reproduce: [
        `Navigate to ${baseUrl}${record.path}`,
        'Run IBM Equal Access scan',
        `Observe: ${f.description}`,
      ],
    });
  }

  // Virtual SR-only findings
  for (const f of (crossRef.virtualSROnly ?? [])) {
    const wcag = lookupWcag(f.rule);
    const selector = `[data-vsr-rule="${f.rule}"]`;
    const ids = computeIds(pagePath, selector, f.rule, screenType, 'guidepup-virtual-sr');

    addBug({
      instance_id: ids.instanceId,
      pattern_id: ids.patternId,
      a11y_pattern_fingerprint: ids.a11yPatternFingerprint,
      a11y_pattern_display_id: ids.a11yPatternDisplayId,
      a11y_occurrence_fingerprint: ids.a11yOccurrenceFingerprint,
      a11y_occurrence_display_id: ids.a11yOccurrenceDisplayId,
      rule_id: f.rule,
      tool: 'Guidepup Virtual Screen Reader',
      wcag_sc: wcag.sc,
      wcag_level: wcag.level,
      wcag_name: wcag.name,
      severity: SEVERITY_MAP[f.severity] || f.severity,
      confidence: 'sr-only',
      summary: `[SR-ONLY] ${f.rule} — ${f.description} (WCAG ${wcag.sc})`,
      description: `${f.description}. Detected by virtual screen reader only — semantic/accessibility tree issue.`,
      impact: ['blind', 'low-vision'],
      screen_type: screenType,
      color_mode: record.colorScheme,
      url: `${baseUrl}${record.path}`,
      xpath: `//${f.rule}`,
      xpath_full: `//body`,
      html_snippet: `<!-- ${f.rule}: virtual SR only -->`,
      theme: record.theme,
      page: record.page,
      page_path: record.path,
      viewport: `${record.viewport.width}x${record.viewport.height}`,
      frequency: { instances_on_page: 1, pages_affected: 1, total_pages_scanned: allRecords.length },
      affected_themes: [record.theme],
      affected_pages: [record.page],
      urls: [`${baseUrl}${record.path}`],
      environment: {
        browser: 'Chromium (Playwright)',
        os: process.platform,
        screen_reader: 'Guidepup Virtual SR (simulated)',
        tool_version: '@guidepup/virtual-screen-reader',
      },
      steps_to_reproduce: [
        `Navigate to ${baseUrl}${record.path}`,
        'Run virtual screen reader audit',
        `Observe: ${f.description}`,
      ],
    });
  }
}

const bugArray = [...bugs.values()];

console.log(`\nDeduplicated to ${bugArray.length} unique bugs`);

// ── Write bugs JSON ──────────────────────────────────────────────────────────

fs.mkdirSync(REPORTS_DIR, { recursive: true });
const date = new Date().toISOString().split('T')[0];

const bugsReport = {
  timestamp: new Date().toISOString(),
  tools: ['axe-core', 'IBM Equal Access', 'Guidepup Virtual Screen Reader'],
  summary: {
    total_records: allRecords.length,
    total_unique_bugs: bugArray.length,
    themes: [...new Set(allRecords.map(r => r.theme))],
    confirmed_bugs: bugArray.filter(b => b.confidence === 'confirmed').length,
    investigate_bugs: bugArray.filter(b => b.confidence === 'investigate').length,
    axe_only_bugs: bugArray.filter(b => b.confidence === 'axe-only').length,
    ibmea_only_bugs: bugArray.filter(b => b.confidence === 'ibmea-only').length,
    sr_only_bugs: bugArray.filter(b => b.confidence === 'sr-only').length,
  },
  bugs: bugArray,
};

fs.writeFileSync(path.join(REPORTS_DIR, 'bugs-multi-scanner.json'), JSON.stringify(bugsReport, null, 2));
fs.writeFileSync(path.join(REPORTS_DIR, `bugs-multi-scanner-${date}.json`), JSON.stringify(bugsReport, null, 2));
console.log(`Wrote reports/bugs-multi-scanner.json`);

// ── Write full results JSON ──────────────────────────────────────────────────

const fullReport = {
  timestamp: new Date().toISOString(),
  tools: ['axe-core', 'IBM Equal Access', 'Guidepup Virtual Screen Reader'],
  summary: {
    totalRecords: allRecords.length,
    themes: [...new Set(allRecords.map(r => r.theme))],
    confirmedBarriers: allRecords.reduce((s, r) => s + (r.crossRef?.confirmed?.length ?? 0), 0),
    investigateFindings: allRecords.reduce((s, r) => s + (r.crossRef?.investigate?.length ?? 0), 0),
    axeOnlyFindings: allRecords.reduce((s, r) => s + (r.crossRef?.axeOnly?.length ?? 0), 0),
    ibmEAOnlyFindings: allRecords.reduce((s, r) => s + (r.crossRef?.ibmEAOnly?.length ?? 0), 0),
    virtualSROnlyFindings: allRecords.reduce((s, r) => s + (r.crossRef?.virtualSROnly?.length ?? 0), 0),
  },
  records: allRecords,
};

fs.writeFileSync(path.join(REPORTS_DIR, 'multi-scanner-results.json'), JSON.stringify(fullReport, null, 2));
fs.writeFileSync(path.join(REPORTS_DIR, `multi-scanner-results-${date}.json`), JSON.stringify(fullReport, null, 2));

// ── Markdown report ──────────────────────────────────────────────────────────

const lines = [];
lines.push('# Multi-Scanner Accessibility Report');
lines.push('');
lines.push(`**Date:** ${date}`);
lines.push(`**Tools:** axe-core + IBM Equal Access + Guidepup Virtual Screen Reader`);
lines.push(`**Pages scanned:** ${allRecords.length}`);
lines.push(`**Themes:** ${bugsReport.summary.themes.join(', ')}`);
lines.push(`**Unique bugs:** ${bugArray.length}`);
lines.push('');
lines.push('## Summary');
lines.push('');
lines.push('| Category | Count |');
lines.push('| :--- | ---: |');
lines.push(`| Confirmed barriers (2+ tools) | ${bugsReport.summary.confirmed_bugs} |`);
lines.push(`| Investigate (1 tool) | ${bugsReport.summary.investigate_bugs} |`);
lines.push(`| Axe-only findings | ${bugsReport.summary.axe_only_bugs} |`);
lines.push(`| IBM EA-only findings | ${bugsReport.summary.ibmea_only_bugs} |`);
lines.push(`| Virtual SR-only findings | ${bugsReport.summary.sr_only_bugs} |`);
lines.push('');

// Confidence legend
lines.push('## Confidence Levels');
lines.push('');
lines.push('| Level | Meaning | Action |');
lines.push('| :--- | :--- | :--- |');
lines.push('| **CONFIRMED** | 2+ independent tools flag the same issue | Fix — high confidence real barrier |');
lines.push('| **INVESTIGATE** | Only 1 tool flags it | Manual review recommended |');
lines.push('| **AXE-ONLY** | Only axe-core detects it | Likely visual/CSS/structural issue |');
lines.push('| **IBM-EA-ONLY** | Only IBM EA detects it | IBM-specific WCAG rule check |');
lines.push('| **SR-ONLY** | Only virtual SR detects it | Semantic/accessibility tree issue |');
lines.push('');

// Bug reports
if (bugArray.length > 0) {
  lines.push('## Bug Reports');
  lines.push('');
  lines.push('Each bug follows the [Accessibility Bug Reporting Best Practices](https://mgifford.github.io/ACCESSIBILITY.md/examples/ACCESSIBILITY_BUG_REPORTING_BEST_PRACTICES.html).');
  lines.push('');

  // Sort: confirmed first, then investigate, then by severity
  const sortOrder = { confirmed: 0, investigate: 1, 'axe-only': 2, 'ibmea-only': 3, 'sr-only': 4 };
  bugArray.sort((a, b) => (sortOrder[a.confidence] ?? 5) - (sortOrder[b.confidence] ?? 5));

  for (const bug of bugArray) {
    const badge = bug.confidence === 'confirmed' ? '🔴' :
                  bug.confidence === 'investigate' ? '🟡' :
                  bug.confidence === 'axe-only' ? '🔵' :
                  bug.confidence === 'ibmea-only' ? '🟣' : '⚪';

    lines.push(`### ${badge} ${bug.summary}`);
    lines.push('');
    lines.push(`| Field | Value |`);
    lines.push(`| :--- | :--- |`);
    lines.push(`| **Bug ID** | \`${bug.instance_id}\` (instance) / \`${bug.pattern_id}\` (pattern) |`);
    lines.push(`| **Confidence** | ${bug.confidence} |`);
    lines.push(`| **URL** | ${bug.url} |`);
    lines.push(`| **XPath** | \`${bug.xpath}\` |`);
    lines.push(`| **WCAG SC** | ${bug.wcag_sc} — ${bug.wcag_name} (Level ${bug.wcag_level}) |`);
    lines.push(`| **Rule** | ${bug.rule_id} — ${bug.tool} |`);
    lines.push(`| **Severity** | ${bug.severity} |`);
    lines.push(`| **Frequency** | ${bug.frequency.instances_on_page} instance(s) on ${bug.frequency.pages_affected} page(s) |`);
    lines.push(`| **Screen type** | ${bug.screen_type} |`);
    lines.push(`| **Colour mode** | ${bug.color_mode} |`);
    lines.push(`| **Themes** | ${bug.affected_themes.join(', ')} |`);
    lines.push('');
    lines.push('**Description:**');
    lines.push(bug.description);
    lines.push('');
    if (bug.steps_to_reproduce?.length) {
      lines.push('**Steps to Reproduce:**');
      bug.steps_to_reproduce.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
      lines.push('');
    }
    lines.push('**Testing Environment:**');
    lines.push('');
    lines.push('| Item | Value |');
    lines.push('| :--- | :--- |');
    lines.push(`| Browser | ${bug.environment.browser} |`);
    lines.push(`| OS | ${bug.environment.os} |`);
    lines.push(`| Screen reader | ${bug.environment.screen_reader || 'N/A'} |`);
    lines.push(`| Tool | ${bug.environment.tool_version} |`);
    lines.push('');
    lines.push('---');
    lines.push('');
  }
}

// Per-theme breakdown
lines.push('## Per-Theme Breakdown');
lines.push('');
for (const theme of bugsReport.summary.themes) {
  const themeBugs = bugArray.filter(b => b.affected_themes.includes(theme));
  const themeRecords = allRecords.filter(r => r.theme === theme);
  lines.push(`### ${theme}`);
  lines.push('');
  lines.push(`- **Records:** ${themeRecords.length}`);
  lines.push(`- **Unique bugs:** ${themeBugs.length}`);
  lines.push(`- **Confirmed:** ${themeBugs.filter(b => b.confidence === 'confirmed').length}`);
  lines.push(`- **Investigate:** ${themeBugs.filter(b => b.confidence === 'investigate').length}`);
  lines.push('');
}

// Reference
lines.push('---');
lines.push('');
lines.push('## Cross-Reference Legend');
lines.push('');
lines.push('| Scenario | Meaning | Action |');
lines.push('| :--- | :--- | :--- |');
lines.push('| 2+ tools flag | Confirmed barrier | Fix it |');
lines.push('| 1 tool flags | Investigate | Manual review |');
lines.push('| Axe only | Visual/structural issue | CSS or HTML fix |');
lines.push('| IBM EA only | IBM WCAG rule | Check IBM rule details |');
lines.push('| Virtual SR only | Semantic issue | Accessibility tree fix |');
lines.push('| Neither flag | Likely OK | No action needed |');
lines.push('');

fs.writeFileSync(path.join(REPORTS_DIR, `MULTI-SCANNER-REPORT-${date}.md`), lines.join('\n'));
fs.writeFileSync(path.join(REPORTS_DIR, 'MULTI-SCANNER-REPORT-latest.md'), lines.join('\n'));

console.log(`Wrote reports/MULTI-SCANNER-REPORT-${date}.md`);
console.log(`Wrote reports/MULTI-SCANNER-REPORT-latest.md`);
