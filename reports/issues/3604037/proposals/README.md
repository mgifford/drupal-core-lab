# #3604037: proposed follow-up changes to MR !17078 (DRAFT, not posted)

Two small patches that apply **on top of** the MR (tip `e8b2e166be8`), each rebuilt with Drupal's own `core/scripts/css/postcss-build.js` so the `.css` matches its `.pcss.css`.
They are independent (both apply together; checked with `git apply --check`). Evidence: `../EVALUATION-2026-10-01.md` and `../playwright/*-evaluate/`.

| Patch | What it changes | Why | Measured result |
|---|---|---|---|
| `proposal-A-forced-colours-icon.patch` | Error icon in forced-colours mode: keep `background: canvasText` as the fallback and add `@supports (forced-color-adjust: preserve-parent-color) { background: currentColor; forced-color-adjust: preserve-parent-color; }` (details and vertical tabs) | The MR's icon is plain black or white while its label is link-coloured, so it does not match the element it marks (the reviewer's point). `currentColor` alone makes the icon vanish in forced colours (1:1), `preserve-parent-color` is the supported way | Icon colour equals the label colour in both palettes: `#00009f` (light) and `#ffff00` (dark), 14:1 and 19.6:1 |
| `proposal-B-error-text-colour.patch` | Use the existing `--admin-color-text-error` token (dark `#e69e9e`) for the error label and icon colour instead of `--admin-color-error` (dark `#ce6060`); the red bar keeps `--admin-color-error` | `#ce6060` fails contrast in dark mode: 3.72:1 (details label), 4.48:1 (tab label), 2.56:1 (icon on the hover tint). The text token is meant for text and passes without changing the global token (which would touch every error cue and belongs with #3625458) | Dark mode: 6.64:1, 7.98:1 and 4.57:1, all pass. Light mode unchanged (`#cc3d3d`, 4.88:1). The only remaining failures are the light-mode hover label (4.17:1), which is identical on Before |

Evidence for the proposals: `../playwright/2026-10-02T03-03-42-945Z-evaluate-WITH-PROPOSAL-B/` (light and dark) and `../playwright/2026-10-02T03-05-33-603Z-evaluate-WITH-PROPOSAL-A/` (forced colours, light and dark palettes). The MR's own numbers are in `../playwright/2026-10-01T14-02-09-801Z-evaluate/` and `../playwright/2026-10-01T13-49-03-333Z-evaluate/`.

## Apply and check
    node tools/compare/setup.mjs 3604037-latest          # builds Before and After (the MR on current core); resumable
    cd envs/issue-3604037-latest
    git apply ../../reports/issues/3604037/proposals/proposal-A-forced-colours-icon.patch
    git apply ../../reports/issues/3604037/proposals/proposal-B-error-text-colour.patch
    ddev drupal cache
    cd ../.. && node tools/playwright/evaluate-3604037.mjs 3604037-latest --modes=light,dark,forced,forced-dark

To undo: `git apply -R` the same files. The environment is restored to the plain MR state after each use; check with `git -C envs/issue-3604037-latest status`.

## Replication recipes
- Recipe that creates the starting state: `recipes/repro_3604037/recipe.yml` (Article content type, `form_test`; `setup.mjs` applies it and enables test extensions).
- The same test page on both sides: `branches/support-fixture-two-required-fields.patch` (applied to Before; the MR changes that page too).
- Right-to-left with a real language: Farsi, added by `scripts/add-language.php` (`scripts/lab-site.sh language <env> fa`, done by setup); browse `/fa/...`.
- Everything in one zip: `bundles/drupal-repro-3604037-<date>.zip` (run `node scripts/make-bundle.mjs 3604037-pinned` to rebuild).

## Not verified
Chromium only; no real Windows contrast theme, Firefox or Safari; browser support of `preserve-parent-color` beyond the Chromium used here (hence the `@supports` guard); no real screen-reader pass; the MR's own PHPUnit tests pass on After and fail on Before as expected (see `../phpunit/`) but were not run with these two proposals applied.
