# Evidence: issue 3604037 (Indicate that grouping elements have child element errors)

Status: **DRAFT.** The current port has been built and checked with targeted tests, lint, and an automated Before/After browser evaluation. Human review remains outstanding. Historical runs below do not verify the current port.

## Current patch

| Item | Value |
|---|---|
| Core base | `29b0a0b2256e` (2026-11-17) |
| Upstream source | MR !17078, tip `c3c52b00` |
| Before patches | `support-fixture-two-required-fields.patch`, then `support-fixture-multiple-vertical-tab-errors.patch` |
| After patches | `support-fixture-multiple-vertical-tab-errors.patch`, then `3604037-comment61-current-main.patch` |
| Local port SHA-256 | `e82af47b` (full hash in `BRANCHES.md`) |
| Patch application | Pass: `node tools/compare/setup.mjs 3604037-latest --check-patches` |
| Static checks | PHP syntax, JavaScript syntax, and variant JSON parse pass. Whitespace checks exempt required single-space context lines in patch files. |

The support patches are test fixtures and apply to both sides where configured. The local port omits the stale generated Umami performance snapshot from the upstream MR patch.

## Current verification

The Before and After DDEV sites were built from core `29b0a0b2256e` with the `repro_3604037` recipe and Farsi locale.

Pre-publication patch checks also pass for both the historical pinned stack on `c321043bb82d` and the latest stack on newer core `ecb483ff6d4b`. The functional and browser results below remain specific to `29b0a0b2256e`; no runtime tests were run on `ecb483ff6d4b`.

Targeted After tests passed:

| Test | Result |
|---|---|
| `core/tests/Drupal/Tests/Core/Render/Element/DetailsTest.php` | 1 test, 8 assertions |
| `core/tests/Drupal/FunctionalJavascriptTests/Core/Form/FormGroupingElementsTest.php` | 6 tests, 50 assertions |
| `core/themes/default_admin/tests/src/FunctionalJavascript/FormGroupingElementsTest.php` | 3 tests, 15 assertions |
| `core/modules/node/tests/src/Functional/NodeEditFormTest.php` | 4 tests, 112 assertions |

`node scripts/lint.mjs 3604037-latest` passed all checks on 20 changed files; the report is [here](lint/2026-11-17-3604037-latest-after.md).

The automated Before/After evaluation is [here](playwright/2026-11-17T23-46-32-155Z-evaluate/SUMMARY.md). It shows the expected child-error counts and indicators in the After state. It also reports six light-mode hover text contrast checks at 4.17:1, below the 4.5:1 text threshold. That contrast finding remains unresolved and should be reviewed separately; no human keyboard or screen-reader review has been done. The generated [coverage report](COVERAGE.md) still shows the 480px multi-browser matrix as untested; the custom evaluation is recorded in the older format without patch hashes.

## Historical evidence (not evidence for the current port)

| Env | Directory | Core commit | MR / patches |
|---|---|---|---|
| Baseline | `envs/baseline-3604037-latest` | `8cd44d484e3c` (2026-10-01) | upstream `main` |
| Patched | `envs/issue-3604037-latest` | `8cd44d484e3c` (2026-10-01) | MR !17078, tip `e8b2e166be8` |

Historical measurements, screenshots, test logs, and lint results are linked from [SUMMARY.md](SUMMARY.md) and [EVALUATION-2026-10-01.md](EVALUATION-2026-10-01.md). They describe an older core and patch revision.

## Not verified for the current port

- Human keyboard and real screen-reader testing, Firefox/Safari testing, and real Windows forced-colors testing.
- The 480px cross-browser coverage matrix and text zoom/reflow checks.
- Whether the six light-mode hover contrast failures are introduced by this change or reflect existing Default Admin hover styling.
- The GitLab MR review discussions; the review API returned HTTP 401. Comment #61 itself was retrieved.

No evidence here is ready to post until a person reviews it.
