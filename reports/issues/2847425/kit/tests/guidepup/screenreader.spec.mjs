/**
 * @file
 * Guidepup screen-reader capture for Drupal core issue #2847425.
 *
 * Drives a real screen reader (VoiceOver on macOS by default) over the
 * /file-managed-states-test form and records what is announced, so the spoken
 * semantics can be compared BEFORE and AFTER MR !7305.
 *
 * What the patch should change, in screen-reader terms:
 *   - A managed_file that #states hides should NOT be announced at all
 *     (it is display:none). Before the patch it is wrongly announced on load.
 *   - A managed_file that #states marks required should be announced as
 *     "required" once its trigger is set. Before the patch it never is.
 *   - Scenario 3: hiding the file must not silence the rest of the fieldset —
 *     the "always visible" text field must still be announced (WCAG 3.3.1).
 *
 * Run:
 *   npx @guidepup/setup            # one-time macOS permissions + VO automation
 *   SR_LABEL=before npm run test:before   # on plain core
 *   SR_LABEL=after  npm run test:after    # with MR !7305 applied
 *   npm run diff                          # compare the two JSON captures
 *
 * The API surface of Guidepup shifts between versions; this spec is a working
 * starting point. If navigateToWebContent() is unavailable in your version,
 * see the fallback note below.
 */
import { voTest as test } from "@guidepup/playwright";
import { expect } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";

const PATH = "/file-managed-states-test";
const LABEL = process.env.SR_LABEL || "run";

/**
 * Walk the screen reader forward through the web content, collecting the text
 * of each stop until we reach the submit button (or hit the stop budget).
 */
async function readThrough(voiceOver, maxStops = 90) {
  const phrases = [];
  try {
    await voiceOver.navigateToWebContent();
  }
  catch {
    // Fallback for versions without the helper: start interacting with content.
    await voiceOver.interact();
  }
  for (let i = 0; i < maxStops; i++) {
    await voiceOver.next();
    const text = await voiceOver.itemText();
    phrases.push(text);
    if (/submit/i.test(text)) {
      break;
    }
  }
  return phrases;
}

test("capture managed_file #states screen-reader semantics", async ({ page, voiceOver }) => {
  await page.goto(PATH);
  await page.waitForLoadState("networkidle");

  // 1. Default state — nothing toggled. On unpatched core the "initially
  //    hidden" and "audio" files leak into this reading.
  const defaultState = await readThrough(voiceOver);

  // 2. Drive the triggers via the page (not the screen reader), then re-read so
  //    the capture reflects the states-updated DOM.
  await page.selectOption('select[name="type"]', "audio").catch(() => {});
  await page.check('input[name="toggle"]').catch(() => {});
  await page.check('input[name="show_details"]').catch(() => {});
  await page.waitForTimeout(400);
  const afterToggles = await readThrough(voiceOver);

  const capture = {
    label: LABEL,
    path: PATH,
    capturedAt: new Date().toISOString(),
    defaultState,
    afterToggles,
    fullSpokenLog: await voiceOver.spokenPhraseLog(),
  };

  mkdirSync("sr-output", { recursive: true });
  const file = `sr-output/screenreader-${LABEL}.json`;
  writeFileSync(file, JSON.stringify(capture, null, 2));
  console.log(`Wrote ${file}`);

  // Informational assertions (annotations, not hard failures) so the run
  // succeeds on both "before" and "after" and the difference shows in the log.
  const afterText = afterToggles.join("\n").toLowerCase();
  const requiredAnnounced = /required/.test(afterText);
  const alwaysVisibleAnnounced = afterText.includes("this field should always stay visible");
  test.info().annotations.push(
    { type: "required-announced-after-toggle", description: String(requiredAnnounced) },
    { type: "fieldset-text-still-announced", description: String(alwaysVisibleAnnounced) }
  );

  // The form itself must at least be reachable and read.
  expect(defaultState.length).toBeGreaterThan(0);
});
