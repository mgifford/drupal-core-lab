#!/usr/bin/env node
/**
 * Repro/fix checker for Drupal issue #2848307 (tableselect + inline_form_errors).
 *
 * Baseline mode (expect bug present):
 *   EXPECT_INLINE_ERROR=0 node tests/playwright/scripts/issue-2848307-mcp-check.js
 *
 * Patched mode (expect fix present):
 *   EXPECT_INLINE_ERROR=1 node tests/playwright/scripts/issue-2848307-mcp-check.js
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ISSUE_URL = 'https://www.drupal.org/project/drupal/issues/2848307';
const ERROR_TEXT = 'No modules selected.';
const BASE_URL = process.env.DRUPAL_BASE_URL ?? 'https://drupal-core.ddev.site';
const ADMIN_USER = process.env.DRUPAL_ADMIN_USER ?? 'admin';
const ADMIN_PASS = process.env.DRUPAL_ADMIN_PASS ?? 'admin';
const EXPECT_INLINE_ERROR = process.env.EXPECT_INLINE_ERROR === '1';
const HEADLESS = process.env.HEADLESS !== '0';
const RUN_LABEL = EXPECT_INLINE_ERROR ? 'patched' : 'baseline';
const OUT_DIR = path.resolve(
  __dirname,
  `../reports/issue-2848307/${new Date().toISOString().replace(/[:.]/g, '-')}-${RUN_LABEL}`,
);

function toText(value) {
  return (value ?? '').toString().trim();
}

async function login(page) {
  await page.goto(`${BASE_URL}/user/login`, { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Username').fill(ADMIN_USER);
  await page.getByLabel('Password').fill(ADMIN_PASS);
  await page.getByRole('button', { name: 'Log in' }).click();
  await page.waitForLoadState('networkidle');
}

async function triggerUninstallValidation(page) {
  await page.goto(`${BASE_URL}/admin/modules/uninstall`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: /^Uninstall$/i }).first().click();
  await page.waitForLoadState('networkidle');
}

async function collectEvidence(page) {
  const summary = page.locator('.messages--error, [role="alert"]').first();
  const summaryText = toText((await summary.count()) ? await summary.innerText() : '');
  const summaryHasExpectedText = summaryText.includes(ERROR_TEXT);

  const form = page.locator('form.system-modules-uninstall');
  const formText = toText((await form.count()) ? await form.innerText() : '');
  const inlineTextInForm = formText.includes(ERROR_TEXT);

  const table = form.locator('table').first();
  const tableAriaDescribedBy = toText(await table.getAttribute('aria-describedby'));
  const describedByIds = tableAriaDescribedBy.split(/\s+/).filter(Boolean);

  const describedByMatches = [];
  for (const id of describedByIds) {
    const el = form.locator(`#${id}`);
    if (await el.count()) {
      describedByMatches.push({
        id,
        text: toText(await el.innerText()),
      });
    }
  }

  const tableAriaReferencesError = describedByMatches.some((entry) =>
    entry.text.includes(ERROR_TEXT),
  );

  const formErrorNodes = form.locator('[id$="--error"], .form-item__error-message, .form-item--error-message');
  const formErrorNodeCount = await formErrorNodes.count();
  const formErrorNodeSamples = [];
  for (let i = 0; i < Math.min(formErrorNodeCount, 5); i++) {
    formErrorNodeSamples.push(toText(await formErrorNodes.nth(i).innerText()));
  }

  const hasInlineErrorAssociation = inlineTextInForm && tableAriaReferencesError;
  const bugReproduced = summaryHasExpectedText && !hasInlineErrorAssociation;
  const fixVerified = summaryHasExpectedText && hasInlineErrorAssociation;
  const expectedOutcomeMet = EXPECT_INLINE_ERROR ? fixVerified : bugReproduced;

  return {
    issue: {
      id: 2848307,
      url: ISSUE_URL,
      expectedErrorText: ERROR_TEXT,
    },
    environment: {
      baseUrl: BASE_URL,
      runLabel: RUN_LABEL,
      expectInlineError: EXPECT_INLINE_ERROR,
    },
    observed: {
      pageTitle: await page.title(),
      pageUrl: page.url(),
      summaryHasExpectedText,
      summaryText,
      inlineTextInForm,
      tableAriaDescribedBy,
      tableAriaReferencesError,
      describedByMatches,
      formErrorNodeCount,
      formErrorNodeSamples,
      bugReproduced,
      fixVerified,
      expectedOutcomeMet,
    },
    mcpGuidance: {
      navigate: `${BASE_URL}/admin/modules/uninstall`,
      action: 'Submit the form with no module selected.',
      checkSelectors: [
        '.messages--error',
        'form.system-modules-uninstall table',
        'form.system-modules-uninstall [id$="--error"]',
      ],
      compareFields: [
        'summaryText',
        'inlineTextInForm',
        'tableAriaDescribedBy',
        'tableAriaReferencesError',
      ],
    },
  };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: HEADLESS });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  try {
    await login(page);
    await triggerUninstallValidation(page);

    const evidence = await collectEvidence(page);
    const screenshotPath = path.join(OUT_DIR, 'uninstall-validation.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });

    const axPath = path.join(OUT_DIR, 'accessibility-tree.json');
    if (typeof page.accessibility?.snapshot === 'function') {
      const axSnapshot = await page.accessibility.snapshot({ interestingOnly: false });
      fs.writeFileSync(axPath, JSON.stringify(axSnapshot, null, 2));
    }
    else {
      fs.writeFileSync(
        axPath,
        JSON.stringify(
          {
            note: 'Playwright accessibility snapshot API is unavailable in this runtime.',
            fallback: 'Use Playwright MCP browser_snapshot for the accessibility tree.',
          },
          null,
          2,
        ),
      );
    }

    const resultPath = path.join(OUT_DIR, 'result.json');
    fs.writeFileSync(
      resultPath,
      JSON.stringify(
        {
          ...evidence,
          artifacts: {
            resultJson: resultPath,
            screenshot: screenshotPath,
            accessibilityTree: axPath,
          },
        },
        null,
        2,
      ),
    );

    console.log(JSON.stringify({
      runLabel: RUN_LABEL,
      resultPath,
      screenshotPath,
      axPath,
      observed: evidence.observed,
    }, null, 2));

    process.exitCode = evidence.observed.expectedOutcomeMet ? 0 : 1;
  }
  finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
