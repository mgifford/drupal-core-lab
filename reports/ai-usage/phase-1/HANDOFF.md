# Handoff: AI usage reduction, after Phase 1 (slice A) (2026-10-15)

Resume from this file. Evidence: [RESULTS.md](RESULTS.md); earlier: [../phase-0/FINDINGS.md](../phase-0/FINDINGS.md), [../phase-0/HANDOFF.md](../phase-0/HANDOFF.md).

- **Repository:** branch `claude/unruffled-lewin-d2de0a`; Phase 0 commit `2679680`; the Phase 1 commit is the one that adds `reports/ai-usage/phase-1/`. Nothing pushed.
- **Phase done:** 1, slice A (patch identity). Behaviour changed on purpose: `setup.mjs` blocks (exit 4) on a patch/tree mismatch; `--refresh-patches` is the explicit fix; runs refuse to start on a mismatch and record `patchState`.
- **Files:** `tools/compare/patch-state.mjs` (new), `tools/compare/setup.mjs` (patch step), `tools/playwright/lib/lab-run.mjs` (`launch`, `baseResults`), `tests/lab/patch-state.test.mjs`, `tests/lab/setup-patches.test.mjs`, `AGENTS.md` (+2 lines), `docs/NEW-ISSUE.md` (+1 line).
- **Identifiers:** record in `<env git dir>/lab-patches/state.json` (patch path + sha256, per-file content hash, footprint, base commit); backups `lab-patches/backup-*.diff`; old `.lab-patches-applied` still written.
- **Confirmed decisions:** slice A first; no agent framework; one sequential agent. Acceptance 2 and 5 are met more strictly than written: content proof verifies and records, anything else blocks.
- **Evidence:** 186 tests, 185 pass, 1 skipped (Playwright); selftest passes; three negative controls; read-only check on the 4 patched real sides all verify (40 to 520 ms).
- **Not done:** contrib patch identity; hypothesis 7 visibility (`-latest` older than upstream); dirty-baseline blocking; recipe revisions; stale runs flagged in `coverage.mjs`; one real DDEV run (first `node tools/compare/setup.mjs 3618230-latest` after merge should print "verified by content ... recorded now").
- **Still open for the owner:** (1) the 50% prompt target (comment compaction caps at 48.5%): proposed 50% on summary plus comments with 7 planted facts kept, plus 25% on the whole prompt. (2) What next, below.
- **Options for the next phase** (from Phase 0 payoff ranking; owner picks): **B** fewer calls per task (rank repeated sequences with `node scripts/session-usage.mjs --tools`; build one-call compact commands, `try-tests.mjs` is the pattern); **C** scope the starting context (the owner's skill and plugin list, plus splitting `AGENTS.md` and `AI-LEARNING.md`; measure first-call context); **Phase 3 remainder** (contrib patches, dirty baseline, recipe identity, `-latest` visibility, stale runs in coverage); **the brief's Phases 1 and 2** (compact intake, targeted repair): small token effect at 2 packs, so after the target is agreed.
- **Rollback of Phase 1:** revert its commit.
