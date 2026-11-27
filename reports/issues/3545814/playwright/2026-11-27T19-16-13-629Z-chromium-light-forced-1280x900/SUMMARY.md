# Playwright evidence: #3545814 (3545814-proposal-c)

Run 2026-11-27T19:16:21.605Z. Before `87de709866 2026-07-25`, After `87de709866 2026-07-25` plus `3545814-numeric-filter-value-field-missing-name.patch`. chromium 159.0.8154.6, light, forced colours, 1280x900, darwin arm64. axe-core WCAG 2.0 to 2.2 A/AA.

Rule: **fix** rows change as the MR intends; **regression** rows match on both sides; **observe** rows are recorded, not judged.

| Type | Check | Before | After | Verdict |
|---|---|---|---|---|
| precondition | The exposed filter form is on /repro-3545814 | yes | yes | recorded |
| fix | Numeric ID value field: accessible name | (none) | Value | as expected |
| fix | Content type select: accessible name | (none) | Content types | as expected |
| fix | Taxonomy Tags select: accessible name | (none) | Select terms from vocabulary Tags | as expected |
| fix | View configuration preview: numeric value field has a name | (none) | Value | as expected |
| fix | View configuration preview: content type select has a name | (none) | Content types | as expected |
| regression | Operator selects: accessible name | Operator / Operator / Operator | Operator / Operator / Operator | as expected |
| regression | Fieldset legends (filter labels) | ID (exposed operator) / Content type / Tags | ID (exposed operator) / Content type / Tags | as expected |
| observe | Numeric ID value label is visible (visual change) | no label | no | recorded |
| observe | Content type select label is visually hidden | no label | yes | recorded |
| regression | Fixed-operator numeric filter: label text and visibility | ID (fixed operator) yes | ID (fixed operator) yes | as expected |
| regression | Filter results: ID greater than 2 | Gamma, Delta | Gamma, Delta | as expected |
| regression | Filter results: ID between 2 and 3 | Beta, Gamma | Beta, Gamma | as expected |
| regression | Filter results: ID is empty |  |  | as expected |
| regression | Filter results: content type Article | Alpha, Beta, Gamma, Delta | Alpha, Beta, Gamma, Delta | as expected |
| regression | Filter results: Tags News | Alpha, Beta | Alpha, Beta | as expected |
| regression | Filter results: fixed ID 3 | Gamma | Gamma | as expected |
| fix | axe naming violations (label, select-name), View page | 3 | 0 | as expected |
| observe | axe rule ids on the View page | color-contrast, label, select-name | color-contrast | recorded |
| observe | Tab reaches the numeric value field | yes | yes | recorded |
| regression | JavaScript errors | 0 | 0 | as expected |

## Controls on the View page

| Control | Before: labels / accessible name | After: labels / accessible name |
|---|---|---|
| numeric | none / (no name) | "Value" (visually hidden) / "Value" |
| numeric_operator | "Operator" (visually hidden) / "Operator" | "Operator" (visually hidden) / "Operator" |
| bundle | none / (no name) | "Content types" (visually hidden) / "Content types" |
| bundle_operator | "Operator" (visually hidden) / "Operator" | "Operator" (visually hidden) / "Operator" |
| taxonomy | none / (no name) | "Select terms from vocabulary Tags" (visually hidden) / "Select terms from vocabulary Tags" |
| taxonomy_operator | "Operator" (visually hidden) / "Operator" | "Operator" (visually hidden) / "Operator" |
| fixed | "ID (fixed operator)" / "ID (fixed operator)" | "ID (fixed operator)" / "ID (fixed operator)" |

Before fieldset grouping: numeric `ID (exposed operator)`, bundle `Content type`, taxonomy `Tags`. After: numeric `ID (exposed operator)`, bundle `Content type`, taxonomy `Tags`.

## Submissions (real input, results read after the page reloaded)

| Submission | Before rows | After rows |
|---|---|---|
| greaterThan | Gamma, Delta | Gamma, Delta |
| between | Beta, Gamma | Beta, Gamma |
| empty | (none) | (none) |
| bundleArticle | Alpha, Beta, Gamma, Delta | Alpha, Beta, Gamma, Delta |
| tagsNews | Alpha, Beta | Alpha, Beta |
| fixedId | Gamma | Gamma |

