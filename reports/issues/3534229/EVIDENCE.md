# Evidence: #3534229 CKEditor 5 toolbar-configuration icons in forced-colors mode

Status: **DRAFT** — automated evidence is recorded below; no person has reviewed it, and the manual
Windows contrast-theme rows are not done. Nothing was posted to drupal.org or pushed to any remote.

- Issue: <https://www.drupal.org/project/drupal/issues/3534229> (Active, unassigned, no merge request)
- Related: <https://www.drupal.org/project/drupal/issues/3637246> / MR
  [!17909](https://git.drupalcode.org/project/drupal/-/merge_requests/17909) (read-only compatibility check)
- Thread: kentr's mask experiment is
  [comment #7](https://www.drupal.org/project/drupal/issues/3534229#comment-16705093) (2026-07-24); mgifford
  replied in comment #8 (2026-07-27). One issue-fork branch exists
  (`3534229-ckeditor-config-buttons` in `https://git.drupalcode.org/issue/drupal-3534229.git`) with **zero
  commits** beyond core `main` (checked 2026-11-27), so there is no other contributor's work to take over.
- Intake snapshot: `reports/issues/3534229/intake/`.

## Environments

| Side | Directory | Core commit | Recipe | Patch (in order) |
|---|---|---|---|---|
| Before | `envs/baseline-3534229` | `8a7df6cc3e69b6b5d427cb25ce8f66dda8393c29` | `recipes/repro_3534229/recipe.yml` | none |
| After | `envs/issue-3534229` | same | same | [`branches/3534229-forced-colors-mask.patch`](branches/3534229-forced-colors-mask.patch), sha256 `c1c969bd33b6…` (v3; v1/v2 and interdiffs in [`BRANCHES.md`](BRANCHES.md)) |
| Combined (compat) | `envs/issue-3534229-3637246` | same | same | [`branches/3637246-mr-17909.patch`](branches/3637246-mr-17909.patch) (sha256 `112c8136…`, MR head `5917a35e…`) then the mask patch |

Pinned commit: 2026-11-27, "fix: #2778345 Views argument validators aren't taken into account on access
checks …". `tools/compare/setup.mjs 3534229-pinned` recorded the environment identity and patch content;
`scripts/capture-patch.mjs` wrote the patch from the After checkout, and the patch-state record reads
`verified`. Browser: Chromium `159.0.8154.6` (the Lab's Playwright install), macOS arm64, emulated
forced colors; Drupal `12.0-dev`; default + admin theme Default Admin (Standard install).

## The patch (local proposal, not an upstream patch)

18 files under `core/modules/ckeditor5/css/`, +238/−32, plain `.css`. The module has **no** `.pcss.css`
sources (confirmed at the pinned commit and by `scripts/css-build.mjs`, which reports every changed file as
"no-source"), so core's generated-CSS rule does not apply and no CSS build is required.

What it does, in short (full rationale and alternatives in [`PROTOTYPE.md`](PROTOTYPE.md)):

1. each icon URL is defined once as `--ckeditor5-toolbar-icon` on `.ckeditor5-toolbar-item-<id>`, and the
   existing `background-image` on `.ckeditor5-toolbar-button-<id>` uses that variable (normal modes unchanged);
2. one shared block in `toolbar.admin.css` inside `@media (forced-colors: active)` uses
   `@container style(--ckeditor5-toolbar-icon)` so that only opted-in items get
   `background-color: CanvasText; background-image: none; mask-image: var(--ckeditor5-toolbar-icon)`; items
   without the property (contributed plugins) are not matched and keep their current rendering;
3. Heading, Style and Language are untouched (their generated text and CSS-border carets are already forced to
   `CanvasText`); Alignment moves its icon to the free `::before` surface in forced colors so the caret is not
   clipped, keeping the 10px/30px LTR/RTL icon offsets;
4. the block resets `filter: none` for toolbar buttons in forced colors, so a theme-level dark-mode
   `filter: invert(1)` (as proposed in #3637246) cannot invert the user's palette.

## Automated results — live Drupal, final patch (Chromium, emulated forced colors)

Runs live in `reports/issues/3534229/playwright/<stamp>-chromium-<mode>[-forced]-<WxH>/`; each `results.json`
has one row per discovered toolbar item (plugin, toolbar-item id, role, accessible name, background-image,
mask-image, colours, `forced-color-adjust`, geometry, at-rest/hover/focus rendered pixels, screenshot hash,
tooltip state). "35 items" = 12 available + 2 divider controls + 21 in the active toolbar (16 items + 5
dividers); `drupalMedia` is not available for Full HTML because its `media_embed` filter is off.

| Run (UTC) | Mode | Before invisible | After invisible | After min contrast | Hover lost | Focus lost | Tooltips | Unexpected | Verdict |
|---|---|---|---|---|---|---|---|---|---|
| `16-05-38` | forced dark 1280 | 31/35 | 0/35 | 21:1 | 0 | 0 | 35/35 | 0 | reproduced-and-fixed |
| `16-07-55` | forced light 1280 | 0/35 | 0/35 | 21:1 | 0 | 0 | 35/35 | 0 | not-reproduced |
| `16-10-08` | normal light 1280 | 0/35 | 0/35 | 17.16:1 | 0 | 0 | 35/35 | 0 | mixed (regression run: 0 rendering differences) |
| `16-12-08` | normal dark 1280 | 0/35 | 0/35 | 17.16:1 | 0 | 0 | 35/35 | 0 | mixed (regression run: 0 rendering differences) |
| `16-14-01` | forced dark RTL 1280 | 31/35 | 0/35 | 21:1 | 0 | 0 | 35/35 | 0 | reproduced-and-fixed |
| `16-15-49` | forced dark 1280, 480 px | 31/35 | 0/35 | 21:1 | 0 | 0 | 35/35 | 0 | reproduced-and-fixed |

A second full pass on the evening of 2026-11-27 (runs `23-19-55` to `23-29-04`) re-ran the matrix against the
same final patch and reproduced every verdict: forced dark, forced dark RTL and forced dark 480 px all
`reproduced-and-fixed` (31/35 → 0/35, `unexpected 0`), forced light `not-reproduced`, normal light/dark
`unexpected 0`, interaction `unexpected 0`. Two additions to the matrix:

- **Accessibility tree, ARIA and speech** (`tools/playwright/tree-diff.mjs 3534229-pinned`, report in
  `tree-diff/3534229-pinned/SUMMARY.md`): on `/admin/config/content/formats/manage/full_html` and
  `/admin/config/content/formats` the tree, ARIA state and spoken output are **the same in all three views**
  Before and After; 0 unresolved ID references were added or removed (3 pre-existing on both sides). A
  CSS-only change therefore does not alter names, roles, states or announcements.
- **WebKit normal mode** (`23-19-55-260Z-webkit-light-1280x900`): runs on the Safari engine, 35/35 controls
  render, `unexpected 0` — no normal-mode regression. WebKit cannot emulate forced colors on macOS, so it is
  a regression row only. This closes the WebKit coverage gap (7 of 9 matrix rows now tested).
- **Firefox**: attempted again (`18:22:33`); all four side retries fail with `browserContext.newPage: Target
  crashed` before a page exists. It remains blocked on this host (the Lab already records the same for
  #3619127); it is not evidence either way, and a real Windows/Firefox pass is still manual.

Reading the table:

- **The defect reproduces only in the dark forced palette.** In the light palette the icons were already
  black on white, so Before is 0/35 invisible there: the issue is palette-dependent, not absolute.
- **Negative control.** Before the fix, the measurement finds exactly the 31 icon-painted control instances
  invisible (25 icon-only items in the lists plus the 5 divider instances and the alignment icon), and keeps
  the 4 text/caret controls visible: the pixel method detects an invisible icon rather than always saying
  "visible". A non-empty `mask-image` was not accepted as proof: `results.json` records the rendered colours.
  (One intermediate proposal did record `drupalInsertImage` as `mask set but no pixels`; that run is kept but
  marked superseded, see below.)
- **After the fix every control renders content** at 21:1 in forced colors; normal modes stay at 17.16:1 or
  better and are identical Before/After: the comparison hashes the decoded pixels inside a 2 px inset, because raw screenshot bytes at fractional element positions can differ by one edge pixel that is capture rounding, not rendering. Raw screenshot hashes stay in `results.json`. The 480 px normal-mode run and the two 1280 px ones report 0 differences by both measures.
- **Hover, keyboard focus and tooltips** were exercised on every item on both sides: no icon disappears on
  hover, the focus outline stays on the list option (not the masked button: `4px solid rgba(26, 235, 255, 0.8)`,
  `:focus-visible` true), and 35/35 tooltips are visible on hover.
- **axe-core**: identical results Before and After in every run (`target-size` in all modes; `color-contrast`
  and `target-size` in forced dark). No new violations are introduced. axe is supplementary evidence, not
  proof of icon visibility.
- **Superseded runs** kept as history and not counted (`run-mark`): `15-19-47` (intermediate proposal,
  reproduced-not-fixed: a per-plugin `background-image` still painted over the mask), and `15-42-10`,
  `15-55-45`, `15-59-19`, `16-01-47` (runs made while the proposal was revised; the last change was a
  comment-only CSpell fix).

## Live run: combined #3637246 + #3534229 (`3534229-combined-3637246`)

The combined variant has its **own** After environment, `envs/issue-3534229-3637246`, built from the same
pinned commit with `branches/3637246-mr-17909.patch` then the mask patch. This reconciled the earlier
`lab-env status` warning in which the combined variant shared `envs/issue-3534229` with `3534229-pinned`:
one checkout cannot satisfy two different patch stacks, and the status check reported it. `lab-env status`
now shows no patch mismatch for either variant.

| Run (UTC) | Mode | Before invisible | After invisible | Buttons with a colour `filter` | Unexpected | Verdict |
|---|---|---|---|---|---|---|
| `19-28-34` | forced dark 1280 | 31/35 | 0/35 | 0 (computed `filter: none` on every button) | 0 | reproduced-and-fixed |
| `19-30-22` | forced light 1280 | 0/35 | 0/35 | 0 (computed `filter: none`) | 0 | not-reproduced |

This is the compatibility claim measured rather than inferred: with the #3637246 patch applied, its
`.dark-mode .ckeditor5-toolbar-button { filter: invert(1); }` is active in Default Admin dark mode, and the
forced-colors block's reset cancels it (every toolbar button computes `filter: none` in forced colors). The
masked icons therefore stay `CanvasText` at 21:1 instead of being inverted back out of visibility, and the
user's palette is not inverted. Without the reset the same masked icon measured 1:1 in the compat fixture
(see `COMPATIBILITY-3637246.md`). The MR itself was not modified.

## Live run: keyboard reordering, dragging, save/restore

`node tools/playwright/evaluate-3534229.mjs 3534229-pinned --scheme=light --interaction` (run `19-37-00`,
verdict `mixed`, `unexpected 0`) exercised the same interactions on pristine Before and patched After:

- **Keyboard reordering**: focusing an active option and pressing ArrowLeft moved it one place (order changed
  on both sides); after re-focusing the moved option, ArrowRight restored the original order on both sides.
- **Focus after the move** landed on `undo` (the first Available button), not on the moved option, identically
  Before and After. The admin JS restores focus through an AJAX `focus` event, and under automation the
  re-render takes focus first. This is **pre-existing** behaviour, not caused by the CSS patch; whether a
  person sees it in normal use needs a manual keyboard pass (listed under Not verified).
- **Pointer drag**: dragging moved the item (`dragChanged: true`) and the dragged control's icon stayed
  visible (16.83:1).
- **Save and restore**: Save configuration persisted the moved order across a reload (`savePersisted: true`);
  the original order was then restored with keyboard moves, saved again, and persisted (`restorePersisted:
  true`, final order equals the starting order).
- **Announcements**: none for ArrowLeft/ArrowRight, which is correct: core announces only add (ArrowDown) and
  remove (ArrowUp) for this UI. The empty announcement list is therefore expected, not a regression.


## Standalone fixture (DDEV-free)

`reports/issues/3534229/fixture/` compares A (current core), B (kentr's whole-element mask), C (the proposal)
and a simulated un-opted contributed plugin on the same page, and measures rendered pixels for every item.
`fixture/manifest.json` pins the core commit, patch sha256 and the hash of every CSS file and icon. Summary:
`fixture/SUMMARY.md`; method and the A/B/C design: [`PROTOTYPE.md`](PROTOTYPE.md).

Chromium `157.0.8103.15`, 22 scenarios, rendered pixels: normal light/dark A/B/C all 37/37 visible; forced light
A 37/37, B 36/37 (the un-opted contributed control lost its icon: a solid `ButtonText` box), C 37/37;
forced dark A 4/37 (33 invisible), B 36/37 (contributed control broken), C 36/37 (only the contributed control,
exactly as in A); forced dark RTL and 390 px, A 4/37 and C 36/37. Firefox launched 0 scenarios on this host
(44 recorded `Target crashed` failures), so it is not evidence either way.

## Compatibility with #3637246 (!17909)

See [`COMPATIBILITY-3637246.md`](COMPATIBILITY-3637246.md) and
[`COMPATIBILITY-3637246.json`](COMPATIBILITY-3637246.json) plus the small fixture in `compat-3637246/`.
Measured with Chromium forced-colors emulation: masked icon painted `CanvasText` = 21:1 in both palettes;
the same icon with `filter: invert(1)` = 1:1 (invisible) in forced dark and in forced-light + `.dark-mode`;
adding a forced-colors `filter: none` restores 21:1. Invert also turns the forced-dark `LinkText` yellow
(19.56:1) into blue (2.44:1), so it destroys a user palette. The patch therefore cancels the filter in
forced colors; the MR itself was not modified. Recommendations for the !17909 author are in that report.

## Code quality (core's own checks)

`node scripts/lint.mjs 3534229-pinned` → **PASS** (report: `lint/2026-11-27-3534229-pinned-after.md`):
CSpell PASS, PHPStan PASS, Stylelint PASS; core's CSS-build step is **SKIPPED** with "… no-source" for all 18
files, which is the correct outcome because this module ships plain CSS (no PostCSS source).
`node scripts/css-build.mjs 3534229-pinned --check` (final run): **SKIPPED** with 0 affected PostCSS
sources, source/output consistency PASS and "ready for submission: YES" — every changed file is reported as
"has no .pcss.css source in core, so there is nothing to compile". No generated CSS is involved. The later
evaluator runs on `3534229-pinned` print a CSS-build warning because that checkout's `core/node_modules` was
emptied when Docker Desktop restarted; it is irrelevant here (0 affected sources, nothing to compile) and the
combined variant's runs report the normal SKIPPED/no-source result.

Lab self-checks (`node scripts/selftest.mjs`): **exit 1, with 2 checks failing, none from this issue** — shared-
checkout state from other live sessions: (a) `unit tests: lab tools` has 4 environment-dependent failures (the
shared `lab.config.yml` auto-fix setting and the three macOS `cloud-origins` tests the Lab already documents as
local-only failures), (b) documentation links pointing at another session's `scripts/preflight.mjs` and
`docs/WORKSPACE-HYGIENE.md`. `variants: 92 variants` passes, so both variants used here are valid; `cloud/` was
regenerated (`build-cloud.mjs`) and its check passes; generated-CSS and patch-change checks pass.

`node scripts/index-issues.mjs` cannot run because of unrelated pre-existing data: `reports/issues/3603162/status.json`
stores `mr` as a string, and `tools/compare/issue-tracking.mjs:112` calls `mr.sha.toLowerCase()`. That file was
not edited (shared checkout); `reports/issues/README.md` is therefore not refreshed by this evaluation.

Cost: +238/−32 lines across 18 CSS files, one shared declaration block; no new files, no new network
requests, no JavaScript, no DOM changes, no duplicated SVG assets (all icons keep their existing paths).

## Findings

1. In forced-colors mode CSS keeps `url()` background images; an SVG's own fill is not recoloured, so a
   black icon disappears on a dark `Canvas` while staying visible on a light one. This is the root cause.
2. The toolbar controls are `role="option"` inside `role="listbox"`, not buttons: `CanvasText`/`Canvas` are the
   system colours that describe their surface, not `ButtonText`/`ButtonFace`.
3. A whole-control mask (kentr's experiment) is sufficient for a plain icon but clips the Alignment caret and
   the Heading/Style/Language text, and a `background` shorthand removes contributed plugins' icons if it is
   not scoped.
4. `filter: invert(1)` is not reset by forced colors; it inverts the user's palette and collides with a
   CanvasText mask. Any dark-mode filter must be guarded with `@media (forced-colors: none)` or reset inside
   forced colors (the patch does the latter for the toolbar).
5. The focusable element is the list option, not the button: focus outlines are not clipped by a mask on the
   button, and the existing `.ckeditor5-toolbar-button:focus` rule is dead CSS (inventory, item 3).
6. `drupalMedia` is not offered for the Standard Full HTML format because its `media_embed` filter is off; the
   `drupalInsertImage` condition is met. The UI therefore renders 28 of the 29 plugin items + 2 dividers.

## Not verified

- Whether the pre-existing focus-after-keyboard-move behaviour (focus lands on the first Available button)
  is visible to a person in normal use; a manual keyboard pass should check it.
- A real Windows contrast theme in Edge/Chromium/Firefox, and custom user palettes (`MANUAL-WINDOWS.md`);
  Chromium's emulated light/dark palettes are not a substitute.
- Firefox rendering: Playwright Firefox crashes on this macOS host (`browserContext.newPage: Target crashed`)
  before a page exists; attempted again on 2026-11-27. A real Windows/Firefox pass is manual.
- Safari/WebKit forced colors: not available on macOS; WebKit was run in normal mode only (no regression) and
  cannot test Windows contrast themes.
- A human keyboard pass and a screen-reader pass. The accessible names are unchanged by this CSS-only
  patch, but no person has confirmed it.
- The Standalone fixture is representative, not pixel-identical to Default Admin.
- This is a local proposal for review; it is not RTBC and no upstream CI has run it.
