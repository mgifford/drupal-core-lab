# Handoff: AI usage reduction, after Phase 2 (option B) (2026-10-15)

Resume from this file. Evidence: [RESULTS.md](RESULTS.md); earlier: [../phase-1/HANDOFF.md](../phase-1/HANDOFF.md), [../phase-0/FINDINGS.md](../phase-0/FINDINGS.md).

- **Repository:** branch `claude/unruffled-lewin-d2de0a`; Phase 1 commit `b4ae1f1`; the Phase 2 commit is the one that adds `reports/ai-usage/phase-2/`. Nothing pushed.
- **Phase done:** 2, option B. Finding first: no repeated lab-command sequence is worth wrapping (best 0.49% of input-side tokens; top ten at most 3.9%). The one repeating pattern is locate-then-read (16.9% of calls, 12.3% of input-side tokens; ceiling 8.2% if every chain of 3 became 1).
- **Built:** `scripts/code-map.mjs` (one call: definition, body, calls, users, tests, or a file outline), `scripts/code-map-benchmark.mjs`, `session-usage.mjs --sequences`, `tests/lab/code-map.test.mjs` (9), one test added to `ai-usage.test.mjs`, one `AGENTS.md` line.
- **Measured:** 6 fixed lookups in `baseline-3618230-latest` @3b94128e929: calls 15 to 6, bytes 31,061 to 16,197 (modelled manual chain; calls by construction). 196 tests, 195 pass, 1 skipped (Playwright); selftest passes; two negative controls.
- **Not measured:** the saving in a real session. No recorded session used `code-map`. The next session that does lets us compare: `node scripts/session-usage.mjs --sequences` against the baseline in RESULTS.md (exploration 16.9% of calls, 12.3% of tokens; `grep -> sed` 5 times, `ls -> cat` 4 times).
- **Confirmed decisions:** Phases 0 to 2 follow the order the owner chose (slice A, then B); one sequential agent; no wrapper for lab-command sequences.
- **Still open for the owner:** (1) the 50% prompt target (comment compaction caps at 48.5%); (2) next phase. Options: **C** scope the starting context (the owner's skill and plugin list, plus splitting `AGENTS.md` and `AI-LEARNING.md`; measure first-call context, currently 69k to 81k tokens, 18 to 40% of reading); **Phase 3 remainder** (contrib patch identity, dirty-baseline blocking, recipe identity, `-latest` visibility, stale runs in coverage); the brief's compact intake and repair phases (small token effect at 2 packs).
- **Next action if C:** first measure what the harness injects per session with `node scripts/session-usage.mjs` plus the attachment sizes in Phase 0 FINDINGS section 2 (skill listing about 33.7 KB, the largest single block), then propose the scoped list to the owner; the list is user-level configuration, so it is the owner's change.
- **Rollback of Phase 2:** revert its commit.
