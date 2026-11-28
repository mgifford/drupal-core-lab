# Playwright evidence: #3466040 (3466040-pinned)

Run 2026-11-27T19:21:28.084Z. Scenario(s): **field-ui**. Core Before `97c6ff8b25 2026-11-23`, After `97c6ff8b25 2026-11-23` plus `3466040-dialog-buttoninputs-not.patch`. chromium 159.0.8154.6, colour scheme **light**, forced colours **none**, viewport 1920x720, darwin arm64. Trusted Playwright input (clicks, Tab, Escape); axe-core WCAG 2.0–2.2 A/AA. Recorders: tools/playwright/lib/lab-run.mjs; geometry and lifecycle probes: this evaluator.

Rule: **fix** rows are expected to be false on Before and true on After; **regression** rows are expected to be equal on both sides; **observe** rows are recorded, not judged. Verdict: **not-reproduced**.

## Checks

| Type | Scenario | Check | Before | After | Verdict |
|---|---|---|---|---|---|
| fix | A | After "Set default value" is enabled, the dialog stays inside the viewport | true | true | **NOT as expected** |
| fix | A | Primary action button (Save/Continue) is in the viewport and hit-testable after the growth | true | true | **NOT as expected** |
| fix | A | Primary action button is reached with Tab (real keys) and is inside the viewport when focused | true | true | **NOT as expected** |
| observe | A | Dialog rect after the growth | top 18, bottom 702 (viewport 720) | top 18, bottom 702 (viewport 720) | recorded |
| observe | A | Primary action button after the growth | Save in viewport, hittable | Save in viewport, hittable | recorded |
| observe | A | Keyboard trail to the primary action | Save after 6 Tab press(es), in viewport (content scrolled) | Save after 6 Tab press(es), in viewport (content scrolled) | recorded |
| observe | A | ResizeObserver callbacks during the growth step (instrumentation) | 0 | 0 | recorded |
| observe | A | autoResize executions during the growth step (instrumentation) | 0 | 0 | recorded |
| observe | A | Observer stored in $element.data("drupalAutoResizeObserver") (instrumentation; only the patched side has one) | false | true | recorded |
| observe | A | Observer disconnected on dialog close (instrumentation) | 0 | 1 | recorded |
| regression | A | Dialog size when the field config form opens (before any growth) is equal on both sides (within 4 px) | 1102x684 | 1102x684 | as expected |
| regression | A | Drupal.displace offsets are equal when the dialog opens | {"top":0,"right":0,"bottom":0,"left":264} | {"top":0,"right":0,"bottom":0,"left":264} | as expected |
| regression | A | axe violating elements in the modal after the growth | 0 | 0 | as expected |
| regression | A | Uncaught page errors (lab-run jsErrors, ResizeObserver loop notice excluded) | 0 | 0 | as expected |
| regression | A | Console errors (page-level probe + page.on("console")) | 0 | 0 | as expected |

Scenario A (Field UI): Before passes every fix check, so the problem did not reproduce in this scenario on this core/these steps.

## Stage geometry

### Scenario A: Field UI (Add field → field config → "Set default value")

