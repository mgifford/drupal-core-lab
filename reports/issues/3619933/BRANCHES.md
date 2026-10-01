# Branch patches for #3619933

Extracted 2026-10-01 from the drupal.org issue fork(s) with
`git diff <merge-base with upstream main> <branch tip>`: only the branch's own
changes, **not rebased** onto current `main`. Re-check against the issue before
use: the MR on drupal.org is the source of truth. Apply to a core worktree with
`git apply branches/<file>.patch` (may need a reroll if the base is old).

| Patch | Source | Tip | Base | Tip date | Files | Commits |
|---|---|---|---|---|---|---|
| `branches/3619933-drupal-admin-theme.patch` | issue-fork drupal-3619933 | 63ea50be7c0 | f2d23228fad | 2026-09-01 | 25 | 19 |
| `branches/3619933-drupal-admin-theme-local.patch` | issue-fork drupal-3619933 | a428a2e9f1b | 141cdc1f0a3 | 2026-09-01 | 22 | 12 |
