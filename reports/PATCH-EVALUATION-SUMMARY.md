# Patch Evaluation Batch Summary

**Generated:** 2026-07-18 at 5:59:47 p.m.
**Variant:** `default`

## Results

| Metric | Count |
|--------|-------|
| **Total patches** | 13 |
| **Planned patches** | 13 |
| **Passed** ✅ | 0 |
| **Inconclusive** 🟨 | 13 |
| **Failed** ❌ | 0 |
| **Error** ⚠️ | 0 |
| **Blocking (non-pass)** ⛔ | 13 |
| **Skipped after early stop** | 0 |

**Pass rate:** 0.0%

### Condition Coverage Captured

- **Screen types:** desktop
- **Orientations:** landscape
- **Color modes requested:** light
- **Detected color schemes:** light
- **Directionality:** ltr
- **Themes:** unknown
- **Forced colors:** none
- **Contrast preferences:** no-preference
- **Viewports:** 1280x1024

- **Actionable patches (baseline observed):** 0
- **Root-cause categories:** 3

### Root Cause Breakdown

- `patch-does-not-apply`: 6
- `baseline-not-reproduced`: 6
- `route-unavailable`: 1

---

## Patch Details

### PRIORITY 1

| Patch | Status | Reason | Instance Progress |
|-------|--------|--------|-------------------|
| `a11y-DRUPAL-A11Y-001-file-widget-display-labels` | 🟨 INCONCLUSIVE | `baseline-not-observed-due-to-route-unavailable` (patch-does-not-apply) | 0 fixed / 0 remaining / 0 not-observed |
| `a11y-DRUPAL-A11Y-002-submit-button-contrast` | 🟨 INCONCLUSIVE | `no-baseline-instances-observed` (baseline-not-reproduced) | 0 fixed / 0 remaining / 0 not-observed |
| `a11y-DRUPAL-A11Y-005-language-switcher-contrast` | 🟨 INCONCLUSIVE | `no-baseline-instances-observed` (baseline-not-reproduced) | 0 fixed / 0 remaining / 0 not-observed |

### PRIORITY 2

| Patch | Status | Reason | Instance Progress |
|-------|--------|--------|-------------------|
| `a11y-DRUPAL-A11Y-006-theme-switcher-landmark` | 🟨 INCONCLUSIVE | `no-baseline-instances-observed` (baseline-not-reproduced) | 0 fixed / 0 remaining / 0 not-observed |
| `a11y-DRUPAL-A11Y-007-messages-landmark-role` | 🟨 INCONCLUSIVE | `no-baseline-instances-observed` (patch-does-not-apply) | 0 fixed / 0 remaining / 0 not-observed |

### PRIORITY 3

| Patch | Status | Reason | Instance Progress |
|-------|--------|--------|-------------------|
| `a11y-DRUPAL-A11Y-003-select-all-checkbox-label` | 🟨 INCONCLUSIVE | `no-baseline-instances-observed` (patch-does-not-apply) | 0 fixed / 0 remaining / 0 not-observed |
| `a11y-DRUPAL-A11Y-004-tabindex-buttons-test-form` | 🟨 INCONCLUSIVE | `baseline-not-observed-due-to-route-unavailable` (route-unavailable) | 0 fixed / 0 remaining / 0 not-observed |
| `a11y-DRUPAL-A11Y-008-empty-table-headers` | 🟨 INCONCLUSIVE | `no-baseline-instances-observed` (baseline-not-reproduced) | 0 fixed / 0 remaining / 0 not-observed |
| `a11y-DRUPAL-A11Y-009-module-summary-names` | 🟨 INCONCLUSIVE | `no-baseline-instances-observed` (patch-does-not-apply) | 0 fixed / 0 remaining / 0 not-observed |
| `a11y-LABEL-IN-NAME-004-filter-format-aria-label` | 🟨 INCONCLUSIVE | `no-baseline-instances-observed` (patch-does-not-apply) | 0 fixed / 0 remaining / 0 not-observed |
| `default-admin-focus-aa-proposals` | 🟨 INCONCLUSIVE | `no-baseline-instances-observed` (baseline-not-reproduced) | 0 fixed / 0 remaining / 0 not-observed |
| `default-admin-contrast-color-hints` | 🟨 INCONCLUSIVE | `no-baseline-instances-observed` (baseline-not-reproduced) | 0 fixed / 0 remaining / 0 not-observed |
| `default-admin-accent-aa-defaults` | 🟨 INCONCLUSIVE | `no-baseline-instances-observed` (patch-does-not-apply) | 0 fixed / 0 remaining / 0 not-observed |

---

## Recommendations

⚠️ **No actionable patch recommendations** because baseline target violations were not observed under current test conditions.

### Patch Hygiene (Fix Before Validation)

- `a11y-DRUPAL-A11Y-001-file-widget-display-labels` (patch-does-not-apply)
- `a11y-DRUPAL-A11Y-003-select-all-checkbox-label` (patch-does-not-apply)
- `a11y-DRUPAL-A11Y-007-messages-landmark-role` (patch-does-not-apply)
- `a11y-DRUPAL-A11Y-009-module-summary-names` (patch-does-not-apply)
- `a11y-LABEL-IN-NAME-004-filter-format-aria-label` (patch-does-not-apply)
- `default-admin-accent-aa-defaults` (patch-does-not-apply)

