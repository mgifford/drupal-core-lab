# Working in a shared checkout (workspace hygiene)

Status: general guidance for future work, written 2026-11-27 during #3566687. It is a plan, not an instruction to
clean anything now. Nothing in this document should be executed destructively without the owner present.

## Check in with the other sessions through files

There is no cross-session messaging: `list_agents` shows only your own agent tree, the team board is per root, and
`send_message` rejects a session id that is not one of your subagents. Coordination therefore happens as files in
`reports/infrastructure/`:

- `COORDINATION-<date>-<topic>.md` — what a session changed, what it needs, what not to touch. Read the newest ones
  before committing, restarting a shared tool, or stopping an environment.
- `COMMIT-REQUESTS-<date>-<topic>.md` — path-scoped `git add` lists for whoever owns the commit.
- `session-inventory-<date>.json` — the sessions seen in the transcript store (it is not an ownership map).

A session that changes shared tooling (`.mcp.json`, `tools/playwright/`, `lab.config.yml`, `scripts/selftest.mjs`,
`AGENTS.md`, `docs/`) should leave a note before it stops. Writing a note is not delivery: another session only sees it
when it looks, so repeat the pointer in the final message to the owner.

## What happens here

Several agent sessions can share one working directory (`/Users/mgifford/drupal-core-lab`) at the same time.
They share the git checkout, the `envs/` DDEV worktrees, the DDEV router, Mutagen, Docker and the disk. Only the
agent tree is separate: `list_agents` showing one agent does **not** mean one session.

On 2026-11-27, while #3566687 was being evaluated, five other issues (#3083103, #3545814, #3636987, #3534229,
#3466040) were also writing to the tree. The checkout was on branch `3083103-error-association-evaluation` with:

- **2,183 uncommitted paths** (`git status --porcelain -uall | wc -l`), including 6 deleted paths from another
  session's in-progress refactor;
- tooling that existed in one worktree but not another (for example `scripts/preflight.mjs` exists in
  `/private/tmp/preflight-main` but not in this checkout);
- several `envs/` comparison pairs and per-issue worktrees registered in `envs/core.git`;
- generated files (`reports/issues/README.md`, `COVERAGE.md`, status snapshots) that more than one session
  rewrites.

This is not a bug in one script. It is the consequence of a single shared checkout plus concurrent writes.

## Never run these in the shared checkout

These commands affect other sessions' uncommitted work, not only yours:

