# Playwright evidence: #3618230 (3618230-pilot)

Run 2026-10-15T15:10:38.426Z. Core Before `3b94128e 2026-10-14`, After `3b94128e 2026-10-14` plus `3618230-adopt-the-ajax.patch`. chromium 156.0.8078.4, light, 1280x900, darwin arm64. Real file input (Playwright setInputFiles), axe-core WCAG 2.0 to 2.2 A/AA. Recorders: tools/playwright/lib/lab-run.mjs.

Rule: **fix** rows differ as the MR intends; **same** and **regression** rows match on both sides; **observe** and **context** rows are recorded, not judged.

| Type | Check | Before | After | Verdict |
|---|---|---|---|---|
| context | Theme of the node form (drupalSettings) | default_admin | default_admin | recorded |
| fix | AJAX commands for the failed upload | settings, update_build_id, insert | settings, update_build_id, insert, message(error) | as expected |
| fix | Error text inside the replaced markup (insert command) | yes | no | as expected |
| fix | Error rendered inside .file-upload-messages | no | yes | as expected |
| same | Error shown, inside the Attachment widget | 1, yes | 1, yes | as expected |
| observe | SVG markup in the error (Olivero symptom) | no | no | recorded |
| observe | Error carries role | alert | alert | recorded |
| observe | Visually hidden heading in the error | yes | yes | recorded |
| observe | "Hide" <button> in the server-sent insert markup | no | no | recorded |
| observe | "Hide" dismiss button in the error (page) | no | yes | recorded |
| observe | Drupal.announce() calls with the error text | none | assertive | recorded |
| observe | Live regions whose text changed to the error | alert | alert | recorded |
| regression | File input aria-invalid after the failed upload | true | true | as expected |
| regression | File input aria-describedby: elements, and the text they hold | 1: One file only.1 KB limit.Allowed types: txt. | 1: One file only.1 KB limit.Allowed types: txt. | as expected |
| observe | Channels that carried the error text (live region, Drupal.announce()); synthetic, not what a screen reader says | 1 | 2 | recorded |
| observe | Hide button reached with Tab (real keys; Tab presses) | no (60 presses) | yes (21) | recorded |
| observe | Enter on the Hide button hides the error (not visible after) | no button | yes | recorded |
| observe | The dismissed error is still in the accessibility tree | no button | yes | recorded |
| observe | Focus after Enter on the Hide button | no button | button.button | recorded |
| regression | Errors after a second oversized upload (no pile-up) | 1 | 1 | as expected |
| regression | Errors after a valid upload | 0 | 0 | as expected |
| regression | Valid file accepted (file input gone) | yes | yes | as expected |
| regression | Focus after the failed upload | body | body | recorded |
| regression | axe violations (elements), page with the error | 0 | 0 | as expected |
| regression | JavaScript errors | 0 | 0 | as expected |

## Error markup after the failed upload

Before:

```html
<div role="alert" aria-labelledby="message-error-title--YvskhFsxEN0" class="messages-list__item messages messages--error"> <div class="messages__header"> <h2 id="message-error-title--YvskhFsxEN0" class="messages__title"> Error message </h2> </div> <div class="messages__content"> The specified file <em class="placeholder">too-big.txt</em> could not be uploaded.<div class="item-list"><ul><li>The file is <em class="placeholder">2 KB</em> exceeding the maximum file size of <em class="placeholder">1 KB</em>.</li></ul></div> </div> <span class="icon-close"></span> Hide </div>
```

After:

```html
<div class="messages-list__item messages messages--error" role="alert" data-drupal-message-id="error-144249649947190" data-drupal-message-type="error" aria-label="Error message"> <div class="messages__header"> <h2 id="error-144249649947190-title" class="messages__title"> Error message </h2> </div> <div class="messages__content"> The specified file <em class="placeholder">too-big.txt</em> could not be uploaded.<div class="item-list"><ul><li>The file is <em class="placeholder">2 KB</em> exceeding the maximum file size of <em class="placeholder">1 KB</em>.</li></ul></div> </div> <button type="button" class="button button--dismiss js-message-button-hide" title="Hide" data-once="messages-dismiss"> <span class="icon-close"></span> Hide </button> </div>
```

Icon (computed ::before mask or background of .messages__header): Before `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3e  %3cg fill='none' stroke='currentColor' stroke-width='2.25' stroke-linecap='round' stroke-linejoin='round'%3e    %3ccircle cx='12' cy='12' r='10'%3e%3c/circle%3e    %3cline x1='4.93' y1='4.93' x2='19.07' y2='19.07'%3e%3c/line%3e  %3c/g%3e%3c/svg%3e")`, After `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3e  %3cg fill='none' stroke='currentColor' stroke-width='2.25' stroke-linecap='round' stroke-linejoin='round'%3e    %3ccircle cx='12' cy='12' r='10'%3e%3c/circle%3e    %3cline x1='4.93' y1='4.93' x2='19.07' y2='19.07'%3e%3c/line%3e  %3c/g%3e%3c/svg%3e")`.

