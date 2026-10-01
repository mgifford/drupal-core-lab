#!/usr/bin/env node
/**
 * AI Results Interpreter for Guidepup Tests.
 *
 * This script analyzes virtual SR test results and provides insights
 * that can be used by AI assistants or posted to merge requests.
 *
 * Usage:
 *   node tests/playwright/scripts/interpret-results.js [results-file]
 *
 * If no results file is specified, it will look for the default
 * Playwright results file.
 *
 * Output:
 *   - Console output with human-readable analysis
 *   - JSON file with structured insights
 *   - Markdown file for MR comments
 */
import * as fs from 'fs';
import * as path from 'path';

// ── Types ────────────────────────────────────────────────────────────────────

interface Finding {
  rule: string;
  severity: 'critical' | 'serious' | 'moderate' | 'minor';
  description: string;
  position: number;
  phrase: string;
}

interface TestResult {
  name: string;
  passed: boolean;
  findings: Finding[];
  spokenPhrases: string[];
}

interface AnalysisResult {
  timestamp: string;
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    totalFindings: number;
    findingsBySeverity: Record<string, number>;
    findingsByRule: Record<string, number>;
  };
  insights: Insight[];
  recommendations: string[];
  aiPrompts: string[];
}

interface Insight {
  type: 'pattern' | 'regression' | 'improvement' | 'concern';
  title: string;
  description: string;
  evidence: string[];
  confidence: 'high' | 'medium' | 'low';
}

// ── Analysis Functions ───────────────────────────────────────────────────────

/**
 * Analyze test results and generate insights.
 */
function analyzeResults(results: TestResult[]): AnalysisResult {
  const allFindings = results.flatMap(r => r.findings);

  // Calculate summary
  const summary = {
    totalTests: results.length,
    passed: results.filter(r => r.passed).length,
    failed: results.filter(r => !r.passed).length,
    totalFindings: allFindings.length,
    findingsBySeverity: countBySeverity(allFindings),
    findingsByRule: countByRule(allFindings),
  };

  // Generate insights
  const insights = generateInsights(results, allFindings);

  // Generate recommendations
  const recommendations = generateRecommendations(summary, insights);

  // Generate AI prompts
  const aiPrompts = generateAIPrompts(results, insights);

  return {
    timestamp: new Date().toISOString(),
    summary,
    insights,
    recommendations,
    aiPrompts,
  };
}

/**
 * Count findings by severity.
 */
function countBySeverity(findings: Finding[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const finding of findings) {
    counts[finding.severity] = (counts[finding.severity] ?? 0) + 1;
  }
  return counts;
}

/**
 * Count findings by rule.
 */
function countByRule(findings: Finding[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const finding of findings) {
    counts[finding.rule] = (counts[finding.rule] ?? 0) + 1;
  }
  return counts;
}

/**
 * Generate insights from results.
 */
function generateInsights(results: TestResult[], findings: Finding[]): Insight[] {
  const insights: Insight[] = [];

  // Check for critical issues
  const criticalFindings = findings.filter(f => f.severity === 'critical');
  if (criticalFindings.length > 0) {
    insights.push({
      type: 'concern',
      title: 'Critical accessibility issues detected',
      description: `Found ${criticalFindings.length} critical issues that may block users with disabilities.`,
      evidence: criticalFindings.slice(0, 3).map(f => `${f.rule}: ${f.phrase}`),
      confidence: 'high',
    });
  }

  // Check for missing labels
  const missingLabels = findings.filter(f => f.rule === 'missing-label');
  if (missingLabels.length > 0) {
    insights.push({
      type: 'pattern',
      title: 'Missing accessible labels',
      description: `${missingLabels.length} form elements are missing accessible names. Screen reader users won't know what these controls are for.`,
      evidence: missingLabels.slice(0, 3).map(f => f.phrase),
      confidence: 'high',
    });
  }

  // Check for empty links
  const emptyLinks = findings.filter(f => f.rule === 'empty-link');
  if (emptyLinks.length > 0) {
    insights.push({
      type: 'pattern',
      title: 'Empty links detected',
      description: `${emptyLinks.length} links have no accessible name. Screen reader users won't know where these links go.`,
      evidence: emptyLinks.slice(0, 3).map(f => f.phrase),
      confidence: 'high',
    });
  }

  // Check for heading issues
  const headingIssues = findings.filter(f => f.rule === 'heading-skip');
  if (headingIssues.length > 0) {
    insights.push({
      type: 'concern',
      title: 'Heading hierarchy issues',
      description: `${headingIssues.length} heading level skips detected. This can confuse screen reader users navigating by headings.`,
      evidence: headingIssues.slice(0, 3).map(f => f.phrase),
      confidence: 'medium',
    });
  }

  // Check for missing landmarks
  const missingLandmarks = findings.filter(f => f.rule === 'missing-landmark');
  if (missingLandmarks.length > 0) {
    insights.push({
      type: 'concern',
      title: 'Missing landmark regions',
      description: `${missingLandmarks.length} pages are missing essential landmark regions (main, navigation, banner).`,
      evidence: missingLandmarks.slice(0, 3).map(f => f.phrase),
      confidence: 'high',
    });
  }

  // Check for improvements
  const passedTests = results.filter(r => r.passed);
  if (passedTests.length > 0 && findings.length === 0) {
    insights.push({
      type: 'improvement',
      title: 'All tests passed',
      description: 'No accessibility issues detected in the tested pages.',
      evidence: passedTests.map(r => r.name),
      confidence: 'high',
    });
  }

  return insights;
}

