# Experimental Module Accessibility Testing Framework

## Overview

This framework tracks and tests accessibility impact of Drupal Core experimental and optional modules. It enables:

1. **Module Discovery** - Automatically identify experimental, optional, and core modules
2. **Enable/Disable Testing** - Run accessibility tests with each module enabled and disabled
3. **Impact Analysis** - Detect accessibility regressions caused by specific modules
4. **Module-Level Reporting** - Generate accessibility reports per module
5. **Comprehensive Coverage** - Understand full Drupal Core accessibility landscape

## Reference

**Drupal Core Experimental Module Policy:**
https://www.drupal.org/about/core/policies/core-change-policies/experimental/policy-and-list

---

## Module Categories

### 1. Experimental Modules
Modules marked as experimental and subject to breaking changes. Changes may be required after major releases.

**Examples:** Layout Builder (historically), Workspaces (newer), etc.

**Test Mode:** Enable → Test → Disable → Compare

### 2. Optional Modules
Modules that are disabled by default but can be enabled by site builders.

**Examples:** Views UI, Comment, Contextual Links, etc.

**Test Mode:** Enable → Test → Disable → Compare

### 3. Core Modules (Always Enabled)
Modules required for Drupal functionality.

**Examples:** User, Node, System, Field, etc.

**Test Mode:** Test (cannot disable), but measure interaction effects

### 4. Test-Only Modules
Modules used only for testing, should not appear in production.

**Examples:** form_test, user_form_test, comment_form_test, etc.

**Test Mode:** Skip or test separately in test environment

---

## Architecture

### Module Metadata Discovery

**File:** `core/tests/playwright/lib/module-metadata.js`

Reads all `.module` and `module.info.yml` files to build metadata:

```javascript
{
  "views_ui": {
    "name": "Views UI",
    "description": "Administrative interface for Views.",
    "category": "Views",
    "experimental": false,
    "hidden": false,
    "dependencies": ["views"],
    "dependents": [],
    "status": "enabled|disabled",
    "package": "Core"
  },
  "layout_builder": {
    "name": "Layout Builder",
    "description": "...",
    "experimental": true,
    "experimental_since": "8.9.0",
    "experimental_policies": "https://www.drupal.org/...",
    // ...
  }
}
```

### Module Configuration Storage

**File:** `.drupal-a11y-module-config.json`

Stores test configuration and results:

```json
{
  "modules": {
    "views_ui": {
      "enabled_by_default": true,
      "experimental": false,
      "category": "optional",
      "test_enabled": true,
      "test_disabled": true,
      "pages_to_test": [
        "/admin/structure/views",
        "/admin/structure/views/add",
        "/search"
      ]
    },
    "layout_builder": {
      "enabled_by_default": false,
      "experimental": true,
      "category": "experimental",
      "test_enabled": true,
      "test_disabled": false,
      "pages_to_test": [...]
    }
  }
}
```

### Test Orchestration

**Script:** `core/tests/playwright/scripts/test-module-accessibility.js`

1. **Initialize** - Load module metadata and config
2. **For Each Module:**
   a. If `test_disabled`: Run accessibility scan with module disabled
   b. Enable module via drush
   c. Clear caches
   d. Run accessibility scan with module enabled
   e. Disable module via drush
   f. Clear caches
3. **Analyze** - Compare results, identify regressions
4. **Report** - Generate per-module impact reports

### Result Analysis

**Script:** `core/tests/playwright/scripts/analyze-module-impact.js`

For each module, generates:

- **Baseline** (disabled state) - axe results
- **Enabled state** - axe results
- **Regression** - New violations introduced by module
- **Improvement** - Violations fixed by module
- **Net Impact** - Overall accessibility change

---

## Module Testing Workflow

### Step 1: Discover Modules

```bash
npm run a11y:discover-modules
# Generates: .drupal-a11y-module-config.json
```

**Output:**
- Lists all modules
- Categorizes (experimental, optional, core, test-only)
- Shows dependencies
- Identifies which pages each module affects

### Step 2: Configure Module Tests

Edit `.drupal-a11y-module-config.json`:

```json
{
  "modules": {
    "views_ui": {
      "test_enabled": true,
      "test_disabled": true,
      "pages_to_test": [
        "/admin/structure/views",
        "/admin/structure/views/add",
        "/search"
      ]
    }
  }
}
```

**Configuration Options:**
- `test_enabled`: Boolean - Test with module enabled
- `test_disabled`: Boolean - Test with module disabled
- `pages_to_test`: Array - Pages affected by this module (empty = global)
- `skip_reason`: String - Why module is skipped (if applicable)

### Step 3: Run Module Accessibility Tests