| Stage | Viewport | Dialog (top→bottom) | Fits | Content client/scroll | Content overflow-y | Button pane | Primary button | Active element | RO cb Δ | autoResize Δ | dialogContentResize Δ |
|---|---|---|---|---|---|---|---|---|---|---|---|
| before A1-fields-page | 1920x720 | no dialog | – | – | – | – | – | body | – | – | – |
| before A2-add-field-modal | 1920x720 | 89.1→630.9 (h 541.8) | yes | 456/456 | auto | none | none | a.field-option.use-ajax "Pl… | 0 | 0 | 1 |
| before A3-type-chosen | 1920x720 | 36.5→683.4 (h 646.9) | yes | 499/499 | auto | 63px in view | Continue in view, hit | input#edit-label--sUSm4DzCR… | 0 | 0 | 2 |
| before A4-continue-1 | 1920x720 | 36.5→683.4 (h 646.9) | yes | 499/499 | auto | 63px in view | Continue in view, hit | input#edit-label--sUSm4DzCR… | 0 | 0 | 0 |
| before A4-continue-2 | 1920x720 | 18→702 (h 684) | yes | 536/906 (scrolls) | auto | 63px in view | Save in view, hit | input#edit-label--RlVv_EqIL… | 0 | 0 | 7 |
| before A5-config-form-open | 1920x720 | 18→702 (h 684) | yes | 536/906 (scrolls) | auto | 63px in view | Save in view, hit | input#edit-label--RlVv_EqIL… | 0 | 0 | 0 |
| before A6-default-value-on | 1920x720 | 18→702 (h 684) | yes | 536/1272 (scrolls) | auto | 63px in view | Save in view, hit | input#edit-set-default-valu… | 0 | 0 | 0 |
| before A7-after-tab | 1920x720 | 18→702 (h 684) | yes | 536/1272 (scrolls) | auto | 63px in view | Save in view, hit | button.button.button--prima… | 0 | 0 | 0 |
| before A8-dialog-closed | 1920x720 | no dialog | – | – | – | – | – | a.use-ajax.button.button--act… | – | – | – |
| after A1-fields-page | 1920x720 | no dialog | – | – | – | – | – | body | – | – | – |
| after A2-add-field-modal | 1920x720 | 89.1→630.9 (h 541.8) | yes | 456/456 | auto | none | none | a.field-option.use-ajax "Pl… | 1 | 0 | 1 |
| after A3-type-chosen | 1920x720 | 36.5→683.4 (h 646.9) | yes | 499/499 | auto | 63px in view | Continue in view, hit | input#edit-label--HIJ_2XM7a… | 2 | 0 | 2 |
| after A4-continue-1 | 1920x720 | 18→702 (h 684) | yes | 536/906 (scrolls) | auto | 63px in view | Save in view, hit | input#edit-label--Dde2zQTsw… | 6 | 0 | 6 |
| after A5-config-form-open | 1920x720 | 18→702 (h 684) | yes | 536/906 (scrolls) | auto | 63px in view | Save in view, hit | input#edit-label--Dde2zQTsw… | 0 | 0 | 0 |
| after A6-default-value-on | 1920x720 | 18→702 (h 684) | yes | 536/1272 (scrolls) | auto | 63px in view | Save in view, hit | input#edit-set-default-valu… | 0 | 0 | 0 |
| after A7-after-tab | 1920x720 | 18→702 (h 684) | yes | 536/1272 (scrolls) | auto | 63px in view | Save in view, hit | button.button.button--prima… | 0 | 0 | 0 |
| after A8-dialog-closed | 1920x720 | no dialog | – | – | – | – | – | a.use-ajax.button.button--act… | – | – | – |

### Scenario B: Views (Content type filter modal → details)

| Stage | Viewport | Dialog (top→bottom) | Fits | Content client/scroll | Content overflow-y | Button pane | Primary button | Active element | RO cb Δ | autoResize Δ | dialogContentResize Δ |
|---|---|---|---|---|---|---|---|---|---|---|---|

## Keyboard trail (real Tab presses; no programmatic scrolling)

Scenario A (from the "Set default value" checkbox after the click):

| Side | Step | Focused element | In dialog | In viewport | Page scrolled | Content scrolled |
|---|---|---|---|---|---|---|
| before | 0 | input#edit-set-default-value--36HUSwyvDXo.form-chec… | yes | yes | no | no |
| before | 1 | summary.details__summary "Default value" | yes | yes | no | yes |
| before | 2 | select#edit-default-value-input-default-date-type--… | yes | yes | no | yes |
| before | 3 | input#edit-default-value-input-default-date--jpIkzH… | yes | yes | no | no |
| before | 4 | a "strtotime" | yes | yes | no | no |
| before | 5 | button.button.use-ajax.ui-button "Change field type" | yes | yes | no | yes |
| before | 6 | button.button.button--primary.js-form-submit "Save" | yes | yes | no | no |
| after | 0 | input#edit-set-default-value--CkvWTZpsMBw.form-chec… | yes | yes | no | no |
| after | 1 | summary.details__summary "Default value" | yes | yes | no | yes |
| after | 2 | select#edit-default-value-input-default-date-type--… | yes | yes | no | yes |
| after | 3 | input#edit-default-value-input-default-date--ByyLF5… | yes | yes | no | no |
| after | 4 | a "strtotime" | yes | yes | no | no |
| after | 5 | button.button.use-ajax.ui-button "Change field type" | yes | yes | no | yes |
| after | 6 | button.button.button--primary.js-form-submit "Save" | yes | yes | no | no |

Scenario B (from the last clicked summary):

| Side | Step | Focused element | In dialog | In viewport | Page scrolled | Content scrolled |
|---|---|---|---|---|---|---|
| before | not run | | | | | |
| after | not run | | | | | |

## Lifecycle instrumentation (page-level, no patch change)

Counts are cumulative for the page; the stage tables above show per-stage deltas. `patch observer` is read from the `drupalAutoResizeObserver` jQuery data the patch stores — Before has none, After does. Instrumentation explains *whether the fix ran*; it is not a user-facing pass/fail.

### Scenario A

