# Playwright evidence: #3590502 (3590502-latest)

Run 2026-11-23T23:46:09.028Z. Core Before `97c6ff8b25 2026-11-23`, After `97c6ff8b25 2026-11-23` plus `3590502-move-local-tasks.patch`. chromium 159.0.8154.6, light, 1280x900, darwin arm64. Trusted keyboard input and axe-core WCAG 2.0 to 2.2 A/AA.

| Type | Check | Before | After | Verdict |
|---|---|---|---|---|
| precondition | Navigation top bar on the user edit page | true | true | as expected |
| fix | View is a primary local task on /user/1/edit | false | true | as expected |
| fix | Edit is a primary local task on /user/1/edit | false | true | as expected |
| fix | View is absent from the top-bar actions on /user/1/edit | true | false | as expected |
| fix | Edit is a primary local task on /user/1 | false | true | as expected |
| fix | Edit is absent from featured top-bar actions on /user/1 | true | false | as expected |
| observe | Keyboard route to View from /user/1/edit | More actions menu | local task | recorded |
| regression | Keyboard reaches the View page | true | true | as expected |
| regression | axe violations on /user/1/edit | 0 | 0 | as expected |
| regression | axe violations on /user/1 | 0 | 0 | as expected |
| regression | JavaScript errors | 0 | 0 | as expected |

## Keyboard route

Before reached View through More actions menu after 21 Tab presses. After reached View through local task after 20 Tab presses.

## Context

| | Before | After |
|---|---|---|
| Core commit | `97c6ff8b25 2026-11-23` | `97c6ff8b25 2026-11-23` |
| Drupal, PHP | 12.0-dev, 8.5.13 | 12.0-dev, 8.5.13 |
| Profile; default / admin theme (config) | standard; default_admin / default_admin | standard; default_admin / default_admin |
| Theme that rendered each page | /user/1/edit → default_admin<br>/user/1 → null | /user/1/edit → default_admin<br>/user/1 → default_admin |
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
| before | none | | |
| after | none | | |

## Changes after input, and how a screen reader learns of them

After each click, key press or typing, the text that appeared or changed on the page. **Silent**: not in a live region, no `Drupal.announce()` after the same action, focus did not move to it, and the control pressed did not disclose it. A silent change is a candidate for WCAG 2.2 SC 4.1.3 Status Messages, for a person to judge: not every change is a status message. See docs/SILENT-CHANGES.md.

No silent change on either side.

Before: 0 in a live region, 0 Drupal.announce() after the same action, 0 focus moved to it, 1 shown by the control pressed (expanded), 0 inside the control itself, 0 the name of a control that appeared or changed, 0 silent.
After: 0 in a live region, 0 Drupal.announce() after the same action, 0 focus moved to it, 0 shown by the control pressed (expanded), 0 inside the control itself, 0 the name of a control that appeared or changed, 0 silent.

Screenshots: `before-edit.png`, `after-edit.png`, `before-view.png`, and `after-view.png`.

Axe rules on edit: Before {}, After {}. Axe rules on view: Before {}, After {}.

**The observed movement matches the MR intention.** A person still needs to assess keyboard focus visibility, active-state clarity and forced-colours presentation.

---
Automated evidence is DRAFT. DOM, keyboard replay and axe checks do not replace a screen-reader or human keyboard review.
