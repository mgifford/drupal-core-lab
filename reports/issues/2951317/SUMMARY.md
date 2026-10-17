# Test required radio groups: #2951317

Prepared for the Lab viewer. **No Drupal browser run has been performed here.**

[Drupal issue](https://www.drupal.org/project/drupal/issues/2951317) · [MR !15536](https://git.drupalcode.org/project/drupal/-/merge_requests/15536)

Compare required radio inputs and dynamic required states, including a selected but hidden `_none` option. Before and After use the same fixture, administrator route, Standard installation, and recipe. The fixture adds test code only; it changes no core rendering or states implementation.

- `2951317-pinned`: core `ad11ba71c0f09b856e45dfdb8db155b5a588712d`, plus the declared stacks.
- `2951317-latest`: same scenario against current core main.
- After adds the unmodified changes from MR branch tip `ab7ab046f920f7a5a29704888976e56b6a36514a`.

Both stacks apply cleanly to the pinned core and to main `dbfce851242d5b082adb8ed14634b4bc9cce374b` (checked October 17, 2026). This establishes patch applicability, not runtime correctness.

Start with [REPRODUCE.md](REPRODUCE.md), or give an agent the generated [CODER-PROMPT.md](CODER-PROMPT.md). The scenario is registered in [variants.json](variants.json). [BRANCHES.md](BRANCHES.md) records provenance. [EVIDENCE.md](EVIDENCE.md) and [COVERAGE.md](COVERAGE.md) distinguish preparation from testing.

The issue and related-issue table were retrieved: [intake brief](intake/BRIEF.md). Review-thread requests for !15536, !3092, and !7341 returned HTTP 401. Their contents are unknown, regardless of the brief's zero-thread count. No completed MR review or approval is claimed.

Not verified: Drupal installation, fixture execution, browser behavior, manual keyboard testing, synthetic or real screen-reader output, JavaScript-disabled static validation, theme changes, contrib compatibility, core PHPUnit tests, or resource measurements.