- `git reset --hard`, `git checkout -- .`, `git restore .`, `git checkout .`
- `git clean -fd`, `git clean -fdx`, `git worktree prune` (without checking every worktree first)
- `git stash` / `git stash pop` (the stash is shared and holds every session's changes)
- deleting or moving `envs/`, `reports/issues/*`, `recipes/*`, `patches/`, `tools/`, `scripts/` entries you did
  not create
- `docker system prune`, `docker volume prune`, `docker image prune -a`, `ddev delete` on another session's
  project, or `rm -rf` on shared `/tmp` directories
- changing the branch with `git switch`/`git checkout <branch>` while another session is building — it changes
  the whole tree under it.

The safe rule: **if a command's effect is not limited to paths you created in this session, do not run it.**

## Safe operations

Read-only triage (all safe):

```bash
git branch --show-current
git status --porcelain -uall | wc -l
git status --short reports/issues/<nid> recipes/repro_<nid> tools/compare/variants.json
git worktree list
git --git-dir=envs/core.git worktree list
pgrep -fl "setup.mjs|ddev start|ddev restart"
node scripts/lab-env.mjs status
```

Write operations that stay inside your scope:

- `git add <explicit paths>` only. Never `git add -A`, `git commit -a` or `close-out --commit` without checking
  the branch (see below).
- Create your own branch before committing; do not commit onto a branch another session is using.
- `node scripts/lab-env.mjs stop <your-slug>` only.
- `node scripts/patch-change.mjs record <patch>` when you change a patch file.
- `node scripts/close-out.mjs <nid>` **without** `--commit` is a safe report. With `--commit` it stages every
  path matching "this issue" and commits them to the **current branch**, with a hard-coded AI co-author trailer.
  Check `git branch --show-current` and decide the branch and disclosure line yourself.

## How to tell what belongs to whom

There is no ownership metadata in git. Use paths and report folders:

| Path | Likely owner |
|---|---|
| `reports/issues/<nid>/`, `recipes/repro_<nid>/`, `branches/<nid>-*` | the session that worked on issue `<nid>` |
| `tools/compare/variants.json` | shared: every issue adds entries; edit only your own and never rewrite the file wholesale |
| `reports/issues/README.md`, `reports/issues/FOCUS.md`, `status.json` | generated; regenerate, do not hand-merge |
| `AI-LEARNING.md`, `AGENTS.md`, `docs/` | shared documentation; append or make a small targeted edit |
| `envs/*`, `envs/core.git`, `.lab-browser/`, `.lab-cache/` | shared infrastructure; git-ignored; coordinate before removing |
| deleted paths (`D` in `git status`) | another session's deliberate refactor; do not restore them |

Generated indexes can also fail because of another session's half-written state. Example from 2026-11-27:
`reports/issues/3603162/status.json` has an `mr` object without `sha`, which breaks
`tools/compare/issue-tracking.mjs` and therefore `scripts/index-issues.mjs`. Report it to the owner of that issue;
do not edit their status file to make your index run.

## The 2,183-path backlog: a future triage plan

Not now. When the owner schedules it, use this order:

1. **Freeze writes.** Ask every session to stop. Snapshot the state before touching it:
   `git status --porcelain -uall -z > /tmp/workspace-snapshot.txt` and `git diff --stat > /tmp/workspace-diffstat.txt`.
   Keep both outside the repository; they are evidence of the starting point.
2. **Group, do not judge paths one by one.** Group by issue folder (`reports/issues/<nid>`, `recipes/repro_<nid>`,
   `branches/<nid>-*`), then by shared file. Each group gets one owner decision: keep and commit, regenerate, or
   deliberately discard.
3. **Keep evidence.** `reports/issues/*` is the durable product. It is almost never right to delete a report
   folder; a stale status or generated index can be regenerated instead.
4. **Commit per group on a branch, never in one sweep.** Create a branch (for example
   `workspace-recovery-2026-12`), commit each issue group separately with its own message and AI disclosure, and
   record the inventory in the pull request. A single mixed commit makes review and revert impossible.
5. **Regenerate generated files last.** After all groups are committed, run `node scripts/index-issues.mjs`,
   `node scripts/coverage.mjs --all`-style refreshes and the status refresh. Fix the malformed source (such as
   `status.json`) first; do not patch the generated output.
6. **Deletions need intent.** For each `D` path, ask the session that deleted it whether it is part of a refactor.
   Restoring it blindly can break that work; discarding it blindly loses history.
7. **Then clean infrastructure separately.** Old environments and Docker images are a separate decision with
   `node scripts/lab-env.mjs status|delete|trim <slug>`; never `docker system prune` while any session is
   building. Record disk before and after.

A decision table to keep beside the inventory:

| Path class | Action |
|---|---|
| `reports/issues/<nid>/**` | keep; commit under an issue branch; never delete |
| `recipes/repro_<nid>/**`, `branches/<nid>-*.patch` | keep and commit; a changed patch needs `patch-change.mjs record` |
| `tools/compare/variants.json` | merge entries deliberately; do not rewrite |
| `reports/issues/README.md`, `COVERAGE.md`, `status.json` | regenerate after the source data is settled |
| `AI-LEARNING.md`, `AGENTS.md`, `docs/**` | keep; owner reviews |
| deleted tracked files | confirm intent with the deleting session first |
| `envs/**`, `.lab-cache/**`, `.lab-browser/**` | infrastructure, not evidence; coordinate removal |
| untracked files with no issue or doc reference | debris candidate; list it, do not delete it yet |

## Durable fix to consider

The durable fix is **one git worktree and one branch per session** (for example
`git worktree add ../lab-<session> -b <session>-work`), so sessions no longer share a working tree. It also
reduces DDEV contention because each session can point at its own `envs/` checkout. Until that exists, serialise
sessions, or at least make every session declare the paths it will write before it starts.

Related lessons: `AI-LEARNING.md` ("2026-11-26: shared-machine builds", "2026-11-27: #3566687 ... concurrency
tax"); the DSH workspace sandbox and DDEV global state need the one-shot wider permission for builds.
`docs/ENVIRONMENTS.md` covers environment lifecycle; `docs/PITFALLS.md` covers the router/Mutagen errors.

## Per-session scope and staging index

A scope claim is advisory and local. It records what this session intends to touch; it does not lock files and it never
stages, reverts, stashes or deletes anything.

```bash
node scripts/agent-scope.mjs start --issue 3466040 \
  --path reports/issues/3466040 --path reports/infrastructure
node scripts/agent-scope.mjs check          # names changed paths outside the claim
node scripts/agent-scope.mjs show
node scripts/agent-scope.mjs clear
```

`check` reports the outside paths and exits 1; it is a review aid, not a hook. Use `git status --porcelain` yourself
before a commit and stage only paths you created.

For a long-running session that must have its own staging index:

```bash
node scripts/agent-scope.mjs index
# prints: GIT_INDEX_FILE=/.../.lab-cache/agent-indexes/<session>.index
GIT_INDEX_FILE=/.../<session>.index git add -- reports/issues/3466040
GIT_INDEX_FILE=/.../<session>.index git commit -m "..."
```

The per-session index is local and is not a branch. It does not isolate the working tree, and it does not replace the
rule against `git add -A` in a shared checkout.

## Machine-global environment leases

Environment leases moved out of the checkout: the canonical file is
`~/.dsh/lab-coordination/lab-env-leases.json` (override with `LAB_LEASE_FILE`). A legacy
`.lab-cache/lab-env-leases.json` is copied there once when the first command runs, so an in-flight session does not lose
its lease during the change. Start/stop environments through `lab-env.mjs start|stop`; a lease created in one clone is
now visible to every other clone on the same machine.
