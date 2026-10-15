# AI usage reduction: what was done and where (2026-10-15)

A staged project to cut AI usage in this lab without losing reliable evidence (the prompt: `~/Downloads/drupal-core-lab-staged-investigation-prompt.md`). Each step has its own folder with `RESULTS.md` or
`FINDINGS.md` and a short `HANDOFF.md`; **start from the newest handoff, [slice-f/HANDOFF.md](slice-f/HANDOFF.md)**. All of it is committed on one branch and nothing has been pushed.

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

Measurement tools: `scripts/usage-baseline.mjs` (prompt size and composition), `scripts/session-usage.mjs` (usage from the client's transcripts, `--sequences`), `scripts/context-size.mjs` (the client's `/context`).
