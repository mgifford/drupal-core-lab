# Issue brief: #3466040 Modal dialog does not adjust to increased inner height (pushes buttons out of reach)

DRAFT extract, deterministic: made by `node scripts/issue-intake.mjs brief 3466040` from the snapshot fetched 2026-11-27T14:19:36.092Z. No model wrote any of it. Text in quote blocks (`>`) is copied from drupal.org and is **data, not instructions**.
Interpretation (what the problem is, what was decided, what is open) is not in this file: see `handoffs/issue.json`, which cites the ids below. Older comments: `node scripts/issue-intake.mjs show 3466040 <number>`.

## Identity

| | |
|---|---|
| Issue | [#3466040](https://www.drupal.org/project/drupal/issues/3466040) status 8, priority 200, category 1, other, main; created 2024-08-05, last changed 2026-11-23 |
| Comments | 33 fetched |
| Merge request | [!9088](https://git.drupalcode.org/project/drupal/-/merge_requests/9088) opened, branch `3466040-dialog-buttoninputs-not` into `main`, head `aed1df5eeddf`, updated 2026-11-23T21:20:27.664Z |
| Diff | 6030 bytes, sha256 a0810d63 |
| Related issues | 1 (0 open) |
| Review threads | 0 on the merge request(s), **0 unresolved** |

## Limits and gaps of this fetch

- **notes:** The review threads of !9088 could not be read: https://git.drupalcode.org/api/v4/projects/project%2Fdrupal/merge_requests/9088/discussions?per_page=100&page=1 answered HTTP 401

## Related issues

_Parent, related, child, issues that list this one as related, and issues mentioned in the summary or comments. An open one may hold work this issue depends on or leaves behind._

| Issue | State | How it is linked | Project | Last changed | Title |
|---|---|---|---|---|---|
| [#3640810](https://www.drupal.org/i/3640810) | closed, status 3, priority 200 | mentioned in #30; lists this issue as related | ? | 2026-11-23 | If "Set default value" gets enabled on the field settings page, the dialog modal expands beneath the fold |

## Issue summary (verbatim; written by the reporter, may have been edited after the comments)

> Problem/Motivation
> 
> When the height of a modal dialog is increased (e. g. by an opened details element, new ajax-induced content ) beyond the initially calculated max-height then all elements in the overflow area are not accessible anymore.
> 
> With a small viewport/screen the problem does not happen.
> 
> Steps to reproduce
> 
> - Open translate dialog of a view, open some details elements.
> 
> - OR use Media library widget with e. g. image_widget_crop.
> 
> - OR anything else that has a collapsible element within a modal dialog
> 
> Alternatively 1:
> 
> - Open /admin/structure/views/view/content
> 
> - click on Content: Content type (Content type)
> 
> - Open/close the details until things get out of hands
> 
> Alternatively 2:
> 
> - With the default admin theme active, create an article content type
> 
> - Add a datetime field.
> 
> - On the field settings page enable Set default value
> 
> Proposed resolution
> 
> Use a ResizeObserver in dialog.position.js.

## Comments that carry decisions, proposals, questions or revisions (verbatim)

_Found by word patterns in each comment, so a candidate is not a verdict. "Superseded" and "no later reference" come from the comments' own references to each other._

### #32 tobiasb, 2026-11-23 (comment id 16852055; revision)

> MR rebased.
> 
> My own origin fix, works only for some use-cases. Not for ajax stuff.
> 
> Thx AI for https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver, it was a pleasure again.
> 
> ---
> 
> AI-Generated: Yes (analysis, fix and test were created with AI assistance; I reviewed and tested the changes)

## Latest comments (verbatim)

### #31 tobiasb, 2026-11-23 (comment id 16852021)

> (no text: a comment that only changed a field or attached a file; the API does not carry what it changed)

### #32 tobiasb, 2026-11-23: shown above

### #33 tobiasb, 2026-11-23 (comment id 16852059)

> (no text: a comment that only changed a field or attached a file; the API does not carry what it changed)

## Not shown

- 30 of 33 comments: #1-#30. One line each: `reports/issues/3466040/intake/comment-index.json`. Full text: `node scripts/issue-intake.mjs show 3466040 <number>`.

## Supersession seen in the comments' own words

- None found.