## Accessibility snapshot of the Attachment field after the failed upload

Before:

```yaml
- alert "Error message":
  - heading "Error message" [level=2]
  - text: The specified file
  - emphasis: too-big.txt
  - text: could not be uploaded.
  - list:
    - listitem:
      - text: The file is
      - emphasis: 2 KB
      - text: exceeding the maximum file size of
      - emphasis: 1 KB
      - text: .
  - text: Hide
- group:
  - button "Attachment" [expanded]
  - text: Add a new file
  - button "Add a new file"
  - text: "One file only. 1 KB limit. Allowed types: txt."
```

After:

```yaml
- alert "Error message":
  - heading "Error message" [level=2]
  - text: The specified file
  - emphasis: too-big.txt
  - text: could not be uploaded.
  - list:
    - listitem:
      - text: The file is
      - emphasis: 2 KB
      - text: exceeding the maximum file size of
      - emphasis: 1 KB
      - text: .
  - button "Hide"
- group:
  - button "Attachment" [expanded]
  - text: Add a new file
  - button "Add a new file"
  - text: "One file only. 1 KB limit. Allowed types: txt."
```

## Context

| | Before | After |
|---|---|---|
| Core commit | `3b94128e 2026-10-14` | `3b94128e 2026-10-14` |
| Drupal, PHP | 12.0-dev, 8.5.7 | 12.0-dev, 8.5.7 |
| Profile; default / admin theme (config) | standard; default_admin / default_admin | standard; default_admin / default_admin |
| Theme that rendered each page | /user/1/edit → default_admin<br>/node/add/article → default_admin | /user/1/edit → default_admin<br>/node/add/article → default_admin |
| Languages (default) | none (en) | none (en) |
| Modules only on this side | none | none |
| Enabled modules | 39 | 39 |

## AJAX responses

Every Drupal AJAX response, in order; raw commands in `ajax-before.json` and `ajax-after.json`.

**Before** (3 responses)

- `/node/add/article?element_parents&ajax_form&_wrapper_format` 200: settings, update_build_id, insert:replaceWith [markup has alert]
- `/node/add/article?element_parents&ajax_form&_wrapper_format` 200: settings, update_build_id, insert:replaceWith [markup has alert]
- `/node/add/article?element_parents&ajax_form&_wrapper_format` 200: settings, update_build_id, insert:replaceWith

**After** (3 responses)

- `/node/add/article?element_parents&ajax_form&_wrapper_format` 200: settings, update_build_id, insert:replaceWith, message(error → #file-upload-messages-field-attachment-widget-0--VWoskXqe4qw)
- `/node/add/article?element_parents&ajax_form&_wrapper_format` 200: settings, update_build_id, insert:replaceWith, message(error → #file-upload-messages-field-attachment-widget-0--rMpIYkhFEis)
- `/node/add/article?element_parents&ajax_form&_wrapper_format` 200: settings, update_build_id, insert:replaceWith

## What could be announced

`Drupal.announce()` calls, and text changes inside live regions (role alert/status/log or aria-live). A recorded change is not proof that a screen reader spoke it; see the screen-reader run for that.

| Side | Source | Politeness | Text |
|---|---|---|---|
| before | live region role=alert | assertive (role) | Error message The specified file too-big.txt could not be uploaded.The file is 2 KB exceeding the maximum file size of 1 KB. Hide |
| before | live region role=alert | assertive (role) | Error message The specified file too-big.txt could not be uploaded.The file is 2 KB exceeding the maximum file size of 1 KB. Hide |
| after | Drupal.announce | assertive | The specified file too-big.txt could not be uploaded. The file is 2 KB exceeding the maximum file size of 1 KB . |
| after | Drupal.announce | assertive | The specified file too-big.txt could not be uploaded. The file is 2 KB exceeding the maximum file size of 1 KB . |
| after | live region role=alert | assertive (role) | Error message The specified file too-big.txt could not be uploaded.The file is 2 KB exceeding the maximum file size of 1 KB. Hide |
| after | live region role=alert | assertive (role) | Error message The specified file too-big.txt could not be uploaded.The file is 2 KB exceeding the maximum file size of 1 KB. Hide |

axe rules: Before {}, After {}. JavaScript errors: Before [], After [].

Screenshots: `before-1-error.png`, `after-1-error.png`, `before-2-valid.png`, `after-2-valid.png`.

**Behaves as the MR intends** on the judged rows. Read the observe rows for the theme question.

---
Automated evidence is a DRAFT: DOM, AJAX and axe checks do not replace a keyboard and screen-reader pass by a person.
