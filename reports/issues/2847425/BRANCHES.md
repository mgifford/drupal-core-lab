# Branch patches for #2847425

Extracted 2026-10-01 from the drupal.org issue fork(s) with
`git diff <merge-base with upstream main> <branch tip>`: only the branch's own
changes, **not rebased** onto current `main`. Re-check against the issue before
use: the MR on drupal.org is the source of truth. Apply to a core worktree with
`git apply branches/<file>.patch` (may need a reroll if the base is old).

| Patch | Source | Tip | Base | Tip date | Files | Commits |
|---|---|---|---|---|---|---|
| `branches/mr-7305.patch` | local branch mr-7305 (MR !7305), not on the issue fork | 71b1ad1d814 | cd459461153 | 2026-08-24 | 7 | 19 |
