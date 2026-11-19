# #3637339: patch, interdiff and comment, ready for review

**DRAFT, AI-assisted; a person has not reviewed it.** Nothing here has been posted to drupal.org.

Issue: [#3637339](https://www.drupal.org/project/drupal/issues/3637339). Existing MR: [!17818](https://git.drupalcode.org/project/drupal/-/merge_requests/17818), head `8c4a0e70`, base `7480c58b75c0`. The MR makes the skip link follow the configured focus color. The remaining problem is that its outline extends 6px past the top and start viewport edges. This proposal keeps the MR and adds token-derived clearance on top.

## What to attach to the issue

| Artifact | File | sha256 | Applies to |
|---|---|---|---|
| Complete revised patch (MR plus clearance) | [3637339-focus-clearance-full.patch](branches/3637339-focus-clearance-full.patch) | `a5310458…` | clean core `ecb483ff6d4b`, the MR base `7480c58b75c0`, and core main `92e5c3a30476` |
| Interdiff (only the clearance change over MR head `8c4a0e70`) | [3637339-focus-clearance.patch](branches/3637339-focus-clearance.patch) | `ec981f33…` | the MR tree, checked at the MR base and at main |
| MR patch as fetched, unchanged | [3637339-skip-to-main.patch](branches/3637339-skip-to-main.patch) | `d7f7290a…` | |

Verified 2026-11-19 with `git apply --check` in scratch worktrees: the complete patch applies at both bases, and the MR patch followed by the interdiff applies at both.

## Comment

[ISSUE-COMMENT-DRAFT.md](ISSUE-COMMENT-DRAFT.md): 178 words, passes `node scripts/check-draft.mjs 3637339`. Rewrite it in your own words before posting, and replace its relative links. A human-review checklist is in [HUMAN-REVIEW.md](HUMAN-REVIEW.md).

## Evidence and reproduction

- Assessment and measurements: [EVIDENCE.md](EVIDENCE.md), [SUMMARY.md](SUMMARY.md), [COVERAGE.md](COVERAGE.md), runs in [playwright/](playwright/), lint in [lint/](lint/).
- Recipe: none. It is a plain Standard install with Default Admin, administrator login, at `/admin/appearance/settings/default_admin`.
- Comparisons: `3637339-latest` (core vs MR) and `3637339-focus-clearance` (MR vs MR plus clearance), both built by `node tools/compare/setup.mjs <slug>`. The evaluator is `node tools/playwright/evaluate-3637339.mjs <slug>`.
- Combined with #3636143: `3636143-with-skip-focus` (see [that issue's SUMMARY](../3636143/SUMMARY.md)) stacks this proposal on the toggle border MR. Its Before is the toggle site with MR !17738 plus the lab's toggle enhancement, so it is an integration check, not an upstream patch for either issue.
- Not verified: a person's keyboard pass, a screen reader, Windows contrast themes. The MR's review threads were unreadable (HTTP 401).
