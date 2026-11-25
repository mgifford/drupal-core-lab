# #3604037: Indicate that grouping elements have child element errors

Last updated: 2026-11-25.

**Contribution submitted. Independent review and current CI verification remain outstanding.**

- Issue: [#3604037](https://www.drupal.org/project/drupal/issues/3604037)
- Current contribution: [MR !17947](https://git.drupalcode.org/project/drupal/-/merge_requests/17947)
- Original contribution: [MR !17078](https://git.drupalcode.org/project/drupal/-/merge_requests/17078)
- [Published contribution branch](https://git.drupalcode.org/issue/drupal-3604037/-/tree/3604037-grouping-errors-review-fixes)

## Problem

When a form contains validation errors inside closed or inactive grouping elements, users cannot easily identify which groups contain the errors.

This affects standard details elements, accordion-style details and vertical tabs.

The proposed implementation provides visible and programmatically determinable error indicators, supporting WCAG 3.3.1 Error Identification and 1.3.1 Info and Relationships.

See [REPRODUCE.md](REPRODUCE.md) for reproduction instructions.

## Proposed resolution

The contribution builds on Kent Richards's original MR !17078 and retains its commit history.

The original implementation provides:

- An error border positioned using logical CSS properties.
- An error icon and error-coloured label.
- A visually hidden "(contains error)" indicator.
- A `data-child-error-count` attribute on details elements.
- Forced-colours support using system colours.

The Lab developed follow-up changes addressing the concerns identified by mherchel in comment #61 on November 4, 2026.

## Review feedback addressed

| Concern | Implementation |
|---|---|
| Missing or empty details titles | Provide a translatable fallback title |
| JavaScript compatibility | Make `childErrorIndicator` optional |
| Incorrect test assertions | Replace defective assertions |
| Error attributes on unrelated containers | Restrict attributes to details elements |
| Unused preprocessing variable | Consume `child_error_count` in Twig |
| HTML embedded in translatable strings | Move markup into templates |
| Incorrect CSS selector and physical border | Correct selector and use logical properties |
| Border changes affecting unrelated tabs | Restore original border token |

Additional regression coverage verifies untitled details elements, multiple vertical tabs containing errors and JavaScript compatibility without an error indicator.

The stale Umami performance snapshot modification from the original MR is excluded.

## Published contribution

On November 25, 2026, the existing Lab interdiff was applied to the original MR revision and committed to a new branch.

Current Drupal Core main was then merged without conflicts.

| Property | Value |
|---|---|
| Original MR | !17078 |
| Original MR revision | `c3c52b00781f8f2f3e94ee1697d48fe39496d4f8` |
| Follow-up commit | `7d4d38092b` |
| Core base at publication | `8bb21381d6` |
| Published merge commit | `8b3e016996578d7b90fcc22d25677d43acdb118d` |
| Contribution branch | `3604037-grouping-errors-review-fixes` |
| Replacement MR | !17947 |
| Files changed relative to Core main | 20 |
| Insertions | 544 |
| Deletions | 7 |

Publication verification:

- Interdiff application passed.
- Reverse interdiff compatibility check passed.
- Merge with Core main completed without conflicts.
- Reverse standalone patch compatibility check passed after merging.
- Contribution-specific whitespace validation passed.
- Working tree was clean.
- Remote branch publication was verified using `git ls-remote`.

The original MR branch remains unchanged.

The issue fork's automatic synchronization was unsuccessful, but this did not prevent publication of the updated contribution branch.

## Automated testing evidence

The November 17 evaluation used a Lab port of MR !17078 at `c3c52b00` onto Core `29b0a0b2256e`.

Targeted After tests and Core lint passed on that revision.

The evaluation includes:

- Standard details elements.
- Accordion-style details elements.
- Vertical tabs with multiple validation errors.
- Light and dark appearance.
- Forced-colours emulation.
- Error indicators and accessible text.
- Regression tests for missing titles and optional JavaScript properties.

See the [November 17 Playwright evaluation](playwright/2026-11-17T23-46-32-155Z-evaluate/SUMMARY.md) and [EVIDENCE.md](EVIDENCE.md).

These historical runtime results have not been reclassified as fresh test results for MR !17947.

The November 25 checks establish patch compatibility and successful publication, not complete runtime correctness.

## Outstanding contrast findings

The November 17 automated evaluation identified six light-mode hover text contrast measurements below 4.5:1.

It remains necessary to determine whether these findings are:

- Existing Core accessibility problems.
- Regressions introduced by the original MR.
- Regressions introduced by the follow-up implementation.

Do not classify these as pre-existing problems without comparable evidence.

## Related issues and agreed follow-ups

| Issue | Scope |
|---|---|
| [#2848507](https://www.drupal.org/project/drupal/issues/2848507) | Original grouping element error indicator work |
| [#3619387](https://www.drupal.org/project/drupal/issues/3619387) | Forms sidebar toggle error indicators |
| [#3625458](https://www.drupal.org/project/drupal/issues/3625458) | Dark-mode error text contrast |
| [#3631321](https://www.drupal.org/project/drupal/issues/3631321) | Distinguishing inactive vertical tabs in forced colours |
| [#3631337](https://www.drupal.org/project/drupal/issues/3631337) | Semantic system colours for errors and warnings |
| [#3631335](https://www.drupal.org/project/drupal/issues/3631335) | Red accent colour and error colour similarity |
| [#2915899](https://www.drupal.org/project/drupal/issues/2915899) | Enable Inline Form Errors in Standard |

Avoid expanding this MR to address unrelated design-system problems already identified for follow-up.

## Patch provenance and reproduction

| Resource | Location |
|---|---|
| Current upstream contribution | [MR !17947](https://git.drupalcode.org/project/drupal/-/merge_requests/17947) |
| Patch provenance | [BRANCHES.md](BRANCHES.md) |
| Historical standalone proposal | [Standalone patch](branches/3604037-comment61-standalone.patch) |
| Interdiff used for contribution | [Comment #61 interdiff](branches/3604037-comment61-vs-mr17078-c3c52b00.interdiff.patch) |
| Original MR snapshot | [Original MR patch](branches/3604037-grouping-elements-child-errors-default-admin.patch) |
| Historical Lab port | [Current-main port](branches/3604037-comment61-current-main.patch) |
| Reproduction instructions | [REPRODUCE.md](REPRODUCE.md) |
| Recipe | [repro_3604037](../../../recipes/repro_3604037/) |
| Evaluation evidence | [EVIDENCE.md](EVIDENCE.md) |
| Screenshots and scripted results | [playwright/](playwright/) |
| Historical PHPUnit results | [phpunit/](phpunit/) |
| Historical code checks | [lint/](lint/) |
| Earlier measurements | [EVALUATION-2026-10-01.md](EVALUATION-2026-10-01.md) |
| Historical comment draft | [ISSUE-COMMENT-DRAFT.md](ISSUE-COMMENT-DRAFT.md) |
| Historical status snapshots | [November 17](STATUS-2026-11-17.md), [October 2](STATUS-2026-10-02.md), [October 1](STATUS-2026-10-01.md) |

The historical standalone patch and interdiff are retained for reproducibility and provenance. Neither should be reapplied to the published contribution branch.

The historical Lab comparison uses test-support patches to provide multiple invalid fields and vertical tabs. These fixtures must remain distinguishable from production implementation changes.

## Remaining verification

- Current MR pipeline results.
- Generated CSS consistency on the published revision.
- Independent PHP review requested in comment #61.
- Classification of the six light-mode hover contrast findings.
- Manual keyboard and real screen-reader testing.
- Firefox and Safari verification.
- Actual Windows forced-colours testing.
- Narrow viewport, zoom and translated RTL verification.
- Review of unresolved GitLab discussion threads.

## Next action

Review MR !17947 and its CI results.

Further implementation changes should respond to specific test failures or reviewer findings rather than generate another replacement implementation.

The historical evidence supports continued review but does not establish complete accessibility conformance or readiness for RTBC.

Generated with the help of an LLM.