Example query strings. Before: ID greater than 2 `?id_open_op=%3E&id_open%5Bvalue%5D=2&id_open%5Bmin%5D=&id_open%5Bmax%5D=&type_op=in&type=All&tags_op=or&tags=All&id_fixed=`; After `?id_open_op=%3E&id_open%5Bvalue%5D=2&id_open%5Bmin%5D=&id_open%5Bmax%5D=&type_op=in&type=All&tags_op=or&tags=All&id_fixed=`.

## axe

View page: Before {"color-contrast":1,"label":1,"select-name":2}, After {"color-contrast":1}. Preview: Before {"color-contrast":1,"label":1,"select-name":2}, After {"color-contrast":1}.

Keyboard: first Tab stops recorded; reached the numeric value field: Before yes, After yes. Stops Before: a# → a# → button# → a# → a# → a# → button# → a# → a# → button# → a# → button# → a# → a# → button# → button# → button# "Sticky header" → button# → a# → button# → a# → button# → a# → a# → button# → a# → button# → button# → select#id_open_op "Operator" → input#id_open[value]. After: a# → a# → button# → a# → a# → a# → button# → a# → a# → button# → a# → button# → a# → a# → button# → button# → button# "Sticky header" → button# → a# → button# → a# → button# → a# → a# → button# → a# → button# → button# → select#id_open_op "Operator" → input#id_open[value] "Value".

Screenshots: `before-page.png`, `after-page.png`, `before-filters.png`, `after-filters.png`, `before-numeric.png`, `after-numeric.png`.

## Context

| | Before | After |
|---|---|---|
| Core commit | `87de709866 2026-07-25` | `87de709866 2026-07-25` |
| Drupal, PHP | 12.0-dev, 8.5.7 | 12.0-dev, 8.5.7 |
| Profile; default / admin theme (config) | standard; olivero / claro | standard; olivero / claro |
| Theme that rendered each page | /user/1/edit → claro<br>/repro-3545814 → null<br>/admin/structure/views/view/repro_3545814/edit → claro | /user/1/edit → claro<br>/repro-3545814 → null<br>/admin/structure/views/view/repro_3545814/edit → claro |
| Languages (default) | none (en) | none (en) |
| Modules only on this side | none | none |
| Enabled modules | 39 | 39 |

## AJAX responses

Every Drupal AJAX response, in order; raw commands in `ajax-before.json` and `ajax-after.json`.

**Before** (2 responses)

- `/admin/structure/views/view/repro_3545814/preview/page_1?_wrapper_format` 200: settings, add_css, insert
- `/admin/structure/views/view/repro_3545814/preview/page_1?_wrapper_format` 200: settings, insert

**After** (2 responses)

- `/admin/structure/views/view/repro_3545814/preview/page_1?_wrapper_format` 200: settings, add_css, insert
- `/admin/structure/views/view/repro_3545814/preview/page_1?_wrapper_format` 200: settings, insert

## What could be announced

`Drupal.announce()` calls, and text changes inside live regions (role alert/status/log or aria-live). A recorded change is not proof that a screen reader spoke it; see the screen-reader run for that.

| Side | Source | Politeness | Text |
|---|---|---|---|
| before | none | | |
| after | none | | |

## Changes after input, and how a screen reader learns of them

After each click, key press or typing, the text that appeared or changed on the page. **Silent**: not in a live region, no `Drupal.announce()` after the same action, focus did not move to it, and the control pressed did not disclose it. A silent change is a candidate for WCAG 2.2 SC 4.1.3 Status Messages, for a person to judge: not every change is a status message. See docs/SILENT-CHANGES.md.

No silent change on either side.

Before: 0 in a live region, 0 Drupal.announce() after the same action, 0 focus moved to it, 0 shown by the control pressed (expanded), 0 inside the control itself, 0 the name of a control that appeared or changed, 0 silent.
After: 0 in a live region, 0 Drupal.announce() after the same action, 0 focus moved to it, 0 shown by the control pressed (expanded), 0 inside the control itself, 0 the name of a control that appeared or changed, 0 silent.


---
Automated evidence is a DRAFT: DOM, axe and scripted input do not replace a keyboard and screen-reader pass by a person.
