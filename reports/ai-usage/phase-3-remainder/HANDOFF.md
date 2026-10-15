# Handoff: AI usage reduction, after option C and the look at the rest of Phase 3 (2026-10-15)

Resume from this file. Evidence: [FINDINGS.md](FINDINGS.md); option C: [../option-c/RESULTS.md](../option-c/RESULTS.md); slice A: [../phase-1/RESULTS.md](../phase-1/RESULTS.md); earlier: [../phase-0/FINDINGS.md](../phase-0/FINDINGS.md).

- **Repository:** branch `claude/unruffled-lewin-d2de0a`; commits `2679680` (baseline), `b4ae1f1` (patch identity), `0eade57` (code-map), `c776642` (AGENTS.md cut); this look adds `reports/ai-usage/phase-3-remainder/`. Four local commits ahead of `origin/main` before it; nothing pushed.
- **Option C done:** `AGENTS.md` 8.6k to 2.9k tokens, starting context 34.3k to 28.6k (client's own `/context`, `node scripts/context-size.mjs`). Skill scoping tested and withdrawn (tokens move into tool schemas; the total does not change). Not yet measured: a desktop session's first call (baseline 78k to 81k).
- **Phase 3 remainder, looked at, not built:** R1 recipe drift (real: the #3618230 sites hold an old recipe), R2 mixed base commits (reproduced, silent), R3 contrib identity (by reading), R4 dirty baseline (policy), R5 `-latest` visibility, R6 stale runs in coverage, R7 one real DDEV run.
- **Recommended next:** slice D (environment identity: common base, pinned commit, recipe hash, status column). Needs two answers: block runs on a recipe mismatch (it will block the #3618230 evaluator until `lab-env.mjs reset 3618230-latest --yes`), and stop or warn on a dirty baseline.
- **Still open:** the 50% prompt target (comment compaction caps at 48.5%); whether to push the four commits for review (nothing pushed without approval).
- **Rollback:** revert the commit that adds this folder; no behaviour changed.
