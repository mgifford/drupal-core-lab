# Playwright evidence: #3466040 (3466040-pinned)

Run 2026-11-27T19:25:52.116Z. Scenario(s): **field-ui, views**. Core Before `97c6ff8b25 2026-11-23`, After `97c6ff8b25 2026-11-23` plus `3466040-dialog-buttoninputs-not.patch`. webkit 27.2, colour scheme **light**, forced colours **none**, viewport 1920x720, darwin arm64. Trusted Playwright input (clicks, Tab, Escape); axe-core WCAG 2.0–2.2 A/AA. Recorders: tools/playwright/lib/lab-run.mjs; geometry and lifecycle probes: this evaluator.

Rule: **fix** rows are expected to be false on Before and true on After; **regression** rows are expected to be equal on both sides; **observe** rows are recorded, not judged. Verdict: **mixed**.

## Checks

| Type | Scenario | Check | Before | After | Verdict |
|---|---|---|---|---|---|
| fix | A | After "Set default value" is enabled, the dialog stays inside the viewport | true | true | **NOT as expected** |
| fix | A | Primary action button (Save/Continue) is in the viewport and hit-testable after the growth | true | true | **NOT as expected** |
| fix | A | Primary action button is reached with Tab (real keys) and is inside the viewport when focused | false | false | **NOT as expected** |
| observe | A | Dialog rect after the growth | top 18, bottom 702 (viewport 720) | top 18, bottom 702 (viewport 720) | recorded |
| observe | A | Primary action button after the growth | Save in viewport, hittable | Save in viewport, hittable | recorded |
| observe | A | Keyboard trail to the primary action | no primary button reached in 80 Tab presses | no primary button reached in 80 Tab presses | recorded |
| observe | A | ResizeObserver callbacks during the growth step (instrumentation) | 0 | 0 | recorded |
| observe | A | autoResize executions during the growth step (instrumentation) | 0 | 0 | recorded |
| observe | A | Observer stored in $element.data("drupalAutoResizeObserver") (instrumentation; only the patched side has one) | false | true | recorded |
| observe | A | Observer disconnected on dialog close (instrumentation) | 0 | 1 | recorded |
| regression | A | Dialog size when the field config form opens (before any growth) is equal on both sides (within 4 px) | 1102x684 | 1102x684 | as expected |
| regression | A | Drupal.displace offsets are equal when the dialog opens | {"top":0,"right":0,"bottom":0,"left":264} | {"top":0,"right":0,"bottom":0,"left":264} | as expected |
| regression | A | axe violating elements in the modal after the growth | 0 | 0 | as expected |
| regression | A | Uncaught page errors (lab-run jsErrors, ResizeObserver loop notice excluded) | 0 | 0 | as expected |
| regression | A | Console errors (page-level probe + page.on("console")) | 0 | 0 | as expected |
| fix | B | After the filter dialog's details elements are expanded, the dialog stays inside the viewport | false | false | **NOT as expected** |
| fix | B | Primary action button (Apply) is in the viewport and hit-testable after the details are expanded | false | false | **NOT as expected** |
| fix | B | Primary action button is reached with Tab (real keys) and is inside the viewport when focused | false | false | **NOT as expected** |
| observe | B | Dialog rect after the last details toggle | no dialog | no dialog | recorded |
| observe | B | Keyboard trail to the primary action | no primary button reached in 80 Tab presses | no primary button reached in 80 Tab presses | recorded |
| observe | B | ResizeObserver callbacks during the first details expansion (instrumentation) | not captured | not captured | recorded |
| observe | B | autoResize executions during the first details expansion (instrumentation) | not captured | not captured | recorded |
| observe | B | Views UI dispatches dialogContentResize itself on summary clicks (pre-existing workaround; instrumentation) | not captured | not captured | recorded |
| regression | B | Dialog size when the filter dialog opens is equal on both sides (within 4 px) | 1442x684 | 1442x684 | as expected |
| regression | B | axe violating elements in the filter dialog | 2 | 2 | as expected |
| regression | B | Console errors (page-level probe + page.on("console")) | 0 | 0 | as expected |

Scenario A (Field UI): Some fix checks already pass on Before and some do not: read the table and the screenshots before drawing a conclusion.

Scenario B (Views): Before fails the fix checks but After does not pass all of them.

## Stage geometry

### Scenario A: Field UI (Add field → field config → "Set default value")

