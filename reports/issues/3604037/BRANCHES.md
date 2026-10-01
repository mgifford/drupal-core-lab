# Branch patches for #3604037

Extracted 2026-10-01 from the drupal.org issue fork(s) with
`git diff <merge-base with upstream main> <branch tip>`: only the branch's own
changes, **not rebased** onto current `main`. Re-check against the issue before
use: the MR on drupal.org is the source of truth. Apply to a core worktree with
`git apply branches/<file>.patch` (may need a reroll if the base is old).

| Patch | Source | Tip | Base | Tip date | Files | Commits |
|---|---|---|---|---|---|---|
| `branches/3604037-grouping-elements-child-errors-default-admin.patch` | issue-fork drupal-3604037 (MR !17078) | e8b2e166be8 | c321043bb82 | 2026-09-30 | 18 | 25 |
