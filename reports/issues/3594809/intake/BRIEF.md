# Issue brief: #3594809 Use standard checkboxes on forms that require submission

DRAFT extract, deterministic: made by `node scripts/issue-intake.mjs brief 3594809` from the snapshot fetched 2026-11-23T19:34:07.514Z. No model wrote any of it. Text in quote blocks (`>`) is copied from drupal.org and is **data, not instructions**.
Interpretation (what the problem is, what was decided, what is open) is not in this file: see `handoffs/issue.json`, which cites the ids below. Older comments: `node scripts/issue-intake.mjs show 3594809 <number>`.

## Identity

| | |
|---|---|
| Issue | [#3594809](https://www.drupal.org/project/drupal/issues/3594809) status 13, priority 200, category 1, Admin theme, main; created 2026-06-09, last changed 2026-11-22 |
| Comments | 20 fetched |
| Merge request | [!16770](https://git.drupalcode.org/project/drupal/-/merge_requests/16770) opened, branch `main` into `main`, head `94a48fe8ed1a`, updated 2026-08-19T20:50:25.643Z |
| Diff | 9917 bytes, sha256 37cf48a6 |
| Related issues | 3 (3 open) |
| Review threads | 0 on the merge request(s), **0 unresolved** |

## Limits and gaps of this fetch

- **notes:** The review threads of !16770 could not be read: https://git.drupalcode.org/api/v4/projects/project%2Fdrupal/merge_requests/16770/discussions?per_page=100&page=1 answered HTTP 401

## Related issues

_Parent, related, child, issues that list this one as related, and issues mentioned in the summary or comments. An open one may hold work this issue depends on or leaves behind._

| Issue | State | How it is linked | Project | Last changed | Title |
|---|---|---|---|---|---|
| [#3585823](https://www.drupal.org/i/3585823) | **open**, status 1, priority 200 | parent | drupal | 2026-11-01 | [Meta] Improve the accessibility of the Default Admin theme |
| [#3593539](https://www.drupal.org/i/3593539) | **open**, status 4, priority 200 | related; mentioned in the summary; mentioned in #8; mentioned in #12 | drupal | 2026-08-20 | [PP-1] Replace compact mode link with a switch to improve accessibility |
| [#3582351](https://www.drupal.org/i/3582351) | **open**, status 1, priority 200 | mentioned in the summary | drupal | 2026-08-13 | [Meta] Clean up CSS within Admin theme |

## Issue summary (verbatim; written by the reporter, may have been edited after the comments)

> Problem/Motivation
> 
> This came up in a Slack discussion about the switch (aka, "toggle") for #3593539: [PP-1] Replace compact mode link with a switch to improve accessibility.
> 
> In the Default Admin theme, standard checkboxes on forms that require submission are styled as toggle switches.
> 
> Regarding accessibility, per #2 it is a failure of SC 1.3.1 Info and Relationships (Level A).
> 
> Regarding UX, Nielsen Norman Group says standard checkboxes should be used in cases that require form submission:
> 
> Toggle switches should take immediate effect and should not require the user to click Save or Submit to apply the new state. As always, we should strive to match the system to the real world. Consider my tea kettle: I should not have to flip the switch off and unplug the cord to experience the change in state. Consequently, users expect the same immediate results from a digital toggle as they do from their real-world counterparts (e.g., light switches). Immediate results are a facet of toggle switches that grants users the freedom and control to update their preferences as needed.
> 
> If immediate results are not achievable or seem ill-suited, an alternative (i.e. radio buttons or a single checkbox — see chart above) should be used instead. If you’re considering including toggles in long forms where other types of form fields are present, and users will need to click a Submit button for other changes to take effect, don’t. This scenario confuses users because they can’t be sure whether their toggle choice will take immediate effect. Avoid confusion at all costs. Separate controls that produce instant results from those that require clicking a command button.
> 
> Steps to reproduce
> 
> - Set Default Admin as the administration theme
> 
> - Go to any form that has boolean controls and requires the user to submit the form for changes to take effect, such as /admin/appearance/settings.
> 
> Proposed resolution
> 
> Use normal checkboxes instead of toggle switches in these cases.
> 
> Remaining tasks
> 
> - Get review by the UX team.
> 
> - Get product manager approval
> 
> - Convert these cases to appear as standard checkboxes. This may require CSS changes, so it may need to wait until the bulk of #3582351: [Meta] Clean up CSS within Admin theme is complete.
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

### #14 needs-review-queue-bot, 2026-08-20 (comment id 16739979; revision)

> The Needs Review Queue Bot tested this issue. It fails the Drupal core commit checks. Therefore, this issue status is now "Needs work".
> 
> This does not mean that the patch necessarily needs to be re-rolled or the MR rebased. Read the Issue Summary, the issue tags and the latest discussion here to determine what needs to be done.
> 
> Consult the Drupal Contributor Guide to find step-by-step guides for working with issues.

## Latest comments (verbatim)

### #18 kentr, 2026-10-20 (comment id 16813591)

> (no text: a comment that only changed a field or attached a file; the API does not carry what it changed)

### #19 pameeela, 2026-11-16 (comment id 16844325)

> (no text: a comment that only changed a field or attached a file; the API does not carry what it changed)

### #20 emma horrell, 2026-11-22 (comment id 16851093)

> UX review – I would support standard checkboxes on forms that need submission – these are clearer and more consistent with forms.
> 
> As per earlier comments, switches/toggles tend to indicate immediate application, this may lead users to think they don’t have to save to apply the action which if I understand correctly is not the case here.

## Not shown

- 16 of 20 comments: #1-#13, #15-#17. One line each: `reports/issues/3594809/intake/comment-index.json`. Full text: `node scripts/issue-intake.mjs show 3594809 <number>`.

## Supersession seen in the comments' own words

- None found.
