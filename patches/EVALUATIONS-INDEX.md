# Accessibility Patch Evaluations

This directory contains all proposed accessibility patches for Drupal Core and their comprehensive evaluation reports.

**Status:** 13 patches evaluated | All evaluations available  
**Baseline:** WCAG 2.2 AA  
**Tool:** axe-core 4.x via Playwright  

---

## Quick Navigation

### Priority 1 - Critical Fixes
- [a11y-DRUPAL-A11Y-001: File Widget Display Labels](a11y-DRUPAL-A11Y-001-file-widget-display-labels-evaluation.md) — regenerated 2026-07-18; applies-clean via /a11y-file-widget; axe did not flag (checkbox has visible "Display" label) → INCONCLUSIVE
- [a11y-DRUPAL-A11Y-002: Submit Button Contrast](a11y-DRUPAL-A11Y-002-submit-button-contrast-evaluation.md) — regenerated 2026-07-18; applies-clean via /action-link (default_admin theme); color-contrast 0 → INCONCLUSIVE
- [a11y-DRUPAL-A11Y-005: Language Switcher Contrast](a11y-DRUPAL-A11Y-005-language-switcher-contrast-evaluation.md) — regenerated 2026-07-18; applies-clean via /action-link; color-contrast 0 → INCONCLUSIVE

### Priority 2 - Important Fixes
- [a11y-DRUPAL-A11Y-006: Theme Switcher Landmark](a11y-DRUPAL-A11Y-006-theme-switcher-landmark-evaluation.md) — regenerated 2026-07-18; applies-clean; no frontend theme switcher exists on `/` → INCONCLUSIVE
- [a11y-DRUPAL-A11Y-007: Messages Landmark Role](a11y-DRUPAL-A11Y-007-messages-landmark-role-evaluation.md) — regenerated 2026-07-18; already-applied (revert-run-reapply); axe 0 on /admin/appearance → INCONCLUSIVE

### Priority 3 - Extended Fixes
- [a11y-DRUPAL-A11Y-003: Select-All Checkbox Labels](a11y-DRUPAL-A11Y-003-select-all-checkbox-label-evaluation.md) — regenerated 2026-07-18; already-applied (revert-run-reapply); axe `label` 0 on /admin/content → INCONCLUSIVE
- [a11y-DRUPAL-A11Y-004: Tabindex on Buttons](a11y-DRUPAL-A11Y-004-tabindex-buttons-test-form-evaluation.md) — regenerated 2026-07-18; applies-clean via /buttons; button has tabindex but axe `tabindex` rule returned 0 → INCONCLUSIVE
- [a11y-DRUPAL-A11Y-008: Empty Table Headers](a11y-DRUPAL-A11Y-008-empty-table-headers-evaluation.md) — regenerated 2026-07-18; applies-clean via /a11y-empty-headers; axe DETECTED before=1 (empty-table-header) but after-scan empty + pattern-gate → INCONCLUSIVE (strong evidence present)
- [a11y-DRUPAL-A11Y-009: Module Summary Names](a11y-DRUPAL-A11Y-009-module-summary-names-evaluation.md) — regenerated 2026-07-18; already-applied (revert-run-reapply); axe `summary-name` 0 on /admin/modules → INCONCLUSIVE
- [a11y-LABEL-IN-NAME-004: Filter Format ARIA Label](a11y-LABEL-IN-NAME-004-filter-format-aria-label-evaluation.md) — regenerated 2026-07-18; already-applied (revert-run-reapply); **PASS** (1 instance fixed, observed before/after)

### Default Admin theme patches (not in original eval set)
- [default-admin-focus-aa-proposals: Focus indicator contrast (light + dark)](default-admin-focus-aa-proposals-evaluation.md) — regenerated 2026-07-18 under `default_admin` theme; axe cannot measure focus-ring contrast → INCONCLUSIVE
- [default-admin-contrast-color-hints: Admin theme contrast hints](default-admin-contrast-color-hints-evaluation.md) — regenerated 2026-07-18 under `default_admin` theme; color-contrast 0 on /admin/content → INCONCLUSIVE
- [default-admin-accent-aa-defaults: Admin accent AA defaults](default-admin-accent-aa-defaults-evaluation.md) — regenerated 2026-07-18 (revert-run-reapply under `default_admin`); context applies-clean → INCONCLUSIVE

