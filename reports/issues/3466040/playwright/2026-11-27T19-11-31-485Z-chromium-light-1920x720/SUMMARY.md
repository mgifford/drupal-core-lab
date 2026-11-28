# Playwright evidence: #3466040 (3466040-pinned)

Run 2026-11-27T19:11:40.153Z. Scenario(s): **field-ui, views**. Core Before `97c6ff8b25 2026-11-23`, After `97c6ff8b25 2026-11-23` plus `3466040-dialog-buttoninputs-not.patch`. chromium 159.0.8154.6, colour scheme **light**, forced colours **none**, viewport 1920x720, darwin arm64. Trusted Playwright input (clicks, Tab, Escape); axe-core WCAG 2.0–2.2 A/AA. Recorders: tools/playwright/lib/lab-run.mjs; geometry and lifecycle probes: this evaluator.

Rule: **fix** rows are expected to be false on Before and true on After; **regression** rows are expected to be equal on both sides; **observe** rows are recorded, not judged. Verdict: **mixed**.

## Checks

| Type | Scenario | Check | Before | After | Verdict |
|---|---|---|---|---|---|
| observe | A | Scenario A was not evaluated: Scenario A: no Continue button and no field config form in the modal (step 1). / Scenario A: no Continue button and no field config form in the modal (step 1). | not evaluated | not evaluated | recorded |
| observe | B | Scenario B was not evaluated: page.goto: Timeout 30000ms exceeded.
Call log:
  - navigating to "https://repro-baseline-3466040.ddev.site/admin/structure/views/view/content", waiting until "load"
 | not evaluated | not evaluated | recorded |

## Scenario errors (this run is not evidence of a fix or a regression)

- **field-ui**: Before — Scenario A: no Continue button and no field config form in the modal (step 1).; After — Scenario A: no Continue button and no field config form in the modal (step 1).
- **views**: Before — page.goto: Timeout 30000ms exceeded.
Call log:
  - navigating to "https://repro-baseline-3466040.ddev.site/admin/structure/views/view/content", waiting until "load"


Fix the setup and re-run; see reports/issues/3466040/reviews/harness-plan.md for the preconditions.

## Stage geometry

### Scenario A: Field UI (Add field → field config → "Set default value")

| Stage | Viewport | Dialog (top→bottom) | Fits | Content client/scroll | Content overflow-y | Button pane | Primary button | Active element | RO cb Δ | autoResize Δ | dialogContentResize Δ |
|---|---|---|---|---|---|---|---|---|---|---|---|
| before A1-fields-page | 1920x720 | no dialog | – | – | – | – | – | body | – | – | – |
| before A2-add-field-modal | 1920x720 | 89.1→630.9 (h 541.8) | yes | 456/456 | auto | none | none | a.field-option.use-ajax "Pl… | 0 | 0 | 1 |
| before A3-type-chosen | 1920x720 | 89.1→630.9 (h 541.8) | yes | 456/456 | auto | none | none | a.field-option.use-ajax "Da… | 0 | 0 | 0 |
| after A1-fields-page | 1920x720 | no dialog | – | – | – | – | – | body | – | – | – |
| after A2-add-field-modal | 1920x720 | 89.1→630.9 (h 541.8) | yes | 456/456 | auto | none | none | a.field-option.use-ajax "Pl… | 1 | 0 | 1 |
| after A3-type-chosen | 1920x720 | 89.1→630.9 (h 541.8) | yes | 456/456 | auto | none | none | a.field-option.use-ajax "Da… | 0 | 0 | 0 |

### Scenario B: Views (Content type filter modal → details)

