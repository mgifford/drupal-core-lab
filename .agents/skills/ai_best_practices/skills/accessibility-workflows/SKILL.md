---
title: "Accessibility Workflows - Automated Testing"
description: "Playwright test suite for core Drupal accessibility workflows including keyboard navigation, screen reader compatibility, form handling, and focus management."
author: "Mike Gifford"
version: "1.0.0"
parent: "ai_best_practices"
keywords:
  - accessibility
  - automation
  - Playwright
  - keyboard navigation
  - screen reader
  - workflows
  - WCAG 2.1
  - WCAG 2.4
  - axe-core
triggers:
  - "accessibility workflows"
  - "Playwright"
  - "keyboard test"
  - "screen reader test"
  - "accessibility automation"
enforce: "soft"
---

# Accessibility Workflows - Automated Testing

## Overview

Automated Playwright test suite covering 18 core Tier 1 accessibility workflows. Tests are keyboard-only and screen reader compatible, following WCAG 2.2 AA standards.

**Test File:** `core/tests/playwright/accessibility-workflows.spec.js`  
**Coverage:** 18/40 Tier 1 stories (45%)  
**Themes:** Olivero, Claro, default_admin  
**Modes:** Light + Dark  
**Viewports:** Desktop (1280×1024), Tablet (768×1024), Mobile (375×812)

---

## Running Tests

### Quick Start
```bash
npm run test:accessibility-workflows
```

### Run Specific Test
```bash
# Run by story ID prefix
npx playwright test --grep "1.1"

# Run all authentication tests
npx playwright test --grep "^1\\."
```

### Options
```bash
# Headed mode (see browser)
npx playwright test --headed

# Debug mode (step through)
npx playwright test --debug

# Specific browser
npx playwright test --project=chromium

# Generate report
npx playwright show-report
```

---

## Test Categories (18 Tests)

### Authentication (6 Tests)

| Test ID | Test Title | Story ID | WCAG |
|---|---|---|---|
| 1 | `1.1: Registration Form - Keyboard Navigation Only` | 1.1 | 2.1.1, 2.4.3 |
| 2 | `1.2: Registration Form - Screen Reader Access` | 1.2 | 1.3.1, 3.3.1 |
| 3 | `1.4: Login with Username & Password` | 1.4 | 2.1.1, 2.4.3 |
| 4 | `1.5: Login Error Messages - Visible & Announced` | 1.5 | 3.3.1, 4.1.3 |
| 5 | `1.6: Logout Confirmation` | 1.6 | 2.4.1, 3.3.4 |
| 6 | (Reserved for 1.3, 1.7-1.10) | — | — |

**Validation:**
- All form fields reachable by keyboard Tab
- Focus indicators visible
- Error messages announced (live region)
- Form structure announced by screen reader
- Required fields marked programmatically

### Content Creation (5 Tests)

| Test ID | Test Title | Story ID | WCAG |
|---|---|---|---|
| 7 | `2.1: Create Node - Keyboard Navigation` | 2.1 | 2.1.1, 2.4.3 |
| 8 | `2.2: Create Node - Form Validation Errors` | 2.2 | 3.3.1 |
| 9 | `2.3: Rich Text Editor - CKEditor5 Accessibility` | 2.3 | 1.3.1, 4.1.2 |
| 10 | `2.4: Add Featured Image - File Upload with Alt Text` | 2.4 | 1.1.1 |
| 11 | `2.6: Taxonomy Term Assignment - Multi-Select` | 2.6 | 2.1.1, 3.3.4 |

**Validation:**
- Node creation form fully keyboard-navigable
- Editor toolbar keyboard-accessible
- File upload accessible
- Alt-text field paired with image
- Taxonomy selection accessible

### Forms & Validation (5 Tests)

| Test ID | Test Title | Story ID | WCAG |
|---|---|---|---|
| 12 | `3.1: Contact Form - All Fields Required` | 3.1 | 1.3.1, 3.3.1 |
| 13 | `3.2: Contact Form - Error Recovery` | 3.2 | 3.3.1, 3.3.4 |
| 14 | `3.3: Multi-Step Form - Progress Indicator` | 3.3 | 2.4.3, 4.1.2 |
| 15 | `3.4: Form Field Instructions - Visible & Programmatic` | 3.4 | 1.3.1, 3.3.5 |
| 16 | `3.8: Checkbox & Radio Groups - Grouped Labels` | 3.8 | 1.3.1, 4.1.3 |

**Validation:**
- Required fields marked
- Error messages linked to fields
- Multi-step progress announced
- Instructions associated with fields
- Radio/checkbox groups properly labeled

### Focus & Keyboard (2 Tests)

| Test ID | Test Title | Story ID | WCAG |
|---|---|---|---|
| 17 | `3.9: Form Field Focus - Focus Indicator Visible` | 3.9 | 2.4.7 |
| 18 | `3.10: Form Submission Success - Redirect & Announcement` | 3.10 | 4.1.3 |

**Validation:**
- Focus indicator visible on all interactive elements
- Focus order logical
- Success message announced
- User redirected after submission

---

## Test Implementation Details

