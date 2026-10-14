# Playwright evidence: #3618230 (3618230-latest)

Run 2026-10-14T09:27:29.659Z. Core Before `3b94128e929 2026-10-14`, After `3b94128e929 2026-10-14` plus `3618230-adopt-the-ajax.patch`. chromium 153.0.8010.12, light, 1280x900, darwin arm64. Real file input (Playwright setInputFiles), axe-core WCAG 2.0 to 2.2 A/AA. Drupal.announce() calls recorded by a wrapper that passes them through unchanged (hooked: Before yes, After yes).

Rule: **fix** rows differ as the MR intends; **same** and **regression** rows match on both sides; **observe** and **context** rows are recorded, not judged.

| Type | Check | Before | After | Verdict |
|---|---|---|---|---|
| context | Theme of the node form (drupalSettings) | default_admin | default_admin | recorded |
| context | Theme of the front page | default_admin | default_admin | recorded |
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
| regression | Errors after a second oversized upload (no pile-up) | 1 | 1 | as expected |
| regression | Errors after a valid upload | 0 | 0 | as expected |
| regression | Valid file accepted (file input gone) | yes | yes | as expected |
| regression | Focus after the failed upload | body | body | recorded |
| regression | axe violations (elements), page with the error | 0 | 0 | as expected |
| regression | JavaScript errors | 0 | 0 | as expected |

## Error markup after the failed upload

Before:

```html
<div role="alert" aria-labelledby="message-error-title--YwmUohKlEoI" class="messages-list__item messages messages--error"> <div class="messages__header"> <h2 id="message-error-title--YwmUohKlEoI" class="messages__title"> Error message </h2> </div> <div class="messages__content"> The specified file <em class="placeholder">too-big.txt</em> could not be uploaded.<div class="item-list"><ul><li>The file is <em class="placeholder">2 KB</em> exceeding the maximum file size of <em class="placeholder">1 KB</em>.</li></ul></div> </div> <span class="icon-close"></span> Hide </div>
```

After:

```html
<div class="messages-list__item messages messages--error" role="alert" data-drupal-message-id="error-655758433235792" data-drupal-message-type="error" aria-label="Error message"> <div class="messages__header"> <h2 id="error-655758433235792-title" class="messages__title"> Error message </h2> </div> <div class="messages__content"> The specified file <em class="placeholder">too-big.txt</em> could not be uploaded.<div class="item-list"><ul><li>The file is <em class="placeholder">2 KB</em> exceeding the maximum file size of <em class="placeholder">1 KB</em>.</li></ul></div> </div> <button type="button" class="button button--dismiss js-message-button-hide" title="Hide" data-once="messages-dismiss"> <span class="icon-close"></span> Hide </button> </div>
```

Icon (computed ::before mask or background of .messages__header): Before `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3e  %3cg fill='none' stroke='currentColor' stroke-width='2.25' stroke-linecap='round' stroke-linejoin='round'%3e    %3ccircle cx='12' cy='12' r='10'%3e%3c/circle%3e    %3cline x1='4.93' y1='4.93' x2='19.07' y2='19.07'%3e%3c/line%3e  %3c/g%3e%3c/svg%3e")`, After `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3e  %3cg fill='none' stroke='currentColor' stroke-width='2.25' stroke-linecap='round' stroke-linejoin='round'%3e    %3ccircle cx='12' cy='12' r='10'%3e%3c/circle%3e    %3cline x1='4.93' y1='4.93' x2='19.07' y2='19.07'%3e%3c/line%3e  %3c/g%3e%3c/svg%3e")`.

## Drupal.announce() calls during the failed upload

Before: []

After: [{"text":"The specified file <em class=\"placeholder\">too-big.txt</em> could not be uploaded.<div class=\"item-list\"><ul><li>The file is <em class=\"placeholder\">2 KB</em> exceeding the maximum file size of <em class=\"placeholder\">1 KB</em>.</li></ul></div>","priority":"assertive"}]

Live region text afterwards: Before {"text":"","ariaLive":"polite"}, After {"text":"The specified file too-big.txt could not be uploaded.The file is 2 KB exceeding the maximum file size of 1 KB.","ariaLive":"assertive"}.

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

## AJAX commands

Before: `[{"command":"settings","selector":null,"messageWrapperQuerySelector":null,"clearPrevious":null,"type":null,"message":null,"dataHasError":false,"dataHasSvg":false},{"command":"update_build_id","selector":null,"messageWrapperQuerySelector":null,"clearPrevious":null,"type":null,"message":null,"dataHasError":false,"dataHasSvg":false},{"command":"insert","method":"replaceWith","selector":null,"messageWrapperQuerySelector":null,"clearPrevious":null,"type":null,"message":null,"dataHasError":true,"dataHasSvg":false}]`

After: `[{"command":"settings","selector":null,"messageWrapperQuerySelector":null,"clearPrevious":null,"type":null,"message":null,"dataHasError":false,"dataHasSvg":false},{"command":"update_build_id","selector":null,"messageWrapperQuerySelector":null,"clearPrevious":null,"type":null,"message":null,"dataHasError":false,"dataHasSvg":false},{"command":"insert","method":"replaceWith","selector":null,"messageWrapperQuerySelector":null,"clearPrevious":null,"type":null,"message":null,"dataHasError":false,"dataHasSvg":false},{"command":"message","selector":null,"messageWrapperQuerySelector":"#file-upload-messages-field-attachment-widget-0--XdUVh5O0Rmw","clearPrevious":false,"type":"error","message":"The specified file <em class=\"placeholder\">too-big.txt</em> could not be uploaded.<div class=\"item-list\"><ul><li>The file is <em class=\"placeholder\">2 KB</em> exceeding the maximum file size of <em class=\"placeholder\">1 KB</em>.</li></ul></div>","dataHasError":false,"dataHasSvg":false}]`

axe rules: Before {}, After {}. JavaScript errors: Before [], After [].

Screenshots: `before-1-error.png`, `after-1-error.png`, `before-2-valid.png`, `after-2-valid.png`.

**Behaves as the MR intends** on the judged rows. Read the observe rows for the theme question.

---
Automated evidence is a DRAFT: DOM, AJAX and axe checks do not replace a keyboard and screen-reader pass by a person.