| Stage | Viewport | Dialog (top→bottom) | Fits | Content client/scroll | Content overflow-y | Button pane | Primary button | Active element | RO cb Δ | autoResize Δ | dialogContentResize Δ |
|---|---|---|---|---|---|---|---|---|---|---|---|
| after B0-views-page | 1920x720 | no dialog | – | – | – | – | – | body | – | – | – |
| after B1-filter-dialog-open | 1920x720 | 18→702 (h 684) | yes | 536/544 (scrolls) | hidden | 63px in view | Apply in view, hit | input#edit-options-custom-l… | 5 | 0 | 2 |
| after B4-after-tab | 1920x720 | 18→702 (h 684) | yes | 536/544 (scrolls) | hidden | 63px in view | Apply in view, hit | button.button.button--prima… | 0 | 0 | 0 |
| after B5-dialog-closed | 1920x720 | no dialog | – | – | – | – | – | a.views-ajax-link "Content: C… | – | – | – |

## Keyboard trail (real Tab presses; no programmatic scrolling)

Scenario A (from the "Set default value" checkbox after the click):

| Side | Step | Focused element | In dialog | In viewport | Page scrolled | Content scrolled |
|---|---|---|---|---|---|---|
| before | not run | | | | | |
| after | not run | | | | | |

Scenario B (from the last clicked summary):

| Side | Step | Focused element | In dialog | In viewport | Page scrolled | Content scrolled |
|---|---|---|---|---|---|---|
| before | not run | | | | | |
| after | 0 | input#edit-options-custom-label--F6SwkckQlis.form-c… | yes | yes | no | no |
| after | 1 | input#edit-options-label--uCp6loUdGoM.form-text.for… | yes | yes | no | no |
| after | 2 | input#edit-options-element-label-colon--W871EqsZBus… | yes | yes | no | no |
| after | 3 | input#edit-options-exclude--RzOfWQLWruQ.form-checkb… | yes | yes | no | no |
| after | 4 | select#edit-options-type--wmMQzdizfLY.form-select.f… | yes | yes | no | no |
| after | 5 | input#edit-options-settings-link--Y52erucqhRY.form-… | yes | yes | no | no |
| after | 6 | summary.details__summary "Style settings" | yes | yes | no | no |
| after | 7 | summary.details__summary "Rewrite results" | yes | yes | no | no |
| after | 8 | summary.details__summary "No results behavior" | yes | yes | no | no |
| after | 9 | summary.details__summary "Administrative title" | yes | yes | no | no |
| after | 10 | button.button.button--primary.js-form-submit "Apply" | yes | yes | no | yes |

## Lifecycle instrumentation (page-level, no patch change)

Counts are cumulative for the page; the stage tables above show per-stage deltas. `patch observer` is read from the `drupalAutoResizeObserver` jQuery data the patch stores — Before has none, After does. Instrumentation explains *whether the fix ran*; it is not a user-facing pass/fail.

### Scenario A

| Side | Stage | RO callbacks | observer(s) created | patch observer stored | patch observer callbacks | autoResize calls | autoResize wrapped | dialogContentResize | of which from .ui-dialog-content | page errors | console errors (page) | console errors (Node) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| before | A1-fields-page | 9 | 9 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| before | A2-add-field-modal | 9 | 9 | 0 | 0 | 0 | 1 | 1 | 1 | 0 | 0 | 0 |
| before | A3-type-chosen | 9 | 9 | 0 | 0 | 0 | 1 | 1 | 1 | 0 | 0 | 0 |
| after | A1-fields-page | 9 | 9 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| after | A2-add-field-modal | 10 | 10 | 1 | 1 | 0 | 1 | 1 | 1 | 0 | 0 | 0 |
| after | A3-type-chosen | 10 | 10 | 1 | 1 | 0 | 1 | 1 | 1 | 0 | 0 | 0 |

### Scenario B

| Side | Stage | RO callbacks | observer(s) created | patch observer stored | patch observer callbacks | autoResize calls | autoResize wrapped | dialogContentResize | of which from .ui-dialog-content | page errors | console errors (page) | console errors (Node) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| after | B0-views-page | 9 | 9 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| after | B1-filter-dialog-open | 14 | 12 | 1 | 2 | 0 | 1 | 2 | 2 | 0 | 0 | 0 |
| after | B4-after-tab | 14 | 12 | 1 | 2 | 0 | 1 | 2 | 2 | 0 | 0 | 0 |
| after | B5-dialog-closed | 104 | 12 | 1 | 2 | 0 | 1 | 2 | 2 | 0 | 0 | 0 |

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
| Theme that rendered each page | /user/1/edit → default_admin<br>/admin/structure/types/manage/article/fields → default_admin | /user/1/edit → default_admin<br>/admin/structure/types/manage/article/fields → default_admin<br>/admin/structure/views/view/content → default_admin |
| Languages (default) | fr (en) | fr (en) |
| Modules only on this side | none | none |
| Enabled modules | 43 | 43 |

