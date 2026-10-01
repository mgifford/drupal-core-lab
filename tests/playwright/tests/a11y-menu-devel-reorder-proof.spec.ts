/**
 * Proof-oriented Virtual SR test for Devel menu item ordering.
 *
 * Goal:
 *   Demonstrate that an admin can adjust menu order and save it,
 *   with Guidepup transcript highlights before/after the action.
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { AUTH_STATE_FILE } from '../lib/auth-setup';
import { injectVirtualSR } from '../lib/virtual-sr';

const ROUTE = '/admin/structure/menu/manage/devel';
const PROOF_FILE = path.resolve(__dirname, '../reports/menu-devel-reorder-proof.json');
const PROOF_MD_FILE = path.resolve(__dirname, '../reports/menu-devel-reorder-proof.md');

function selectHighlights(log: string[]): string[] {
  const highSignal = log.filter((phrase) => {
    const p = phrase.toLowerCase();
    return (
      p.includes('devel') ||
      p.includes('menu development') ||
      p.includes('current route') ||
      p.includes('container info') ||
      p.includes('devel settings') ||
      p.includes('save') ||
      p.includes('status message') ||
      p.includes('main')
    );
  });

  if (highSignal.length >= 12) {
    return highSignal.slice(0, 30);
  }

  const fallback = log.filter((phrase) => {
    const p = phrase.toLowerCase();
    return (
      p.includes('navigation') ||
      p.includes('main') ||
      p.includes('heading') ||
      p.includes('devel') ||
      p.includes('menu') ||
      p.includes('save') ||
      p.includes('button') ||
      p.includes('link') ||
      p.includes('table') ||
      p.includes('row')
    );
  });

  return fallback.slice(0, 30);
}

async function getBoundedSpokenPhraseLog(page: any, maxSteps = 1200): Promise<string[]> {
  return page.evaluate(async (steps: number) => {
    try {
      // @ts-ignore
      await window.virtual.start({ container: document.body });

      for (let i = 0; i < steps; i++) {
        // @ts-ignore
        if ((await window.virtual.lastSpokenPhrase()) === 'end of document') {
          break;
        }
        // @ts-ignore
        await window.virtual.next();
      }

      // @ts-ignore
      return await window.virtual.spokenPhraseLog();
    } finally {
      // @ts-ignore
      await window.virtual.stop();
    }
  }, maxSteps);
}

async function chooseWeightValue(selectLocator: any, candidates: string[]): Promise<string> {
  const optionValues = await selectLocator.locator('option').evaluateAll((options: HTMLOptionElement[]) =>
    options.map((opt) => opt.value),
  );

  for (const candidate of candidates) {
    if (optionValues.includes(candidate)) {
      await selectLocator.selectOption(candidate, { force: true });
      return candidate;
    }
  }

  const fallback = optionValues[0];
  await selectLocator.selectOption(fallback, { force: true });
  return fallback;
}

async function getRowLabel(row: any): Promise<string> {
  const linkText = (await row.locator('a').first().textContent().catch(() => ''))?.trim();
  if (linkText) {
    return linkText;
  }

  const cellText = (await row.locator('td').first().textContent().catch(() => ''))?.trim();
  if (cellText) {
    return cellText.replace(/\s+/g, ' ').slice(0, 120);
  }

  return 'unlabeled-row';
}

function normalizeText(input: string): string {
  return input.replace(/\s+/g, ' ').trim();
}

function includesInsensitive(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

function containsAnyInsensitive(haystack: string, candidates: string[]): boolean {
  return candidates.some((candidate) => includesInsensitive(haystack, candidate));
}

test.describe('Virtual SR proof — devel menu reorder and save', () => {
  test.use({ storageState: AUTH_STATE_FILE });

  test('reorders menu items and captures proof transcript', async ({ page }) => {
    const interactionDirections: string[] = [];

    interactionDirections.push('[open route] /admin/structure/menu/manage/devel');
    await page.goto(ROUTE, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('main', { timeout: 10000 });

    const rows = page.locator('table tbody tr.draggable');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(1);

    const firstRow = rows.nth(0);
    const secondRow = rows.nth(1);

    const firstTitle = await getRowLabel(firstRow);
    const secondTitle = await getRowLabel(secondRow);

    const firstWeight = firstRow.locator('select[name*="[weight]"]').first();
    const secondWeight = secondRow.locator('select[name*="[weight]"]').first();

    const firstBefore = await firstWeight.inputValue();
    const secondBefore = await secondWeight.inputValue();

    interactionDirections.push('[show headings] collect initial Guidepup spoken phrases');
    await injectVirtualSR(page);
    await page.waitForTimeout(1500);
    const beforeLog = await getBoundedSpokenPhraseLog(page);

    // Drupal often hides weight controls until this toggle is activated.
    const showWeightsToggle = page
      .locator('button:has-text("Show row weights"), a:has-text("Show row weights"), .tabledrag-toggle-weight')
      .first();
    if (await showWeightsToggle.isVisible().catch(() => false)) {
      interactionDirections.push('[show row weights] activate tabledrag weight controls');
      await showWeightsToggle.click();
    }

    // Move second row ahead of first by assigning a lower weight.
    interactionDirections.push(`[set weight] ${firstTitle}: ${firstBefore} -> target`);
    const firstAfter = await chooseWeightValue(firstWeight, ['1', '0', '2', '3']);
    interactionDirections.push(`[set weight] ${secondTitle}: ${secondBefore} -> target`);
    const secondAfter = await chooseWeightValue(secondWeight, ['-1', '-2', '0']);

    const saveButton = page.locator('#edit-submit, input[type="submit"][value*="Save"], button:has-text("Save")').first();
    await expect(saveButton).toBeVisible();
    interactionDirections.push('[save] click Save button');
    await saveButton.click();

    const statusMessage = page.locator('[role="status"], .messages--status').first();
    await expect(statusMessage).toBeVisible({ timeout: 10000 });
    const statusText = normalizeText((await statusMessage.textContent()) || '');
    expect(statusText.toLowerCase()).toMatch(/save|updated|changes|has been/);

    const postSaveRows = page.locator('table tbody tr.draggable');
    const postSaveCount = await postSaveRows.count();
    const postSaveLabels: string[] = [];
    for (let i = 0; i < postSaveCount; i++) {
      postSaveLabels.push(await getRowLabel(postSaveRows.nth(i)));
    }

    const firstIndex = postSaveLabels.findIndex((label) => label === firstTitle);
    const secondIndex = postSaveLabels.findIndex((label) => label === secondTitle);
    const reorderObserved = firstIndex >= 0 && secondIndex >= 0 && secondIndex < firstIndex;

    interactionDirections.push('[show headings] collect post-save Guidepup spoken phrases');
    await injectVirtualSR(page);
    await page.waitForTimeout(1500);
    const afterLog = await getBoundedSpokenPhraseLog(page);

    const afterJoined = afterLog.join(' | ');
    const srMentionsStatusMessage = includesInsensitive(afterJoined, 'status message');
    const srMentionsUpdated = includesInsensitive(afterJoined, 'updated') || includesInsensitive(afterJoined, 'has been updated');
    const srAnnouncedResponse = srMentionsStatusMessage || srMentionsUpdated;

    const expected = {
      reorderAttempted: true,
      saveAttempted: true,
      domShowsSuccessStatus: true,
      domReflectsNewOrder: true,
      srAnnouncesPostSaveStatus: true,
    };

    const observed = {
      reorderAttempted: true,
      saveAttempted: true,
      domShowsSuccessStatus: statusText.length > 0,
      domReflectsNewOrder: reorderObserved,
      srAnnouncesPostSaveStatus: srAnnouncedResponse,
    };

    const interactionGaps: string[] = [];
    if (observed.domShowsSuccessStatus && !observed.srAnnouncesPostSaveStatus) {
      interactionGaps.push(
        'DOM shows a post-save status message, but Guidepup did not capture a corresponding status announcement.',
      );
    }
    if (!observed.domReflectsNewOrder) {
      interactionGaps.push(
        'The menu order change attempt was submitted, but the final DOM order does not confirm the moved item is ahead of the target item.',
      );
    }

    const expectedAnnouncements = [
      {
        label: 'Status region announcement',
        expected: ['status message'],
        observed: srMentionsStatusMessage,
      },
      {
        label: 'Update confirmation announcement',
        expected: ['updated', 'has been updated'],
        observed: srMentionsUpdated,
      },
      {
        label: 'Menu page heading context',
        expected: ['edit menu development', 'menu development', 'development'],
        observed: containsAnyInsensitive(afterJoined, ['edit menu development', 'menu development', 'development']),
      },
    ];

    const negativeEvidence = expectedAnnouncements
      .filter((item) => !item.observed)
      .map((item) => ({
        expectation: item.label,
        expectedTokens: item.expected,
        observation: 'not found in Guidepup after-save transcript',
      }));

    const transcript = {
      route: ROUTE,
      timestamp: new Date().toISOString(),
      goal: 'Successfully adjust the order of menu items and save changes.',
      interactionDirections,
      sentInteractions: {
        toggledWeightControls: await showWeightsToggle.isVisible().catch(() => false),
        firstItem: firstTitle,
        secondItem: secondTitle,
        firstWeightBefore: firstBefore,
        secondWeightBefore: secondBefore,
        firstWeightAfter: firstAfter,
        secondWeightAfter: secondAfter,
        submittedVia: 'Save button',
      },
      observedResponses: {
        statusMessage: statusText,
        postSaveOrder: postSaveLabels,
        srAnnouncedStatus: srAnnouncedResponse,
        srMentionsStatusMessage,
        srMentionsUpdated,
      },
      expectations: expected,
      observations: observed,
      interactionGaps,
      negativeEvidence,
      guidepup: {
        beforeHighlights: selectHighlights(beforeLog),
        afterHighlights: selectHighlights(afterLog),
        beforePhraseCount: beforeLog.length,
        afterPhraseCount: afterLog.length,
      },
    };

    fs.mkdirSync(path.dirname(PROOF_FILE), { recursive: true });
    fs.writeFileSync(PROOF_FILE, JSON.stringify(transcript, null, 2));

    const markdown = [
      '# Menu Reorder Accessibility Proof',
      '',
      `- Route: ${transcript.route}`,
      `- Timestamp: ${transcript.timestamp}`,
      `- Goal: ${transcript.goal}`,
      '',
      '## Action Performed',
      '',
      `- Moved item: ${transcript.sentInteractions.secondItem} before ${transcript.sentInteractions.firstItem}`,
      `- Weight change: ${transcript.sentInteractions.firstItem} ${transcript.sentInteractions.firstWeightBefore} -> ${transcript.sentInteractions.firstWeightAfter}`,
      `- Weight change: ${transcript.sentInteractions.secondItem} ${transcript.sentInteractions.secondWeightBefore} -> ${transcript.sentInteractions.secondWeightAfter}`,
      `- Submitted via: ${transcript.sentInteractions.submittedVia}`,
      '',
      '## Sent Interactions',
      '',
      `- Show row weights control used: ${transcript.sentInteractions.toggledWeightControls ? 'yes' : 'no'}`,
      `- Set ${transcript.sentInteractions.firstItem} weight: ${transcript.sentInteractions.firstWeightBefore} -> ${transcript.sentInteractions.firstWeightAfter}`,
      `- Set ${transcript.sentInteractions.secondItem} weight: ${transcript.sentInteractions.secondWeightBefore} -> ${transcript.sentInteractions.secondWeightAfter}`,
      `- Clicked submit control: ${transcript.sentInteractions.submittedVia}`,
      '',
      '## Interaction Directions (Sent)',
      '',
      ...transcript.interactionDirections.map((step) => `- ${step}`),
      '',
      '## Observed Responses',
      '',
      `- DOM status message: ${transcript.observedResponses.statusMessage}`,
      `- DOM post-save order (top to bottom): ${transcript.observedResponses.postSaveOrder.join(' | ')}`,
      `- Guidepup captured status announcement: ${transcript.observedResponses.srAnnouncedStatus ? 'yes' : 'no'}`,
      `- Guidepup contained "status message": ${transcript.observedResponses.srMentionsStatusMessage ? 'yes' : 'no'}`,
      `- Guidepup contained "updated": ${transcript.observedResponses.srMentionsUpdated ? 'yes' : 'no'}`,
      '',
      '## Expectations vs Observations',
      '',
      '| Expectation | Observed | Result |',
      '| --- | --- | --- |',
      `| Reorder attempt is executed | ${transcript.observations.reorderAttempted ? 'yes' : 'no'} | ${transcript.expectations.reorderAttempted === transcript.observations.reorderAttempted ? 'match' : 'mismatch'} |`,
      `| Save action is executed | ${transcript.observations.saveAttempted ? 'yes' : 'no'} | ${transcript.expectations.saveAttempted === transcript.observations.saveAttempted ? 'match' : 'mismatch'} |`,
      `| DOM shows success status | ${transcript.observations.domShowsSuccessStatus ? 'yes' : 'no'} | ${transcript.expectations.domShowsSuccessStatus === transcript.observations.domShowsSuccessStatus ? 'match' : 'mismatch'} |`,
      `| DOM reflects new order | ${transcript.observations.domReflectsNewOrder ? 'yes' : 'no'} | ${transcript.expectations.domReflectsNewOrder === transcript.observations.domReflectsNewOrder ? 'match' : 'mismatch'} |`,
      `| SR announces post-save status | ${transcript.observations.srAnnouncesPostSaveStatus ? 'yes' : 'no'} | ${transcript.expectations.srAnnouncesPostSaveStatus === transcript.observations.srAnnouncesPostSaveStatus ? 'match' : 'mismatch'} |`,
      '',
      '## Interaction Gaps',
      '',
      ...(transcript.interactionGaps.length > 0
        ? transcript.interactionGaps.map((gap) => `- ${gap}`)
        : ['- None detected in this run.']),
      '',
      '## Negative Evidence',
      '',
      ...(transcript.negativeEvidence.length > 0
        ? transcript.negativeEvidence.map(
            (item) => `- Expected ${item.expectation} (${item.expectedTokens.join(', ')}), but ${item.observation}.`,
          )
        : ['- None: all tracked expected announcements were found in this run.']),
      '',
      '## Guidepup Partial Transcript (Highlights)',
      '',
      '### Before Save',
      ...transcript.guidepup.beforeHighlights.map((line) => `- ${line}`),
      '',
      '### After Save',
      ...transcript.guidepup.afterHighlights.map((line) => `- ${line}`),
      '',
      `- Phrase count before: ${transcript.guidepup.beforePhraseCount}`,
      `- Phrase count after: ${transcript.guidepup.afterPhraseCount}`,
      '',
      '## Evidence Files',
      '',
      `- JSON: ${PROOF_FILE}`,
      `- Markdown: ${PROOF_MD_FILE}`,
    ].join('\n');

    fs.writeFileSync(PROOF_MD_FILE, `${markdown}\n`);

    console.log('\n[Proof] Goal:', transcript.goal);
    console.log('[Proof] Sent:', `${secondTitle} moved before ${firstTitle}; Save clicked`);
    console.log('[Proof] Observed DOM:', statusText);
    console.log('[Proof] Observed SR status announcement:', srAnnouncedResponse ? 'yes' : 'no');
    if (interactionGaps.length > 0) {
      console.log('[Proof] Interaction gaps:', interactionGaps);
    }
    console.log('[Proof] Artifact:', PROOF_FILE);
    console.log('[Proof] Markdown:', PROOF_MD_FILE);
  });
});