| Stage | Viewport | Dialog (top→bottom) | Fits | Content client/scroll | Content overflow-y | Button pane | Primary button | Active element | RO cb Δ | autoResize Δ | dialogContentResize Δ |
|---|---|---|---|---|---|---|---|---|---|---|---|
| before A1-fields-page | 1920x720 | no dialog | – | – | – | – | – | body | – | – | – |
| before A2-add-field-modal | 1920x720 | 89.1→630.9 (h 541.8) | yes | 456/456 | auto | none | none | a.field-option.use-ajax "Pl… | 0 | 0 | 1 |
| before A3-type-chosen | 1920x720 | 36.5→683.4 (h 646.9) | yes | 499/499 | auto | 63px in view | Continue in view, hit | input#edit-label--MvTi5wBV1… | 0 | 0 | 2 |
| before A4-continue-1 | 1920x720 | 18→702 (h 684) | yes | 536/906 (scrolls) | auto | 63px in view | Save in view, hit | input#edit-label--ByMzfU8qa… | 0 | 0 | 3 |
| before A5-config-form-open | 1920x720 | 18→702 (h 684) | yes | 536/906 (scrolls) | auto | 63px in view | Save in view, hit | input#edit-label--ByMzfU8qa… | 0 | 0 | 0 |
| before A6-default-value-on | 1920x720 | 18→702 (h 684) | yes | 536/1272 (scrolls) | auto | 63px in view | Save in view, hit | div.ui-dialog.ui-corner-all… | 0 | 0 | 0 |
| before A7-after-tab | 1920x720 | 18→702 (h 684) | yes | 536/1272 (scrolls) | auto | 63px in view | Save in view, hit | select#edit-default-value-i… | 0 | 0 | 0 |
| before A8-dialog-closed | 1920x720 | no dialog | – | – | – | – | – | body | – | – | – |
| after A1-fields-page | 1920x720 | no dialog | – | – | – | – | – | body | – | – | – |
| after A2-add-field-modal | 1920x720 | 89.1→630.9 (h 541.8) | yes | 456/456 | auto | none | none | a.field-option.use-ajax "Pl… | 1 | 0 | 1 |
| after A3-type-chosen | 1920x720 | 36.5→683.4 (h 646.9) | yes | 499/499 | auto | 63px in view | Continue in view, hit | input#edit-label--LS6AEtu2C… | 2 | 0 | 2 |
| after A4-continue-1 | 1920x720 | 18→702 (h 684) | yes | 536/906 (scrolls) | auto | 63px in view | Save in view, hit | input#edit-label--TxhUB9-H6… | 6 | 0 | 6 |
| after A5-config-form-open | 1920x720 | 18→702 (h 684) | yes | 536/906 (scrolls) | auto | 63px in view | Save in view, hit | input#edit-label--TxhUB9-H6… | 0 | 0 | 0 |
| after A6-default-value-on | 1920x720 | 18→702 (h 684) | yes | 536/1272 (scrolls) | auto | 63px in view | Save in view, hit | div.ui-dialog.ui-corner-all… | 0 | 0 | 0 |
| after A7-after-tab | 1920x720 | 18→702 (h 684) | yes | 536/1272 (scrolls) | auto | 63px in view | Save in view, hit | select#edit-default-value-i… | 0 | 0 | 0 |
| after A8-dialog-closed | 1920x720 | no dialog | – | – | – | – | – | body | – | – | – |

### Scenario B: Views (Content type filter modal → details)

| Stage | Viewport | Dialog (top→bottom) | Fits | Content client/scroll | Content overflow-y | Button pane | Primary button | Active element | RO cb Δ | autoResize Δ | dialogContentResize Δ |
|---|---|---|---|---|---|---|---|---|---|---|---|
| before B0-views-page | 1920x720 | no dialog | – | – | – | – | – | body | – | – | – |
| before B1-filter-dialog-open | 1920x720 | 18→702 (h 684) | yes | 536/544 (scrolls) | hidden | 63px in view | Apply in view, hit | input#edit-options-custom-l… | 2 | 0 | 1 |
| before B4-after-tab | 1920x720 | 18→702 (h 684) | yes | 536/544 (scrolls) | hidden | 63px in view | Apply in view, hit | summary.details__summary "A… | 0 | 0 | 0 |
| before B5-dialog-closed | 1920x720 | no dialog | – | – | – | – | – | body | – | – | – |
| after B0-views-page | 1920x720 | no dialog | – | – | – | – | – | body | – | – | – |
| after B1-filter-dialog-open | 1920x720 | 18→702 (h 684) | yes | 536/544 (scrolls) | hidden | 63px in view | Apply in view, hit | input#edit-options-custom-l… | 4 | 0 | 2 |
| after B4-after-tab | 1920x720 | 18→702 (h 684) | yes | 536/544 (scrolls) | hidden | 63px in view | Apply in view, hit | summary.details__summary "A… | 0 | 0 | 0 |
| after B5-dialog-closed | 1920x720 | no dialog | – | – | – | – | – | body | – | – | – |