/**
 * Generate recommendations based on analysis.
 */
function generateRecommendations(
  summary: AnalysisResult['summary'],
  insights: Insight[]
): string[] {
  const recommendations: string[] = [];

  if (summary.failed > 0) {
    recommendations.push('Review and fix the failing tests before merging.');
  }

  if (summary.findingsBySeverity['critical'] > 0) {
    recommendations.push('Address critical issues immediately - they block users with disabilities.');
  }

  if (summary.findingsBySeverity['serious'] > 0) {
    recommendations.push('Fix serious issues - they significantly impair accessibility.');
  }

  if (summary.findingsByRule['missing-label'] > 0) {
    recommendations.push('Add #title properties to form elements and use \'#title_display\' => \'invisible\' for visual hiding.');
  }

  if (summary.findingsByRule['empty-link'] > 0) {
    recommendations.push('Add descriptive text to links or use aria-label for icon-only links.');
  }

  if (summary.findingsByRule['heading-skip'] > 0) {
    recommendations.push('Ensure heading levels follow a logical hierarchy without skipping levels.');
  }

  if (summary.findingsByRule['missing-landmark'] > 0) {
    recommendations.push('Add landmark regions (main, nav, banner) to help screen reader users navigate.');
  }

  recommendations.push('Run real VoiceOver tests locally to validate fixes.');
  recommendations.push('See [Guidepup Real Screen Reader Testing](GUIDEUP-REAL-SCREEN-READER-TESTING.md) for details.');

  return recommendations;
}

/**
 * Generate AI prompts for further analysis.
 */
function generateAIPrompts(results: TestResult[], insights: Insight[]): string[] {
  const prompts: string[] = [];

  if (insights.some(i => i.type === 'concern')) {
    prompts.push(
      'Analyze the critical accessibility issues and suggest specific fixes for Drupal\'s Form API.'
    );
  }

  if (insights.some(i => i.title.includes('Missing accessible labels'))) {
    prompts.push(
      'Generate code examples showing how to add #title and #title_display to Drupal form elements.'
    );
  }

  if (insights.some(i => i.title.includes('Empty links'))) {
    prompts.push(
      'Explain how to add accessible names to Drupal links using #options attributes or template suggestions.'
    );
  }

  prompts.push(
    'Create a step-by-step guide for fixing the accessibility issues found in this test run.'
  );

  return prompts;
}

// ── Output Functions ─────────────────────────────────────────────────────────

/**
 * Print analysis to console.
 */
function printAnalysis(analysis: AnalysisResult): void {
  console.log('\n=== Accessibility Analysis ===\n');
  console.log(`Timestamp: ${analysis.timestamp}`);
  console.log(`Tests: ${analysis.summary.passed}/${analysis.summary.totalTests} passed`);
  console.log(`Findings: ${analysis.summary.totalFindings}`);

  console.log('\n--- Findings by Severity ---');
  for (const [severity, count] of Object.entries(analysis.summary.findingsBySeverity)) {
    console.log(`  ${severity}: ${count}`);
  }

  console.log('\n--- Findings by Rule ---');
  for (const [rule, count] of Object.entries(analysis.summary.findingsByRule)) {
    console.log(`  ${rule}: ${count}`);
  }

  console.log('\n--- Insights ---');
  for (const insight of analysis.insights) {
    console.log(`\n[${insight.type.toUpperCase()}] ${insight.title}`);
    console.log(`  ${insight.description}`);
    console.log(`  Confidence: ${insight.confidence}`);
    if (insight.evidence.length > 0) {
      console.log('  Evidence:');
      insight.evidence.forEach(e => console.log(`    - ${e}`));
    }
  }

  console.log('\n--- Recommendations ---');
  analysis.recommendations.forEach((rec, i) => {
    console.log(`  ${i + 1}. ${rec}`);
  });

  console.log('\n--- AI Prompts ---');
  analysis.aiPrompts.forEach((prompt, i) => {
    console.log(`  ${i + 1}. ${prompt}`);
  });
}