```bash
# Test all configured modules
npm run a11y:test-modules

# Test specific module
npm run a11y:test-module -- --module=views_ui

# Test with specific settings
npm run a11y:test-module -- --module=views_ui --enabled-only --headless=false
```

**Process:**
1. Disable all optional/experimental modules (start clean)
2. For each module in config:
   - If `test_disabled`: Run axe scan on pages
   - Enable module
   - Clear caches
   - If `test_enabled`: Run axe scan on pages
   - Disable module
   - Clear caches
3. Generate results

### Step 4: Analyze Module Impact

```bash
npm run a11y:analyze-module-impact
# Generates: reports/MODULE-IMPACT-{date}.md
```

**Report Structure:**
```markdown
# Module Accessibility Impact Report

## Summary
- Total modules tested: 12
- Modules with regressions: 3
- Modules with improvements: 1
- Net impact: -2 issues (regression)

## Module Results

### views_ui
- Status: ⚠️ REGRESSION
- Violations without module: 5
- Violations with module: 9
- Net change: +4 violations

**New Violations:**
1. color-contrast (3 instances)
   - Affected elements: Filter form buttons
   - Severity: High
   - WCAG: 1.4.3

2. label (1 instance)
   - Affected elements: Advanced search field
   - Severity: Medium
   - WCAG: 1.3.1

**Fixed Violations:**
None

**Recommendation:**
⚠️ Module introduces accessibility regressions. Requires fixes before enabled-by-default.

### inline_form_errors
- Status: ✅ IMPROVEMENT
- Violations without module: 12
- Violations with module: 8
- Net change: -4 violations

**Fixed Violations:**
1. aria-invalid (4 instances)
   - Elements: Form fields with errors
   - Severity: Medium
   - WCAG: 4.1.2

**New Violations:**
None

**Recommendation:**
✅ Module improves accessibility. Enable by default.
```

### Step 5: Module Impact Triage

```bash
npm run a11y:triage-module-impact
```

**Output:**
- Modules with regressions → File issues in Drupal queue
- Modules with improvements → Document benefits
- Modules with neutral impact → Note for future monitoring
- Experimental modules → Track stability across versions

---

## Key Modules to Test

### High-Priority (Experimental/High-Risk)

1. **Layout Builder** - Experimental, complex UI
2. **Workspaces** - Experimental, content collaboration
3. **BigPipe** - Optional, performance optimization
4. **Dynamic Page Cache** - Optional, complex cache
5. **Diff** - Optional, detailed comparisons

### Medium-Priority (Optional)

1. **Views UI** - Complex filtering interface
2. **Contextual Links** - Context-dependent UI
3. **Comment** - User interaction, forms
4. **Media** - File handling, complex widgets
5. **Taxonomy** - Term management interface

### Low-Priority (Core, Usually On)

1. **User** - Always on
2. **Node** - Always on
3. **Field UI** - Always on
4. **Form Test** - Test-only
5. **Update** - Usually on

---

## Integration with Existing Testing

### Combine with Theme Testing

Run module tests **across all themes**:

```bash
npm run a11y:test-modules-by-theme
# Tests each module with Olivero, Claro, default_admin themes
```

**Matrix:**
```
Module × Theme × Enabled/Disabled = Test Combinations
views_ui × Olivero × enabled
views_ui × Olivero × disabled
views_ui × Claro × enabled
views_ui × Claro × disabled
...
```

### Combine with RTL Testing

For modules with RTL-aware interfaces:

```bash
npm run a11y:test-modules-rtl
# Tests modules with Hebrew language + RTL mode
```

### Combine with Keyboard Testing

Verify keyboard operability per module:

```bash
npm run a11y:test-modules-keyboard
# Runs keyboard-specific tests with module enabled/disabled
```

---

## Scripting & Automation

### Module Enable/Disable via Drush

**Helper Function:** `core/tests/playwright/lib/module-manager.js`

```javascript
const moduleManager = require('./lib/module-manager');

// Enable module
await moduleManager.enableModule('views_ui', page);

// Disable module
await moduleManager.disableModule('views_ui', page);

// Get module status
const status = await moduleManager.isModuleEnabled('views_ui', page);

// Clear caches
await moduleManager.clearAllCaches(page);

// Get module metadata
const meta = await moduleManager.getModuleMetadata('views_ui');
```

### Test Execution

**Script:** `core/tests/playwright/scripts/test-module-accessibility.js`

```javascript
const { testModuleAccessibility } = require('./lib/module-tester');

const results = await testModuleAccessibility({
  module: 'views_ui',
  testDisabled: true,
  testEnabled: true,
  pages: ['/admin/structure/views'],
  headless: true,
  reporters: ['json', 'html']
});
```

---

## Reports Generated

