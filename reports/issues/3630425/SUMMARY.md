# #3630425: empty multi-value actions header in Default Admin

[Issue](https://www.drupal.org/project/drupal/issues/3630425) | [MR !17421](https://git.drupalcode.org/project/drupal/-/merge_requests/17421) | [MR !17622](https://git.drupalcode.org/project/drupal/-/merge_requests/17622)

Registered comparisons: `3630425-pinned`, `3630425-mr17622` and `3630425-latest`. Pinned main: `dbfce851242d5b082adb8ed14634b4bc9cce374b`. Default Admin explicitly selected in the recipe. No contributed modules. `3630425-mr-only` keeps the unchanged !17421 diff. `3630425-mr17622` is the preferred proposal: MR !17622 head `090a74cd28aa`, base `555acb124a50`. Its production change is equivalent to !17421, but its evidence must not be attributed to !17421 or to the Lab's main port.

Both proposals add visually hidden Operations text to the previously empty actions-column header. Expect the forms to look the same: inspect the table header, use the viewer's checks, or run the evaluator. Do not interpret a lack of visual difference as an unapplied patch.

Reporter confirmation is in comment #8, responding to the maintainer's Default Admin/main question in comment #7. Independent source inspection agrees. MR !17622 reports one review note; the notes API returned HTTP 401, so its content was not read.

## MR !17622 results (2026-11-26)

Both sites are at `dbfce851242d`; Before is pristine, After has `branches/17622-090a74cd28aa.patch`. Default Admin, the recipe fixture, 1280 px light Chromium. No Article was saved.

| Check | Before | After |
|---|---|---|
| Actions header text | empty | `Operations` (visually hidden) |
| Explicit axe `empty-table-header` | 1 at initial, add and remove | 0 at all three |
| Rows / Remove controls | 3 / 3, 4 / 4, 3 / 3 | 3 / 3, 4 / 4, 3 / 3 |
| Virtual reader header row | bare `columnheader` | `columnheader, Operations` |
| Stable table screenshots | initial and remove pixel-identical; add differs by 9 pixels at 1/255 | same |
| `FormTest::testFieldFormUnlimited` | fails at the MR’s first new assertion, line 289 (`Tests: 2, Assertions: 15, Failures: 1`) | `OK (2 tests, 35 assertions)` |
| Real VoiceOver | not completed | not completed |

The live page has three rows, not the recipe’s two: core renders the two defaults plus one empty unlimited-field row. Adding gives four and removing returns to three. Default Admin also hides the `Order` column (`th.tabledrag-hide`, `display:none`), so the accessibility tree exposes two column headers (field label and actions), while the DOM has three `th` cells. The actions header is the second DOM `th` and the third logical column.

Evidence: [Playwright run](playwright/2026-11-26T12-39-49-645Z-chromium-light-1280x900/SUMMARY.md), [pixel comparison](playwright/2026-11-26T12-39-49-645Z-chromium-light-1280x900/visual-compare.json), [virtual reader run](screenreader/2026-11-26T12-40-34-521Z/SUMMARY.md), [After test log](tests/after.log), [Before test log](tests/before.log).

The first evaluator run at `12-37-56` was superseded: its AJAX screenshots were taken before scroll and focus settled. The stable capture at `12-39-49` is the one used here; the change under test is identical.

Real VoiceOver is **not verified**. The automated attempt from the agent was blocked before any navigation: macOS returned a Safari Automation privilege violation (`-10004`), and the other side timed out. A second attempt from the user’s terminal opened Safari but failed in this lab’s URL setter with `The specified object is a property, not an element` (`-10008`); that helper now uses `document of (first window whose id is N)`. No phrases were recorded in either attempt. Unrelated Safari windows were not closed. A rerun from the terminal is still required; see [the first attempt](screenreader/2026-11-26T12-41-55-214Z/SUMMARY.md) and [the second](screenreader/2026-11-26T12-56-52-891Z/SUMMARY.md).

See REPRODUCE.md for setup, BRANCHES.md for exact patch provenance, EVIDENCE.md for limitations, and CODER-PROMPT.md for generated cloud instructions. The evaluator explicitly enables axe's empty-table-header rule, which is not included by a WCAG-only rule selection.

AI-assisted lab integration; the production change matches the upstream MR; local regression tests are added. Nothing posted or pushed.
