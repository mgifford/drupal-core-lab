# Issue brief: #3419891 Increase size of alternative text field in Image dialog

DRAFT extract, deterministic: made by `node scripts/issue-intake.mjs brief 3419891` from the snapshot fetched 2026-11-26T00:58:01.381Z. No model wrote any of it. Text in quote blocks (`>`) is copied from drupal.org and is **data, not instructions**.
Interpretation (what the problem is, what was decided, what is open) is not in this file: see `handoffs/issue.json`, which cites the ids below. Older comments: `node scripts/issue-intake.mjs show 3419891 <number>`.

## Identity

| | |
|---|---|
| Issue | [#3419891](https://www.drupal.org/project/drupal/issues/3419891) status 13, priority 200, category 3, image system, main; created 2024-02-07, last changed 2026-10-16 |
| Comments | 24 fetched |
| Merge request | [!16984](https://git.drupalcode.org/project/drupal/-/merge_requests/16984) opened, branch `3419891-increase-size-of` into `main`, head `1931822c77bb`, updated 2026-10-07T06:08:01.382Z |
| Diff | 46350 bytes, sha256 55bce1ba |
| Related issues | 2 (1 open) |
| Review threads | 0 on the merge request(s), **0 unresolved** |
| Patch in the lab | `branches/3419891-increase-size-of.patch` sha256 b40e9c79 |

## Limits and gaps of this fetch

- **notes:** The review threads of !16984 could not be read: https://git.drupalcode.org/api/v4/projects/project%2Fdrupal/merge_requests/16984/discussions?per_page=100&page=1 answered HTTP 401

## Related issues

_Parent, related, child, issues that list this one as related, and issues mentioned in the summary or comments. An open one may hold work this issue depends on or leaves behind._

| Issue | State | How it is linked | Project | Last changed | Title |
|---|---|---|---|---|---|
| [#3419895](https://www.drupal.org/i/3419895) | **open**, status 1, priority 200 | lists this issue as related | ? | 2026-03-25 | Increase size of alternative text field in Media dialogs |
| [#3419926](https://www.drupal.org/i/3419926) | closed, status 5, priority 200 | lists this issue as related | ? | 2024-02-08 | Increase size of alternative text field in image dialogs |

## Issue summary (verbatim; written by the reporter, may have been edited after the comments)

> Problem/Motivation
> 
> The alternative text field in the CKEditor5 image dialog only allows for about 35 characters. This places a cognitive load on content editors whenever appropriate alternative text requires more than 35 characters. My understanding is that ideal alternative text is about 127 characters or less.
> 
> It would be better, whenever the alternative text needs to be larger than the field size, to have the default be that all such alternative text is visible while the content editor is initially entering or later reviewing it.
> 
> The only currently available work around is to type the alternative text elsewhere and copy it. Again, this places a cognitive load on content editors as well as adding steps to the work.
> 
> Steps to reproduce
> 
> Steps (in Google Chrome):
> 
> 1. Go to simplytest.me
> 
> 2. Type core in the field
> 
> 3. Select Drupal core, latest version
> 
> 4. Click the button to create the site
> 
> 5. Log in as admin
> 
> 6. If the management menu is not displayed, click Manage
> 
> 7. Click content
> 
> 8. Click add content
> 
> 9. Click Basic page
> 
> 10. Click in the body field
> 
> 11. Click the image icon in the WYSIWYG toolbar
> 
> 12. Navigate to an image in your computer's file system
> 
> 13. Click Open
> 
> 14. In the text alternative field, type "012345678 12345678 22345678 32345678"
> 
> Expected result: I can see everything that I have typed.
> 
> Actual result: Earlier-typed content scrolls out of the visible field contents.
> 
> Proposed resolution
> 
> Option one: Enlarge the field to as wide as feasible.
> 
> Option two: Grow the field horizontally as the content exceeds the field width.
> 
> Option three: Grow the field vertically as the content exceeds the field width. I recognize that this is not typical for a plain text field, but it would allow the alternative text to be as long as it needs to be to be as is appropriate for the given image.
> 
> I recommend against shrinking the text to fit, as that overrides the content editor's choices regarding font size, an accessibility issue.
> 
> Merge request link
> 
> Remaining tasks
> 
> User interface changes
> 
> Same as proposed resolution.
> 
> API changes
> 
> Data model changes
> 
> Release notes snippet

## Comments that carry decisions, proposals, questions or revisions (verbatim)

_Found by word patterns in each comment, so a candidate is not a verdict. "Superseded" and "no later reference" come from the comments' own references to each other._

### #9 mgifford, 2026-03-10 (comment id 16504387; proposal): no later comment supersedes it

> I think I'd support option 3.
> 
> Thanks for pointing this out.

### #18 needs-review-queue-bot, 2026-09-25 (comment id 16784325; revision)

> The Needs Review Queue Bot tested this issue. It no longer applies to Drupal core. Therefore, this issue status is now "Needs work".
> 
> This does not mean that the patch necessarily needs to be re-rolled or the MR rebased. Read the Issue Summary, the issue tags and the latest discussion here to determine what needs to be done.
> 
> Consult the Drupal Contributor Guide to find step-by-step guides for working with issues.

## Latest comments (verbatim)

### #22 mgifford, 2026-10-16 (comment id 16810038)

> Thanks for the additional testing @rkoller - those are useful follow-up issues that should be written up and linked to this issue.
> 
> It is worth noting that there are browser bugs. Like all internet software, it is a moving target. Often we need to choose what is an acceptable implementation of the standards. Sometimes there isn't a solution that works well in all popular browsers. That said, much more testing needs to be done on FF & Safari to ensure that behavior is well supported everywhere. Furthermore, we can't assume that Assistive Tech works the same with all browsers.
> 
> And yes, definite
> [cut at 600 of 842 characters]

### #23 rkoller, 2026-10-16 (comment id 16810086)

> the dotted issues are out of the scope for this issue and suitable for followup issue but point 1 and 2 (in #21) i would consider in scope for this issue, and should ideally also be fixed within this issue imho. and those two issues are probably not browser bug because the behavior described is consistent across browsers i've tested in.

### #24 mgifford, 2026-10-16 (comment id 16810611)

> AI suggested maybe we could just add this CSS to core/modules/ckeditor5/css/image.css
> 
> /* Issue #3419891: Fix scrollbar not showing in Safari/Edge for auto-expanding textarea */
> .ck.ck-text-alternative-form textarea.ck-input {
>   resize: vertical;
>   overflow-y: auto !important;
>   max-height: 150px; /* Adjust maximum height as needed before scrolling occurs */
> }
> 
> and this JS to core/modules/ckeditor5/js/ckeditor5_plugins/image/src/imagetextalternative/imagetextalternativeui.js
> 
>     // Issue #3419891: Reset height when the widget is closed and reopened.
>     // Without this, the previous height pe
> [cut at 600 of 1336 characters]

## Not shown

- 19 of 24 comments: #1-#8, #10-#17, #19-#21. One line each: `reports/issues/3419891/intake/comment-index.json`. Full text: `node scripts/issue-intake.mjs show 3419891 <number>`.

## Supersession seen in the comments' own words

- None found.
