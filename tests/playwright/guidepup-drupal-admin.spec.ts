/**
 * Guidepup Real VoiceOver Tests for Drupal Admin Workflows.
 *
 * These tests drive actual VoiceOver (macOS) through Playwright to validate
 * that Drupal's admin interface is accessible to screen reader users.
 *
 * Requirements:
 *   - macOS with VoiceOver enabled
 *   - DDEV site running at http://drupal-core.ddev.site
 *   - Run: npx @guidepup/setup setup (first time only)
 *   - Run: npx @guidepup/setup install (after installing dependencies)
 *
 * Run locally:
 *   cd tests/playwright
 *   npx playwright test guidepup-drupal-admin --headed
 *
 * Note: These tests MUST run in headed mode (headless: false) because
 * VoiceOver needs a visible browser window.
 */
import { voiceOverTest as test, expect } from "@guidepup/playwright";

// ── Configuration ────────────────────────────────────────────────────────────

const BASE_URL = process.env.DRUPAL_BASE_URL ?? "http://drupal-core.ddev.site";
const ADMIN_USER = process.env.DRUPAL_ADMIN_USER ?? "admin";
const ADMIN_PASS = process.env.DRUPAL_ADMIN_PASS ?? "admin";

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Login to Drupal admin using VoiceOver navigation.
 */
async function loginWithVoiceOver(page: any, voiceOver: any) {
  await page.goto(`${BASE_URL}/user/login`, { waitUntil: "networkidle" });
  await voiceOver.navigateToWebContent();

  // Find username field
  while ((await voiceOver.itemText()) !== "Username") {
    await voiceOver.next();
  }

  // Type username
  await voiceOver.act();
  await voiceOver.type(ADMIN_USER);

  // Move to password field
  await voiceOver.next();
  await voiceOver.act();
  await voiceOver.type(ADMIN_PASS);

  // Submit form
  await voiceOver.next();
  await voiceOver.act();

  // Wait for login to complete
  await page.waitForLoadState("networkidle");
}

/**
 * Wait for VoiceOver to announce text containing a specific string.
 */
async function waitForAnnouncement(
  voiceOver: any,
  searchText: string,
  maxSteps = 50
): Promise<string | null> {
  for (let i = 0; i < maxSteps; i++) {
    const text = await voiceOver.itemText();
    if (text.toLowerCase().includes(searchText.toLowerCase())) {
      return text;
    }
    await voiceOver.next();
  }
  return null;
}

// ── Tests ────────────────────────────────────────────────────────────────────