## Keyboard trail (real Tab presses; no programmatic scrolling)

Scenario A (from the "Set default value" checkbox after the click):

| Side | Step | Focused element | In dialog | In viewport | Page scrolled | Content scrolled |
|---|---|---|---|---|---|---|
| before | 0 | div.ui-dialog.ui-corner-all.ui-widget "Test date 59… | yes | yes | no | no |
| before | 1 | button.ui-button.ui-corner-all.ui-widget "Close" | yes | yes | no | no |
| before | 2 | input#edit-label--ByMzfU8qaCo.form-text.required.fo… | yes | no | no | yes |
| before | 3 | select#edit-field-storage-subform-settings-datetime… | yes | yes | no | yes |
| before | 4 | select#edit-field-storage-subform-cardinality--eavU… | yes | yes | no | no |
| before | 5 | input#edit-field-storage-subform-cardinality-number… | yes | yes | no | no |
| before | 6 | textarea#edit-description--85RtPq-7iro.form-textare… | yes | no | no | yes |
| before | 7 | summary.details__summary "Default value" | yes | yes | no | yes |
| before | 8 | select#edit-default-value-input-default-date-type--… | yes | yes | no | no |
| before | 9 | input#edit-default-value-input-default-date--Gt7y9J… | yes | yes | no | no |
| before | 11 | input#edit-label--ByMzfU8qaCo.form-text.required.fo… | yes | yes | no | yes |
| before | 12 | select#edit-field-storage-subform-settings-datetime… | yes | yes | no | no |
| before | 13 | select#edit-field-storage-subform-cardinality--eavU… | yes | yes | no | no |
| before | 14 | input#edit-field-storage-subform-cardinality-number… | yes | yes | no | no |
| before | 15 | textarea#edit-description--85RtPq-7iro.form-textare… | yes | no | no | no |
| before | 16 | summary.details__summary "Default value" | yes | yes | no | yes |
| before | 17 | select#edit-default-value-input-default-date-type--… | yes | yes | no | no |
| before | 18 | input#edit-default-value-input-default-date--Gt7y9J… | yes | yes | no | no |
| before | 20 | input#edit-label--ByMzfU8qaCo.form-text.required.fo… | yes | no | no | yes |
| before | 21 | select#edit-field-storage-subform-settings-datetime… | yes | yes | no | yes |
| before | 22 | select#edit-field-storage-subform-cardinality--eavU… | yes | yes | no | no |
| before | 23 | input#edit-field-storage-subform-cardinality-number… | yes | yes | no | no |
| before | 24 | textarea#edit-description--85RtPq-7iro.form-textare… | yes | no | no | no |
| before | 25 | summary.details__summary "Default value" | yes | yes | no | yes |
| before | 26 | select#edit-default-value-input-default-date-type--… | yes | yes | no | no |
| before | 27 | input#edit-default-value-input-default-date--Gt7y9J… | yes | yes | no | no |
| before | 29 | input#edit-label--ByMzfU8qaCo.form-text.required.fo… | yes | yes | no | yes |
| before | 30 | select#edit-field-storage-subform-settings-datetime… | yes | yes | no | no |
| before | 31 | select#edit-field-storage-subform-cardinality--eavU… | yes | yes | no | no |
| before | 32 | input#edit-field-storage-subform-cardinality-number… | yes | yes | no | no |
| before | 33 | textarea#edit-description--85RtPq-7iro.form-textare… | yes | no | no | no |
| before | 34 | summary.details__summary "Default value" | yes | yes | no | yes |
| before | 35 | select#edit-default-value-input-default-date-type--… | yes | yes | no | no |
| before | 36 | input#edit-default-value-input-default-date--Gt7y9J… | yes | yes | no | no |
| before | 38 | input#edit-label--ByMzfU8qaCo.form-text.required.fo… | yes | no | no | yes |
| before | 39 | select#edit-field-storage-subform-settings-datetime… | yes | yes | no | yes |
| before | 40 | select#edit-field-storage-subform-cardinality--eavU… | yes | yes | no | no |
| before | 41 | input#edit-field-storage-subform-cardinality-number… | yes | yes | no | no |
| before | 42 | textarea#edit-description--85RtPq-7iro.form-textare… | yes | no | no | no |
| before | 43 | summary.details__summary "Default value" | yes | yes | no | yes |
| before | 44 | select#edit-default-value-input-default-date-type--… | yes | yes | no | no |
| before | 45 | input#edit-default-value-input-default-date--Gt7y9J… | yes | yes | no | no |
| before | 47 | input#edit-label--ByMzfU8qaCo.form-text.required.fo… | yes | yes | no | yes |
| before | 48 | select#edit-field-storage-subform-settings-datetime… | yes | yes | no | no |
| before | 49 | select#edit-field-storage-subform-cardinality--eavU… | yes | yes | no | no |
| before | 50 | input#edit-field-storage-subform-cardinality-number… | yes | yes | no | no |
| before | 51 | textarea#edit-description--85RtPq-7iro.form-textare… | yes | no | no | no |
| before | 52 | summary.details__summary "Default value" | yes | yes | no | yes |
| before | 53 | select#edit-default-value-input-default-date-type--… | yes | yes | no | no |
| before | 54 | input#edit-default-value-input-default-date--Gt7y9J… | yes | yes | no | no |
| before | 56 | input#edit-label--ByMzfU8qaCo.form-text.required.fo… | yes | no | no | yes |
| before | 57 | select#edit-field-storage-subform-settings-datetime… | yes | yes | no | yes |
| before | 58 | select#edit-field-storage-subform-cardinality--eavU… | yes | yes | no | no |
| before | 59 | input#edit-field-storage-subform-cardinality-number… | yes | yes | no | no |
| before | 60 | textarea#edit-description--85RtPq-7iro.form-textare… | yes | no | no | no |
| before | 61 | summary.details__summary "Default value" | yes | yes | no | yes |
| before | 62 | select#edit-default-value-input-default-date-type--… | yes | yes | no | no |
| before | 63 | input#edit-default-value-input-default-date--Gt7y9J… | yes | yes | no | no |
| before | 65 | input#edit-label--ByMzfU8qaCo.form-text.required.fo… | yes | no | no | yes |
| before | 66 | select#edit-field-storage-subform-settings-datetime… | yes | yes | no | yes |
| before | 67 | select#edit-field-storage-subform-cardinality--eavU… | yes | yes | no | no |
| before | 68 | input#edit-field-storage-subform-cardinality-number… | yes | yes | no | no |
| before | 69 | textarea#edit-description--85RtPq-7iro.form-textare… | yes | no | no | no |
| before | 70 | summary.details__summary "Default value" | yes | yes | no | yes |
| before | 71 | select#edit-default-value-input-default-date-type--… | yes | yes | no | no |
| before | 72 | input#edit-default-value-input-default-date--Gt7y9J… | yes | yes | no | no |
| before | 74 | input#edit-label--ByMzfU8qaCo.form-text.required.fo… | yes | no | no | yes |
| before | 75 | select#edit-field-storage-subform-settings-datetime… | yes | yes | no | yes |
| before | 76 | select#edit-field-storage-subform-cardinality--eavU… | yes | yes | no | no |
| before | 77 | input#edit-field-storage-subform-cardinality-number… | yes | yes | no | no |
| before | 78 | textarea#edit-description--85RtPq-7iro.form-textare… | yes | no | no | no |
| before | 79 | summary.details__summary "Default value" | yes | yes | no | yes |
| before | 80 | select#edit-default-value-input-default-date-type--… | yes | yes | no | no |
| after | 0 | div.ui-dialog.ui-corner-all.ui-widget "Test date 74… | yes | yes | no | no |
| after | 1 | button.ui-button.ui-corner-all.ui-widget "Close" | yes | yes | no | no |
| after | 2 | input#edit-label--TxhUB9-H6Kw.form-text.required.fo… | yes | no | no | yes |
| after | 3 | select#edit-field-storage-subform-settings-datetime… | yes | yes | no | yes |
| after | 4 | select#edit-field-storage-subform-cardinality--bxB9… | yes | yes | no | no |
| after | 5 | input#edit-field-storage-subform-cardinality-number… | yes | yes | no | no |
| after | 6 | textarea#edit-description--qzGTjtNqGGM.form-textare… | yes | no | no | no |
| after | 7 | summary.details__summary "Default value" | yes | yes | no | yes |
| after | 8 | select#edit-default-value-input-default-date-type--… | yes | yes | no | no |
| after | 9 | input#edit-default-value-input-default-date--xv94vz… | yes | yes | no | no |
| after | 11 | input#edit-label--TxhUB9-H6Kw.form-text.required.fo… | yes | no | no | yes |
| after | 12 | select#edit-field-storage-subform-settings-datetime… | yes | yes | no | yes |
| after | 13 | select#edit-field-storage-subform-cardinality--bxB9… | yes | yes | no | no |
| after | 14 | input#edit-field-storage-subform-cardinality-number… | yes | yes | no | no |
| after | 15 | textarea#edit-description--qzGTjtNqGGM.form-textare… | yes | no | no | no |
| after | 16 | summary.details__summary "Default value" | yes | yes | no | yes |
| after | 17 | select#edit-default-value-input-default-date-type--… | yes | yes | no | no |
| after | 18 | input#edit-default-value-input-default-date--xv94vz… | yes | yes | no | no |
| after | 20 | input#edit-label--TxhUB9-H6Kw.form-text.required.fo… | yes | no | no | yes |
| after | 21 | select#edit-field-storage-subform-settings-datetime… | yes | yes | no | yes |
| after | 22 | select#edit-field-storage-subform-cardinality--bxB9… | yes | yes | no | no |
| after | 23 | input#edit-field-storage-subform-cardinality-number… | yes | yes | no | no |
| after | 24 | textarea#edit-description--qzGTjtNqGGM.form-textare… | yes | no | no | no |
| after | 25 | summary.details__summary "Default value" | yes | yes | no | yes |
| after | 26 | select#edit-default-value-input-default-date-type--… | yes | yes | no | no |
| after | 27 | input#edit-default-value-input-default-date--xv94vz… | yes | yes | no | no |
| after | 29 | input#edit-label--TxhUB9-H6Kw.form-text.required.fo… | yes | no | no | yes |
| after | 30 | select#edit-field-storage-subform-settings-datetime… | yes | yes | no | yes |
| after | 31 | select#edit-field-storage-subform-cardinality--bxB9… | yes | yes | no | no |
| after | 32 | input#edit-field-storage-subform-cardinality-number… | yes | yes | no | no |
| after | 33 | textarea#edit-description--qzGTjtNqGGM.form-textare… | yes | no | no | no |
| after | 34 | summary.details__summary "Default value" | yes | yes | no | yes |
| after | 35 | select#edit-default-value-input-default-date-type--… | yes | yes | no | no |
| after | 36 | input#edit-default-value-input-default-date--xv94vz… | yes | yes | no | no |
| after | 38 | input#edit-label--TxhUB9-H6Kw.form-text.required.fo… | yes | no | no | yes |
| after | 39 | select#edit-field-storage-subform-settings-datetime… | yes | yes | no | yes |
| after | 40 | select#edit-field-storage-subform-cardinality--bxB9… | yes | yes | no | no |
| after | 41 | input#edit-field-storage-subform-cardinality-number… | yes | yes | no | no |
| after | 42 | textarea#edit-description--qzGTjtNqGGM.form-textare… | yes | no | no | no |
| after | 43 | summary.details__summary "Default value" | yes | yes | no | yes |
| after | 44 | select#edit-default-value-input-default-date-type--… | yes | yes | no | no |
| after | 45 | input#edit-default-value-input-default-date--xv94vz… | yes | yes | no | no |
| after | 47 | input#edit-label--TxhUB9-H6Kw.form-text.required.fo… | yes | no | no | yes |
| after | 48 | select#edit-field-storage-subform-settings-datetime… | yes | yes | no | yes |
| after | 49 | select#edit-field-storage-subform-cardinality--bxB9… | yes | yes | no | no |
| after | 50 | input#edit-field-storage-subform-cardinality-number… | yes | yes | no | no |
| after | 51 | textarea#edit-description--qzGTjtNqGGM.form-textare… | yes | no | no | no |
| after | 52 | summary.details__summary "Default value" | yes | yes | no | yes |
| after | 53 | select#edit-default-value-input-default-date-type--… | yes | yes | no | no |
| after | 54 | input#edit-default-value-input-default-date--xv94vz… | yes | yes | no | no |
| after | 56 | input#edit-label--TxhUB9-H6Kw.form-text.required.fo… | yes | no | no | yes |
| after | 57 | select#edit-field-storage-subform-settings-datetime… | yes | yes | no | yes |
| after | 58 | select#edit-field-storage-subform-cardinality--bxB9… | yes | yes | no | no |
| after | 59 | input#edit-field-storage-subform-cardinality-number… | yes | yes | no | no |
| after | 60 | textarea#edit-description--qzGTjtNqGGM.form-textare… | yes | no | no | no |
| after | 61 | summary.details__summary "Default value" | yes | yes | no | yes |
| after | 62 | select#edit-default-value-input-default-date-type--… | yes | yes | no | no |
| after | 63 | input#edit-default-value-input-default-date--xv94vz… | yes | yes | no | no |
| after | 65 | input#edit-label--TxhUB9-H6Kw.form-text.required.fo… | yes | no | no | yes |
| after | 66 | select#edit-field-storage-subform-settings-datetime… | yes | yes | no | yes |
| after | 67 | select#edit-field-storage-subform-cardinality--bxB9… | yes | yes | no | no |
| after | 68 | input#edit-field-storage-subform-cardinality-number… | yes | yes | no | no |
| after | 69 | textarea#edit-description--qzGTjtNqGGM.form-textare… | yes | no | no | no |
| after | 70 | summary.details__summary "Default value" | yes | yes | no | yes |
| after | 71 | select#edit-default-value-input-default-date-type--… | yes | yes | no | no |
| after | 72 | input#edit-default-value-input-default-date--xv94vz… | yes | yes | no | no |
| after | 74 | input#edit-label--TxhUB9-H6Kw.form-text.required.fo… | yes | no | no | yes |
| after | 75 | select#edit-field-storage-subform-settings-datetime… | yes | yes | no | yes |
| after | 76 | select#edit-field-storage-subform-cardinality--bxB9… | yes | yes | no | no |
| after | 77 | input#edit-field-storage-subform-cardinality-number… | yes | yes | no | no |
| after | 78 | textarea#edit-description--qzGTjtNqGGM.form-textare… | yes | no | no | no |
| after | 79 | summary.details__summary "Default value" | yes | yes | no | yes |
| after | 80 | select#edit-default-value-input-default-date-type--… | yes | yes | no | no |

