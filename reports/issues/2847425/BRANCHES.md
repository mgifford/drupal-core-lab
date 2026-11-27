# Branch patches for #2847425

Apply to a core worktree with `git apply branches/<file>.patch`. Every patch below was checked against the tree it
declares. The complete patch is the proposal; the interdiff is the change from the current MR tip.

## Current patches (2026-11-26/27)

| Patch | Source | Tip | Base | Tip date | Files | Insertions / deletions |
|---|---|---|---|---|---|---|
| `branches/mr-7305-7362966.patch` | issue fork `drupal-2847425`, branch `11.x` (MR !7305) | 7362966e154 | 0387fb948f (the merge base) | 2026-11-25 | 7 | +196 / -2 |
| `branches/2847425-fixture-before.patch` | Lab test support, applied to **Before only** | n/a | 0387fb948f | 2026-11-26 | 3 new files | +264 |
| `branches/2847425-complete.patch` | **Final proposal**: MR + fixture + refinement + tests, against the pinned baseline. sha256 `efe98ef3214d31c98e8447aa2e6b1efa4077f4b8e18ab79ea7aba11c45a5c576` | n/a | 0387fb948f | 2026-11-27 | 6 | +696 / -1 |
| `branches/2847425-interdiff.patch` | **Final interdiff** against the MR tip. sha256 `a07ab00081be8ace9a8c4e5df9a3178228d914feb1072c7b55c2ee891119722f` | n/a | 7362966e15 | 2026-11-27 | 5 | +556 / -55 |
| `branches/2847425-fixture-extend.patch` | Intermediate: extended the MR's fixture on After. Superseded by `2847425-complete.patch`; kept for provenance | n/a | 7362966e15 | 2026-11-26 | 1 | +222 / -58 |
| `branches/2847425-refinements.patch` | Intermediate: implementation refinement captured before the final test revision. Superseded; kept for provenance | n/a | 0387fb948f | 2026-11-26 | 4 | see file |

Provenance of the contributions the MR keeps:

- Andrii Sakhaniuk's earlier implementation `677d292bbe` is an ancestor of the current tip (verified with
  `git merge-base --is-ancestor`).
- Alex Urevick-Ackelsberg's corrective commit `6e43afa25a` is an ancestor of the current tip (same check). Its two
  corrections (no states on the AJAX wrapper; no `#id` reassignment) are retained unchanged in this evaluation.
- The fixture patches carry **no implementation change**. They are the same form on both sides so the Before and
  After pages are comparable; they are listed in the variant's `before.patches` / `after.patches` and are described
  in [REPRODUCE.md](REPRODUCE.md).

### Current lab stack, in order

Before: `2847425-fixture-before.patch` on 0387fb948f.

After: `2847425-complete.patch` on 0387fb948f (the same baseline; the patch contains the MR, the fixture, the
refinement and the tests).

The complete patch does not touch `FormTest.php`: the MR's `44 → 45` change is dropped. The interdiff shows that
revert, because it is a diff against the MR tip.

```sh
GIT_INDEX_FILE=/tmp/i git --git-dir=envs/core.git read-tree 0387fb948f
GIT_INDEX_FILE=/tmp/i git --git-dir=envs/core.git apply --cached --check reports/issues/2847425/branches/2847425-complete.patch
GIT_INDEX_FILE=/tmp/j git --git-dir=envs/core.git read-tree 7362966e15
GIT_INDEX_FILE=/tmp/j git --git-dir=envs/core.git apply --cached --check reports/issues/2847425/branches/2847425-interdiff.patch
```

## Historical (2026-10-01)

Extracted from the drupal.org issue fork with `git diff <merge-base with upstream main> <branch tip>`: only the
branch's own changes, **not rebased** onto current `main`.

| Patch | Source | Tip | Base | Tip date | Files | Commits |
|---|---|---|---|---|---|---|
| `branches/mr-7305.patch` | local branch mr-7305 (MR !7305), not on the issue fork | 71b1ad1d814 | cd459461153 | 2026-08-24 | 7 | 19 |

This row is kept as historical evidence. It predates alex ua's corrective commit
`6e43afa25a8a3b71e92fc7d61ce595380310af70` (2026-09-16), which removed the states from the AJAX replacement
wrapper and the reassignment of the managed-file element ID. Do not use it to judge the current MR.

Fetched again on 2026-11-26, because the refs listed in the task (`refs/review/2847425/current` and
`refs/review/2847425/legacy`) did not exist in `envs/core.git`; `refs/review/2847425/current` now points at the
MR's `11.x` branch tip. Nothing was force-pushed or changed on drupal.org.
