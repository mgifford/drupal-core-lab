# Module Accessibility Evaluator

This infrastructure tests whether Drupal modules **add** or **resolve** accessibility issues.

## Quick Start

### Test Single Module

```bash
# From the drupal-core root:
yarn a11y:evaluate-module inline_form_errors
```

### Test All Modules

```bash
# Run all module evaluations (may take 30+ minutes)
yarn a11y:evaluate-all-modules
```

## What the Evaluator Does

For each module, the evaluation script:

1. **Baseline (Module Disabled)**
   - Disable module: `drush pm:disable <module>`
   - Clear cache: `drush cache-rebuild`
   - Run axe-core scan on test pages
   - Capture screenshots of form elements

2. **With Module Enabled**
   - Enable module: `drush pm:enable <module>`
   - Clear cache: `drush cache-rebuild`
   - Run axe-core scan on same test pages
   - Capture screenshots of form elements

3. **Analysis & Reporting**
   - Compare violation counts (before vs. after)
   - Track which rules improved/regressed
   - Calculate net impact
   - Generate markdown/HTML/JSON reports
   - Re-enable module for clean state

## Output Files

### Single Module Evaluation

```
reports/
├── inline_form_errors-evaluation.md      ← Human-readable report
├── inline_form_errors-evaluation.html    ← Web-viewable HTML
├── inline_form_errors-evaluation.json    ← Structured data
├── inline_form_errors-disabled-test1-*.png      ← Screenshots (before)
└── inline_form_errors-enabled-test1-*.png       ← Screenshots (after)
```

### Batch Summary

```
reports/
├── MODULE-EVALUATION-SUMMARY.md          ← Overall findings
└── MODULE-EVALUATION-SUMMARY.json        ← Structured summary
```

## Configuration

Module test cases are defined in:

```
core/tests/playwright/scripts/lib/module-evaluator-config.js
```

Each module specifies:
- **name** — Display name
- **description** — What the module does
- **url** — Documentation link
- **wcag** — WCAG criteria it addresses (e.g., `['1.3.1', '3.3.1']`)
- **wcagCriteria** — Full criterion descriptions
- **testCases** — Array of test scenarios:
  - `name` — Test name (e.g., "User registration form validation")
  - `url` — Page to test (e.g., `/user/register`)
  - `selectors` — CSS selectors to capture (forms, error messages, etc.)
  - `description` — What we're testing
  - `action` — Async function to trigger errors (fill form, submit, etc.)

### Example Configuration

```javascript
'inline_form_errors': {
  name: 'Inline Form Errors',
  description: 'Form errors displayed inline next to fields',
  url: 'https://www.drupal.org/docs/8/core/modules/inline-form-errors/...',
  wcag: ['1.3.1', '3.3.1', '3.3.3'],
  wcagCriteria: [
    '1.3.1 Info and Relationships (Level A)',
    '3.3.1 Error Identification (Level A)',
    '3.3.3 Error Suggestion (Level AA)',
  ],
  testCases: [
    {
      name: 'User registration form validation',
      url: '/user/register',
      selectors: [
        'form.user-register-form',
        '[role="alert"]',
        '.form-item--error',
      ],
      description: 'Submit form with invalid data to trigger errors',
      action: async (page) => {
        // Fill form with invalid data to trigger validation
        await page.fill('input[name="name"]', 'ab'); // too short
        await page.fill('input[name="mail"]', 'invalid-email');
        await page.click('input[type="submit"]');
        await page.waitForLoadState('networkidle');
      }
    }
  ]
}
```

## Module Impact Categories

### ✅ Improves Accessibility
- Module **reduces** violations when enabled
- Ideal candidate for adoption/enablement
- Example: A module that auto-associates form errors with inputs

### ➡️ No Impact
- Module has **no measurable effect** on violations
- May be enabled/disabled without accessibility concern
- Example: A purely visual module that doesn't affect form structure

### ⚠️ Regresses Accessibility
- Module **introduces violations** when enabled
- Requires investigation or patching
- Example: A module that adds dynamic content without aria-live regions

### ❌ Evaluation Error
- Test infrastructure encountered an error
- Module may not be installable or test cases may need adjustment
- Review logs for details

## Example Workflow

### 1. Evaluate Inline Form Errors module

```bash
$ yarn a11y:evaluate-module inline_form_errors

[12:34:56] === PHASE 1: Module DISABLED ===
[12:34:57] Test 1/4: User registration form validation
[12:34:58] Violations: 23
[12:35:01] Test 2/4: Node edit form validation
[12:35:03] Violations: 18
...

[12:36:00] === PHASE 2: Module ENABLED ===
[12:36:01] Test 1/4: User registration form validation
[12:36:02] Violations: 12
[12:36:04] Test 2/4: Node edit form validation
[12:36:06] Violations: 10
...

[12:37:00] ✅ Report written to reports/inline_form_errors-evaluation.md
```

### 2. Review Report

