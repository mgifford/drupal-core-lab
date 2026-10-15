# Handoff: AI usage reduction, after slice E (2026-10-15)

Resume from this file. Evidence: [RESULTS.md](RESULTS.md); earlier: [../slice-d/HANDOFF.md](../slice-d/HANDOFF.md), [../phase-3-remainder/FINDINGS.md](../phase-3-remainder/FINDINGS.md).

- **Repository:** branch `claude/unruffled-lewin-d2de0a`; this slice's commit is the one adding `reports/ai-usage/slice-e/` (after `705b47b`). Ten local commits ahead of `origin/main`; nothing pushed.
- **Done:** slice E. `tools/compare/contrib-state.mjs`; `setup.mjs` records contrib modules and patches by content, blocks on a mismatch (exit 4), extends `--refresh-patches` to them (old folder kept as a backup); runs and `lab-env.mjs status` use the combined core and contrib state.
- **Phase 3 of the brief is now covered** except R6: slice A (patches), slice D (base, pin, recipe, dirty baseline) and slice E (contrib). Left: **slice F**, stale runs in `coverage.mjs` (a run whose recorded patch hashes differ from the patch files now is marked stale; runs without the record are "unrecorded", never stale or current).
- **Needs the owner:** `node scripts/lab-env.mjs reset 3618230-latest --yes` (main checkout; it holds an older recipe); then the first real DDEV runs of the new setup paths: `node tools/compare/setup.mjs 3093378-latest` (records the contrib modules) and the reset above.
- **Open decisions:** the 50% prompt target (comment compaction caps at 48.5%); push the commits for review?
- **Not measured yet:** `code-map` and the smaller `AGENTS.md` in a real desktop session (`node scripts/session-usage.mjs`: `firstCtx` baseline 78k to 81k; `--sequences` baseline in `reports/ai-usage/phase-2/`; `node scripts/context-size.mjs` 28.6k).
- **Rollback:** revert this slice's commit.
