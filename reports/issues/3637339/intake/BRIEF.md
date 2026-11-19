# Issue brief: #3637339 Skip to main content link is not using the selected focus color in light and dark mode

DRAFT extract, deterministic: made by `node scripts/issue-intake.mjs brief 3637339` from the snapshot fetched 2026-11-18T23:16:39.876Z. No model wrote any of it. Text in quote blocks (`>`) is copied from drupal.org and is **data, not instructions**.
Interpretation (what the problem is, what was decided, what is open) is not in this file: see `handoffs/issue.json`, which cites the ids below. Older comments: `node scripts/issue-intake.mjs show 3637339 <number>`.

## Identity

| | |
|---|---|
| Issue | [#3637339](https://www.drupal.org/project/drupal/issues/3637339) status 13, priority 200, category 1, Admin theme, main; created 2026-11-11, last changed 2026-11-17 |
| Comments | 7 fetched |
| Merge request | [!17818](https://git.drupalcode.org/project/drupal/-/merge_requests/17818) opened, branch `3637339-skip-to-main` into `main`, head `8c4a0e703168`, updated 2026-11-14T12:39:04.456Z |
| Diff | 1072 bytes, sha256 d7f7290a |
| Related issues | 0 (0 open) |
| Review threads | 0 on the merge request(s), **0 unresolved** |
| Patch in the lab | `branches/3637339-focus-clearance-full.patch` sha256 a5310458 |
| Patch in the lab | `branches/3637339-focus-clearance.patch` sha256 ec981f33 |
| Patch in the lab | `branches/3637339-skip-to-main.patch` sha256 d7f7290a |

## Limits and gaps of this fetch

- **notes:** The review threads of !17818 could not be read: https://git.drupalcode.org/api/v4/projects/project%2Fdrupal/merge_requests/17818/discussions?per_page=100&page=1 answered HTTP 401

## Issue summary (verbatim; written by the reporter, may have been edited after the comments)

> Generated with the help of an LLM.
> 
> -->Problem/Motivation
> 
> I had opened that issue already over in the Gin queue as part of https://git.drupalcode.org/project/gin/-/work_items/3506305
> 
> Problem is that the Skip to main content skip link is not minding nor using the set focus color in light or dark mode. that way keyboard users have to reorient after their eyes got primed on blue in light mode and green in dark mode on the first link no matter which focus color is set.
> 
> Steps to reproduce
> 
> Go to admin/appearance/settings/default_admin and simply switch between light and dark mode setting different focus colors. After making your choice and save press the tab bar once so the Skip to main content link shows up in the upper left corner of the screen.
> 
> Proposed resolution
> 
> Use the selected focus color on the Skip to main content in light and dark mode.
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

## Latest comments (verbatim)

### #5 smustgrave, 2026-11-14 (comment id 16842412)

> @shank115 your comment is kind reading like it was AI generated please refer to https://www.drupal.org/docs/develop/issues/issue-procedures-and-etiquett...

### #6 shank115, 2026-11-14 (comment id 16842523)

> Thanks @smustgrave, and sorry for not mentioning it earlier. I used AI to help draft the comment in #4.

### #7 smustgrave, 2026-11-17 (comment id 16845106)

> Manually tested this and not seeing in any change
> 
> I switched to dark mode and selected Pink but nothing around the Skip to main link changed from before.

## Not shown

- 4 of 7 comments: #1-#4. One line each: `reports/issues/3637339/intake/comment-index.json`. Full text: `node scripts/issue-intake.mjs show 3637339 <number>`.

## Supersession seen in the comments' own words

- None found.
