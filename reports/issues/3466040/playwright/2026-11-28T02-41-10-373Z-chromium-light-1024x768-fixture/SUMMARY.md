# #3466040 fixture probe — 1024x768, chromium 159.0.8154.6

Run 2026-11-28T02:41:17.893Z. Variant `3466040-fix-probe`. Before `97c6ff8b25 2026-11-23`, After `97c6ff8b25 2026-11-23`. Scheme **light**, forced colours **none**, reduced motion **no-preference**.

Fix rows: Before is expected false and After true. Regression rows: expected equal. Observe rows: recorded, not judged.

| Type | Check | Before | After |
|---|---|---|---|
| fix | Dialog fits inside the viewport after the details expands | false | true |
| observe | Overflow below the viewport after the expansion (px) | 212.3 | 0 |
| fix | Primary (OK) button is inside the viewport after the expansion | false | true |
| fix | Primary (OK) button is hit-testable after the expansion | false | true |
| regression | Titlebar is inside the viewport after the expansion | true | true |
| regression | Close button is inside the viewport after the expansion | true | true |
| regression | Content area scrolls after the expansion (scrollHeight > clientHeight) | true | true |
| observe | Primary button reached with real Tab presses | true | true |
| fix | Primary button inside the viewport when focused | false | true |
| fix | Primary button hit-testable when focused | false | true |
| observe | ResizeObserver callbacks during the expansion | 0 | 1 |
| observe | dialogContentResize events during the expansion (resetSize ran) | 0 | 1 |
| observe | Patch observer callbacks during the expansion | 0 | 1 |
| regression | Observer callbacks in the 800 ms idle window after settling | 0 | 0 |
| observe | Dialog becomes visible again on re-open (all three) | true | true |
| observe | Observer disconnected after close (patch observers) | 0 | 1 |
| regression | Callbacks after close (900 ms) | 0 | 0 |
| regression | Page errors after close (900 ms) | 0 | 0 |
| regression | Race: expand then Escape immediately, page errors | 0 | 0 |
| regression | axe violations in the expanded dialog | 0 | 0 |

## Stages

| Side | Stage | Dialog top→bottom | Fits | Overflow px | Content client/scroll | RO Δ | dialogContentResize Δ | patch cb Δ |
|---|---|---|---|---|---|---|---|---|
| before | F0-links-page | no dialog | – | – | – | 9 | 0 | 0 |
| before | F1-dialog-open | 251.3→516.7 (h 265.4) | true | 0 | 114/114 | 0 | 1 | 0 |
| before | F2-expanded | 251.3→980.3 (h 729) | false | 212.3 | 578/2146 | 0 | 0 | 0 |
| before | F3-content-scrolled | 251.3→980.3 (h 729) | false | 212.3 | 578/2146 | 0 | 0 | 0 |
| before | F4-after-tab | 251.3→980.3 (h 729) | false | 212.3 | 578/2146 | 0 | 0 | 0 |
| before | F5-collapsed | 251.3→516.7 (h 265.4) | true | 0 | 114/114 | 0 | 0 | 0 |
| before | F5b-after-cycles | 251.3→516.7 (h 265.4) | true | 0 | 114/114 | 0 | 0 | 0 |
| before | F6-closed | no dialog | – | – | – | 0 | 0 | 0 |
| before | F7-reopen-1 | 251.3→516.7 (h 265.4) | true | 0 | 114/114 | 0 | 1 | 0 |
| before | F7-reopen-2 | 251.3→516.7 (h 265.4) | true | 0 | 114/114 | 81 | 1 | 0 |
| before | F7-reopen-3 | 251.3→516.7 (h 265.4) | true | 0 | 114/114 | 0 | 1 | 0 |
| after | F0-links-page | no dialog | – | – | – | 9 | 0 | 0 |
| after | F1-dialog-open | 251.3→516.7 (h 265.4) | true | 0 | 114/114 | 1 | 1 | 1 |
| after | F2-expanded | 19.5→748.5 (h 729) | true | 0 | 578/2146 | 1 | 1 | 1 |
| after | F3-content-scrolled | 19.5→748.5 (h 729) | true | 0 | 578/2146 | 0 | 0 | 0 |
| after | F4-after-tab | 19.5→748.5 (h 729) | true | 0 | 578/2146 | 0 | 0 | 0 |
| after | F5-collapsed | 251.3→516.7 (h 265.4) | true | 0 | 114/114 | 1 | 1 | 1 |
| after | F5b-after-cycles | 251.3→516.7 (h 265.4) | true | 0 | 114/114 | 10 | 10 | 10 |
| after | F6-closed | no dialog | – | – | – | 0 | 0 | 0 |
| after | F7-reopen-1 | 251.3→516.7 (h 265.4) | true | 0 | 114/114 | 1 | 1 | 1 |
| after | F7-reopen-2 | 251.3→516.7 (h 265.4) | true | 0 | 114/114 | 73 | 1 | 1 |
| after | F7-reopen-3 | 251.3→516.7 (h 265.4) | true | 0 | 114/114 | 1 | 1 | 1 |

## Expansion timeline (50 ms samples)

