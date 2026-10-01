# Guidepup Real Screen Reader Testing for Drupal

A practical guide to using [Guidepup](https://guidepup.dev) with real VoiceOver/NVDA to test Drupal's accessibility by automating actual screen reader interactions.

---

## What This Covers

Guidepup provides JavaScript-based screen reader automation. The **real screen reader** approach drives actual VoiceOver (macOS) or NVDA (Windows) software — testing what users actually experience, not just what the accessibility tree would theoretically announce.

### Package Overview

| Package | Purpose |
|---------|---------|
| `@guidepup/guidepup` | Core library for real screen reader automation |
| `@guidepup/playwright` | Drives real VoiceOver/NVDA via Playwright |
| `@guidepup/setup` | Environment setup for screen reader automation |
| `@guidepup/virtual-screen-reader` | Simulates accessibility tree (no real AT needed) |

This guide focuses on `@guidepup/playwright` — the combination that drives real VoiceOver/NVDA through Playwright.

---

## When to Use Real VoiceOver vs. Virtual SR

| Aspect | Virtual SR | Real VoiceOver |
|--------|------------|----------------|
| **Speed** | Fast (milliseconds) | Slower (seconds per action) |
| **OS Requirement** | Any OS | macOS (VoiceOver) or Windows (NVDA) |
| **Browser Mode** | Headless or headed | Must be headed |
| **What it tests** | Semantic structure (W3C specs) | Actual AT behavior |
| **Keyboard traps** | Cannot detect | Can detect |
| **Focus order** | Limited detection | Real detection |
| **AT quirks** | Not tested | Tests actual VoiceOver behavior |
| **CI/CD friendly** | Yes | No (requires real AT software) |
| **False positives** | More likely | Fewer |
| **Setup complexity** | Simple | Complex |

**Recommendation:** Use virtual SR for fast CI/CD checks. Use real VoiceOver for critical user flows and pre-release validation.

---

## Prerequisites

- macOS with VoiceOver (or Windows with NVDA)
- A running Drupal site (DDEV recommended)
- Node.js >= 22

---

## Setup

### Machine Setup (One-Time)

```bash
# Configure your machine for screen reader automation
npx @guidepup/setup setup
```

This command configures your machine for screen reader automation and only needs to be run once per machine.

### Install Dependencies

```bash
# Install Guidepup packages
npm install --save-dev @guidepup/guidepup @guidepup/playwright @playwright/test

# Install WebKit browser for Playwright (recommended for VoiceOver)
npx playwright install webkit

# Install screen reader assets
npx @guidepup/setup install
```

Run `npx @guidepup/setup install` again after upgrading `@guidepup/guidepup` so that the matching assets are available.

---

## Playwright Configuration

Create `playwright-guidepup.config.js` (or `.ts` for TypeScript):

```javascript
const { screenReaderConfig } = require("@guidepup/playwright");
const { devices } = require("@playwright/test");

const config = {
  ...screenReaderConfig,
  timeout: 3 * 60 * 1000, // 3 minutes for VoiceOver operations
  retries: 2,
  projects: [
    {
      name: "webkit",
      use: {
        ...devices["Desktop Safari"],
        headless: false, // MUST be false for VoiceOver
      },
    },
  ],
};

module.exports = config;
```

### Key Configuration Notes

- **`headless: false`** — VoiceOver needs a visible browser window
- **Single worker** — VoiceOver can only control one browser at a time
- **Longer timeout** — VoiceOver automation is slower than typical Playwright tests
- **WebKit recommended** — Best VoiceOver integration on macOS

---

## Basic Examples

### Login to Drupal Admin

```typescript
import { voiceOverTest as test } from "@guidepup/playwright";

test("login to Drupal admin", async ({ page, voiceOver }) => {
  await page.goto("http://drupal-core.ddev.site/user/login");
  await voiceOver.navigateToWebContent();

  // Find username field
  while ((await voiceOver.itemText()) !== "Username") {
    await voiceOver.next();
  }

  // Type username
  await voiceOver.act();
  await voiceOver.type("admin");

  // Move to password field
  await voiceOver.next();
  await voiceOver.act();
  await voiceOver.type("admin");

  // Submit form
  await voiceOver.next();
  await voiceOver.act();

  // Wait for login to complete
  await page.waitForLoadState("networkidle");
});
```

### Navigate Admin Menu

```typescript
test("navigate admin menu", async ({ page, voiceOver }) => {
  await page.goto("http://drupal-core.ddev.site/admin/content");
  await voiceOver.navigateToWebContent();

  // Find navigation landmark
  while (!(await voiceOver.itemText()).includes("navigation")) {
    await voiceOver.next();
  }

  // Interact with navigation
  await voiceOver.interact();

  // Find "Content" link
  while (!(await voiceOver.itemText()).includes("Content")) {
    await voiceOver.next();
  }

  await voiceOver.act();
});
```

### Find and Navigate Headings

```typescript
test("navigate by headings", async ({ page, voiceOver }) => {
  await page.goto("http://drupal-core.ddev.site/");
  await voiceOver.navigateToWebContent();

  // Use heading navigation
  await voiceOver.perform(voiceOver.keyboardCommands.findNextHeading);

  const heading = await voiceOver.itemText();
  console.log("First heading:", heading);

  // Find next heading
  await voiceOver.perform(voiceOver.keyboardCommands.findNextHeading);
  const nextHeading = await voiceOver.itemText();
  console.log("Next heading:", nextHeading);
});
```

---

## Common VoiceOver Commands for Drupal

| Command | VoiceOver Key | Guidepup API |
|---------|---------------|--------------|
| Next item | VO+Right | `voiceOver.next()` |
| Previous item | VO+Left | `voiceOver.previous()` |
| Interact | VO+Shift+Down | `voiceOver.interact()` |
| Stop interacting | VO+Shift+Up | `voiceOver.stopInteracting()` |
| Activate | VO+Space | `voiceOver.act()` |
| Find next heading | VO+Command+H | `voiceOver.perform(voiceOver.keyboardCommands.findNextHeading)` |
| Find previous heading | VO+Command+Shift+H | `voiceOver.perform(voiceOver.keyboardCommands.findPreviousHeading)` |
| Find next link | VO+Command+L | `voiceOver.perform(voiceOver.keyboardCommands.findNextLink)` |
| Find next form control | VO+Command+J | `voiceOver.perform(voiceOver.keyboardCommands.findNextFormField)` |
| Find next landmark | VO+Command+U | `voiceOver.perform(voiceOver.keyboardCommands.findNextLandmark)` |
| Read all | VO+A | `voiceOver.perform(voiceOver.keyboardCommands.readAll)` |

---

## Testing Drupal Admin Workflows

### Content Creation Flow

```typescript
test("create content with VoiceOver", async ({ page, voiceOver }) => {
  // Navigate to content creation
  await page.goto("http://drupal-core.ddev.site/node/add/article");
  await voiceOver.navigateToWebContent();

  // Find title field
  while (!(await voiceOver.itemText()).includes("Title")) {
    await voiceOver.next();
  }

  // Type title
  await voiceOver.act();
  await voiceOver.type("Test Article");

  // Move to body field
  while (!(await voiceOver.itemText()).includes("Body")) {
    await voiceOver.next();
  }

  // Type body
  await voiceOver.act();
  await voiceOver.type("This is a test article body.");

  // Find save button
  while (!(await voiceOver.itemText()).includes("Save")) {
    await voiceOver.next();
  }

  await voiceOver.act();

  // Verify success
  const log = await voiceOver.spokenPhraseLog();
  expect(log.some(phrase => phrase.includes("has been created"))).toBeTruthy();
});
```

### Form Validation

```typescript
test("form validation with VoiceOver", async ({ page, voiceOver }) => {
  await page.goto("http://drupal-core.ddev.site/node/add/article");
  await voiceOver.navigateToWebContent();

  // Submit form without filling required fields
  while (!(await voiceOver.itemText()).includes("Save")) {
    await voiceOver.next();
  }
  await voiceOver.act();

  // Check for error messages
  const log = await voiceOver.spokenPhraseLog();
  const hasError = log.some(phrase => 
    phrase.includes("error") || phrase.includes("required")
  );

  expect(hasError).toBeTruthy();
});
```

### Modal Dialog Testing

```typescript
test("modal dialog with VoiceOver", async ({ page, voiceOver }) => {
  await page.goto("http://drupal-core.ddev.site/dialog");
  await voiceOver.navigateToWebContent();

  // Find modal trigger
  while (!(await voiceOver.itemText()).includes("Open modal")) {
    await voiceOver.next();
  }

  // Open modal
  await voiceOver.act();

  // Verify modal is announced
  const log = await voiceOver.spokenPhraseLog();
  const hasDialog = log.some(phrase => 
    phrase.includes("dialog") || phrase.includes("modal")
  );

  expect(hasDialog).toBeTruthy();

  // Close modal with Escape
  await voiceOver.press("Escape");

  // Verify focus returns to trigger
  const focusedElement = await voiceOver.itemText();
  expect(focusedElement).toContain("Open modal");
});
```

---

## Testing Specific Drupal Issues

### Issue #2608212: Exposed Filters Missing Accessible Names

This issue is about form controls on the Views exposed filters grouped form missing accessible names. The patch adds `#title` properties with appropriate text.

```typescript
import { voiceOverTest as test } from "@guidepup/playwright";

test("validate issue #2608212 - exposed filters accessible names", async ({ page, voiceOver }) => {
  // Navigate to Views admin
  await page.goto("http://drupal-core.ddev.site/admin/structure/views");
  await voiceOver.navigateToWebContent();

  // Find Content view
  while (!(await voiceOver.itemText()).includes("Content")) {
    await voiceOver.next();
  }
  await voiceOver.act();

  // Find Edit button
  while (!(await voiceOver.itemText()).includes("Edit")) {
    await voiceOver.next();
  }
  await voiceOver.act();

  // Find Filter criteria section
  while (!(await voiceOver.itemText()).includes("Filter criteria")) {
    await voiceOver.next();
  }

  // Find published filter
  while (!(await voiceOver.itemText()).includes("published")) {
    await voiceOver.next();
  }

  // Open filter settings
  await voiceOver.act();

  // Look for grouped filter settings
  while (!(await voiceOver.itemText()).includes("Grouped filters")) {
    await voiceOver.next();
  }

  // Capture spoken phrases
  const log = await voiceOver.spokenPhraseLog();

  // Validate that form elements have accessible names
  const issues = [];
  for (let i = 0; i < log.length; i++) {
    const phrase = log[i];
    
    // Check for textboxes without proper labels
    if (phrase.startsWith("textbox") && !phrase.includes(",")) {
      issues.push({
        type: "missing-label",
        position: i,
        phrase: phrase
      });
    }
    
    // Check for select elements without labels
    if (phrase.startsWith("pop up button") && !phrase.includes(",")) {
      issues.push({
        type: "missing-label",
        position: i,
        phrase: phrase
      });
    }
  }

  // Log findings
  console.log("Spoken phrases:", log);
  console.log("Issues found:", issues);

  // Test fails if issues are found
  expect(issues).toEqual([]);
});
```

---

## Combining Virtual SR and Real VoiceOver

For comprehensive testing, use both approaches:

### Fast CI/CD Checks (Virtual SR)

```typescript
import { test, expect } from "@playwright/test";
import { injectVirtualSR, getSpokenPhraseLog, analyzeVirtualSR } from "../lib/virtual-sr";

test("virtual SR - exposed filters", async ({ page }) => {
  await page.goto("/admin/structure/views");
  await injectVirtualSR(page);
  const log = await getSpokenPhraseLog(page);
  const findings = analyzeVirtualSR(log);

  // Check for missing labels
  const missingLabels = findings.filter(f => 
    f.rule === "empty-link" || f.rule === "missing-label"
  );
  expect(missingLabels).toEqual([]);
});
```

### Pre-Release Validation (Real VoiceOver)

```typescript
import { voiceOverTest as test } from "@guidepup/playwright";

test("VoiceOver - exposed filters", async ({ page, voiceOver }) => {
  await page.goto("/admin/structure/views");
  await voiceOver.navigateToWebContent();

  // Navigate to filters
  while (!(await voiceOver.itemText()).includes("Filter criteria")) {
    await voiceOver.next();
  }

  // Capture and analyze
  const log = await voiceOver.spokenPhraseLog();
  const hasMissingLabels = log.some(phrase => 
    phrase.includes("textbox, ") && phrase.split(", ").length < 2
  );

  expect(hasMissingLabels).toBeFalsy();
});
```

---

## Using AI to Test Patches

AI assistants can help you:

1. **Analyze the patch** — Read the Drupal issue and understand what the patch does
2. **Generate test scripts** — Create Guidepup test scripts based on the patch
3. **Interpret results** — Analyze the spoken phrase log and identify issues
4. **Suggest fixes** — Recommend changes based on findings

### Example: AI-Assisted Testing Workflow

```
User: "Can you use Guidepup to validate the patch for issue #2608212?"

AI Assistant:
1. Reads the Drupal issue to understand the problem
2. Identifies the affected form (Views exposed filters)
3. Generates a test script that:
   - Navigates to the affected page
   - Interacts with the form elements
   - Captures the spoken phrase log
   - Analyzes for missing accessible names
4. Runs the test and reports findings
```

### AI Test Generation Prompt

```
Create a Guidepup test that:
1. Navigates to [specific Drupal page]
2. Interacts with [specific UI element]
3. Validates that [accessibility requirement]
4. Reports any issues found in the spoken phrase log
```

---

## Interpreting Results

### Spoken Phrase Log Analysis

The `spokenPhraseLog()` returns an array of strings describing what VoiceOver announced at each step. Look for:

| Pattern | Meaning |
|---------|---------|
| `"link, Skip to main content"` | Skip link is accessible |
| `"main"` | Main landmark is present |
| `"heading, Title, level 1"` | Heading has proper structure |
| `"textbox, Username, required"` | Form field has label |
| `"button, Save"` | Button has accessible name |
| `"navigation, Admin sidebar"` | Landmark has accessible name |

### Common Issues

| Pattern | Issue |
|---------|-------|
| `"textbox, "` with no label | Missing accessible name |
| `"button, "` with no label | Missing accessible name |
| `"link, "` with no text | Empty link |
| No `"main"` in log | Missing main landmark |
| Heading level skip | Heading hierarchy broken |

### Comparing with Virtual SR

```typescript
const virtualLog = await getVirtualSRLog(page);
const voiceOverLog = await voiceOver.spokenPhraseLog();

// Compare structure
const virtualHasMain = virtualLog.some(phrase => phrase === "main");
const voiceOverHasMain = voiceOverLog.some(phrase => phrase.includes("main"));

console.log("Virtual SR detects main:", virtualHasMain);
console.log("VoiceOver detects main:", voiceOverHasMain);
```

---

## Troubleshooting

### VoiceOver Not Starting

```bash
# Check if VoiceOver is enabled
osascript -e 'tell application "System Events" to get enabled of process "VoiceOver"'

# Enable VoiceOver if needed
osascript -e 'tell application "System Events" to set enabled of process "VoiceOver" to true'
```

### Browser Not Visible

```typescript
// Ensure headed mode in config
const config = {
  projects: [
    {
      name: "webkit",
      use: {
        headless: false, // MUST be false
        ...devices["Desktop Safari"]
      },
    },
  ],
};
```

### Timeouts

```typescript
// Increase timeout for VoiceOver operations
test.setTimeout(180000); // 3 minutes

// Or in config
const config = {
  timeout: 3 * 60 * 1000,
};
```

### macOS Permissions

```bash
# Grant accessibility permissions to Terminal
# System Preferences > Security & Privacy > Privacy > Accessibility
# Add Terminal.app (or your IDE)
```

### VoiceOver Gets Stuck

```typescript
// Use try/finally to ensure VoiceOver is stopped
test("my test", async ({ page, voiceOver }) => {
  try {
    await voiceOver.start();
    // ... your test code
  } finally {
    await voiceOver.stop();
  }
});
```

### Focus Issues

```typescript
// Wait for page to be ready before VoiceOver navigation
await page.goto(url, { waitUntil: "networkidle" });
await voiceOver.navigateToWebContent();

// Small delay for VoiceOver to catch up
await page.waitForTimeout(500);
```

---

## Running the Tests

### Real VoiceOver Tests

```bash
# Run with Playwright
npx playwright test tests/playwright/guidepup-drupal-admin.spec.ts

# Run in headed mode (required for VoiceOver)
npx playwright test --headed

# Run with specific config
npx playwright test --config=playwright-guidepup.config.js
```

### Virtual SR Tests

```bash
# Run virtual SR tests
npx playwright test --grep "Virtual SR"

# Run all accessibility tests
npx playwright test
```

### Both Approaches

```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test tests/playwright/a11y-virtual-sr-crawl.spec.ts
```

---

## References

- [Guidepup Documentation](https://www.guidepup.dev/)
- [Guidepup Playwright Integration](https://github.com/guidepup/guidepup-playwright)
- [VoiceOver Commands](https://support.apple.com/en-gb/guide/voiceover/vo14111/mac)
- [NVDA User Guide](https://www.nvaccess.org/files/nvda/documentation/userGuide.html)
- [W3C ACCNAME 1.2](https://www.w3.org/TR/accname-1.2/)
- [W3C CORE-AAM 1.2](https://www.w3.org/TR/core-aam-1.2/)
- [W3C HTML-AAM 1.0](https://www.w3.org/TR/html-aam-1.0/)

---

## Drupal Core Integration

This approach complements the existing virtual SR testing in Drupal core. The implementation lives in:

| File | Purpose |
|------|---------|
| `GUIDE-TO-GUIDEUP-AND-AXE-IN-DRUPAL.md` | Virtual SR + axe-core approach |
| `tests/playwright/lib/virtual-sr.ts` | Virtual SR helpers |
| `tests/playwright/tests/a11y-virtual-sr-crawl.spec.ts` | Full-site virtual SR crawl |
| `tests/playwright/tests/a11y-modal-sr.spec.ts` | Virtual SR for modal dialogs |

### Running the Integrated Tests

```bash
cd tests/playwright

# Install dependencies (first time only)
npm install

# Run virtual SR crawl (~3 min)
NODE_TLS_REJECT_UNAUTHORIZED=0 npx playwright test --grep "Virtual SR"

# Run all Guidepup tests
NODE_TLS_REJECT_UNAUTHORIZED=0 npx playwright test
```

---

## CI/CD Integration

### Important: Real VoiceOver Cannot Run in CI/CD

Real VoiceOver tests require:
- A visible browser window (headless: false)
- Actual VoiceOver software installed (macOS only)
- Accessibility permissions

**Use virtual SR for CI/CD** — it's fast, works headless, and runs on any OS.

### Virtual SR in CI/CD

The Drupal core GitLab CI pipeline already includes accessibility testing. Here's how to add virtual SR:

#### 1. Add to `.gitlab-ci.yml`

```yaml
'🎭 Playwright A11y':
  stage: 🗜️ Additional tests
  rules:
    - if: $CI_PIPELINE_SOURCE == "schedule"
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
      changes:
        - "core/tests/playwright/**/*"
        - "core/themes/olivero/**/*.twig"
        - "core/themes/claro/**/*.twig"
    - when: manual
  script:
    # Run axe-core crawl
    - npx playwright test --config=tests/playwright/playwright.config.ts
      tests/playwright/tests/a11y-axe-crawl.spec.ts
    
    # Run virtual SR crawl (new)
    - npx playwright test --config=tests/playwright/playwright.config.ts
      tests/playwright/tests/a11y-virtual-sr-crawl.spec.ts
    
    # Run pattern analysis
    - node tests/playwright/scripts/analyze-patterns.js
```

#### 2. Run CI/CD Script Locally

```bash
# Run the CI/CD script locally
node tests/playwright/scripts/run-virtual-sr-ci.ts

# This generates:
# - tests/playwright/reports/virtual-sr-ci-report.json
# - tests/playwright/reports/virtual-sr-ci-report.md
```

### Automated Test Generation

Instead of manually writing tests for every issue, use the AI test generator:

```bash
# Generate a test from a Drupal issue URL
node tests/playwright/scripts/generate-test.js https://www.drupal.org/project/drupal/issues/2608212

# Generate a detailed test with custom output
node tests/playwright/scripts/generate-test.js https://www.drupal.org/project/drupal/issues/2608212 --template detailed

# Preview what would be generated
node tests/playwright/scripts/generate-test.js https://www.drupal.org/project/drupal/issues/2608212 --dry-run
```

### AI-Assisted Testing Workflow

```
1. Developer creates patch
   ↓
2. AI reads the issue and generates a test
   node tests/playwright/scripts/generate-test.js <issue-url>
   ↓
3. CI/CD runs the test
   npx playwright test tests/playwright/tests/a11y-issue-*.spec.ts
   ↓
4. AI interprets results
   node tests/playwright/scripts/interpret-results.js
   ↓
5. Report posted to MR
```

### Example: Validating Issue #2608212

```bash
# 1. Generate test for the issue
node tests/playwright/scripts/generate-test.js https://www.drupal.org/project/drupal/issues/2608212

# 2. Run the generated test
cd tests/playwright
npx playwright test a11y-issue-2608212.spec.ts

# 3. Interpret results
node scripts/interpret-results.js

# 4. Review the analysis
cat reports/analysis/ANALYSIS.md
```

### Combining Virtual SR and Real VoiceOver

#### For CI/CD (Fast, Automated)

```yaml
# Virtual SR tests run on every MR
'🎭 Playwright A11y':
  script:
    - npx playwright test --grep "Virtual SR"
```

#### For Local Development (Thorough, Manual)

```bash
# Real VoiceOver tests run locally
npx playwright test guidepup-drupal-admin --headed
```

#### For Pre-Release Validation (Both)

```bash
# Run all tests before release
npx playwright test

# Generate comprehensive report
node tests/playwright/scripts/interpret-results.js
```

---

## AI Integration

### How AI Can Help

1. **Analyze issues** — AI reads Drupal issues and identifies what to test
2. **Generate tests** — AI creates test scripts based on issue descriptions
3. **Interpret results** — AI analyzes spoken phrase logs and identifies issues
4. **Suggest fixes** — AI recommends code changes based on findings

### Example AI Prompts

```
# Analyze a Drupal issue
"Analyze https://www.drupal.org/project/drupal/issues/2608212 and tell me:
- What accessibility problem does it fix?
- Which pages/forms are affected?
- What should I test to verify the fix?"

# Generate a test
"Create a Guidepup virtual SR test that:
- Navigates to the Views exposed filters form
- Checks that all form elements have accessible names
- Reports any issues found"

# Interpret results
"Here's the spoken phrase log from my test:
[paste log]
What accessibility issues does it reveal?"

# Suggest fixes
"The test shows these form elements are missing labels:
[paste findings]
How do I fix this in Drupal's Form API?"
```

### AI Test Generation Script

```bash
# Generate a test from an issue URL
node tests/playwright/scripts/generate-test.js https://www.drupal.org/project/drupal/issues/2608212

# This creates a test file that:
# 1. Navigates to affected pages
# 2. Runs virtual SR analysis
# 3. Checks for expected fixes
# 4. Reports findings
```

### AI Results Interpreter

```bash
# Analyze test results
node tests/playwright/scripts/interpret-results.js

# This generates:
# - Console output with human-readable analysis
# - JSON file with structured insights
# - Markdown file for MR comments
```

---

## Next Steps

1. **Start with virtual SR** — Fast, works on any OS, good for CI/CD
2. **Add real VoiceOver for critical flows** — Login, content creation, forms
3. **Combine both approaches** — Virtual SR for regression, VoiceOver for validation
4. **Use AI to generate tests** — Describe the issue, let AI create the test script
5. **Contribute to Drupal core** — Add tests for accessibility issues you find
6. **Integrate with CI/CD** — Run virtual SR tests on every MR
7. **Automate patch validation** — Use AI to generate and run tests for patches
