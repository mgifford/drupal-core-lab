# Playwright evidence: #3419891 (3419891-pinned)

Run 2026-11-26T21:05:23.556Z. Before `0387fb948f 2026-11-25`, After `0387fb948f 2026-11-25` plus `3419891-increase-size-of.patch`. webkit 27.2, light, 1280x900, darwin arm64. Recorders: tools/playwright/lib/lab-run.mjs. Image fixture: 64x64 PNG generated in memory (no /tmp file).

**Verdict: reproduced-not-fixed.** 1 After-side requirement(s) failed: reopen-cancel.

Rule: requirements marked `core` are functional and decide the verdict on the After side. Before-side core rows are baseline evidence (failing there is the issue). `observe` rows are not judged. A scrollbar that is not painted is not a failure when the content still scrolls (macOS overlay scrollbars).

| Side | Requirement | Result | Detail |
|---|---|---|---|
| before | Accessible name is "Alternative text" (observe) | pass | label Alternative text, aria-label (none) |
| before | Field is a multiline textarea (observe) | FAIL | <input> |
| before | Field grows when text wraps | FAIL | 32px short → 32px wrapped |
| before | Field stops growing at the 6-row limit | pass | 32px at 6 rows, 32px at 10 rows, limit 136.0px |
| before | Text beyond the limit is reachable (vertical scroll) | FAIL | scrollHeight 30, clientHeight 30, overflow-y visible, scrollTop 0→0 |
| before | Unbroken long text does not scroll sideways | FAIL | scrollWidth 1494, clientWidth 250 |
| before | Field shrinks when text is removed | pass | 32px after clearing, one-row height ~31.0px |
| before | Cancel then reopen restores the saved (empty) value, a small field and a disabled Save | FAIL | value "", height 32px, Save enabled true (long text before Escape was 32px) |
| before | Save is disabled for empty text and enabled once text is typed | pass | initial enabled false, after typing enabled true |
| before | Save long text then reopen restores value and capped height | FAIL | value length 348, height 32px |
| before | Save short text over long then reopen restores value and small height | pass | value "A kitten", height 32px |
| before | Repeated reopen keeps a stable height | pass | heights 32px, 32px, 32px |
| before | Save and Cancel are visible, inside the viewport and clickable | pass | Save {"visible":true,"hit":true,"inViewport":true,"enabled":true}, Cancel {"visible":true,"hit":true,"inViewport":true,"enabled":true}, form in viewport true |
| before | Focus enters the field; Escape returns focus to the editor | pass | initial focus in field true, focus in editor after Escape true |
| before | Tab and Shift+Tab reach Save and Cancel predictably (observe) | pass | Tab→"Save", Tab→"Cancel", Shift+Tab→"Save" |
| before | Decorative toggle hides the field, enables Save and restores it | pass | hidden true, Save enabled true, height after untoggle 32px |
| before | No axe-core violations (WCAG 2.0/2.1/2.2 A/AA) with the form open (observe) | FAIL | 2 node(s): {"color-contrast":1,"label-content-name-mismatch":1} |
| after | Accessible name is "Alternative text" (observe) | pass | label Alternative text, aria-label (none) |
| after | Field is a multiline textarea (observe) | pass | <textarea> |
| after | Field grows when text wraps | pass | 32px short → 73px wrapped |
| after | Field stops growing at the 6-row limit | pass | 136px at 6 rows, 136px at 10 rows, limit 136.0px |
| after | Text beyond the limit is reachable (vertical scroll) | pass | scrollHeight 218, clientHeight 134, overflow-y auto, scrollTop 0→84 |
| after | Unbroken long text does not scroll sideways | pass | scrollWidth 250, clientWidth 250 |
| after | Field shrinks when text is removed | pass | 32px after clearing, one-row height ~31.0px |
| after | Cancel then reopen restores the saved (empty) value, a small field and a disabled Save | FAIL | value "", height 136px, Save enabled true (long text before Escape was 136px) |
| after | Save is disabled for empty text and enabled once text is typed | pass | initial enabled false, after typing enabled true |
| after | Save long text then reopen restores value and capped height | pass | value length 348, height 136px |
| after | Save short text over long then reopen restores value and small height | pass | value "A kitten", height 32px |
| after | Repeated reopen keeps a stable height | pass | heights 32px, 32px, 32px |
| after | Save and Cancel are visible, inside the viewport and clickable | pass | Save {"visible":true,"hit":true,"inViewport":true,"enabled":true}, Cancel {"visible":true,"hit":true,"inViewport":true,"enabled":true}, form in viewport true |
| after | Focus enters the field; Escape returns focus to the editor | pass | initial focus in field true, focus in editor after Escape true |
| after | Tab and Shift+Tab reach Save and Cancel predictably (observe) | pass | Tab→"Save", Tab→"Cancel", Shift+Tab→"Save" |
| after | Decorative toggle hides the field, enables Save and restores it | pass | hidden true, Save enabled true, height after untoggle 32px |
| after | No axe-core violations (WCAG 2.0/2.1/2.2 A/AA) with the form open (observe) | FAIL | 2 node(s): {"color-contrast":1,"label-content-name-mismatch":1} |