test.describe("Guidepup — Drupal Admin Accessibility", () => {
  test("can login to Drupal admin", async ({ page, voiceOver }) => {
    await loginWithVoiceOver(page, voiceOver);

    // Verify we're logged in by checking for admin content
    const log = await voiceOver.spokenPhraseLog();
    const isLoggedIn = log.some(
      (phrase) =>
        phrase.includes("Content") ||
        phrase.includes("admin") ||
        phrase.includes("Dashboard")
    );

    expect(isLoggedIn, "Should be logged in to admin").toBeTruthy();
  });

  test("can navigate admin toolbar", async ({ page, voiceOver }) => {
    await loginWithVoiceOver(page, voiceOver);
    await page.goto(`${BASE_URL}/admin/content`, { waitUntil: "networkidle" });
    await voiceOver.navigateToWebContent();

    // Find navigation landmark
    const navText = await waitForAnnouncement(voiceOver, "navigation");
    expect(navText, "Should find navigation landmark").toBeTruthy();

    // Interact with navigation
    await voiceOver.interact();

    // Find Content link
    const contentLink = await waitForAnnouncement(voiceOver, "Content");
    expect(contentLink, "Should find Content link in navigation").toBeTruthy();

    await voiceOver.stopInteracting();
  });

  test("can navigate content listing table", async ({ page, voiceOver }) => {
    await loginWithVoiceOver(page, voiceOver);
    await page.goto(`${BASE_URL}/admin/content`, { waitUntil: "networkidle" });
    await voiceOver.navigateToWebContent();

    // Find table
    const tableText = await waitForAnnouncement(voiceOver, "table");
    expect(tableText, "Should find content table").toBeTruthy();

    // Navigate through table rows
    await voiceOver.interact();

    // Find first row
    const rowText = await waitForAnnouncement(voiceOver, "row");
    expect(rowText, "Should find table row").toBeTruthy();

    await voiceOver.stopInteracting();
  });

  test("can navigate to content creation form", async ({ page, voiceOver }) => {
    await loginWithVoiceOver(page, voiceOver);
    await page.goto(`${BASE_URL}/node/add/article`, { waitUntil: "networkidle" });
    await voiceOver.navigateToWebContent();

    // Find title field
    const titleText = await waitForAnnouncement(voiceOver, "Title");
    expect(titleText, "Should find Title field").toBeTruthy();

    // Verify it's a textbox
    expect(titleText?.includes("textbox"), "Title should be a textbox").toBeTruthy();
  });

  test("form fields have accessible names", async ({ page, voiceOver }) => {
    await loginWithVoiceOver(page, voiceOver);
    await page.goto(`${BASE_URL}/node/add/article`, { waitUntil: "networkidle" });
    await voiceOver.navigateToWebContent();

    const log = await voiceOver.spokenPhraseLog();

    // Check that form fields have labels
    const textboxes = log.filter((phrase) => phrase.startsWith("textbox"));
    for (const textbox of textboxes) {
      // Each textbox should have a label (comma-separated)
      expect(
        textbox.includes(","),
        `Textbox should have label: ${textbox}`
      ).toBeTruthy();
    }
  });

  test("skip link is accessible", async ({ page, voiceOver }) => {
    await page.goto(BASE_URL, { waitUntil: "networkidle" });
    await voiceOver.navigateToWebContent();

    // Find skip link
    const skipLink = await waitForAnnouncement(voiceOver, "Skip to main content");
    expect(skipLink, "Should find skip link").toBeTruthy();

    // Verify it's a link
    expect(skipLink?.includes("link"), "Skip link should be announced as link").toBeTruthy();
  });

  test("headings are properly structured", async ({ page, voiceOver }) => {
    await page.goto(BASE_URL, { waitUntil: "networkidle" });
    await voiceOver.navigateToWebContent();

    const headings: string[] = [];
    let headingCount = 0;

    // Collect first few headings
    for (let i = 0; i < 20; i++) {
      await voiceOver.perform(voiceOver.keyboardCommands.findNextHeading);
      const text = await voiceOver.itemText();
      if (text.includes("heading")) {
        headings.push(text);
        headingCount++;
        if (headingCount >= 3) break;
      }
    }

    // Should have at least one heading
    expect(headings.length, "Should find headings on page").toBeGreaterThan(0);

    // Log headings for manual review
    console.log("Headings found:", headings);
  });

  test("landmarks are present", async ({ page, voiceOver }) => {
    await page.goto(BASE_URL, { waitUntil: "networkidle" });
    await voiceOver.navigateToWebContent();

    const log = await voiceOver.spokenPhraseLog();

    // Check for essential landmarks
    const hasMain = log.some((phrase) => phrase === "main");
    const hasNav = log.some((phrase) => phrase.startsWith("navigation"));
    const hasBanner = log.some(
      (phrase) => phrase === "banner" || phrase.includes("banner")
    );

    expect(hasMain, "Should have main landmark").toBeTruthy();
    expect(hasNav, "Should have navigation landmark").toBeTruthy();
    expect(hasBanner, "Should have banner landmark").toBeTruthy();
  });
});

// ── Issue-Specific Tests ─────────────────────────────────────────────────────

test.describe("Guidepup — Issue #2608212: Exposed Filters Accessible Names", () => {
  test("exposed filter form elements have accessible names", async ({
    page,
    voiceOver,
  }) => {
    // Login first
    await loginWithVoiceOver(page, voiceOver);

    // Navigate to Views admin
    await page.goto(`${BASE_URL}/admin/structure/views`, {
      waitUntil: "networkidle",
    });
    await voiceOver.navigateToWebContent();

    // Find Content view
    const contentView = await waitForAnnouncement(voiceOver, "Content");
    expect(contentView, "Should find Content view").toBeTruthy();

    // Find Edit button
    const editButton = await waitForAnnouncement(voiceOver, "Edit");
    expect(editButton, "Should find Edit button").toBeTruthy();

    // Click Edit
    await voiceOver.act();
    await page.waitForLoadState("networkidle");

    // Find Filter criteria section
    const filterSection = await waitForAnnouncement(voiceOver, "Filter criteria");
    expect(filterSection, "Should find Filter criteria section").toBeTruthy();

    // Capture the full spoken phrase log
    const log = await voiceOver.spokenPhraseLog();

    // Analyze for missing accessible names
    const issues: Array<{ type: string; position: number; phrase: string }> = [];

    for (let i = 0; i < log.length; i++) {
      const phrase = log[i];

      // Check for textboxes without proper labels
      if (phrase.startsWith("textbox") && !phrase.includes(",")) {
        issues.push({
          type: "missing-label",
          position: i,
          phrase: phrase,
        });
      }

      // Check for select elements without labels
      if (phrase.startsWith("pop up button") && !phrase.includes(",")) {
        issues.push({
          type: "missing-label",
          position: i,
          phrase: phrase,
        });
      }
    }

    // Log findings
    console.log("Total spoken phrases:", log.length);
    console.log("Issues found:", issues.length);
    if (issues.length > 0) {
      console.log("Issue details:", issues);
    }

    // Test fails if issues are found
    expect(
      issues,
      `Found ${issues.length} form elements without accessible names`
    ).toEqual([]);
  });
});
