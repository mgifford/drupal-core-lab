#!/usr/bin/env node
/**
 * Run virtual SR tests and generate a report for CI/CD.
 *
 * This script runs the virtual screen reader tests and generates
 * a report that can be posted to merge requests or stored as
 * an artifact.
 *
 * Usage:
 *   node tests/playwright/scripts/run-virtual-sr-ci.js
 *
 * Environment Variables:
 *   DRUPAL_BASE_URL - Base URL of the Drupal site
 *   CI_PIPELINE_URL - URL of the CI pipeline (optional)
 *   CI_MERGE_REQUEST_IID - MR IID (optional)
 *
 * Output:
 *   - tests/playwright/reports/virtual-sr-ci-report.json
 *   - tests/playwright/reports/virtual-sr-ci-report.md
 */
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// ── Configuration ────────────────────────────────────────────────────────────

const REPORT_DIR = path.resolve(__dirname, '../reports');
const JSON_REPORT = path.join(REPORT_DIR, 'virtual-sr-ci-report.json');
const MD_REPORT = path.join(REPORT_DIR, 'virtual-sr-ci-report.md');

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Run a command and return the output.
 */
function runCommand(command: string): string {
  try {
    return execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
  } catch (error: any) {
    console.error(`Command failed: ${command}`);
    console.error(error.stdout);
    console.error(error.stderr);
    throw error;
  }
}

/**
 * Generate a markdown report from the JSON results.
 */
function generateMarkdownReport(results: any): string {
  const lines = [
    '# Virtual Screen Reader CI Report',
    '',
    `**Generated:** ${results.timestamp}`,
    `**Pipeline:** ${results.pipelineUrl ?? 'N/A'}`,
    `**MR:** ${results.mrIid ?? 'N/A'}`,
    '',
    '## Summary',
    '',
    `- **Total Tests:** ${results.summary.totalTests}`,
    `- **Passed:** ${results.summary.passed}`,
    `- **Failed:** ${results.summary.failed}`,
    `- **Duration:** ${results.summary.duration}`,
    '',
    '## Test Results',
    '',
  ];

  for (const result of results.results) {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    lines.push(`### ${result.name}`);
    lines.push('');
    lines.push(`- **Status:** ${status}`);
    lines.push(`- **Duration:** ${result.duration}`);
    lines.push(`- **Findings:** ${result.findingsCount}`);
    lines.push('');

    if (result.findings && result.findings.length > 0) {
      lines.push('#### Findings');
      lines.push('');
      for (const finding of result.findings.slice(0, 5)) {
        lines.push(`- **${finding.severity}** (${finding.rule}): ${finding.description}`);
      }
      if (result.findings.length > 5) {
        lines.push(`- ... and ${result.findings.length - 5} more`);
      }
      lines.push('');
    }
  }

  if (results.summary.failed > 0) {
    lines.push('## Failed Tests');
    lines.push('');
    for (const result of results.results.filter((r: any) => !r.passed)) {
      lines.push(`- **${result.name}**`);
      lines.push(`  - ${result.error ?? 'No error message'}`);
    }
    lines.push('');
  }

  lines.push('## Recommendations');
  lines.push('');

  if (results.summary.failed === 0) {
    lines.push('All tests passed. No accessibility issues detected.');
  } else {
    lines.push('The following issues were detected:');
    lines.push('');
    lines.push('1. Review the failed tests for accessibility issues');
    lines.push('2. Check the spoken phrase logs for missing labels or landmarks');
    lines.push('3. Run the tests locally with real VoiceOver for validation');
    lines.push('4. See [Guidepup Real Screen Reader Testing](GUIDEUP-REAL-SCREEN-READER-TESTING.md) for more details');
  }

  return lines.join('\n');
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Virtual SR CI Test Runner ===\n');

  // Ensure report directory exists
  fs.mkdirSync(REPORT_DIR, { recursive: true });

  const startTime = Date.now();

  // Run the tests
  console.log('Running virtual SR tests...\n');
  let testOutput: string;
  let testsPassed = true;

  try {
    testOutput = runCommand(
      'npx playwright test --config=tests/playwright/playwright.config.ts ' +
      'tests/playwright/tests/a11y-virtual-sr-crawl.spec.ts ' +
      '--reporter=json'
    );
  } catch (error: any) {
    testOutput = error.stdout ?? '';
    testsPassed = false;
  }

  const duration = Date.now() - startTime;
  const durationSeconds = (duration / 1000).toFixed(1);

  // Parse test results from JSON output
  let testResults: any;
  try {
    const jsonOutputPath = path.resolve(__dirname, '../reports/playwright-results.json');
    if (fs.existsSync(jsonOutputPath)) {
      testResults = JSON.parse(fs.readFileSync(jsonOutputPath, 'utf-8'));
    }
  } catch (error) {
    console.warn('Could not parse JSON results, using basic parsing');
  }

  // Create summary
  const summary = {
    totalTests: testResults?.suites?.reduce((acc: number, suite: any) => 
      acc + (suite.specs?.length ?? 0), 0) ?? 0,
    passed: testsPassed ? 1 : 0,
    failed: testsPassed ? 0 : 1,
    duration: `${durationSeconds}s`,
  };

  // Create results object
  const results = {
    timestamp: new Date().toISOString(),
    pipelineUrl: process.env.CI_PIPELINE_URL,
    mrIid: process.env.CI_MERGE_REQUEST_IID,
    summary,
    results: [
      {
        name: 'Virtual SR Crawl',
        passed: testsPassed,
        duration: `${durationSeconds}s`,
        findingsCount: testResults?.suites?.[0]?.specs?.[0]?.ok === false ? 1 : 0,
        findings: [],
        error: testsPassed ? undefined : 'Virtual SR tests failed',
      },
    ],
  };

  // Write JSON report
  fs.writeFileSync(JSON_REPORT, JSON.stringify(results, null, 2));
  console.log(`\nJSON report written to: ${JSON_REPORT}`);

  // Write markdown report
  const markdown = generateMarkdownReport(results);
  fs.writeFileSync(MD_REPORT, markdown);
  console.log(`Markdown report written to: ${MD_REPORT}`);

  // Print summary
  console.log('\n=== Summary ===');
  console.log(`Tests: ${summary.passed}/${summary.totalTests} passed`);
  console.log(`Duration: ${durationSeconds}s`);

  if (!testsPassed) {
    console.log('\n❌ Some tests failed. Check the report for details.');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed.');
  }
}

main();
