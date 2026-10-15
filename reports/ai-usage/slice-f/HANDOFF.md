# Handoff: AI usage reduction, after slice F: the brief's Phase 3 is complete (2026-10-15)

Resume from this file. Evidence: [RESULTS.md](RESULTS.md). The index of everything done: [../README.md](../README.md).

- **Repository:** branch `claude/unruffled-lewin-d2de0a`; this slice's commit is the one adding `reports/ai-usage/slice-f/` (after `48f9095`). Twelve local commits ahead of `origin/main`; nothing pushed.
- **Done:** slice F. `tools/compare/run-record.mjs`; `coverage.mjs` marks runs stale (kept, listed, not counted), current or unrecorded. With slices A, D and E the brief's Phase 3 is covered: patch identity, common base, pin, recipe, dirty baseline, contrib, stale evidence.
- **Needs the owner (nothing here can be done from this checkout):** `node scripts/lab-env.mjs reset 3618230-latest --yes` and `node tools/compare/setup.mjs 3093378-latest` from the main checkout (the first real DDEV runs of the new setup paths); then one evaluator run per issue you want current evidence for, which records the hashes.
- **Open decisions:** the 50% prompt target (comment compaction caps at 48.5%); push the twelve commits for review?
- **What the brief still has:** its Phases 1 and 2 (compact intake and targeted repair of the issue pack; small expected token effect at 2 packs, so after the target decision), Phase 4 (a pilot of the whole loop on one issue: brief, recipe, baseline failure, patch and test, comparison, feedback record, revised patch, targeted rerun, explicit supersession), Phase 5 (gaps: no-MR patch authoring, contrib intake and lint, updating an imported issue, restricted-network cloud).
- **Not yet measured:** `code-map` and the smaller `AGENTS.md` in a real desktop session (`node scripts/session-usage.mjs`: `firstCtx` baseline 78k to 81k; `--sequences` baseline in `../phase-2/`; `node scripts/context-size.mjs` 28.6k).
- **Rollback:** revert this slice's commit.