Scenario B (from the last clicked summary):

| Side | Step | Focused element | In dialog | In viewport | Page scrolled | Content scrolled |
|---|---|---|---|---|---|---|
| before | 0 | input#edit-options-custom-label--XSy_IuhQyWo.form-c… | yes | yes | no | no |
| before | 1 | input#edit-options-label--2SjJ2czpvfE.form-text.for… | yes | yes | no | no |
| before | 2 | select#edit-options-type--sLGPOsA1Vl4.form-select.f… | yes | yes | no | no |
| before | 3 | summary.details__summary "Style settings" | yes | yes | no | no |
| before | 4 | summary.details__summary "Rewrite results" | yes | yes | no | no |
| before | 5 | summary.details__summary "No results behavior" | yes | yes | no | no |
| before | 6 | summary.details__summary "Administrative title" | yes | yes | no | no |
| before | 8 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| before | 10 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| before | 12 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| before | 14 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| before | 16 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| before | 18 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| before | 20 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| before | 22 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| before | 24 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| before | 26 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| before | 28 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| before | 30 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| before | 32 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| before | 34 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| before | 36 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| before | 38 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| before | 40 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| before | 42 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| before | 44 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| before | 46 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| before | 48 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| before | 50 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| before | 52 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| before | 54 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| before | 56 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| before | 58 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| before | 60 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| before | 62 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| before | 64 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| before | 66 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| before | 68 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| before | 70 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| before | 72 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| before | 74 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| before | 76 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| before | 78 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| before | 80 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| after | 0 | input#edit-options-custom-label--BdWt9BzFdmE.form-c… | yes | yes | no | no |
| after | 1 | input#edit-options-label--kWlHMXnNmww.form-text.for… | yes | yes | no | no |
| after | 2 | select#edit-options-type--l5zti95u5hY.form-select.f… | yes | yes | no | no |
| after | 3 | summary.details__summary "Style settings" | yes | yes | no | no |
| after | 4 | summary.details__summary "Rewrite results" | yes | yes | no | no |
| after | 5 | summary.details__summary "No results behavior" | yes | yes | no | no |
| after | 6 | summary.details__summary "Administrative title" | yes | yes | no | no |
| after | 8 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| after | 10 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| after | 12 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| after | 14 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| after | 16 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| after | 18 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| after | 20 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| after | 22 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| after | 24 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| after | 26 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| after | 28 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| after | 30 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| after | 32 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| after | 34 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| after | 36 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| after | 38 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| after | 40 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| after | 42 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| after | 44 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| after | 46 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| after | 48 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| after | 50 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| after | 52 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| after | 54 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| after | 56 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| after | 58 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| after | 60 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| after | 62 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| after | 64 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| after | 66 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| after | 68 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| after | 70 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| after | 72 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| after | 74 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| after | 76 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| after | 78 | summary.details__summary "Administrative title" | yes | yes | no | yes |
| after | 80 | summary.details__summary "Administrative title" | yes | yes | no | yes |

