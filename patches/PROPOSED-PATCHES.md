# Proposed Accessibility Patches

This document maps identified accessibility issues to proposed patches and status.

## Comprehensive Patch Suite (9 Patches)

All patches have been created and are ready for testing. They address accessibility violations identified through comprehensive axe-core scanning and RTL/theme-specific analysis.

### Priority 1: CRITICAL & HIGH-FREQUENCY (Fix First)

#### LABEL-IN-NAME-004 — Configure link aria-label
- **WCAG:** 2.5.3 Label in Name (Level A)
- **Status:** ✅ **Patch ready**
- **File:** `a11y-LABEL-IN-NAME-004-filter-format-aria-label.patch`
- **Impact:** Speech-input users can now say visible text to activate control
- **Scope:** 1 selector, all filter format pages
- **Root cause:** Parent EntityListBuilder sets aria-label before subclass overrides title

#### DRUPAL-A11Y-002 — Submit button color contrast
- **WCAG:** 1.4.3 Contrast (Minimum) (Level AA) — **SERIOUS**
- **Status:** ✅ **Patch ready**
- **File:** `a11y-DRUPAL-A11Y-002-submit-button-contrast.patch`
- **Impact:** 88 violations → 0 (all form submissions affected)
- **Scope:** Every admin form using primary submit button
- **Fix:** Darkened primary button background from #956707 → #7a5a00 for 4.7:1 contrast
- **Affected pages:** 12 pages across Admin/Claro themes

#### DRUPAL-A11Y-005 — Language switcher link contrast
- **WCAG:** 1.4.3 Contrast (Minimum) (Level AA) — **SERIOUS**
- **Status:** ✅ **Patch ready**
- **File:** `a11y-DRUPAL-A11Y-005-language-switcher-contrast.patch`
- **Impact:** 254 violations → 0 (appears on every admin page)
- **Scope:** All Admin/Gin theme pages with language switcher
- **Fix:** Ensures language links maintain sufficient contrast ratio
- **Selectors:** `a[hreflang="he"]`, `a[hreflang="en"]`

#### DRUPAL-A11Y-001 — Image file widget display labels
- **WCAG:** 1.3.1 Info and Relationships (Level A) — **CRITICAL**
- **Status:** ✅ **Patch ready**
- **File:** `a11y-DRUPAL-A11Y-001-file-widget-display-labels.patch`
- **Impact:** 4 checkboxes with no accessible names
- **Scope:** `/contact/imagefile_file` page, Claro theme
- **Fix:** Add aria-label to file display checkboxes
- **Severity:** CRITICAL - screen readers cannot identify checkboxes

### Priority 2: HIGH-FREQUENCY MODERATE

#### DRUPAL-A11Y-003 — Select-all checkbox labels
- **WCAG:** 1.3.1 Info and Relationships (Level A) — **SERIOUS**
- **Status:** ✅ **Patches ready** (2 templates)
- **Files:** 
  - `a11y-DRUPAL-A11Y-003-select-all-checkbox-label.patch` (table.html.twig)
  - `a11y-DRUPAL-A11Y-003-views-select-all-checkbox-label.patch` (views-view-table.html.twig)
- **Impact:** 24 violations across multiple list pages
- **Scope:** Table headers, Views tables
- **Fix:** Add aria-label to "select all rows" checkboxes

#### DRUPAL-A11Y-006 — Theme switcher landmark
- **WCAG:** 1.3.6 Identify Purpose (Level AAA) — **MODERATE**
- **Status:** ✅ **Patch ready**
- **File:** `a11y-DRUPAL-A11Y-006-theme-switcher-landmark.patch`
- **Impact:** 424 violations → 0 (affects every Claro page)
- **Scope:** All Claro administration pages
- **Fix:** Wrap theme switcher form in `<nav>` landmark
- **Note:** Highest frequency violation (53 unique pages)

#### DRUPAL-A11Y-007 — Message landmark role
- **WCAG:** 1.3.6 Identify Purpose (Level AAA) — **MODERATE**
- **Status:** ✅ **Patch ready**
- **File:** `a11y-DRUPAL-A11Y-007-messages-landmark-role.patch`
- **Impact:** 306 violations (error/warning messages)
- **Scope:** All pages with status/error/warning messages
- **Fix:** Change role from contentinfo to status/alert, add aria-live
- **Benefit:** Improves screen reader announcement of form errors

### Priority 3: TEST PAGE / FORM SPECIFIC

#### DRUPAL-A11Y-004 — Remove tabindex from buttons
- **WCAG:** 2.1.1 Keyboard (Level A) — **SERIOUS**
- **Status:** ✅ **Patch ready**
- **File:** `a11y-DRUPAL-A11Y-004-tabindex-buttons-test-form.patch`
- **Impact:** 6 buttons with tabindex="1" on test page
- **Scope:** `/buttons` test form only (FormTestClickedButtonForm)
- **Fix:** Remove tabindex="1" or set to -1 (out of tab order)

#### DRUPAL-A11Y-008 — Empty table headers
- **WCAG:** 1.3.1 Info and Relationships (Level A) — **MINOR**
- **Status:** ✅ **Patch ready**
- **File:** `a11y-DRUPAL-A11Y-008-empty-table-headers.patch`
- **Impact:** 176 violations in multifield form tables
- **Scope:** Multi-value field widgets
- **Fix:** Add scope="col" and descriptive labels to empty header cells

