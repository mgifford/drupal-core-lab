# #3534229 live Drupal comparison — [object Object] light 1280x900

DRAFT. mixed. Normal mode: regression evidence only (screenshot hashes are compared with Before).

Page: `/admin/config/content/formats/manage/full_html`. Every toolbar item was discovered in the DOM (35 items). For each item: plugin, toolbar-item id, role, accessible name, background-image, mask-image, colours, forced-color-adjust, geometry, at-rest/hover/focus rendered pixels, screenshot hash and tooltip state are in `results.json` under `sides.<side>.rows`.

## Verdict rows

- precondition: **Every toolbar item was found on both sides** — expected true, got true
- precondition: **Before: rendered pixels recorded** — expected recorded, got 35
- regression: **Normal mode: rendering is byte-identical to Before** — expected 0, got 1

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


## What could be announced

`Drupal.announce()` calls, and text changes inside live regions (role alert/status/log or aria-live). A recorded change is not proof that a screen reader spoke it; see the screen-reader run for that.

| Side | Source | Politeness | Text |
|---|---|---|---|
| before | none | | |
| after | none | | |

## Changes after input, and how a screen reader learns of them

After each click, key press or typing, the text that appeared or changed on the page. **Silent**: not in a live region, no `Drupal.announce()` after the same action, focus did not move to it, and the control pressed did not disclose it. A silent change is a candidate for WCAG 2.2 SC 4.1.3 Status Messages, for a person to judge: not every change is a status message. See docs/SILENT-CHANGES.md.

| | Side | Page | After | Text (first; last) | Where | Times |
|---|---|---|---|---|---|---|
| on both sides | after | `/admin/config/content/formats/manage/full_html` | key Tab a.admin-toolbar__logo "Home page" | Create | `div.toolbar-tooltip.admin-toolbar__tooltip` | 1 |
| on both sides | after | `/admin/config/content/formats/manage/full_html` | key Tab a.toolbar-button.toolbar-button--icon--navigation-create "C… | Blocks | `div.toolbar-tooltip.admin-toolbar__tooltip` | 1 |
| on both sides | after | `/admin/config/content/formats/manage/full_html` | key Tab a.toolbar-button.toolbar-button--icon--navigation-blocks "B… | Content | `div.toolbar-tooltip.admin-toolbar__tooltip` | 1 |
| on both sides | after | `/admin/config/content/formats/manage/full_html` | key Tab a.toolbar-button.toolbar-button--icon--navigation-content "… | Files | `div.toolbar-tooltip.admin-toolbar__tooltip` | 1 |
| on both sides | after | `/admin/config/content/formats/manage/full_html` | key Tab a.toolbar-button.toolbar-button--icon--navigation-files "Fi… | Welcome | `div.toolbar-tooltip.admin-toolbar__tooltip` | 1 |
| on both sides | after | `/admin/config/content/formats/manage/full_html` | key Tab button.toolbar-button.toolbar-button--icon--system-admin-st… | Appearance | `div.toolbar-tooltip.admin-toolbar__tooltip` | 1 |
| on both sides | after | `/admin/config/content/formats/manage/full_html` | key Tab button.toolbar-button.toolbar-button--icon--system-admin-co… | People | `div.toolbar-tooltip.admin-toolbar__tooltip` | 1 |
| on both sides | after | `/admin/config/content/formats/manage/full_html` | key Tab button.toolbar-button.toolbar-button--icon--system-admin-re… | Announcements | `div.toolbar-tooltip.admin-toolbar__tooltip` | 1 |
| on both sides | after | `/admin/config/content/formats/manage/full_html` | key Tab a.toolbar-button.toolbar-button--icon--announcements-feed-a… | Help | `div.toolbar-tooltip.admin-toolbar__tooltip` | 1 |
| on both sides | after | `/admin/config/content/formats/manage/full_html` | key ArrowLeft li.ckeditor5-toolbar-item.ckeditor5-toolbar-item-italic "ac… | Processing... | `div.ajax-progress__message` | 1 |
| on both sides | after | `/admin/config/content/formats/manage/full_html` | key ArrowLeft li.ckeditor5-toolbar-item.ckeditor5-toolbar-item-bold "acti… | Processing... | `div.ajax-progress__message` | 1 |

Before: 0 in a live region, 0 Drupal.announce() after the same action, 39 focus moved to it, 0 shown by the control pressed (expanded), 0 inside the control itself, 16 the name of a control that appeared or changed, 11 silent.
After: 0 in a live region, 0 Drupal.announce() after the same action, 37 focus moved to it, 0 shown by the control pressed (expanded), 0 inside the control itself, 16 the name of a control that appeared or changed, 11 silent.


