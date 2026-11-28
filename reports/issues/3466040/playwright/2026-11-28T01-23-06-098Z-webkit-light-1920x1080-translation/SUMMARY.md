# #3466040 translation modal probe — 1920x1080, webkit 27.2

Run 2026-11-28T01:23:52.140Z. Variant `3466040-pinned`. Before `97c6ff8b25 2026-11-23`, After `97c6ff8b25 2026-11-23`. Scheme **light**, forced colours **none**, reduced motion **no-preference**.

Path: `/admin/structure/views/view/content/translate` -> French **Add** (AJAX modal) -> expand visible collapsed details. Real Playwright clicks and Tab presses. The **fix** row is the dialog geometry; the Save-translation rows are observations. `Save translation` is reached and in the viewport on both sides in this run; the shared helper's `reachedPrimary` flag is a false negative because its label regex does not include "Save translation", so the trail is used.

French row: French Add / French Add.

| Type | Check | Before | After |
|---|---|---|---|
| precondition | Modal opened | true | true |
| fix | Dialog fits the viewport after the details expansions | false | true |
| observe | Overflow below the viewport after the expansions (px) | 2.8 | 0 |
| observe | Primary action (Save translation) in the viewport after the expansions | null | null |
| observe | Primary action hittable after the expansions | true | true |
| regression | Titlebar in the viewport after the expansions | true | true |
| regression | Close button in the viewport after the expansions | true | true |
| regression | Content area scrolls after the expansions | false | true |
| observe | Primary action inside the viewport when focused | null | null |
| observe | Primary action reached with real Tab presses | false | false |
| regression | axe violating elements in the expanded modal | 0 | 0 |
| observe | Patch observers created (instrumentation) | 0 | 1 |
| observe | dialogContentResize events (instrumentation) | 1 | 3 |
| regression | Page errors (instrumentation) | 0 | 0 |

## Dialog geometry per expansion

| Side | Stage | Details opened | Dialog top→bottom (h) | Fits | Overflow px | Content client/scroll | Save rect in view | Active element |
|---|---|---|---|---|---|---|---|---|
| before | T1-dialog-open | — | 221.7→858.3 (636.6) | true | 0 | 488/488 | true | input#edit-translation-config-names-viewsviewcontent-label--45eDfOrOB8A.form-text.form-element.form-element--type-text "Label (French)" |
| before | T2-expand-1 | Default Display settings | 221.7→1082.8 (861.1) | false | 2.8 | 713/713 | true | summary.details__summary "Default Display settings" |
| before | T3-after-tab | — | 221.7→1082.8 (861.1) | false | 2.8 | 713/713 | true | body |
| after | T1-dialog-open | — | 221.7→858.3 (636.6) | true | 0 | 488/488 | true | input#edit-translation-config-names-viewsviewcontent-label--6iRpm2wT8gU.form-text.form-element.form-element--type-text "Label (French)" |
| after | T2-expand-1 | Default Display settings | 109.5→970.5 (861.1) | true | 0 | 713/713 | true | summary.details__summary "Default Display settings" |
| after | T2-expand-2 | Content Default display options | 27→1053 (1026) | true | 0 | 878/1307 | true | summary.details__summary "Content Default display options" |
| after | T3-after-tab | — | 27→1053 (1026) | true | 0 | 878/1307 | true | summary.details__summary "Fields" |

## Keyboard trail (real Tab presses)

- before: primary action NOT reached in 60 Tab presses; in viewport when focused: null; content scrolled: true; page scrolled: false.
- after: primary action NOT reached in 60 Tab presses; in viewport when focused: null; content scrolled: true; page scrolled: false.

## Limits

- Automated geometry and Tab walks are DRAFT evidence, not a person's keyboard pass. No screen reader ran.
- WebKit is Safari's engine, not Safari. Forced colours and colour scheme are Playwright emulation.
- Zoom is reflow-equivalent CSS viewport emulation, not a real browser zoom.
