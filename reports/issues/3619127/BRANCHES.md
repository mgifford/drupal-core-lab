# Branch patches for #3619127

Extracted 2026-10-01 from the drupal.org issue fork(s) with
`git diff <merge-base with upstream main> <branch tip>`: only the branch's own
changes, **not rebased** onto current `main`. Re-check against the issue before
use: the MR on drupal.org is the source of truth. Apply to a core worktree with
`git apply branches/<file>.patch` (may need a reroll if the base is old).

| Patch | Source | Tip | Base | Tip date | Files | Commits |
|---|---|---|---|---|---|---|
| `branches/3619127-forms-sidebar-with-ife.patch` | issue-fork drupal-3619127 (MR !16895) | cdff6661a39 | 30fe89a1379 | 2026-09-05 | 3 | 13 |
