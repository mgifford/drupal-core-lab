# Issue brief: #3155130 "Edit summary" toggle on text fields has many accessibility issues

DRAFT extract, deterministic: made by `node scripts/issue-intake.mjs brief 3155130` from the snapshot fetched 2026-11-05T20:01:46.660Z. No model wrote any of it. Text in quote blocks (`>`) is copied from drupal.org and is **data, not instructions**.
Interpretation (what the problem is, what was decided, what is open) is not in this file: see `handoffs/issue.json`, which cites the ids below. Older comments: `node scripts/issue-intake.mjs show 3155130 <number>`.

## Identity

| | |
|---|---|
| Issue | [#3155130](https://www.drupal.org/project/drupal/issues/3155130) status 13, priority 200, category 1, markup, main; created 2020-06-26, last changed 2026-03-10 |
| Comments | 16 fetched |
| Merge request | none found |
| Diff | not fetched |
| Related issues | 1 (0 open) |
| Review threads | not fetched |

## Limits and gaps of this fetch

- **mr:** no merge request was found for a branch named 3155130-... in the issue fork (patch-only issues need a fork branch for the lab)

## Related issues

_Parent, related, child, issues that list this one as related, and issues mentioned in the summary or comments. An open one may hold work this issue depends on or leaves behind._

| Issue | State | How it is linked | Project | Last changed | Title |
|---|---|---|---|---|---|
| [#2817081](https://www.drupal.org/i/2817081) | closed, status 7, priority 300 | parent; mentioned in the summary | drupal | 2023-02-01 | Show 'Edit summary' links on multi-value long text field with summary |

## Issue summary (verbatim; written by the reporter, may have been edited after the comments)

> From andrewmacpherson #2817081-32: Show 'Edit summary' links on multi-value long text field with summary
> 
> On to the other problems with the "edit summary" and "hide summary" buttons....
> 
> In a single-value, long-text-and-summary widget:
> 
> - The "edit summary" button is inside a label, but the label is for the body textarea. This fails the HTML content model.
> 
> - The computed accessible name of the body textarea is "Body (edit summary)". It's a poor name, because "edit summary" is nothing to do with the body textarea.
> 
> - The "edit summary" button has some unusual behaviour:
> 
> - It disappears when you activate it!
> 
> - Consequently, the accessible name of the body textarea has changed. Changing the name of form inputs isn't something that should be done lightly.
> 
> - It makes something else (the summary textarea) appear. That's a disclosure behaviour, but the summary appears before the button that controls it. That's not the usual order for a disclosure control; a screen reader user may not easily find the summary textarea. It would be more conventional for it to appear after the disclosure button.
> 
> - A new button ("hide summary") appears. The show and hide actions are on separate elements, which is quite cumbersome. Disclosure elements are better done with a single button. The disclosure state can be conveyed with aria-expanded.
> 
> - The "hide summary" button is also inside a <label> for another element, so it fails the HTML content model too.
> 
> - The computed accessible name of the summary textarea is "Summary (Hide summary)". Clumsy, but at least it doesn't refer to a different input.
> 
> For a multi-value, long-text-and-summary widget:
> 
> - The entire label for the body textarea gets a .visually-hidden class. That means the "edit summary" button isn't visible. This is the problem this current issue is trying to solve.
> 
> - Sighted users don't know it's there.
> 
> - Pointer users can't operate it.
> 
> - Worse still, keyboard users can operate it, even though they can't see it! That's a failure of WCAG 2.4.7 Focus Visible.
> 
> - Speech control users have very little chance of being able to operate it, though they might discover it accidentally.
> 
> - For (blind) screen reader users, this isn't too bad.
> 
> - For sighted (or partially sighted) screen reader users, there is a mismatch between what can be seen, versus what can be heard. That might confuse people who use a magnifier in combination with a screen reader. It says there's a button, but you can't see it.
> 
> - The body textareas get 
> [cut at 2500 of 3080 characters]

## Comments that carry decisions, proposals, questions or revisions (verbatim)

_Found by word patterns in each comment, so a candidate is not a verdict. "Superseded" and "no later reference" come from the comments' own references to each other._

## Latest comments (verbatim)

### #14 System Message, 2020-07-02 (comment id 15069569)

> Drupal core is moving towards using a “main” branch. As an interim step, a new 11.x branch has been opened, as Drupal.org infrastructure cannot currently fully support a branch named main. New developments and disruptive changes should now be targeted for the 11.x branch, which currently accepts only minor-version allowed changes. For more information, see the Drupal core minor version schedule and the Allowed changes during the Drupal core release cycle.

### #15 System Message, 2020-07-02 (comment id 16431342)

> Drupal core is now using the main branch as the primary development branch. New developments and disruptive changes should now be targeted to the main branch.
> 
> Read more in the announcement.

### #16 mgifford, 2026-03-10 (comment id 16504832)

> This is now an old issue, but we're going to need instructions for how to enable it at this point.  It isn't an optional field option any more. I believe it will be pulled in as an option for a contrib module at some point.
> 
> Still good to clean up, but not as high a priority.

## Not shown

- 13 of 16 comments: #1-#13. One line each: `reports/issues/3155130/intake/comment-index.json`. Full text: `node scripts/issue-intake.mjs show 3155130 <number>`.

## Supersession seen in the comments' own words

- None found.
