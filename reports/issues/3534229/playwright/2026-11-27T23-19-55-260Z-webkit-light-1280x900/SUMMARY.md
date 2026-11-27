# #3534229 live Drupal comparison — [object Object] light 1280x900

DRAFT. mixed. Normal mode: regression evidence only (screenshot hashes are compared with Before).

Page: `/admin/config/content/formats/manage/full_html`. Every toolbar item was discovered in the DOM (35 items). For each item: plugin, toolbar-item id, role, accessible name, background-image, mask-image, colours, forced-color-adjust, geometry, at-rest/hover/focus rendered pixels, screenshot hash and tooltip state are in `results.json` under `sides.<side>.rows`.

## Verdict rows

- precondition: **Every toolbar item was found on both sides** — expected true, got true
- precondition: **Before: rendered pixels recorded** — expected recorded, got 35
- regression: **Normal mode: rendering is byte-identical to Before** — expected 0, got 0

## Invisible items

Before: none. After: none.

Low contrast is reported per item in `rows[].rendered.atRest.icon.contrast`; icons are expected to reach at least 3:1 against the dominant colour of the control.

## Not verified

Rendered forced-colors pixels in Firefox/Safari/Edge, a real Windows contrast theme, custom user palettes and a screen-reader pass were not verified by this run.

## Context

| | Before | After |
|---|---|---|
| Core commit | `8a7df6cc3e 2026-11-27` | `8a7df6cc3e 2026-11-27` |
| Drupal, PHP | 12.0-dev, 8.5.7 | 12.0-dev, 8.5.7 |
| Profile; default / admin theme (config) | standard; default_admin / default_admin | standard; default_admin / default_admin |
| Theme that rendered each page | /user/1/edit → default_admin<br>/admin/config/content/formats/manage/full_html → default_admin | /user/1/edit → default_admin<br>/admin/config/content/formats/manage/full_html → default_admin |
| Languages (default) | none (en) | none (en) |
| Modules only on this side | none | none |
| Enabled modules | 39 | 39 |

CSS build of the After patch stack (core's build:css, separate from accessibility results): **BLOCKED**: the browser may not be loading the CSS this patch's PostCSS source produces, so this run does not validate the submitted patch.


## What could be announced

`Drupal.announce()` calls, and text changes inside live regions (role alert/status/log or aria-live). A recorded change is not proof that a screen reader spoke it; see the screen-reader run for that.

| Side | Source | Politeness | Text |
|---|---|---|---|
| before | none | | |
| after | none | | |

## Changes after input, and how a screen reader learns of them

After each click, key press or typing, the text that appeared or changed on the page. **Silent**: not in a live region, no `Drupal.announce()` after the same action, focus did not move to it, and the control pressed did not disclose it. A silent change is a candidate for WCAG 2.2 SC 4.1.3 Status Messages, for a person to judge: not every change is a status message. See docs/SILENT-CHANGES.md.

No silent change on either side.

Before: 0 in a live region, 0 Drupal.announce() after the same action, 16 focus moved to it, 0 shown by the control pressed (expanded), 0 inside the control itself, 15 the name of a control that appeared or changed, 0 silent.
After: 0 in a live region, 0 Drupal.announce() after the same action, 16 focus moved to it, 0 shown by the control pressed (expanded), 0 inside the control itself, 15 the name of a control that appeared or changed, 0 silent.


