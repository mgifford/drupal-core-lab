#!/usr/bin/env node
/**
 * Test Generator for Drupal Accessibility Issues.
 *
 * This script generates accessibility tests based on Drupal issue
 * descriptions. It can be used standalone or with AI assistants.
 *
 * Usage:
 *   node tests/playwright/scripts/generate-test.js <issue-url> [options]
 *
 * Options:
 *   --output-dir <dir>   Output directory for generated tests
 *   --template <type>    Test template type (basic, detailed, voiceover)
 *   --dry-run            Show what would be generated without writing files
 *
 * Examples:
 *   # Generate a basic test for an issue
 *   node tests/playwright/scripts/generate-test.js https://www.drupal.org/project/drupal/issues/2608212
 *
 *   # Generate a detailed test with custom output
 *   node tests/playwright/scripts/generate-test.js https://www.drupal.org/project/drupal/issues/2608212 --output-dir ./my-tests --template detailed
 *
 *   # Preview what would be generated
 *   node tests/playwright/scripts/generate-test.js https://www.drupal.org/project/drupal/issues/2608212 --dry-run
 */
import * as fs from 'fs';
import * as path from 'path';

// ── Types ────────────────────────────────────────────────────────────────────

interface IssueInfo {
  nid: string;
  title: string;
  description: string;
  affectedPages: string[];
  expectedFixes: string[];
  affectedElements: string[];
}

interface TestTemplate {
  name: string;
  description: string;
  generate: (issue: IssueInfo) => string;
}

// ── Configuration ────────────────────────────────────────────────────────────

const OUTPUT_DIR = path.resolve(__dirname, '../tests');
const TEMPLATES: Record<string, TestTemplate> = {
  basic: {
    name: 'basic',
    description: 'Basic accessibility test with virtual SR',
    generate: generateBasicTest,
  },
  detailed: {
    name: 'detailed',
    description: 'Detailed test with findings analysis',
    generate: generateDetailedTest,
  },
  voiceover: {
    name: 'voiceover',
    description: 'Real VoiceOver test (requires macOS)',
    generate: generateVoiceOverTest,
  },
};

// ── Issue Detection ──────────────────────────────────────────────────────────

/**
 * Extract issue NID from URL.
 */
function extractNid(url: string): string {
  const match = url.match(/\/issues\/(\d+)/);
  if (!match) {
    throw new Error(`Invalid issue URL: ${url}`);
  }
  return match[1];
}

/**
 * Detect affected pages based on issue content.
 */
function detectAffectedPages(issue: IssueInfo): string[] {
  const pages: string[] = [];
  const title = issue.title.toLowerCase();
  const description = issue.description.toLowerCase();

  // Common patterns
  if (title.includes('views') || description.includes('views')) {
    pages.push('/admin/structure/views');
    pages.push('/admin/structure/views/view/content');
  }

  if (title.includes('filter') || description.includes('filter')) {
    pages.push('/admin/structure/views/view/content');
  }

  if (title.includes('form') || description.includes('form')) {
    pages.push('/admin/content');
  }

  if (title.includes('admin') || description.includes('admin')) {
    pages.push('/admin/content');
    pages.push('/admin/structure');
  }

  if (title.includes('menu') || description.includes('menu')) {
    pages.push('/admin/structure/menu');
  }

  if (title.includes('node') || description.includes('node')) {
    pages.push('/node/add/article');
  }

  // Default to common admin pages
  if (pages.length === 0) {
    pages.push('/admin/content');
  }

  return [...new Set(pages)];
}

/**
 * Detect expected fixes based on issue content.
 */
function detectExpectedFixes(issue: IssueInfo): string[] {
  const fixes: string[] = [];
  const title = issue.title.toLowerCase();
  const description = issue.description.toLowerCase();

  if (title.includes('label') || description.includes('label')) {
    fixes.push('missing-label');
  }

  if (title.includes('accessible name') || description.includes('accessible name')) {
    fixes.push('missing-label');
    fixes.push('empty-link');
  }

  if (title.includes('heading') || description.includes('heading')) {
    fixes.push('heading-skip');
  }

  if (title.includes('landmark') || description.includes('landmark')) {
    fixes.push('missing-landmark');
  }

  if (title.includes('link') || description.includes('link')) {
    fixes.push('empty-link');
  }

  if (title.includes('button') || description.includes('button')) {
    fixes.push('empty-button');
  }

  if (title.includes('image') || description.includes('image')) {
    fixes.push('missing-alt');
  }

  // Default to common fixes
  if (fixes.length === 0) {
    fixes.push('missing-label');
  }

  return [...new Set(fixes)];
}

