# Playwright evidence: #3627936 (3627936-latest)

Run 2026-10-15T19:55:28.708Z. Core Before `ad11ba71c 2026-10-15`, After `ad11ba71c 2026-10-15` plus `3627936-active-workspace-dark-mode.patch`. chromium 156.0.8078.4, dark scheme, forced colours, 1280x900.

| Type | Check | Before | After | Result |
|---|---|---|---|---|
| context | Admin theme (drupalSettings) | default_admin | default_admin | recorded |
| context | Colour scheme the browser reports | {"prefersDark":true,"forced":true,"htmlColorScheme":"light dark"} | {"prefersDark":true,"forced":true,"htmlColorScheme":"light dark"} | recorded |
| precondition | Stage is the active workspace (a tr.active-workspace row exists) | yes | yes | as expected |
| precondition | A row that is not active exists to compare with | yes | yes | as expected |
| fix | Active row background, effective | rgb(0, 0, 0, 1) | rgb(0, 0, 0, 1) | as expected |
| fix | Contrast of the active row text on its background (SC 1.4.3, needs 4.5:1) | 21:1 | 21:1 | as expected |
| observe | Contrast of the active link text on its background | 19.56:1 | 19.56:1 | recorded |
| observe | Contrast of the active row against a row that is not active (what colour alone shows; SC 1.4.11 asks 3:1 of a state indicator) | 1:1 | 1:1 | recorded |
| observe | Anything other than colour that marks the active row | nothing found | nothing found | recorded |
| observe | Active row on hover: text contrast | 21:1 | 21:1 | recorded |
| regression | Text contrast of the row that is not active | 21:1 | 21:1 | as expected |
| regression | axe violations (elements) | 2 | 2 | as expected |
| regression | JavaScript errors | 0 | 0 | as expected |

## Rows

Before: odd: Live Switch to Live | even: QA review admin Switch to QA reviewList additional actions Manage Edit Publish content Del | active-workspace active-workspace--not-default odd: Stage admin Publish contentList additional actions Manage Edit Delete View

After: odd: Live Switch to Live | even: QA review admin Switch to QA reviewList additional actions Manage Edit Publish content Del | active-workspace active-workspace--not-default odd: Stage admin Publish contentList additional actions Manage Edit Delete View

Screenshots: `before-overview.png`, `after-overview.png`.

## Context

| | Before | After |
|---|---|---|
| Core commit | `ad11ba71c 2026-10-15` | `ad11ba71c 2026-10-15` |
| Drupal, PHP | 12.0-dev, 8.5.7 | 12.0-dev, 8.5.7 |
| Profile; default / admin theme (config) | standard; default_admin / default_admin | standard; default_admin / default_admin |
| Theme that rendered each page | /user/1/edit → default_admin<br>/admin/config/workflow/workspaces/manage/stage/activate → null<br>/admin/config/workflow/workspaces → default_admin | /user/1/edit → default_admin<br>/admin/config/workflow/workspaces/manage/stage/activate → null<br>/admin/config/workflow/workspaces → default_admin |
| Languages (default) | none (en) | none (en) |
| Modules only on this side | none | none |
| Enabled modules | 41 | 41 |

axe rules: Before {"color-contrast":2}, After {"color-contrast":2}.

Light scheme: recorded to show what must not change.

---
Automated evidence is a DRAFT: colours are computed from the browser's styles, not seen by a person, and a screen reader and a keyboard pass are not covered (this page has no new interaction).