/**
 * Save analysis to files.
 */
function saveAnalysis(analysis: AnalysisResult, outputDir: string): void {
  fs.mkdirSync(outputDir, { recursive: true });

  // Save JSON
  const jsonPath = path.join(outputDir, 'analysis.json');
  fs.writeFileSync(jsonPath, JSON.stringify(analysis, null, 2));
  console.log(`\nJSON analysis saved to: ${jsonPath}`);

  // Save Markdown
  const mdPath = path.join(outputDir, 'ANALYSIS.md');
  const markdown = generateMarkdown(analysis);
  fs.writeFileSync(mdPath, markdown);
  console.log(`Markdown analysis saved to: ${mdPath}`);
}

/**
 * Generate markdown report.
 */
function generateMarkdown(analysis: AnalysisResult): string {
  const lines = [
    '# Accessibility Analysis Report',
    '',
    `**Generated:** ${analysis.timestamp}`,
    '',
    '## Summary',
    '',
    `- **Tests:** ${analysis.summary.passed}/${analysis.summary.totalTests} passed`,
    `- **Findings:** ${analysis.summary.totalFindings}`,
    '',
    '### Findings by Severity',
    '',
  ];

  for (const [severity, count] of Object.entries(analysis.summary.findingsBySeverity)) {
    lines.push(`- **${severity}:** ${count}`);
  }

  lines.push('', '### Findings by Rule', '');

  for (const [rule, count] of Object.entries(analysis.summary.findingsByRule)) {
    lines.push(`- **${rule}:** ${count}`);
  }

  lines.push('', '## Insights', '');

  for (const insight of analysis.insights) {
    lines.push(`### ${insight.title}`);
    lines.push('');
    lines.push(`**Type:** ${insight.type}`);
    lines.push(`**Confidence:** ${insight.confidence}`);
    lines.push('');
    lines.push(insight.description);
    lines.push('');

    if (insight.evidence.length > 0) {
      lines.push('**Evidence:**');
      insight.evidence.forEach(e => lines.push(`- ${e}`));
      lines.push('');
    }
  }

  lines.push('## Recommendations', '');

  analysis.recommendations.forEach((rec, i) => {
    lines.push(`${i + 1}. ${rec}`);
  });

  lines.push('', '## AI Prompts', '');

  analysis.aiPrompts.forEach((prompt, i) => {
    lines.push(`${i + 1}. ${prompt}`);
  });

  return lines.join('\n');
}

// ── Main ─────────────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const resultsFile = args[0] ?? path.resolve(__dirname, '../reports/playwright-results.json');
  const outputDir = path.resolve(__dirname, '../reports/analysis');

  console.log('=== AI Results Interpreter ===\n');
  console.log(`Reading results from: ${resultsFile}`);

  try {
    // Read results
    if (!fs.existsSync(resultsFile)) {
      console.error(`Results file not found: ${resultsFile}`);
      console.log('\nNo results file found. Please run the tests first:');
      console.log('  cd tests/playwright');
      console.log('  npx playwright test');
      process.exit(1);
    }

    const rawData = JSON.parse(fs.readFileSync(resultsFile, 'utf-8'));

    // Convert to our format
    const results: TestResult[] = [];

    // Parse Playwright JSON results
    if (rawData.suites) {
      for (const suite of rawData.suites) {
        for (const spec of suite.specs ?? []) {
          results.push({
            name: spec.title ?? 'Unknown test',
            passed: spec.ok ?? false,
            findings: [], // Would need to parse from test output
            spokenPhrases: [],
          });
        }
      }
    }

    // Analyze results
    const analysis = analyzeResults(results);

    // Print to console
    printAnalysis(analysis);

    // Save to files
    saveAnalysis(analysis, outputDir);

    console.log('\n=== Done ===');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