/**
 * Detect affected elements based on issue content.
 */
function detectAffectedElements(issue: IssueInfo): string[] {
  const elements: string[] = [];
  const title = issue.title.toLowerCase();
  const description = issue.description.toLowerCase();

  if (title.includes('input') || description.includes('input')) {
    elements.push('input');
  }

  if (title.includes('select') || description.includes('select')) {
    elements.push('select');
  }

  if (title.includes('checkbox') || description.includes('checkbox')) {
    elements.push('checkbox');
  }

  if (title.includes('radio') || description.includes('radio')) {
    elements.push('radio');
  }

  if (title.includes('button') || description.includes('button')) {
    elements.push('button');
  }

  if (title.includes('link') || description.includes('link')) {
    elements.push('a');
  }

  if (title.includes('textarea') || description.includes('textarea')) {
    elements.push('textarea');
  }

  return [...new Set(elements)];
}

// ── Test Templates ───────────────────────────────────────────────────────────

/**
 * Generate a basic test.
 */
function generateBasicTest(issue: IssueInfo): string {
  const pagesList = issue.affectedPages.map(p => `  '${p}'`).join(',\n');
  const fixesList = issue.expectedFixes.map(f => `  '${f}'`).join(',\n');

  return `/**
 * Auto-generated test for Drupal issue #${issue.nid}.
 *
 * Issue: ${issue.title}
 * URL: https://www.drupal.org/project/drupal/issues/${issue.nid}
 *
 * Generated by: generate-test.js
 * Date: ${new Date().toISOString()}
 */
import { test, expect } from '@playwright/test';
import { AUTH_STATE_FILE } from '../lib/auth-setup';
import { injectVirtualSR, getSpokenPhraseLog, analyzeVirtualSR } from '../lib/virtual-sr';

const AFFECTED_PAGES = [
${pagesList}
];

const EXPECTED_FIXES = [
${fixesList}
];

test.describe('Issue #${issue.nid} - ${issue.title}', () => {
  test.use({ storageState: AUTH_STATE_FILE });

  for (const pagePath of AFFECTED_PAGES) {
    test(\`validates accessibility on \${pagePath}\`, async ({ page }) => {
      await page.goto(pagePath, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('main', { timeout: 10000 });

      await injectVirtualSR(page);
      await page.waitForTimeout(1500);
      const log = await getSpokenPhraseLog(page);
      const findings = analyzeVirtualSR(log);

      const issues = findings.filter(f => EXPECTED_FIXES.includes(f.rule));

      console.log(\`\\n[Issue #${issue.nid}] page=\${pagePath}\`);
      console.log(\`[Issue #${issue.nid}] findings=\${issues.length}\`);

      expect(issues).toEqual([]);
    });
  }
});
`;
}

/**
 * Generate a detailed test.
 */
