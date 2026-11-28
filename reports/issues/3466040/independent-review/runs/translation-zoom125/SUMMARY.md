# #3466040 translation modal probe — 1536x864, chromium 159.0.8154.6

Run 2026-11-28T01:35:35.296Z. Variant `3466040-pinned`. Before `97c6ff8b25 2026-11-23`, After `97c6ff8b25 2026-11-23`. Scheme **light**, forced colours **none**, reduced motion **no-preference**.
Zoom method: reflow-equivalent CSS viewport (physical viewport / zoom factor); NOT real browser zoom; physical 1920x1080 -> CSS 1536x864.

Path: `/admin/structure/views/view/content/translate` -> French **Add** (AJAX modal) -> expand visible collapsed details. Real Playwright clicks and Tab presses. The **fix** row is the dialog geometry; the Save-translation rows are observations. `Save translation` is reached and in the viewport on both sides in this run; the shared helper's `reachedPrimary` flag is a false negative because its label regex does not include "Save translation", so the trail is used.

French row: French Add / French Add.

| Type | Check | Before | After |
|---|---|---|---|
| precondition | Modal opened | true | true |
| fix | Dialog fits the viewport after the details expansions | false | true |
| observe | Overflow below the viewport after the expansions (px) | 69.8 | 0 |
| observe | Primary action (Save translation) in the viewport after the expansions | false | true |
| observe | Primary action hittable after the expansions | false | true |
| regression | Titlebar in the viewport after the expansions | true | true |
| regression | Close button in the viewport after the expansions | true | true |
| regression | Content area scrolls after the expansions | true | true |
| observe | Primary action inside the viewport when focused | false | true |
| observe | Primary action reached with real Tab presses | true | true |
| regression | axe violating elements in the expanded modal | 0 | 0 |
| observe | Patch observers created (instrumentation) | 0 | 1 |
| observe | dialogContentResize events (instrumentation) | 1 | 2 |
| regression | Page errors (instrumentation) | 0 | 0 |

## Dialog geometry per expansion

| Side | Stage | Details opened | Dialog top→bottom (h) | Fits | Overflow px | Content client/scroll | Save rect in view | Active element |
|---|---|---|---|---|---|---|---|---|
| before | T1-dialog-open | — | 113.8→750.2 (636.4) | true | 0 | 488/488 | true | input#edit-translation-config-names-viewsviewcontent-label--nNJ-tcbT5VY.form-text.form-element.form-element--type-text "Label (French)" |
| before | T2-expand-1 | Default Display settings | 113.8→933.8 (820) | false | 69.8 | 672/713 | false | summary.details__summary "Default Display settings" |
| before | T3-after-tab | — | 113.8→933.8 (820) | false | 69.8 | 672/713 | false | button.ui-button.ui-corner-all.ui-widget "Close" |
| after | T1-dialog-open | — | 113.8→750.2 (636.4) | true | 0 | 488/488 | true | input#edit-translation-config-names-viewsviewcontent-label--HZ8ONbj9qrg.form-text.form-element.form-element--type-text "Label (French)" |
| after | T2-expand-1 | Default Display settings | 22→842 (820) | true | 0 | 672/713 | true | summary.details__summary "Default Display settings" |
| after | T3-after-tab | — | 22→842 (820) | true | 0 | 672/713 | true | button.button.button--primary.js-form-submit "Save translation" |

## Keyboard trail (real Tab presses)

- before: primary action NOT reached in 60 Tab presses; in viewport when focused: null; content scrolled: true; page scrolled: false.
- after: primary action NOT reached in 60 Tab presses; in viewport when focused: null; content scrolled: true; page scrolled: false.

## Limits

- Automated geometry and Tab walks are DRAFT evidence, not a person's keyboard pass. No screen reader ran.
- WebKit is Safari's engine, not Safari. Forced colours and colour scheme are Playwright emulation.
- Zoom is reflow-equivalent CSS viewport emulation, not a real browser zoom.
