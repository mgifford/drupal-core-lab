# Core code checks for #3545814

**DRAFT.** Run 2026-11-27 on the After checkout `envs/issue-3545814` (core `87de7098664f` + MR !13201) with the checkout's own installed tools. `scripts/lint.mjs` was not used because DDEV was occupied by other sessions; the same two tools were run directly.

## PHPCS

```bash
cd envs/issue-3545814
vendor/bin/phpcs --standard=core/phpcs.xml.dist --extensions=php \
  core/modules/views/src/Plugin/views/filter/FilterPluginBase.php \
  core/modules/views/src/Plugin/views/filter/NumericFilter.php
```

Result: **exit 0, no errors or warnings.**

The two proposed test files were checked the same way (from the `tests-proposal` folder):

```bash
vendor/bin/phpcs --standard=core/phpcs.xml.dist --extensions=php \
  reports/issues/3545814/tests-proposal/core/modules/views_ui/tests/src/Functional/FilterNumericWebTest.php \
  reports/issues/3545814/tests-proposal/core/modules/views/tests/src/Functional/Plugin/FilterTest.php
```

Result: **exit 0, no errors or warnings.**

## PHPStan

```bash
cd envs/issue-3545814
vendor/bin/phpstan analyse -c core/phpstan.neon.dist --no-progress --memory-limit=2G \
  core/modules/views/src/Plugin/views/filter/FilterPluginBase.php \
  core/modules/views/src/Plugin/views/filter/NumericFilter.php
```

Result: **`[OK] No errors`.**

## What was not run

- `node scripts/lint.mjs 3545814-pinned`: not run (DDEV contention). It also covers JavaScript, CSS/Stylelint and the generated CSS build; this change touches no JS or CSS.
- PHPCS/PHPStan on the proposal C file: C is a one-line addition to the same file that passed; it was not linted separately.
- Core's full test suite and the Nightwatch job: not run locally.