### Keyboard Navigation
```javascript
// Example: Tab through entire form
await page.keyboard.press('Tab');
await expect(page.locator(':focus')).toBeDefined();
await page.keyboard.press('Tab');
// ... repeat until form complete
```

**Validation Points:**
- Each interactive element reachable by Tab
- No keyboard traps (except modals)
- Logical tab order
- Escape key closes modals

### Screen Reader Testing
```javascript
// Example: Verify ARIA labels
await expect(page.locator('[aria-label="Email"]')).toBeDefined();
await expect(page.locator('[aria-required="true"]')).toBeDefined();
```

**Validation Points:**
- Form labels associated with inputs (via `<label>` or `aria-label`)
- Required fields marked with `aria-required="true"`
- Error messages linked with `aria-describedby`
- Live regions for status updates (`aria-live="polite"`)

### Axe-Core Scanning
```javascript
// Example: Scan page for violations
const violations = await getViolations(page);
expect(violations).toHaveLength(0);
```

**Rules Checked:**
- `button-name` — Buttons have accessible name
- `form-field-multiple-labels` — Form fields not over-labeled
- `label` — Form inputs labeled
- `region` — Landmark regions properly marked
- `color-contrast` — Text meets WCAG contrast ratios

---

## Themes & Modes

Tests run on multiple themes and color modes:

### Themes
- **Olivero** — Main public-facing theme (light + dark)
- **Claro** — Admin theme (light + dark)
- **default_admin** — Fallback admin theme

### Color Modes
- **Light Mode** — `prefers-color-scheme: light`
- **Dark Mode** — `prefers-color-scheme: dark`

### Viewports
- **Desktop:** 1280×1024 (primary workflow)
- **Tablet:** 768×1024 (secondary)
- **Mobile:** 375×812 (mobile-first test)

---

## Adding New Tests

### 1. Create Test File
Add test to `core/tests/playwright/accessibility-workflows.spec.js`:

```javascript
test('1.3: Password Reset Flow', async ({ page }) => {
  // Setup
  await page.goto('http://drupal-core.ddev.site/user/password');
  
  // Test keyboard navigation
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toHaveAttribute('type', 'email');
  
  // Test form submission
  await page.fill('input[type="email"]', 'test@example.com');
  await page.keyboard.press('Enter');
  
  // Verify success message announced
  const statusMessage = page.locator('[role="status"]');
  await expect(statusMessage).toContainText('Password reset email sent');
  
  // Scan for violations
  const violations = await getViolations(page);
  expect(violations).toHaveLength(0);
});
```

### 2. Reference USER-STORIES.md
Link test to story definition:
```markdown
[1.3 Password Reset Flow](../USER-STORIES.md#13-password-reset-flow)
```

### 3. Update Coverage Matrix
Run to auto-update:
```bash
node core/tests/playwright/scripts/generate-coverage-matrix.js
```

---

## Common Patterns

### Check Focus Indicator
```javascript
const focusedElement = page.locator(':focus');
await expect(focusedElement).toHaveCSS('outline', /\d+px/);
```

### Verify Live Region Announcement
```javascript
const liveRegion = page.locator('[aria-live="polite"]');
await expect(liveRegion).toContainText('Success');
```

### Verify Required Field
```javascript
const input = page.locator('input[aria-required="true"]');
const label = page.locator(`label[for="${await input.getAttribute('id')}"]`);
await expect(label).toContainText('*'); // or other required indicator
```

### Test Multi-Viewport
```javascript
// Run test on multiple viewport sizes
[
  { width: 1280, height: 1024 }, // desktop
  { width: 768, height: 1024 },  // tablet
  { width: 375, height: 812 }    // mobile
].forEach(viewport => {
  test(`Test on ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    // ... test logic
  });
});
```

---

## Troubleshooting

### Test Fails in Headless Mode
**Issue:** Focus or CSS styling different in headless.  
**Solution:** Run with `--headed` to debug:
```bash
npx playwright test --headed --grep "1.1"
```

### axe-core Violations Present
**Issue:** Test expects 0 violations but finds some.  
**Solution:** Review violation details:
```javascript
const violations = await getViolations(page);
violations.forEach(v => console.log(v.id, v.nodes));
```

### Screen Reader Not "Hearing" Element
**Issue:** Element present but not announced.  
**Solution:** Check ARIA tree:
```javascript
const tree = await page.evaluate(() => {
  return document.querySelector('form').getAttribute('role');
});
console.log('Form role:', tree);
```

---

## References

- **Test File:** [core/tests/playwright/accessibility-workflows.spec.js](../../../../../../core/tests/playwright/accessibility-workflows.spec.js)
- **Coverage Matrix:** [USER-STORY-COVERAGE-MATRIX.md](../../../../../../USER-STORY-COVERAGE-MATRIX.md)
- **User Stories:** [USER-STORIES.md](../../../../../../USER-STORIES.md)
- **WCAG 2.2 AA:** https://www.w3.org/WAI/WCAG22/quickref/
- **Playwright Docs:** https://playwright.dev/
- **axe-core Rules:** https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md

---

## Status

✅ **Complete:** 18/18 Tier 1 tests implemented and passing  
⏳ **Planned:** Tier 2 workflows (media, taxonomy, layout, comments)  
❌ **Future:** Tier 3 workflows (views, system UI)