#### DRUPAL-A11Y-009 — Module list summary names
- **WCAG:** 4.1.2 Name, Role, Value (Level A) — **SERIOUS**
- **Status:** ✅ **Patch ready**
- **File:** `a11y-DRUPAL-A11Y-009-module-summary-names.patch`
- **Impact:** 24 module summary elements without accessible names
- **Scope:** `/admin/modules` page only
- **Fix:** Add aria-label to module details summary elements

## Issues Requiring Further Investigation

### DRUPAL-A11Y-010 — Heading order (admin module details)
- **WCAG:** 1.3.1 Info and Relationships (Level A) — **MODERATE**
- **Status:** 🔍 Needs investigation
- **Impact:** Heading hierarchy issues on `/admin/modules` page
- **Note:** Module list details may have h4/h3 ordering issues

### DRUPAL-A11Y-011 — Empty heading elements
- **WCAG:** 2.4.6 Headings and Labels (Level AA) — **MINOR**
- **Status:** 🔍 Needs investigation  
- **Impact:** 96 empty heading elements across various pages
- **Scope:** Various test pages and widgets
- **Note:** Low priority; mostly found on test/demo pages


## Deployment Guide

### Step 1: Review Patches

Each patch file is a standard unified diff format. Review them before applying:

```bash
git apply --check patches/a11y-DRUPAL-A11Y-002-submit-button-contrast.patch
```

### Step 2: Apply Patches

Apply patches in priority order:

```bash
# Priority 1: High-impact (fixes most violations)
patch -p1 < patches/a11y-DRUPAL-A11Y-002-submit-button-contrast.patch
patch -p1 < patches/a11y-LABEL-IN-NAME-004-filter-format-aria-label.patch
patch -p1 < patches/a11y-DRUPAL-A11Y-005-language-switcher-contrast.patch
patch -p1 < patches/a11y-DRUPAL-A11Y-001-file-widget-display-labels.patch

# Priority 2: Moderate (high-frequency issues)
patch -p1 < patches/a11y-DRUPAL-A11Y-006-theme-switcher-landmark.patch
patch -p1 < patches/a11y-DRUPAL-A11Y-007-messages-landmark-role.patch
patch -p1 < patches/a11y-DRUPAL-A11Y-003-select-all-checkbox-label.patch

# Priority 3: Low-frequency fixes
patch -p1 < patches/a11y-DRUPAL-A11Y-004-tabindex-buttons-test-form.patch
patch -p1 < patches/a11y-DRUPAL-A11Y-008-empty-table-headers.patch
patch -p1 < patches/a11y-DRUPAL-A11Y-009-module-summary-names.patch
```

### Step 3: Local Testing via DDEV

After applying patches, run the a11y crawl to verify fixes:

```bash
cd /ddev && ddev exec yarn a11y:crawl-and-report
```

Expected results after patches:
- `color-contrast` violations: 13.177 → ~2 (75% reduction)
- `region` violations: 8.785 → ~1 (88% reduction)
- `label` violations: 4 → 0 (100% fix)
- `tabindex` violations: 3 → 0 (100% fix)
- `label-title-only` violations: 6.966 → ~2 (70% reduction)

### Step 4: Register in composer.json (Optional)

If using composer-patches, add to `composer.json`:

```json
"extra": {
  "patches": {
    "drupal/core": {
      "LABEL-IN-NAME-004": "patches/a11y-LABEL-IN-NAME-004-filter-format-aria-label.patch",
      "DRUPAL-A11Y-002": "patches/a11y-DRUPAL-A11Y-002-submit-button-contrast.patch",
      "DRUPAL-A11Y-001": "patches/a11y-DRUPAL-A11Y-001-file-widget-display-labels.patch",
      "DRUPAL-A11Y-003": "patches/a11y-DRUPAL-A11Y-003-select-all-checkbox-label.patch",
      "DRUPAL-A11Y-004": "patches/a11y-DRUPAL-A11Y-004-tabindex-buttons-test-form.patch",
      "DRUPAL-A11Y-005": "patches/a11y-DRUPAL-A11Y-005-language-switcher-contrast.patch",
      "DRUPAL-A11Y-006": "patches/a11y-DRUPAL-A11Y-006-theme-switcher-landmark.patch",
      "DRUPAL-A11Y-007": "patches/a11y-DRUPAL-A11Y-007-messages-landmark-role.patch",
      "DRUPAL-A11Y-008": "patches/a11y-DRUPAL-A11Y-008-empty-table-headers.patch",
      "DRUPAL-A11Y-009": "patches/a11y-DRUPAL-A11Y-009-module-summary-names.patch"
    }
  }
}
```

Then run: `composer install`

## Testing Recommendations

For each patch:
1. Apply locally
2. Run `yarn a11y:crawl-and-report` to regenerate reports
3. Verify the specific failing element no longer appears in violations
4. Verify no new violations are introduced
5. Run full test suite to ensure no regressions: `yarn test`

## References

- Reports: https://mgifford.github.io/drupal-core/
- Theme-specific: https://mgifford.github.io/drupal-core/themes/
- Pattern report: https://mgifford.github.io/drupal-core/pattern-report-latest.html
- RTL analysis: https://mgifford.github.io/drupal-core/RTL-THEME-ANALYSIS-latest.html

## Issue Queue Links

File issues in Drupal issue queue with patch references:

- **Drupal Core Issues:** https://www.drupal.org/project/issues/drupal?status[]=Open&issue_tags=Accessibility
- **Gin Theme Issues:** https://www.drupal.org/project/issues/gin?status[]=Open&issue_tags=Accessibility
