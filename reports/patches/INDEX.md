# Accessibility Patch Index - Cross-Reference

This index links accessibility issues found in pattern reports to their proposed patch solutions and evaluations.

## Issue → Patch Resolution Map

### label-title-only Violations (Select All Checkbox)
**Pattern:** "Select all rows" checkbox labeled only by title attribute  
**WCAG:** 1.3.1 (A) - Info and Relationships  
**Impact:** Critical (forms inaccessible to screen reader users)

| Issue ID | Location | Patch | Status | Evaluation |
|----------|----------|-------|--------|-----------|
| DRUPAL-A11Y-003 | `/admin/content` (table headers) | [a11y-DRUPAL-A11Y-003-select-all-checkbox-aria-label.patch](../../patches/a11y-DRUPAL-A11Y-003-select-all-checkbox-aria-label.patch) | ✅ Real Code | [Report](a11y-DRUPAL-A11Y-003-select-all-checkbox-aria-label-evaluation.html) |

**Fix:** Add `aria-label` attribute to select-all checkbox  
**File:** `core/themes/default_admin/templates/dataset/table.html.twig` line 72  
**Related Issues:** 
- [Drupal.org Search](https://www.drupal.org/project/issues/search?text=label-title-only%20%22Select%20all%20rows%22&projects=Drupal%20core&issue_tags=Accessibility)
- [Pattern Report Details](../PATTERN-REPORT-latest.md#label-title-only)

---

### color-contrast Violations (Buttons)
**Pattern:** Buttons don't meet WCAG AA contrast ratio  
**WCAG:** 1.4.3 (AA) - Contrast Minimum  
**Impact:** Serious (text hard to read for low-vision users)

| Issue ID | Location | Patch | Status | Evaluation |
|----------|----------|-------|--------|-----------|
| DRUPAL-A11Y-002 | `/action-link` (action buttons) | [a11y-DRUPAL-A11Y-002-submit-button-contrast.patch](../../patches/a11y-DRUPAL-A11Y-002-submit-button-contrast.patch) | ⏳ Placeholder | [Report](a11y-DRUPAL-A11Y-002-submit-button-contrast-evaluation.html) |

**Fix:** Adjust button colors in CSS to meet 4.5:1 contrast ratio  
**File:** `core/themes/default_admin/css/components/button.pcss.css`  
**Related Issues:**
- [Drupal.org Search](https://www.drupal.org/project/issues/search?text=color-contrast%20button&projects=Drupal%20core&issue_tags=Accessibility)
- [Pattern Report Details](../PATTERN-REPORT-latest.md#color-contrast)

---

### label Violations (Form Fields)
**Pattern:** Form elements missing accessible labels  
**WCAG:** 1.3.1 (A) - Info and Relationships  
**Impact:** Critical (form unusable with screen readers)

| Issue ID | Location | Patch | Status | Evaluation |
|----------|----------|-------|--------|-----------|
| DRUPAL-A11Y-001 | `/contact/imagefile_file` (file widget) | [a11y-DRUPAL-A11Y-001-file-widget-display-labels.patch](../../patches/a11y-DRUPAL-A11Y-001-file-widget-display-labels.patch) | ⏳ Placeholder | [Report](a11y-DRUPAL-A11Y-001-file-widget-display-labels-evaluation.html) |

**Fix:** Add aria-label to file widget display checkbox  
**File:** `core/modules/file/src/Plugin/Field/FieldWidget/FileWidget.php` line 406  
**Related Issues:**
- [Drupal.org Search](https://www.drupal.org/project/issues/search?text=label%20file%20widget&projects=Drupal%20core&issue_tags=Accessibility)
- [Pattern Report Details](../PATTERN-REPORT-latest.md#label)

---

## Patch Evaluation Status

| Patch | Real Code | Test Page | Violations | Can Apply | Last Evaluated |
|-------|-----------|-----------|-----------|-----------|-----------------|
| DRUPAL-A11Y-003 | ✅ Yes | `/admin/content` | Found | ✅ Yes | 2026-05-06 16:57 |
| DRUPAL-A11Y-001 | ⏳ Partial | `/contact/imagefile_file` | Not Found | ❓ Check | 2026-05-06 19:56 |
| DRUPAL-A11Y-002 | ❌ Placeholder | `/action-link` | Not Found | ❌ No | 2026-05-06 16:53 |

### Legend
- **Real Code** — Patch contains actual implementation code
- **Placeholder** — Patch is template, needs implementation
- **Can Apply** — `git apply --check` succeeds
- **Last Evaluated** — Most recent evaluation run timestamp

---

## How to Use This Index

1. **Find an issue** — Look up the WCAG criterion and violation type
2. **Review the patch** — Check if patch has real code or is a placeholder
3. **Read evaluation** — Click the evaluation link to see before/after analysis
4. **Test locally** — Run `npm run a11y:evaluate-patch <patch-name>`
5. **Improve patch** — If placeholder, implement the fix
6. **File issue** — Link to this report in drupal.org issue

## Next Steps

- [ ] Implement DRUPAL-A11Y-001 patch (file widget labels)
- [ ] Implement DRUPAL-A11Y-002 patch (button contrast)
- [ ] Re-evaluate all patches with real code
- [ ] Create patches for remaining 7 issues
- [ ] Verify all patches resolve violations (0 violations after patch)

---

Generated: 2026-05-06  
Cross-reference between:
- `/reports/PATTERN-REPORT-latest.md` (accessibility issues)
- `/reports/patches/` (patch evaluations)
- `/patches/*.patch` (patch files)
