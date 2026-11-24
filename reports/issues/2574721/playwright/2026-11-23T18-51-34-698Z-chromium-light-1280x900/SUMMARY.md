# Playwright evidence: #2574721 (2574721-latest)

DRAFT. chromium 159.0.8154.6, light scheme, 1280x900. Real pointer and keyboard input was used on the After operations dropbutton. axe-core uses WCAG 2.0-2.2 A/AA tags.

| Type | Check | Before | After | Result |
|---|---|---|---|---|
| precondition | Modules page loaded on both sides | true | true | as expected |
| fix | Dedicated operations cells | 0 | 61 | as expected |
| fix | Visible module operation links on After | 0 | 72 | as expected |
| fix | Description column hidden at this narrow viewport | false | false | as expected |
| fix | Dropbutton remains inside the viewport | null | true | as expected |
| fix | Keyboard reaches the dropbutton toggle | null | "dropbutton__toggle" | as expected |
| fix | Keyboard opens secondary operations | null | true | as expected |
| fix | Tab reaches a secondary action | null | "Help for Announcements" | as expected |
| regression | axe violations (elements) | 0 | 0 | as expected |
| regression | JavaScript errors | 0 | 0 | as expected |

Screenshots: `before-1280x900.png` and `after-1280x900.png`.

## Context

| | Before | After |
|---|---|---|
| Core commit | `97c6ff8b25 2026-11-23` | `97c6ff8b25 2026-11-23` |
| Drupal, PHP | 12.0-dev, 8.5.13 | 12.0-dev, 8.5.13 |
| Profile; default / admin theme (config) | standard; default_admin / default_admin | standard; default_admin / default_admin |
| Theme that rendered each page | /user/1/edit → default_admin<br>/admin/modules → null | /user/1/edit → default_admin<br>/admin/modules → null |
| Languages (default) | none (en) | none (en) |
| Modules only on this side | none | none |
| Enabled modules | 39 | 39 |

CSS build of the After patch stack (core's build:css, separate from accessibility results): **PASS**.


axe rules: Before {}, After {}.

This run does not replace a person using a real screen reader or inspecting focus and forced-colour rendering.
