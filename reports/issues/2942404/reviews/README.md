# Review integration: #2942404 CI follow-up

**DRAFT, AI-assisted.** Three fresh-context reviewers examined the CI follow-up. This file records
what was accepted and what changed after the reviews. The review files are point-in-time and may
quote the pre-fix patch; the current artefacts and numbers are in
[../CI-FIXES.md](../CI-FIXES.md) and [../BRANCHES.md](../BRANCHES.md).

## Reviews

| Review | Task | Verdict | Disposition |
|---|---|---|---|
| [comment-review.md](comment-review.md) | task-3 | NEEDS EDIT | Accepted. The draft now says the follow-up is unpushed, says warnings **and errors** stay `role="alert"`, names both BigPipe methods, and qualifies the earlier browser/AT evidence. Current draft: 172 words, passes `check-draft`. |
| [perf-review.md](perf-review.md) | task-2 | CONFIRMED with caveats | Accepted. The numbers reproduced. CI-FIXES now records that the CI actuals are reported values with no captured job log, that the per-test delta is `n ×` the compact delta with `n` unmeasured, and that ten other Umami fixtures keep only 122 bytes of margin at the final delta. |
| [diff-review.md](diff-review.md) | task-1 | APPROVE WITH COMMENTS | M1 accepted and fixed; m1 comments fixed; m2 test added; m3 accepted. |

## M1 and the resulting code change

The diff review found that the first optimisation replaced the `WeakMap` ownership record with a
fresh `Drupal.t('System messages')` comparison at clear time. If the translation changed between
add and clear, cleanup would leave the role and name on an empty container, and a later add would
early-return, so the empty landmark could never be removed.

Fix: restore the `WeakMap` that records the assigned `{role, label}`. Keep only the safe
simplifications: one `LIVE` selector constant and a flatter `isMessage` check. Add
`JsMessageTest::testLandmarkNameChange`, which adds a message, changes `Drupal.t()` for the
landmark name, clears, and asserts the region and attributes are gone.

The m1 comment issues are fixed: the `LIVE` comment no longer equates `[aria-live]` with an active
live region; "author-provided" is now "existing"; cleanup is described as leaving both attributes
alone. m3 (marker attribute stripped by another script) is accepted: the `WeakMap` does not depend
on the marker surviving, and no test covers attribute stripping.

## Final numbers after the fix

| Item | Value |
|---|---|
| `message.js` base compact | 2,765 |
| MR head compact | 4,746 (+1,981) |
| Final compact | 4,643 (+1,878) |
| Follow-up saving | 103 compact bytes (5.2%) |
| `ScriptBytes` centres | 189,038 / 62,549 / 156,990 |
| Reported CI residual | +979 / +878 / +211 (all inside 2,000) |
| `JsMessageTest` | 6 tests, 47 assertions |
| Minimal patch | `2942404-ci-fixes.patch`, 6 files, sha256 `14f1f5d3…` |
| Full v2 patch | `2942404-consolidated-full-v2.patch`, 14 files, sha256 `a5cb02b0…` |

## Limits

The reviews were read-only; none ran DDEV, PHPUnit or browser tests. The test counts in the
review files are taken from the reports. The language-change scenario was derived from code and is
now covered by a test, which the root ran. The performance suites still cannot run here (MySQL
required), so the fixture update remains a prediction from the compact delta.
