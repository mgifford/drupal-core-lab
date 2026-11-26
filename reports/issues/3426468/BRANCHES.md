# Branch patches for #3426468

The original 2024 work was extracted from https://git.drupalcode.org/issue/drupal-3426468.git with
`git diff <merge-base> <branch tip>`. The `3426468-active-indicator*.patch` files are **not** from the issue fork:
they were written in the lab from comment #28 for the current Navigation CSS and are the patches under test.

| Patch | Source | Tip | Base | Files | sha256 |
|---|---|---|---|---|---|
| [`branches/3426468-make-the-active.patch`](branches/3426468-make-the-active.patch) | https://git.drupalcode.org/issue/drupal-3426468.git `3426468-make-the-active` | `da53770681` | `b064d94449d7` (2024-06-17) | 6 | `166aaa9b1cb3…` |
| [`branches/3426468-active-indicator.patch`](branches/3426468-active-indicator.patch) | authored in the lab (no merge request); v1 | — | `0387fb948f78` (2026-11-25, verified); also applied to `a48087f26ec0` | 2 | `887f9d9fdc55…` |
| [`branches/3426468-active-indicator-v2.patch`](branches/3426468-active-indicator-v2.patch) | authored in the lab; **follow-up to v1 (the interdiff)**; captured 2026-11-26 | — | v1 on `a48087f26ec0` | 4 | `5922b7c4ad91…` |

The full proposal is the **stack v1 + v2** on core `a48087f26ec0`
(2026-11-26, `task: #3633600 Use key/value over state in ImageModuleTestHooks`). The same state as one patch is
[`css-build/2026-11-26-3426468-latest-followup-full.patch`](css-build/2026-11-26-3426468-latest-followup-full.patch)
(sha256 `dfcb075b28fb…`); the v2 file is the interdiff from v1. Both apply to their declared starting tree and the
resulting proposals are equivalent apart from abbreviated `index` lines.

## What the patches do

v1 ([`3426468-active-indicator.patch`](branches/3426468-active-indicator.patch)) changes only the component:

- `core/modules/navigation/components/toolbar-button/toolbar-button.pcss.css`
- `core/modules/navigation/components/toolbar-button/toolbar-button.css`

It adds an always-on 4 px inline-start bar (the existing forced-colours indicator, made `currentColor` in normal
modes) to `.toolbar-button.current` and to the top-level item whose popover contains the active descendant, with a
new `--toolbar-button-current-indicator-width`. It also sets `--toolbar-button-current-color: gray-990` in the
module.

v2 ([`3426468-active-indicator-v2.patch`](branches/3426468-active-indicator-v2.patch)) changes four files:

- fixes the new comments from "colour" to "color"; CSpell failed the v1 patch with 8 unknown words;
- changes the **Default Admin theme's** `--toolbar-button-current-color` from `var(--admin-color-primary)` to
  `var(--admin-toolbar-color-gray-990)` in
  `core/themes/default_admin/css/components/navigation.pcss.css` and its generated `.css`.

The theme change was required because the theme's rule loads after the module's and set the active colour back to
`accent-500`. The module's `gray-990` declaration had no rendered effect: v1 measured the same blue
`rgb(1, 94, 254)` before and after. With v2 the active text and bar resolve to `rgb(25, 80, 212)`
(`lch(37.644 77.8721 288.155)`), text contrast 5.82:1 and bar contrast 6.69:1 in light mode.

The bar is still a bar, not the dot in the approved design; the submenu ancestor still has no marker. Those are
recorded as open design questions, not silently changed.

## Revision history

- **2026-10-15:** v1 written for the `3426468-latest` variant.
- **2026-11-26:** v2 captured after the browser matrix showed (a) the CSpell failure and (b) that the theme
  overrides the module's active colour. v1 is preserved byte for byte; its sha256 is unchanged. Because v1 itself
  was not edited, no `patch-change.mjs record` row is needed; v2 is an additive follow-up on top of it.

## Evidence

Nine runs on v1+v2 at `a48087f26ec0`: Chromium light, dark, forced colours (light and dark), collapsed sidebar,
480 px, emulated RTL, Firefox light and WebKit light. All are `reproduced-and-fixed`. See
[`EVIDENCE.md`](EVIDENCE.md) and `playwright/`.
