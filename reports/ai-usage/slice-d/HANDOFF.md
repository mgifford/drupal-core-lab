# Handoff: AI usage reduction, after slice D (2026-10-15)

Resume from this file. Evidence: [RESULTS.md](RESULTS.md); the assessment it comes from: [../phase-3-remainder/FINDINGS.md](../phase-3-remainder/FINDINGS.md); earlier: [../phase-3-remainder/HANDOFF.md](../phase-3-remainder/HANDOFF.md).

- **Repository:** branch `claude/unruffled-lewin-d2de0a`; this slice's commit is the one adding `reports/ai-usage/slice-d/` (after `e5f9bbc`). Seven local commits ahead of `origin/main`; nothing pushed.
- **Done:** slice D. `tools/compare/env-state.mjs`; `setup.mjs` blocks (exit 4) on mixed bases, a pin mismatch, or a changed recipe on an existing site, and creates a missing `latest` side at the other's commit; runs refuse and record `identity`; `lab-env.mjs status` shows the core commit and problems.
- **Needs the owner:** `node scripts/lab-env.mjs reset 3618230-latest --yes` (main checkout). The pair holds an older recipe, so its evaluator is blocked until then. This will also be the first real DDEV run of the new setup path.
- **Open decisions:** dirty baseline, stop or warn (`AGENTS.md` rule 1 says stop; today a warning); the 50% prompt target (comment compaction caps at 48.5%); push the commits for review?
- **Next, in order:** slice E contrib identity (move the contrib steps into a module so they can be tested offline; `3093378` uses them); slice F stale runs in `coverage.mjs`; then measure code-map and the smaller `AGENTS.md` in a real desktop session (`session-usage.mjs`: `firstCtx` baseline 78k to 81k, `--sequences` baseline in `reports/ai-usage/phase-2/`).
- **Rollback:** revert this slice's commit.
