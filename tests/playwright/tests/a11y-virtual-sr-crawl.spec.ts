/**
 * Multi-scanner full-site crawl for Drupal Core.
 *
 * Runs three independent accessibility scanners on every page:
 *   1. axe-core — structural/CSS/ARIA violations
 *   2. IBM Equal Access — WCAG rule-based scanning
 *   3. Virtual Screen Reader — semantic/accessibility tree validation
 *
 * Cross-references findings across all three tools to distinguish
 * real barriers from false positives. See lib/multi-scanner.ts.
 *
 * Run locally:
 *   cd tests/playwright && npx playwright test --grep "Multi-Scanner"
 */
import { test, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import {
  anonymousPages,
  adminPages,
  seededBenchmarkPages,
  DEFAULT_SCAN_MODE,
  ScanMode,
  PageEntry,
} from '../lib/pages';
import { THEME_CONFIGS, ThemeConfig } from '../lib/theme-configs';
import { AUTH_STATE_FILE } from '../lib/auth-setup';
import {
  TEMP_DIR,
  drush,
  captureOriginalSettingsOnce,
} from '../lib/drush-helpers';
import {
  runAllScanners,
  crossReferenceAll,
  MultiScannerResult,
  CrossRefResult,
} from '../lib/multi-scanner';
import { VirtualSRFinding } from '../lib/virtual-sr';

// ── Types ────────────────────────────────────────────────────────────────────

interface ScanResultRecord {
  scanMode: ScanMode;
  theme: string;
  page: string;
  path: string;
  viewport: { width: number; height: number };
  screen: string;
  colorScheme: 'light' | 'dark';
  timestamp: string;
  /** Axe violations. */
  axeViolations: Array<{ id: string; description: string; impact: string }>;
  /** IBM EA violations. */
  ibmEAViolations: Array<{ ruleId: string; message: string; level: string }>;
  /** Virtual SR findings. */
  virtualSRFindings: VirtualSRFinding[];
  /** Full spoken phrase log from virtual SR. */
  srLog: string[];
  /** Cross-reference results across all three tools. */
  crossRef: CrossRefResult;
}

// ── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_BASE_URL = process.env.DRUPAL_BASE_URL ?? 'https://drupal-core.ddev.site';
const SCAN_MODE = resolveScanMode();

/** Standard viewports — matches the axe crawl. */
const STANDARD_VIEWPORTS = [
  { label: ' [desktop]', screen: 'desktop', width: 1280, height: 800 },
  { label: ' [tablet]', screen: 'tablet', width: 768, height: 1024 },
  { label: ' [tablet-landscape]', screen: 'tablet-landscape', width: 1024, height: 768 },
  { label: ' [mobile-portrait]', screen: 'mobile', width: 375, height: 812 },
  { label: ' [mobile-landscape]', screen: 'mobile-landscape', width: 812, height: 375 },
] as const;

// ── Helpers ──────────────────────────────────────────────────────────────────

function resolveScanMode(): ScanMode {
  const raw = (process.env.A11Y_SCAN_MODE ?? DEFAULT_SCAN_MODE).trim().toLowerCase();
  if (raw === 'core-baseline' || raw === 'seeded-benchmark') {
    return raw;
  }

  throw new Error(
    `Invalid A11Y_SCAN_MODE=${raw}. Supported values: core-baseline | seeded-benchmark.`,
  );
}

function isTruthyConfigValue(raw: string): boolean {
  const normalized = raw.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}

function isModuleEnabled(moduleMachineName: string): boolean {
  const output = drush('pm:list --status=enabled --type=module --format=list');
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .includes(moduleMachineName);
}

function getGeneratedContentSeedBugsEnabled(): boolean {
  const value = drush('config:get generated_content_a11y.settings seed_bugs --format=string');
  return isTruthyConfigValue(value);
}

function assertScanModeRuntimePreconditions(scanMode: ScanMode): void {
  const generatedContentA11yEnabled = isModuleEnabled('generated_content_a11y');
  const seedBugsEnabled = generatedContentA11yEnabled ? getGeneratedContentSeedBugsEnabled() : false;

  if (scanMode === 'core-baseline') {
    if (generatedContentA11yEnabled && seedBugsEnabled) {
      throw new Error(
        'core-baseline scan blocked: generated_content_a11y is enabled with seed_bugs=true. ' +
        'Disable seeded bugs before baseline crawl (for example: drush cset generated_content_a11y.settings seed_bugs false -y && drush cr), ' +
        'or run with A11Y_SCAN_MODE=seeded-benchmark.',
      );
    }
    return;
  }

  if (!generatedContentA11yEnabled) {
    throw new Error(
      'seeded-benchmark scan blocked: generated_content_a11y is not enabled. Enable it before running this mode.',
    );
  }
  if (!seedBugsEnabled) {
    throw new Error(
      'seeded-benchmark scan blocked: generated_content_a11y.settings:seed_bugs is false. Enable seeded bugs for benchmark runs.',
    );
  }
}

function getPagesForMode(scanMode: ScanMode): { anonymous: PageEntry[]; admin: PageEntry[] } {
  if (scanMode === 'seeded-benchmark') {
    return {
      anonymous: [...anonymousPages, ...seededBenchmarkPages],
      admin: adminPages,
    };
  }

  return {
    anonymous: anonymousPages,
    admin: adminPages,
  };
}

function switchTheme(config: ThemeConfig): void {
  const themesToEnable = [...new Set([config.defaultTheme, config.adminTheme])].join(' ');
  drush(`theme:enable ${themesToEnable} -y`);
  drush(`config:set system.theme default ${config.defaultTheme} -y`);
  drush(`config:set system.theme admin ${config.adminTheme} -y`);
  if (config.defaultTheme === 'default_admin' || config.adminTheme === 'default_admin') {
    drush(`config:set default_admin.settings enable_dark_mode auto -y`);
  }
  drush(`cache:rebuild`);
}

function resolveRoute(page: Page, route: string): string {
  const configuredBaseUrl = (page.context() as any)._options.baseURL ?? DEFAULT_BASE_URL;
  return new URL(route, configuredBaseUrl).toString();
}

async function ensurePageReady(page: Page): Promise<void> {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForSelector('html', { state: 'attached', timeout: 10000 });
  await page.waitForSelector('body', { state: 'attached', timeout: 10000 });
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => undefined);
}