## Lifecycle instrumentation (page-level, no patch change)

Counts are cumulative for the page; the stage tables above show per-stage deltas. `patch observer` is read from the `drupalAutoResizeObserver` jQuery data the patch stores — Before has none, After does. Instrumentation explains *whether the fix ran*; it is not a user-facing pass/fail.

### Scenario A

| Side | Stage | RO callbacks | observer(s) created | patch observer stored | patch observer callbacks | autoResize calls | autoResize wrapped | dialogContentResize | of which from .ui-dialog-content | page errors | console errors (page) | console errors (Node) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| before | A1-fields-page | 9 | 9 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| before | A2-add-field-modal | 9 | 9 | 0 | 0 | 0 | 1 | 1 | 1 | 0 | 0 | 0 |
| before | A3-type-chosen | 9 | 9 | 0 | 0 | 0 | 2 | 3 | 3 | 0 | 0 | 0 |
| before | A4-continue-1 | 9 | 9 | 0 | 0 | 0 | 3 | 6 | 6 | 0 | 0 | 0 |
| before | A5-config-form-open | 9 | 9 | 0 | 0 | 0 | 3 | 6 | 6 | 0 | 0 | 0 |
| before | A6-default-value-on | 9 | 9 | 0 | 0 | 0 | 3 | 6 | 6 | 0 | 0 | 0 |
| before | A7-after-tab | 9 | 9 | 0 | 0 | 0 | 3 | 6 | 6 | 0 | 0 | 0 |
| before | A8-dialog-closed | 108 | 9 | 0 | 0 | 0 | 3 | 6 | 6 | 0 | 0 | 0 |
| after | A1-fields-page | 9 | 9 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| after | A2-add-field-modal | 10 | 10 | 1 | 1 | 0 | 1 | 1 | 1 | 0 | 0 | 0 |
| after | A3-type-chosen | 12 | 11 | 2 | 3 | 0 | 2 | 3 | 3 | 0 | 0 | 0 |
| after | A4-continue-1 | 18 | 12 | 3 | 9 | 0 | 3 | 9 | 9 | 0 | 0 | 0 |
| after | A5-config-form-open | 18 | 12 | 3 | 9 | 0 | 3 | 9 | 9 | 0 | 0 | 0 |
| after | A6-default-value-on | 18 | 12 | 3 | 9 | 0 | 3 | 9 | 9 | 0 | 0 | 0 |
| after | A7-after-tab | 18 | 12 | 3 | 9 | 0 | 3 | 9 | 9 | 0 | 0 | 0 |
| after | A8-dialog-closed | 74 | 12 | 3 | 11 | 0 | 3 | 9 | 9 | 0 | 0 | 0 |

