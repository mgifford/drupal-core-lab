<!-- DRAFT for a human to review and post. Nothing has been posted. Written 2026-10-02. Check the issue for newer comments first. -->

**AI-assisted:** yes. Tool: Claude Code. External code copied: no. Sources consulted: Drupal core (MR !17078 at `e8b2e166be8` on core `main` `8cd44d484e3`), WCAG 2.2, CSS Color Adjust Module Level 1.

Testing MR !17078 in Chromium, side by side with the same core without the change (details sections, the node form's sidebar accordion, vertical tabs and the narrow-width accordion fallback; light, dark, forced colours light and dark, right-to-left with Farsi (light only), JavaScript off (the form_test page only); at rest, hover and keyboard focus).

### Works
- The MR's tests pass with the change (`FormGroupingElementsTest` in core and in Default Admin, `NodeEditFormTest`) and fail without it, for the expected reason (no `data-child-error-count`).
- The compiled `.css` matches the `.pcss.css` for all four changed stylesheets (`yarn build:css --check`).
- The red bar, label and icon show in light and dark, in RTL in light mode (bar on the start edge), and the server-rendered `data-child-error-count` is present with JavaScript off.
- The transparent summary background keeps the full red outline in the narrow vertical-tab case; removing it and raising the bar with `z-index` instead lost the outline on the top and right.

### Two suggestions (patches attached: A and B, each applies on top of the MR)
1. **Forced-colours icon colour (the review question).** The icon is `canvasText` (black or white) while the label is link-coloured. `background: currentColor` alone makes the icon disappear in forced colours (contrast 1:1) because forced colours overrides it; `forced-color-adjust: preserve-parent-color` makes the icon take the label's colour in both palettes (`#00009f` and `#ffff00` here), with `canvasText` kept as the fallback inside `@supports`.
2. **Dark-mode contrast of the error colour.** `--admin-color-error` in dark mode (`#ce6060`) is 3.72:1 on the details label, 4.48:1 on a tab label and 2.56:1 for the icon on the hover tint. The theme already has `--admin-color-text-error` (`#e69e9e`, 6.64:1, 7.98:1, 4.57:1); using it for the label and icon passes everywhere and does not change the global token, so it can stay separate from #3625458. In light mode the colour passes (4.88:1). The light-mode hover label (4.17:1) is identical without the MR, so it is not caused by it.

### Observation, not a defect
While hovered, the label turns link-blue, so the error colour is lost for the label (the bar and icon stay red).

### Steps to reproduce (local, DDEV)
Recipe and patches are in https://github.com/mgifford/drupal-core-lab (`reports/issues/3604037/`): `node tools/compare/setup.mjs 3604037-latest`, then `node scripts/lab-env.mjs start 3604037-latest`. The steps are listed in the viewer. The recipe is `recipes/repro_3604037`; the MR also changes the `form_test` page, so the same change is applied to the baseline.

### Not verified
Firefox and Safari; a real Windows contrast theme (forced colours was emulated); browser support for `preserve-parent-color` beyond Chromium; a real screen-reader pass; the two suggestions have not been run through the MR's PHPUnit tests.
