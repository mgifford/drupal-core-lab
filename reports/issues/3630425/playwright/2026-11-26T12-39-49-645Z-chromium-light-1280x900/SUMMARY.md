# #3630425 evaluation

DRAFT: reproduced-and-fixed. Theme: Default Admin. Explicit axe rule: empty-table-header. No Article was saved. Header DOM, aria snapshots and screenshots accompany this report.

| Side | Stage | Actions header | Rule failures | Rows | Remove controls |
|---|---|---|---|---|---|
| before | initial | (empty) | 1 | 3 | 3 |
| before | add | (empty) | 1 | 4 | 4 |
| before | remove | (empty) | 1 | 3 | 3 |
| after | initial | Operations | 0 | 3 | 3 |
| after | add | Operations | 0 | 4 | 4 |
| after | remove | Operations | 0 | 3 | 3 |

## Context

| | Before | After |
|---|---|---|
| Core commit | `dbfce851242 2026-10-16` | `dbfce851242 2026-10-16` |
| Drupal, PHP | 12.0-dev, 8.5.7 | 12.0-dev, 8.5.7 |
| Profile; default / admin theme (config) | standard; default_admin / default_admin | standard; default_admin / default_admin |
| Theme that rendered each page | /user/1/edit → default_admin<br>/node/add/article → default_admin | /user/1/edit → default_admin<br>/node/add/article → default_admin |
| Languages (default) | none (en) | none (en) |
| Modules only on this side | none | none |
| Enabled modules | 39 | 39 |


Keyboard focus and screen-reader announcement quality require human review.