### Scenario B

| Side | Stage | RO callbacks | observer(s) created | patch observer stored | patch observer callbacks | autoResize calls | autoResize wrapped | dialogContentResize | of which from .ui-dialog-content | page errors | console errors (page) | console errors (Node) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| before | B0-views-page | 10 | 10 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| before | B1-filter-dialog-open | 12 | 11 | 0 | 0 | 0 | 1 | 1 | 1 | 0 | 0 | 0 |
| before | B4-after-tab | 12 | 11 | 0 | 0 | 0 | 1 | 1 | 1 | 0 | 0 | 0 |
| before | B5-dialog-closed | 12 | 11 | 0 | 0 | 0 | 1 | 1 | 1 | 0 | 0 | 0 |
| after | B0-views-page | 10 | 10 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| after | B1-filter-dialog-open | 14 | 12 | 1 | 2 | 0 | 1 | 2 | 2 | 0 | 0 | 0 |
| after | B4-after-tab | 14 | 12 | 1 | 2 | 0 | 1 | 2 | 2 | 0 | 0 | 0 |
| after | B5-dialog-closed | 14 | 12 | 1 | 2 | 0 | 1 | 2 | 2 | 0 | 0 | 0 |

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
| Theme that rendered each page | /user/1/edit → default_admin<br>/admin/structure/types/manage/article/fields → default_admin<br>/admin/structure/views/view/content → default_admin | /user/1/edit → default_admin<br>/admin/structure/types/manage/article/fields → default_admin<br>/admin/structure/views/view/content → default_admin |
| Languages (default) | fr (en) | fr (en) |
| Modules only on this side | none | none |
| Enabled modules | 43 | 43 |

