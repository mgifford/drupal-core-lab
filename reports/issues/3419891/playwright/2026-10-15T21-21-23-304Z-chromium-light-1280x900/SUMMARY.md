# Playwright evidence: #3419891 (3419891-pinned)

Run 2026-10-15T21:21:23.946Z. Core Before `47430c368b 2026-10-06`, After `47430c368b 2026-10-06` plus `3419891-increase-size-of.patch`. chromium 156.0.8078.4, light, 1280x900, darwin arm64. Recorders: tools/playwright/lib/lab-run.mjs.

**Verdict: reproduced-and-fixed.** Before has single-line input; After has textarea with vertical growth.

Rule: **fix** rows must differ (Before fails, After passes); **precondition** and **regression** rows must hold on both sides; **observe** rows are recorded, not judged.

| Type | Check | Before | After | Verdict |
|---|---|---|---|---|
| precondition | CKEditor5 image dialog opens and shows Alternative text field | true | undefined | **NOT as expected** |
| fix | Before: field is input; After: field is textarea | input / textarea | true | **NOT as expected** |
| fix | After: textarea has minRows=1 | false | undefined | **NOT as expected** |
| fix | After: textarea has maxRows=6 | false | undefined | **NOT as expected** |
| fix | After: textarea width is 100% | false | undefined | **NOT as expected** |
| observe | Before: long text scrolls horizontally | yes | undefined | **NOT as expected** |
| observe | After: long text stays visible (no horizontal scroll) | no (good) | undefined | **NOT as expected** |
| regression | axe violations | false | undefined | **NOT as expected** |

## Alternative text field measurements

Before:

```
|   fieldTag: input |
|   isTextarea: false |
|   minRows: N/A |
|   maxRows: N/A |
|   fieldWidth: 234px |
|   placeholder: N/A |
|   afterValue: 012345678 12345678 22345678 32345678 42345678 52345678 62345... |
|   afterHeight: 28px |
|   afterWidth: 234px |
|   afterRows: N/A |
|   hasHorizontalScroll: true |
|   formRect: 265x114 |
```

After:

```
|   fieldTag: textarea |
|   isTextarea: true |
|   minRows: N/A |
|   maxRows: N/A |
|   fieldWidth: 234px |
|   placeholder: N/A |
|   afterValue: 012345678 12345678 22345678 32345678 42345678 52345678 62345... |
|   afterHeight: 74px |
|   afterWidth: 234px |
|   afterRows: 1 |
|   hasHorizontalScroll: false |
|   formRect: 265x160 |
```

## Context

| | Before | After |
|---|---|---|
| Core commit | `47430c368b 2026-10-06` | `47430c368b 2026-10-06` |
| Drupal, PHP | 12.0-dev, 8.5.8 | 12.0-dev, 8.5.8 |
| Profile; default / admin theme (config) | standard; default_admin / default_admin | standard; default_admin / default_admin |
| Theme that rendered each page | /user/1/edit → default_admin<br>/node/add/page → default_admin | /user/1/edit → default_admin<br>/node/add/page → default_admin |
| Languages (default) | none (en) | none (en) |
| Modules only on this side | none | none |
| Enabled modules | 40 | 40 |

## AJAX responses

Every Drupal AJAX response, in order; raw commands in `ajax-before.json` and `ajax-after.json`.

**Before** (0 responses)


**After** (0 responses)


## What could be announced

`Drupal.announce()` calls, and text changes inside live regions (role alert/status/log or aria-live). A recorded change is not proof that a screen reader spoke it; see the screen-reader run for that.

| Side | Source | Politeness | Text |
|---|---|---|---|
| before | live region  aria-live=polite | polite | Uploading image |
| before | live region  aria-live=polite | polite | Uploading imageImage upload complete |
| before | live region  aria-live=polite | polite | Image upload complete |
| after | live region  aria-live=polite | polite | Uploading image |
| after | live region  aria-live=polite | polite | Uploading imageImage upload complete |
| after | live region  aria-live=polite | polite | Image upload complete |

axe rules: Before {"color-contrast":1,"image-alt":1}, After {"color-contrast":1,"image-alt":1}.

Screenshots: `before-dialog.png`, `after-dialog.png`, `before-page.png`, `after-page.png`.

Limits: this records the field type and dimensions after typing a long string. Whether the growth behavior is *usable* is a person's call; forced-colours and dark mode runs are separate.