/**
 * Visit a route, run all three scanners, and return the combined
 * result record with cross-reference analysis.
 */
async function scanRoute(
  page: Page,
  opts: {
    themeId: string;
    testName: string;
    routePath: string;
    viewport: { width: number; height: number };
    screen: string;
    colorScheme: 'light' | 'dark';
    expectedStatus?: number;
  },
): Promise<ScanResultRecord> {
  await page.setViewportSize({ width: opts.viewport.width, height: opts.viewport.height });
  const url = resolveRoute(page, opts.routePath);
  const response = await page.goto(url, { waitUntil: 'domcontentloaded' });

  const status = response?.status() ?? 0;
  if (opts.expectedStatus !== undefined) {
    if (status !== opts.expectedStatus) {
      throw new Error(
        `Route ${opts.routePath} returned HTTP ${status}, expected ${opts.expectedStatus}.`,
      );
    }
  } else if (status === 403 || status === 404) {
    // Page exists but requires permissions or is not available — skip gracefully.
    console.log(`  ⏭️  Skipping ${opts.routePath} (HTTP ${status})`);
    return {
      scanMode: SCAN_MODE,
      theme: opts.themeId,
      page: opts.testName,
      path: opts.routePath,
      viewport: opts.viewport,
      screen: opts.screen,
      colorScheme: opts.colorScheme,
      timestamp: new Date().toISOString(),
      axeViolations: [],
      ibmEAViolations: [],
      virtualSRFindings: [],
      srLog: [],
      crossRef: {
        confirmed: [],
        investigate: [],
        axeOnly: [],
        ibmEAOnly: [],
        virtualSROnly: [],
      },
    };
  } else if (status >= 400) {
    throw new Error(
      `Route ${opts.routePath} returned HTTP ${status} — page missing on this site.`,
    );
  }

  await ensurePageReady(page);

  // Detect PHP error pages — if the page contains fatal/error messages,
  // skip it rather than scanning a broken page.
  const bodyText = await page.textContent('body').catch(() => '');
  if (bodyText && (bodyText.includes('Fatal error') || bodyText.includes('Warning:') || bodyText.includes('Failed to open stream'))) {
    console.log(`  ⏭️  Skipping ${opts.routePath} (PHP error detected)`);
    return {
      scanMode: SCAN_MODE,
      theme: opts.themeId,
      page: opts.testName,
      path: opts.routePath,
      viewport: opts.viewport,
      screen: opts.screen,
      colorScheme: opts.colorScheme,
      timestamp: new Date().toISOString(),
      axeViolations: [],
      ibmEAViolations: [],
      virtualSRFindings: [],
      srLog: [],
      crossRef: {
        confirmed: [],
        investigate: [],
        axeOnly: [],
        ibmEAOnly: [],
        virtualSROnly: [],
      },
    };
  }

  // Run all three scanners (axe, IBM EA, virtual SR).
  const multiResult = await runAllScanners(page, url, opts.themeId, opts.screen);

  // Cross-reference across all three tools.
  const crossRef = crossReferenceAll(multiResult);

  const record: ScanResultRecord = {
    scanMode: SCAN_MODE,
    theme: opts.themeId,
    page: opts.testName,
    path: opts.routePath,
    viewport: opts.viewport,
    screen: opts.screen,
    colorScheme: opts.colorScheme,
    timestamp: multiResult.timestamp,
    axeViolations: multiResult.axe.violations.map((v) => ({
      id: v.id,
      description: v.description,
      impact: v.impact,
    })),
    ibmEAViolations: multiResult.ibmEA.violations.map((v) => ({
      ruleId: v.ruleId,
      message: v.message,
      level: v.level,
    })),
    virtualSRFindings: multiResult.virtualSR.findings,
    srLog: multiResult.virtualSR.log,
    crossRef,
  };

  const totalIssues =
    crossRef.confirmed.length +
    crossRef.investigate.length +
    crossRef.axeOnly.length +
    crossRef.ibmEAOnly.length +
    crossRef.virtualSROnly.length;

  if (totalIssues > 0) {
    console.log(
      `  ⚠️  [${opts.themeId}/${opts.viewport.width}px/${opts.colorScheme}] ` +
      `${crossRef.confirmed.length} confirmed, ${crossRef.investigate.length} investigate, ` +
      `${crossRef.axeOnly.length} axe-only, ${crossRef.ibmEAOnly.length} ibmEA-only, ` +
      `${crossRef.virtualSROnly.length} SR-only on ${opts.testName}`,
    );
  }

  return record;
}

