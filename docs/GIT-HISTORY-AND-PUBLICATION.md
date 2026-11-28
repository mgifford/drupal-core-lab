# Git history and publication readiness

The shared `envs/core.git` is a **shallow** clone. That is deliberate: a full Drupal history is far larger than the
lab needs for a Before/After evaluation. The same repository serves every issue, worktree and DDEV environment on the
machine. This document explains when shallow history is enough and when it is not.

## Readiness is task-specific

| Task | What is needed | Shallow is |
|---|---|---|
| Evaluation | The pinned core commit, its tree and the files the recipe reads | Usually fine |
| Patch development | A worktree, the base commit, patch application and commits | Usually fine |
| History analysis | The ancestry the requested operation actually traverses | Maybe not |
| Publication | The source commit, its relevant ancestry and the destination ref | Depends; check before pushing |

A shallow repository is **not** a warning for ordinary evaluation. It is only a limitation when the operation needs
ancestry that the local shallow boundary cuts off.

## The four states

- **READY** — local preconditions are satisfied for the requested operation.
- **CONDITIONAL** — the local check is satisfied, but remote permission or policy is unverified.
- **NEEDS HISTORY / NEEDS OBJECTS** — the required commits are missing locally.
- **BLOCKED** — a known condition prevents the operation.

`prepare-push` uses the concrete labels `ok`, `WARN`, `NEED` and `STOP`; `NEED` is always “unknown, not a failure”.

## Before publishing

```bash
node scripts/prepare-push.mjs 3636987
node scripts/prepare-push.mjs 3636987 --repo "$HOME/drupal-3636987-fix" --local HEAD --source-branch 3636987-forced-colors-select
```

This is read-only. It prints:

- the local commit and its subject;
- the recorded MR/fork branch and the live fork tip;
- whether the commit is already published, would fast-forward, would create a branch, or is diverged;
- whether someone else pushed after the recorded tip;
- the merge base with core `main` (or “unknown” at a shallow boundary);
- upstream changes to the files the patch touches;
- uncommitted changes and untracked test fixtures that would not be pushed;
- whether the patch equals the local commit;
- the minimum bounded history fetch, if one is needed.

It never pushes. The push command it prints is for a person to run after explicitly authorising publication.

## Bounded history retrieval

Only run this when the report says `NEED`:

```bash
node scripts/prepare-push.mjs 3636987 --fetch
```

The plan:

- fetches only named refs into `refs/lab/prepare-push/<nid>/*`;
- uses `--deepen=<n>` for a tip that is already present;
- uses `--shallow-since=<day>` for a new tip, never later than the day before the oldest commit any ref or worktree
  already reaches;
- never uses `--depth` or `--unshallow`;
- never fetches all tags;
- re-runs the readiness check after fetching and stops when sufficient.

A Git deep fetch moves the shallow boundary of **every** ref passing through that history. That is why the date is
chosen conservatively: a later date can cut another issue's history. Two agents must not deepen the same shared
repository at once.

## Shared Git lock

`prepare-push --fetch` takes a short, machine-global lock keyed by the canonical `git-common-dir`, stored under
`~/.dsh/lab-coordination/git-locks/`. If a sandbox cannot create that directory, the lock falls back to `envs/core.git/.lab-cache/git-locks/`; it then protects one checkout only. If another live owner holds it, the command prints the owner, operation and age
and exits 3 without fetching. A dead owner is stale and can be replaced; a live owner is never killed. The lock is held
only around the fetch, never around browser tests, PHPUnit or DDEV work.

## Doctor

The default doctor is a fast, offline machine preflight. Publication readiness is explicit:

```bash
node scripts/doctor.mjs --issue 3636987 --purpose publish \
  --worktree "$HOME/drupal-3636987-fix" \
  --branch 3636987-forced-colors-select

node scripts/doctor.mjs --issue 3636987 --purpose publish --repair-history
```

`--repair-history` runs the same bounded fetch as `prepare-push --fetch`; it never pushes or publishes.

## External worktrees

A contribution worktree outside `envs/` can share `envs/core.git`:

```bash
git -C "$HOME/drupal-core-lab/envs/core.git" worktree add "$HOME/drupal-3636987-fix" -b 3636987-forced-colors-select
```

`prepare-push --repo "$HOME/drupal-3636987-fix"` inspects it. The lab does not remove external worktrees and does not
infer the issue number from the directory name.

## When publication fails

Use the report's category, not a reflexive repair:

| Observed message | First response |
|---|---|
| `shallow update not allowed` | Run `prepare-push`; if it says NEED, use its bounded fetch. Never `--unshallow`. |
| `You are not allowed to push` | Stop. Check that the fork belongs to you and you are authenticated; do not download history. |
| `non-fast-forward` | Read the fork branch; integrate the other commits with a merge commit. Never force-push. |
| `cannot lock ref` | Another operation is updating the same ref. Wait; inspect the owner; do not delete refs. |
| `Connection closed`, `SSL_ERROR_SYSCALL`, DNS | Retry once after the network is stable; do not delete or recreate an environment. |
| `No space left on device` | Stop and free regenerable space; see resource preflight. |

A remote may reject a push for permissions, protected branches, hooks or policy even when local ancestry is perfect.
`ls-remote` proves readability, not write access. `--dry-run` proves neither.
