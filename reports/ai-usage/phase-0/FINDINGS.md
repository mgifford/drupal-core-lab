# AI usage, Phase 0: findings (2026-10-15)

DRAFT until a person has reviewed it. Phase 0 only: nothing in production behaviour changed. Added: two measurement scripts
(`scripts/usage-baseline.mjs`, `scripts/session-usage.mjs`), one synthetic fixture (`tests/issue-pack/fixtures/long-discussion/`),
tests (`tests/lab/ai-usage.test.mjs`) and the files in this folder. Numbers are in [BASELINE.md](BASELINE.md), the resume point is
[HANDOFF.md](HANDOFF.md).

Repository state: `origin/main` `755d6b3` plus the unpushed `try-tests` commit `099722e`; this phase's commit sits on top (see HANDOFF).
Dated 2026-10-15. The earlier review's commit `755d6b3` is the same `origin/main`, so no hypothesis was invalidated by upstream movement.

## What the numbers say, in five lines

1. **No script in this repository calls a model.** The model is (a) a chat the person pastes the `prepare` prompt into and (b) Claude
   Code development sessions. For (a) the client, model and billing are recorded nowhere. For (b): Claude desktop app, Claude Code
   2.1.286 and 2.1.295, `claude-sonnet-5-5` and `claude-opus-5-5`, effort `medium` and `xhigh`; billing mode is not in the transcripts.
2. **Recorded usage is dominated by re-reading context, not by the pack prompt.** In every long session 98 to 99% of input-side tokens
   are cache reads. An average call reads 194k to 379k tokens. 18 to 40% of that reading is the same 69k to 81k-token starting
   context (instructions, tool definitions, skill list, memory) sent again on every call.
3. **The pack path is a small and rarely used part.** Two packs are stored (#3415961, #3618230). A pack prompt is about 7k to 20k
   tokens (bytes/4, a rough ratio); one development session is 13M to 220M cache-read tokens. Even removing the pack prompt
   entirely would not move total usage visibly at today's frequency. It still matters for correctness (item 4).
4. **Several of the prior review's claims are confirmed defects or silent limits** (a stale patch kept because the filename matches,
   a tree assumed patched without checking, comment and attachment caps the assistant is not told about), checked by running the code
   on a throwaway repository. The "latest" environment behaviour is intentional but gives no warning.
5. **One stated target cannot be met by the planned method.** Removing every comment from the long-discussion fixture cuts its prompt
   by 48.5%, so "at least 50% less prompt by compacting comments" is unreachable (see section 5).

## 1. The path, and where a model is involved

| Stage | What runs | Model? | Manual step |
|---|---|---|---|
| Issue URL to prompt | `issue-from-url.mjs` then `issue-pack.mjs prepare`, `pack-prepare.mjs` `gather`/`composePrompt` (GET drupal.org and git.drupalcode.org) | no | run it |
| Draft the pack (YAML) | the person pastes the prompt file into a chat (`issue-from-url.mjs:49`; the prompt "can be 80 KB", `:47`) | **yes, outside the repo** | paste, save the reply |
| Validate, repair | `validatePack`, `repairMessage` (`pack-validate.mjs:325`) | repair goes back to the chat | paste the repair message, save the reply, rerun |
| Import | `issue-pack.mjs import` runs `new-issue.mjs` (fetches the fork branch), writes recipe, variants, `PACK.yml`, `SUMMARY.md` | no | none |
| Setup | `tools/compare/setup.mjs` (worktrees, patches, DDEV, Composer, recipe) | no | 10 to 20 min first build (docs) |
| Evaluate | `tools/playwright/evaluate-<nid>.mjs` on `lib/lab-run.mjs`; `scripts/lint.mjs`; `scripts/try-tests.mjs` | no | writing each `evaluate-<nid>.mjs` is development work |
| Feedback | viewer "Manual" tab and "Download log"; `coverage.mjs`, `check-draft.mjs`, `issue-status.mjs` | the Claude Code session reads and writes up | a person reviews, posts |

Everything that reads sources, fetches, validates, builds and measures is deterministic already. The model is used for: drafting the
pack, repairing it, writing the per-issue evaluator and write-ups, and every interactive development session.

## 2. Where usage goes (the four sources), measured on the six recorded sessions

| Source | Evidence | Size |
|---|---|---|
| Starting context (instructions, tools, memory) | first call of each session | 69k to 81k tokens, read again on every call: 18 to 40% of input-side tokens |
| Content entering context (files, tool output, issue text) | tool results per session | 153 KB to 1,888 KB (the largest is screenshots); each byte is re-read on every later call |
| Reasoning and output | provider usage | 89k to 684k output tokens in the five long sessions, 30 to 55% of it thinking |
| Repetition and rework | calls, errors, repeated reads | 69 to 593 calls per session (five long sessions); 3 to 11 tool errors; repeated identical reads 0 or 1 |

