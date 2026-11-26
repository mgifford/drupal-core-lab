# Reproduce #3426468: Make the active menu item visually stand out more

Issue: https://www.drupal.org/project/drupal/issues/3426468
MR: https://git.drupalcode.org/project/drupal/-/merge_requests/8446 (head `da537706`, last updated 2026-02-05)
Variant: `3426468-latest`
Core measured: `a48087f26ec0c76d6786592f6ca755be4068fb0d` (2026-11-26), Drupal 12.0-dev, PHP 8.5.7, Standard, Default Admin
Proposal: v1 + v2
- v1 `branches/3426468-active-indicator.patch`, sha256 `887f9d9fdc55…`
- v2 `branches/3426468-active-indicator-v2.patch`, sha256 `5922b7c4ad91…` (the interdiff)
- one-patch equivalent: `css-build/2026-11-26-3426468-latest-followup-full.patch`, sha256 `dfcb075b28fb…`
Evaluator: `tools/playwright/evaluate-3426468.mjs`

Status: **measured, DRAFT**. The environments were built and the matrix below was run on 2026-11-26; a person has
not reviewed the rendering yet. See [EVIDENCE.md](EVIDENCE.md) and [SUMMARY.md](SUMMARY.md).

## What the variant is

| Side | Environment | What it is |
|---|---|---|
| Before | `baseline-3426468-latest` | Core `main` at build time, Standard install, recipe `repro_3426468` |
| After | `issue-3426468-latest` | The same core and recipe, plus v1 and v2 |

The variant follows `main`; every run records the actual commit. The recorded run used `a48087f26ec0`. v1 was
verified against `0387fb9…`; core moved to `a48087f26ec0` during provisioning and v1 applied cleanly. The
Navigation files are unchanged between the two commits.

## Build and run

    node scripts/doctor.mjs 3426468-latest
    node tools/compare/setup.mjs 3426468-latest
    node scripts/lab-env.mjs start 3426468-latest

Then the evaluator (the viewer is not required; it talks to both sites directly):

    node tools/playwright/evaluate-3426468.mjs 3426468-latest

A run writes `reports/issues/3426468/playwright/<stamp>-<browser>-<scheme>-<viewport>/` with `results.json`
(including the pass/fail checks), `SUMMARY.md`, full-page and sidebar screenshots, and focus/hover screenshots.

## Matrix that was run (all `reproduced-and-fixed`)

    node tools/playwright/evaluate-3426468.mjs 3426468-latest
    node tools/playwright/evaluate-3426468.mjs 3426468-latest --scheme=dark
    node tools/playwright/evaluate-3426468.mjs 3426468-latest --forced-colors
    node tools/playwright/evaluate-3426468.mjs 3426468-latest --scheme=dark --forced-colors
    node tools/playwright/evaluate-3426468.mjs 3426468-latest --collapse
    node tools/playwright/evaluate-3426468.mjs 3426468-latest --viewport=480x900
    node tools/playwright/evaluate-3426468.mjs 3426468-latest --rtl
    node tools/playwright/evaluate-3426468.mjs 3426468-latest --browser=firefox
    node tools/playwright/evaluate-3426468.mjs 3426468-latest --browser=webkit

Firefox and WebKit need their profiles/caches outside the workspace; in this environment they were run with the
narrowest wider sandbox permission. WebKit does not reproduce Safari's macOS Full Keyboard Access preference, so
the WebKit Tab result is the engine's.

The script records the **rendered** colour scheme and forced-colours state, not only the requested ones. RTL is
emulated with `dir="rtl"` on `<html>`; that is not an installed RTL language, and the run says so. Hover rows are
recorded as not tested at the 480 px touch-width viewport.

## What the evaluator measures

On `/admin/appearance`, `/admin/structure/display-modes/form` and `/admin/content`, for every Navigation item:
element type, classes, `aria-current`, `aria-expanded`, level, current-page vs ancestor vs expanded state, text and
background colours, font weight, computed `::before`/`::after` indicator (content, size, colour, position),
rectangles, overflow/clipping ancestors, icon/label overlap, real keyboard focus outlines (Tab) and real pointer
hover.

It keeps three contrast numbers apart: **text contrast** against its own background (SC 1.4.3), the
**active-vs-inactive delta** (a state signal, not 1.4.3), and **indicator contrast** against the surface it is
actually drawn on (SC 1.4.11). `aria-current="page"` is only expected on the exact current link; an ancestor is not
given it.

It waits for the sidebar slide to finish before measuring, and opens a closed active trail with real Enter presses.
That matters here: on Form modes the trail is closed on load (related #3438046).

## Case (c), shortcuts

`core/modules/shortcut` and the `navigation_shortcuts` block do not exist at the measured commit, so a Standard
install has no shortcuts group. The issue's “top-level item also added to the shortcuts” case cannot be exercised.
A contrib port exists (https://www.drupal.org/project/shortcut); installing it on both sides is a fixture change
and was not made.

## Patch, CSS and lint checks

    node scripts/css-build.mjs 3426468-latest --check --stylelint
    node scripts/lint.mjs 3426468-latest

Both **PASS** on v1+v2: the compiled `.css` matches the `.pcss.css`, Stylelint passes, and core's CSpell, PHPStan,
Stylelint and build:css checks pass. v1 alone failed CSpell on the word “colour”.

The automated coverage ledger is `reports/issues/3426468/COVERAGE.md` (7 of 7 environments). Manual checks — a
person's keyboard pass, a real screen reader, an installed RTL language, a real OS forced-colours mode, text zoom
and touch — are still outstanding.

## If the result is not what you expect

| What you see | What it probably means | What to do |
|---|---|---|
| A patch **does not apply** | `main` moved since `a48087f…` | Re-check the commit; re-pin the variant or reroll. |
| **Before already has a bar** in forced-colours mode | That is the existing system-colour fallback, which this patch extends to normal modes | Compare normal modes, not forced colours, for the reproduction. |
| The active item is still the old blue after v2 | The theme override was not applied; check Default Admin's `components/navigation.pcss.css` | Confirm the theme file is in the patch and the CSS rebuild ran. |
| The bar is at the wrong side in RTL | `dir` was set after the CSS logical properties resolved | Re-run `--rtl`; the script sets `dir` before measuring. |
| The current submenu is not visible | The active trail is closed on load (#3438046) | The evaluator opens it with Enter; a person can click Structure. |
| Contrast is `null` | A colour format the parser did not normalise | The script normalises through a 1×1 canvas; re-run and read `rendered` in `results.json`. |

## Re-pin after a verified run

1. Read the After `results.json` and `SUMMARY.md`; check the verdict and every `NOT as expected` row.
2. Put the verified commit in the variant (or the issue's pinned variant) and update “Core measured” above.
3. Re-run the light desktop pair and confirm the same result before widening the matrix.

## What is in this folder

| Path | What |
|---|---|
| `branches/*.patch`, `BRANCHES.md` | v1, v2 (interdiff), full-proposal artifact, provenance and hashes |
| `PREFLIGHT-2026-11-25.md` | Assignment, competing work, related issues, design basis |
| `SUMMARY.md` | Entry point: result, gaps, links |
| `EVIDENCE.md` | Measured matrix, state-by-state findings, WCAG mapping |
| `playwright/` | 9 v2 runs with results, summaries and Before/After screenshots (superseded v1 runs removed) |
| `lint/`, `css-build/` | Core checks and generated-CSS reports |
| `ISSUE-COMMENT-DRAFT.md` | A human-postable draft, facts only; nothing is posted automatically |