```bash
$ cat reports/inline_form_errors-evaluation.md

# Module Accessibility Evaluation: Inline Form Errors

**Status:** ✅ **IMPROVES** accessibility

## Impact Assessment

| Metric | Without Module | With Module | Change |
|--------|---|---|---|
| **Total violations** | 41 | 22 | −19 |

### By Impact Level

| Severity | Without Module | With Module | Change |
|----------|---|---|---|
| **critical** | 0 | 0 | — |
| **serious** | 12 | 6 | −6 |
| **moderate** | 18 | 12 | −6 |
| **minor** | 11 | 4 | −7 |

### ✅ Fixed By Module

- `form-field-multiple-labels`: −8
- `aria-required-attr`: −6
- `label-title-only`: −5
```

### 3. Run Batch Evaluation

```bash
$ yarn a11y:evaluate-all-modules

[Runs each module...]

$ cat reports/MODULE-EVALUATION-SUMMARY.md

# Module Accessibility Impact Summary

## Overview

| Category | Count |
|----------|-------|
| **Improves accessibility** ✅ | 3 |
| **Neutral** ➡️ | 2 |
| **Regresses accessibility** ⚠️ | 0 |

## ✅ Improves Accessibility

| Module | Display Name | Impact |
|--------|---|---|
| `inline_form_errors` | Inline Form Errors | **−19** violations |
| `field_group` | Field Group | **−8** violations |
| `webform_ui` | Webform UI | **−5** violations |
```

## Adding New Modules to Test

1. Open `core/tests/playwright/scripts/lib/module-evaluator-config.js`

2. Add entry to module.exports:

```javascript
'my_module': {
  name: 'My Module Display Name',
  description: 'What the module does',
  url: 'https://drupal.org/project/my_module',
  wcag: ['1.3.1', '3.3.1'],
  wcagCriteria: [
    '1.3.1 Info and Relationships (Level A)',
    '3.3.1 Error Identification (Level A)',
  ],
  testCases: [
    {
      name: 'Test case name',
      url: '/path/to/test/page',
      selectors: ['.form', '[role="alert"]'],
      description: 'What we are testing',
      action: async (page) => {
        // Trigger the module behavior or errors
        // Example: submit a form to trigger validation
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');
      }
    }
  ]
}
```

3. Run test:

```bash
yarn a11y:evaluate-module my_module
```

## Interpreting Results

### Form Error Module Example

**Without module:**
- Error messages appear at top of form
- Users may not associate errors with specific fields
- axe detects: `form-field-multiple-labels`, `aria-required-attr` violations

**With Inline Form Errors module:**
- Error messages appear next to failing fields
- Clear association between error and field
- axe detects fewer violations (better form semantics)
- **Impact:** −19 violations (improvement)

### High-Impact Additions Example

**Without module:**
- 20 violations across admin pages
- Mostly minor/moderate issues

**With module:**
- 35 violations
- Module adds tabs/widgets without aria-controls, aria-selected
- **Impact:** +15 violations (regression)

**Recommendation:**
- Investigate module code for accessibility issues
- File issue with module maintainer
- Consider patching if critical
- Alternative: use accessible module instead

## Troubleshooting

### Module won't install

Check that module exists and is compatible:

```bash
ddev drush pm:list | grep module_name
```

### Test times out

Increase timeout in evaluate-module.js:

```javascript
await page.goto(`${BASE_URL}${testCase.url}`, { 
  waitUntil: 'networkidle', 
  timeout: 60000  // ← increase this
});
```

### Cache clear fails

Manual clear:

```bash
ddev drush cache-rebuild
```

### Module doesn't disable

Some modules have dependencies. Check:

```bash
ddev drush pm:uninstall module_name
```

Ensure no other modules depend on it.

## Performance Notes

- **Single module evaluation:** 5–10 minutes
- **All modules in batch:** 30–60 minutes
- **Per-test overhead:** 1 min (page load + axe scan)

## References

- **Inline Form Errors module:** https://www.drupal.org/docs/8/core/modules/inline-form-errors/inline-form-errors-module-overview
- **Axe-core rules:** https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md
- **WCAG 2.2:** https://www.w3.org/WAI/WCAG22/quickref/
- **Drupal form API:** https://www.drupal.org/docs/drupal-apis/form-api

## Files

### Scripts
- **`evaluate-module.js`** — Main evaluator
- **`evaluate-all-modules.js`** — Batch runner
- **`lib/module-evaluator-config.js`** — Module configurations

### Output
- **`{module}-evaluation.md`** — Human-readable report
- **`{module}-evaluation.html`** — Web-viewable report
- **`{module}-evaluation.json`** — Structured data

## Next Steps

1. **Review Inline Form Errors impact:**
   ```bash
   yarn a11y:evaluate-module inline_form_errors
   ```

2. **Check if it improves or regresses accessibility**

3. **Add to production if beneficial** or **investigate if regressive**

4. **Run full batch to discover other module impacts:**
   ```bash
   yarn a11y:evaluate-all-modules
   ```