function generateDetailedTest(issue: IssueInfo): string {
  const pagesList = issue.affectedPages.map(p => `  '${p}'`).join(',\n');
  const fixesList = issue.expectedFixes.map(f => `  '${f}'`).join(',\n');
  const elementsList = issue.affectedElements.map(e => `  '${e}'`).join(',\n');

  return `/**
 * Auto-generated detailed test for Drupal issue #${issue.nid}.
 *
 * Issue: ${issue.title}
 * URL: https://www.drupal.org/project/drupal/issues/${issue.nid}
 *
 * This test provides detailed analysis of accessibility issues
 * including spoken phrase logs and findings.
 *
 * Generated by: generate-test.js
 * Date: ${new Date().toISOString()}
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { AUTH_STATE_FILE } from '../lib/auth-setup';
import { injectVirtualSR, getSpokenPhraseLog, analyzeVirtualSR, VirtualSRFinding } from '../lib/virtual-sr';

const AFFECTED_PAGES = [
${pagesList}
];

const EXPECTED_FIXES = [
${fixesList}
];

const AFFECTED_ELEMENTS = [
${elementsList}
];

const REPORT_DIR = path.resolve(__dirname, '../reports/issue-${issue.nid}');

interface PageResult {
  page: string;
  passed: boolean;
  spokenPhrases: number;
  findings: VirtualSRFinding[];
  issues: VirtualSRFinding[];
}

test.describe('Issue #${issue.nid} - ${issue.title}', () => {
  test.use({ storageState: AUTH_STATE_FILE });

  const results: PageResult[] = [];

  for (const pagePath of AFFECTED_PAGES) {
    test(\`validates accessibility on \${pagePath}\`, async ({ page }) => {
      await page.goto(pagePath, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('main', { timeout: 10000 });

      await injectVirtualSR(page);
      await page.waitForTimeout(1500);
      const log = await getSpokenPhraseLog(page);
      const findings = analyzeVirtualSR(log);
      const issues = findings.filter(f => EXPECTED_FIXES.includes(f.rule));

      const result: PageResult = {
        page: pagePath,
        passed: issues.length === 0,
        spokenPhrases: log.length,
        findings,
        issues,
      };
      results.push(result);

      // Log detailed results
      console.log(\`\\n=== \${pagePath} ===\`);
      console.log(\`Spoken phrases: \${log.length}\`);
      console.log(\`Total findings: \${findings.length}\`);
      console.log(\`Expected issues: \${issues.length}\`);

      if (issues.length > 0) {
        console.log(\`\\nIssues found:\`);
        issues.forEach(issue => {
          console.log(\`  - \${issue.severity}:\${issue.rule}\`);
          console.log(\`    Position: \${issue.position}\`);
          console.log(\`    Phrase: "\${issue.phrase}"\`);
          console.log(\`    Description: \${issue.description}\`);
        });
      }

      expect(issues).toEqual([]);
    });
  }

  test('generates detailed report', async () => {
    // Ensure report directory exists
    fs.mkdirSync(REPORT_DIR, { recursive: true });

    // Write JSON report
    const report = {
      issue: {
        nid: '${issue.nid}',
        title: '${issue.title}',
        url: 'https://www.drupal.org/project/drupal/issues/${issue.nid}',
      },
      timestamp: new Date().toISOString(),
      results,
      summary: {
        totalPages: results.length,
        passedPages: results.filter(r => r.passed).length,
        failedPages: results.filter(r => !r.passed).length,
        totalFindings: results.reduce((acc, r) => acc + r.findings.length, 0),
        totalIssues: results.reduce((acc, r) => acc + r.issues.length, 0),
      },
    };

    const jsonPath = path.join(REPORT_DIR, 'report.json');
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
    console.log(\`\\nJSON report written to: \${jsonPath}\`);

    // Write markdown report
    const markdown = generateMarkdownReport(report);
    const mdPath = path.join(REPORT_DIR, 'REPORT.md');
    fs.writeFileSync(mdPath, markdown);
    console.log(\`Markdown report written to: \${mdPath}\`);

    // All pages should pass
    expect(results.every(r => r.passed)).toBeTruthy();
  });
});

function generateMarkdownReport(report: any): string {
  const lines = [
    '# Issue #${issue.nid} - ${issue.title}',
    '',
    `**URL:** https://www.drupal.org/project/drupal/issues/${issue.nid}`,
    `**Generated:** ${report.timestamp}`,
    '',
    '## Summary',
    '',
    `- **Total Pages:** ${report.summary.totalPages}`,
    `- **Passed:** ${report.summary.passedPages}`,
    `- **Failed:** ${report.summary.failedPages}`,
    `- **Total Findings:** ${report.summary.totalFindings}`,
    `- **Total Issues:** ${report.summary.totalIssues}`,
    '',
    '## Results',
    '',
  ];

  for (const result of report.results) {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    lines.push(`### ${result.page}`);
    lines.push('');
    lines.push(`- **Status:** ${status}`);
    lines.push(`- **Spoken Phrases:** ${result.spokenPhrases}`);
    lines.push(`- **Findings:** ${result.findings.length}`);
    lines.push(`- **Issues:** ${result.issues.length}`);
    lines.push('');

    if (result.issues.length > 0) {
      lines.push('#### Issues');
      lines.push('');
      for (const issue of result.issues) {
        lines.push(`- **${issue.severity}** (${issue.rule})`);
        lines.push(`  - Position: ${issue.position}`);
        lines.push(`  - Phrase: \`${issue.phrase}\``);
        lines.push(`  - ${issue.description}`);
      }
      lines.push('');
    }
  }

  return lines.join('\\n');
}
`;
}

/**
 * Generate a VoiceOver test.
 */
function generateVoiceOverTest(issue: IssueInfo): string {
  const pagesList = issue.affectedPages.map(p => `  '${p}'`).join(',\n');

  return `/**
 * Auto-generated VoiceOver test for Drupal issue #${issue.nid}.
 *
 * Issue: ${issue.title}
 * URL: https://www.drupal.org/project/drupal/issues/${issue.nid}
 *
 * This test uses real VoiceOver (macOS) to validate accessibility.
 * Requires: macOS with VoiceOver enabled, headed browser mode.
 *
 * Generated by: generate-test.js
 * Date: ${new Date().toISOString()}
 */
