# AI usage, Phase 4: a pilot of the whole loop on #3618230 (2026-10-15)

DRAFT until a person has reviewed it. Chosen by the owner ("Go with Phase 4"). Nothing pushed, nothing posted.

## What the pilot did (one issue, existing tools, no new engine)

| Brief step | What happened | Where |
|---|---|---|
| 1 brief and code map | Source-backed brief and code map, so a session starts from two short files | `reports/issues/3618230/pilot/BRIEF.md`, `CODE-MAP.md` |
| 2 same starting state | Own pair built from scratch with the new setup code: variant `3618230-pilot`, recipe `repro_3618230`, MR patch recorded by content. Build 263 s; a no-change rerun 57 s said "patches verified by content" | `reports/issues/3618230/variants.json` |
| 3 baseline failure | Before loses the Hide dismiss button and the `Drupal.announce()` call; After keeps both | `pilot/TESTS-RUN.md`, run `2026-10-15T15-10-35-411Z-chromium-light-1280x900` |
| 4 patch and test | The patch under test is the existing MR !16777 (no product patch was written). The regression test was revised: `testFieldKeepsErrorState` added (4 tests). Patch revision 2 applies at the MR tip | `branches/3618230-tests-messagecommand.patch`, `tests-proposal/` |
| 5 focused checks | `try-tests` 62 s: 2 fail Before and pass After, 2 pass on both (preconditions), PHPCS and PHPStan clean. `lint.mjs` 8 s: PASS. Evaluator run 23 s | `pilot/TESTS-RUN.md`, `lint/2026-10-15-3618230-pilot-after.md` |
| 6 comparison | Evaluator run with real Tab and Enter | `playwright/2026-10-15T15-10-35-...` |
| 7 feedback record | `scripts/feedback.mjs` (new): each item tied to run, patch hashes, source, action, expected, observed | `FEEDBACK.md`, `feedback.json` |
| 8 revision and supersession | Feedback FB-001 answered `met` by run 3 with the revised test patch; run 1 superseded by run 3; run 2 superseded because its check was wrong | `FEEDBACK.md`, `COVERAGE.md` |

## Things that went wrong and what they showed

- Run 2 counted DOM elements to decide whether Enter removed the error. The theme fades a dismissed message out and adds `visually-hidden` instead of removing it, so a working Hide button was reported as not working. Run 3 measures visibility. Run 2 is kept, marked superseded with that reason, and is not counted in coverage.
- Commit 529fe7a left `cloud/variants.json` stale (CI would have failed); `selftest` caught it and it is rebuilt in this commit.
- `code-map` matched the PHP class `Message` for `Drupal.Message`; fixed earlier (JS only for `Drupal.x`).
- The 3618230 coverage matrix defaulted to 480 px, so its 1280 px runs counted as "0 of 7". An explicit 5-row matrix at 1280 px now matches how the evaluator runs (1 of 5 tested).
- The "Other runs" line in `COVERAGE.md` did not show the record mark; fixed in `scripts/coverage.mjs`, with a test and a negative control.

## What is automated, synthetic, and for a person

- **Automated, real input:** Tab to Hide (21 presses After, none found in 60 Before), Enter hides the error, aria-invalid and aria-describedby kept, PHPUnit FunctionalJavascript tests, lint.
- **Synthetic:** channels that carried the error text (After: live region and `Drupal.announce()`; Before: live region).
- **Needs a person:** FB-002 whether focus staying on the faded-out Hide button is acceptable; FB-003 whether a real screen reader speaks the error twice. Both are `needs-person` in the record. Firefox, WebKit, dark mode, forced colours, zoom, a multi-value field and the pinned core were not run.

## Tests

After all edits: 228 of 228 unit tests pass (none skipped) and `node scripts/selftest.mjs` passes (6 ok), re-run after the last commit. The new test's negative control (dropping the record mark) fails it as it should. `selftest` had failed once earlier on the stale `cloud/`, fixed by `build-cloud.mjs`.

## Risks and rollback

- `evaluate-3618230.mjs` has new checks and rows, so earlier runs of that issue are not comparable row for row.
- The tests patch is revision 2; revision 1 is in git history.
- Rollback: revert this commit and 529fe7a. Pilot environments (`baseline-pilot-3618230`, `issue-pilot-3618230`, about 0.6 GB each) are stopped, not deleted.

## Next

The pilot used an MR that already existed. Not shown: authoring a patch where there is none (the brief's Phase 5), and the compact intake and repair of packs (Phases 1 and 2).
