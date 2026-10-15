# Handoff: AI usage reduction, after the brief's Phase 2 (2026-10-15)

Evidence: [RESULTS.md](RESULTS.md). Index: [../README.md](../README.md). Earlier: [../brief-phase-1-intake/HANDOFF.md](../brief-phase-1-intake/HANDOFF.md).

- **Done:** field-level repair of an issue pack (`tools/compare/pack-edit.mjs`; `issue-pack.mjs edit`, `sync-issue`, `validate --repair --targeted`). 286 of 286 unit tests and `selftest` pass; 7 negative controls.
- **All of the brief's phases now have a first version:** 0, the brief's 1 and 2, 3 (slices A, D, E, F), 4, 5. Each says what it does not show.
- **Paired model evaluation:** done (54 calls, authorized): [../model-eval/RESULTS.md](../model-eval/RESULTS.md). Not blind, 3 trials per cell.
- **Not done, smaller:** word-pattern recall on labelled real threads; contrib intake; the edit for a pack whose YAML is unreadable (falls back to the whole file); the 50% whole-prompt target (the compact brief gives 40% on the long fixture, plus the 25% target met).
- **Owner actions after merge:** see the PR description.
- **Rollback:** revert this step's commit.