import { voiceOverTest as test, expect } from '@guidepup/playwright';

const AFFECTED_PAGES = [
${pagesList}
];

test.describe('Issue #${issue.nid} - VoiceOver Validation', () => {
  for (const pagePath of AFFECTED_PAGES) {
    test(\`validates \${pagePath} with VoiceOver\`, async ({ page, voiceOver }) => {
      // Navigate to page
      await page.goto(pagePath, { waitUntil: 'networkidle' });
      await voiceOver.navigateToWebContent();

      // Capture spoken phrases
      const log: string[] = [];
      for (let i = 0; i < 100; i++) {
        const text = await voiceOver.itemText();
        log.push(text);
        await voiceOver.next();
      }

      // Check for expected issues
      const issues: string[] = [];

      // Check for textboxes without labels
      for (let i = 0; i < log.length; i++) {
        if (log[i].startsWith('textbox') && !log[i].includes(',')) {
          issues.push(\`Missing label for textbox at position \${i}\`);
        }
      }

      // Log results
      console.log(\`\\n=== \${pagePath} ===\`);
      console.log(\`Spoken phrases: \${log.length}\`);
      console.log(\`Issues: \${issues.length}\`);

      if (issues.length > 0) {
        console.log(\`\\nIssues found:\`);
        issues.forEach(issue => console.log(\`  - \${issue}\`));
      }

      // Test passes if no issues
      expect(issues).toEqual([]);
    });
  }
});
`;
}

// ── Main ─────────────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node generate-test.js <issue-url> [options]');
    console.log('');
    console.log('Options:');
    console.log('  --output-dir <dir>   Output directory for generated tests');
    console.log('  --template <type>    Test template type (basic, detailed, voiceover)');
    console.log('  --dry-run            Show what would be generated without writing files');
    console.log('');
    console.log('Examples:');
    console.log('  node generate-test.js https://www.drupal.org/project/drupal/issues/2608212');
    console.log('  node generate-test.js https://www.drupal.org/project/drupal/issues/2608212 --template detailed');
    console.log('  node generate-test.js https://www.drupal.org/project/drupal/issues/2608212 --dry-run');
    process.exit(1);
  }

  const issueUrl = args[0];
  const outputDir = args.includes('--output-dir') 
    ? args[args.indexOf('--output-dir') + 1] 
    : OUTPUT_DIR;
  const templateName = args.includes('--template') 
    ? args[args.indexOf('--template') + 1] 
    : 'basic';
  const dryRun = args.includes('--dry-run');

  if (!TEMPLATES[templateName]) {
    console.error(`Unknown template: ${templateName}`);
    console.error(`Available templates: ${Object.keys(TEMPLATES).join(', ')}`);
    process.exit(1);
  }

  const template = TEMPLATES[templateName];

  try {
    // Extract issue info
    const nid = extractNid(issueUrl);
    const issue: IssueInfo = {
      nid,
      title: `Issue #${nid}`,
      description: '',
      affectedPages: [],
      expectedFixes: [],
      affectedElements: [],
    };

    // Detect pages and fixes
    issue.affectedPages = detectAffectedPages(issue);
    issue.expectedFixes = detectExpectedFixes(issue);
    issue.affectedElements = detectAffectedElements(issue);

    console.log('=== Issue Information ===');
    console.log(`NID: ${issue.nid}`);
    console.log(`Affected Pages: ${issue.affectedPages.join(', ')}`);
    console.log(`Expected Fixes: ${issue.expectedFixes.join(', ')}`);
    console.log(`Affected Elements: ${issue.affectedElements.join(', ')}`);

    // Generate test
    const testCode = template.generate(issue);
    const filename = `a11y-issue-${nid}.spec.ts`;
    const filepath = path.resolve(outputDir, filename);

    if (dryRun) {
      console.log('\n=== Generated Test (dry run) ===');
      console.log(testCode);
      console.log(`\nWould write to: ${filepath}`);
    } else {
      // Ensure output directory exists
      fs.mkdirSync(path.dirname(filepath), { recursive: true });

      // Write test file
      fs.writeFileSync(filepath, testCode);
      console.log(`\nTest written to: ${filepath}`);
      console.log('\nTo run the test:');
      console.log(`  cd tests/playwright`);
      console.log(`  npx playwright test ${filename}`);
    }

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
