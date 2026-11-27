# Reproduce #3083103: error association

Everything below was run on 2026-11-26 against `main` `0387fb948f7` and is re-runnable.

## What exists

| Piece | Path |
|---|---|
| Shared baseline | `envs/baseline-3083103` |
| MR !15692 (ported) | `envs/issue-3083103-15692` |
| August 6 proposal (ported) | `envs/issue-3083103-aug6` |
| Lab fixture (both sides) | `reports/issues/3083103/branches/3083103-fixture.patch` |
| Implementations | `…-improve-error-accessibility-main.patch`, `…-aria-error-association-main.patch` |
| Evaluator | `tools/playwright/evaluate-3083103.mjs` |
| Virtual screen reader | `tools/playwright/screenreader-3083103.mjs` |
| Recipe | `recipes/repro_3083103/recipe.yml` (installs `inline_form_errors`) |

## Rebuild

    node tools/compare/setup.mjs 3083103-latest
    node tools/compare/setup.mjs 3083103-aug6

`setup.mjs` builds from the pinned commit, applies the fixture to both sides and the implementation to
After, installs Standard, applies the recipe, and records each patch by content.

**One manual step:** the fixture lives in `form_test`, which the recipe does not install. After setup, on
**each** site:

    ddev drupal module:install form_test

(Without it `/form-test/error-association` is a 404.) Add it to the recipe if `form_test` proves installable
from a recipe on this core.

## Run

    node tools/playwright/evaluate-3083103.mjs 3083103-latest
    node tools/playwright/evaluate-3083103.mjs 3083103-aug6
    node tools/playwright/screenreader-3083103.mjs 3083103-latest

Each writes a timestamped directory under `reports/issues/3083103/playwright/` (or `screenreader/`) with
`results.json`, `SUMMARY.md`, screenshots per scenario and `ajax-before.json` / `ajax-after.json`.

## Manual walkthrough

1. `node scripts/lab-env.mjs start 3083103-latest` and open the viewer.
2. Log in to both frames, go to `/form-test/error-association`.
3. Press **Submit** with every field empty. Compare:
   - where each error appears (messages region and under the field);
   - the summary links;
   - in DevTools, `document.querySelectorAll('[aria-errormessage]')` and whether each value resolves with
     `document.getElementById(...)`. On the 2026-11-26 build, none did, in either state.
4. Toggle Inline Form Errors off (`/admin/modules`) and repeat. Before/After C then have no association at
   all; After B points at the message in the messages region.
5. `/form-test/error-association/two` — two instances on one page.
6. `/form-test/error-association/no-ife` — form opted out with `#disable_inline_form_errors`.

## Notes and traps

- Native browser validation is off by default on `main` (`enable_html5_validation` defaults to FALSE), so a
  plain Submit reaches the server. The evaluator also sets `form.noValidate` defensively.
- AJAX-rebuilt elements get a **random `#id` suffix** (`edit-extra-tag--<random>`); select them by `name`.
- The page also renders the user login block, so some IDs are shifted (`edit-name` is the fixture, the block
  gets `edit-name--2`). Do not assume the first `#edit-name` on a page is the form you want.
- The baseline and both After environments are disposable. Re-running `setup.mjs` after changing a patch
  records the new content; `--refresh-patches` restores and reapplies.
