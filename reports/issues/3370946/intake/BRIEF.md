# Issue brief: #3370946 Page title should contextualize the local navigation

DRAFT extract, deterministic: made by `node scripts/issue-intake.mjs brief 3370946` from the snapshot fetched 2026-11-26T02:43:27.943Z. No model wrote any of it. Text in quote blocks (`>`) is copied from drupal.org and is **data, not instructions**.
Interpretation (what the problem is, what was decided, what is open) is not in this file: see `handoffs/issue.json`, which cites the ids below. Older comments: `node scripts/issue-intake.mjs show 3370946 <number>`.

## Identity

| | |
|---|---|
| Issue | [#3370946](https://www.drupal.org/project/drupal/issues/3370946) status 13, priority 200, category 1, base system, main; created 2023-06-28, last changed 2026-08-24 |
| Comments | 121 fetched |
| Merge request | [!4479](https://git.drupalcode.org/project/drupal/-/merge_requests/4479) opened, branch `3370946-change-in-pagetitleblock` into `main`, head `1ff37e70ceb1`, updated 2026-01-15T12:27:56.892Z |
| Diff | 182784 bytes, sha256 305aac87 |
| Related issues | 25 (12 open) |
| Review threads | 0 on the merge request(s), **0 unresolved** |

## Limits and gaps of this fetch

- **notes:** More than one merge request matched; using !4479. Others: !4283 (closed, 3370946-the-current-implementation). Use --mr <number> to choose another.
- **notes:** The review threads of !4479 could not be read: https://git.drupalcode.org/api/v4/projects/project%2Fdrupal/merge_requests/4479/discussions?per_page=100&page=1 answered HTTP 401
- **notes:** The review threads of !4283 could not be read: https://git.drupalcode.org/api/v4/projects/project%2Fdrupal/merge_requests/4283/discussions?per_page=100&page=1 answered HTTP 401

## Related issues

_Parent, related, child, issues that list this one as related, and issues mentioned in the summary or comments. An open one may hold work this issue depends on or leaves behind._

| Issue | State | How it is linked | Project | Last changed | Title |
|---|---|---|---|---|---|
| [#3364258](https://www.drupal.org/i/3364258) | **open**, status 1, priority 200 | parent; lists this issue as related | ? | 2025-03-26 | [meta] Improve administration navigation |
| [#2521780](https://www.drupal.org/i/2521780) | **open**, status 13, priority 300 | related; mentioned in #20; mentioned in #22; mentioned in #23 | drupal | 2023-02-13 | The 'Edit', 'Manage display' and 'Manage form display' tabs were hard to understand |
| [#2514218](https://www.drupal.org/i/2514218) | **open**, status 4, priority 200 | related; mentioned in #16; mentioned in #20 | drupal | 2026-09-28 | [regression] Pages Manage Fields, Manage form, Manage display should include name of content type or entity |
| [#2938129](https://www.drupal.org/i/2938129) | **open**, status 4, priority 300 | related; mentioned in #35 | drupal | 2026-10-24 | PageTitle block is non-functional when not handled directly by \Drupal\block\Plugin\DisplayVariant\BlockPageVariant |
| [#3344200](https://www.drupal.org/i/3344200) | closed, status 7, priority 200 | related; mentioned in #79 | drupal | 2025-09-11 | PathBasedBreadcrumbBuilder needs to be able to exclude pointless paths |
| [#2862702](https://www.drupal.org/i/2862702) | closed, status 7, priority 200 | related; mentioned in #101; mentioned in #103; mentioned in #104 | drupal | 2024-04-22 | PrepareModulesEntityUninstallForm::formTitle does not exist |
| [#3379160](https://www.drupal.org/i/3379160) | closed, status 7, priority 200 | mentioned in the summary; mentioned in #22; lists this issue as related | ? | 2025-01-14 | Toolbar Prototype Usability Testing Phase I |
| [#3381917](https://www.drupal.org/i/3381917) | closed, status 7, priority 200 | mentioned in #28; lists this issue as related | ? | 2025-06-18 | Drupal Usability Meeting 2023-08-25 |
| [#3386724](https://www.drupal.org/i/3386724) | **open**, status 1, priority 200 | mentioned in #41; lists this issue as related | ? | 2023-10-17 | Change the separator in document title |
| [#3386732](https://www.drupal.org/i/3386732) | **open**, status 1, priority 200 | mentioned in #41; lists this issue as related | ? | 2023-10-17 | Refine the page title if possible |
| [#3396977](https://www.drupal.org/i/3396977) | **open**, status 1, priority 200 | mentioned in #55; lists this issue as related | ? | 2023-10-27 | Review page titles for consistency |
| [#3376566](https://www.drupal.org/i/3376566) | closed, status 7, priority 200 | mentioned in #64; lists this issue as related | ? | 2024-03-29 | Display the page title, even if "0" in olivero |
| [#3412316](https://www.drupal.org/i/3412316) | closed, status 7, priority 200 | mentioned in #64; lists this issue as related | ? | 2024-03-16 | Use 'search.view' instead of 'search.plugins:' . $default for base route in SearchLocalTask::getDerivativeDefinitions() |
| [#3387973](https://www.drupal.org/i/3387973) | **open**, status 14, priority 200 | child (names this issue as its parent) | ? | 2023-09-20 | Page title should contextualize the local navigation |
| [#3374626](https://www.drupal.org/i/3374626) | closed, status 7, priority 200 | lists this issue as related | ? | 2023-08-02 | Comment type form title is confusing  |
| [#3437731](https://www.drupal.org/i/3437731) | closed, status 7, priority 400 | lists this issue as related | ? | 2024-04-17 | Daily automated core config validatability report broke on March 23 |
| [#3343940](https://www.drupal.org/i/3343940) | closed, status 7, priority 200 | mentioned in the summary | drupal | 2023-03-17 | Field UI 2023 User Research |
| [#996302](https://www.drupal.org/i/996302) | **open**, status 17, priority 200 | mentioned in #18 | drupal | 2018-09-28 | Pages of local actions don't display local action title as page title |
| [#2068471](https://www.drupal.org/i/2068471) | closed, status 7, priority 400 | mentioned in #18 | drupal | 2014-08-25 | Normalize Controller/View-listener behavior with a Page object |
| [#2194823](https://www.drupal.org/i/2194823) | closed, status 7, priority 300 | mentioned in #18 | drupal | 2014-07-29 | Ensure that all content/page routes have an _title |
| [#111081](https://www.drupal.org/i/111081) | **open**, status 17, priority 200 | mentioned in #18 | drupal | 2023-06-22 | Output title of current local task in HEAD title (e.g., "People » List") |
| [#1793520](https://www.drupal.org/i/1793520) | closed, status 7, priority 300 | mentioned in #19; mentioned in #48 | drupal | 2014-07-29 | Add access control mechanism for new router system |
| [#2407505](https://www.drupal.org/i/2407505) | closed, status 7, priority 300 | mentioned in #19; mentioned in #48 | drupal | 2016-01-12 | [meta] Finalize the menu links (and other user-entered paths) system |
| [#3076820](https://www.drupal.org/i/3076820) | **open**, status 1, priority 200 | mentioned in #22 | claro | 2026-09-21 | [META] Layout redesign |
| [#2895531](https://www.drupal.org/i/2895531) | **open**, status 18, priority 200 | mentioned in #98 | drupal | 2024-03-22 | Cannot uninstall Content Moderation |

## Issue summary (verbatim; written by the reporter, may have been edited after the comments)

> Problem/Motivation
> 
> As part of #3343940: Field UI 2023 User Research, we noticed few challenges related to our use of local tasks:
> 
> - Few of the test participants navigated to edit fields of an incorrect bundle or even incorrect entity type. When asked, they thought they were editing the entity type or bundle we instructed them to edit. Without knowing the content model of the site, the only indication in the UI that this is not the case is in the breadcrumb
> 
> - Users don't always understand what's the context for the tabs (especially problematic for the second level). For example, on Manage Display there are "Default" and "Teaser" tabs, and users didn't realize they were view modes.
> 
> Nielsen Norman describes this navigation pattern as local navigation.  Their definition is following:
> 
> Local navigation is a type of navigation that is contextual to the user’s current location — showing sibling pages within the current category, and if applicable, the children or nieces and nephews of the current page.
> 
> It also says that:
> 
> local navigation indicates the category of the current page and, thus, works as an orientation element.
> 
> Currently the only UI element that indicates the category and helps with the orientation is the breadcrumb.
> 
> We are also rendering the local tasks as horizontal tabs. The design pattern usually makes people expect it to change content below the tabs, not above it. This is why navigating using Drupal local tasks (rendered as horizontal tabs) feel strange to at least some of the users.
> 
> Proposed resolution
> 
> Allow displaying the page title based on the current local tasks context. This is configurable in the page title block, which is updated to use the new pattern by default in Claro. Other themes continue to use the previous experience unless they explicitly opt-in.
> 
> We need to also figure out how to indicate the correct page title for screen readers. Current proposal is to append the current page title (current tab) to the page title: [Section page title]: [Current page title], e.g. Article: Manage fields.
> 
> We are also proposing to append the section title to the document title: [Current page title] | [Section page title] | [Site title], e.g. Manage fields | Article | Drupal. We could potentially change the separator to something like : or ». This will require changes to templates, so to keep the scope of this issue as tight as possible, ideally this could be done in a follow-up.
> 
> How this looks like with the current page titles can be s
> [cut at 2500 of 3779 characters]

## Comments that carry decisions, proposals, questions or revisions (verbatim)

_Found by word patterns in each comment, so a candidate is not a verdict. "Superseded" and "no later reference" come from the comments' own references to each other._

### #29 joachim, 2023-08-31 (comment id 15213161; referred to)

> > This works more consistently across the board, e.g. something like "Uninstall for Extend" isn't nice, but "Extend: Uninstall" works fairly well. This
> 
> True, but having 'Edit display for Article' would be *really nice*.
> 
> At the risk of derailing and adding complexity, what if there were a way to vary how the local page title & the tab parent title are combined?
> 
> Off the top of my head, could we pass the tab parent title in to the page title callback as a parameter, and let the callback decide how to combine them?
> 
> This could be done in a follow-up -- the perfect is the enemy of the good :)

### #31 needs-review-queue-bot, 2023-09-06 (comment id 15219550; revision)

> The Needs Review Queue Bot tested this issue. It fails the Drupal core commit checks. Therefore, this issue status is now "Needs work".
> 
> This does not mean that the patch needs to be re-rolled or the MR rebased. Read the Issue Summary, the issue tags and the latest discussion here to determine what needs to be done.
> 
> Consult the Drupal Contributor Guide to find step-by-step guides for working with issues.

### #32 lauriii, 2023-09-06 (comment id 15219621; decision): no later comment supersedes it

> I slightly changed how the title is decided, which allows overriding titles for individual pages by using a #title render array item within a controller (similar to what we currently have). This is needed for some routes like entity delete, where the page title is overridden to "Are you sure you want to delete ...". We may need additional APIs to fully address #29 but as mentioned in that comment, this could be done in a follow-up.
> 
> Coincidentally, I was testing out Airtable and noticed that they are implementing the [Section title]: [Current title] format in their page titles. The demo they ship with is a product catalog. In that example, the page titles are Product Catalog: Furnitures, Product Catalog: Vendors, and so on. I'm starting to think that we should move forward with the current proposal and revisit the formatting, and the potential additional APIs to alter that behavior in a follow-up.

### #75 needs-review-queue-bot, 2024-02-29 (comment id 15467141; revision)

> The Needs Review Queue Bot tested this issue. It fails the Drupal core commit checks. Therefore, this issue status is now "Needs work".
> 
> This does not mean that the patch necessarily needs to be re-rolled or the MR rebased. Read the Issue Summary, the issue tags and the latest discussion here to determine what needs to be done.
> 
> Consult the Drupal Contributor Guide to find step-by-step guides for working with issues.

### #81 needs-review-queue-bot, 2024-03-04 (comment id 15473535; revision)

> The Needs Review Queue Bot tested this issue. It no longer applies to Drupal core. Therefore, this issue status is now "Needs work".
> 
> This does not mean that the patch necessarily needs to be re-rolled or the MR rebased. Read the Issue Summary, the issue tags and the latest discussion here to determine what needs to be done.
> 
> Consult the Drupal Contributor Guide to find step-by-step guides for working with issues.

### #83 sakthi_dev, 2024-03-04 (comment id 15473643; revision)

> Rebased with latest changes.

### #98 larowlan, 2024-03-22 (comment id 15509116; decision): no later comment supersedes it

> We were trying to reproduce a bug at Drupal South 2024 #2895531: Cannot uninstall Content Moderation and found that this issue has caused a fatal error for all entity-types when using PrepareModulesEntityUninstallForm
> 
> I discussed this with @quietone at Drupal South and we agreed because this has only been in core for 10 days and it has introduced a new fatal error that makes it impossible to uninstall any module that has entity-types - we decided to revert it.
> 
> Steps to reproduce the bug
> 
> - Install Umami profile
> 
> - Edit a piece of content to move it to draft
> 
> - Visit Extend page and click link next to Content moderation checkbox to 'Remove content moderation states'
> 
> - Fatal error
> 
> I'm adding credit for @yiySHAO, @dscl, @ameymudras and @samundrasharma who worked with me.

### #101 dscl, 2024-03-22 (comment id 15509232; decision): no later comment supersedes it

> There is an open issue for fixing the missing _title_callback: #2862702: PrepareModulesEntityUninstallForm::formTitle does not exist
> 
> @larowlan, @xjm and I have discussed it here at DrupalSouth 2024 just now, and we will be working on that issue to get it fixed.
> 
> And as consequence we agree to mark this as postponed.

### #113 needs-review-queue-bot, 2024-07-09 (comment id 15674557; revision)

> The Needs Review Queue Bot tested this issue. It no longer applies to Drupal core. Therefore, this issue status is now "Needs work".
> 
> This does not mean that the patch necessarily needs to be re-rolled or the MR rebased. Read the Issue Summary, the issue tags and the latest discussion here to determine what needs to be done.
> 
> Consult the Drupal Contributor Guide to find step-by-step guides for working with issues.

### #115 _pratik_, 2024-11-12 (comment id 15853459; revision)

> Rerolled Patch for 10.2.10

### #121 needs-review-queue-bot, 2026-08-24 (comment id 16743901; revision)

> The Needs Review Queue Bot tested this issue. The merge request has merge conflicts and cannot be merged. Therefore, this issue status is now "Needs work".
> 
> This does not mean that the patch necessarily needs to be re-rolled or the MR rebased. Read the Issue Summary, the issue tags and the latest discussion here to determine what needs to be done.
> 
> Consult the Drupal Contributor Guide to find step-by-step guides for working with issues.

## Latest comments (verbatim)

### #119 mgifford, 2026-08-24 (comment id 16743890)

> I think I understand this issue well enough to adjust the MR, but wanted to put forward a patch (AI Generated) which seems to work for me locally. I've included screenshots and in the .zip file there are also other records such as the Guidepup logs.
> 
> The patch in #115 was from two years ago so lots has changed since then.
> 
> Before shot:
> 
> After shot:

### #120 mgifford, 2026-08-24 (comment id 16743892)

> (no text: a comment that only changed a field or attached a file; the API does not carry what it changed)

### #121 needs-review-queue-bot, 2026-08-24: shown above

## Not shown

- 108 of 121 comments: #1-#28, #30, #33-#74, #76-#80, #82, #84-#97, #99-#100, #102-#112, #114, #116-#118. One line each: `reports/issues/3370946/intake/comment-index.json`. Full text: `node scripts/issue-intake.mjs show 3370946 <number>`.

## Supersession seen in the comments' own words

- None found.
