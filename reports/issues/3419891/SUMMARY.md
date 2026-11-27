# #3419891: Increase size of alternative text field in Image dialog

**DRAFT.** Written 2026-11-26. A person has not reviewed this revision.

Issue: https://www.drupal.org/project/drupal/issues/3419891
MR: https://git.drupalcode.org/project/drupal/-/merge_requests/16984 (head `1931822c77bb`)
Re-pinned evaluation: core `0387fb948f786bc344a5cc54aa0d98b8f552e378` (2026-11-25), CKEditor 5 49.1.0.

## Result

The MR's textarea grows, stops at six rows, stays scrollable and keeps text visible. Two reviewer concerns from comment #21 were re-tested:

| Reviewer concern | Result |
|---|---|
| No scrollbar appears when the textarea is full (Safari/Edge on macOS) | **Characterised, not a defect.** At the cap, `overflow-y` is `auto`, `scrollHeight` 218 > `clientHeight` 134, and the field scrolls (keyboard scrollTop 0→28). This host reports a 0 px scrollbar gutter, i.e. macOS overlay scrollbars that are painted only while scrolling. Content is reachable. |
| Reopening after an accidental outside click shows the saved text but keeps the old height | **Reproduced and fixed.** The MR alone reopens at 136 px with Save enabled on an empty value. A three-file follow-up resets the field before restoring the value: it reopens at 32 px and Save is disabled. |

`reproduced-and-fixed` on Chromium and Playwright WebKit with the follow-up; `reproduced-not-fixed` on the MR alone in both engines. The PHPUnit regression test fails on the MR alone (`136.0 is less than 136.0`) and passes with the follow-up (18 assertions).

## Artifacts

| Path | What |
|---|---|
| [EVIDENCE.md](EVIDENCE.md) | Runs, measurements, lint, regression test, limits. |
| [BRANCHES.md](BRANCHES.md) | MR patch, follow-up patch, consolidated patch, hashes and provenance. |
| [REPRODUCE.md](REPRODUCE.md) | Rebuild and re-run instructions, including the recipe path correction. |
| [SCREENREADER.md](SCREENREADER.md) | Guidepup virtual screen reader results; real VoiceOver not run. |
| [SOURCE-REVIEW.md](SOURCE-REVIEW.md) | CKEditor 5 lifecycle analysis and upstream references. |
| [ISSUE-COMMENT-DRAFT.md](ISSUE-COMMENT-DRAFT.md) | Draft for a person to review and post. |
| [playwright/](playwright/) | Per-run `results.json`, `SUMMARY.md`, screenshots. |
| [screenreader/](screenreader/) | Virtual screen reader transcripts. |
| [lint/](lint/) | Core's CI code checks on the final stack. |

## What changed in the lab

- `3419891-pinned` was re-pinned from `47430c368bbd` to `0387fb948f7`; the MR patch still applies cleanly there.
- `3419891-followup` was added: same baseline, After = MR patch + follow-up patch.
- The recipe moved from `recipes/repro_3419891/config/install/` to `recipes/repro_3419891/config/`. At this core revision a recipe's config is read from its `config/` directory; the old path imported nothing, which only became visible once Standard stopped supplying content types.
- `tools/playwright/evaluate-3419891.mjs` was rewritten (functional requirements, in-memory image fixture, reopen and overflow tests, functional verdict).
- `tools/playwright/screenreader-3419891.mjs` is new.

## Not verified

- Real Safari, real Microsoft Edge, real VoiceOver/NVDA and a person's keyboard pass.
- Actual browser zoom (only a 480x900 viewport run); Firefox.
- Whether the same stale-height behaviour occurs in other CKEditor 5 `TextareaView` users outside Drupal.