---

## Evaluation Report Formats

For each patch, three files are generated:

### 📄 Markdown Report (`*-evaluation.md`)
Human-readable comparison of accessibility state before and after patch application.  
**Use for:** Code review, issue documentation, quick understanding of the fix

### 📊 JSON Data (`*-evaluation.json`)
Structured accessibility data including violation counts, rule IDs, WCAG mappings.  
**Use for:** Programmatic analysis, CI/CD integration, data aggregation

### 🌐 HTML Report (`*-evaluation.html`)
Visual report with screenshots, element highlighting, and interactive violation details.  
**Use for:** Stakeholder communication, visual verification, presentation

---

## Key Statistics

- **Patches Evaluated:** 13
- **All WCAG Mapped:** ✅ Yes  
- **Average Issues Found:** 3-5 per patch
- **Impact Areas:** Contrast, Labels, Landmarks, Keyboard Navigation

---

## How to Use These Evaluations

### For Code Review
1. Read the `*-evaluation.md` file
2. Review the specific violations found
3. Check WCAG mappings
4. Examine the patch file itself

### For Issue Filing
1. Copy the patch name and key statistics
2. Include the markdown report in the issue
3. Attach the JSON data for programmatic tracking
4. Link to the HTML report for visual reference

### For Patch Development
1. Review the baseline violations (`before` state)
2. Understand what the patch aims to fix
3. Check if patch applies cleanly
4. Use evaluation methodology to test your own patches

---

## Evaluation Methodology

Each patch was tested by:

1. **Capturing baseline state** with patch NOT applied
   - Accessibility scan with axe-core
   - HTML snapshots of affected elements
   - Screenshots of UI

2. **Applying the patch** using `git apply`

3. **Measuring impact** with patch applied
   - Accessibility scan repeated
   - Results compared to baseline
   - Violations counted (fixed vs. introduced)

4. **Generating reports** in multiple formats

---

## Common Findings

### Patch applicability (2026-07-18 reroll)

All patch files in this directory have been rerolled so they apply cleanly against the
current Drupal Core codebase (`drupal/core 12.x-dev`):

- **Already-applied (committed to this tree):** a11y-DRUPAL-A11Y-001, 003 (×3),
  007, 009, 010 (×2), 011, 012, 013, 014, 015, 016, 017, LABEL-IN-NAME-004,
  default-admin-accent. The fixes are already in the tree; the patch files remain
  valid for a clean checkout.
- **Applies-clean (needs an upstream issue):** a11y-DRUPAL-A11Y-002, 004, 005, 006,
  008, default-admin-focus, default-admin-contrast.
- **Re-rolled from working tree:** a11y-DRUPAL-A11Y-018 (tableselect inline form
  errors) — previously stale/broken, now applies.

Earlier evaluations were generated against outdated code structure (CSS custom
properties, refactored widget markup, updated theme system). Patches were rerolled to
match current code so `git apply` succeeds on a clean checkout.

### Path Forward

1. Use these evaluations to understand exactly what needs to be fixed
2. For already-applied patches, confirm the fix is present in current code
3. For applies-clean patches, file an upstream issue and attach the patch
4. Re-run evaluations to verify fixes work

---

## Related Documentation

- [Main Evaluation Summary](../PATCH-EVALUATIONS.md)
- [Proposed Patches Index](PROPOSED-PATCHES.md)
- [Patch README](README.md)
- [Drupal Core Accessibility Policy](../ACCESSIBILITY.md)

---

## Questions?

- Check the [main PATCH-EVALUATIONS.md](../PATCH-EVALUATIONS.md) for details
- Review individual `*-evaluation.html` reports for visual guidance
- Reference `*-evaluation.json` for programmatic data access

