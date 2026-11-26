# #3603162: Default Admin SVG consolidation and accessibility revision

**DRAFT — MR !17967 is open. No issue comment has been posted.**

Issue: https://www.drupal.org/project/drupal/issues/3603162
Original MR: https://git.drupalcode.org/project/drupal/-/merge_requests/16166
New MR: https://git.drupalcode.org/project/drupal/-/merge_requests/17967
Reviewed MR head: `fe4adb4f942385912bb3244b570afa475cadf3bd`
Current upstream `main`: `0387fb948f786bc344a5cc54aa0d98b8f552e378`
Merge base: `29b0a0b2256eb5ed27df6ec5e4e4e33142a717e8`
Issue fork branch: [https://git.drupalcode.org/issue/drupal-3603162/-/tree/3603162-svg-revision](https://git.drupalcode.org/issue/drupal-3603162/-/tree/3603162-svg-revision) — pushed; [MR !17967](https://git.drupalcode.org/project/drupal/-/merge_requests/17967) open.
Revision branch tip: `172c07efd8243f678eaa8697c47596eb62b3a747`

## What this revision changes

- Restores the autocomplete search icon as a mask on `.admin-autocomplete`; removes the undefined `--admin-icon-search-muted` properties.
- Defines `--admin-icon-edit-inverse` from the existing pencil geometry.
- Adds a dark-mode disabled check colour (`#adaeb3`) and limits the override to `@media (forced-colors: none)`.
- Corrects the disabled dark select chevron without competing with forced colours.
- Paints masked status-report icons with `CanvasText` in forced colours.
- Replaces the sticky loader pseudo-element with pre-tinted background images, because the controls are `<input type="submit">`.
- Covers both `edit-submit`/`sticky-edit-submit` and `edit-save`/`sticky-edit-save`, mirrors the keyframes for RTL, and keeps a reduced-motion indicator.
- Uses `currentColor` for tabledrag tree strokes and hides the inline SVG from assistive technology.
- Removes 15 assets and 20 registry entries with no source consumer.
- Optimises 45 SVGs with SVGO 3.3.2 only where Chromium pixel output is identical.

## Verified

| Check | Result |
|---|---|
| Static SVG validation | 64 files, 0 errors, 0 warnings |
| Icon reference audit | 0 undefined, 0 missing, 0 unused |
| Compiled icon equivalence | 51 compiled data URIs match source recursively |
| Pixel comparison | 45 adopted files identical; 6 skipped |
| Theme PHPUnit Unit/Kernel | 14 tests, 209 assertions, pass |
| Twig lint | 2 files, 0 errors |
| Stylelint | Changed compiled CSS passes |
| Compiled CSS check | Changed files reproduce with Core build |
| Axe, tested pages | 0 WCAG A/AA violations |
| Patch application | Complete patch and interdiff apply cleanly |

## Measured

- SVGs: 74 files / 41,981 bytes → 64 files / 29,835 bytes.
- `icons.css`: 40,615 bytes → 26,315 bytes; gzip 9,669 → 6,246; brotli 8,184 → 5,346.
- Dark disabled checkbox check contrast: 2.85:1 → 5.85:1; light unchanged at 3.78:1.

These are stylesheet measurements, not page-weight or carbon claims.

## Not verified

- Functional PHPUnit tests (8) need a test web server configured for the test database.
- Native Windows High Contrast.
- Firefox and WebKit.
- Full AJAX Save/Preview round trip; the real progress markup was injected because node Save is not an AJAX submit.
- Media library edit control was tested with the theme's own markup inside a real selected item; this fixture's widget display does not render that field.
- File-type icons, sort indicators, pager, messages, password controls, narrow-viewport local-task trigger.
- No WCAG 2.2 AA conformance claim.

See [EVIDENCE.md](EVIDENCE.md), [BRANCHES.md](BRANCHES.md) and [REPRODUCE.md](REPRODUCE.md).
