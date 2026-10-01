# Issue #3243173: HTML5 validation disabled in Drupal 12

## Summary

Add test coverage for the `enable_html5_validation` setting that disables HTML5 client-side validation by default.

## Context

Drupal's Form API was designed for server-side validation. Browser HTML5 validation (`required`, `pattern`) runs before FAPI, causing:
- Inaccessible error messages (WCAG 3.3.1 failure)
- `#limit_validation_errors` bypassed
- Screen reader users get inconsistent handling

The `disable_html5_validation` contrib module (3,190 sites) was a workaround. The fix belongs in core.

## What's Already in Place

| File | Line | Change |
|------|------|--------|
| `core/lib/Drupal/Core/Form/FormPreprocess.php` | 37 | `Settings::get('enable_html5_validation', FALSE)` |
| `core/modules/system/src/Hook/SystemRequirementsHooks.php` | 1234 | Warning when `TRUE` |
| `core/assets/scaffold/files/default.settings.php` | — | Documented setting |

## What This Patch Adds

**Test coverage** — no tests existed for this behavior.

### FormPreprocessTest (Unit)

| Test | Asserts |
|------|---------|
| `testNovalidateAddedWhenSettingFalse` | `novalidate` present when `FALSE` |
| `testNovalidateAddedWhenSettingNotSet` | `novalidate` present when missing (default) |
| `testNovalidateNotAddedWhenSettingTrue` | `novalidate` absent when `TRUE` |

### Html5ValidationRequirementsTest (Unit)

| Test | Asserts |
|------|---------|
| `testDefaultSettingIsFalse` | Default is `FALSE` |
| `testSettingFalseReturnsFalse` | Explicit `FALSE` returns `FALSE` |
| `testSettingTrueReturnsTrue` | Explicit `TRUE` returns `TRUE` |
| `testSystemRequirementsConditionBehavior` | Warning logic matches `=== TRUE` |
| `testFormPreprocessConditionBehavior` | `novalidate` logic matches `!FALSE` |

## Test Results

### Before Patch

```
Test file ".../FormPreprocessTest.php" not found
Tests: 0, Assertions: 0
```

No test coverage for HTML5 validation behavior.

### After Patch

```
--- FormPreprocessTest ---
OK (3 tests, 3 assertions)

--- Html5ValidationRequirementsTest ---
OK (5 tests, 9 assertions)
```

**Total: 8 tests, 12 assertions — all passing.**

## Related Issues

| Issue | Status | Relationship |
|-------|--------|--------------|
| [#1797438](https://www.drupal.org/project/drupal/issues/1797438) | Closed | Parent: HTML5 validation accessibility |
| [#3537128](https://www.drupal.org/node/3537128) | Published | Change record |
| [#3592742](https://www.drupal.org/project/drupal/issues/3592742) | Active | States API required fields broken |
| [#3592899](https://www.drupal.org/project/drupal/issues/3592899) | Postponed | D13: Remove setting entirely |
| [#3083103](https://www.drupal.org/project/drupal/issues/3083103) | Needs work | ARIA error association |
| [#3088245](https://www.drupal.org/project/drupal/issues/3088245) | Needs work | Errors to assistive tech |

## Testing

```bash
# Apply patch
git apply 3243173-disable-html5-validation.patch

# Run unit tests
./vendor/bin/phpunit -c core core/tests/Drupal/Tests/Core/Form/FormPreprocessTest.php
./vendor/bin/phpunit -c core core/modules/system/tests/src/Kernel/System/Html5ValidationRequirementsTest.php
```

## Manual Verification

1. Set `$settings['enable_html5_validation'] = TRUE;` in `settings.php`
2. Visit `/admin/reports/status` — warning appears
3. Submit empty required field — browser validation message
4. Set to `FALSE` or remove — Drupal FAPI errors appear instead

## Generated

Generated with the help of an LLM.
