# #3545814: Exposed filters with exposed operators are missing accessible names

**DRAFT.** Automated evidence recorded 2026-11-27; no person has reviewed it and no real screen reader was run. This is the entry point for the issue.

Issue: https://www.drupal.org/project/drupal/issues/3545814  
Merge request: [!13201](https://git.drupalcode.org/project/drupal/-/merge_requests/13201) (`3545814-numeric-filter-value-field-missing-name`)  
Status snapshot: [STATUS-2026-11-27.md](STATUS-2026-11-27.md)

## Summary

Reported problem: when a Views exposed filter also exposes its operator, the value control loses its accessible name. The ticket started with the numeric filter; comment #8 showed the same for content type and taxonomy filters, and comment #15 said the fix was general.

The merge request does two things. It stops `FilterPluginBase::buildExposedForm()` from unsetting the value element's `#title` when the operator is exposed, and hides that label with `#title_display => 'invisible'` instead. It also gives the numeric filter's single-value field a `Value` title.

**Lab result (DRAFT):** the defect is reproduced and the MR removes it for all three reported filter types. Before, three value controls have no accessible name and axe reports `label` 1 + `select-name` 2. After, they are named `Value`, `Content types` and `Select terms from vocabulary Tags`, and axe reports 0. Filter results, the operator names, the fieldset legends and the second numeric filter with a fixed operator are unchanged.

**One visual regression in the MR alone:** the numeric field gains a *visible* `Value` label and its fieldset grows by 18 px (353×238 to 353×256 in the run's screenshots). The MR's own comment says "Hide label when operator is exposed", and the issue summary says "Visually, no changes". Proposal C is a one-line follow-up in `NumericFilter::valueForm()` that sets `#title_display => 'invisible'` when the operator is exposed (and `'before'`, the Form API default, in the filter configuration form). It keeps the accessible name, removes the visible label and leaves the configuration form unchanged. The patch was **recorded in the Lab on 2026-11-27**: the numeric label renders `visually-hidden` with accessible name `Value`, axe reports 0, the numeric fieldset is back to the Before height (353×238), the filter configuration form is identical to Before, and every other result matches the MR run. (A first draft used `NULL`, which would have hidden the configuration form's label; it was corrected before the run.)

## Recommendation

**Needs work on the MR as published.** The candidate for **Needs review** is the MR plus proposal C plus the test interdiff.

Why the MR alone is not ready for review:

- It fixes the defect, but adds a visible `Value` label and 18 px of height to the numeric filter, while the issue summary says "Visually, no changes" and the MR's own comment says "Hide label when operator is exposed".
- It removes the Nightwatch test without adding replacement coverage, which is exactly what comments #16 and #20 object to.

Why the MR + C + tests is the review candidate:

- The reported defect and the comment #8 cases are reproduced on the MR's base and fixed by the MR; computed accessible names, not only axe, confirm it.
- The proposed PHPUnit assertions fail on Before and pass on After, and also pass on proposal C (two existing functional test classes; no new Nightwatch test).
- The fixed-operator filter and all tested submissions are unchanged.
- Each patch applies to its declared starting tree; the test interdiff and the corrected proposal C also apply at the MR tip, and the stacked proposal applies to core `main` `8a7df6cc` (checked 2026-11-27; `main` moves daily).

What still blocks RTBC:

- Proposal C is recorded in five Lab environments: Chromium light, Chromium dark, Chromium forced colours, Chromium at 480 px and WebKit. All are `reproduced-and-fixed` with 0 judged rows out of expectation.
- Firefox has no recorded run (launch crashes on this host); no synthetic Guidepup/tree-diff speech was produced; the wider related test classes were not run.
- The MR's latest pipeline passed **with warnings**; one `PHPUnit Unit (Component): [8.6-ubuntu]` job failed. The combined revision has no CI run.
- No person has done an independent keyboard and screen-reader pass; this Lab run is synthetic.
- Date, string, boolean, multiple-value and grouped exposed filters were not exercised (see [FILTER-MATRIX.md](FILTER-MATRIX.md)).

## Decision needed

The MR and proposal C both work; the open choice is whether the numeric `Value` label should be visible (the MR) or visually hidden (C, which matches the issue summary and the MR's own comment). [ISSUE-COMMENT-DECISION.md](ISSUE-COMMENT-DECISION.md) is the short question for the author; [NEXT-STEPS.md](NEXT-STEPS.md) has both paths. Nothing has been posted.

## Files and links

| What | Where |
|---|---|
| How to reproduce, build and run | [REPRODUCE.md](REPRODUCE.md) |
| Evidence, revisions, accessible names, behavioural results | [EVIDENCE.md](EVIDENCE.md) |
| Filter and operator coverage, with the untested rows | [FILTER-MATRIX.md](FILTER-MATRIX.md) |
| Human testing checklist | [TESTING-CHECKLIST.md](TESTING-CHECKLIST.md) |
| Draft comment (do not post) | [ISSUE-COMMENT-DRAFT.md](ISSUE-COMMENT-DRAFT.md) |
| MR snapshot (immutable) | [`branches/3545814-numeric-filter-value-field-missing-name.patch`](branches/3545814-numeric-filter-value-field-missing-name.patch) · [BRANCHES.md](BRANCHES.md) |
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
| What remains, with the commands | [NEXT-STEPS.md](NEXT-STEPS.md) |

## Revisions

| | |
|---|---|
| Core, both sides | `87de7098664fd7bb741f51d47ec750ab0a178c5a` (2026-07-25) |
| MR head | `d7e538c35ac3526ba1a0e0e8a441586f57bba312` (2026-07-26) |
| Current core main checked | `8a7df6cc3e69b6b5d427cb25ce8f66dda8393c29` (2026-11-27; timestamped check, content moves daily) |
| Variants | `3545814-pinned`, `3545814-proposal-c`, `3545814-latest` (registered, not built) |

## Not verified

- Real screen reader, a person's keyboard pass, Firefox (launch crashed; recorded as blocked), touch, translation, subdirectory install.
- A Chromium light run against the current recipe (only stale runs exist); synthetic Guidepup/tree-diff speech (not produced).
- Date, string, boolean, multiple-value, grouped filters and an exposed filter block.
- The failed component unit CI job was not investigated.
