# Branch patches for #3093378

Extracted 2026-10-13 with `git diff <2.x tip> <branch tip>` from the issue fork; only the branch's own changes.
Not rebased. The merge request on drupalcode is the source of truth.

| Patch | Source (fork) | Branch | Tip | Base | Base date and subject | Files |
|---|---|---|---|---|---|---|
| `branches/3093378-use-aria-disclosure.patch` | https://git.drupalcode.org/issue/toolbar-3093378.git | `3093378-use-aria-disclosure` | `d1e97b5` | `871ce78` | 2026-09-30 task: #3624031 Added support for Drupal 12. Fixed: Core no longer has the backbone and underscore libraries. | 6 |

Two commits on the branch, both from Benji Fisher:

| Commit | Date | Subject |
|---|---|---|
| `9fedd6a` | 2026-10-07 | Apply the changes from the core issue |
| `d1e97b5` | 2026-10-08 | Remove JS overrides for Claro |

The base `871ce78` is the tip of the project's `2.x` branch (also tag `2.0.0`). The merge request is
[project/toolbar!6](https://git.drupalcode.org/project/toolbar/-/merge_requests/6) (target `2.x`, state *opened*,
`can_be_merged` as of 2026-10-13).

The patch touches six files: `js/toolbar.menu.js`, `tests/src/Nightwatch/Tests/toolbarTest.js`, and four stylesheets
(`css/toolbar.icons.theme.{css,pcss.css}`, `css/claro/theme/toolbar.icons.theme.{css,pcss.css}`).
