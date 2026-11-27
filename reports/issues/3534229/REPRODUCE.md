# Reproduce #3534229: CKEditor 5 toolbar-configuration icons in forced-colors mode

**DRAFT.** Setup and steps are written; the evidence is in `EVIDENCE.md` and is a draft until a person has
reviewed it. Nothing here was posted to drupal.org.

- Issue: <https://www.drupal.org/project/drupal/issues/3534229>
- Related issue: <https://www.drupal.org/project/drupal/issues/3637246>, MR
  [!17909](https://git.drupalcode.org/project/drupal/-/merge_requests/17909) (compatibility only; not modified)
- Pinned core: `8a7df6cc3e69b6b5d427cb25ce8f66dda8393c29` (2026-11-27, "fix: #2778345 Views argument
  validators aren't taken into account on access checks …")
- Last verified: see `EVIDENCE.md` (dated runs).

## Task and barrier

An administrator edits a text format (`/admin/config/content/formats/manage/full_html`) and rearranges
CKEditor 5 toolbar buttons in the "Toolbar configuration" fieldset: Available buttons → Active toolbar with
the mouse or with the arrow keys. The controls are 36×36 chips whose visible content is an SVG
`background-image`.

With a forced-colors (high-contrast) palette, the browser keeps `url()` background images (only
`background-image` values without `url()` are forced to `none`), but the SVGs keep their baked-in black
fill. On a dark forced palette `Canvas` is black, so every icon-only control becomes an empty chip: the
administrator cannot tell Bold from Italic, Undo from Redo, or a working toolbar item from a broken one.
In the light forced palette the icons remain black on a white Canvas and stay visible, which is why the
defect is palette-dependent. Heading, Style and Language use generated text and a CSS-border caret, so
they stay legible, and Alignment keeps its caret but loses its icon.

This is a visual/recognition barrier (WCAG 1.4.1 Use of Color, 1.4.11 Non-text Contrast), not a
keyboard or screen-reader blocker: the accessible names remain and the controls remain operable.

## Preconditions and comparison identity

| | Before | After |
|---|---|---|
| Variant | `3534229-pinned` | `3534229-pinned` |
| Environment | `envs/baseline-3534229` | `envs/issue-3534229` |
| Core commit | `8a7df6cc3e69b6b5d427cb25ce8f66dda8393c29` | same |
| Recipe | `recipes/repro_3534229/recipe.yml` (Standard install, no post-recipe script) | same |
| Patches | none | `reports/issues/3534229/branches/3534229-forced-colors-mask.patch`, sha256 `c1c969bd…`, applied by `tools/compare/setup.mjs` |
| Theme | Default Admin (both the default and the admin theme of the Standard install) | same |
| Account | `admin` (any role that may administer text formats) | same |
| Page | `/admin/config/content/formats/manage/full_html` | same |

`3534229-latest` is registered and inherits the same patch and steps; it is not built here because the
pinned commit was already current `main` when this evaluation was made. There is no merge request for this
issue. One issue-fork branch exists (`3534229-ckeditor-config-buttons` in
`https://git.drupalcode.org/issue/drupal-3534229.git`) but it has **zero commits** beyond core `main`
(checked 2026-11-27), so there is no other contributor's work to take over; nothing was pushed to it.

The After environment is a local proposal written in the Lab (`"after": { "authoring": true }`), captured
with `scripts/capture-patch.mjs`, and is a candidate for an upstream merge request. It is **not** an
upstream patch, and `#3637246`'s MR is untouched.

## Start locally

Run from the Lab repository root, with Docker and DDEV available. No `#` comments inside the blocks
(macOS zsh), no placeholder arguments on command lines.

```bash
node tools/compare/setup.mjs 3534229-pinned --check-patches
node tools/compare/setup.mjs 3534229-pinned
node scripts/lab-env.mjs start 3534229-pinned
```

1. `--check-patches` verifies the proposed CSS patch applies to the pinned commit; fix or re-capture it if
   it does not.
2. `setup.mjs` builds both environments (Standard install plus recipe). It is resumable: re-run it if it
   stops.
3. `lab-env.mjs start` starts both sites and the viewer. The viewer is at `https://drupal-compare.ddev.site`
   or <http://localhost:8100>; both sites log in as `admin`/`admin`.

## Reproduce by hand

1. Open `/admin/config/content/formats/manage/full_html` in both frames (the viewer does this on Go).
2. Turn on forced colours. In the Lab browser use the viewer's forced-colours switch; in Chromium DevTools
   use Rendering → Emulate CSS media feature `forced-colors: active`. For the dark palette also set the
   colour scheme to dark (DevTools: Emulate CSS media feature `prefers-color-scheme: dark`, or the viewer's
   dark switch). Test both palettes.
3. Compare the three lists: **Available buttons**, **Button divider**, **Active toolbar**.
   - Before (forced dark): every icon-only chip is empty; only Heading, Style and Language show content.
   - Before (forced light): the black icons are visible on white; this palette does **not** reproduce.
   - After (both palettes): every icon-only chip shows its icon in the user's `CanvasText`.
4. Tab through the items and hover one: the tooltip must appear and the focus outline must stay visible.
   Alignment must keep both its icon and its caret; Heading, Style and Language must keep their text.
5. In the viewer press **Run checks** after the manual steps.

## Scripted replay

With both sites running:

```bash
node tools/playwright/evaluate-3534229.mjs 3534229-pinned --forced-colors --scheme=dark
node tools/playwright/evaluate-3534229.mjs 3534229-pinned --forced-colors --scheme=light
node tools/playwright/evaluate-3534229.mjs 3534229-pinned --scheme=light
node tools/playwright/evaluate-3534229.mjs 3534229-pinned --scheme=dark
node tools/playwright/evaluate-3534229.mjs 3534229-pinned --forced-colors --scheme=dark --rtl
node tools/playwright/evaluate-3534229.mjs 3534229-pinned --forced-colors --scheme=dark --viewport=480x900
node tools/playwright/evaluate-3534229.mjs 3534229-pinned --scheme=light --interaction
```

`--rtl` sets `dir="rtl"` on `<html>` after load: it exercises the `[dir="rtl"]` CSS rules, not a translated
UI. `--interaction` tests keyboard reordering, dragging, and saving/restoring the toolbar; it changes the
disposable site's configuration. Each run writes
`reports/issues/3534229/playwright/<stamp>-<browser>-<scheme>[-forced]-<WxH>/`.

Optional supplements:

```bash
node tools/playwright/walkthrough.mjs 3534229-pinned --forced-colors --scheme=dark
node scripts/lint.mjs 3534229-pinned
node scripts/css-build.mjs 3534229-pinned --check
node scripts/coverage.mjs 3534229
node scripts/check-draft.mjs 3534229
```

## Standalone fixture

The same markup and CSS can be compared without Drupal (A = current core, B = Kent's whole-element mask,
C = the proposal, plus an un-opted contributed control). See `fixture/README.md`.

## Expected and actual

Expected: in every forced palette the administrator can recognize each toolbar button, the active and
available lists stay distinguishable, and focus, hover, tooltips, dragging, keyboard reordering and saving
still work. Normal light/dark presentation is unchanged.

Actual: see `EVIDENCE.md` and the run folders. Summarised: Before reproduces in forced dark only; After
renders every icon in both forced palettes and, in normal modes, the browser output is byte-identical to
Before.

## Not verified here

- A real Windows contrast theme (and Edge/Firefox on Windows): see `MANUAL-WINDOWS.md`.
- Firefox forced-colors rendering: Playwright's Firefox cannot launch on this macOS host.
- Safari/WebKit: no forced-colors emulation on macOS; Safari cannot test Windows contrast themes.
- A human keyboard pass and screen-reader pass: automated keyboard input is evidence, not a person.
- The Standalone fixture is representative, not pixel-identical to Default Admin.
