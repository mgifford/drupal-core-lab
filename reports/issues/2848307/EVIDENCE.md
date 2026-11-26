# Evidence: #2848307 table and tableselect inline errors

Status: **DRAFT.** Tested on 2026-11-26 in the Drupal Core Lab. No one has reviewed this by hand,
nothing has been posted to drupal.org, and no merge request has been pushed.

## Identity

| | |
|---|---|
| Issue | https://www.drupal.org/project/drupal/issues/2848307 |
| Existing MR | https://git.drupalcode.org/project/drupal/-/merge_requests/16355 (`46e9b7e7`, 2026-07-18) |
| Core base | `0387fb948f786bc344a5cc54aa0d98b8f552e378` (Drupal 12.0-dev, 2026-11-25) |
| Experimental combined patch | `~/patches/2848307/2848307-combined-experimental.patch`, SHA-256 `bc8f2b1a1681f5194ac4e7fc754d8ee772a1f5c41d910ae60b8ce5505eb40d08` |
| Consolidated patch | [branches/2848307-table-inline-errors.patch](branches/2848307-table-inline-errors.patch), SHA-256 `76eb82ba98a5a89ef76e10c32f868ef98dfa953853383e725b9f97e556dc0862` |
| Test-only patch (fixture) | [branches/2848307-tests-only.patch](branches/2848307-tests-only.patch), SHA-256 `d7dc0f08e1019498dd78f1cacf324206e45a3cfcc61ef01b865ef6e16503ea1b` |
| Interdiff | [branches/2848307-interdiff-experimental-to-consolidated.patch](branches/2848307-interdiff-experimental-to-consolidated.patch), SHA-256 `5508a8712a1d416ec0677cf7881c0790ef22066dd28cdb2be769118bb26f4797` |

The consolidated patch applies to the recorded base. It was also applied to the
`~/drupal-2848307-review` checkout on branch `2848307-table-inline-errors` after restoring the two
files that held the experimental patch; the experimental patch remains in `~/patches/2848307/`.

## Environment

| | |
|---|---|
| Lab variant | `2848307-latest` ([variants.json](variants.json)) |
| Before | `baseline-2848307`: core `0387fb94` + test-only patch |
| After | `issue-2848307`: core `0387fb94` + consolidated patch |
| Drupal / PHP | Drupal 12.0-dev / PHP 8.5.7 |
| Theme | `default_admin` (Standard install; `form_test` enabled for the fixture) |
| Browser | Chromium 157.0.8103.79, macOS arm64, 1280x900 |
| Runner | `ddev phpunit`, Playwright with the installed Chrome, Guidepup virtual screen reader over a jsdom snapshot |

## Regression tests: pristine core fails, patched core passes

Both sides carry the same test-only fixture (`form_test` form and route, the new test classes, and
the extra `UninstallTest` assertions). The only difference is the production patch.

| Run | Before (test-only) | After (consolidated) | Output |
|---|---|---|---|
| New functional, FunctionalJavascript and unit tests | **19 tests, 4 errors, 10 failures** | **19 tests, 62 assertions, OK** | [before](tests/before-pristine.txt), [after](tests/after-fix.txt) |
| `UninstallTest::testUninstallPage` | **1 test, 80 assertions, 1 failure** (no `.form-item--error-message`) | **1 test, 80 assertions, OK** | [before](tests/before-uninstall.txt), [after](tests/after-uninstall.txt) |
| Full `inline_form_errors` test suite | — | **28 tests, 147 assertions, OK** | [after](tests/after-ife-suite.txt) |
| `ElementsTableSelectTest` (functional) | — | 9 tests, 30 assertions, OK | run 2026-11-26 |
| `ElementsTableSelectTest` (FunctionalJavascript) | — | 2 tests, 19 assertions, OK | run 2026-11-26 |
| `ModuleUninstallFilterTest` | — | 1 test, 8 assertions, OK | run 2026-11-26 |
| `FormElementInlineErrorTest` (kernel) | — | 1 test, 1 assertion, OK | run 2026-11-26 |

The before failures are the expected regression: two inline messages instead of one, a table with
no `aria-describedby`, a summary link that leaves focus on `BODY`, and no error wrapper. The exact
failure lines are in the output files.

## Lab evidence: rendered before/after

Run directory: [lab/2026-11-26T08-02-42-656Z](lab/2026-11-26T08-02-42-656Z/).
Entry point: [SUMMARY.md](lab/2026-11-26T08-02-42-656Z/SUMMARY.md) and
[results.json](lab/2026-11-26T08-02-42-656Z/results.json).

| Scenario | Before | After |
|---|---|---|
| Modules uninstall, empty submit | plain summary error, no link, no inline error, table `id=""`, no `aria-describedby` | one inline "No modules selected." above the table; summary link "Modules to uninstall" → `#system-modules-uninstall-table`; table `aria-describedby` → the error; `tabindex="-1"`; no checkbox `aria-invalid` |
| `table` with a table-level error | plain summary error, no link, no inline error | one inline error; summary "A table with an error" → table; table `aria-describedby` → error |
| `tableselect` checkboxes | summary link "Rows to update" but focus stays on BODY; two inline messages (one per row); two `aria-invalid` checkboxes | one inline error; summary link focuses the TABLE; one `aria-describedby`; zero `aria-invalid` controls |
| `tableselect` radios | same pattern | same pattern, one group error |
| `table` with `#tableselect` | summary link "Update Alpha" (a child title); two inline messages; two invalid checkboxes | summary "No rows selected." → table; one inline message; zero invalid controls |