function writeResultShard(shardId: string, records: ScanResultRecord[]): void {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
  const shardFile = path.join(TEMP_DIR, `${shardId}.json`);
  fs.writeFileSync(shardFile, JSON.stringify(records, null, 2));
}

// ── Tests ────────────────────────────────────────────────────────────────────

test.describe('Multi-Scanner Crawl — axe + IBM EA + Virtual SR', () => {
  const pagesForMode = getPagesForMode(SCAN_MODE);

  test.beforeAll(() => {
    assertScanModeRuntimePreconditions(SCAN_MODE);
    console.log(`🔒 Scan mode locked: ${SCAN_MODE}`);
  });

  for (const themeConfig of THEME_CONFIGS) {
    const scanGroup = (
      groupLabel: string,
      pages: PageEntry[],
      useAuth: boolean,
    ) => {
      if (pages.length === 0) return;

      test.describe(`Theme: ${themeConfig.label} (${themeConfig.colorScheme}) — ${groupLabel}`, () => {
        if (useAuth) {
          test.use({ storageState: AUTH_STATE_FILE });
        }

        let allRecords: ScanResultRecord[] = [];

        test.beforeAll(() => {
          captureOriginalSettingsOnce();
          if (themeConfig.colorScheme === 'light') {
            switchTheme(themeConfig);
          }
        });

        test.afterAll(() => {
          writeResultShard(`multi-scanner-${SCAN_MODE}-${themeConfig.id}-${useAuth ? 'admin' : 'anon'}`, allRecords);
          allRecords = [];
        });

        for (const pageEntry of pages) {
          for (const viewport of STANDARD_VIEWPORTS) {
            const testLabel = `${pageEntry.name}${viewport.label}`;

            test(testLabel, async ({ page }) => {
              const record = await scanRoute(page, {
                themeId: themeConfig.id,
                testName: pageEntry.name,
                routePath: pageEntry.path,
                viewport: { width: viewport.width, height: viewport.height },
                screen: viewport.screen,
                colorScheme: themeConfig.colorScheme,
                expectedStatus: pageEntry.expectedStatus,
              });

              allRecords.push(record);

              if (record.crossRef.confirmed.length > 0) {
                console.log(
                  `    CONFIRMED barriers on ${pageEntry.name}:`,
                  record.crossRef.confirmed.map((c) => `${c.rule} [${c.tools.join('+')}]`),
                );
              }
              if (record.crossRef.investigate.length > 0) {
                console.log(
                  `    INVESTIGATE on ${pageEntry.name}:`,
                  record.crossRef.investigate.map((i) => `${i.rule} [${i.tools.join('+')}]`),
                );
              }
            });
          }
        }
      });
    };

    scanGroup('anonymous pages', themeConfig.testAnonymous ? pagesForMode.anonymous : [], false);
    scanGroup('admin pages', themeConfig.testAdmin ? pagesForMode.admin : [], true);
  }
});
