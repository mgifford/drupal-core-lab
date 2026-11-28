# #3466040 translation modal probe — 1920x720, chromium 159.0.8154.6

Run 2026-11-27T19:23:23.964Z. Variant `3466040-pinned`. Before `97c6ff8b25 2026-11-23`, After `97c6ff8b25 2026-11-23`. Scheme **light**, forced colours **none**, reduced motion **no-preference**.

Path: `/admin/structure/views/view/content/translate` -> French **Add** (AJAX modal) -> expand visible collapsed details. Real Playwright clicks and Tab presses. Fix rows: Before expected false, After true. Regression rows: expected equal. Observe rows: recorded.

French row: French Add / French Add.

| Type | Check | Before | After |
|---|---|---|---|
| precondition | Modal opened | true | true |
| fix | Dialog fits the viewport after the details expansions | false | true |
| observe | Overflow below the viewport after the expansions (px) | 5.8 | 0 |
| fix | Primary action (Save translation) in the viewport after the expansions | null | null |
| fix | Primary action hittable after the expansions | null | null |
| regression | Titlebar in the viewport after the expansions | true | true |
| regression | Close button in the viewport after the expansions | true | true |
| regression | Content area scrolls after the expansions | true | true |
| observe | Primary action inside the viewport when focused | null | null |
| observe | Primary action reached with real Tab presses | false | false |
| regression | axe violating elements in the expanded modal | 0 | 0 |
| observe | Patch observers created (instrumentation) | 0 | 1 |
| observe | dialogContentResize events (instrumentation) | 1 | 2 |
| regression | Page errors (instrumentation) | 0 | 0 |

## Dialog geometry per expansion

| Side | Stage | Details opened | Dialog top→bottom (h) | Fits | Overflow px | Content client/scroll | Save rect in view | Active element |
|---|---|---|---|---|---|---|---|---|
| before | T1-dialog-open | — | 41.8→678.2 (636.4) | true | 0 | 488/488 | — | input#edit-translation-config-names-viewsviewcontent-label--20z0ydzaJ6w.form-text.form-element.form-element--type-text "Label (French)" |
| before | T2-expand-1 | Default Display settings | 41.8→725.8 (684) | false | 5.8 | 536/713 | — | summary.details__summary "Default Display settings" |
| before | T3-after-tab | — | 41.8→725.8 (684) | false | 5.8 | 536/713 | — | button.ui-button.ui-corner-all.ui-widget "Close" |
| after | T1-dialog-open | — | 41.8→678.2 (636.4) | true | 0 | 488/488 | — | input#edit-translation-config-names-viewsviewcontent-label--J6bKKiLaa80.form-text.form-element.form-element--type-text "Label (French)" |
| after | T2-expand-1 | Default Display settings | 18→702 (684) | true | 0 | 536/713 | — | summary.details__summary "Default Display settings" |
| after | T3-after-tab | — | 18→702 (684) | true | 0 | 536/713 | — | button.button.button--primary.js-form-submit "Save translation" |

## Keyboard trail (real Tab presses)

- before: primary action NOT reached in 60 Tab presses; in viewport when focused: null; content scrolled: true; page scrolled: false.
- after: primary action NOT reached in 60 Tab presses; in viewport when focused: null; content scrolled: true; page scrolled: false.

## Limits

- Automated geometry and Tab walks are DRAFT evidence, not a person's keyboard pass. No screen reader ran.
- WebKit is Safari's engine, not Safari. Forced colours and colour scheme are Playwright emulation.
- Zoom is reflow-equivalent CSS viewport emulation, not a real browser zoom.
