# Playwright evidence: #3273054 (3273054-pinned)

Run 2026-10-15T18:51:38.334Z. Core Before `ad11ba71c0 2026-10-15`, After `ad11ba71c0 2026-10-15` (no patch: authored in the lab). chromium 156.0.8078.4, light, 1280x900, darwin arm64. Real keys (Playwright Tab) and a real click into the filter field; axe-core WCAG 2.0 to 2.2 A/AA. Recorders: tools/playwright/lib/lab-run.mjs.

**Verdict: not-reproduced.** Neither side has an invisible stop. On this core the link is already gone from the permission title, so there is nothing here to fix (see SUMMARY.md: #3619751 removed it on main).

Rule: **fix** rows must differ (Before fails, After passes); **precondition** and **regression** rows must hold on both sides; **observe** rows are recorded, not judged.

| Type | Check | Before | After | Verdict |
|---|---|---|---|---|
| precondition | The permissions page has the Filter permissions field and the permissions table | true/true | true/true | as expected |
| precondition | Text-format permission labels found (after filtering) | 12 | 12 | as expected |
| precondition | Permission rows hidden by the filter (the walk provably covers the text-format rows) | 5/102 | 5/102 | as expected |
| precondition | Keyboard stops that are text-format checkboxes (reached by the walk) | 8 | 8 | as expected |
| fix | Focusable elements inside a visually-hidden label | 0 | 0 | **NOT as expected** |
| fix | Invisible keyboard stops from the filter field (under 4x4 px or in a visually-hidden label) | 0 | 0 | **NOT as expected** |
| regression | Checkboxes in the permissions table | 334 | 334 | as expected |
| regression | Labels on the page / of them visually hidden | 333 / 332 | 333 / 332 | as expected |
| regression | axe violations (elements) | 0 | 0 | as expected |
| regression | JavaScript errors | 0 | 0 | as expected |
| observe | Keyboard stops recorded from the filter field | 12 | 12 | as expected |

## Text-format permission labels (the thing the issue is about)

Before:

```yaml
[
  {
    "for": "edit-anonymous-use-text-format-basic-html",
    "visuallyHidden": true,
    "hasLink": false,
    "innerHTML": "Anonymous user: Use the Basic HTML text format"
  },
  {
    "for": "edit-authenticated-use-text-format-basic-html",
    "visuallyHidden": true,
    "hasLink": false,
    "innerHTML": "Authenticated user: Use the Basic HTML text format"
  },
  {
    "for": "edit-content-editor-use-text-format-basic-html",
    "visuallyHidden": true,
    "hasLink": false,
    "innerHTML": "Content editor: Use the Basic HTML text format"
  },
  {
    "for": "edit-administrator-use-text-format-basic-html",
    "visuallyHidden": true,
    "hasLink": false,
    "innerHTML": "Administrator: Use the Basic HTML text format"
  },
  {
    "for": "edit-anonymous-use-text-format-full-html",
    "visuallyHidden": true,
    "hasLink": false,
    "innerHTML": "Anonymous user: Use the Full HTML text format"
  },
  {
    "for": "edit-authenticated-use-text-format-full-html",
    "visuallyHidden": true,
    "hasLink": false,
    "innerHTML": "Authenticated user: Use the Full HTML text format"
  },
  {
    "for": "edit-content-editor-use-text-format-full-html",
    "visuallyHidden": true,
    "hasLink": false,
    "innerHTML": "Content editor: Use the Full HTML text format"
  },
  {
    "for": "edit-administrator-use-text-format-full-html",
    "visuallyHidden": true,
    "hasLink": false,
    "innerHTML": "Administrator: Use the Full HTML text format"
  },
  {
    "for": "edit-anonymous-use-text-format-restricted-html",
    "visuallyHidden": true,
    "hasLink": false,
    "innerHTML": "Anonymous user: Use the Restricted HTML text format"
  },
  {
    "for": "edit-authenticated-use-text-format-restricted-html",
    "visuallyHidden": true,
    "hasLink": false,
    "innerHTML": "Authenticated user: Use the Restricted HTML text format"
  },
  {
    "for": "edit-content-editor-use-text-format-restricted-html",
    "visuallyHidden": true,
    "hasLink": false,
    "innerHTML": "Content editor: Use the Restricted HTML text format"
  },
  {
    "for": "edit-administrator-use-text-format-restricted-html",
    "visuallyHidden": true,
    "hasLink": false,
    "innerHTML": "Administrator: Use the Restricted HTML text format"
  }
]
```

After:

```yaml
[
  {
    "for": "edit-anonymous-use-text-format-basic-html",
    "visuallyHidden": true,
    "hasLink": false,
    "innerHTML": "Anonymous user: Use the Basic HTML text format"
  },
  {
    "for": "edit-authenticated-use-text-format-basic-html",
    "visuallyHidden": true,
    "hasLink": false,
    "innerHTML": "Authenticated user: Use the Basic HTML text format"
  },
  {
    "for": "edit-content-editor-use-text-format-basic-html",
    "visuallyHidden": true,
    "hasLink": false,
    "innerHTML": "Content editor: Use the Basic HTML text format"
  },
  {
    "for": "edit-administrator-use-text-format-basic-html",
    "visuallyHidden": true,
    "hasLink": false,
    "innerHTML": "Administrator: Use the Basic HTML text format"
  },
  {
    "for": "edit-anonymous-use-text-format-full-html",
    "visuallyHidden": true,
    "hasLink": false,
    "innerHTML": "Anonymous user: Use the Full HTML text format"
  },
  {
    "for": "edit-authenticated-use-text-format-full-html",
    "visuallyHidden": true,
    "hasLink": false,
    "innerHTML": "Authenticated user: Use the Full HTML text format"
  },
  {
    "for": "edit-content-editor-use-text-format-full-html",
    "visuallyHidden": true,
    "hasLink": false,
    "innerHTML": "Content editor: Use the Full HTML text format"
  },
  {
    "for": "edit-administrator-use-text-format-full-html",
    "visuallyHidden": true,
    "hasLink": false,
    "innerHTML": "Administrator: Use the Full HTML text format"
  },
  {
    "for": "edit-anonymous-use-text-format-restricted-html",
    "visuallyHidden": true,
    "hasLink": false,
    "innerHTML": "Anonymous user: Use the Restricted HTML text format"
  },
  {
    "for": "edit-authenticated-use-text-format-restricted-html",
    "visuallyHidden": true,
    "hasLink": false,
    "innerHTML": "Authenticated user: Use the Restricted HTML text format"
  },
  {
    "for": "edit-content-editor-use-text-format-restricted-html",
    "visuallyHidden": true,
    "hasLink": false,
    "innerHTML": "Content editor: Use the Restricted HTML text format"
  },
  {
    "for": "edit-administrator-use-text-format-restricted-html",
    "visuallyHidden": true,
    "hasLink": false,
    "innerHTML": "Administrator: Use the Restricted HTML text format"
  }
]
```

Permission titles in the table (text formats) — Before: [
  "Use the Basic HTML text format",
  "Use the Full HTML text format",
  "Use the Restricted HTML text format"
]; After: [
  "Use the Basic HTML text format",
  "Use the Full HTML text format",
  "Use the Restricted HTML text format"
].

One text-format permission row (markup) — Before: `<tr data-drupal-selector="edit-permissions-use-text-format-basic-html" class="even"> <td data-drupal-wrapper-selector="edit-permissions-use-text-format-basic-html-description"><div class="permission"><span class="title table-filter-text-source">Use the Basic HTML text format</span><div class="description" data-admin-compact-collapsible=""><em>Warning: This permission may have security implications depending on how the text format is configured.</em></div></div></td> <td class="checkbox" data-drupal-wrapper-selector="edit-anonymous-use-text-format-basic-html"><div class="checkbox js-form-item form-item js-form-type-checkbox form-type--checkbox form-type--boolean js-form-item-anonymous-use-text-format-basic-html form-item--anonymous-use-text-format-basic-html form-item--no-label" data-drupal-wrapper-selector="edit-anonymous-use-text-format-basic-html"> <label for="edit-anonymous-use-text-f`

After: `<tr data-drupal-selector="edit-permissions-use-text-format-basic-html" class="even"> <td data-drupal-wrapper-selector="edit-permissions-use-text-format-basic-html-description"><div class="permission"><span class="title table-filter-text-source">Use the Basic HTML text format</span><div class="description" data-admin-compact-collapsible=""><em>Warning: This permission may have security implications depending on how the text format is configured.</em></div></div></td> <td class="checkbox" data-drupal-wrapper-selector="edit-anonymous-use-text-format-basic-html"><div class="checkbox js-form-item form-item js-form-type-checkbox form-type--checkbox form-type--boolean js-form-item-anonymous-use-text-format-basic-html form-item--anonymous-use-text-format-basic-html form-item--no-label" data-drupal-wrapper-selector="edit-anonymous-use-text-format-basic-html"> <label for="edit-anonymous-use-text-f`

Permission rows after filtering — Before 5 of 102 visible; After 5 of 102. The filter listens on keyup, so the walk types into the field; a scripted `fill()` leaves the table unfiltered.

## Keyboard stops after the Filter permissions field

Before (12 stops, 0 invisible, 8 on text-format checkboxes):

| Focused element | In table | In a visually-hidden label | Text format | Box (px) | :focus-visible | Outline | Name |
|---|---|---|---|---|---|---|---|
| input[type=checkbox]#edit-anonymous-administer-filters | yes | no | no | 21x21 | true | solid 4px rgb(0, 125, 250) |  |
| input[type=checkbox]#edit-authenticated-administer-filters | yes | no | no | 21x21 | true | solid 4px rgb(0, 125, 250) |  |
| input[type=checkbox]#edit-content-editor-administer-filters | yes | no | no | 21x21 | true | solid 4px rgb(0, 125, 250) |  |
| input[type=checkbox]#edit-anonymous-use-text-format-basic-html | yes | no | yes | 21x21 | true | solid 4px rgb(0, 125, 250) |  |
| input[type=checkbox]#edit-authenticated-use-text-format-basic-html | yes | no | yes | 21x21 | true | solid 4px rgb(0, 125, 250) |  |
| input[type=checkbox]#edit-anonymous-use-text-format-full-html | yes | no | yes | 21x21 | true | solid 4px rgb(0, 125, 250) |  |
| input[type=checkbox]#edit-authenticated-use-text-format-full-html | yes | no | yes | 21x21 | true | solid 4px rgb(0, 125, 250) |  |
| input[type=checkbox]#edit-content-editor-use-text-format-full-html | yes | no | yes | 21x21 | true | solid 4px rgb(0, 125, 250) |  |
| input[type=checkbox]#edit-anonymous-use-text-format-restricted-html | yes | no | yes | 21x21 | true | solid 4px rgb(0, 125, 250) |  |
| input[type=checkbox]#edit-authenticated-use-text-format-restricted-html | yes | no | yes | 21x21 | true | solid 4px rgb(0, 125, 250) |  |
| input[type=checkbox]#edit-content-editor-use-text-format-restricted-html | yes | no | yes | 21x21 | true | solid 4px rgb(0, 125, 250) |  |
| input[type=submit]#edit-submit | no | no | no | 154x38 | true | solid 3px rgb(255, 255, 255) |  |

After (12 stops, 0 invisible, 8 on text-format checkboxes):

| Focused element | In table | In a visually-hidden label | Text format | Box (px) | :focus-visible | Outline | Name |
|---|---|---|---|---|---|---|---|
| input[type=checkbox]#edit-anonymous-administer-filters | yes | no | no | 21x21 | true | solid 4px rgb(0, 125, 250) |  |
| input[type=checkbox]#edit-authenticated-administer-filters | yes | no | no | 21x21 | true | solid 4px rgb(0, 125, 250) |  |
| input[type=checkbox]#edit-content-editor-administer-filters | yes | no | no | 21x21 | true | solid 4px rgb(0, 125, 250) |  |
| input[type=checkbox]#edit-anonymous-use-text-format-basic-html | yes | no | yes | 21x21 | true | solid 4px rgb(0, 125, 250) |  |
| input[type=checkbox]#edit-authenticated-use-text-format-basic-html | yes | no | yes | 21x21 | true | solid 4px rgb(0, 125, 250) |  |
| input[type=checkbox]#edit-anonymous-use-text-format-full-html | yes | no | yes | 21x21 | true | solid 4px rgb(0, 125, 250) |  |
| input[type=checkbox]#edit-authenticated-use-text-format-full-html | yes | no | yes | 21x21 | true | solid 4px rgb(0, 125, 250) |  |
| input[type=checkbox]#edit-content-editor-use-text-format-full-html | yes | no | yes | 21x21 | true | solid 4px rgb(0, 125, 250) |  |
| input[type=checkbox]#edit-anonymous-use-text-format-restricted-html | yes | no | yes | 21x21 | true | solid 4px rgb(0, 125, 250) |  |
| input[type=checkbox]#edit-authenticated-use-text-format-restricted-html | yes | no | yes | 21x21 | true | solid 4px rgb(0, 125, 250) |  |
| input[type=checkbox]#edit-content-editor-use-text-format-restricted-html | yes | no | yes | 21x21 | true | solid 4px rgb(0, 125, 250) |  |
| input[type=submit]#edit-submit | no | no | no | 154x38 | true | solid 3px rgb(255, 255, 255) |  |

<details><summary>Every focusable element found inside a visually-hidden label before the keyboard walk</summary>

Before:

```yaml
[]
```

After:

```yaml
[]
```

</details>

## Context

| | Before | After |
|---|---|---|
| Core commit | `ad11ba71c0 2026-10-15` | `ad11ba71c0 2026-10-15` |
| Drupal, PHP | 12.0-dev, 8.5.8 | 12.0-dev, 8.5.8 |
| Profile; default / admin theme (config) | standard; default_admin / default_admin | standard; default_admin / default_admin |
| Theme that rendered each page | /user/1/edit → default_admin<br>/admin/people/permissions → null | /user/1/edit → default_admin<br>/admin/people/permissions → null |
| Languages (default) | none (en) | none (en) |
| Modules only on this side | none | none |
| Enabled modules | 39 | 39 |

## AJAX responses

Every Drupal AJAX response, in order; raw commands in `ajax-before.json` and `ajax-after.json`.

**Before** (0 responses)


**After** (0 responses)


## What could be announced

`Drupal.announce()` calls, and text changes inside live regions (role alert/status/log or aria-live). A recorded change is not proof that a screen reader spoke it; see the screen-reader run for that.

| Side | Source | Politeness | Text |
|---|---|---|---|
| before | Drupal.announce | polite | 4 permissions are available in the modified list. |
| before | Drupal.announce | polite | 4 permissions are available in the modified list. |
| before | Drupal.announce | polite | 4 permissions are available in the modified list. |
| after | Drupal.announce | polite | 4 permissions are available in the modified list. |
| after | Drupal.announce | polite | 4 permissions are available in the modified list. |
| after | Drupal.announce | polite | 4 permissions are available in the modified list. |

axe rules: Before {}, After {}. JavaScript errors: Before [], After [].

Screenshots: `before-permissions-table.png`, `after-permissions-table.png`, `before-page.png`, `after-page.png`.

Limits: this records where focus goes and how big the focused box is. Whether a focus indicator is *legible* is a person's call; the forced-colours and dark rows of the variant's coverage matrix are separate runs.