| t (ms) | Before bottom / overflow / RO / events | After bottom / overflow / RO / events |
|---|---|---|
| 77 | 980.3 / 212.3 / 9 / 1 | 748.5 / 0 / 11 / 2 |
| 130 | 980.3 / 212.3 / 9 / 1 | 748.5 / 0 / 11 / 2 |
| 183 | 980.3 / 212.3 / 9 / 1 | 748.5 / 0 / 11 / 2 |
| 239 | 980.3 / 212.3 / 9 / 1 | 748.5 / 0 / 11 / 2 |
| 294 | 980.3 / 212.3 / 9 / 1 | 748.5 / 0 / 11 / 2 |
| 350 | 980.3 / 212.3 / 9 / 1 | 748.5 / 0 / 11 / 2 |
| 409 | 980.3 / 212.3 / 9 / 1 | 748.5 / 0 / 11 / 2 |
| 465 | 980.3 / 212.3 / 9 / 1 | 748.5 / 0 / 11 / 2 |
| 520 | 980.3 / 212.3 / 9 / 1 | 748.5 / 0 / 11 / 2 |
| 574 | 980.3 / 212.3 / 9 / 1 | 748.5 / 0 / 11 / 2 |
| 629 | 980.3 / 212.3 / 9 / 1 | 748.5 / 0 / 11 / 2 |
| 683 | 980.3 / 212.3 / 9 / 1 | 748.5 / 0 / 11 / 2 |
| 739 | 980.3 / 212.3 / 9 / 1 | 748.5 / 0 / 11 / 2 |
| 796 | 980.3 / 212.3 / 9 / 1 | 748.5 / 0 / 11 / 2 |
| 852 | 980.3 / 212.3 / 9 / 1 | 748.5 / 0 / 11 / 2 |
| 908 | 980.3 / 212.3 / 9 / 1 | 748.5 / 0 / 11 / 2 |
| 963 | 980.3 / 212.3 / 9 / 1 | 748.5 / 0 / 11 / 2 |
| 1017 | 980.3 / 212.3 / 9 / 1 | 748.5 / 0 / 11 / 2 |
| 1072 | 980.3 / 212.3 / 9 / 1 | 748.5 / 0 / 11 / 2 |
| 1127 | 980.3 / 212.3 / 9 / 1 | 748.5 / 0 / 11 / 2 |
| 1180 | 980.3 / 212.3 / 9 / 1 | 748.5 / 0 / 11 / 2 |
| 1233 | 980.3 / 212.3 / 9 / 1 | 748.5 / 0 / 11 / 2 |
| 1286 | 980.3 / 212.3 / 9 / 1 | 748.5 / 0 / 11 / 2 |
| 1339 | 980.3 / 212.3 / 9 / 1 | 748.5 / 0 / 11 / 2 |
| 1391 | 980.3 / 212.3 / 9 / 1 | 748.5 / 0 / 11 / 2 |
| 1444 | 980.3 / 212.3 / 9 / 1 | 748.5 / 0 / 11 / 2 |
| 1497 | 980.3 / 212.3 / 9 / 1 | 748.5 / 0 / 11 / 2 |
| 1551 | 980.3 / 212.3 / 9 / 1 | 748.5 / 0 / 11 / 2 |
| 1605 | 980.3 / 212.3 / 9 / 1 | 748.5 / 0 / 11 / 2 |
| 1659 | 980.3 / 212.3 / 9 / 1 | 748.5 / 0 / 11 / 2 |

## Keyboard trail (real Tab presses)

| Side | Step | Focused element | In dialog | In viewport | Hittable | Content scrolled |
|---|---|---|---|---|---|---|
| before | 0 | summary.details__summary "Show more content" | true | false | false | false |
| before | 1 | button.ui-button.ui-corner-all.ui-widget "OK" | true | false | false | true |
| after | 0 | summary.details__summary "Show more content" | true | false | false | false |
| after | 1 | button.ui-button.ui-corner-all.ui-widget "OK" | true | true | true | true |

## Lifecycle

| Measure | Before | After |
|---|---|---|
| Observers created (page) | 9 | 13 |
| Observer disconnects (page) | 0 | 3 |
| Patch observers stored | 0 | 4 |
| Patch observer callbacks | 0 | 16 |
| Patch observer callbacks after close (900 ms) | 0 | 0 |
| Observer callbacks, page-wide, after close (900 ms) | 0 | 0 |
| dialogContentResize after close (900 ms) | 0 | 0 |

## Components

| Case | Observed (After) |
|---|---|
| component checks | not run |

Screenshots: before-F0-links-page-viewport.png, before-F1-dialog-open-viewport.png, before-F2-expanded-viewport.png, before-F3-content-scrolled-viewport.png, before-F4-after-tab-viewport.png, before-F5-collapsed-viewport.png, before-F5b-after-cycles-viewport.png, before-F6-closed-viewport.png, before-F7-reopen-1-viewport.png, before-F7-reopen-2-viewport.png, before-F7-reopen-3-viewport.png, after-F0-links-page-viewport.png, after-F1-dialog-open-viewport.png, after-F2-expanded-viewport.png, after-F3-content-scrolled-viewport.png, after-F4-after-tab-viewport.png, after-F5-collapsed-viewport.png, after-F5b-after-cycles-viewport.png, after-F6-closed-viewport.png, after-F7-reopen-1-viewport.png, after-F7-reopen-2-viewport.png, after-F7-reopen-3-viewport.png

---
Automated probe output. It is DRAFT evidence: the keyboard trail is not a person's keyboard pass, no screen reader ran, and the zoom is reflow-equivalent emulation, not browser zoom.
