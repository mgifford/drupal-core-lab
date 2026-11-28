# Standalone fixture: #3534229 CKEditor 5 toolbar configuration in forced-colors mode

A browser-only reproduction of the "Toolbar configuration" fieldset on
`/admin/config/content/formats/manage/full_html`, with three implementations side by side and a
backward-compatibility control. It needs no Drupal, no database and no network.

Status: **DRAFT** evidence for [drupal.org #3534229](https://www.drupal.org/project/drupal/issues/3534229).
Nothing here was posted anywhere.

## What it shows

| Variant | Implementation | What it is |
|---|---|---|
| A | current core | the pinned core CSS unchanged: icons are SVG `background-image`s |
| B | whole-element mask | Kent's 2024-07-24 experiment (issue comment #7), selector list extended to every item so the comparison is fair |
| C | dedicated mask | the proposed correction: each icon URL is defined once as `--ckeditor5-toolbar-icon`; in forced colors the opted-in icon is repainted as a mask in `CanvasText` |
| control | simulated contributed plugin | `ckeditor5-toolbar-button-contribExample` sets only a `background-image`, no new custom property |

The fixture also renders every Core toolbar item, not just the ones Full HTML enables: the Available
buttons list, the Button divider list, and the Active toolbar of the Standard install's Full HTML format
(16 items + 5 dividers), built with core's own `Drupal.theme.ckeditor5Button()` markup and class names.

## Build and run

```sh
node reports/issues/3534229/fixture/build-fixture.mjs
node reports/issues/3534229/fixture/build-fixture.mjs --patch reports/issues/3534229/branches/3534229-<name>.patch
node reports/issues/3534229/fixture/evaluate.mjs --browser=chromium
```

`build-fixture.mjs` extracts `core/modules/ckeditor5/css/` and `icons/` from the pinned core commit with
`git archive`, and, when given `--patch`, applies the proposal to the extracted copy and keeps the patched
CSS as `assets/css-patched/`. `manifest.json` records the pin, the patch sha256 and the hash of every CSS
file and icon, so a screenshot can be tied to exact inputs.

`evaluate.mjs` starts a static HTTP server (required: Chromium refuses `mask-image` requests from
`file://`), renders each variant in normal light, normal dark, forced-colors light and forced-colors dark,
in LTR and RTL, at desktop and narrow widths, and records computed CSS plus **rendered pixels** for every
toolbar item at rest, on hover and on keyboard focus. Results land in `results-<browser>.json`, `SUMMARY.md`
and `screenshots/`.

To look at it by hand, serve the directory and open `index.html`:

```sh
npx http-server reports/issues/3534229/fixture   # or any static server
```

## Provenance

- Pinned core: see `manifest.json` → `pin` (`8a7df6cc3e69…`).
- Patch: see `manifest.json` → `patch.sha256`; the patch file itself is linked from
  `../EVIDENCE.md` and `../BRANCHES.md`.

## Limits

- It is **representative**, not pixel-identical to Default Admin: the page shell uses CSS system colours and
  core's `visually-hidden` utility, while the toolbar CSS is the real pinned core CSS.
- Forced-colors palettes are the browser's emulated light/dark palettes. A real Windows contrast theme,
  custom palettes, and Firefox/Safari rendering are **not** covered here (see `../MANUAL-WINDOWS.md`).
- Dragging, keyboard reordering and saving the configuration need Drupal; the Lab evaluator
  `tools/playwright/evaluate-3534229.mjs --interaction` covers them.
