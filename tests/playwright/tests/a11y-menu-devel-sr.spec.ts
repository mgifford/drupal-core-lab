/**
 * Virtual SR audit for the Devel menu administration page.
 *
 * Target route:
 *   /admin/structure/menu/manage/devel
 *
 * Purpose:
 *   - Validate screen-reader-visible menu structure for the page.
 *   - Catch semantic issues (empty links/buttons, missing landmarks, etc.).
 *   - Produce a spoken-phrase artifact you can compare with real VoiceOver output.
 */
import { test, expect } from '@playwright/test';
import { AUTH_STATE_FILE } from '../lib/auth-setup';
import { injectVirtualSR, getSpokenPhraseLog, analyzeVirtualSR } from '../lib/virtual-sr';

const ROUTE = '/admin/structure/menu/manage/devel';

test.describe('Virtual SR — devel menu admin page', () => {
  test.use({ storageState: AUTH_STATE_FILE });

  test('menu page is announced with expected landmarks and no severe SR findings', async ({ page }) => {
    await page.goto(ROUTE, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('main', { timeout: 10000 });

    const response = page.url();
    expect(response).toContain('/admin/structure/menu/manage/devel');

    await injectVirtualSR(page);
    await page.waitForTimeout(1500);

    const log = await getSpokenPhraseLog(page);
    const findings = analyzeVirtualSR(log);

    // Core structure checks for quick regression confidence.
    expect(log.some((phrase) => phrase === 'main')).toBeTruthy();
    expect(log.some((phrase) => phrase.startsWith('navigation'))).toBeTruthy();
    expect(
      log.some(
        (phrase) =>
          phrase.toLowerCase().includes('heading') &&
          phrase.toLowerCase().includes('devel'),
      ),
    ).toBeTruthy();

    // Block severe semantic regressions at the accessibility-tree layer.
    const severeFindings = findings.filter(
      (finding) => finding.severity === 'critical' || finding.severity === 'serious',
    );
    expect(severeFindings).toEqual([]);

    // Keep output inspectable for manual VoiceOver comparison.
    console.log(`\n[Virtual SR] route=${ROUTE}`);
    console.log(`[Virtual SR] spoken phrases=${log.length}`);
    if (findings.length > 0) {
      console.log(
        '[Virtual SR] findings:',
        findings.map((finding) => `${finding.severity}:${finding.rule}`),
      );
    }
  });
});
