# #3637339 skip-link evaluation

DRAFT, AI-assisted. reproduced-not-fixed; 2 After measured-check failures (including the explicit full-indicator-bounds expectation, not a WCAG verdict). Infrastructure errors: 0.

Real UI saves, sequential trusted Tab/Enter, independent fresh-document repeats. OS scheme is distinct from saved Appearance. RTL is direction-only simulation. Forced colors is browser emulation, not Windows AT testing.

WCAG mapping: 2.4.7 Focus Visible (AA), 2.4.11 Focus Not Obscured (Minimum, AA), 2.4.13 Focus Appearance (AAA). Color preference mismatch and partial ring clipping alone do not establish failure of these criteria. No blanket conformance claim; no human keyboard or real VoiceOver/NVDA pass was done. Some loaded skills have outdated criterion numbering; this report uses final WCAG 2.2 numbering.

| Configuration | Before match | After match | After activation | After outline-edge risk | Comparison |
|---|---|---|---|---|---|
| light-pink-orange | false | false | false | false | residual measured mismatch |

## before

Settings restore: restored through UI. Theme inference provenance is retained per readiness record.

### light-pink-orange

Readiness: measured. 

Saved UI choices: {"enable_dark_mode":{"value":"0","choices":[{"value":"auto","label":"Auto"},{"value":"0","label":"Light"},{"value":"1","label":"Dark"}]},"preset_accent_color":{"value":"pink","choices":[{"value":"blue","label":"Blue (Default)"},{"value":"light_blue","label":"Light Blue"},{"value":"dark_purple","label":"Dark Purple"},{"value":"purple","label":"Purple"},{"value":"teal","label":"Teal"},{"value":"green","label":"Green"},{"value":"pink","label":"Pink"},{"value":"red","label":"Red"},{"value":"orange","label":"Orange"},{"value":"yellow","label":"Yellow"},{"value":"neutral","label":"Neutral"},{"value":"custom","label":"Custom"}]},"preset_focus_color":{"value":"orange","choices":[{"value":"default","label":"Default Admin Focus color (Default)"},{"value":"green","label":"Green"},{"value":"legacy_green","label":"Legacy green"},{"value":"orange","label":"Orange"},{"value":"dark","label":"Neutral"},{"value":"accent","label":"Same as Accent color"},{"value":"custom","label":"Custom"}]}}

Trial 1: {"skipReachable":false}. Resolved focus: unavailable. Paint: inconclusive; review required.

Trial 2: {"skipReachable":false}. Resolved focus: unavailable. Paint: inconclusive; review required.


## after

Settings restore: restored through UI. Theme inference provenance is retained per readiness record.

### light-pink-orange

Readiness: measured. 

Saved UI choices: {"enable_dark_mode":{"value":"0","choices":[{"value":"auto","label":"Auto"},{"value":"0","label":"Light"},{"value":"1","label":"Dark"}]},"preset_accent_color":{"value":"pink","choices":[{"value":"blue","label":"Blue (Default)"},{"value":"light_blue","label":"Light Blue"},{"value":"dark_purple","label":"Dark Purple"},{"value":"purple","label":"Purple"},{"value":"teal","label":"Teal"},{"value":"green","label":"Green"},{"value":"pink","label":"Pink"},{"value":"red","label":"Red"},{"value":"orange","label":"Orange"},{"value":"yellow","label":"Yellow"},{"value":"neutral","label":"Neutral"},{"value":"custom","label":"Custom"}]},"preset_focus_color":{"value":"orange","choices":[{"value":"default","label":"Default Admin Focus color (Default)"},{"value":"green","label":"Green"},{"value":"legacy_green","label":"Legacy green"},{"value":"orange","label":"Orange"},{"value":"dark","label":"Neutral"},{"value":"accent","label":"Same as Accent color"},{"value":"custom","label":"Custom"}]}}

Trial 1: {"skipReachable":false}. Resolved focus: unavailable. Paint: inconclusive; review required.

Trial 2: {"skipReachable":false}. Resolved focus: unavailable. Paint: inconclusive; review required.


## Evidence limits

Full axe results (violations, passes, incomplete and inapplicable) and body AX snapshots accompany important states on the first independent trial. Subsequent trials repeat navigation and measurements without repeated axe scans. Computed-color contrast estimates are not sampled/composited paint proof. Geometry/hit tests flag risks only. Each configuration carries per-scenario JS errors. Unavailable options are NOT TESTED, not substituted with invented presets.

MR review threads were HTTP 401. The caller read all seven public issue comments and the migrated Gin #3506305 work-item summary ("[PP-1] Improve the Skip to main content-link", referencing !581, text contrast and focus color); full Gin comments were unavailable. The obsolete drupal.org URL was not found; that does not mean the related issue does not exist.

## Context

| | Before | After |
|---|---|---|
| Core commit | `ecb483ff6d 2026-11-18` | `ecb483ff6d 2026-11-18` |
| Drupal, PHP | 12.0-dev, 8.5.12 | 12.0-dev, 8.5.12 |
| Profile; default / admin theme (config) | standard; default_admin / default_admin | standard; default_admin / default_admin |
| Theme that rendered each page | /user/1/edit → default_admin<br>/admin/appearance/settings/default_admin → null<br>/admin/appearance/settings/default_admin → default_admin | /user/1/edit → default_admin<br>/admin/appearance/settings/default_admin → null<br>/admin/appearance/settings/default_admin → default_admin |
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

Before: 0 in a live region, 0 Drupal.announce() after the same action, 0 focus moved to it, 0 shown by the control pressed (expanded), 0 inside the control itself, 0 the name of a control that appeared or changed, 0 silent.
After: 0 in a live region, 0 Drupal.announce() after the same action, 0 focus moved to it, 0 shown by the control pressed (expanded), 0 inside the control itself, 0 the name of a control that appeared or changed, 0 silent.