## Measurements

### Before — input

| Value length | 0 characters |
| Element | <input> type="text" |
| CKEditor view | `_x` minRows=null maxRows=null _height=null |
| Rendered height (getBoundingClientRect) | 32px |
| clientHeight / scrollHeight | 30 / 30 |
| clientWidth / scrollWidth | 250 / 250 |
| computed overflow-y / overflow-x | visible / visible |
| line-height, padding, borders, box-sizing | 21px, 4/4px, 1/1px, border-box |
| scrollTop after the interaction | 0 |

Overflow state:

| Value length | 348 characters |
| Element | <input> type="text" |
| CKEditor view | `_x` minRows=null maxRows=null _height=null |
| Rendered height (getBoundingClientRect) | 32px |
| clientHeight / scrollHeight | 30 / 30 |
| clientWidth / scrollWidth | 250 / 2080 |
| computed overflow-y / overflow-x | visible / visible |
| line-height, padding, borders, box-sizing | 21px, 4/4px, 1/1px, border-box |
| scrollTop after the interaction | 0 |

### After — textarea

Initial (empty):

| Value length | 0 characters |
| Element | <textarea> rows="1" |
| CKEditor view | `yx` minRows=1 maxRows=6 _height=32 |
| Rendered height (getBoundingClientRect) | 32px |
| clientHeight / scrollHeight | 30 / 30 |
| clientWidth / scrollWidth | 250 / 250 |
| computed overflow-y / overflow-x | auto / hidden |
| line-height, padding, borders, box-sizing | 21px, 4/4px, 1/1px, border-box |
| scrollTop after the interaction | 0 |

Short text:

| Value length | 8 characters |
| Element | <textarea> rows="1" |
| CKEditor view | `yx` minRows=1 maxRows=6 _height=32 |
| Rendered height (getBoundingClientRect) | 32px |
| clientHeight / scrollHeight | 30 / 30 |
| clientWidth / scrollWidth | 250 / 250 |
| computed overflow-y / overflow-x | auto / hidden |
| line-height, padding, borders, box-sizing | 21px, 4/4px, 1/1px, border-box |
| scrollTop after the interaction | 0 |

Wrapped text:

| Value length | 90 characters |
| Element | <textarea> rows="1" |
| CKEditor view | `yx` minRows=1 maxRows=6 _height=73 |
| Rendered height (getBoundingClientRect) | 73px |
| clientHeight / scrollHeight | 71 / 71 |
| clientWidth / scrollWidth | 250 / 250 |
| computed overflow-y / overflow-x | auto / hidden |
| line-height, padding, borders, box-sizing | 21px, 4/4px, 1/1px, border-box |
| scrollTop after the interaction | 0 |

Six rows:

| Value length | 207 characters |
| Element | <textarea> rows="1" |
| CKEditor view | `yx` minRows=1 maxRows=6 _height=136 |
| Rendered height (getBoundingClientRect) | 136px |
| clientHeight / scrollHeight | 134 / 134 |
| clientWidth / scrollWidth | 250 / 250 |
| computed overflow-y / overflow-x | auto / hidden |
| line-height, padding, borders, box-sizing | 21px, 4/4px, 1/1px, border-box |
| scrollTop after the interaction | 0 |

Ten rows (overflow):

| Value length | 348 characters |
| Element | <textarea> rows="1" |
| CKEditor view | `yx` minRows=1 maxRows=6 _height=136 |
| Rendered height (getBoundingClientRect) | 136px |
| clientHeight / scrollHeight | 134 / 218 |
| clientWidth / scrollWidth | 250 / 250 |
| computed overflow-y / overflow-x | auto / hidden |
| line-height, padding, borders, box-sizing | 21px, 4/4px, 1/1px, border-box |
| scrollTop after the interaction | 84 |

After clearing back to short:

| Value length | 8 characters |
| Element | <textarea> rows="1" |
| CKEditor view | `yx` minRows=1 maxRows=6 _height=32 |
| Rendered height (getBoundingClientRect) | 32px |
| clientHeight / scrollHeight | 30 / 30 |
| clientWidth / scrollWidth | 250 / 250 |
| computed overflow-y / overflow-x | auto / hidden |
| line-height, padding, borders, box-sizing | 21px, 4/4px, 1/1px, border-box |
| scrollTop after the interaction | 0 |

Reopened after Cancel:

