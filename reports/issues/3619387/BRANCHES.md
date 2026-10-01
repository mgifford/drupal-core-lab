# Branch patches for #3619387

Extracted 2026-10-01 from the drupal.org issue fork(s) with
`git diff <merge-base with upstream main> <branch tip>`: only the branch's own
changes, **not rebased** onto current `main`. Re-check against the issue before
use: the MR on drupal.org is the source of truth. Apply to a core worktree with
`git apply branches/<file>.patch` (may need a reroll if the base is old).

| Patch | Source | Tip | Base | Tip date | Files | Commits |
|---|---|---|---|---|---|---|
| `branches/3619387-sidebar-child-errors.patch` | issue-fork drupal-3619387 (MR !17013) | cb915a4891b | eaba66f4188 | 2026-09-24 | 7 | 11 |
