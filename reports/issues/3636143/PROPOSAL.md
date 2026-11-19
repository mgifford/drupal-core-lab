# #3636143: patch, interdiff and comment, ready for review

**DRAFT, AI-assisted; a person has not reviewed it.** Nothing here has been posted to drupal.org.

Issue: [#3636143](https://www.drupal.org/project/drupal/issues/3636143). Existing MR: [!17738](https://git.drupalcode.org/project/drupal/-/merge_requests/17738), head `5e5521e4`, base `fea1e49ac3e5` (unchanged since the lab fetched it 2026-11-19). The MR maps the toggle border to `--admin-color-border-input`. This proposal keeps it and adds hover and keyboard-focus emphasis on top.

## What to attach to the issue

| Artifact | File | sha256 | Applies to |
|---|---|---|---|
| Full patch (MR plus enhancement) | [3636143-full-mr-plus-enhancement.patch](proposal/3636143-full-mr-plus-enhancement.patch) | `27db757b…` | core main `92e5c3a30476` and the MR base `fea1e49ac3e5` |
| Interdiff (only our change over MR head `5e5521e4`) | [3636143-interdiff-enhancement-over-mr-5e5521e4.patch](proposal/3636143-interdiff-enhancement-over-mr-5e5521e4.patch) | `515b6a09…` | the MR tree; same changed lines as the lab's [captured patch](branches/3636143-toggle-hover-focus.patch) (`be3e8db3…`) |
| MR patch as fetched, unchanged | [3636143-regression-the-toggle.patch](branches/3636143-regression-the-toggle.patch) | `08a86e98…` | |

Each was checked with `git apply --check` in a scratch worktree at its declared starting tree. The interdiff changes `admin-toolbar.pcss.css` and its compiled `admin-toolbar.css` in the navigation module, the file that holds the toggle's rules.

## Comment

[ISSUE-COMMENT-DRAFT-toggle.md](ISSUE-COMMENT-DRAFT-toggle.md): 133 words, passes `node scripts/check-draft.mjs`. Rewrite it in your own words before posting.

## Evidence and reproduction

- Report with the A, B and C table: [TOGGLE-ENHANCEMENT.md](TOGGLE-ENHANCEMENT.md). Runs: [playwright/](playwright/) (Chromium; light, dark, forced colors, 768px, 480px, RTL, reduced motion). Lint: [lint/](lint/). Coverage: [COVERAGE.md](COVERAGE.md).
- Recipe: none. It is a plain Standard install (Navigation and Default Admin are already enabled), administrator login, at `/admin/appearance/settings/default_admin`.
- Comparison: `node tools/compare/setup.mjs 3636143-latest`, then `node scripts/lab-env.mjs start 3636143-latest`. Before is unmodified main, After is the full patch. The evaluator is `node tools/playwright/evaluate-3636143.mjs 3636143-latest`.
- Not tested: Firefox, WebKit, 200% zoom, a person's keyboard pass, a screen reader, Windows contrast themes. The MR-only comparison (`3636143-pinned`) is not built, and the MR's review threads were unreadable (HTTP 401).
