# #3637163 custom colour validation evaluation (3637163-latest, light, 1280x900)

DRAFT, AI-assisted; a person has not reviewed it. Verdict: reproduced-and-fixed; 0 After check(s) not met.

Text is typed with the keyboard and the field left with Tab. The only script-assisted steps are turning off the browser's own form validation to test the server, and restoring the Blue preset at the end. Not covered: real screen readers, a person's keyboard pass, other browsers (run --browser=firefox|webkit), 200% zoom.

| Side | State | Typed | --accent-base on html | Focus attribute | Save button contrast | Client message | Server messages | Image |
|---|---|---|---|---|---|---|---|---|
| before | initial |  | #015efe | default | 5.21 | no | - | [before-initial.png](before-initial.png) |
| before | custom-selected |  | #000 | default | 21 | no | - | [before-custom-selected.png](before-custom-selected.png) |
| before | accent-invalid-777777 | 777777 | 777777 | default | 1 | no | - | [before-accent-invalid-777777.png](before-accent-invalid-777777.png) |
| before | accent-invalid-zzzzzz | #zzzzzz | #zzzzzz | default | 1 | no | - | [before-accent-invalid-zzzzzz.png](before-accent-invalid-zzzzzz.png) |
| before | accent-valid | #336699 | #336699 | default | 6 | no | - | [before-accent-valid.png](before-accent-valid.png) |
| before | preset-red |  | #d8002f | default | 5.3 | no | - | [before-preset-red.png](before-preset-red.png) |
| before | back-to-custom-with-invalid |  | zzz | default | 1 | no | - | [before-back-to-custom-with-invalid.png](before-back-to-custom-with-invalid.png) |
| before | focus-preset-orange |  | zzz | orange | 1 | no | - | [before-focus-preset-orange.png](before-focus-preset-orange.png) |
| before | focus-invalid-abc | abc | zzz | custom + custom style | 1 | no | - | [before-focus-invalid-abc.png](before-focus-invalid-abc.png) |
| before | focus-valid-aa5500 | #aa5500 | zzz | custom + custom style | 1 | no | - | [before-focus-valid-aa5500.png](before-focus-valid-aa5500.png) |
| before | server-submit-invalid |  | zzzzzz | default | 1 | no | - | [before-server-submit-invalid.png](before-server-submit-invalid.png) |
| after | initial |  | #015efe | default | 5.21 | no | - | [after-initial.png](after-initial.png) |
| after | custom-selected |  | #015efe | default | 5.21 | no | - | [after-custom-selected.png](after-custom-selected.png) |
| after | accent-invalid-777777 | 777777 | #015efe | default | 5.21 | yes | Not a valid hex color. The previous color is still in use. | [after-accent-invalid-777777.png](after-accent-invalid-777777.png) |
| after | accent-invalid-zzzzzz | #zzzzzz | #015efe | default | 5.21 | yes | Not a valid hex color. The previous color is still in use. | [after-accent-invalid-zzzzzz.png](after-accent-invalid-zzzzzz.png) |
| after | accent-valid | #336699 | #336699 | default | 6 | no | - | [after-accent-valid.png](after-accent-valid.png) |
| after | preset-red |  | #d8002f | default | 5.3 | yes | Not a valid hex color. The previous color is still in use. | [after-preset-red.png](after-preset-red.png) |
| after | back-to-custom-with-invalid |  | #d8002f | default | 5.3 | yes | Not a valid hex color. The previous color is still in use. | [after-back-to-custom-with-invalid.png](after-back-to-custom-with-invalid.png) |
| after | focus-preset-orange |  | #d8002f | orange | 5.3 | yes | Not a valid hex color. The previous color is still in use. | [after-focus-preset-orange.png](after-focus-preset-orange.png) |
| after | focus-invalid-abc | abc | #d8002f | orange | 5.3 | yes | Not a valid hex color. The previous color is still in use.; Not a valid hex color. The pre | [after-focus-invalid-abc.png](after-focus-invalid-abc.png) |
| after | focus-valid-aa5500 | #aa5500 | #d8002f | custom + custom style | 5.3 | yes | Not a valid hex color. The previous color is still in use. | [after-focus-valid-aa5500.png](after-focus-valid-aa5500.png) |
| after | server-submit-invalid |  | #015efe | default | 5.21 | no | Error message The custom accent color is not a valid hex color. Use six digits, for exampl | [after-server-submit-invalid.png](after-server-submit-invalid.png) |

## Checks

- **before**: invalidAccentNotApplied: false; invalidAccentTextKeptForEditing: true; invalidAccentMessageAnnounced: false; saveButtonReadableWhileInvalid: false; validAccentApplied: true; errorClearedWhenCorrected: true; pickerFollowsTextField: true; presetStillApplies: true; customWithInvalidKeepsLastValidColor: false; invalidFocusNotApplied: false; invalidFocusMessageShown: false; focusIndicatorStaysVisible: false; validFocusApplied: true; serverRejectsInvalid: false; invalidValueNotStored: false
- **after**: invalidAccentNotApplied: true; invalidAccentTextKeptForEditing: true; invalidAccentMessageAnnounced: true; saveButtonReadableWhileInvalid: true; validAccentApplied: true; errorClearedWhenCorrected: true; pickerFollowsTextField: true; presetStillApplies: true; customWithInvalidKeepsLastValidColor: true; invalidFocusNotApplied: true; invalidFocusMessageShown: true; focusIndicatorStaysVisible: true; validFocusApplied: true; serverRejectsInvalid: true; invalidValueNotStored: true

## axe-core (WCAG 2.2 A/AA tags; Before → After violation counts)

- axeInvalid: 0 → 0
- axeAfterServerError: 0 → 0

## Context

| | Before | After |
|---|---|---|
| Core commit | `92e5c3a304 2026-11-18` | `92e5c3a304 2026-11-18` |
| Drupal, PHP | 12.0-dev, 8.5.12 | 12.0-dev, 8.5.12 |
| Profile; default / admin theme (config) | standard; default_admin / default_admin | standard; default_admin / default_admin |
| Theme that rendered each page | blank → null<br>/user/1/edit → default_admin<br>/admin/appearance/settings/default_admin → null<br>/admin/appearance/settings/default_admin → default_admin | blank → null<br>/user/1/edit → default_admin<br>/admin/appearance/settings/default_admin → null<br>/admin/appearance/settings/default_admin → default_admin |
| Languages (default) | none (en) | none (en) |
| Modules only on this side | none | none |
| Enabled modules | 39 | 39 |

