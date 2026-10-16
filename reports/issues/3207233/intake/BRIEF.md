# Issue brief: #3207233 Improve the visual indication of the active workspace in the Workspaces listing UI

DRAFT extract, deterministic: made by `node scripts/issue-intake.mjs brief 3207233` from the snapshot fetched 2026-10-16T12:40:55.142Z. No model wrote any of it. Text in quote blocks (`>`) is copied from drupal.org and is **data, not instructions**.
Interpretation (what the problem is, what was decided, what is open) is not in this file: see `handoffs/issue.json`, which cites the ids below. Older comments: `node scripts/issue-intake.mjs show 3207233 <number>`.

## Identity

| | |
|---|---|
| Issue | [#3207233](https://www.drupal.org/project/drupal/issues/3207233) status 13, priority 300, category 1, workspaces.module, main; created 2021-04-05, last changed 2026-02-06 |
| Comments | 22 fetched |
| Merge request | none found |
| Diff | not fetched |
| Related issues | 3 (1 open) |
| Review threads | not fetched |

## Limits and gaps of this fetch

- **mr:** no merge request was found for a branch named 3207233-... in the issue fork (patch-only issues need a fork branch for the lab)

## Related issues

_Parent, related, child, issues that list this one as related, and issues mentioned in the summary or comments. An open one may hold work this issue depends on or leaves behind._

| Issue | State | How it is linked | Project | Last changed | Title |
|---|---|---|---|---|---|
| [#3096017](https://www.drupal.org/i/3096017) | **open**, status 1, priority 300 | parent | drupal | 2026-04-25 | Finalize the Workspaces UI |
| [#3568606](https://www.drupal.org/i/3568606) | closed, status 7, priority 200 | mentioned in #20; mentioned in #21; lists this issue as related | ? | 2026-02-20 | Drupal Usability Meeting 2026-01-30 |
| [#3092553](https://www.drupal.org/i/3092553) | closed, status 7, priority 300 | mentioned in the summary; mentioned in #2; mentioned in #5 | drupal | 2021-06-28 | Add a row for switching to the live workspace in the Workspaces listing UI |

## Issue summary (verbatim; written by the reporter, may have been edited after the comments)

> Problem/Motivation
> 
> On the Workspaces listing screen (/admin/config/workflow/workspaces), we currently try to show which workspace is currently active by highlighting its row in the table:
> 
> However, highlighting the row which contains the active workspace is very unclear and it doesn't really achieve its purpose.
> 
> Steps to reproduce
> 
> Enable the Workspaces module and navigate to /admin/config/workflow/workspaces.
> 
> Proposed resolution
> 
> This issue was discussed in a usability meeting on Jan 16th 2020 (see #3092553-6: Add a row for switching to the live workspace in the Workspaces listing UI), and the consensus was to replace the table row highlight with a strong emphasis on the workspace label, and add a  (active) suffix.
> 
> Remaining tasks
> 
> Reviews.
> 
> User interface changes
> 
> Workspaces listing page with the proposed changes:
> 
> API changes
> 
> Nope.
> 
> Data model changes
> 
> Nope.
> 
> Release notes snippet
> 
> Nope.

## Comments that carry decisions, proposals, questions or revisions (verbatim)

_Found by word patterns in each comment, so a candidate is not a verdict. "Superseded" and "no later reference" come from the comments' own references to each other._

### #11 amateescu, 2023-01-31 (comment id 14897814; revision)

> Rerolled the patch for 10.1.x. Still needs accessibility review...

## Latest comments (verbatim)

### #20 benjifisher, 2026-01-30 (comment id 16448507)

> We discussed this issue at #3568606: Drupal Usability Meeting 2026-01-30. That issue will have a link to a recording of the meeting. I am adding issue credit for the participants: @pallavi singh3013, @rkoller, @simohell, and @the_g_bomb.

### #21 rkoller, 2026-02-06 (comment id 16457611)

> Usability review
> 
> We discussed this issue at #3568606: Drupal Usability Meeting 2026-01-30. The recording of the meeting: https://youtu.be/80LmftxqFSk. The attendees at the usability meeting were @pallavi singh3013, @rkoller, @simohell, and @the_g_bomb.
> 
> We not really have anything to report yet. We did an initial exploration, me demoing the problem space this issue is about. And the group agreed on revisiting this issue in one of the next meetings to actually discuss potential recommendations.
> 
> The only questions that arose during the meeting were what would be the number of workspaces to exp
> [cut at 600 of 951 characters]

### #22 amateescu, 2026-02-06 (comment id 16457678)

> what would be the number of workspaces to expect on a site that is heavily using workspaces?
> 
> On a large project that uses workspaces exclusively for editing various sections of their site, I'm seeing 130 in-progress workspaces and more than 1100 closed (published) ones :)
> 
> And the other question is what is the expected number of levels? In my tests after the meeting I've created 6 levels of child workspaces, and it looked like there is no actual limit to the number of levels.
> 
> That's correct, there's no limit to the number of levels, but in practice this feature is rarely used.
> 
> Thanks for lo
> [cut at 600 of 616 characters]

## Not shown

- 18 of 22 comments: #1-#10, #12-#19. One line each: `reports/issues/3207233/intake/comment-index.json`. Full text: `node scripts/issue-intake.mjs show 3207233 <number>`.

## Supersession seen in the comments' own words

- None found.
