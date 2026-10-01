---
title: "Patch Evaluation - Stable Violation Tracking"
description: "Automate accessibility patch evaluation with instance_id/pattern_id tracking per bug-reporting standards. Generates before/after reports with WCAG mapping and violation deduplication."
author: "Mike Gifford"
version: "1.0.0"
parent: "ai_best_practices"
keywords:
  - patches
  - patch evaluation
  - violations
  - instance_id
  - pattern_id
  - bug tracking
  - regression detection
  - WCAG
triggers:
  - "patch evaluation"
  - "patch review"
  - "patch testing"
  - "violation tracking"
  - "instance ID"
enforce: "soft"
---

# Patch Evaluation - Stable Violation Tracking

## Overview

Automated framework for evaluating accessibility patches against a baseline. Generates stable instance_id and pattern_id for tracking individual and recurring violations across pages and test runs.

**Evaluator Script:** `core/tests/playwright/scripts/evaluate-patch.js`  
**Batch Script:** `core/tests/playwright/scripts/evaluate-all-patches.js`  
**Config:** `core/tests/playwright/scripts/lib/patch-evaluator-config.js`  
**Output:** Markdown reports, JSON data, HTML views  
**Tracking Schema:** Per [mgifford/ACCESSIBILITY.md](https://github.com/mgifford/ACCESSIBILITY.md)

---

## Quick Start

### 1. Evaluate Single Patch
```bash
npm run a11y:evaluate-patch a11y-DRUPAL-A11Y-001-form-errors
```

**Output:**
```
✅ PASS — 1 violation fixed, 0 new violations
📊 Report: reports/patches/a11y-DRUPAL-A11Y-001-form-errors/PATCH-EVALUATION.md
📋 Data:   reports/patches/a11y-DRUPAL-A11Y-001-form-errors/violations.json
🌐 View:   reports/patches/a11y-DRUPAL-A11Y-001-form-errors/view.html
```

### 2. Evaluate All Patches
```bash
npm run a11y:evaluate-all-patches
```

Generates reports for 10 patches + summary.

### 3. View Results
```bash
# Summary
cat reports/PATCH-EVALUATION-SUMMARY.md

# Per-patch detail
cat reports/patches/a11y-DRUPAL-A11Y-001-form-errors/PATCH-EVALUATION.md
```

---

## Patch Evaluation Workflow

### Step 1: Baseline Scan
1. Fetch Drupal from git (unpatched)
2. Start DDEV environment
3. Run axe-core scan on all target pages
4. Record: `violations_baseline`
5. Generate stable instance_id/pattern_id for each violation

**Instance ID Formula:**
```
SHA-256(page_path | selector | rule_id | screen_type)
```

**Pattern ID Formula:**
```
SHA-256(selector | rule_id | screen_type)
```

**Screen Types:**
- `mobile` — <768px viewport
- `desktop` — ≥768px viewport

### Step 2: Apply Patch
1. Apply patch file to codebase
2. Clear Drupal caches
3. Verify patch applied cleanly (no rejections)

### Step 3: Patched Scan
1. Run same axe-core scan on same pages
2. Record: `violations_patched`
3. Generate instance_id/pattern_id for new violations

### Step 4: Analyze Differences
1. **Violations Fixed:** `instances in baseline but not in patched`
   - Extract: selector, rule_id, WCAG criterion
   - Record: instance_id, pattern_id
   - Count: violations_fixed

2. **New Violations:** `instances in patched but not in baseline`
   - Extract: selector, rule_id, WCAG criterion
   - Record: instance_id, pattern_id
   - Count: violations_added

3. **No Change:** `violations in both baseline and patched`
   - Count: violations_unchanged

### Step 5: Generate Reports
1. **Markdown Report** — Human-readable summary
2. **JSON Data** — Machine-parseable violations with IDs
3. **HTML View** — Visual violation comparison

### Step 6: Determine Status
```
if violations_added > 0 AND violations_fixed > 0:
  status = "MIXED" (fixes some, introduces others)
elif violations_added > 0:
  status = "FAIL" (introduces regressions)
elif violations_fixed > 0:
  status = "PASS" (improves accessibility)
else:
  status = "NO_IMPACT" (no change)
```

---

## Patch Evaluation Results Schema

### JSON Output Format

```json
{
  "patch_name": "a11y-DRUPAL-A11Y-001-form-errors",
  "patch_file": "patches/a11y-DRUPAL-A11Y-001-form-errors.patch",
  "patch_url": "https://mgifford.github.io/drupal-core/patches/...",
  "status": "PASS",
  "metrics": {
    "baseline_violations": 45,
    "patched_violations": 44,
    "violations_fixed": 1,
    "violations_added": 0,
    "violations_unchanged": 44
  },
  "expected_targets": [
    {
      "instance_id": "abc123def456...",
      "pattern_id": "xyz789uvw012...",
      "page_path": "/user/login",
      "selector": "button.submit",
      "rule_id": "button-name",
      "wcag_criterion": "4.1.2",
      "severity": "critical",
      "screen_type": "desktop"
    }
  ],
  "fixed_violations": [
    {
      "instance_id": "abc123def456...",
      "page_path": "/user/login",
      "selector": "button.submit",
      "rule_id": "button-name",
      "wcag_criterion": "4.1.2",
      "issue_description": "Submit button missing accessible name",
      "before": { "aria-label": null },
      "after": { "aria-label": "Log in" }
    }
  ],
  "new_violations": [],
  "test_cases": [
    {
      "url": "http://drupal-core.ddev.site/user/login",
      "description": "Login form",
      "wcag": ["3.3.1", "4.1.2"],
      "rules": ["label", "button-name"]
    }
  ],
  "timestamp": "2026-05-06T14:32:05.123Z",
  "environment": {
    "drupal_version": "12.0-dev",
    "php_version": "8.5",
    "axe_core_version": "4.x",
    "url": "http://drupal-core.ddev.site"
  }
}
```

### Markdown Report Format

```markdown
# Patch Evaluation Report

## a11y-DRUPAL-A11Y-001-form-errors

**Status:** ✅ PASS

### Metrics
- Baseline violations: 45
- Patched violations: 44
- **Violations fixed:** 1
- Violations added: 0
- Net improvement: 1

### Fixed Violations
#### 1. Submit Button Missing Name (button-name)
- **Page:** `/user/login`
- **Selector:** `button.submit`
- **WCAG:** 4.1.2 (Name, Role, Value)
- **Severity:** Critical
- **Instance ID:** `abc123def456...`
- **Pattern ID:** `xyz789uvw012...`

**Before:**
```html
<button type="submit" class="submit">Send</button>
```

**After:**
```html
<button type="submit" class="submit" aria-label="Log in">Send</button>
```

### Test Coverage
- Page: `/user/login` (login form)
- WCAG: 3.3.1 (Error Identification), 4.1.2 (Name, Role, Value)
- Rules: label, button-name

### Recommendation
✅ **Ready to merge** — Improves accessibility without regressions
```

---

## Tracking Violations Across Runs

### Instance ID Stability
Each individual violation gets a unique `instance_id`:

```javascript
const instanceId = sha256(
  `${pagePath}|${selector}|${ruleId}|${screenType}`
);
// Stable: same page + selector + rule + screen type = same ID
// Changes if: page path, selector, rule, or screen type changes
```

**Use Case:** Track whether the same button on the same page still has the same violation after patching.

### Pattern ID Stability
Recurring patterns get a unique `pattern_id`:

```javascript
const patternId = sha256(
  `${selector}|${ruleId}|${screenType}`
);
// Stable: same selector + rule + screen type = same pattern
// Independent of page path
```

**Use Case:** Detect when a CSS selector pattern (e.g., `.submit`) violates the same rule across multiple pages.

---

## Patch Configuration

File: `core/tests/playwright/scripts/lib/patch-evaluator-config.js`

```javascript
// Maps patches to test cases, WCAG criteria, expected fixes
module.exports = {
  'a11y-DRUPAL-A11Y-001-form-errors': {
    description: 'Form errors not linked to fields',
    wcag: ['3.3.1', '4.1.2'],
    rules: ['aria-describedby', 'form-field-multiple-labels'],
    testCases: [
      {
        url: '/contact',
        selector: '.error-message',
        expectedFix: 'aria-describedby added'
      }
    ]
  },
  // ... more patches
};
```

### Adding a Patch

1. Place `.patch` file in `patches/` directory
2. Add entry to patch-evaluator-config.js:
   ```javascript
   'a11y-YOUR-PATCH-NAME': {
     description: 'Brief description',
     wcag: ['X.X.X', 'Y.Y.Y'],
     rules: ['rule-id-1', 'rule-id-2'],
     testCases: [
       {
         url: '/path/to/test',
         selector: '.element',
         expectedFix: 'What should change'
       }
     ]
   }
   ```

3. Run evaluation:
   ```bash
   npm run a11y:evaluate-patch a11y-YOUR-PATCH-NAME
   ```

---

## Regression Detection

### Pattern-Level Regressions
If the same pattern (e.g., `button.submit` violating `button-name`) appears on multiple pages:

1. **Before patch:** Instance IDs on `/page1`, `/page2`, `/page3`
2. **After patch:** Instance IDs only on `/page1`
3. **Detection:** Patch fixes 2/3 but leaves 1

**Action:** Investigate why `/page1` wasn't covered by patch.

### Cross-Module Regressions
If a patch fixes one issue but introduces another:

1. **Before patch:** 45 violations total
2. **After patch:** 44 violations (1 fixed)
3. **But:** New violation added in different component
4. **Status:** MIXED (trade-off analysis needed)

---

## Violation Deduplication

### Duplicates Across Viewports
Same element, same rule, different screens:

```
- instance_id=abc (desktop): button missing name
- instance_id=def (mobile): button missing name
- pattern_id=xyz (both): same issue, different viewports
```

**Report:** Shows as 1 pattern with 2 instances.

### Duplicates Across Pages
Same selector, same rule, different pages:

```
- instance_id=abc (/page1): button.submit missing name
- instance_id=def (/page2): button.submit missing name
- pattern_id=xyz (both): same CSS selector problem
```

**Report:** Shows as 1 pattern with 2 instances.

---

## Quality Assurance Checklist

Before declaring a patch evaluation complete:

- [ ] Patch applies cleanly (no rejections)
- [ ] Baseline scan completes successfully
- [ ] Patched scan completes successfully
- [ ] instance_id/pattern_id generated for all violations
- [ ] Fixed violations documented with before/after
- [ ] New violations flagged (even if expected)
- [ ] WCAG criteria mapped for each violation
- [ ] Markdown report readable and accurate
- [ ] JSON data valid (parseable)
- [ ] HTML view renders without errors
- [ ] Status determined (PASS/FAIL/MIXED/NO_IMPACT)

---

## References

- **Evaluator Script:** [core/tests/playwright/scripts/evaluate-patch.js](../../../../../../core/tests/playwright/scripts/evaluate-patch.js)
- **Batch Script:** [core/tests/playwright/scripts/evaluate-all-patches.js](../../../../../../core/tests/playwright/scripts/evaluate-all-patches.js)
- **Config:** [core/tests/playwright/scripts/lib/patch-evaluator-config.js](../../../../../../core/tests/playwright/scripts/lib/patch-evaluator-config.js)
- **Patches:** [patches/](../../../../../../patches/)
- **Bug Reporting Schema:** [mgifford/ACCESSIBILITY.md](https://github.com/mgifford/ACCESSIBILITY.md)
- **WCAG 2.2 AA:** https://www.w3.org/WAI/WCAG22/quickref/

---

## Status

✅ **Complete:**
- Evaluator script with instance_id/pattern_id generation
- Configuration mapping (10 patches defined)
- JSON schema with stable violation tracking
- Baseline + patched scan logic
- Before/after analysis

⏳ **In Progress:**
- Re-evaluating all 10 patches with new schema
- Patch file repairs (corrupt headers, path updates)
- Cross-page pattern regression detection

❌ **Not Started:**
- Full patch contribution workflow (drupal.org MR)
- Automated patch filing from evaluations
- Regression trend analysis (violation count over time)