| Value length | 0 characters |
| Element | <textarea> rows="1" |
| CKEditor view | `yx` minRows=1 maxRows=6 _height=136 |
| Rendered height (getBoundingClientRect) | 136px |
| clientHeight / scrollHeight | 134 / 134 |
| clientWidth / scrollWidth | 250 / 250 |
| computed overflow-y / overflow-x | auto / hidden |
| line-height, padding, borders, box-sizing | 21px, 4/4px, 1/1px, border-box |
| scrollTop after the interaction | 0 |

Reopened after saving long text:

| Value length | 348 characters |
| Element | <textarea> rows="1" |
| CKEditor view | `yx` minRows=1 maxRows=6 _height=136 |
| Rendered height (getBoundingClientRect) | 136px |
| clientHeight / scrollHeight | 134 / 218 |
| clientWidth / scrollWidth | 250 / 250 |
| computed overflow-y / overflow-x | auto / hidden |
| line-height, padding, borders, box-sizing | 21px, 4/4px, 1/1px, border-box |
| scrollTop after the interaction | 0 |

Reopened after saving short text:

| Value length | 8 characters |
| Element | <textarea> rows="1" |
| CKEditor view | `yx` minRows=1 maxRows=6 _height=32 |
| Rendered height (getBoundingClientRect) | 32px |
| clientHeight / scrollHeight | 30 / 30 |
| clientWidth / scrollWidth | 250 / 250 |
| computed overflow-y / overflow-x | auto / hidden |
| line-height, padding, borders, box-sizing | 21px, 4/4px, 1/1px, border-box |
| scrollTop after the interaction | 0 |

## Observations

- Platform scrollbar width: **0px** (0 = overlay scrollbars; the scrollbar is painted only while scrolling).
- Reopen path: image-toolbar, image-toolbar, image-toolbar.
- Repeated reopen heights: 32px, 32px, 32px.
- Before overflow: scrollHeight 30 vs clientHeight 30, overflow-y visible.
- After overflow: scrollHeight 218 vs clientHeight 134, overflow-y auto.

## Context

| | Before | After |
|---|---|---|
| Core commit | `0387fb948f 2026-11-25` | `0387fb948f 2026-11-25` |
| Drupal, PHP | 12.0-dev, 8.5.7 | 12.0-dev, 8.5.7 |
| Profile; default / admin theme (config) | standard; default_admin / default_admin | standard; default_admin / default_admin |
| Theme that rendered each page | /user/1/edit → default_admin<br>/node/add/page → default_admin | /user/1/edit → default_admin<br>/node/add/page → default_admin |
| Languages (default) | none (en) | none (en) |
| Modules only on this side | none | none |
| Enabled modules | 39 | 39 |

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

## Changes after input, and how a screen reader learns of them

After each click, key press or typing, the text that appeared or changed on the page. **Silent**: not in a live region, no `Drupal.announce()` after the same action, focus did not move to it, and the control pressed did not disclose it. A silent change is a candidate for WCAG 2.2 SC 4.1.3 Status Messages, for a person to judge: not every change is a status message. See docs/SILENT-CHANGES.md.

| | Side | Page | After | Text (first; last) | Where | Times |
|---|---|---|---|---|---|---|
| **new in After** | after | `/node/add/page` | key Tab textarea#ck-labeled-field-view-e3a3a4d971aedfa048ca787119f2… | Save | `span.ck.ck-tooltip__text` | 1 |
| gone in After | before | `/node/add/page` | key Tab input#ck-labeled-field-view-eec4e5d93f42699f37c693c9f32c540… | Save | `span.ck.ck-tooltip__text` | 1 |
| on both sides | after | `/node/add/page` | click button.ck.ck-button | image widget. Press Enter to type after or press Shift + Enter to type before the widget | `div.ck-fake-selection-container` | 1 |
| on both sides | after | `/node/add/page` | key Tab button.ck.ck-button | Cancel | `span.ck.ck-tooltip__text` | 1 |
| on both sides | after | `/node/add/page` | key Shift+Tab button.ck.ck-button | Save | `span.ck.ck-tooltip__text` | 1 |

Before: 2 in a live region, 0 Drupal.announce() after the same action, 3 focus moved to it, 0 shown by the control pressed (expanded), 0 inside the control itself, 26 the name of a control that appeared or changed, 4 silent.
After: 2 in a live region, 0 Drupal.announce() after the same action, 3 focus moved to it, 0 shown by the control pressed (expanded), 0 inside the control itself, 26 the name of a control that appeared or changed, 4 silent.

axe rules: Before {"color-contrast":1,"label-content-name-mismatch":1}, After {"color-contrast":1,"label-content-name-mismatch":1}.

Screenshots: `before-*-form.png`, `before-*-page.png`, `after-*-form.png`, `after-*-page.png` (short, max, overflow, reopen-after-cancel, reopen-saved-long, controls).

Limits: this records one browser, one scheme, one viewport per run. Zoom, real Safari (as opposed to Playwright WebKit), VoiceOver and a person's keyboard pass are separate evidence.
