# Reproduce #2848307

Issue: https://www.drupal.org/project/drupal/issues/2848307
Variant: `2848307-latest` ([variants.json](variants.json)).

## Build the pair

    node scripts/doctor.mjs 2848307-latest
    node tools/compare/setup.mjs 2848307-latest
    node scripts/lab-env.mjs start 2848307-latest --browser

- Before `baseline-2848307`: core `0387fb948f786bc344a5cc54aa0d98b8f552e378` plus
  [the test-only fixture](branches/2848307-tests-only.patch).
- After `issue-2848307`: the same core plus
  [the consolidated patch](branches/2848307-table-inline-errors.patch).

The sites use the Standard install with `default_admin`; `form_test` is enabled so the fixture
form exists at `/form-test/table-error/{variant}`.

## Pages to try

1. `/admin/modules/uninstall`, submit **Uninstall** with nothing selected.
2. `/form-test/table-error/table`, submit.
3. `/form-test/table-error/tableselect-checkboxes`, submit.
4. `/form-test/table-error/tableselect-radios`, submit.
5. `/form-test/table-error/table-tableselect`, submit.
6. `/form-test/table-error/child-error`, submit.
7. `/form-test/table-error/details-table`, submit (the details owns the error; the table must not
   repeat it).
8. `/form-test/table-error/no-ife`, submit (inline errors disabled).
9. `/form-test/table-error/no-error` (an ordinary data table; it must not be wrapped).

## Tests

All commands run in the After environment:

    cd envs/issue-2848307
    ddev phpunit core/modules/inline_form_errors/tests/src
    ddev phpunit core/modules/system/tests/src/Functional/Module/UninstallTest.php
    ddev phpunit core/modules/system/tests/src/Functional/Form/ElementsTableSelectTest.php
    ddev phpunit core/modules/system/tests/src/FunctionalJavascript/Form/ElementsTableSelectTest.php
    ddev phpunit core/modules/system/tests/src/FunctionalJavascript/ModuleUninstallFilterTest.php

The Before environment has the same test files; the new tests and the uninstall assertions are
expected to fail there. To re-run that comparison, apply only
`branches/2848307-tests-only.patch` to a clean `0387fb94` checkout.

Lint on the After side:

    node scripts/lint.mjs 2848307-latest

## Rendered evidence

    node tools/playwright/evaluate-2848307.mjs

Writes `reports/issues/2848307/lab/<stamp>/` with `results.json`, `SUMMARY.md` and the
light/dark/forced-colours screenshots. The Guidepup virtual screen reader is synthetic; no real
VoiceOver or NVDA run is made by this script.

## Patches

| File | Purpose |
|---|---|
| `branches/2848307-table-inline-errors.patch` | The consolidated change against `0387fb94`. |
| `branches/2848307-tests-only.patch` | The fixture and tests only, for the regression comparison. |
| `branches/2848307-interdiff-experimental-to-consolidated.patch` | Applies on top of the experimental combined patch and produces the consolidated tree. |

Verify the interdiff on a tree that has the experimental patch:

    git apply -p1 branches/2848307-interdiff-experimental-to-consolidated.patch

The consolidated patch applies to the recorded base. It was applied to
`~/drupal-2848307-review` on branch `2848307-table-inline-errors` (uncommitted) after restoring the
two files that held the experimental patch.
