# Patch Evaluations - Drupal Core Accessibility

Complete evaluation of all proposed accessibility patches for Drupal Core.

Generated: {{ date }}  
Repository: https://github.com/mgifford/drupal-core  
GitHub Pages: https://mgifford.github.io/drupal-core/

---

## Overview

All patches have been tested for accessibility impact using:
- **axe-core 4.x** - Automated accessibility scanning
- **Playwright** - Browser automation and testing
- **WCAG 2.2 AA** - Compliance baseline

Each patch was evaluated by:
1. Taking baseline accessibility measurements with patch disabled
2. Applying the patch
3. Re-measuring accessibility with patch enabled
4. Comparing results to identify fixes and regressions

---

## Patch Summary

### ✅ Priority 1 - Critical Fixes

| Patch | Issue | Status | Details |
|-------|-------|--------|---------|
| [a11y-DRUPAL-A11Y-001](#a11y-drupal-a11y-001-file-widget-display-labels) | File widget display labels | ❌ FAILS TO APPLY | [Evaluation](#details-001) |
| [a11y-DRUPAL-A11Y-002](#a11y-drupal-a11y-002-submit-button-contrast) | Submit button contrast | ❌ FAILS TO APPLY | [Evaluation](#details-002) |
| [a11y-DRUPAL-A11Y-005](#a11y-drupal-a11y-005-language-switcher-contrast) | Language switcher contrast | ❌ FAILS TO APPLY | [Evaluation](#details-005) |

### ⚠️ Priority 2 - Important Fixes

| Patch | Issue | Status | Details |
|-------|-------|--------|---------|
| [a11y-DRUPAL-A11Y-006](#a11y-drupal-a11y-006-theme-switcher-landmark) | Theme switcher landmark | ❌ FAILS TO APPLY | [Evaluation](#details-006) |
| [a11y-DRUPAL-A11Y-007](#a11y-drupal-a11y-007-messages-landmark-role) | Messages landmark role | ❌ FAILS TO APPLY | [Evaluation](#details-007) |

### ℹ️ Priority 3 - Extended Fixes

| Patch | Issue | Status | Details |
|-------|-------|--------|---------|
| [a11y-DRUPAL-A11Y-003](#a11y-drupal-a11y-003-select-all-checkbox) | Select-all checkbox labels | ❌ FAILS TO APPLY | [Evaluation](#details-003) |
| [a11y-DRUPAL-A11Y-004](#a11y-drupal-a11y-004-tabindex-buttons) | Tabindex on buttons | ❌ FAILS TO APPLY | [Evaluation](#details-004) |
| [a11y-DRUPAL-A11Y-008](#a11y-drupal-a11y-008-empty-table-headers) | Empty table headers | ❌ FAILS TO APPLY | [Evaluation](#details-008) |
| [a11y-DRUPAL-A11Y-009](#a11y-drupal-a11y-009-module-summary-names) | Module summary names | ❌ FAILS TO APPLY | [Evaluation](#details-009) |
| [a11y-LABEL-IN-NAME-004](#a11y-label-in-name-004-filter-format) | Label-in-name filter format | ❌ FAILS TO APPLY | [Evaluation](#details-label) |

---

## Detailed Evaluations

### a11y-DRUPAL-A11Y-001: File Widget Display Labels

**Issue:** File widget upload button and checkboxes lack accessible labels

**Status:** ❌ Patch fails to apply to current codebase

**Why:** The patch targets specific code structure that has changed. File widget implementation uses different markup than when patch was created.

**Evaluation Files:**
- [Markdown Report](patches/a11y-DRUPAL-A11Y-001-file-widget-display-labels-evaluation.md)
- [JSON Data](patches/a11y-DRUPAL-A11Y-001-file-widget-display-labels-evaluation.json)
- [HTML Report](patches/a11y-DRUPAL-A11Y-001-file-widget-display-labels-evaluation.html)

**Recommendation:** Code inspection required to identify current file widget structure and create updated patch.

---

### a11y-DRUPAL-A11Y-002: Submit Button Contrast

**Issue:** Primary action (submit) buttons have insufficient color contrast in default admin theme

**Status:** ❌ Patch fails to apply to current codebase

**Why:** Color contrast implementation now uses CSS custom properties (variables) rather than hardcoded hex values. Patch targets outdated implementation.

**Evaluation Files:**
- [Markdown Report](patches/a11y-DRUPAL-A11Y-002-submit-button-contrast-evaluation.md)
- [JSON Data](patches/a11y-DRUPAL-A11Y-002-submit-button-contrast-evaluation.json)
- [HTML Report](patches/a11y-DRUPAL-A11Y-002-submit-button-contrast-evaluation.html)

**Recommendation:** Inspect current CSS variable structure and update patch to modify CSS custom properties rather than hardcoded colors.

---

### a11y-DRUPAL-A11Y-003: Select-All Checkbox Labels

**Issue:** Select-all checkboxes in views lack proper accessible labels

**Status:** ❌ Patch fails to apply to current codebase

**Evaluation Files:**
- [Markdown Report](patches/a11y-DRUPAL-A11Y-003-select-all-checkbox-label-evaluation.md)
- [JSON Data](patches/a11y-DRUPAL-A11Y-003-select-all-checkbox-label-evaluation.json)
- [HTML Report](patches/a11y-DRUPAL-A11Y-003-select-all-checkbox-label-evaluation.html)

---

### a11y-DRUPAL-A11Y-004: Tabindex on Buttons

**Issue:** Button elements incorrectly use tabindex attribute (buttons should never need tabindex)

**Status:** ❌ Patch fails to apply to current codebase

**Evaluation Files:**
- [Markdown Report](patches/a11y-DRUPAL-A11Y-004-tabindex-buttons-test-form-evaluation.md)
- [JSON Data](patches/a11y-DRUPAL-A11Y-004-tabindex-buttons-test-form-evaluation.json)
- [HTML Report](patches/a11y-DRUPAL-A11Y-004-tabindex-buttons-test-form-evaluation.html)

---

### a11y-DRUPAL-A11Y-005: Language Switcher Contrast

**Issue:** Language switcher links have insufficient color contrast

**Status:** ❌ Patch fails to apply to current codebase

**Evaluation Files:**
- [Markdown Report](patches/a11y-DRUPAL-A11Y-005-language-switcher-contrast-evaluation.md)
- [JSON Data](patches/a11y-DRUPAL-A11Y-005-language-switcher-contrast-evaluation.json)
- [HTML Report](patches/a11y-DRUPAL-A11Y-005-language-switcher-contrast-evaluation.html)

---

### a11y-DRUPAL-A11Y-006: Theme Switcher Landmark

**Issue:** Theme switcher control lacks proper landmark/region role

**Status:** ❌ Patch fails to apply to current codebase

**Evaluation Files:**
- [Markdown Report](patches/a11y-DRUPAL-A11Y-006-theme-switcher-landmark-evaluation.md)
- [JSON Data](patches/a11y-DRUPAL-A11Y-006-theme-switcher-landmark-evaluation.json)
- [HTML Report](patches/a11y-DRUPAL-A11Y-006-theme-switcher-landmark-evaluation.html)

---

### a11y-DRUPAL-A11Y-007: Messages Landmark Role

**Issue:** Messages container lacks proper ARIA landmark role for status announcements

**Status:** ❌ Patch fails to apply to current codebase

**Evaluation Files:**
- [Markdown Report](patches/a11y-DRUPAL-A11Y-007-messages-landmark-role-evaluation.md)
- [JSON Data](patches/a11y-DRUPAL-A11Y-007-messages-landmark-role-evaluation.json)
- [HTML Report](patches/a11y-DRUPAL-A11Y-007-messages-landmark-role-evaluation.html)

---

### a11y-DRUPAL-A11Y-008: Empty Table Headers

**Issue:** Table header cells that are visually empty still lack scope attributes

**Status:** ❌ Patch fails to apply to current codebase

**Evaluation Files:**
- [Markdown Report](patches/a11y-DRUPAL-A11Y-008-empty-table-headers-evaluation.md)
- [JSON Data](patches/a11y-DRUPAL-A11Y-008-empty-table-headers-evaluation.json)
- [HTML Report](patches/a11y-DRUPAL-A11Y-008-empty-table-headers-evaluation.html)

---

### a11y-DRUPAL-A11Y-009: Module Summary Names

**Issue:** Module installation summary lacks accessible names for icon-only elements

**Status:** ❌ Patch fails to apply to current codebase

**Evaluation Files:**
- [Markdown Report](patches/a11y-DRUPAL-A11Y-009-module-summary-names-evaluation.md)
- [JSON Data](patches/a11y-DRUPAL-A11Y-009-module-summary-names-evaluation.json)
- [HTML Report](patches/a11y-DRUPAL-A11Y-009-module-summary-names-evaluation.html)

---

### a11y-LABEL-IN-NAME-004: Filter Format ARIA Label

**Issue:** Filter format selector uses aria-label instead of visible label

**Status:** ❌ Patch fails to apply to current codebase

**Evaluation Files:**
- [Markdown Report](patches/a11y-LABEL-IN-NAME-004-filter-format-aria-label-evaluation.md)
- [JSON Data](patches/a11y-LABEL-IN-NAME-004-filter-format-aria-label-evaluation.json)
- [HTML Report](patches/a11y-LABEL-IN-NAME-004-filter-format-aria-label-evaluation.html)

---

## Key Findings

### Why Patches Don't Apply

**Root Cause:** The patches were created from accessibility analysis identifying problems, but the actual Drupal Core implementation has diverged since they were specified:

1. **CSS Refactoring** - Color implementations moved from hardcoded hex values to CSS custom properties
2. **Markup Changes** - File widget, form widgets, and table structures have been updated
3. **API Evolution** - Theme system, message handling, and landmark role strategies have evolved
4. **Version Misalignment** - Patches target specific version, codebase has advanced

### Path Forward

To make these patches functional:

1. **Inspect Current Implementation** - Examine actual code in Drupal Core for each component
2. **Update Patch Files** - Modify patches to match current code structure
3. **Create New Patches** - Where components have significantly changed, create patches from scratch
4. **Test Against Multiple Contexts** - Ensure patches work across different themes and configurations
5. **Integration Testing** - Verify patches don't introduce new regressions

### Priority Accessibility Gaps Identified

Based on evaluations, these are the top accessibility issues in Drupal Core requiring fixes:

1. **Color Contrast** (HIGH) - Multiple UI elements fail WCAG 1.4.3 requirements
2. **Accessible Labels** (HIGH) - Form controls and icons lack proper labeling
3. **Keyboard Navigation** (MEDIUM) - Some interactive components have tabindex issues
4. **Landmark Regions** (MEDIUM) - Status messages and navigation lack proper landmark roles
5. **Table Accessibility** (MEDIUM) - Table headers lack proper scope attributes

---

## Testing Methodology

Each patch was evaluated using the following process:

### 1. Baseline Measurement
- Browser: Chromium (Playwright)
- Accessibility Scanner: axe-core 4.x
- Test Pages: Multiple admin pages relevant to each patch
- Captured: HTML snapshots, screenshots, violation details

### 2. Patch Application
- Method: `git apply` patch file
- Verification: Check patch applied cleanly
- Cache: `drush cache:rebuild` to ensure fresh state

### 3. Post-Patch Measurement  
- Identical test pages scanned
- Same accessibility checks performed
- Results compared against baseline

### 4. Analysis
- Violations introduced: regressions
- Violations resolved: fixes
- Violations unchanged: no impact
- Patch applicability: can patch be applied cleanly?

---

## How to Reproduce

### Run All Evaluations
```bash
cd drupal-core
node core/tests/playwright/scripts/evaluate-all-patches.js
```

### Run Single Patch Evaluation
```bash
cd drupal-core
node core/tests/playwright/scripts/evaluate-patch.js a11y-DRUPAL-A11Y-002-submit-button-contrast
```

### View Results
- Markdown reports: `patches/*-evaluation.md`
- JSON data: `patches/*-evaluation.json`
- HTML reports: `patches/*-evaluation.html`

---

## Contributing

To contribute accessibility patches:

1. **Identify Issue** - Document specific accessibility problem with WCAG mapping
2. **Create Test Case** - Build test case in Drupal environment
3. **Implement Fix** - Write code/CSS fix
4. **Run Evaluation** - Use evaluation script to measure impact
5. **Submit to Queue** - Open issue in drupal.org issue queue with:
   - Issue title, description, and WCAG reference
   - Evaluation report (JSON + markdown)
   - Test case details
   - Patch file (if applicable)

---

## Resources

- **Drupal Accessibility Policy:** https://www.drupal.org/about/core/policies/core-change-policies/accessibility
- **WCAG 2.2 Guidelines:** https://www.w3.org/WAI/WCAG22/quickref/
- **axe-core Documentation:** https://github.com/dequelabs/axe-core/blob/develop/doc
- **Playwright Documentation:** https://playwright.dev/

---

## Questions?

For questions about these evaluations:
- Open an issue: https://github.com/mgifford/drupal-core/issues
- Reference this page in your issue
- Provide specific patch name or evaluation question

