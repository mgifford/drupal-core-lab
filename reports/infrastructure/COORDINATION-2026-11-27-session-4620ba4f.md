# Coordination: #3566687 — a second live workspace already owned it; this session stood down

**From** session `4620ba4f-edc6-465e-a97a-74ecff237b38` (team mode not enabled)
**To** session `37e1c427-110d-4d7e-9c3c-05111f81bd68` (#3566687 owner; team mode enabled) and the lab owner
**When** 2026-11-27T14:20Z (09:20 America/Toronto)
**Status** stood down at the owner's instruction. Nothing built, nothing written to `reports/issues/3566687/`, no variant
registered, no environment created, no push, no post. This note is the only artifact.

## 1. What happened

| Time (UTC) | Event |
|---|---|
| 13:36:54 | This session started. |
| 13:38:49 | Sibling `37e1c427` created `reports/issues/3566687/` and started `node scripts/issue-intake.mjs fetch 3566687`. |
| 13:39 | This session found the sibling in the DSH session store, confirmed it was live, and asked the owner. |
| 13:40 | Owner: "Let the teamwork workspace own it; I stand down." |
| 14:19 | Re-check: sibling still live and writing (`STANDARDS.md` 14 KB at 13:17Z, `BROWSER-MATRIX.md` 29 KB at 14:18Z). |
| 14:20 | This note written in an isolated worktree off `origin/main`; primary working tree untouched. |

The two sessions received the same prompt in the same working directory. The owner chose exactly one owner for the issue,
which is the only decision that makes the shared `envs/`, `tools/compare/variants.json` and
`reports/issues/3566687/` safe to use.

## 2. How the duplicate was detected (reusable)

DSH **team tools do not see a sibling top-level workspace.** In this session `list_agents` and `team_task_list` were both
empty, because `37e1c427` is not a child agent — it is another root session with the same `cwd`. The session store is the
signal:

    ls -d ~/.dsh/sessions/*drupal-core-lab*/
    for d in ~/.dsh/sessions/--Users-mgifford-drupal-core-lab--/*/; do
      zstd -dc "$d/session.v4.jsonl.zstd" 2>/dev/null | grep -qi 3566687 && echo "$d"
    done

That returned two directories: the sibling and this session. Separate self from sibling with the `id` on the first
`"type":"session"` line and the `owner` field on any `job/registered` event. Then judge liveness from the **newest
`time` in the log**, not from `session.lock`: the lock is a zero-byte file whose mtime is creation time, so its presence
proves nothing. The sibling's log grew 98,479 B (13:38Z) → 1,169,957 B (14:19Z).

Team mode is recorded per session as `{"type":"team/mode","data":{"enabled":true}}`. Only `37e1c427` had it.

Cost of the check: about two seconds, before any build.

## 3. Prior art in this lab for #3566687

- No `reports/issues/3566687/` and no row in `reports/issues/README.md` before 13:38Z today; the folder was created by the
  sibling, not by earlier work.
- No slug in `tools/compare/variants.json` (38 entries) relates to tables, header scope, or MRs !14474/!14451/!14473.
- The only older mention is a triage row: [known-issues.json](../known-issues.json) line 4715, nid 3566687,
  "Add scope attributes to table render element header cells for WCAG 1.3.1 compliance", status 13, component
  "theme system", `main`, changed 2026-03-19T14:37:52Z. That is an imported queue snapshot, not lab evidence: no
  reproduction, patch, run or browser result.
- "Teamwork" appears nowhere in the tracked repository; it is a DSH session mode, so a repo grep cannot find it.

I did **not** read the issue, the MR, the standards pages or the sibling's evidence. This note records coordination only;
it is not an assessment of #3566687.

## 4. Environment state observed read-only at 09:16 America/Toronto

- DDEV v1.25.3, Docker running. Four lab environments running plus the shared viewer:
  `baseline-3083103`, `issue-3083103-poc`, `baseline-3545814`, `issue-3545814`, `drupal-compare`.
- `2942404-consolidated`: two applied patches the variant no longer lists (a run stops on this until
  `setup.mjs <slug> --refresh-patches`).
- `3619127-pinned`: baseline `baseline-main` has undeclared tracked changes in Default Admin colour CSS; a run refuses
  until they are reverted.
- Working tree: **199 dirty paths** from at least four issues (#2847425, #3419891, #3545814, #3566687) plus infrastructure
  notes, on branch `3083103-error-association-evaluation`.
- That branch is **6 commits ahead of PR #118's head** (`0cb56f2`): `5a83e9c`, `aaad30f`, `e08529b`, `308a5e8`,
  `813dac0`, `633b0f7`. Pushing the local branch would change that PR; nobody has asked for that, so I did not.
- `origin/main` was `31ac9c1` at 14:15Z.

## 5. Leanings

1. **Check for a live sibling before orientation, not after.** `ls reports/issues/<nid>` plus the two-second session
   grep would have stopped this session before its first `lab-env status` call.
2. **`git status` is not an ownership signal in this repo.** 199 paths from several sessions were uncommitted at once;
   only path-scoped commits are safe.
3. **Retrospective coordination notes are not a claim.** The repo has six `COORDINATION-*.md` files, all written after a
   collision; nothing prevented two sessions from choosing the same issue.
4. **Do not infer ownership from transcript mentions.** The infrastructure note of 2026-11-26 already learned this for
   environments; the same applies to issues.
5. **DDEV names collide by issue slug, not session.** Two sessions on one issue cannot build safely in parallel without a
   naming rule; the cheaper rule is one owner per issue.
6. **The owner's instruction resolved it, not seniority or timing.** The sibling was five seconds ahead by chance.

## 6. Suggested small changes (not implemented)

- `scripts/new-issue.mjs` and `issue-intake.mjs fetch`: refuse with a distinct exit code when
  `reports/issues/<nid>/` already exists and is not a scaffold-only directory, or when a session log active in the last
  ten minutes mentions the nid. Print the session id so the person can choose.
- Have `new-issue.mjs` write `reports/issues/<nid>/OWNER.md` (session id, started, state, lease) as the pre-claim that
  today's notes lack.
- A `doctor.mjs <slug>` line: "another session's log mentions this nid".

## Disclosure

Written by an AI agent (DeepSeek Harness, `deepseek-flash`) at the owner's request, after the owner directed this session
to stand down. No files outside this worktree were modified.
