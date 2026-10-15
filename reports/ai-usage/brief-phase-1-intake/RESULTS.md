# AI usage, the brief's Phase 1: compact issue intake and named handoffs (2026-10-15)

DRAFT until a person has reviewed it. This is the brief's own Phase 1 ("compact intake and explicit handoffs"), not the folder called `phase-1`
(slice A, patch identity; see the naming note in [../README.md](../README.md)). Nothing posted. Base: the branch of PR #12.

## What was built (a compatibility-preserving pilot)

| Piece | Where | What it does |
|---|---|---|
| Structured fetch | `tools/compare/pack-prepare.mjs` | `gather()` also returns the issue as data (`g.structured`); the prompt text is unchanged except that **limits are now stated in it**: comment page limit reached, attachments over 30, attachments that could not be described (Phase 0 found these cut silently) |
| Snapshot, index, brief | `tools/compare/issue-intake.mjs`, `scripts/issue-intake.mjs fetch\|brief\|show` | The complete snapshot goes to `.lab-cache/sources/<nid>/` (git-ignored). Committed: `intake/sources.json` (each source's id, revision, fetch time, sha256), `intake/comment-index.json` (every comment: number, id, author, date, size, hash, first line, signals, references, supersession), and `intake/BRIEF.md` |
| Deterministic extraction | the same | Identity of the issue, merge request (head, state) and diff; the limits and gaps of the fetch; the issue summary; the comments whose own words mark them as decisions, proposals, questions or revisions, **verbatim and quoted as data**; the latest three; what was left out, by number, with the command that brings any of it back; which proposals a later comment dropped |
| Interpretation, kept apart | `tools/compare/handoff.mjs`, `scripts/issue-intake.mjs handoff write\|check\|show` | Named handoffs (issue, sources, reproduction, patch, validation, feedback): a summary, facts and open questions that each cite `comment:<n>`, `source:<id>` or `file:<path>`, pointers to files that already hold the detail, and the hash of everything cited, recorded by the tool. Written by a model or a person; the brief never is |
| Refresh | `issue-intake.mjs fetch` again | Says which sources changed since the last fetch and which handoffs now describe something that changed |
| Prompt use | `issue-pack.mjs prepare --compact` | The pack prompt carries the brief instead of every comment, **only when the brief is smaller** |
| Measure | `scripts/intake-benchmark.mjs` | Prompt bytes full and compact on recorded fixtures |

Example, real data: [#3618230](../../issues/3618230/) has `intake/` and five handoffs of 140 to 420 tokens each (bytes/4, a rough ratio), each citing its sources; `handoff check` says all five are fresh.

## The brief's required tests, mapped

| Required | Test (`tests/lab/issue-intake.test.mjs`, 10 tests) | Negative control |
|---|---|---|
| An older maintainer decision survives | #14 of 120 (a maintainer decision from the start of the thread) is in the brief with its state; six of the seven planted facts present | decisions not retained: 2 tests fail |
| Superseded proposals identified | #31 "superseded by #58" from the comments' own words; a plain reference or a "see #n" is not a supersession | supersession not recorded: fails |
| Missing data, pagination limits, truncated diffs explicit | 1000 comments (20 full pages), 35 attachments, an undescribable attachment, a 360 KB diff (kept whole in the snapshot), no merge request, no issue; an uncapped issue reads exactly as before | comment limit not stated (brief and prompt text): each fails |
| Source revision change invalidates handoffs | merge request tip moved, comment edited, comment added, diff changed, pointer file changed or removed, numbering shifted: **only** the handoffs that cite the changed thing go stale | stale not detected: fails |
| Issue text cannot override instructions | the planted "IGNORE ALL PREVIOUS INSTRUCTIONS" comment is flagged, not shown, and quoted and neutralized when shown on request; prompt markers inside a decision comment are quoted; every comment line is inside a quote block; the composed prompt has one marker of its own | text not neutralized: fails |
| Existing pack and variant behaviour compatible | all 145 existing issue-pack tests pass unchanged; the prompt of an uncapped issue has no new line | |
| Deterministic, no model, no network | the brief is byte-identical on two builds; the modules contain no `fetch(`, process spawning or model name | |
| A fact with no source is refused; a bad write changes nothing | handoff validation (unknown field, no source, missing comment, size over about 1,000 tokens without a stated exception); the command leaves the stored handoff byte for byte | facts need no source: fails |

## Measurements (mechanical)

`node scripts/intake-benchmark.mjs` (recorded fixtures; bytes, ~tokens = bytes/4):

| Case | Comments | Issue text (INPUT 2) full to brief | Whole prompt full to compact | Planted facts kept |
|---|---|---|---|---|
| long-discussion (synthetic) | 120 | 21,541 to 4,638 bytes (**22%**) | 42,405 to 25,502 (**60%**) | 6 of 6 (the 7th is the instruction, kept out on purpose) |
| #3618230 | 10 | 4,106 to 4,799 (117%) | unchanged: `--compact` keeps the full text when the brief is not smaller | n/a |
| #3618230, no merge request | 10 | 4,106 to 4,590 (112%) | unchanged, same reason | n/a |

Against the targets of Phase 0 section 5: the issue-dependent part on the long fixture is 78% smaller with the planted facts kept (target: at least 50%), and the whole
prompt is 40% smaller (the separate target of at least 25%). Two real threads fetched read-only, nothing written: #3604037 (55 comments) brief 30% of the issue text, 4 comments flagged;
#3619127 (41 comments) 69%, 4 flagged. A short thread gets no saving. The handoff target (about 1,000 tokens or less) is met by the five examples (140 to 420 estimated tokens).
Not measured: total model usage of a session that uses the brief, because no model session was run on it.

## What this does not show

- **Semantic quality** (see also [../model-eval/RESULTS.md](../model-eval/RESULTS.md), added later: a 54-call paired run found no difference where the facts are easy to find, and a loss where a decision uses none of the words the patterns look for). The tests in this file are mechanical. That a model reads the compact brief and the full thread to the same conclusion needs a paired model evaluation with held-out threads. It was not run: it needs your authorization and spends allowance, and a deterministic mock cannot stand in for it.
- **Recall on real threads.** The signals are word patterns. They found the planted facts, and flagged 4 comments in each of two real threads, but no labelled real threads exist to measure what they miss (a decision phrased without the words, a proposal in a long code block) or flag wrongly (#12 of #3618230 is a test file that happens to contain "must not"). Supersession is found only when a later comment names the earlier one right after a word such as "dropping" or "instead of".
- **Unresolved is a guess** ("no later comment refers to it"), and the brief says so.
- **The network commands** (`fetch`, `prepare --compact` against drupal.org) were run live on #3618230, #3604037 and #3619127; unit tests use recorded fixtures only. Found live: `--mr` absent was passed as `null` and crashed; fixed.
- **Contrib issues and issues with no merge request** are as before: intake is core-only, and the brief marks a missing merge request as a gap.

## Altered behaviour

- The prepared issue text now has `LIMIT:` lines when a cap was reached. Uncapped issues read exactly as before.
- Nothing else about `prepare`, `validate` or `import` changes unless `--compact` is given.

## Risks and rollback

- A compact brief can hide a decision the patterns do not recognise. The brief lists every omitted comment by number and the index holds one line for each; the full prompt remains the default.
- Rollback: revert the commit; `prepare` without `--compact` is unaffected.

## Next

The brief's Phase 2 (targeted generation and repairs of the issue pack): see [HANDOFF.md](HANDOFF.md).
