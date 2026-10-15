# Handoff: AI usage reduction, after Phase 0 (2026-10-15)

Resume from this file; read FINDINGS.md only for the evidence behind a decision.

- **Repository:** branch `claude/unruffled-lewin-d2de0a`, base `099722e` (`origin/main` `755d6b3` plus the unpushed `try-tests` commit). The Phase 0 commit is the one that adds `reports/ai-usage/phase-0/`. Nothing pushed.
- **Phase done:** 0 (investigation and baseline). No production behaviour changed.
- **Added:** `scripts/usage-baseline.mjs`, `scripts/session-usage.mjs`, `tests/issue-pack/fixtures/long-discussion/` (synthetic, frozen), `tests/lab/ai-usage.test.mjs`, this folder.
- **Client and model (when measured):** Claude desktop app, Claude Code 2.1.286 and 2.1.295, `claude-sonnet-5-5` and `claude-opus-5-5`. Billing mode unknown. The pack chat's client, model and usage are unrecorded.
- **Confirmed decisions:** no agent framework or runner is warranted by the evidence; one sequential agent; baseline numbers are in `baseline.json` and `sessions.json`.
- **Key evidence:** cache reads are 98 to 99% of input-side tokens; an average call reads 194k to 379k tokens; 18 to 40% of it is the 69k to 81k starting context. The pack path has run for 2 issues; its prompt is 28.7 to 80.8 KB (18,880 bytes constant). Confirmed defects in `setup.mjs` (patch tracked by filename; "assuming patches are applied"), reproduced on a throwaway repository. Comment (1,000) and attachment (30) caps are silent.
- **Tests:** existing 168 (167 pass, 1 skipped for missing Playwright) plus 5 new, all passing; `node scripts/selftest.mjs` passes.
- **Unresolved questions for the owner:**
  1. Phase 1 scope. Recommended: slice A (patch identity in `setup.mjs`), because it is the confirmed correctness defect and the brief says to fix those before reuse. The brief's Phase 1 (compact intake) is the alternative, with small expected token effect at today's pack usage.
  2. The 50% prompt target cannot be met by comment compaction (max 48.5% on the fixture). Proposed: 50% on the issue-dependent part with all 7 planted facts kept, plus 25% on the whole prompt. Needs a yes before Phase 1 evaluates.
  3. Slice C (starting context) is mostly the owner's user-level skill and plugin configuration, outside this repository.
- **Next action:** Phase 1 = slice A. Files: `tools/compare/setup.mjs` (`:151-162`), `tools/playwright/lib/lab-run.mjs` (`:200`), new `tests/lab/setup-patches.test.mjs`, one `AGENTS.md` pitfalls row. Five acceptance tests and the rollback are in FINDINGS.md section 6. Start by turning the throwaway-repository experiment (`setup.mjs <slug> --checkout-only` with a local upstream repo, a patch whose bytes change, a deleted marker) into failing tests.
- **Rollback of Phase 0:** revert its commit; nothing else depends on it.