| Side | Stage | RO callbacks | observer(s) created | patch observer stored | patch observer callbacks | autoResize calls | autoResize wrapped | dialogContentResize | of which from .ui-dialog-content | page errors | console errors (page) | console errors (Node) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| before | A1-fields-page | 9 | 9 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| before | A2-add-field-modal | 9 | 9 | 0 | 0 | 0 | 1 | 1 | 1 | 0 | 0 | 0 |
| before | A3-type-chosen | 9 | 9 | 0 | 0 | 0 | 2 | 3 | 3 | 0 | 0 | 0 |
| before | A4-continue-1 | 9 | 9 | 0 | 0 | 0 | 2 | 3 | 3 | 0 | 0 | 0 |
| before | A4-continue-2 | 9 | 9 | 0 | 0 | 0 | 4 | 10 | 10 | 0 | 0 | 0 |
| before | A5-config-form-open | 9 | 9 | 0 | 0 | 0 | 4 | 10 | 10 | 0 | 0 | 0 |
| before | A6-default-value-on | 9 | 9 | 0 | 0 | 0 | 4 | 10 | 10 | 0 | 0 | 0 |
| before | A7-after-tab | 9 | 9 | 0 | 0 | 0 | 4 | 10 | 10 | 0 | 0 | 0 |
| before | A8-dialog-closed | 90 | 9 | 0 | 0 | 0 | 4 | 10 | 10 | 0 | 0 | 0 |
| after | A1-fields-page | 9 | 9 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| after | A2-add-field-modal | 10 | 10 | 1 | 1 | 0 | 1 | 1 | 1 | 0 | 0 | 0 |
| after | A3-type-chosen | 12 | 11 | 2 | 3 | 0 | 2 | 3 | 3 | 0 | 0 | 0 |
| after | A4-continue-1 | 18 | 12 | 3 | 9 | 0 | 3 | 9 | 9 | 0 | 0 | 0 |
| after | A5-config-form-open | 18 | 12 | 3 | 9 | 0 | 3 | 9 | 9 | 0 | 0 | 0 |
| after | A6-default-value-on | 18 | 12 | 3 | 9 | 0 | 3 | 9 | 9 | 0 | 0 | 0 |
| after | A7-after-tab | 18 | 12 | 3 | 9 | 0 | 3 | 9 | 9 | 0 | 0 | 0 |
| after | A8-dialog-closed | 101 | 12 | 3 | 11 | 0 | 3 | 9 | 9 | 0 | 0 | 0 |

### Scenario B

| Side | Stage | RO callbacks | observer(s) created | patch observer stored | patch observer callbacks | autoResize calls | autoResize wrapped | dialogContentResize | of which from .ui-dialog-content | page errors | console errors (page) | console errors (Node) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|

## What was measured

Per stage: `window.innerWidth/innerHeight`, `window.scrollY`, `Drupal.displace.offsets`, every visible `.ui-dialog` (rect, computed height/max-height/overflow, titlebar and `.ui-dialog-titlebar-close` rects, `.ui-dialog-content` clientHeight/scrollHeight/scrollTop/overflow-y, `.ui-dialog-buttonpane` rect, each action button rect/visibility/disabled/hit-test, `.form-actions`, `details` open state, the Views `.scroll` container), `document.activeElement`, emulated media features, and a hit-test with `document.elementFromPoint` at the centre and four inset corners (an element is reported as operable only when the topmost element there is it or a descendant, and it is inside the viewport).

Screenshots per stage: `<side>-<stage>-viewport.png` and `<side>-<stage>-dialog.png` (the dialog crop is a screenshot clip, which never scrolls the page; element screenshots would).

The After side stores a ResizeObserver in `$element.data('drupalAutoResizeObserver')`; the Before side has none. That is read-only instrumentation (see reviews/lifecycle-instrumentation.md) and is also the direct signal that the patch executed.

## Context

| | Before | After |
|---|---|---|
| Core commit | `97c6ff8b25 2026-11-23` | `97c6ff8b25 2026-11-23` |
| Drupal, PHP | 12.0-dev, 8.5.7 | 12.0-dev, 8.5.7 |
| Profile; default / admin theme (config) | standard; default_admin / default_admin | standard; default_admin / default_admin |
| Theme that rendered each page | /user/1/edit → default_admin<br>/admin/structure/types/manage/article/fields → default_admin | /user/1/edit → default_admin<br>/admin/structure/types/manage/article/fields → default_admin |
| Languages (default) | fr (en) | fr (en) |
| Modules only on this side | none | none |
| Enabled modules | 43 | 43 |

## AJAX responses

Every Drupal AJAX response, in order; raw commands in `ajax-before.json` and `ajax-after.json`.

**Before** (2 responses)

