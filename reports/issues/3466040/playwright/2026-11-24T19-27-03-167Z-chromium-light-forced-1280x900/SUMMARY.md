# Playwright evidence: #3466040 (3466040-latest)

DRAFT. chromium 159.0.8154.6, light scheme, 1280x900. Real pointer input opened and expanded the dialog, then one Tab press moved focus to the dialog action.

| Type | Check | Before | After | Result |
|---|---|---|---|---|
| precondition | The lab dialog opens on both sides | true | true | as expected |
| fix | Before changes the requested height to auto | "auto" | 450 | as expected |
| fix | After keeps a 50% pixel height | "auto" | 450 | as expected |
| fix | Expanded action pane and Save fit After | false | true | as expected |
| fix | Expanded content scrolls After | 2024 | 2024 | as expected |
| regression | One Tab reaches a visible Save After | false | true | as expected |
| regression | No JavaScript errors | 0 | 0 | as expected |
| regression | axe violation elements do not increase | 0 | 0 | as expected |

Expanded screenshots are saved beside this report. The test-support dialog is installed identically on both sides by the issue recipe.

## Context

| | Before | After |
|---|---|---|
| Core commit | `97c6ff8b25 2026-11-23` | `97c6ff8b25 2026-11-23` |
| Drupal, PHP | 12.0-dev, 8.5.13 | 12.0-dev, 8.5.13 |
| Profile; default / admin theme (config) | standard; default_admin / default_admin | standard; default_admin / default_admin |
| Theme that rendered each page | /user/1/edit → default_admin<br>/lab/dialog-3466040 → default_admin | /user/1/edit → default_admin<br>/lab/dialog-3466040 → default_admin |
| Languages (default) | none (en) | none (en) |
| Modules only on this side | none | none |
| Enabled modules | 40 | 40 |


This run does not replace a person testing keyboard navigation or a screen reader.
