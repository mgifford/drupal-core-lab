# Reproduce #3604037: Indicate that grouping elements have child element errors

Issue: https://www.drupal.org/project/drupal/issues/3604037

Merge request: !17078, refreshed tip `c3c52b00`

Latest core checked for patch application: `29b0a0b2256e` (2026-11-17)

Recipe: [`recipes/repro_3604037/`](../../../recipes/repro_3604037/)

Comparison: `3604037-latest`

## Current patch stacks

- **Before:** `support-fixture-two-required-fields.patch`, then `support-fixture-multiple-vertical-tab-errors.patch`.
- **After:** `support-fixture-multiple-vertical-tab-errors.patch`, then the lab-authored
  [`3604037-comment61-current-main.patch`](branches/3604037-comment61-current-main.patch), a port of MR !17078 tip
  `c3c52b00` onto core `29b0a0b2256e`.

The test-support patches are applied to both sides. The After port includes the MR's second required field. See
[`BRANCHES.md`](BRANCHES.md) for exact provenance and hashes. The `3604037-pinned` variant remains the historical
comparison against the original MR patch; use `3604037-latest` to review Comment #61 fixes.

## Build and run

Patch application was checked with:

    node tools/compare/setup.mjs 3604037-latest --check-patches

Both current patch stacks apply cleanly to core `29b0a0b2256e`. The Before and After DDEV sites are now built and the
`repro_3604037` recipe and Farsi locale are applied.

## Current automated verification

The following After tests passed:

- `DetailsTest.php`: 1 test, 8 assertions.
- Core `FormGroupingElementsTest.php`: 6 tests, 50 assertions.
- Default Admin `FormGroupingElementsTest.php`: 3 tests, 15 assertions.
- `NodeEditFormTest.php`: 4 tests, 112 assertions.

`node scripts/lint.mjs 3604037-latest` passed on 20 changed files. The browser evaluation at
[`playwright/2026-11-17T23-46-32-155Z-evaluate/`](playwright/2026-11-17T23-46-32-155Z-evaluate/)
checked the registered Before/After pair across light, dark, forced-colours, and RTL scenarios. It reported six light-mode
hover text contrast checks at 4.17:1 (below 4.5:1); this remains unresolved. Automated evaluation is a draft, not a human
keyboard or screen-reader review. [COVERAGE.md](COVERAGE.md) shows that the 480px cross-browser matrix remains untested.

To rebuild or start the comparison later:

    node scripts/doctor.mjs 3604037-latest
    node tools/compare/setup.mjs 3604037-latest
    node scripts/lab-env.mjs start 3604037-latest --browser

Follow the registered steps in the viewer. The main cases are:

1. Submit `/form_test/details-contains-required-fields` with required fields empty; close the details section.
2. Submit `/node/add/article` with a URL alias that has no leading slash; inspect the closed URL alias group.
3. At a wide viewport, submit `/admin/config/people/accounts` with the required email Subject empty; switch to another tab.
4. Repeat relevant steps in dark mode, forced colours, narrow width, with JavaScript off, and in right-to-left layout.

Use these tests for automated checks:

- `core/tests/Drupal/Tests/Core/Render/Element/DetailsTest.php` (fallback title).
- `core/tests/Drupal/FunctionalJavascriptTests/Core/Form/FormGroupingElementsTest.php` (group indicators and vertical tabs).
- `core/themes/default_admin/tests/src/FunctionalJavascript/FormGroupingElementsTest.php` (theme behavior and multiple error tabs).
- `core/modules/node/tests/src/Functional/NodeEditFormTest.php` (node form details).

Run them through the lab's DDEV setup. The current After results are recorded above.

## Current evidence gaps

- No human keyboard or real screen-reader review; no Firefox/Safari or real Windows forced-colors testing.
- The 480px cross-browser matrix and zoom/reflow checks are outstanding.
- The browser evaluator reports six light-mode hover text contrast failures at 4.17:1; their scope and relation to this patch need human review.
- Historical screenshots, tests, and measurements use an older core and patch; they are not evidence for this port.
- The GitLab review discussions could not be fetched (HTTP 401); Comment #61 itself was retrieved.

All results remain DRAFT until a person reviews them. Do not post or push without approval.