## AJAX responses

Every Drupal AJAX response, in order; raw commands in `ajax-before.json` and `ajax-after.json`.

**Before** (0 responses)


**After** (3 responses)

- `/admin/structure/views/view/content/preview/page_1?_wrapper_format` 200: settings, add_css, add_js, insert
- `/admin/structure/views/ajax/handler/content/page_1/field/type?_wrapper_format` 200: settings, add_css, add_js, openDialog, viewsSetForm, viewsHighlight
- `/admin/structure/views/view/content/preview/page_1?_wrapper_format` 200: settings, add_css, add_js, insert

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
| **new in After** | after | `/admin/structure/views/view/content` | click a.views-ajax-link "Content: Content type (Content type)" | Separate contextual filter values with a "/". For example, 40/12/10 . | `div#preview-args--description` | 1 |
| **new in After** | after | `/admin/structure/views/view/content` | click a.views-ajax-link "Content: Content type (Content type)" | Title; Path | `strong` | 2 |
| **new in After** | after | `/admin/structure/views/view/content` | click a.views-ajax-link "Content: Content type (Content type)" | Content | `td` | 1 |
| **new in After** | after | `/admin/structure/views/view/content` | click a.views-ajax-link "Content: Content type (Content type)" | Title; Content | `h1.section-title` | 3 |
| **new in After** | after | `/admin/structure/views/view/content` | click a.views-ajax-link "Content: Content type (Content type)" | Content | `div.preview-section` | 1 |
| **new in After** | after | `/admin/structure/views/view/content` | click a.views-ajax-link "Content: Content type (Content type)" | Author | `th#view-name-table-column--V0q30h9NTUA` | 2 |
| **new in After** | after | `/admin/structure/views/view/content` | click a.views-ajax-link "Content: Content type (Content type)" | Language | `th#view-langcode-table-column--68gAN9Q1n8w` | 2 |
| **new in After** | after | `/admin/structure/views/view/content` | click a.views-ajax-link "Content: Content type (Content type)" | Operations | `th#view-operations-table-column--6TMewfwHhlo` | 2 |

Before: 0 in a live region, 0 Drupal.announce() after the same action, 23 focus moved to it, 0 shown by the control pressed (expanded), 0 inside the control itself, 0 the name of a control that appeared or changed, 0 silent.
After: 0 in a live region, 0 Drupal.announce() after the same action, 38 focus moved to it, 0 shown by the control pressed (expanded), 0 inside the control itself, 17 the name of a control that appeared or changed, 14 silent.

## Limits

- Geometry and lifecycle numbers are automated evidence: a DRAFT, not a substitute for a person's keyboard and screen-reader pass.
- WebKit here is Playwright's WebKit build (Safari's engine); it is **not** Safari, and this run does not test Safari, Safari's keyboard behaviour on macOS, or VoiceOver.
- Colour scheme and forced colours are Playwright emulation, not a real OS setting; a real Windows contrast theme still needs a person.
- Real browser zoom (Ctrl/Cmd +), text-only zoom, pinch zoom and native magnifiers were not run; `--zoom` is the reflow-equivalent approximation described in the harness plan.
- The field config change is never saved: the run stops in the modal, so the site's configuration is unchanged (the private temp store may keep the half-finished field).
- axe-core finds only a subset of problems and does not evaluate dialog reflow.

---
Automated evidence is a DRAFT. Run `node tools/playwright/evaluate-3466040.mjs 3466040-latest --scenario=both` after re-pinning, and have a person check the keyboard path.