Screenshots, light/dark/forced-colors, all scenarios:
[`before-table-light.png`](lab/2026-11-26T08-02-42-656Z/before-table-light.png),
[`after-table-light.png`](lab/2026-11-26T08-02-42-656Z/after-table-light.png),
[`before-tableselect-checkboxes-dark.png`](lab/2026-11-26T08-02-42-656Z/before-tableselect-checkboxes-dark.png),
[`after-tableselect-checkboxes-dark.png`](lab/2026-11-26T08-02-42-656Z/after-tableselect-checkboxes-dark.png),
[`before-uninstall-forced.png`](lab/2026-11-26T08-02-42-656Z/before-uninstall-forced.png),
[`after-uninstall-forced.png`](lab/2026-11-26T08-02-42-656Z/after-uninstall-forced.png).
The full set is 24 images (2 sides × 3 colour modes × 4 scenarios).

## Keyboard

The evaluator tabs from the top of the page to the summary link and presses Enter. It records the
focused element and the hash:

- Before: no summary link in the table scenarios; for the uninstall form there is no link either.
  In the `tableselect` and `table` + `#tableselect` scenarios an existing link changes the hash but
  focus stays on `BODY`, because the table is not focusable.
- After: the summary link is reached by keyboard, Enter moves focus to the table (`document.activeElement`
  is `TABLE`), and the next Tab moves to the first checkbox. The table has `tabindex="-1"`, so it is
  not an extra tab stop. The FunctionalJavascript test asserts the same focus behaviour.

## Virtual screen reader

Guidepup virtual screen reader over a jsdom snapshot of the page, starting outside the table so
the table's own accessible name/description is spoken. This is synthetic evidence, not VoiceOver or
NVDA.

- Before, `table`: `"table, A table with an error"` — no error in the table's description.
- After, `table`: `"table, A table with an error, No rows selected."` — the error is the table's
  description.
- Before, `tableselect-checkboxes`: `"No rows selected." → "textbox, invalid"` repeated for the
  rows; the error is attached to every control.
- After, `tableselect-checkboxes`: `"table, No rows selected."` and one row of controls; no
  repeated group message.
- Before, uninstall: `"table"` with no description.
- After, uninstall: `"No modules selected." → "table, No modules selected."`.

The virtual reader is a synthetic tool. It shows that the error is exposed as the table's
description and is spoken when the table is encountered. It does **not** prove that every real
screen reader announces the table description when an individual checkbox receives focus; that is
why the error is also placed visibly next to the table and why the summary link focuses the table.
A real VoiceOver pass was not run.

## Coverage tool

`node scripts/coverage.mjs 2848307` reports 0 of 7 automated environments because this issue's
evaluator writes its own results under `lab/` rather than the lab-run schema, and it runs Chromium at
1280x900 rather than the default 480px matrix. That is a real coverage gap: Firefox and WebKit were
not run. The rendered evidence above is the evidence that exists; `COVERAGE.md` is left as the tool
wrote it rather than being filled by hand.

## Lint and static analysis

`node scripts/lint.mjs 2848307-latest` on the After side: **PASS** (CSpell, PHPStan, PHPCS,
twig-cs-fixer, ESLint; 24 s). Report:
[`lint/2026-11-26-2848307-latest-after.md`](lint/2026-11-26-2848307-latest-after.md).
No CSS source changed, so no generated-CSS build was required.

## Lab QA gate

- `node scripts/check-draft.mjs 2848307`: **passes** (the comment draft is 179 words and ends with
  the required AI line).
- `node scripts/coverage.mjs 2848307`: **0 of 7** automated environments, as explained above.
- `node scripts/index-issues.mjs`: fails on an unrelated issue's `status.json` (an MR entry with no
  `sha`); the failure is in `tools/compare/issue-tracking.mjs:112` and is not caused by this issue.
- `node scripts/selftest.mjs`: 5 failures, none in this issue's code. Two are pre-existing
  (`2942404-final.coverage.active`, two unrecorded #3603162 patch files); `cloud/ up to date` is
  expected to change because this issue adds a variant and the cloud artifacts were not rebuilt
  (rebuilding them is an outward-facing step and was left alone).

## Not verified

- No real VoiceOver or NVDA run. The environment has Guidepup installed; the synthetic virtual
  reader is the only screen-reader evidence here.
- No axe-core scan, Firefox or WebKit run, and no measured colour-contrast values. The screenshots
  cover light, dark and forced colours but were reviewed visually only.
- No human keyboard or assistive-technology pass yet. The keyboard evidence is scripted from the
  summary link; a person has not used the page.
- AJAX rebuilds, multiple forms on one page beyond the two-table fixture, and contrib element types
  that extend `table` are not exercised.
- The table `#description` IDREF still has no target in the DOM: `table.html.twig` does not render
  descriptions on this base. The test only asserts that the token is preserved when the error ID is
  added. This is pre-existing and not introduced by this patch.
- A theme that overrides `system-modules-uninstall.html.twig` must carry the new error block and
  attributes; that override case is not tested.
- #3083103's general input/error association is not integrated. Individual control errors inside a
  table keep the existing IFE rendering (visible next to the control) but still do not get an
  `aria-describedby`; that remains #3083103's scope.
