# Handoff: AI usage reduction, after the brief's Phase 1 (2026-10-15)

Evidence: [RESULTS.md](RESULTS.md). Index: [../README.md](../README.md).

- **Done:** compact intake and named handoffs (`scripts/issue-intake.mjs`, `tools/compare/issue-intake.mjs`, `handoff.mjs`; `issue-pack.mjs prepare --compact`). 274 of 274 unit tests and `selftest` pass.
- **Real example:** `reports/issues/3618230/intake/` and `handoffs/` (five handoffs, all fresh).
- **Not done:** a paired model evaluation of brief against full thread (needs authorization); recall of the word patterns on labelled real threads; contrib intake.
- **Next:** the brief's Phase 2: field-level repair of an issue pack instead of regenerating it (`repairMessage()` asks for the complete file). See [../brief-phase-2-repairs/HANDOFF.md](../brief-phase-2-repairs/HANDOFF.md) when it exists.
- **Rollback:** revert this step's commit.
