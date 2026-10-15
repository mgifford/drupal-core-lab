# AI usage reduction: what was done and where (2026-10-15)

A staged project to cut AI usage in this lab without losing reliable evidence (the prompt: `~/Downloads/drupal-core-lab-staged-investigation-prompt.md`). Each step has its own folder with `RESULTS.md` or
`FINDINGS.md` and a short `HANDOFF.md`; **start from the newest handoff, [brief-phase-2-repairs/HANDOFF.md](brief-phase-2-repairs/HANDOFF.md)**. All of it is committed on one branch and nothing has been pushed.

| Step | Folder | What | Key result |
|---|---|---|---|
| Phase 0 | [phase-0](phase-0/FINDINGS.md) | Baseline: where usage goes, the nine review hypotheses checked | usage is re-reading context (98 to 99% cache reads); no script calls a model; three confirmed setup defects |
| Slice A | [phase-1](phase-1/RESULTS.md) | Patches tracked by content, `--refresh-patches` | a stale patch under the same name is blocked, not "already applied" |
| Option B | [phase-2](phase-2/RESULTS.md) | Repeated-sequence ranking; `scripts/code-map.mjs` | no lab-command sequence is worth wrapping; locate-then-read is 16.9% of calls; calls 15 to 6 on six lookups |
| Option C | [option-c](option-c/RESULTS.md) | `AGENTS.md` cut, measured with the client's own `/context` | 8.6k to 2.9k tokens; skill scoping does not reduce the total |
| Phase 3 look | [phase-3-remainder](phase-3-remainder/FINDINGS.md) | What was left of Phase 3, checked against the real environments | recipe drift and mixed bases were real and silent |
| Slice D | [slice-d](slice-d/RESULTS.md) | Common base, pin, recipe; dirty baseline (setup warns, a run refuses) | `launch()` refuses a pair not in the state its variant asks for |
| Slice E | [slice-e](slice-e/RESULTS.md) | Contrib modules and patches tracked by content | the same guarantees as core patches |
| Slice F | [slice-f](slice-f/RESULTS.md) | Stale runs in `coverage.mjs` | stale, current or unrecorded, never blurred; all 28 existing runs are unrecorded |
| Phase 4 | [phase-4](phase-4/RESULTS.md) | Pilot of the whole loop on #3618230; `scripts/feedback.mjs` | feedback tied to run and patch revision; a wrong check was caught and its run superseded; 2 items need a person |
| Phase 5 | [phase-5](phase-5/RESULTS.md) | Four measured gaps, one increment each: patches without an MR, contrib lint, updating an imported issue, a network preflight; merge of 2 upstream commits | a variant with nothing under test is now refused (and exposed `3426468-latest`); the live runs found 2 defects the unit tests could not |
| Brief's Phase 1 | [brief-phase-1-intake](brief-phase-1-intake/RESULTS.md) | Compact issue intake, comment index, named handoffs that cite their sources and go stale when a source changes | long thread: issue text 78% smaller with the planted facts kept; a short thread gets no saving; semantic quality not evaluated |
| Brief's Phase 2 | [brief-phase-2-repairs](brief-phase-2-repairs/RESULTS.md) | Field-level pack repair: a JSON Patch with the pack's hash, refused when stale, malformed or adding an error; the issue block from the fetch | one-field repair: reply 97% less, whole turn 85% less; the multi-finding edits are constructed, not model replies |
| Paired model evaluation | [model-eval](model-eval/RESULTS.md) | 54 calls: compact brief against full thread, targeted edit against whole-file repair | brief: no difference where facts are easy to find, loses a decision the patterns do not select; edit: same reliability, about 4% of the output tokens on one-field repairs |

**Naming.** The folders `phase-1` and `phase-2` are the two steps the owner chose from Phase 0's menu (slice A, patch identity; option B, fewer calls per task). They are **not** the brief's Phase 1 (compact intake and explicit handoffs) or Phase 2 (targeted generation and field-level repairs of the issue pack). In the brief's terms the work so far is Phase 0, Phase 3 (slices A, D, E, F), Phase 4, Phase 5 and the brief's Phase 1 (`brief-phase-1-intake`). The brief's Phase 2 (field-level pack repairs, `brief-phase-2-repairs`) is done too.

Measurement tools: `scripts/usage-baseline.mjs` (prompt size and composition), `scripts/session-usage.mjs` (usage from the client's transcripts, `--sequences`), `scripts/context-size.mjs` (the client's `/context`).
