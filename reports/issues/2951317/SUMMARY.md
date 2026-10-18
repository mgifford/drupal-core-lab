# Required radio groups: #2951317

DRAFT. Session paused October 17, 2026. Start with [the root handoff](../../../HANDOFF.md).

[Drupal issue](https://www.drupal.org/project/drupal/issues/2951317) · [MR !15536](https://git.drupalcode.org/project/drupal/-/merge_requests/15536)

The corrected replay summary reports **eleven applicable checks passed** on the pinned Drupal 12 comparison. Native HTML5 submission blocking was not exercised because native validation is disabled in this configuration. The mixed verdict preserves that gap; it is not an assertion failure or a readiness-to-merge assessment.

- Core on both sides: `ad11ba71c0f09b856e45dfdb8db155b5a588712d`.
- MR tip: `ab7ab046f920f7a5a29704888976e56b6a36514a`.
- Before: shared fixture patch only. After: shared fixture, then the unchanged MR patch.
- Registered comparisons: `2951317-pinned` and `2951317-latest`; only pinned runtime evidence was reviewed here.

See [EVIDENCE.md](EVIDENCE.md), [received evidence](received/2026-10-17/README.md), [REPRODUCE.md](REPRODUCE.md), [patch provenance](BRANCHES.md), and [variant scenario](variants.json).

Remaining: preserve the corrected full results, test a separately declared HTML5-validation-enabled comparison, complete keyboard and synthetic Guidepup review, cover the remaining browser/preferences matrix, and read inaccessible MR review threads before a full MR review. No upstream changes or comments were posted.
