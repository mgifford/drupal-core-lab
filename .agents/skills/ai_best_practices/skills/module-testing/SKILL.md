---
title: "Module Testing - Accessibility Impact Analysis"
description: "Framework for testing accessibility impact of individual Drupal Core modules with enable/disable orchestration, impact analysis, and per-module reporting."
author: "Mike Gifford"
version: "1.0.0"
parent: "ai_best_practices"
keywords:
  - modules
  - testing
  - accessibility
  - impact analysis
  - regressions
  - experimental modules
  - core modules
triggers:
  - "module testing"
  - "module accessibility"
  - "experimental module"
  - "module impact"
  - "module regression"
enforce: "soft"
---

# Module Testing - Accessibility Impact Analysis

## Overview

Framework for automated testing of accessibility impact when enabling/disabling individual Drupal Core modules. Detects regressions, tracks improvements, and categorizes modules by accessibility risk.

**Configuration File:** `.drupal-a11y-module-config.json`  
**Modules Tracked:** 100+  
**Test Script:** `core/tests/playwright/scripts/test-module-accessibility.js` (planned)  
**Analysis Script:** `core/tests/playwright/scripts/analyze-module-impact.js` (planned)  
**Impact Score:** violations-added (regressions), violations-fixed (improvements)

---

## Quick Start

### 1. Discover Modules
```bash
npm run a11y:discover-modules
```

Generates `.drupal-a11y-module-config.json` with:
- All 100+ modules listed
- Categories assigned (test_only, experimental, optional, core)
- Dependencies mapped
- Module info parsed

**Output:**
```json
{
  "generated": "2026-05-06",
  "modules": {
    "layout_builder": {
      "category": "experimental",
      "status": "disabled",
      "dependencies": ["core/ctools"],
      "risk": "high",
      "description": "Provides visual layout builder interface"
    }
  },
  "summary": {
    "total": 143,
    "experimental": 12,
    "optional": 89,
    "core": 42,
    "test_only": 0
  }
}
```

### 2. Test Single Module (When Scripts Complete)
```bash
npm run a11y:test-module layout_builder
```

### 3. Analyze Impact Across All Modules
```bash
npm run a11y:analyze-module-impact
```

Generates report: `reports/module-impact-summary.md`

---

## Module Categories

### 1. **test_only** (Skip in Production)
Modules used only for testing; never enable in actual Drupal sites.

**Examples:** `test_module_required_config`, `tour` (in test context)  
**Action:** Skip from evaluation; no accessibility impact in production

---

### 2. **experimental** (High Risk - Test First)
Modules in active development; likely to introduce regressions.

**Examples:**
- `layout_builder` — Visual layout UI (complex interactive UX)
- `workspaces` — Multi-site variants (complex state management)
- `views_ui` — Views graphical editor (form complexity)
- `contextual_links` — Inline admin UI (modal/focus challenges)
- `big_pipe` — Performance optimization (async updates; live region challenges)

**Testing Priority:** HIGH  
**Evaluation Depth:** Full workflow testing + regression scan

---

### 3. **optional** (Medium Risk - Targeted Testing)
Modules shipped with Drupal but not required; commonly used.

**Examples:**
- `search` — Site search functionality
- `comment` — Comment/discussion threads
- `taxonomy` — Content classification
- `field_ui` — Field management
- `media` — File & media management
- `rest` — REST API

**Testing Priority:** MEDIUM  
**Evaluation Depth:** Feature-level testing + quick regression scan

---

### 4. **core** (Low Risk - Spot Check)
Core modules required for Drupal to function; cannot disable.

**Examples:**
- `system` — Core system functions
- `field` — Field system
- `user` — User/authentication system
- `node` — Node/content system

**Testing Priority:** LOW  
**Evaluation Depth:** Spot checks; regression monitoring via CI

---

## Module Impact Metrics

### Baseline (No Modules)
1. Start with fresh Drupal install
2. Disable all experimental/optional modules
3. Run accessibility scan (18 Tier 1 workflows)
4. Record baseline violation count
5. Note: Core modules always enabled

**Baseline Run:** `npm run a11y:analyze-module-impact --baseline`

### Per-Module Impact
1. Enable target module
2. Run same 18 workflows
3. Compare violations: added (regressions), fixed (improvements)
4. Record impact score: `impact = fixed - added`
5. Disable module; restore baseline state

**Single Module:** `npm run a11y:test-module <module_name>`

### Impact Severity

| Severity | Added Violations | Meaning |
|---|---|---|
| **Critical** | > 20 | Module introduces major accessibility problems |
| **High** | 10–20 | Significant regressions; needs fixes before release |
| **Medium** | 5–9 | Notable issues; recommend fixes or feature gate |
| **Low** | 1–4 | Minor violations; track but may be acceptable |
| **Positive** | < 0 | Module fixes more issues than it creates |

---

## High-Priority Modules for Phase 1

| Module | Category | Risk | Reason | Test Depth |
|---|---|---|---|---|
| `layout_builder` | Experimental | HIGH | Visual UI; complex interactions; CSS Grid | Full workflows |
| `workspaces` | Experimental | HIGH | Multi-site state; admin complexity | Admin workflows |
| `views_ui` | Optional | MEDIUM | Form builder; conditional fields | Forms + logic |
| `contextual_links` | Optional | MEDIUM | Inline admin popups; modal focus | Focus + modals |
| `big_pipe` | Experimental | HIGH | Async page rendering; live regions | Page updates |
| `comment` | Optional | MEDIUM | Discussion threads; form nesting | Comments + forms |
| `taxonomy` | Optional | MEDIUM | Hierarchical navigation; autocomplete | Navigation + discovery |
| `media` | Optional | MEDIUM | File upload, galleries, players | Media workflows |
| `search` | Optional | MEDIUM | Search forms, results, filters | Forms + results |
| `field_ui` | Optional | LOW | Field management (admin only) | Admin UI |

