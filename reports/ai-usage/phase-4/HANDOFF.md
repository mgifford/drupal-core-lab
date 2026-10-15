# Handoff: AI usage reduction, after Phase 4 (2026-10-15)

Resume from this file. Evidence: [RESULTS.md](RESULTS.md). Index: [../README.md](../README.md).

- **Repository:** branch `claude/unruffled-lewin-d2de0a`, 14 local commits ahead of `origin/main` once this one lands; nothing pushed.
- **Done:** the pilot of the whole loop on #3618230 (brief, code map, same starting state, baseline failure, regression test, lint, comparison, feedback record, revision, supersession). New: `scripts/feedback.mjs`.
- **Checked after the last edits:** 228 of 228 unit tests and `node scripts/selftest.mjs` pass. The memory file is updated.
- **Needs a person:** FB-002 (focus after Hide) and FB-003 (double announcement) in `reports/issues/3618230/FEEDBACK.md`.
- **Needs the owner:** `node scripts/lab-env.mjs reset 3618230-latest --yes` and `node tools/compare/setup.mjs 3093378-latest` from the main checkout; one evaluator run per issue to record hashes; decide the 50% prompt target; decide whether to push; approve the project MCP server (`claude mcp list` shows playwright "Pending approval"). Pilot pair is stopped; `node scripts/lab-env.mjs delete 3618230-pilot --yes` frees about 1.2 GB.
- **Follow-up spotted, not fixed:** older COVERAGE.md files print "undefinedpx wide" for runs that recorded no viewport; `lint.mjs` does not check contrib; `reports/issues/3604037/COVERAGE.md` is stale against its generator.
- **Next:** Phases 1 and 2 (compact intake, targeted repair) or Phase 5 (no-MR patch authoring, contrib lint, updating an imported issue).
- **Rollback:** revert this commit and 529fe7a.
