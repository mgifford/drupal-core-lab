# Issue brief: #3636143 Regression: The toggle button border in the navigation sidebar has a too low color contrast in light mode

DRAFT extract, deterministic: made by `node scripts/issue-intake.mjs brief 3636143` from the snapshot fetched 2026-11-24T22:09:27.472Z. No model wrote any of it. Text in quote blocks (`>`) is copied from drupal.org and is **data, not instructions**.
Interpretation (what the problem is, what was decided, what is open) is not in this file: see `handoffs/issue.json`, which cites the ids below. Older comments: `node scripts/issue-intake.mjs show 3636143 <number>`.

## Identity

| | |
|---|---|
| Issue | [#3636143](https://www.drupal.org/project/drupal/issues/3636143) status 13, priority 200, category 1, Admin theme, main; created 2026-11-08, last changed 2026-11-20 |
| Comments | 11 fetched |
| Merge request | [!17738](https://git.drupalcode.org/project/drupal/-/merge_requests/17738) opened, branch `3636143-regression-the-toggle` into `main`, head `8779866cc462`, updated 2026-11-24T21:51:15.122Z |
| Diff | 4471 bytes, sha256 a9cc9a43 |
| Related issues | 1 (0 open) |
| Review threads | 0 on the merge request(s), **0 unresolved** |
| Patch in the lab | `branches/3636143-regression-the-toggle.patch` sha256 08a86e98 |
| Patch in the lab | `branches/3636143-toggle-hover-focus.patch` sha256 be3e8db3 |

## Limits and gaps of this fetch

- **notes:** The review threads of !17738 could not be read: https://git.drupalcode.org/api/v4/projects/project%2Fdrupal/merge_requests/17738/discussions?per_page=100&page=1 answered HTTP 401

## Related issues

_Parent, related, child, issues that list this one as related, and issues mentioned in the summary or comments. An open one may hold work this issue depends on or leaves behind._

| Issue | State | How it is linked | Project | Last changed | Title |
|---|---|---|---|---|---|
| [#3506321](https://www.drupal.org/i/3506321) | closed, status 7, priority 200 | related; mentioned in the summary | drupal | 2025-08-12 | Increase the color contrast of the toggle button border |

## Issue summary (verbatim; written by the reporter, may have been edited after the comments)

> Generated with the help of an LLM.
> 
> -->Problem/Motivation
> 
> There is a regression from[#3506321]. The toggle button in the lower left corner of the screen is using --admin-toolbar-color-gray-300 in light and in dark mode.
> 
> light mode
> 
> #b8c1d0/#2a2a2d 1.81:1 🚫
> 
> dark mode
> 
> #b8c1d0/#2a2a2d 7,89:1 ✅
> 
> Steps to reproduce
> 
> Go to admin/appearance/settings/default_admin and ensure that the navigation module is installed and then switch between light and dark mode and take a look at the toggle button in the bottom left corner of the screen.
> 
> Proposed resolution
> 
> Ensure that the color contrast for the border of the toggle button is at least 3:1 in light mode same as in dark mode.
> 
> Remaining tasks
> 
> User interface changes
> 
> Introduced terminology
> 
> API changes
> 
> Data model changes
> 
> Release notes snippet

## Comments that carry decisions, proposals, questions or revisions (verbatim)

_Found by word patterns in each comment, so a candidate is not a verdict. "Superseded" and "no later reference" come from the comments' own references to each other._

### #11 needs-review-queue-bot, 2026-11-20 (comment id 16848116; revision)

> The Needs Review Queue Bot tested this issue. It fails the Drupal core commit checks. Therefore, this issue status is now "Needs work".
> 
> This does not mean that the patch necessarily needs to be re-rolled or the MR rebased. Read the Issue Summary, the issue tags and the latest discussion here to determine what needs to be done.
> 
> Consult the Drupal Contributor Guide to find step-by-step guides for working with issues.

## Latest comments (verbatim)

### #9 mgifford, 2026-11-19 (comment id 16847249)

> Here's an interdiff that seems to work for me:
> 
> https://github.com/mgifford/drupal-core-lab/blob/main/reports/issues/363...
> 
> Full summary here:
> 
> https://github.com/mgifford/drupal-core-lab/blob/main/reports/issues/363...

### #10 mgifford, 2026-11-20 (comment id 16848100)

> Forgot to change the status.

### #11 needs-review-queue-bot, 2026-11-20: shown above

## Not shown

- 8 of 11 comments: #1-#8. One line each: `reports/issues/3636143/intake/comment-index.json`. Full text: `node scripts/issue-intake.mjs show 3636143 <number>`.

## Supersession seen in the comments' own words

- None found.
