# #3466040 translation modal probe — 480x270, chromium 159.0.8154.6

Run 2026-11-28T01:20:03.689Z. Variant `3466040-pinned`. Before `97c6ff8b25 2026-11-23`, After `97c6ff8b25 2026-11-23`. Scheme **light**, forced colours **none**, reduced motion **no-preference**.
Zoom method: reflow-equivalent CSS viewport (physical viewport / zoom factor); NOT real browser zoom; physical 1920x1080 -> CSS 480x270.

Path: `/admin/structure/views/view/content/translate` -> French **Add** (AJAX modal) -> expand visible collapsed details. Real Playwright clicks and Tab presses. The **fix** row is the dialog geometry; the Save-translation rows are observations. `Save translation` is reached and in the viewport on both sides in this run; the shared helper's `reachedPrimary` flag is a false negative because its label regex does not include "Save translation", so the trail is used.

French row: French Add / French Add.

| Type | Check | Before | After |
|---|---|---|---|
| precondition | Modal opened | true | true |
| fix | Dialog fits the viewport after the details expansions | true | true |
| observe | Overflow below the viewport after the expansions (px) | 0 | 0 |
| observe | Primary action (Save translation) in the viewport after the expansions | true | true |
| observe | Primary action hittable after the expansions | true | true |
| regression | Titlebar in the viewport after the expansions | false | false |
| regression | Close button in the viewport after the expansions | false | false |
| regression | Content area scrolls after the expansions | true | true |
| observe | Primary action inside the viewport when focused | true | true |
| observe | Primary action reached with real Tab presses | true | true |
| regression | axe violating elements in the expanded modal | 0 | 0 |
| observe | Patch observers created (instrumentation) | 0 | 1 |
| observe | dialogContentResize events (instrumentation) | 1 | 2 |
| regression | Page errors (instrumentation) | 0 | 0 |

## Dialog geometry per expansion

| Side | Stage | Details opened | Dialog top→bottom (h) | Fits | Overflow px | Content client/scroll | Save rect in view | Active element |
|---|---|---|---|---|---|---|---|---|
| before | T1-dialog-open | — | 7→263 (256) | true | 0 | 108/602 | true | input#edit-translation-config-names-viewsviewcontent-label--RaqAgEfYe6I.form-text.form-element.form-element--type-text "Label (French)" |
| before | T3-after-tab | — | 7→263 (256) | true | 0 | 108/602 | true | button.button.button--primary.js-form-submit "Save translation" |
| after | T1-dialog-open | — | 7→263 (256) | true | 0 | 108/602 | true | input#edit-translation-config-names-viewsviewcontent-label--spnYeOeRrnk.form-text.form-element.form-element--type-text "Label (French)" |
| after | T3-after-tab | — | 7→263 (256) | true | 0 | 108/602 | true | summary.details__summary "Displays" |

## Keyboard trail (real Tab presses)

- before: primary action NOT reached in 60 Tab presses; in viewport when focused: null; content scrolled: true; page scrolled: false.
- after: primary action NOT reached in 60 Tab presses; in viewport when focused: null; content scrolled: true; page scrolled: false.

## Limits

- Automated geometry and Tab walks are DRAFT evidence, not a person's keyboard pass. No screen reader ran.
- WebKit is Safari's engine, not Safari. Forced colours and colour scheme are Playwright emulation.
- Zoom is reflow-equivalent CSS viewport emulation, not a real browser zoom.
