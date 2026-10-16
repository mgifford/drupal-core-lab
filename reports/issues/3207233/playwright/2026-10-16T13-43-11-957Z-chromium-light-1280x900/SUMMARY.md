# DRAFT: #3207233 local replay

Run 2026-10-16T13:43:13.482Z. Variant: 3207233-pinned.

| Type | Check | Result |
|---|---|---|
| precondition | 0: Before has the requested active row | as expected |
| fix | 0: After has explicit active text and emphasis | as expected |
| fix | 0: caption identifies the workspace | as expected |
| regression | 0: available switch operations match | as expected |
| regression | 0: no newly detected serious or critical axe findings | as expected |
| precondition | 1: Before has the requested active row | as expected |
| fix | 1: After has explicit active text and emphasis | as expected |
| fix | 1: caption identifies the workspace | as expected |
| regression | 1: available switch operations match | as expected |
| fix | 1: active link includes the state | as expected |
| regression | 1: no newly detected serious or critical axe findings | as expected |
| precondition | 2: Before has the requested active row | as expected |
| fix | 2: After has explicit active text and emphasis | as expected |
| fix | 2: caption identifies the workspace | as expected |
| regression | 2: available switch operations match | as expected |
| fix | 2: active link includes the state | as expected |
| regression | Nested indentation remains on both sides | as expected |
| regression | 2: no newly detected serious or critical axe findings | as expected |
| precondition | 3: Before has the requested active row | as expected |
| fix | 3: After has explicit active text and emphasis | as expected |
| fix | 3: caption identifies the workspace | as expected |
| regression | 3: available switch operations match | as expected |
| fix | 3: active link includes the state | as expected |
| regression | Markup-like label remains literal on both sides | as expected |
| regression | 3: no newly detected serious or critical axe findings | as expected |
| precondition | 4: Before has the requested active row | as expected |
| fix | 4: After has explicit active text and emphasis | as expected |
| fix | 4: caption identifies the workspace | as expected |
| regression | 4: available switch operations match | as expected |
| regression | 4: no newly detected serious or critical axe findings | as expected |
| regression | Active link reached through real Tab presses on both sides | as expected |
| fix | Tabbed active link includes the state After | as expected |
| regression | No uncaught JavaScript errors | as expected |

## Context

| | Before | After |
|---|---|---|
| Core commit | `ca18edacfe 2026-10-16` | `ca18edacfe 2026-10-16` |
| Drupal, PHP | 12.0-dev, 8.5.8 | 12.0-dev, 8.5.8 |
| Profile; default / admin theme (config) | standard; default_admin / default_admin | standard; default_admin / default_admin |
| Theme that rendered each page | /user/1/edit → default_admin<br>/admin/config/workflow/workspaces → default_admin<br>/admin/config/workflow/workspaces/manage/lab3207233_stage/activate → null<br>/admin/config/workflow/workspaces/manage/lab3207233_child/activate → default_admin<br>/admin/config/workflow/workspaces/manage/lab3207233_literal/activate → default_admin<br>/admin/config/workflow/workspaces/switch-to-live → default_admin | /user/1/edit → default_admin<br>/admin/config/workflow/workspaces → default_admin<br>/admin/config/workflow/workspaces/manage/lab3207233_stage/activate → default_admin<br>/admin/config/workflow/workspaces/manage/lab3207233_child/activate → default_admin<br>/admin/config/workflow/workspaces/manage/lab3207233_literal/activate → default_admin<br>/admin/config/workflow/workspaces/switch-to-live → default_admin |
| Languages (default) | none (en) | none (en) |
| Modules only on this side | none | none |
| Enabled modules | 41 | 41 |

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

## Limits

Keyboard activation uses real Enter presses. The named active link is also reached using real Tab presses. Visual focus quality still needs a person. Guidepup uses a jsdom snapshot and does not establish actual VoiceOver or NVDA behavior. Axe covers a subset of accessibility requirements and reports at most ten nodes per rule here. Tests use administrator access and four fixtures, not pagination, translated labels, or a read-only account. The off-canvas switcher is a manual regression check.

ARIA snapshots, simulated speech, axe findings, commits, patch hashes, and site context are in results.json. Screenshots are beside this summary. A passing run applies only to the listing changes tested here.