## AJAX responses

Every Drupal AJAX response, in order; raw commands in `ajax-before.json` and `ajax-after.json`.

**Before** (4 responses)

- `/admin/structure/types/manage/article/fields/add-field/date_time/true?entity_type&_wrapper_format&ajax_form` 200: update_build_id, openModalDialogWithUrl
- `/admin/structure/views/view/content/preview/page_1?_wrapper_format` 200: settings, add_css, add_js, insert
- `/admin/structure/views/ajax/handler/content/page_1/field/type?_wrapper_format` 200: settings, add_css, add_js, openDialog, viewsSetForm, viewsHighlight
- `/admin/structure/views/view/content/preview/page_1?_wrapper_format` 200: settings, insert

**After** (4 responses)

- `/admin/structure/types/manage/article/fields/add-field/date_time/true?entity_type&_wrapper_format&ajax_form` 200: update_build_id, openModalDialogWithUrl
- `/admin/structure/views/view/content/preview/page_1?_wrapper_format` 200: settings, add_css, add_js, insert
- `/admin/structure/views/ajax/handler/content/page_1/field/type?_wrapper_format` 200: settings, add_css, add_js, openDialog, viewsSetForm, viewsHighlight
- `/admin/structure/views/view/content/preview/page_1?_wrapper_format` 200: settings, insert

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
| **new in After** | after | `/admin/structure/types/manage/article/fields` | click input#datetime "Datetime" | Machine name: field_test_date_74021 Edit | `small#edit-label--LS6AEtu2Chg-machine-name-suffix` | 1 |
| gone in After | before | `/admin/structure/types/manage/article/fields` | click input#datetime "Datetime" | Machine name: field_test_date_59271 Edit | `small#edit-label--MvTi5wBV10s-machine-name-suffix` | 1 |

