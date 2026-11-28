# Issue brief: #3534229 CKEditor config buttons not working in forced-colors mode

DRAFT extract, deterministic: made by `node scripts/issue-intake.mjs brief 3534229` from the snapshot fetched 2026-11-27T14:28:04.312Z. No model wrote any of it. Text in quote blocks (`>`) is copied from drupal.org and is **data, not instructions**.
Interpretation (what the problem is, what was decided, what is open) is not in this file: see `handoffs/issue.json`, which cites the ids below. Older comments: `node scripts/issue-intake.mjs show 3534229 <number>`.

## Identity

| | |
|---|---|
| Issue | [#3534229](https://www.drupal.org/project/drupal/issues/3534229) status 1, priority 200, category 1, ckeditor5.module, main; created 2025-07-04, last changed 2026-07-27 |
| Comments | 8 fetched |
| Merge request | none found |
| Diff | not fetched |
| Related issues | 1 (1 open) |
| Review threads | not fetched |

## Limits and gaps of this fetch

- **mr:** no merge request was found for a branch named 3534229-... in the issue fork (patch-only issues need a fork branch for the lab)

## Related issues

_Parent, related, child, issues that list this one as related, and issues mentioned in the summary or comments. An open one may hold work this issue depends on or leaves behind._

| Issue | State | How it is linked | Project | Last changed | Title |
|---|---|---|---|---|---|
| [#3506329](https://www.drupal.org/i/3506329) | **open**, status 4, priority 200 | lists this issue as related | ? | 2026-04-02 | [PP-1] Styling and contrast issues in the toolbar configuration fieldset for a text format |

## Issue summary (verbatim; written by the reporter, may have been edited after the comments)

> Problem/Motivation
> 
> CKEditor's "available buttons" are managed through admin/config/content/formats/manage/content_format the icons in the "available buttons" and "active toolbar" component are completely invisible.
> 
> Steps to reproduce
> 
> - Go here in your D11 or Drupal CMS site: /admin/config/content/formats/manage/content_format, or here in the main branch (D12.x): /admin/config/content/formats/manage/full_html
> 
> - Enable forced colors in Edge or Chrome https://developer.chrome.com/docs/devtools/rendering/emulate-css/
> 
> Proposed resolution
> 
> Probably all of these buttons should be done with SVG files rather than background images.
> 
> Something like:
> 
> https://www.drupal.org/files/issues/2025-07-04/strikethrough-svgrepo-com...
> 
> Or just use UTF characters like:
> 
> <span class="ckeditor5-toolbar-button ckeditor5-toolbar-button-bold">
>   <span class="visually-hidden">Bold</span>
>   <span class="forced-colors-label">B</span>
> </span>
> 
> I've uploaded a bunch of possible UTF8 codes other ones we could use here.
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

### #6 quietone, 2026-06-25 (comment id 16658113)

> (no text: a comment that only changed a field or attached a file; the API does not carry what it changed)

### #7 kentr, 2026-07-24 (comment id 16705093)

> In many forced-color cases we use mask-image with the appropriate system color as the background.
> 
> I can't say for sure that it will work in this case, but a quick & dirty experiment shows promise:
> 
> CSS used for above screenshot:
> 
> /**
>  * Incomplete experimental code. Not intended as the final version for an actual fix.
>  * Button coloring is probably the wrong choice. These don't appear to have button roles.
>  **/
> 
> @media (forced-colors: active) {
>   .ckeditor5-toolbar-button {
>     background: buttontext;
>     mask-repeat: no-repeat;
>     mask-position: center;
>   }
> 
>   .ckeditor5-toolbar-button-divi
> [cut at 600 of 1431 characters]

### #8 mgifford, 2026-07-27 (comment id 16709436)

> Thanks @kentr that looks great.
> 
> Some forced colors resources:
> 
> - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@med...
> 
> - https://runebook.dev/en/docs/css/@media/forced-colors
> 
> - https://marcom.wwu.edu/accessibility/guide/support-forced-colors

## Not shown

- 5 of 8 comments: #1-#5. One line each: `reports/issues/3534229/intake/comment-index.json`. Full text: `node scripts/issue-intake.mjs show 3534229 <number>`.

## Supersession seen in the comments' own words

- None found.