- `/admin/structure/types/manage/article/fields/add-field/date_time/true?entity_type&_wrapper_format&ajax_form` 200: update_build_id, openModalDialogWithUrl
- `/admin/structure/types/manage/article/fields/add-field/date_time/true?entity_type&_wrapper_format&ajax_form` 200: update_build_id, openModalDialogWithUrl

**After** (1 response)

- `/admin/structure/types/manage/article/fields/add-field/date_time/true?entity_type&_wrapper_format&ajax_form` 200: update_build_id, openModalDialogWithUrl

## What could be announced

`Drupal.announce()` calls, and text changes inside live regions (role alert/status/log or aria-live). A recorded change is not proof that a screen reader spoke it; see the screen-reader run for that.

| Side | Source | Politeness | Text |
|---|---|---|---|
| before | none | | |
| after | none | | |

## Changes after input, and how a screen reader learns of them

After each click, key press or typing, the text that appeared or changed on the page. **Silent**: not in a live region, no `Drupal.announce()` after the same action, focus did not move to it, and the control pressed did not disclose it. A silent change is a candidate for WCAG 2.2 SC 4.1.3 Status Messages, for a person to judge: not every change is a status message. See docs/SILENT-CHANGES.md.

| | Side | Page | After | Text (first; last) | Where | Times |
|---|---|---|---|---|---|---|
| **new in After** | after | `/admin/structure/types/manage/article/fields` | click input#datetime "Datetime" | Machine name: field_test_date_06707 Edit | `small#edit-label--HIJ_2XM7aMI-machine-name-suffix` | 1 |
| **new in After** | after | `/admin/structure/types/manage/article/fields` | click input#edit-set-default-value--CkvWTZpsMBw "Set default valu… | The default value for this field, used when creating new content. | `div.details__description` | 1 |
| **new in After** | after | `/admin/structure/types/manage/article/fields` | click input#edit-set-default-value--CkvWTZpsMBw "Set default valu… | Set a default value for this date. | `div#edit-default-value-input-default-date-type--M…` | 1 |
| **new in After** | after | `/admin/structure/types/manage/article/fields` | click input#edit-set-default-value--CkvWTZpsMBw "Set default valu… | Describe a time by reference to the current day, like '+90 days' (90 days from the day the field is created) … | `div#edit-default-value-input-default-date--ByyLF5…` | 1 |
| gone in After | before | `/admin/structure/types/manage/article/fields` | click input#datetime "Datetime" | Machine name: field_test_date_94768 Edit | `small#edit-label--sUSm4DzCRz0-machine-name-suffix` | 1 |
| gone in After | before | `/admin/structure/types/manage/article/fields` | click input#edit-set-default-value--36HUSwyvDXo "Set default valu… | The default value for this field, used when creating new content. | `div.details__description` | 1 |
| gone in After | before | `/admin/structure/types/manage/article/fields` | click input#edit-set-default-value--36HUSwyvDXo "Set default valu… | Set a default value for this date. | `div#edit-default-value-input-default-date-type--B…` | 1 |
| gone in After | before | `/admin/structure/types/manage/article/fields` | click input#edit-set-default-value--36HUSwyvDXo "Set default valu… | Describe a time by reference to the current day, like '+90 days' (90 days from the day the field is created) … | `div#edit-default-value-input-default-date--jpIkzH…` | 1 |

Before: 0 in a live region, 0 Drupal.announce() after the same action, 52 focus moved to it, 0 shown by the control pressed (expanded), 0 inside the control itself, 4 the name of a control that appeared or changed, 4 silent.
After: 0 in a live region, 0 Drupal.announce() after the same action, 52 focus moved to it, 0 shown by the control pressed (expanded), 0 inside the control itself, 4 the name of a control that appeared or changed, 4 silent.

## Limits

- Geometry and lifecycle numbers are automated evidence: a DRAFT, not a substitute for a person's keyboard and screen-reader pass.
- WebKit here is Playwright's WebKit build (Safari's engine); it is **not** Safari, and this run does not test Safari, Safari's keyboard behaviour on macOS, or VoiceOver.
- Colour scheme and forced colours are Playwright emulation, not a real OS setting; a real Windows contrast theme still needs a person.
- Real browser zoom (Ctrl/Cmd +), text-only zoom, pinch zoom and native magnifiers were not run; `--zoom` is the reflow-equivalent approximation described in the harness plan.
- The field config change is never saved: the run stops in the modal, so the site's configuration is unchanged (the private temp store may keep the half-finished field).
- axe-core finds only a subset of problems and does not evaluate dialog reflow.

---
Automated evidence is a DRAFT. Run `node tools/playwright/evaluate-3466040.mjs 3466040-latest --scenario=both` after re-pinning, and have a person check the keyboard path.