Before: 0 in a live region, 0 Drupal.announce() after the same action, 74 focus moved to it, 0 shown by the control pressed (expanded), 0 inside the control itself, 0 the name of a control that appeared or changed, 1 silent.
After: 0 in a live region, 0 Drupal.announce() after the same action, 74 focus moved to it, 0 shown by the control pressed (expanded), 0 inside the control itself, 0 the name of a control that appeared or changed, 1 silent.

## Limits

- Geometry and lifecycle numbers are automated evidence: a DRAFT, not a substitute for a person's keyboard and screen-reader pass.
- WebKit here is Playwright's WebKit build (Safari's engine); it is **not** Safari, and this run does not test Safari, Safari's keyboard behaviour on macOS, or VoiceOver.
- Colour scheme and forced colours are Playwright emulation, not a real OS setting; a real Windows contrast theme still needs a person.
- Real browser zoom (Ctrl/Cmd +), text-only zoom, pinch zoom and native magnifiers were not run; `--zoom` is the reflow-equivalent approximation described in the harness plan.
- The field config change is never saved: the run stops in the modal, so the site's configuration is unchanged (the private temp store may keep the half-finished field).
- axe-core finds only a subset of problems and does not evaluate dialog reflow.

---
Automated evidence is a DRAFT. Run `node tools/playwright/evaluate-3466040.mjs 3466040-latest --scenario=both` after re-pinning, and have a person check the keyboard path.
