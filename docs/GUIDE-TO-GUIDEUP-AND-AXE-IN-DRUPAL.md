# Guidepup Virtual Screen Reader + Axe-Core for Drupal

A practical guide to using [Guidepup](https://guidepup.dev) virtual screen reader with axe-core to validate Drupal's accessibility output.

---

## What This Covers

Guidepup provides JavaScript-based screen reader automation. The **virtual screen reader** simulates the accessibility tree — what a screen reader *would* announce based on W3C specs. Combined with **axe-core**, you get both semantic validation and automated WCAG checks in a single pass.

### Package Overview

| Package | Purpose |
|---------|---------|
| `@guidepup/virtual-screen-reader` | Simulates the accessibility tree from DOM — no real screen reader needed |
| `@guidepup/jest` | Snapshot matchers for regression testing virtual SR output |
| `@guidepup/playwright` | Drives real VoiceOver/NVDA via Playwright (requires macOS/Windows) |
| `@guidepup/guidepup` | Core library for real screen reader automation |
| `@guidepup/setup` | Environment setup for screen reader automation |
| `@axe-core/playwright` | Automated WCAG checks integrated with Playwright |

This guide focuses on `@guidepup/virtual-screen-reader` + `@axe-core/playwright` — the combination that works on any OS without requiring a real screen reader.

> **Want to test with real VoiceOver/NVDA?** See [Guidepup Real Screen Reader Testing](GUIDEUP-REAL-SCREEN-READER-TESTING.md) for driving actual assistive technology through Playwright.

---

## Setup

### Prerequisites

- Node.js >= 22
- A running Drupal site (DDEV recommended)
- Playwright installed

### Install

```bash
npm install --save-dev @guidepup/virtual-screen-reader @axe-core/playwright @playwright/test
npx playwright install chromium
```

### Project Structure

```
your-project/
  playwright.config.ts
  tests/
    drupal-audit.spec.ts
```

---

## Playwright Config

```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 180_000,
  use: {
    headless: true,
    ignoreHTTPSErrors: true,
  },
});
```

---

## Writing a Combined Audit Test

### 1. Inject the Virtual Screen Reader

The virtual SR runs in-browser. Inject it as a script tag before auditing:

```ts
async function injectVirtualScreenReader(page: any) {
  await page.addScriptTag({
    url: "https://unpkg.com/@guidepup/virtual-screen-reader/lib/esm/index.browser.js",
    type: "module",
  });
  await page.addScriptTag({
    content: `
      import { virtual } from "https://unpkg.com/@guidepup/virtual-screen-reader/lib/esm/index.browser.js";
      window.virtual = virtual;
    `,
    type: "module",
  });
}
```

### 2. Audit a Page

Navigate through the entire accessibility tree and collect the spoken phrase log:

```ts
async function auditPage(page: any): Promise<string[]> {
  await page.evaluate(async () => {
    await window.virtual.start({ container: document.body });
  });

  await page.evaluate(async () => {
    while ((await window.virtual.lastSpokenPhrase()) !== "end of document") {
      await window.virtual.next();
    }
  });

  const log = await page.evaluate(async () => {
    return await window.virtual.spokenPhraseLog();
  });

  await page.evaluate(async () => {
    await window.virtual.stop();
  });

  return log;
}
```

### 3. Run axe-core on the Same Page

```ts
import AxeBuilder from "@axe-core/playwright";

const axeResults = await new AxeBuilder({ page })
  .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"])
  .analyze();
```

### 4. Cross-Reference Results

The key insight: compare what each tool finds to distinguish real barriers from false positives.

| Scenario | Meaning |
|----------|---------|
| Both tools flag | **Confirmed barrier** — fix it |
| Axe only | Visual/structural issue — tree is correct, CSS or HTML needs fixing |
| Virtual SR only | Semantic issue — tree is wrong, but axe doesn't catch it |
| Neither flag | Likely OK |

---

## Interpreting the Virtual SR Output

The spoken phrase log is an array of strings describing what a screen reader announces at each step. Here's what to look for:

### Clean Output (No Issues)

```json
[
  "document",
  "link, Skip to main content",
  "main",
  "heading, Page Title, level 1",
  "paragraph",
  "Body text content.",
  "end of paragraph",
  "contentinfo",
  "link, Home",
  "end of contentinfo",
  "end of document"
]
```

This shows: skip link, main landmark, heading, paragraph, footer with link. All good.

### Patterns That Indicate Issues

| Pattern | Issue |
|---------|-------|
| `"link"` followed by `"end of link"` with no text between | Empty link — no accessible name |
| `"button"` followed by `"end of button"` with no text | Empty button — no accessible name |
| `"image"` with no comma (no alt text) | Missing alt attribute |
| `"heading, X, level N"` where N > previous + 1 | Heading level skip |
| No `"main"` in the log | Missing main landmark |
| No `"navigation"` in the log | Missing nav landmark |
| `"textbox"` without preceding label text | Possibly unlabeled input |

### What the Virtual SR Can't Detect

- Keyboard traps or focus order problems
- Color contrast failures (visual, not semantic)
- CSS-hidden content that screen readers still read
- Dynamic content updates (aria-live behavior)
- Actual screen reader quirks (VoiceOver/NVDA may announce differently than specs)

This is why combining with axe-core matters.

---

## Drupal-Specific Considerations

### Admin Sidebar

Drupal's admin interface includes an `Administrative sidebar` navigation landmark. The virtual SR will announce:

```
navigation, Administrative sidebar
heading, Administrative sidebar, level 2
link, Content
link, Blocks
...
```

This is correct — the sidebar is properly structured as a navigation landmark with headings.

### Olivero Theme

Olivero uses:
- `banner` landmark for the header
- `main` landmark for content
- `contentinfo` for the footer
- Skip link: `link, Skip to main content`

All of these appear correctly in the virtual SR output.

### Form Labels

Drupal's Form API generates proper `<label>` elements. The virtual SR announces:

```
Username
textbox, Username, required
Password
Password
button, Log in
```

The label text appears before the textbox, confirming the association is correct.

### Content Tables

The admin content listing uses proper table semantics:

```
table
rowgroup
row, ...
columnheader, Title
columnheader, Content type
...
rowgroup
row, ...
cell, Test Article
link, Test Article
...
```

Full table structure is announced correctly.

---

## Running the Audit

### Single Page

```bash
npx playwright test --grep "homepage"
```

### All Pages

```bash
npx playwright test
```

### With Authentication (Admin Pages)

```ts
async function loginToDrupal(page: any) {
  await page.goto("http://your-site/user/login", { waitUntil: "networkidle" });
  await page.fill('input[name="name"]', "admin");
  await page.fill('input[name="pass"]', "admin");
  await page.click('input[type="submit"]');
  await page.waitForLoadState("networkidle");
}
```

Call this before crawling admin pages.

---

## Reading the Results

### JSON Output Structure

```json
{
  "homepage": {
    "url": "http://your-site/",
    "status": 200,
    "axeViolationCount": 0,
    "virtualFindingCount": 0,
    "confirmedByBoth": 0,
    "virtualOnlyCount": 0,
    "axeOnlyCount": 0,
    "srLog": ["document", "link, Skip to main content", "..."]
  }
}
```

### Summary Table

The combined approach gives you:

- **High confidence** on confirmed issues (both tools agree)
- **Context** on axe-only issues (semantic tree is fine, visual/structural fix needed)
- **Visibility** into virtual-SR-only issues (semantic problems axe misses)
- **Baseline** for regression testing (snapshot the SR output, fail on changes)

---

## Extending the Approach

### Snapshot Testing with @guidepup/jest

For regression testing, use Jest snapshots to detect when a page's SR output changes:

```ts
import "@guidepup/jest";

test("homepage SR output matches snapshot", async () => {
  // ... inject and audit ...
  await expect(document.body).toMatchScreenReaderSnapshot();
});
```

### Real Screen Reader Testing with @guidepup/playwright

On macOS, you can drive real VoiceOver to validate against actual AT behavior:

```ts
import { voiceOverTest as test } from "@guidepup/playwright";

test("homepage with VoiceOver", async ({ page, voiceOver }) => {
  await page.goto("http://your-site/");
  await voiceOver.navigateToWebContent();

  while ((await voiceOver.itemText()) !== "heading level 1") {
    await voiceOver.perform(voiceOver.keyboardCommands.findNextHeading);
  }

  expect(await voiceOver.spokenPhraseLog()).toMatchSnapshot();
});
```

This requires `npx @guidepup/setup` and headed browser mode.

---

## References

- [Guidepup Documentation](https://www.guidepup.dev/)
- [Virtual Screen Reader API](https://www.guidepup.dev/docs/api/class-virtual)
- [axe-core Rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
- [W3C ACCNAME 1.2](https://www.w3.org/TR/accname-1.2/)
- [W3C CORE-AAM 1.2](https://www.w3.org/TR/core-aam-1.2/)
- [W3C HTML-AAM 1.0](https://www.w3.org/TR/html-aam-1.0/)

---

## Drupal Core Integration

This approach is integrated into Drupal core's accessibility testing suite, but lives outside `core/` to avoid shipping with core updates. The implementation lives in:

| File | Purpose |
|------|---------|
| `tests/playwright/lib/virtual-sr.ts` | Helpers: inject, audit, analyze, cross-reference |
| `tests/playwright/tests/a11y-virtual-sr-crawl.spec.ts` | Full-site multi-theme virtual SR crawl |
| `tests/playwright/tests/a11y-modal-sr.spec.ts` | Virtual SR validation for modal dialogs |

### Running the integrated tests

```bash
cd tests/playwright

# Install dependencies (first time only)
npm install

# Run the full virtual SR crawl across all themes and viewports (~3 min)
NODE_TLS_REJECT_UNAUTHORIZED=0 npx playwright test --grep "Virtual SR"

# Run just the modal dialog tests
NODE_TLS_REJECT_UNAUTHORIZED=0 npx playwright test --grep "Virtual SR.*modal"

# Or run all Guidepup tests
NODE_TLS_REJECT_UNAUTHORIZED=0 npx playwright test
```

### How it integrates with existing infrastructure

The virtual SR crawl reuses from `core/tests/playwright/lib/`:
- **Page inventory** (`pages.ts`) — same ~40+ pages as the axe crawl
- **Theme configs** (`theme-configs.ts`) — Olivero, Claro, Admin (with dark mode)
- **Auth setup** (`auth-setup.ts`) — pre-authenticated admin state
- **Shard helpers** (`crawl-finalize.ts`) — drush commands and settings capture

### Cross-reference workflow

When both tools run on the same page, the cross-reference logic (`crossReference()` in `lib/virtual-sr.ts`) categorizes findings:

```
Both tools flag → confirmed barrier (fix it)
Axe only → visual/structural issue (CSS or HTML fix)
Virtual SR only → semantic issue (accessibility tree is wrong)
Neither flag → likely OK
```

### Reports

Virtual SR results are written to:
- `tests/playwright/reports/virtual-sr-results-YYYY-MM-DD.json` — dated full results
- `tests/playwright/reports/virtual-sr-results.json` — always the latest scan

Each result includes the full spoken phrase log, findings, axe violations, and cross-reference analysis.

---

## Virtual SR vs. Real VoiceOver

This guide covers the **virtual screen reader** approach. For driving actual VoiceOver/NVDA, see [Guidepup Real Screen Reader Testing](GUIDEUP-REAL-SCREEN-READER-TESTING.md).

| Aspect | Virtual SR (This Guide) | Real VoiceOver (Other Guide) |
|--------|-------------------------|------------------------------|
| **Speed** | Fast (milliseconds) | Slower (seconds per action) |
| **OS Requirement** | Any OS | macOS (VoiceOver) or Windows (NVDA) |
| **Browser Mode** | Headless or headed | Must be headed |
| **What it tests** | Semantic structure (W3C specs) | Actual AT behavior |
| **Keyboard traps** | Cannot detect | Can detect |
| **CI/CD friendly** | Yes | No (requires real AT) |

**Recommendation:** Use virtual SR for fast CI/CD regression checks. Use real VoiceOver for critical user flows and pre-release validation.

### Example Tests

- **Virtual SR**: `tests/playwright/tests/a11y-virtual-sr-crawl.spec.ts`
- **Real VoiceOver**: `tests/playwright/guidepup-drupal-admin.spec.ts`

### Running Both Approaches

```bash
# Virtual SR (fast, any OS)
npx playwright test --grep "Virtual SR"

# Real VoiceOver (slow, macOS only, headed mode required)
npx playwright test guidepup-drupal-admin --headed
```
