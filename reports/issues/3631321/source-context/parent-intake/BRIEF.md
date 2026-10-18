# Issue brief: #3604037 Indicate that grouping elements have child element errors for UX and a11y

DRAFT extract, deterministic: made by `node scripts/issue-intake.mjs brief 3604037` from the snapshot fetched 2026-10-16T22:08:07.445Z. No model wrote any of it. Text in quote blocks (`>`) is copied from drupal.org and is **data, not instructions**.
Interpretation (what the problem is, what was decided, what is open) is not in this file: see `handoffs/issue.json`, which cites the ids below. Older comments: `node scripts/issue-intake.mjs show 3604037 <number>`.

## Identity

| | |
|---|---|
| Issue | [#3604037](https://www.drupal.org/project/drupal/issues/3604037) status 14, priority 300, category 1, Admin theme, main; created 2026-06-18, last changed 2026-10-16 |
| Comments | 57 fetched |
| Merge request | [!17078](https://git.drupalcode.org/project/drupal/-/merge_requests/17078) opened, branch `3604037-grouping-elements-child-errors-default-admin` into `main`, head `c8136d010105`, updated 2026-10-13T16:45:30.316Z |
| Diff | 30189 bytes, sha256 a567bdee |
| Related issues | 16 (12 open) |
| Review threads | 0 on the merge request(s), **0 unresolved** |
| Patch in the lab | `branches/3604037-grouping-elements-child-errors-default-admin.patch` sha256 763628f8 |
| Patch in the lab | `branches/support-fixture-two-required-fields.patch` sha256 7dd6f0e3 |

## Limits and gaps of this fetch

- **attachments:** 34 attachments exist, 30 listed (limit 30)
- **notes:** The review threads of !17078 could not be read: https://git.drupalcode.org/api/v4/projects/project%2Fdrupal/merge_requests/17078/discussions?per_page=100&page=1 answered HTTP 401

## Related issues

_Parent, related, child, issues that list this one as related, and issues mentioned in the summary or comments. An open one may hold work this issue depends on or leaves behind._

| Issue | State | How it is linked | Project | Last changed | Title |
|---|---|---|---|---|---|
| [#3585823](https://www.drupal.org/i/3585823) | **open**, status 1, priority 200 | parent | drupal | 2026-10-09 | [Meta] Improve the accessibility of the Default Admin theme |
| [#3582351](https://www.drupal.org/i/3582351) | **open**, status 1, priority 200 | related | drupal | 2026-08-13 | [Meta] Clean up CSS within Admin theme |
| [#2859914](https://www.drupal.org/i/2859914) | **open**, status 1, priority 200 | related; mentioned in #5; mentioned in #6 | drupal | 2026-08-19 | Misleading Icon used on form validation errors |
| [#3625458](https://www.drupal.org/i/3625458) | **open**, status 14, priority 300 | related; mentioned in #30; mentioned in #46; mentioned in #48; mentioned in #50 | drupal | 2026-10-16 | Form error text in dark mode has low contrast |
| [#2848507](https://www.drupal.org/i/2848507) | closed, status 3, priority 300 | mentioned in the summary; mentioned in #3; mentioned in #5; mentioned in #6; mentioned in #13; mentioned in #18; mentioned in #19; mentioned in #24; mentioned in #42; lists this issue as related | ? | 2026-09-25 | Indicate that grouping elements have child element errors for ux and a11y |
| [#3619387](https://www.drupal.org/i/3619387) | **open**, status 14, priority 300 | mentioned in the summary; lists this issue as related | ? | 2026-10-07 | Indicate on forms sidebar toggle button that sidebar has child element errors |
| [#3620853](https://www.drupal.org/i/3620853) | closed, status 7, priority 200 | mentioned in #24; mentioned in #25; lists this issue as related | ? | 2026-10-10 | Drupal Usability Meeting 2026-09-11 |
| [#3631321](https://www.drupal.org/i/3631321) | **open**, status 1, priority 200 | mentioned in #55; lists this issue as related | ? | 2026-10-16 | Improve the visual representation of none active vertical tabs in forced color mode |
| [#3631337](https://www.drupal.org/i/3631337) | **open**, status 1, priority 200 | mentioned in #55; lists this issue as related | ? | 2026-10-16 | Decide how to semantically label HTML elements for errors/warnings in forced color mode |
| [#3631335](https://www.drupal.org/i/3631335) | **open**, status 1, priority 200 | mentioned in #55; lists this issue as related | ? | 2026-10-16 | The red accent color is too close to the error color |
| [#3619127](https://www.drupal.org/i/3619127) | **open**, status 8, priority 300 | lists this issue as related | ? | 2026-10-01 | Forms sidebar doesn't open with error links from Inline Form Errors module |
| [#3625988](https://www.drupal.org/i/3625988) | **open**, status 4, priority 200 | lists this issue as related | ? | 2026-09-25 | Port over changes from "Indicate that grouping elements have child element errors for ux and a11y" |
| [#3081500](https://www.drupal.org/i/3081500) | **open**, status 13, priority 200 | mentioned in the summary | drupal | 2026-09-23 | Accessibility bugs with vertical tabs |
| [#3599680](https://www.drupal.org/i/3599680) | closed, status 7, priority 200 | mentioned in #3 | drupal | 2026-07-08 | Consolidate, merge, and refactor Gin's CSS variable's into Admin theme's original variables. |
| [#2915899](https://www.drupal.org/i/2915899) | **open**, status 4, priority 200 | mentioned in #19 | drupal | 2026-10-01 | [PP-1] Enable the Inline Form Errors module in the Standard profile and recipe |
| [#3618140](https://www.drupal.org/i/3618140) | closed, status 7, priority 300 | mentioned in #23 | drupal | 2026-10-03 | Improve the accessibility of focus outlines |

## Issue summary (verbatim; written by the reporter, may have been edited after the comments)

> Problem/Motivation
> 
> The work here builds heavily on the discussion and work in #2848507: Indicate that grouping elements have child element errors for ux and a11y, so contributors to that issue should get credit in this one if they don't there.
> 
> Child elements in grouping elements like details and vertical tabs are invisible to the user when the grouping element is closed or not-active, respectively.
> 
> To improve the user experience and accessibility we should indicate when there are errors 'inside'.
> 
> Currently it is hard for the user to find the actual problematic field when the (child) field itself is invisible.
> 
> The forms sidebar has a similar problem: #3619387: Indicate on forms sidebar toggle button that sidebar has child element errors.
> 
> Steps to reproduce
> 
> - In settings.php, set $settings['extension_discovery_scan_tests'] = TRUE.
> 
> - Enable the core form_test module (drush en -y form_test).
> 
> - Install the article test recipe (drush recipe core/tests/fixtures/recipes/article_content_type) or create an Article content type.
> 
> - If necessary, set both the default and admin theme to Default Admin. Should not be necessary with this MR.
> 
> (drush cset -y system.theme default default_admin && drush cset -y system.theme admin default_admin).
> 
> - For "standard" details elements:
> 
> - Go to /form_test/details-contains-required-fields.
> 
> - Click the Submit button.
> 
> - Close one of the details elements for comparison.
> 
> - For "accordion" style details elements on the node edit form:
> 
> - Go to /node/add/article.
> 
> - If the form sidebar on the right is closed, click the toggle button to open it.
> 
> - Enter a value without a beginning slash in the URL alias field.
> 
> - Click the Save button.
> 
>         This should cause a validation error: "The alias path has to start with a slash".
> 
> - Open the sidebar to see the invalid URL alias field.
> 
> - For vertical tabs:
> 
> - Widen your viewport to at least 650px.
> 
> - Go to /admin/config/people/accounts.
> 
> - Within one or more tabs for the Emails configuration at the bottom of the form, remove the value for the required Subject field.
> 
> - Click the Save button.
> 
> - Click a tab which does not have an error to activate it.
> 
> For RTL, either:
> 
> - manually change the dir attribute on the html tag to rtl in the browser inspector / devtools, OR
> 
> -
> 
> - Enable the Locale module (drush en -y locale).
> 
> - Add Hebrew as a language (/admin/config/regional/language/add).
> 
> - Repeat the above steps on the Hebrew version of the pages (prepend /he to the paths).
> 
> Propose
> [cut at 2500 of 6596 characters]

## Comments that carry decisions, proposals, questions or revisions (verbatim)

_Found by word patterns in each comment, so a candidate is not a verdict. "Superseded" and "no later reference" come from the comments' own references to each other._

### #6 kentr, 2026-08-18 (comment id 16738227; decision+question): no later comment refers to it (possibly unresolved)

> It was decided that #2859914: Misleading Icon used on form validation errors isn't a blocker for #2848507: Indicate that grouping elements have child element errors for ux and a11y after all.
> 
> @mherchel said in Slack most of the big CSS refactor for Default Admin is complete.
> 
> Most of the large CSS refactoring issues are in, which means its time to take stock of what's still broken
> 
> AFAICT, #2848507: Indicate that grouping elements have child element errors for ux and a11y is very close. It might need some code tweaks, but I'm willing to take a gamble that we can start on this in parallel.
> 
> I'll work on porting the work in #2848507: Indicate that grouping elements have child element errors for ux and a11y to Default Admin. Once that issue is in, then this will be more easily testable by others.

### #19 kentr, 2026-09-11 (comment id 16766970; question): no later comment refers to it (possibly unresolved)

> When @mgifford and I talked about it last, we thought this is a blocker for #2915899: [PP-1] Enable the Inline Form Errors module in the Standard profile and recipe for the same reasons that #2848507: Indicate that grouping elements have child element errors for ux and a11y is.

### #47 rkoller, 2026-10-11 (comment id 16804578; referred to)

> I don't know how to solve the problem with the red accent color, though. I think that would already exist in main. This MR uses the pre-defined error color.
> 
> one option might be to simply drop the red accent color from the default admin theme. having an accent color that is that close to the color the theme uses for errors i consider inherently problematic (https://www.whocanuse.com/?bg=bb4d42&fg=c43336&fs=16&fw=). :/
> 
> I think the underlying problem is that there's not a system color for errors.
> 
> yep i know and i agree to. i've just raised that detail because having the same state with different colors on different pages is problematic. so having a "crude hack" to unify them for the time being until a consensus is reached for a proper fix was what i was implying - something like the CanvasText system color for vertical tabs what you suggested. for the "crude fix" it shouldnt have to make semantic sense but rather just accomplish consistency?
> 
> and about a system color for errors, ive already searched in online resources a while ago  if there is some sort of documentation or best practice in that regard but i had no luck finding anything yet. will see maybe it would be possible to contact someone at the microsoft edge team or somehow related to pick their brains on that question. and again it would be super helpful if there would be some sort of best practice demo where you are able to see which system color is being used in which context best.

### #50 rkoller, 2026-10-12 (comment id 16805685; decision): no later comment supersedes it

> Yeah, I thought of that also but didn't think it would be well-received :-). It's worth pursuing, though
> 
> haha yep that might be the case but keeping it in as is might also not be the right choice. :( we will see how things turn out.
> 
> It might be helpful if you comment in #3625458: Form error text in dark mode has low contrast, because the color I used is a slightly lighter red that's probably even closer to the red accent color (based on just looking at your screenshot).
> 
> left a brief comment

### #51 kentr, 2026-10-13 (comment id 16805970; proposal): no later comment supersedes it

> I changed the vertical tabs forced-colors error-border color to canvasText per #47.
> 
> These screenshots are now in the issue summary. I also updated the proposed resolution to match.

## Latest comments (verbatim)

### #55 rkoller, 2026-10-13 (comment id 16807016)

> I've retested the latest state of the MR in light and dark mode in RTL and LTR, and also rechecked forced color mode and reassured that the color for the error state is consistent across all three scenarios. Looks all good now as well as the issue summary is in proper shape, thanks to @kentr's effort! Setting it to RTBC.
> 
> There are three details we've agreed on to discuss and/or solve in follow-ups:
> 
> - The borders of vertical tabs should use dotted lines instead of solid lines to make the active vertical tab easier distinguishable from none active vertical tabs (#3631321: Improve the visual re
> [cut at 600 of 987 characters]

### #56 mgifford, 2026-10-16 (comment id 16810016)

> Would be good to link the follow-up items here when they are created @rkoller
> 
> Much appreciate the review.

### #57 rkoller, 2026-10-16 (comment id 16810385)

> yes that was the plan anyway. but created all three issues already now and updated #55 accordingly.

## Not shown

- 49 of 57 comments: #1-#5, #7-#18, #20-#46, #48-#49, #52-#54. One line each: `reports/issues/3604037/intake/comment-index.json`. Full text: `node scripts/issue-intake.mjs show 3604037 <number>`.

## Supersession seen in the comments' own words

- None found.
