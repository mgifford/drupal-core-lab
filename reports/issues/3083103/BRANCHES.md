# Branch patches for #3083103

Extracted 2026-10-01 from the drupal.org issue fork(s) with
`git diff <merge-base with upstream main> <branch tip>`: only the branch's own
changes, **not rebased** onto current `main`. Re-check against the issue before
use: the MR on drupal.org is the source of truth. Apply to a core worktree with
`git apply branches/<file>.patch` (may need a reroll if the base is old).

| Patch | Source | Tip | Base | Tip date | Files | Commits |
|---|---|---|---|---|---|---|
| `branches/3083103-improve-error-accessibility.patch` | issue-fork f3083103: drupal-3083103 | ed60e948ec1 | c6836648996 | 2026-05-07 | 15 | 33 |
| `branches/3083103-programmatically-associate-error.patch` | issue-fork drupal-3083103 | 0fddb21c553 | 9f2ee8352d4 | 2026-03-24 | 5 | 11 |
| `branches/3083103-programmatically-associate-error-11.patch` | issue-fork drupal-3083103 | 32d4ece4454 | 496796e0a3e | 2026-04-15 | 9 | 26 |
