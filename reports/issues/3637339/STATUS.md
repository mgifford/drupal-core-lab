# Current status: Drupal 3637339

**DRAFT, AI-assisted.** Local automated assessment finalized 2026-11-18; not RTBC and not submitted upstream.

## Upstream snapshot

- [Drupal issue 3637339](https://www.drupal.org/project/drupal/issues/3637339): Needs work, Normal bug report, Admin theme, main.
- Seven public comments; last issue update 2026-11-17.
- [MR !17818](https://git.drupalcode.org/project/drupal/-/merge_requests/17818): open, branch `3637339-skip-to-main`, tip `8c4a0e70`.
- Read-only status refresh on 2026-11-18 found no change from the saved patch.
- MR discussions returned HTTP 401. Their absence from intake is an access gap, not evidence that no concerns remain.
- Intake retry at `2026-11-18T23:16:39.876Z` found the same MR and comments; discussions still returned HTTP 401.
  The public MR overview was readable, but did not expose discussion text.
- The related Gin work-item summary was read, but its comments and MR discussions were not retrieved.

## Assessment disposition

| Comparison | Result |
|---|---|
| Current core `ecb483ff6d4b` to unchanged MR | Configured outline corrected; 6px top/start overflow remains |
| Original core `7480c58b75c0` to unchanged MR | Same result in all six desktop configurations |
| MR to local clearance follow-up | Measured overflow removed in 19 configuration/environment combinations; navigation preserved within measured scope |

The [summary](SUMMARY.md) identifies which patch to use. The original MR is unchanged.
The [evidence report](EVIDENCE.md) separates reached keyboard states, incomplete WebKit diagnostics, detector output and visual observations.
The [coverage ledger](COVERAGE.md) lists environment gaps; its headline is not an accessibility pass rate.

## Human review still required

- Use [the prepared human review checklist and feedback map](HUMAN-REVIEW.md); all its human result fields remain UNTESTED.
- Inspect the paired focused screenshots and repeat keyboard activation independently.
- Perform the relevant real screen-reader, Windows High Contrast, zoom/reflow and translated-RTL checks.
- Read unavailable upstream review threads before offering the local proposal.
- Review and rewrite the [comment draft](ISSUE-COMMENT-DRAFT.md) before posting.

Owner of the next action: the human contributor/reviewer. The lab has not marked the issue RTBC.
The clearance pair was restarted locally for human review on 2026-11-18; the viewer and both authenticated-site health checks passed.
Publication of the Lab report is separate from upstream submission. No Drupal.org post or issue-fork update has been made.
Process/resource measurement work is deferred until this assessment handoff is accepted; no retrospective GPU, energy or carbon totals are claimed.