What the harness injects before the first message (transcript attachment sizes, JSON-escaped so slight overestimates): skill listing
33.5 to 34.0 KB (constant), instructions 23.7 to 53.8 KB (this repository's `AGENTS.md` is 20.0 KB today), MCP instructions 6.3 to 14.7 KB,
agent listing 4.7 to 5.7 KB, deferred tool names 10.9 to 21.9 KB. The built-in system prompt and tool schemas are not itemised in
transcripts. So **the repository controls under a tenth of the starting context (`AGENTS.md`, 20 KB of an 81k-token start at bytes/4 is about 6%); the skill listing alone (most of it unrelated to
this repository) is larger than `AGENTS.md`.**

The mechanism matters more than any single file: a token that enters context is paid for again on every following call, so
(number of calls) x (average context) is the cost driver. That is why `try-tests.mjs` (one call, 30 lines back) helps and why a big
early `Read` is expensive. This is reasoning from the numbers above, not a measured saving of any change.

## 3. The nine hypotheses

| # | Verdict | Evidence |
|---|---|---|
| 1 comments and diff | **Confirmed, with two corrections.** All comments are included (`pack-prepare.mjs:99-105`, `:123-126`), pages capped at 20 x 50 (`:13`), diff capped at 300 KB (`:152-154`). In two real UI issues comments were only 16 to 26% of the prompt (diff 20 to 38%). The comment and attachment caps are **silent**: a probe with 1,100 comments gave 1,000, the header said "Comments: 1000", and nothing told the assistant; 35 attachments listed 30 (`:110`). The diff cut is announced. | `BASELINE.md` |
| 2 template, catalogue, example | **Confirmed, intentional.** The prompt is one pasted message, so everything is in it (`issue-pack.mjs:48-58`, `:69-71`; `pack-prepare.mjs:161-163`): 18,880 bytes constant, 23% (the largest real prompt) to 66% (#3618230) of the prompt; 6,526 of it is the worked example. | measured |
| 3 repair regenerates the pack | **Confirmed.** The message says "send the complete corrected file again" (`pack-validate.mjs:328`). For one broken field the message is 245 bytes and the reply is the whole 6,733-byte pack. The five `llm-draft-*` fixtures each carry 2 to 4 validator warnings, which give 1.1 to 1.8 KB repair messages. | measured |
| 4 about 90 KB of instructions | **Unsupported as stated.** Only `AGENTS.md` (20.0 KB) is injected automatically. `AI-LEARNING.md` (19 KB) was read in 2 of 6 sessions, because `AGENTS.md` line 3 says to. `ACCESSIBILITY.md` and `STYLES.md` were never read or loaded in any recorded session, and the `accessibility-general` skill was never invoked. Caveat: the global `INSTRUCTIONS.md` section 6 says to load that skill when `ACCESSIBILITY.md` exists, so behaviour depends on how a session reads that rule. | transcripts |
| 5 core-only intake | **Confirmed, intentional.** `parseIssue` and `gather` refuse other projects (`pack-prepare.mjs:26`, `:97`); a fork branch is required (`pack-validate.mjs:119`, `issue-pack.mjs:146`); an issue with no merge request leaves 1 of 3 inputs `@@MISSING@@` and a pack without `fork_branch` is rejected. `setup.mjs` supports contrib (`:66`, `contribPatches`) but `lint.mjs:33` says contrib patches are not checked. | probe |
| 6 stale patch by filename | **Confirmed defect, reproduced.** The marker stores the path (`setup.mjs:152-161`). After changing the patch's bytes under the same name, a rerun printed "patch already applied" and the tree kept the old change. With the marker deleted and an unrelated edit present it printed "assuming patches are applied" and applied nothing, then reported "plus its patches". | throwaway repo, `setup.mjs --checkout-only` |
| 7 "latest" keeps an old commit | **Intentional, but a visibility gap.** A rerun fetches only when an environment is missing (`setup.mjs:100-104`; the comment says existing ones are left alone). Reproduced: upstream advanced, the rerun kept both environments on the old commit and printed that old commit. `--check-patches` does fetch (`:104`) and said "applies cleanly" for the **new** commit while the environments stayed on the old one. Nothing compares an environment's commit with upstream. | throwaway repo |
| 8 mirror removes drupal.org | **Confirmed.** `--core-url` only moves the core fetch. `prepare` needs drupal.org and git.drupalcode.org (`pack-prepare.mjs:10`); `import` fetches the fork branch from git.drupalcode.org (`new-issue.mjs:26`, `:33`). The quickstart says the workspace blocks both hosts. The quickstart's "Node only" row for the pack steps leaves out that they need those hosts. | code |
| 9 missing workflows | **Confirmed gaps.** No step authors a patch when no MR exists (only `try-tests.mjs`, unmerged, covers test-only files). `import` refuses an existing issue folder (`issue-pack.mjs:137`), so there is no update path. A run records patches by name and the checkout by `git log -1` (`lab-run.mjs:50`, `:200`), no patch hash. The viewer's "Download log" holds a checklist, not a run ID (`index.html:577`). | code |

## 4. Rework and runtime (separate columns, as the brief asks)

Model time and tool time, where the client recorded them: 19.7 and 4.2 min (7acff364), 130.9 and 81.9 min (381de1b9), 22.1 and 17.7 min
(09580209); the others have no cost record. Setup time is documented (10 to 20 min local, about 7 min in Coder) and was not re-measured.
Time to a verified comparison was not measured. See BASELINE.md for the table and the list of missing values.

## 5. Targets: one cannot be met as written

For the long-discussion fixture (42,405 bytes) comments are 20,584 bytes. Everything else (instructions 18,880, diff, header, summary)
is 21,821 bytes. **Dropping every comment would reduce the prompt by only 48.5%.** Compacting comments cannot reach "at least 50% less
initial prompt content". Proposed, to be agreed before Phase 1 evaluates anything: keep the 50% target for the **issue-dependent**
part (summary plus comments: 20,949 bytes) with all 7 planted facts retained, and add a separate whole-prompt target of at least 25%.
The other targets (50% less repair output for a one-field correction, handoff of about 1,000 tokens, stale and mismatch cases explicit)
stand unchanged. They are targets, not claimed savings.

## 6. Payoff ranking and the smallest first slice

Estimates come from sizes and counts, not from a measured change; each row names how to measure it.

| Slice | What it targets | Rough effect | Cost, risk | Measure |
|---|---|---|---|---|
| **A. Patch identity** (hash in the marker, verify, block on mismatch, record hashes in runs) | confirmed false-evidence defects (6, part of 9) | no token saving; prevents wrong evidence and reruns | small, offline-testable, reversible | the 5 acceptance tests below |
| B. Fewer calls per task: one-call compact commands for repeated sequences | calls x average context (194k to 379k per call) | each avoided call saves roughly one average context read; `try-tests.mjs` is the example | medium; needs a ranked list of repeated sequences from `session-usage.mjs --tools` | calls and cache reads on the next comparable task |
| C. Scope the starting context (settings outside the repo; split `AGENTS.md` and `AI-LEARNING.md` inside it) | 18 to 40% of reading | at most a few percent of total reading from the repo files (about a tenth of the starting context), more from the skill and tool lists | low; the larger part is the owner's user-level configuration | first-call context of the next session |
| D. Compact, decision-preserving intake and targeted repair (the brief's Phases 1 and 2) | the pack prompt and repair | small in total tokens at 2 packs; large for repair output of a single reply | medium to high | fixtures and targets in section 5 |

**Recommended first slice: A.** It is the only confirmed defect that can silently produce wrong evidence, it is small, it can be
tested offline (the throwaway-repository experiment is the seed of the tests), and the brief itself says to fix confirmed correctness
defects before the feedback loop depends on reused environments. B and C are cheap wins to schedule next; D only when pack use grows
or when its correctness parts are wanted (making the caps visible to the assistant is the smallest piece).

Slice A, expected files: `tools/compare/setup.mjs` (patch step, `:151-162`), `tools/playwright/lib/lab-run.mjs` (`:200`, record
patch hashes and the tree's diff hash), a new `tests/lab/setup-patches.test.mjs`, one `AGENTS.md` pitfalls row.
Design: the marker line becomes `<path><TAB><sha256 of the patch bytes>`; after applying, also store the sha256 of `git diff HEAD`.
On a rerun: same hash and same tree hash means reuse; a different hash, a missing marker on a modified tree, or a tree hash that no
longer matches means **BLOCKED with the exact next command**, never a silent reset; an old marker without a hash is read as
"unverified" and reported. Acceptance tests (throwaway repository, `--checkout-only`, no DDEV):
1. patch bytes changed under the same filename: blocked, tree untouched;
2. marker missing and the tree modified: blocked, not "assuming";
3. no change: reuses, applies nothing, exit 0;
4. an unrelated user edit in a patched tree: reported, not reset;
5. an old marker without a hash: reported as unverified, not as verified.
Rollback: revert the commit; old markers still parse, so nothing needs migrating. DDEV behaviour is covered only by these offline
tests until one real run is done on a built pair; Phase 3 must say so.

## 7. Not measured, and why

Tokenizer counts (no offline tokenizer; the provider's counting API needs a key and was not used); the pack chat's client, model, usage
and billing; how often repairs happen in real use; per-stage attribution inside a session (transcripts give tool categories, not stages);
time to a verified comparison; the billing mode behind the client's cost estimates. The current session's transcript was still being
written when sampled, so its row is partial.