### Test-State Triage (Baseline Not Reproduced / Route Unavailable)

- `a11y-DRUPAL-A11Y-002-submit-button-contrast` on /action-link (baseline-not-reproduced)
- `a11y-DRUPAL-A11Y-004-tabindex-buttons-test-form` on /buttons (route-unavailable)
- `a11y-DRUPAL-A11Y-005-language-switcher-contrast` on /action-link (baseline-not-reproduced)
- `a11y-DRUPAL-A11Y-006-theme-switcher-landmark` on / (baseline-not-reproduced)
- `a11y-DRUPAL-A11Y-008-empty-table-headers` on /admin/content (baseline-not-reproduced)
- `default-admin-focus-aa-proposals` on /admin/content (baseline-not-reproduced)
- `default-admin-contrast-color-hints` on /admin/content (baseline-not-reproduced)

⚠️ **13 patches are blocking (all non-pass outcomes treated equally):**

- `a11y-DRUPAL-A11Y-001-file-widget-display-labels`: blocking (inconclusive, patch preflight issue: patch-does-not-apply)
  - reason: `baseline-not-observed-due-to-route-unavailable`
  - instance coverage: 0 fixed, 0 remaining, 0 not observed
- `a11y-DRUPAL-A11Y-002-submit-button-contrast`: blocking (inconclusive, test did not observe baseline target)
  - reason: `no-baseline-instances-observed`
  - instance coverage: 0 fixed, 0 remaining, 0 not observed
- `a11y-DRUPAL-A11Y-003-select-all-checkbox-label`: blocking (inconclusive, patch preflight issue: patch-does-not-apply)
  - reason: `no-baseline-instances-observed`
  - instance coverage: 0 fixed, 0 remaining, 0 not observed
- `a11y-DRUPAL-A11Y-004-tabindex-buttons-test-form`: blocking (inconclusive, target route unavailable in this environment)
  - reason: `baseline-not-observed-due-to-route-unavailable`
  - instance coverage: 0 fixed, 0 remaining, 0 not observed
- `a11y-DRUPAL-A11Y-005-language-switcher-contrast`: blocking (inconclusive, test did not observe baseline target)
  - reason: `no-baseline-instances-observed`
  - instance coverage: 0 fixed, 0 remaining, 0 not observed
- `a11y-DRUPAL-A11Y-006-theme-switcher-landmark`: blocking (inconclusive, test did not observe baseline target)
  - reason: `no-baseline-instances-observed`
  - instance coverage: 0 fixed, 0 remaining, 0 not observed
- `a11y-DRUPAL-A11Y-007-messages-landmark-role`: blocking (inconclusive, patch preflight issue: patch-does-not-apply)
  - reason: `no-baseline-instances-observed`
  - instance coverage: 0 fixed, 0 remaining, 0 not observed
- `a11y-DRUPAL-A11Y-008-empty-table-headers`: blocking (inconclusive, test did not observe baseline target)
  - reason: `no-baseline-instances-observed`
  - instance coverage: 0 fixed, 0 remaining, 0 not observed
- `a11y-DRUPAL-A11Y-009-module-summary-names`: blocking (inconclusive, patch preflight issue: patch-does-not-apply)
  - reason: `no-baseline-instances-observed`
  - instance coverage: 0 fixed, 0 remaining, 0 not observed
- `a11y-LABEL-IN-NAME-004-filter-format-aria-label`: blocking (inconclusive, patch preflight issue: patch-does-not-apply)
  - reason: `no-baseline-instances-observed`
  - instance coverage: 0 fixed, 0 remaining, 0 not observed
- `default-admin-focus-aa-proposals`: blocking (inconclusive, test did not observe baseline target)
  - reason: `no-baseline-instances-observed`
  - instance coverage: 0 fixed, 0 remaining, 0 not observed
- `default-admin-contrast-color-hints`: blocking (inconclusive, test did not observe baseline target)
  - reason: `no-baseline-instances-observed`
  - instance coverage: 0 fixed, 0 remaining, 0 not observed
- `default-admin-accent-aa-defaults`: blocking (inconclusive, patch preflight issue: patch-does-not-apply)
  - reason: `no-baseline-instances-observed`
  - instance coverage: 0 fixed, 0 remaining, 0 not observed

### Excluded From Patch Recommendation (No Baseline Evidence)

- `a11y-DRUPAL-A11Y-002-submit-button-contrast` (baseline observed: 0)
- `a11y-DRUPAL-A11Y-004-tabindex-buttons-test-form` (baseline observed: 0)
- `a11y-DRUPAL-A11Y-005-language-switcher-contrast` (baseline observed: 0)
- `a11y-DRUPAL-A11Y-006-theme-switcher-landmark` (baseline observed: 0)
- `a11y-DRUPAL-A11Y-008-empty-table-headers` (baseline observed: 0)
- `default-admin-focus-aa-proposals` (baseline observed: 0)
- `default-admin-contrast-color-hints` (baseline observed: 0)

Review detailed evaluation reports in the `patches/` directory.
