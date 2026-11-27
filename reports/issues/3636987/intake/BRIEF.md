# Issue brief: #3636987 The position of the caret on select elements is shifted in forced color mode

DRAFT extract, deterministic: made by `node scripts/issue-intake.mjs brief 3636987` from the snapshot fetched 2026-11-27T19:00:57.544Z. No model wrote any of it. Text in quote blocks (`>`) is copied from drupal.org and is **data, not instructions**.
Interpretation (what the problem is, what was decided, what is open) is not in this file: see `handoffs/issue.json`, which cites the ids below. Older comments: `node scripts/issue-intake.mjs show 3636987 <number>`.

## Identity

| | |
|---|---|
| Issue | [#3636987](https://www.drupal.org/project/drupal/issues/3636987) status 1, priority 200, category 1, Admin theme, main; created 2026-11-10, last changed 2026-11-20 |
| Comments | 6 fetched |
| Merge request | none found |
| Diff | not fetched |
| Related issues | 1 (1 open) |
| Review threads | not fetched |
| Patch in the lab | `branches/3636987-forced-colors-select-2026-11-20.patch` sha256 966db1af |

## Limits and gaps of this fetch

- **mr:** no merge request was found for a branch named 3636987-... in the issue fork (patch-only issues need a fork branch for the lab)

## Related issues

_Parent, related, child, issues that list this one as related, and issues mentioned in the summary or comments. An open one may hold work this issue depends on or leaves behind._

| Issue | State | How it is linked | Project | Last changed | Title |
|---|---|---|---|---|---|
| [#3636990](https://www.drupal.org/i/3636990) | **open**, status 1, priority 200 | lists this issue as related | ? | 2026-11-10 | The settings for the default admin theme in forced color mode are either broken or unnecessary |

## Issue summary (verbatim; written by the reporter, may have been edited after the comments)

> Generated with the help of an LLM.
> 
> -->Problem/Motivation
> 
> The position and size of the caret on select elements differ between none forced color mode and forced color mode:
> 
> Steps to reproduce
> 
> - Enable forced color mode in for example the microsoft edge devtools. on the rendering tab chose prefers-color-scheme: dark, forced-colors: active, and prefers-contrast:more
> 
> - Go to for example /admin/content and check the select elements
> 
> Proposed resolution
> 
> Ensure that there is no difference in caret size and position between none forced color and forced color mode.
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

### #4 System Message, 2026-11-14 (comment id 16842576)

> Now that this issue is closed, review the contribution record.
> 
> As a contributor, attribute any organization that helped you, or if you volunteered your own time.
> 
> Maintainers, credit people who helped resolve this issue.

### #5 rkoller, 2026-11-14 (comment id 16842683)

> ? the issue was not about the color of the caret but about the position and its size? And looking at it again a few days later, with the latest state of the main branch i also see now two carets again on every select element - i noticed that before but when i created the issue only the small caret was shown. It looks like when ive opened the issue only the small variant was visible while in the short screenrecording i created now both are visible again. (on macos 26 with the latest version of edge)

### #6 mgifford, 2026-11-20 (comment id 16848691)

> I (with mostly AI help) reproduced the duplicate select chevrons in Edge with `forced-colors: active` and dark mode enabled.
> 
> This appears to be a CSS specificity conflict. `.dark-mode .form-element--type-select` (0-2-0) retains Drupal's SVG background while the forced-colors rule restores the browser's native indicator using `appearance: revert`.
> 
> In DevTools, setting `background-image: none !important` removes the duplicate chevron.
> 
> The proposed fix adds `.dark-mode .form-element--type-select` to the existing forced-colors selector list, giving the override sufficient specificity without `!
> [cut at 600 of 1034 characters]

## Not shown

- 3 of 6 comments: #1-#3. One line each: `reports/issues/3636987/intake/comment-index.json`. Full text: `node scripts/issue-intake.mjs show 3636987 <number>`.

## Supersession seen in the comments' own words

- None found.
