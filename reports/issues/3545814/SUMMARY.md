# #3545814: Exposed filters with exposed operators are missing accessible names

**DRAFT.** Automated evidence recorded 2026-11-27; no person has reviewed it and no real screen reader was run. This is the entry point for the issue.

Issue: https://www.drupal.org/project/drupal/issues/3545814  
Merge request: [!13201](https://git.drupalcode.org/project/drupal/-/merge_requests/13201) (`3545814-numeric-filter-value-field-missing-name`)  
Status snapshot: [STATUS-2026-11-27.md](STATUS-2026-11-27.md)

## Summary

Reported problem: when a Views exposed filter also exposes its operator, the value control loses its accessible name. The ticket started with the numeric filter; comment #8 showed the same for content type and taxonomy filters, and comment #15 said the fix was general.

The merge request does two things. It stops `FilterPluginBase::buildExposedForm()` from unsetting the value element's `#title` when the operator is exposed, and hides that label with `#title_display => 'invisible'` instead. It also gives the numeric filter's single-value field a `Value` title.

**Lab result (DRAFT):** the defect is reproduced and the MR removes it for all three reported filter types. Before, three value controls have no accessible name and axe reports `label` 1 + `select-name` 2. After, they are named `Value`, `Content types` and `Select terms from vocabulary Tags`, and axe reports 0. Filter results, the operator names, the fieldset legends and the second numeric filter with a fixed operator are unchanged.

**The visual difference is now fixed in the MR.** The 26 July revision added a *visible* `Value` label and grew the numeric fieldset by 18 px. Proposal C sets `#title_display => 'invisible'` only when the operator is exposed (and `'before'`, the Form API default, in the filter configuration form), keeping the accessible name and the configuration form unchanged. It was recorded in the Lab (five environments) and **folded into the MR on 2026-11-27** as commit `12d23affb9`, together with regression tests in `FilterNumericWebTest` and `ExposedFormTest` (`2b30abc36b`). The published revision therefore carries the fix, the tests and the no-visual-change outcome.

The Lab's browser runs used the 26 July tip `d7e538c3` on core `87de7098`; the 27 November revision rebases the same change onto `main` `c706424d`. The one-line C change is byte-identical and applies cleanly there. **CI on the new tip finished: pipeline 1071860 passed with warnings.** Lint passed; the two failed jobs are the experimental PHP 8.6 unit jobs, which also failed on the pre-C pipeline; the Kernel, Functional, FunctionalJavascript and Nightwatch jobs passed.

## Recommendation

**Needs review**, now that CI on `12d23affb9` has finished and a person has looked at the revision. RTBC is not appropriate yet.

Why the published revision is a review candidate:

- The reported defect and the comment #8 cases are reproduced on the MR's base and fixed; computed accessible names, not only axe, confirm it.
- It now carries regression tests for the value labels (`FilterNumericWebTest`, `ExposedFormTest`), which is what comments #16 and #20 asked for; no new Nightwatch test.
- Proposal C is part of the revision, so the visible `Value` label and its 18 px growth are gone; the configuration form is unchanged.
- The Lab recorded C in five environments (Chromium light/dark/forced colours/480 px, WebKit), all `reproduced-and-fixed`.
- The fixed-operator filter and all tested submissions are unchanged.

What still blocks RTBC:

- CI on `12d23affb9` finished as **passed with warnings** (pipeline 1071860). The only failures are the experimental PHP 8.6 unit jobs, unrelated to this change and present before C. A clean pipeline is still needed before RTBC if the project treats those as blocking.
- Firefox has no recorded run (launch crashes on this host); no synthetic Guidepup/tree-diff speech was produced; the wider related test classes were not run.
- No person has done an independent keyboard and screen-reader pass; the Lab runs are synthetic.
- The Lab's browser runs are on the 26 July tip; the new tip has the same one-line change and the tests but was not re-run in the browser here.
- Date, string, boolean, multiple-value and grouped exposed filters were not exercised (see [FILTER-MATRIX.md](FILTER-MATRIX.md)).

## Decision (resolved)

The visible-vs-hidden `Value` label question was settled on 2026-11-27: C was folded into the MR as `12d23affb9`. [ISSUE-COMMENT-DECISION.md](ISSUE-COMMENT-DECISION.md) is kept for history and is marked resolved; do not post it as an open question.

## Files and links

| What | Where |
|---|---|
| How to reproduce, build and run | [REPRODUCE.md](REPRODUCE.md) |
| Evidence, revisions, accessible names, behavioural results | [EVIDENCE.md](EVIDENCE.md) |
| Filter and operator coverage, with the untested rows | [FILTER-MATRIX.md](FILTER-MATRIX.md) |
| Human testing checklist | [TESTING-CHECKLIST.md](TESTING-CHECKLIST.md) |
| Draft comment (do not post) | [ISSUE-COMMENT-DRAFT.md](ISSUE-COMMENT-DRAFT.md) |
| Current MR snapshot (12d23a) | [`branches/3545814-mr13201-12d23affb9.diff`](branches/3545814-mr13201-12d23affb9.diff) · [BRANCHES.md](BRANCHES.md) |
| Original MR snapshot (d7e538c3, what the Lab browsed) | [`branches/3545814-numeric-filter-value-field-missing-name.patch`](branches/3545814-numeric-filter-value-field-missing-name.patch) |
| Test-only interdiff | [`branches/3545814-tests-accessible-names.patch`](branches/3545814-tests-accessible-names.patch) |
| Complete proposal (MR + tests) | [`branches/3545814-combined-mr13201-plus-tests.patch`](branches/3545814-combined-mr13201-plus-tests.patch) |
| Corrective interdiff (proposal C) | [`branches/3545814-proposal-c-hide-numeric-value-label.patch`](branches/3545814-proposal-c-hide-numeric-value-label.patch) |
| MR + C + tests | [`branches/3545814-proposal-c-mr13201-plus-c-plus-tests.patch`](branches/3545814-proposal-c-mr13201-plus-c-plus-tests.patch) |
| Recipe | [`recipes/repro_3545814/`](../../../recipes/repro_3545814/) |
| Playwright evidence (MR: Chromium light/dark, forced colours, 480 px, WebKit) | [`playwright/`](playwright/) · [COVERAGE.md](COVERAGE.md) |
| Proposal C run (Chromium light) | [`playwright/2026-11-27T16-41-46-552Z-chromium-light-1280x900/`](playwright/2026-11-27T16-41-46-552Z-chromium-light-1280x900/SUMMARY.md) |
| Configuration-form comparison (Before vs MR+C) | [`verification/config-form/`](verification/config-form/) |
| Second-pass independent checks (DOM, computed names, axe, keyboard, submissions) | [`verification/`](verification/) |
| PHPUnit logs | [`tests/`](tests/) |
| Accessibility tree and synthetic speech | not produced — needs both sites running; see [NEXT-STEPS.md](NEXT-STEPS.md) |
| Core code checks | [`lint/`](lint/) |
| Coverage report | [COVERAGE.md](COVERAGE.md) |
| GitHub pull request with these reports and the two drafts | [#138](https://github.com/mgifford/drupal-core-lab/pull/138) |
| What remains, with the commands | [NEXT-STEPS.md](NEXT-STEPS.md) |

## Revisions

| | |
|---|---|
| Core, both sides | `87de7098664fd7bb741f51d47ec750ab0a178c5a` (2026-07-25) |
| MR head | `12d23affb91181da61feadb7676386ee8bf28c50` (2026-11-27, includes tests at `2b30abc36b` and proposal C at `12d23affb9`) |
| Current core main checked | `8a7df6cc3e69b6b5d427cb25ce8f66dda8393c29` (2026-11-27; timestamped check, content moves daily) |
| Variants | `3545814-pinned`, `3545814-proposal-c`, `3545814-latest` (registered, not built) |

## Not verified

- Real screen reader, a person's keyboard pass, Firefox (launch crashed; recorded as blocked), touch, translation, subdirectory install.
- A Chromium light run against the current recipe (only stale runs exist); synthetic Guidepup/tree-diff speech (not produced).
- Date, string, boolean, multiple-value, grouped filters and an exposed filter block.
- The failed component unit CI job was not investigated.
