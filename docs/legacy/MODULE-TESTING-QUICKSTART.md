# Experimental Module Testing - Quick Start

## Overview

Track accessibility impact of Drupal Core experimental and optional modules by:
1. Discovering all modules and their properties
2. Running accessibility tests with modules enabled and disabled
3. Analyzing the impact and generating reports
4. Identifying regressions and improvements

---

## Quick Start (5 minutes)

### 1. Discover Modules
```bash
npm run a11y:discover-modules
```

**Output:** `.drupal-a11y-module-config.json`

This scans all Drupal Core modules and creates a configuration file with:
- Module metadata (name, category, experimental status)
- Dependencies
- Pages affected by each module
- Test configuration (enabled/disabled states to test)

### 2. Run Module Tests
```bash
npm run a11y:test-modules
```

**What happens:**
1. Resets all modules to defaults (core on, optional off)
2. For each configured module:
   - Scans pages with module disabled
   - Enables module & clears caches
   - Scans pages with module enabled
   - Disables module & returns to baseline

**Output:** Individual JSON reports per module in `reports/module-tests/`

### 3. Analyze Impact
```bash
npm run a11y:analyze-module-impact
```

**Output:** `reports/MODULE-IMPACT-{date}.md`

Generates a comprehensive report showing:
- Modules with accessibility regressions ⚠️
- Modules with accessibility improvements ✅
- Net impact per module
- Specific violations introduced/fixed
- Recommendations for each module

---

## Example Workflow

### Test a Single Module
```bash
npm run a11y:test-module -- --module=views_ui
```

### View Results
```bash
# Latest impact report
cat reports/MODULE-IMPACT-*.md | head -100

# Module-specific results
cat reports/module-tests/views_ui-*.json | jq '.comparison'

# Summary of all tests
cat reports/module-tests/MODULE-TEST-SUMMARY-*.json | jq '.modules_tested'
```

---

## Configuration

### Default Configuration
After running `npm run a11y:discover-modules`, edit `.drupal-a11y-module-config.json`:

```json
{
  "modules": {
    "views_ui": {
      "test_enabled": true,      // Test with module enabled
      "test_disabled": true,     // Test with module disabled
      "pages_to_test": [
        "/admin/structure/views",
        "/admin/structure/views/add",
        "/search"
      ]
    }
  }
}
```

### Skip a Module
```json
{
  "modules": {
    "some_module": {
      "test_enabled": false,
      "test_disabled": false,
      "skip_reason": "Test-only module"
    }
  }
}
```

---

## Understanding Results

### Module Status Indicators

- **✅ IMPROVEMENT** - Module fixes accessibility issues
- **⚠️  REGRESSION** - Module introduces new accessibility issues  
- **➖ NEUTRAL** - Module has no significant accessibility impact

### Example Report Section

```markdown
### views_ui
- Status: ⚠️  REGRESSION
- Violations without module: 5
- Violations with module: 9
- Net change: +4 violations

#### ⚠️  New Violations
- color-contrast (3 instances)
  - Filter form buttons have insufficient contrast
  - Severity: High
  - WCAG: 1.4.3
```

---

## Advanced Usage

### Test Specific Modules
```bash
# Test only experimental modules
npm run a11y:test-modules -- --filter=experimental

# Test only optional modules
npm run a11y:test-modules -- --filter=optional
```

### Test with Multiple Themes
```bash
npm run a11y:test-modules-by-theme
# Tests each module with Olivero, Claro, default_admin
```

### Test RTL Compatibility
```bash
npm run a11y:test-modules-rtl
# Tests modules with Hebrew (RTL) language enabled
```

### Test Keyboard Navigation
```bash
npm run a11y:test-modules-keyboard
# Tests keyboard operability with module enabled/disabled
```

---

## Understanding the Test Process

### What Gets Tested

1. **With Module Disabled:**
   - Accessibility scan on each page
   - Baseline violations recorded

2. **With Module Enabled:**
   - Module enabled via Drush
   - Caches cleared
   - Accessibility scan on same pages
   - New violations detected

3. **Analysis:**
   - Compare baseline vs enabled state
   - Identify regression violations
   - Identify improvement/fix violations

### Test Pages

Each module is tested on pages affected by that module:

- **views_ui:** `/admin/structure/views`, `/admin/structure/views/add`, `/search`
- **layout_builder:** `/admin/structure/display`, `/block/add`
- **comments:** `/admin/content/comment`, `/admin/structure/comment`
- **etc.** (customizable per module)

---

## Integration with CI/CD

### GitHub Actions Example

Add to `.github/workflows/a11y-modules.yml`:

```yaml
name: Module Accessibility Tests
on: [push]

jobs:
  module-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npm run a11y:discover-modules
      - run: npm run a11y:test-modules
      - run: npm run a11y:analyze-module-impact
      - uses: actions/upload-artifact@v3
        with:
          name: reports
          path: reports/
```

---

## Reports Generated

After running the complete workflow, you'll have:

```
reports/
├── MODULE-IMPACT-2026-05-06.md          # Main report with findings
├── module-tests/
│   ├── views_ui-2026-05-06.json        # Per-module detailed results
│   ├── layout_builder-2026-05-06.json
│   └── MODULE-TEST-SUMMARY-2026-05-06.json
├── axe-results/
│   └── [existing axe crawl reports]
└── [other accessibility reports]
```

---

## Common Issues & Solutions

### Q: Tests are slow
**A:** Tests run sequentially per module. Add to your command:
```bash
npm run a11y:test-modules -- --parallel=3
```

### Q: Module fails to enable/disable
**A:** Check Drush is working:
```bash
ddev exec drush pm:list --status=enabled
```

### Q: No regressions found but I know there's a problem
**A:** The test pages might not exercise the problematic feature. Update `.drupal-a11y-module-config.json` to add more pages:
```json
{
  "modules": {
    "my_module": {
      "pages_to_test": [
        "/path/with/problem",
        "/another/path"
      ]
    }
  }
}
```

### Q: How do I skip test-only modules?
**A:** Already configured! Test-only modules are automatically skipped (category: `test_only`)

---

## Next Steps

1. **Establish Baseline:** Run `npm run a11y:test-modules-and-report` to get current state
2. **Track Over Time:** Run tests on each Drupal Core release to track module accessibility
3. **File Issues:** Use reports to file accessibility issues in drupal.org issue queue
4. **Monitor Experimental:** Pay special attention to experimental modules before release
5. **Contribute Fixes:** Use reports to guide accessible module development

---

## Reference

- Full documentation: `EXPERIMENTAL-MODULE-A11Y-TESTING.md`
- User stories: `USER-STORIES.md`
- Testing guide: `TESTING-ACCESSIBILITY-WORKFLOWS.md`
- Drupal experimental module policy: https://www.drupal.org/about/core/policies/core-change-policies/experimental/policy-and-list

