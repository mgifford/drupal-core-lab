# Reproduce #3604037: Indicate that grouping elements have child element errors

Issue: https://www.drupal.org/project/drupal/issues/3604037
Pinned core: `c321043bb82d` (the commit the evidence here was produced on). Last verified: 2026-10-01.

## The problem in one paragraph
When a form has grouping elements (`<details>`, vertical tabs, the node form's sidebar) and a field inside a **closed or inactive** group
has a validation error, nothing on the group says so. A user cannot tell which group holds the problem and has to open each one
(WCAG 3.3.1 Error Identification, 1.3.1). The MR adds indicators in the Default Admin theme: a thick red border on the logical inline
start, an error icon near the label's inline end, red label text, a 1 px red border around a `<details>`, the input border colour for an
active vertical tab with errors, visually hidden " (child error)" text on the label, and a `data-child-error-count` attribute on
`<details>`. Forced-colors mode uses `mask-image` with `canvasText`. Known open items on the issue: RTL border position, forced-colors
icon, change record, and dark-mode contrast (#3625458).

## Steps to reproduce (from the issue; **not yet turned into viewer steps or checks**)
1. Default Admin is the admin theme. Allow test modules (`$settings['extension_discovery_scan_tests'] = TRUE;`, in the add-on:
   `ddev drupal test:extensions-enable`) and enable `form_test`. Create an Article content type (recipe `core/tests/fixtures/recipes/article_content_type`).
2. **Plain details:** open `/form_test/details-contains-required-fields`, submit without filling the required fields, close the details.
3. **Accordion details:** open `/node/add/article`, enter a URL alias without a leading slash, submit; the error is invisible while the sidebar is closed.
4. **Vertical tabs** (window at least 650 px wide): open `/admin/config/people/accounts`, clear the required Subject in the Emails section, submit, switch to another tab.
5. **RTL:** enable Locale, add Hebrew, repeat on the Hebrew pages.
Expected: each grouping element that contains a child error shows the indicators listed above. Before the change: no indicator.
The MR's own tests: `core/themes/default_admin/tests/src/FunctionalJavascript/FormGroupingElementsTest.php` and
`core/tests/Drupal/FunctionalJavascriptTests/Core/Form/FormGroupingElementsTest.php` (use them as the automated check, with `ddev phpunit`).

## Status of this scaffold (2026-10-01)
Created by `scripts/new-issue.mjs`: patch extracted from the MR branch (18 files) and pinned to the core it was based on
(`c321043bb82d`, 2026-09-28). **Verified: the patch applies cleanly to that pinned core and to current `main` (`8cd44d484e3c`, 2026-10-01).**
Not yet done: the recipe (`recipes/repro_3604037`), the variant's steps, checks and observe questions (selectors need reading from the MR:
`data-child-error-count`, the " (child error)" text, vertical-tab markup), building the environments, running the MR's own tests, and the walkthrough.

## Reproduce it (pinned core, exactly as verified)
    node tools/compare/setup.mjs 3604037-pinned        # builds Before and After, applies the recipe and patches
    node tools/compare/serve.mjs 3604037-pinned        # side-by-side viewer
    node tools/playwright/walkthrough.mjs 3604037-pinned   # scripted replay with real input

## Try it on the latest core
    node tools/compare/setup.mjs 3604037-pinned --check-patches    # (use 3604037-latest to check the current core)
    node tools/compare/setup.mjs 3604037-latest
    node tools/playwright/walkthrough.mjs 3604037-latest

## If the result is not what you expect
| What you see | What it probably means | What to do |
|---|---|---|
| A patch **does not apply** | Core changed the same lines | Reroll: rebase the issue fork branch on current `main`, regenerate the patch (`scripts/new-issue.mjs 3604037 --branch <branch> --refresh`), update the files in `branches/`. |
| **Before no longer fails** | Upstream may have fixed it, or the steps/selectors no longer match | Check the issue and recent commits to the files in the patch before concluding anything. |
| **After still fails** on newer core | The fix no longer works there | Review the diff of the changed file against current core; update the patch. |
| Everything as expected | Still reproducible | Record the new core commit (see "Re-pin" below). |

## Re-pin to a newer core after verifying
1. Run the `-latest` variant to the end and confirm the walkthrough reports "Reproduced and fixed".
2. Put the verified commit (`git -C envs/<after-env> rev-parse HEAD`) in `core.commit` of the `-pinned` variant in `tools/compare/variants.json`.
3. Re-run the walkthrough and the diff report, commit the new evidence, update "Last verified" above.

## What is in this folder
| Path | What |
|---|---|
| `branches/*.patch`, `BRANCHES.md` | Patches from the issue fork, with source, tip, base and date. |
| `STATUS-<date>.md` | Related issues and review threads, dated. Re-check on drupal.org before relying on it. |
| `EVIDENCE.md` | Results with exact commits. DRAFT until a person has reviewed it. |
| `playwright/`, `compare/`, `screenreader/` | Generated evidence from the scripts. |
| `ISSUE-COMMENT-DRAFT.md` | A draft for a human to review and post. Nothing is posted automatically. |
