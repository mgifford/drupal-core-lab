# #3466040 translation modal probe — 480x900, chromium 159.0.8154.6

Run 2026-11-28T01:31:08.110Z. Variant `3466040-pinned`. Before `97c6ff8b25 2026-11-23`, After `97c6ff8b25 2026-11-23`. Scheme **light**, forced colours **none**, reduced motion **no-preference**.

Path: `/admin/structure/views/view/content/translate` -> French **Add** (AJAX modal) -> expand visible collapsed details. Real Playwright clicks and Tab presses. The **fix** row is the dialog geometry; the Save-translation rows are observations. `Save translation` is reached and in the viewport on both sides in this run; the shared helper's `reachedPrimary` flag is a false negative because its label regex does not include "Save translation", so the trail is used.

French row: French Add / French Add.

| Type | Check | Before | After |
|---|---|---|---|
| precondition | Modal opened | true | true |
| fix | Dialog fits the viewport after the details expansions | false | true |
| observe | Overflow below the viewport after the expansions (px) | 29.8 | 0 |
| observe | Primary action (Save translation) in the viewport after the expansions | false | true |
| observe | Primary action hittable after the expansions | true | true |
| regression | Titlebar in the viewport after the expansions | false | false |
| regression | Close button in the viewport after the expansions | false | false |
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
| before | T1-dialog-open | — | 74.8→825.2 (750.4) | true | 0 | 602/602 | true | input#edit-translation-config-names-viewsviewcontent-label--rR8Yyv3nS4Y.form-text.form-element.form-element--type-text "Label (French)" |
| before | T2-expand-1 | Default Display settings | 74.8→929.8 (855) | false | 29.8 | 707/864 | false | summary.details__summary "Default Display settings" |
| before | T3-after-tab | — | 74.8→929.8 (855) | false | 29.8 | 707/864 | false | textarea#edit-translation-config-names-viewsviewcontent-description--hOpg40XrLAI.form-textarea.resize-vertical.form-element "Administrative description (French)" |
| after | T1-dialog-open | — | 74.8→825.2 (750.4) | true | 0 | 602/602 | true | input#edit-translation-config-names-viewsviewcontent-label--TIzt3uQm0AA.form-text.form-element.form-element--type-text "Label (French)" |
| after | T2-expand-1 | Default Display settings | 22.5→877.5 (855) | true | 0 | 707/864 | true | summary.details__summary "Default Display settings" |
| after | T3-after-tab | — | 22.5→877.5 (855) | true | 0 | 707/864 | true | summary.details__summary "Page Display settings" |

## Keyboard trail (real Tab presses)

- before: primary action NOT reached in 60 Tab presses; in viewport when focused: null; content scrolled: true; page scrolled: false.
- after: primary action NOT reached in 60 Tab presses; in viewport when focused: null; content scrolled: true; page scrolled: false.

## Limits

- Automated geometry and Tab walks are DRAFT evidence, not a person's keyboard pass. No screen reader ran.
- WebKit is Safari's engine, not Safari. Forced colours and colour scheme are Playwright emulation.
- Zoom is reflow-equivalent CSS viewport emulation, not a real browser zoom.