### 1. Module Discovery Report
- **File:** `reports/MODULE-DISCOVERY-{date}.json`
- **Contents:** All modules, categories, metadata
- **Use:** Reference for configuration

### 2. Module Test Results (Per Module)
- **File:** `reports/module-tests/{module-name}-{date}.json`
- **Contents:** Axe results (disabled and enabled states)
- **Use:** Detailed analysis

### 3. Module Impact Summary
- **File:** `reports/MODULE-IMPACT-{date}.md`
- **Contents:** Regression/improvement analysis
- **Use:** Quick overview of module effects

### 4. Module Accessibility Matrix
- **File:** `reports/MODULE-A11Y-MATRIX-{date}.json`
- **Contents:** Module × Metric (violations, violations-fixed, violations-added)
- **Use:** Data for tracking over time

### 5. Module Regression Issues
- **File:** `reports/MODULE-REGRESSIONS-{date}.md`
- **Contents:** Detailed issue reports ready for Drupal queue
- **Use:** Filing issues in drupal.org issue tracker

---

## Configuration Example

### Complete .drupal-a11y-module-config.json

```json
{
  "version": "1.0",
  "last_updated": "2026-05-06",
  "test_environment": {
    "drupal_version": "12.0-dev",
    "themes": ["olivero", "claro", "default_admin"],
    "languages": ["en", "he"],
    "viewports": ["1280x1024", "375x812"]
  },
  "modules": {
    "views": {
      "name": "Views",
      "category": "core",
      "enabled_by_default": true,
      "experimental": false,
      "test_enabled": false,
      "test_disabled": false,
      "note": "Always enabled, cannot disable"
    },
    "views_ui": {
      "name": "Views UI",
      "category": "optional",
      "enabled_by_default": true,
      "experimental": false,
      "test_enabled": true,
      "test_disabled": true,
      "pages_to_test": [
        "/admin/structure/views",
        "/admin/structure/views/add",
        "/search"
      ],
      "priority": "high"
    },
    "layout_builder": {
      "name": "Layout Builder",
      "category": "experimental",
      "enabled_by_default": false,
      "experimental": true,
      "experimental_since": "8.9.0",
      "test_enabled": true,
      "test_disabled": true,
      "pages_to_test": [
        "/admin/structure/display",
        "/block/add"
      ],
      "priority": "critical"
    },
    "form_test": {
      "name": "Form Test",
      "category": "test_only",
      "enabled_by_default": false,
      "test_enabled": false,
      "test_disabled": false,
      "skip_reason": "Test-only module, not production code"
    }
  }
}
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Module Accessibility Tests
on: [push, pull_request]

jobs:
  module-a11y:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm run a11y:discover-modules
      - run: npm run a11y:test-modules
      - run: npm run a11y:analyze-module-impact
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: module-a11y-reports
          path: reports/
      - name: Comment on PR
        if: always()
        uses: actions/github-script@v6
        with:
          script: |
            // Parse MODULE-IMPACT report and comment with summary
```

---

## NPM Scripts

Add to `core/package.json`:

```json
{
  "scripts": {
    "a11y:discover-modules": "node tests/playwright/scripts/discover-modules.js",
    "a11y:test-modules": "node tests/playwright/scripts/test-module-accessibility.js",
    "a11y:test-module": "node tests/playwright/scripts/test-module-accessibility.js --single",
    "a11y:analyze-module-impact": "node tests/playwright/scripts/analyze-module-impact.js",
    "a11y:triage-module-impact": "node tests/playwright/scripts/triage-module-impact.js",
    "a11y:test-modules-by-theme": "node tests/playwright/scripts/test-modules-by-theme.js",
    "a11y:test-modules-rtl": "node tests/playwright/scripts/test-modules-rtl.js",
    "a11y:test-modules-keyboard": "node tests/playwright/scripts/test-modules-keyboard.js"
  }
}
```

---

## Benefits

1. **Comprehensive Module Tracking** - Know impact of each module
2. **Experimental Module Safety** - Catch accessibility regressions before release
3. **Optional Module Guidance** - Recommend modules for accessibility improvement
4. **Dependency Analysis** - Understand module interaction effects
5. **Regression Prevention** - Prevent accessibility degradation from module updates
6. **Documentation** - Clear record of module accessibility status
7. **CI Integration** - Automated testing on every change

---

## Future Enhancements

1. **Module Dependency Testing** - Test combinations of interdependent modules
2. **Performance Impact** - Measure load time correlation with accessibility
3. **Mobile Module Testing** - Module impact on mobile accessibility (44px targets, touch)
4. **Module Versioning** - Track accessibility across module version updates
5. **Predictive Analysis** - Use ML to predict module impact on accessibility
6. **Module Contribution Guidance** - Guide contributed module developers on accessibility

