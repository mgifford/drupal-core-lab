# Status: 2026-11-26

Issue: [Drupal #3630425](https://www.drupal.org/project/drupal/issues/3630425)

**Lab assessment: RTBC candidate, pending final independent review.**

## Upstream status

- Last recorded Drupal.org status: Needs work.
- Preferred merge request: [!17622](https://git.drupalcode.org/project/drupal/-/merge_requests/17622), targeting main.
- Tested MR head: `090a74cd28aa448aa506413b02abf5c7935e21a2`.
- MR base: `555acb124a507400d63ad38526b221c0e813bf7d`.
- Earlier [MR !17421](https://git.drupalcode.org/project/drupal/-/merge_requests/17421) targets 11.4.x and contains an equivalent production change.
- Current upstream CI, assignment and review-thread resolution require confirmation.

Comment #10 requested an updated MR targeting main with regression test coverage. MR !17622 addresses these requests.

## Lab evaluation

Completed on 2026-11-26 and merged into the Lab through [PR #110](https://github.com/mgifford/drupal-core-lab/pull/110).

- Comparison: `3630425-mr17622`.
- Core baseline: `dbfce851242d5b082adb8ed14634b4bc9cce374b`.
- Theme: Default Admin.
- Browser: Chromium, light mode, 1280 × 900.
- Before: pristine Core.
- After: exact MR patch, `branches/17622-090a74cd28aa.patch`.

| Check | Before | After |
|---|---|---|
| Actions-column header | Empty | Visually hidden Operations text |
| axe empty-table-header violations | 1 | 0 |
| AJAX addition and removal | Functional | Functional |
| Virtual screen reader | Unnamed column header | Operations column header |
| Regression test | 1 failure | 2 tests, 35 assertions, pass |
| Visual change | Baseline | No meaningful difference |

The results establish that the proposed implementation resolves the reported defect without a meaningful visual regression in the tested environment.

## RTBC readiness

- [x] Original defect reproduced.
- [x] Existing upstream MR evaluated.
- [x] Exact MR revision recorded.
- [x] Regression test fails against pristine Core.
- [x] Regression test passes with the MR applied.
- [x] Accessibility improvement verified programmatically.
- [x] AJAX addition and removal evaluated.
- [x] Visual comparison completed.
- [x] Reproducible evidence published.
- [ ] Confirm current upstream MR revision and CI.
- [ ] Review outstanding MR discussion and related issues.
- [ ] Confirm current issue assignment and recent activity.
- [ ] Complete independent human review.
- [ ] Post reviewed evidence to Drupal.org.

## Limitations

Real VoiceOver testing was attempted but blocked by Safari automation errors. No real screen reader results are claimed. Guidepup virtual screen reader results are synthetic evidence.

GitLab reported one review note on MR !17622, but the discussion API returned HTTP 401. Its content and resolution status remain unverified.

The Lab evidence remains draft until reviewed by a person.

## Recommended next action

Prioritize independent review of MR !17622 rather than develop another patch.

If the current MR matches the tested implementation, CI is satisfactory, and no substantive review concerns remain, recommend RTBC following human review.

Do not attribute the November 26 regression test results to MR !17421 or the separate Lab-authored main port.

## Supporting evidence

- [Summary](SUMMARY.md)
- [Evidence](EVIDENCE.md)
- [Reproduction instructions](REPRODUCE.md)
- [Branch provenance](BRANCHES.md)
- [Regression test: before](tests/before.log)
- [Regression test: after](tests/after.log)
- [Playwright results](playwright/2026-11-26T12-39-49-645Z-chromium-light-1280x900/SUMMARY.md)
- [Virtual screen reader results](screenreader/2026-11-26T12-40-34-521Z/SUMMARY.md)
- [Drupal.org comment draft](ISSUE-COMMENT-DRAFT.md)

## Historical status: 2026-10-16

The issue was postponed pending maintainer information and tagged Needs tests. Comment #7 asked whether the defect affected main and Default Admin; comment #8 confirmed that it did.

MR !17421 was open against 11.4.x. The Lab had prepared a pinned main comparison but had not recorded runtime results. Review-thread access was blocked by HTTP 401.

This historical assessment is superseded by the November 26 evaluation.

AI-assisted status assessment. No Drupal.org status change is claimed.# Status: 2026-10-16

Drupal issue: Postponed (maintainer needs more info), Needs tests. Comment #7 asks about main / Default Admin; comment #8 answers yes. MR !17421 is open against 11.4.x. The lab tests the same patch against pinned main. No live run has been recorded here. Review-thread API inaccessible (HTTP 401).
