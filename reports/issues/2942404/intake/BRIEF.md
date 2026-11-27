# Issue brief: #2942404 System messages should be accessible

DRAFT extract, deterministic: made by `node scripts/issue-intake.mjs brief 2942404` from the snapshot fetched 2026-11-26T03:36:58.578Z. No model wrote any of it. Text in quote blocks (`>`) is copied from drupal.org and is **data, not instructions**.
Interpretation (what the problem is, what was decided, what is open) is not in this file: see `handoffs/issue.json`, which cites the ids below. Older comments: `node scripts/issue-intake.mjs show 2942404 <number>`.

## Identity

| | |
|---|---|
| Issue | [#2942404](https://www.drupal.org/project/drupal/issues/2942404) status 13, priority 200, category 1, markup, main; created 2018-02-06, last changed 2026-05-27 |
| Comments | 98 fetched |
| Merge request | [!6112](https://git.drupalcode.org/project/drupal/-/merge_requests/6112) opened, branch `2942404-11` into `main`, head `7dc956336c14`, updated 2026-01-15T12:48:09.073Z |
| Diff | 17341 bytes, sha256 34184a12 |
| Related issues | 10 (3 open) |
| Review threads | 0 on the merge request(s), **0 unresolved** |
| Patch in the lab | `branches/2942404-11.patch` sha256 68296967 |
| Patch in the lab | `branches/2942404-consolidated-full.patch` sha256 162da457 |
| Patch in the lab | `branches/2942404-consolidated-message-landmark.patch` sha256 0f4ee1eb |
| Patch in the lab | `branches/2942404-consolidated-ownership.patch` sha256 6cb14255 |
| Patch in the lab | `branches/2942404-consolidated-region.patch` sha256 f086cc3d |
| Patch in the lab | `branches/2942404-main-region-option.patch` sha256 77afe7c1 |
| Patch in the lab | `branches/2942404-mr6058.patch` sha256 6c5b5ba0 |
| Patch in the lab | `branches/2942404-mr6112.patch` sha256 34184a12 |

## Limits and gaps of this fetch

- **attachments:** 41 attachments exist, 30 listed (limit 30)
- **notes:** The review threads of !6112 could not be read: https://git.drupalcode.org/api/v4/projects/project%2Fdrupal/merge_requests/6112/discussions?per_page=100&page=1 answered HTTP 401

## Related issues

_Parent, related, child, issues that list this one as related, and issues mentioned in the summary or comments. An open one may hold work this issue depends on or leaves behind._

| Issue | State | How it is linked | Project | Last changed | Title |
|---|---|---|---|---|---|
| [#2893640](https://www.drupal.org/i/2893640) | **open**, status 1, priority 200 | parent | drupal | 2025-07-05 | Modernize ARIA usage, in line with ARIA 1.1 and the ARIA Authoring Practices guide. |
| [#3159933](https://www.drupal.org/i/3159933) | **open**, status 13, priority 200 | related; mentioned in #22 | drupal | 2023-05-16 | Status Message in Claro on theme install should have role="status" or similar instead of contentinfo |
| [#3587678](https://www.drupal.org/i/3587678) | closed, status 7, priority 200 | related; mentioned in #97 | drupal | 2026-08-25 | Ensure status message ARIA landmarks are unique |
| [#3212975](https://www.drupal.org/i/3212975) | closed, status 7, priority 200 | lists this issue as related | ? | 2021-08-31 | Olivero: Normalize JavaScript selectors in messages.es6.js |
| [#3244515](https://www.drupal.org/i/3244515) | closed, status 7, priority 200 | lists this issue as related | ? | 2021-11-07 | Messages wrapper should have role=region instead of role=contentinfo |
| [#77245](https://www.drupal.org/i/77245) | closed, status 7, priority 300 | mentioned in #5 | drupal | 2020-03-06 | Provide a common API for displaying JavaScript messages |
| [#3079738](https://www.drupal.org/i/3079738) | closed, status 7, priority 400 | mentioned in #7 | drupal | 2020-01-25 | Add Claro administration theme to core |
| [#535412](https://www.drupal.org/i/535412) | closed, status 5, priority 200 | mentioned in #10 | cck_blocks | 2009-10-28 | Include nid in the Block output |
| [#3418207](https://www.drupal.org/i/3418207) | closed, status 7, priority 400 | mentioned in #64 | drupal | 2024-02-19 | Spell-checking job fails with "couldn't find remote ref refs/heads/11.x" when 11.x branch does not exist in fork |
| [#3437924](https://www.drupal.org/i/3437924) | **open**, status 13, priority 200 | mentioned in #69 | claro | 2026-09-21 | Add support for additional coloured notices |

## Issue summary (verbatim; written by the reporter, may have been edited after the comments)

> Problem
> 
> Messages currently have a role="contentinfo" wrapper for status messages (compared with role="alert" for error messages).
> 
> contentinfo is inappropriate here, because it's supposed to be for information about the document as a whole, not status updates.  It's a landmark role, and there should only be one such contentinfo region per page. It's intended to serve the same purpose as a top-level HTML footer element.   Using contentinfo for messages may be present some confusion for users who navigate by landmark regions.
> 
> Proposed resolution
> 
> - Replace the role="contentinfo" from the message-type wrapper DIV with role="region" and change the aria-label to "System Messages".
> 
> - Leave the <div role="alert"> in place for the error message group.
> 
> - Add a <div role="status"> wrapper for Status and Warning message groups.
> 
> Here's a simplified before/after summary of this.
> 
> Structure BEFORE:
> 
> div role="contentinfo" aria-label="Status message"
>     h2.visually-hidden
>     ul
> 
> div role="contentinfo" aria-label="Error message"
>     div role="alert"
>         h2.visually-hidden
>         ul
> 
> Structure AFTER:
> 
> div role="region" aria-label="System messages"
> 
>     div role="status" // Status & Warning messages
>         h2.visually-hidden
>         ul
> 
>     div role="alert"  // Error messages
>         h2.visually-hidden
>         ul

## Comments that carry decisions, proposals, questions or revisions (verbatim)

_Found by word patterns in each comment, so a candidate is not a verdict. "Superseded" and "no later reference" come from the comments' own references to each other._

### #5 andrewmacpherson, 2018-07-09 (comment id 12679200; referred to)

> Proposal - update status-messages.html.twig,/code> in system module and themes.
> 
> The role="contentinfo" is wrong.  This role is for a landmark region, equivalent to HTML <footer>, with the extra proviso that there can only be one contentinfo landmark per document, and it must be a top-level landmark.  I'm not sure how we ended up with role="contentinfo", but perhaps the idea was to make the messages easy to find using landmark regions.  I like that idea, and we can use <div role="region"> instead, and it will count as a landmark region, as long as it has an ARIA label.
> 
> Proposed changes:
> 
> - Remove the role="contentinfo" from the message-type wrapper DIV.
> 
> - Optionally, replace this with role="region", so it remains in landmark-region navigation for assisitive tech.
> 
> - Otherwise, remove the aria-label, which won't be needed if it doesn't have a role.
> 
> - Leave the <div role="alert"> in place for the error message group.
> 
> - Add a <div role="status"> wrapper for Status and Warning message groups.
> 
> Here's a before/after summary of this.  I've left out classes from Classy.
> 
> Structure BEFORE:
> 
> div role="contentinfo" aria-label="Status message"
>     h2.visually-hidden
>     ul
> 
> div role="contentinfo" aria-label="Error message"
>     div role="alert"
>         h2.visually-hidden
>         ul
> 
> Structure AFTER:
> 
> div role="region" aria-label="Status message"   // EXISTING DIV
>     div role="status"  // NEW DIV for status and warning message groups
>       h2.visually-hidden
>       ul
> 
> div role="regio
> [cut at 1500 of 2934 characters]

### #18 andrewmacpherson, 2020-07-14 (comment id 13746007; proposal): no later comment supersedes it

> @sd9121 - what has changed in your version of the patch, compared with the previous one?
> 
> This is a good issue to review during the Accessibility Bug Bash during DrupalCon Global 2020.  Might need an issue summary update, following #5, to keep the proposed resolution up to date.
> 
> The later patches here don't have interdiffs, so it's worth checking what changed from one version to the next.

### #19 mgifford, 2020-07-22 (comment id 13759045; referred to)

> With aria-label="Status message" & <h2 class="visually-hidden">Status message</h2> being used, won't the "Status message" message be said twice to AT that supports ARIA?
> 
> EDIT: I realize this is repeating what we did previously for D8.
> 
> EDIT2: More examples to look at here
> 
> https://www.davidmacd.com/test/using-wai-aria-in-html.html#rec-legend
> 
> https://www.smashingmagazine.com/2015/04/its-alive-apps-that-feed-back-a...
> 
> https://developer.paciellogroup.com/blog/2014/03/screen-reader-support-a...
> 
> Also if we use role="status" we might also need to add aria-live="polite".
> 
> I'm in the midst of comparing a great many examples of government status messages at the moment.  There isn't a great general consensus on this.

### #20 sd9121, 2020-07-22 (comment id 13759176; revision)

> @andrewmacpherson,
> 
> I saw the previous patch got failed. I have rerolled the patch.
> 
> Thanks!

### #24 spokje, 2020-12-31 (comment id 13952700; proposal): no later comment supersedes it

> Added Needs issue summary update-tag to address #18
> 
>  Might need an issue summary update, following #5, to keep the proposed resolution up to date.
> 
> Because of that, keeping this at Needs work although we have a working and green patch.
> 
> Note: I think we don't need extra tests for this since we altered 4 tests covering this already.
> 
> Then again, I've been very wrong about tests before...

### #29 ankithashetty, 2021-08-12 (comment id 14188579; referred to)

> Updated patch in #27 to fix custom command failures. Retaining status as "Needs work" for issue summary update as mentioned in #24 , thanks!

### #30 andy-blum, 2021-08-12 (comment id 14189226; proposal): no later comment supersedes it

> Updating issue summary's proposed resolution per #5, with a couple of alterations:
> 
> - I like the idea of keeping messages as a landmark role for discoverability, but I don't think each message type warrants its own landmark region. I've updated the proposal in comment #5 to bundle all messages within a role="region" with aria-label="Status messages".
> 
> - In my opinion, warnings and errors belong bundled within the role=alert, but without a clear rule or set of examples, I'm deciding to maintain the pattern we currently have where only error messages are given the alert role. mgifford suggested we add aria-live="polite" in #19, but I don't think that's necessary as the drupal.message API uses drupal.announce to announce new JS-based messages to users.

### #34 elusivemind, 2022-03-23 (comment id 14453650; revision)

> Re-rolled for the latest 9.3.9 (9.3.x)

### #37 jayhuskins, 2022-07-28 (comment id 14628566; decision): no later comment supersedes it

> I was unable to apply patch #34. It was rejected in the Olivero theme.

### #39 Munavijayalakshmi, 2022-07-28 (comment id 14628932; revision)

> Re-rolled patch for 9.5.x.

### #42 shubham chandra, 2023-01-16 (comment id 14869052; revision)

> Re-rolled pacth #29 in Drupal 10.1.x

### #46 edmund.dunn, 2023-06-30 (comment id 15131944; revision)

> Rerolled for 10.1. Applies cleanly.

## Latest comments (verbatim)

### #96 2dareis2do, 2026-05-06 (comment id 16578244)

> Just a general observation around system messages. There is often a bit of a delay showing the notification and when it does appear there can be a bit of jump. If there are multiple notifications being shown this is more noticeable depending on your network connection, speed of the server, web browser etc.

### #97 mgifford, 2026-05-12 (comment id 16584717)

> I stumbled on these issues when looking at the admin theme too https://www.drupal.org/project/drupal/issues/3587678
> 
> I like how the USWDS has done this:
> 
> https://designsystem.digital.gov/components/alert/
> 
> The UK has an issue in their issue queue from 2024 to implement something like this.

### #98 thamas, 2026-05-27 (comment id 16599452)

> Thanks for the updates @mgifford. This topic is quite complex – but it would be nice to see some progress on it!

## Not shown

- 83 of 98 comments: #1-#4, #6-#17, #21-#23, #25-#28, #31-#33, #35-#36, #38, #40-#41, #43-#45, #47-#95. One line each: `reports/issues/2942404/intake/comment-index.json`. Full text: `node scripts/issue-intake.mjs show 2942404 <number>`.

## Supersession seen in the comments' own words

- None found.