---

## Module Impact Report

Generated by `analyze-module-impact.js`:

```markdown
# Module Accessibility Impact Report

Generated: 2026-05-06

## Summary

- Baseline violations: 15
- Modules tested: 12 (experimental + high-priority optional)
- Modules with regressions: 3
- Modules with improvements: 2
- Net impact: -4 (4 fewer violations with all tested modules enabled)

## Module Breakdown

### CRITICAL REGRESSIONS
- layout_builder: +18 violations (focus trap, keyboard nav broken)
- big_pipe: +12 violations (live region timing issues)

### HIGH REGRESSIONS
- views_ui: +8 violations (fieldset legend missing)

### NO IMPACT
- search: 0 violations added
- comment: -2 violations (improved from baseline)

### POSITIVE IMPACT
- taxonomy: -4 violations (better form structure)
```

---

## Orchestration: Module Enable/Disable

### Module Manager API

Location: `core/tests/playwright/lib/module-manager.js`

```javascript
const { ModuleManager } = require('./module-manager');
const manager = new ModuleManager(page);

// Check if enabled
const isEnabled = await manager.isModuleEnabled('layout_builder');

// Enable module
await manager.enableModule('layout_builder');

// Disable module
await manager.disableModule('layout_builder');

// Get all enabled modules
const enabled = await manager.getEnabledModules();

// Clear caches
await manager.clearAllCaches();

// Wait for stability
await manager.waitForModuleStateStable('layout_builder');

// Reset to defaults
await manager.resetModulesToDefaults();
```

### DDEV Support

Module manager wraps Drush for DDEV:

```bash
# Local environment (detects ddev.site)
ddev exec drush pm:enable layout_builder

# Automatic via module manager
// Detects URL, runs appropriate command
```

---

## Detecting Regressions

### Pattern 1: New Violations (False Positives Expected)
If enabling a module introduces 5+ new violations:

1. **Review each violation** — Determine if real bug or test artifact
2. **Categorize:**
   - ✅ Real accessibility bug → File issue on module
   - ⚠️ Test environment artifact → Update test expectations
   - 🔍 False positive → Update axe-core rules

3. **Document** — Add to module-impact-summary.md

### Pattern 2: Fixed Violations
If enabling a module reduces violations (unlikely):

- ✅ Positive impact — Document & celebrate
- Note: This is rare; modules usually add complexity

### Pattern 3: No Impact
Module neither adds nor removes violations (ideal):

- ✅ Accessible implementation → Recommend enabling
- Document in summary

---

## Filing Module Issues

When a module introduces accessibility regressions:

### Issue Title
```
Accessibility: Module {name} introduces {X} violations (Story {ID})
```

### Issue Body
```markdown
## Module
- Name: layout_builder
- Category: Experimental

## Impact
- Violations added: 18
- Severity: Critical

## Story Reference
- Story ID: 2.1 (Create Node - Keyboard Navigation)
- WCAG: 2.1.1 (Keyboard), 2.4.3 (Focus Visible)

## Violations Detected
- Button name missing (on layout builder toolbar)
- Focus trap (within layout add field modal)
- Keyboard nav broken (use arrow keys in layout grid)

## Steps to Reproduce
1. Enable layout_builder module
2. Run: npm run test:accessibility-workflows --grep "2.1"
3. Observe 3 test failures

## Expected
- All keyboard navigation works
- Focus indicators visible
- Modal dismissible by Escape key
```

---

## Integration with Story Coverage

Each story (e.g., 2.1: Create Node) can be tested:
- **Without modules** → Baseline (core only)
- **With experimental modules enabled** → Measure impact
- **With optional modules enabled** → Broader coverage

---

## Performance Considerations

### Cache Clearing Cost
Clearing caches after each module enable/disable = **~2–5 seconds per test**

### Optimization
- **Parallel testing:** Enable multiple independent modules in parallel
- **Batch testing:** Group related modules (e.g., all "optional content modules")
- **Skip cache:** Measure impact before/after in same session (single cache clear)

### Estimated Timing
- **Single module:** ~1 minute (enable + test + disable + cache clear)
- **Batch of 10 modules:** ~15–20 minutes (parallel runs)
- **Full 100+ modules:** ~2–3 hours (parallelized by category)

---

## References

- **Config:** [.drupal-a11y-module-config.json](.drupal-a11y-module-config.json) (generated)
- **Discovery Script:** [core/tests/playwright/scripts/discover-modules.js](../../../../../../core/tests/playwright/scripts/discover-modules.js)
- **Module Manager:** [core/tests/playwright/lib/module-manager.js](../../../../../../core/tests/playwright/lib/module-manager.js)
- **User Stories:** [USER-STORIES.md](../../../../../../USER-STORIES.md) (reference for test paths)
- **Drupal Module System:** https://www.drupal.org/docs/drupal-apis/module-api

---

## Status

✅ **Complete:**
- Module discovery & categorization (100+ modules)
- Module manager library (enable/disable/cache ops)
- Configuration generation (.drupal-a11y-module-config.json)

⏳ **Planned:**
- test-module-accessibility.js (orchestrator)
- analyze-module-impact.js (analyzer & reporter)
- Triage module regressions (issue filing)
- Full module matrix testing (100+ modules)

❌ **Not Started:**
- Module × Theme matrix (all themes × critical modules)
- Module × RTL language testing
- Module dependency analysis for cascading impacts
