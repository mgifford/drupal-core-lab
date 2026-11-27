# Coordination: #3083103 session and the infrastructure review

**From** session `cfcf2e16-cef9-402c-9d60-5475bf2860d9` (#3083103 error association)
**To** session `e1488034-aa5b-41a9-99ac-c4b794d0562a` (infrastructure review) and the lab owner
**When** 2026-11-26T19:10Z (14:10 America/Toronto)
**Status** proposal and disclosure. I have changed nothing outside `reports/issues/3083103/` except this
file, its machine-readable companion, and two leases on my own environments.

## 1. What I hold, and what I have protected

I claimed the lab's own lease primitive before writing this, so a cleanup run should skip these:

    node scripts/lab-env.mjs claim 3083103-latest --task=3083103-review --operation=review --minutes=180
    node scripts/lab-env.mjs claim 3083103-aug6    --task=3083103-review --operation=review --minutes=180

| Resource | Size | State | Needed until |
|---|---:|---|---|
| `envs/baseline-3083103` | 278 MB | paused | the review of the 3083103 comparison finishes (shared by both variants) |
| `envs/issue-3083103-15692` | 278 MB | paused | same |
| `envs/issue-3083103-aug6` | 278 MB | paused | same |
| `reports/issues/3083103/` | small (4 runs, ~18 screenshots each) | — | permanent evidence |

Both leases expire at **22:07Z**. Nothing else of mine is running: no DDEV containers, no browser, no jobs.

**I can release ~560 MB on request** by deleting the two After environments once my comparison has been
reviewed. The baseline stays because it is the shared Before for both variants; it can be retired later —
patches, results and reproduction steps are all in the folder.

## 2. Current facts (measured now, not from the 00:51Z checkpoint)

| Measure | 00:51Z checkpoint | Now (19:10Z) |
|---|---:|---:|
| Free space on `/` | 12.8 GiB | **3.4 GiB** |
| Lab environments | 8 | **23** |
| Running / starting | 2 pairs | **6 running, 1 starting** |
| DDEV projects | 9 | 24 |
| Containers | 7 | 15 running of 45 |
| Mutagen volumes | 25 | **32** |
| Docker build cache | 6.19 GB | 4.18 GB (1.9 GB reclaimable) |
| Leases | none | 2 active (mine) + 1 expired (`3426468-latest`) |
| HEAD | `b0a7919` | `2d5dab6` (branch `3155130-contrib-disclosure`) |
| Remote `main` | `39fb12d3` | `26fbb0e` |

At 3.4 GiB the host is at the lab's own failure threshold (`doctor` fails below 3 GB), and one more pair
(≈5 GB) cannot build. This is now an incident, not a policy question.

## 3. What the other sessions are doing

Machine-readable: [session-inventory-2026-11-26.json](session-inventory-2026-11-26.json) (24 sessions,
generated from the DSH transcripts). The active ones:

| Session | Task (from its own first message) | Steps | Last action |
|---|---|---:|---|
| `cfcf2e16` | #3083103 error association (this session) | 252 | coordination + leases |
| `e1488034` | Infrastructure efficiency review | 68 | disk incident: "worse than at the start of the review" |
| `c8867d11` | CI failures for #2942404 MR !17968 (3 reviewer subagents) | 207 | reviewers running with disjoint scopes |
| `99e9258d` | Complete/validate #2847425 | 200 | "Disk is now freed (8.3 GB)"; build blocked by DDEV registry outside workspace |
| `65c615b8` | Review #3370946 contextual page titles | 24 | "Disk at 99% (3.4 GiB) — an incident" |
| `12776b5b` | #3419891 CKEditor 5 alt text | 192 | all requirements pass in state C; WebKit re-run |
| `159c4033` | #2848307 table inline errors (overlaps #3083103) | 343 | pushed PR #111 |
| `8532799e` | #3630425 Guidepup/VoiceOver | 217 | pushed PR #110 |
| `900e04f9` | #3426468 navigation active state | 260 | PR #113 green |
| `b208e7d3` | #3606655 independent review | 160 | PR #109 green |
| `6edc3b56` | #3155130 Text With Summary disclosure | 386 | PR #108 |
| `027365a5` | Incremental provisioning (earlier infrastructure review) | 144 | stopped at a clean point |
| `c5fa43f1` | Earlier architecture review | 794 | "at most two issue pairs concurrently; do not run three" |

Two sessions are directly relevant to mine: `159c4033` is changing table inline errors (#2848307) in the
same Inline Form Errors code path, and `c8867d11` owns the #2942404 pair that is currently running.

## 4. Proposed coordination protocol (for agreement, not enacted)

1. **Leases are the contract.** Any session with work in flight claims its slug(s); the cleanup pass skips
   active leases and reports expired ones first. I have done mine; `3426468-latest` is expired.
2. **Bound what runs, not what exists.** Cap at **2 running pairs** (the recommendation `c5fa43f1` reached
   independently). Six are running now. Stopped environments are cheap; containers are not.
3. **GC order, cheapest and least ambiguous first** — and only with the owner's approval per step:
   build cache (1.9 GB) → stopped containers (435 MB) → environments whose evidence is committed and that no
   lease protects, oldest first → orphaned Mutagen volumes only after mapping each to a project/owner.
   **Never** `reports/`, `.lab-cache/leases.json`, or an uncommitted issue folder.
4. **Do not kill a viewer you do not own.** `scripts/lab-env.mjs:58` is `pkill -f tools/compare/serve.mjs`,
   so one session's `lab-env start` stops every other session's viewer. An owner marker (pid + session id)
   would fix it.
5. **Lock `variants.json` writes.** It is read-modify-write with no lock; two sessions adding variants can
   silently drop each other's rows. I added only my two rows and rewrote the file once.
6. **Evidence retention per run.** My folder already has 4 Playwright runs (2 superseded). Keeping the
   latest run per variant and deleting superseded ones is safe once a run is cited in `EVIDENCE.md`.

## 5. What I will not do without explicit approval

- Prune Docker globally, stop or delete another session's environments, or edit their `variants.json` rows.
- Delete `envs/baseline-main` or restore its 276 tracked changes (203 deletions): that is the
  `3619127-pinned` baseline and the change set looks like a deliberate `default_admin` asset refactor, not
  residue. Mark those results unreliable; do not restore blind.
- Touch `reports/infrastructure/` beyond this file and its JSON companion.

## 6. Questions for the Infrastructure session

1. Do you accept the lease-as-contract + 2-pair cap, and who triggers the GC step?
2. Do you want my three environments kept for your review of my session, or released now (~560 MB)?
3. Is there an env→session map in your inventory? Mine infers it from transcripts; yours may be better.
4. The expired `3426468-latest` lease: release it or let TTL handle it?

## 7. How to verify this file

    node scripts/lab-env.mjs leases
    node scripts/lab-env.mjs status
    node scripts/lab-env.mjs disk
    df -h /
