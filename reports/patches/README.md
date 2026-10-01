# Patch Evaluation Reports

This directory contains accessibility patch evaluation reports. Each report tests a proposed fix against the current Drupal codebase to verify the patch applies correctly and resolves accessibility violations.

**🔗 Bidirectional Linking:**
- **Pattern Report** → Links to specific accessibility violations found across Drupal
- **This Directory** → Links from violations to patches that fix them
- **Index.md** → Maps issues ↔ patches (start here to understand the full picture)

## Patch Evaluation Format

Each patch evaluation includes:
- **Before scan**: Baseline accessibility violations without the patch
- **After scan**: Violations with the patch applied
- **Impact analysis**: Status (PASS/FAIL/MIXED/NO_IMPACT), fixed violations, new violations
- **HTML report**: Visual representation with violation details

## Patches and Evaluations

**⚠️ Status Key:**
- ✅ **Real Code** — Patch contains actual fix implementation
- ⏳ **Placeholder** — Patch is template; needs real implementation
- ❌ **FAIL** — Patch does not apply (corrupt or outdated)

**Links:**
- 📋 [Full Issue → Patch Index](INDEX.md) — Bidirectional mapping between accessibility issues and patches
- 📊 [Pattern Report](../PATTERN-REPORT-latest.md) — Detailed accessibility violations found

| Patch | Issue | WCAG | Type | Status | Report |
|-------|-------|------|------|--------|--------|
| a11y-DRUPAL-A11Y-003 | Select All Checkbox Label | 1.3.1 (A) | ✅ Real Code | Applies ✓ | [Evaluation](a11y-DRUPAL-A11Y-003-select-all-checkbox-aria-label-evaluation.html) |
| a11y-DRUPAL-A11Y-001 | File Widget Display Labels | 1.3.1 (A) | ⏳ Placeholder | N/A | [Evaluation](a11y-DRUPAL-A11Y-001-file-widget-display-labels-evaluation.html) |
| a11y-DRUPAL-A11Y-002 | Submit Button Contrast | 1.4.3 (AA) | ⏳ Placeholder | Fails ✗ | [Evaluation](a11y-DRUPAL-A11Y-002-submit-button-contrast-evaluation.html) |
| a11y-DRUPAL-A11Y-004 | Tabindex Buttons Test Form | 2.1.1 (A) | ⏳ Placeholder | N/A | [Evaluation](a11y-DRUPAL-A11Y-004-tabindex-buttons-test-form-evaluation.html) |
| a11y-DRUPAL-A11Y-005 | Language Switcher Contrast | 1.4.3 (AA) | ⏳ Placeholder | N/A | [Evaluation](a11y-DRUPAL-A11Y-005-language-switcher-contrast-evaluation.html) |
| a11y-DRUPAL-A11Y-006 | Theme Switcher Landmark | 1.3.6 (AAA) | ⏳ Placeholder | N/A | [Evaluation](a11y-DRUPAL-A11Y-006-theme-switcher-landmark-evaluation.html) |
| a11y-DRUPAL-A11Y-007 | Messages Landmark Role | 1.3.6 (AAA) | ⏳ Placeholder | N/A | [Evaluation](a11y-DRUPAL-A11Y-007-messages-landmark-role-evaluation.html) |
| a11y-DRUPAL-A11Y-008 | Empty Table Headers | 1.3.1 (A) | ⏳ Placeholder | N/A | [Evaluation](a11y-DRUPAL-A11Y-008-empty-table-headers-evaluation.html) |
| a11y-DRUPAL-A11Y-009 | Module Summary Names | 4.1.2 (A) | ⏳ Placeholder | N/A | [Evaluation](a11y-DRUPAL-A11Y-009-module-summary-names-evaluation.html) |

## Status Legend

- ✅ **PASS** — Patch applies cleanly and resolves accessibility violations
- ⚠️ **MIXED** — Patch applies but creates new violations or only partially fixes issues
- ❌ **FAIL** — Patch does not apply or analysis failed

## Usage

1. **Review evaluation reports** — Click the evaluation link to see detailed before/after analysis
2. **Apply patches** — Patches are in `/patches/` directory (e.g., `a11y-DRUPAL-A11Y-001-file-widget-display-labels.patch`)
3. **Test locally** — Run `npm run a11y:evaluate-patch <patch-name>` to test on your environment
4. **File issues** — If a patch resolves an issue, create a drupal.org issue with the patch

## Related Resources

- [Pattern Report](../pattern-report-latest.html) — Detailed accessibility violations found across Drupal Core
- [Keyboard Review](../keyboard-review-latest.html) — Keyboard navigation and focus management findings
- [AI Best Practices](https://github.com/mgifford/drupal-core/tree/main/.agents/skills/ai_best_practices) — Framework for accessibility automation
- [ACCESSIBILITY.md](https://mgifford.github.io/ACCESSIBILITY.md/) — Sustainability and AI usage guidelines

---

**Last updated:** Generated from patch evaluations during accessibility automation
