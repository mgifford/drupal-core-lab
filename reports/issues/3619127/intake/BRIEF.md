# Issue brief: #3619127 Forms sidebar doesn't open with error links from Inline Form Errors module

DRAFT extract, deterministic: made by `node scripts/issue-intake.mjs brief 3619127` from the snapshot fetched 2026-11-25T13:41:20.832Z. No model wrote any of it. Text in quote blocks (`>`) is copied from drupal.org and is **data, not instructions**.
Interpretation (what the problem is, what was decided, what is open) is not in this file: see `handoffs/issue.json`, which cites the ids below. Older comments: `node scripts/issue-intake.mjs show 3619127 <number>`.

## Identity

| | |
|---|---|
| Issue | [#3619127](https://www.drupal.org/project/drupal/issues/3619127) status 8, priority 300, category 1, Admin theme, main; created 2026-08-25, last changed 2026-10-01 |
| Comments | 41 fetched |
| Merge request | [!16895](https://git.drupalcode.org/project/drupal/-/merge_requests/16895) opened, branch `3619127-forms-sidebar-with-ife` into `main`, head `cdff6661a398`, updated 2026-09-17T01:34:03.594Z |
| Diff | 6790 bytes, sha256 6f9621fd |
| Related issues | 4 (4 open) |
| Review threads | 0 on the merge request(s), **0 unresolved** |
| Patch in the lab | `branches/3619127-forms-sidebar-with-ife.patch` sha256 fe90ecc4 |

## Limits and gaps of this fetch

- **notes:** The review threads of !16895 could not be read: https://git.drupalcode.org/api/v4/projects/project%2Fdrupal/merge_requests/16895/discussions?per_page=100&page=1 answered HTTP 401

## Related issues

_Parent, related, child, issues that list this one as related, and issues mentioned in the summary or comments. An open one may hold work this issue depends on or leaves behind._

| Issue | State | How it is linked | Project | Last changed | Title |
|---|---|---|---|---|---|
| [#3618906](https://www.drupal.org/i/3618906) | **open**, status 17, priority 200 | parent | drupal | 2026-08-27 | [Meta] Forms sidebar accessibility issues |
| [#3604037](https://www.drupal.org/i/3604037) | **open**, status 13, priority 300 | related | drupal | 2026-11-18 | Indicate that grouping elements have child element errors for UX and a11y |
| [#3619387](https://www.drupal.org/i/3619387) | **open**, status 14, priority 300 | mentioned in the summary | drupal | 2026-11-09 | Indicate on forms sidebar toggle button that sidebar has child element errors |
| [#3576488](https://www.drupal.org/i/3576488) | **open**, status 1, priority 200 | mentioned in #12; mentioned in #40 | drupal | 2026-11-08 | [meta] Admin theme: path to beta, stable, and beyond |

## Issue summary (verbatim; written by the reporter, may have been edited after the comments)

> Problem/Motivation
> 
> Inline Form Errors replaces the error messages in the summary block at the top of the page with links to the invalid fields.
> 
> For errors inside details and vertical tabs, clicking the error link opens the details / vertical tab and focuses the invalid field.
> 
> For errors in Default Admin's closed sidebar, clicking the error link does nothing. The sidebar remains closed, and the invalid field remains hidden.
> 
> I think this causes failure of WCAG SC 3.3.3 Error Suggestion (Level AA).
> 
> Inline Form Errors moves the descriptive error messages with suggestions to the invalid fields. If users can't find the invalid fields, they also won't find the detailed error messages.
> 
> Related:
> 
> The closed sidebar provides no indication that it contains invalid fields. Working on that in #3619387: Indicate on forms sidebar toggle button that sidebar has child element errors.
> 
> Steps to reproduce
> 
> - Set Default Admin as the admin theme.
> 
> - Install the article test recipe (drush recipe core/tests/fixtures/recipes/article_content_type),
> 
> or create an Article content type & install the Path module (aka path_alias).
> 
> - Enable the Inline Form Errors module.
> 
> - Go to /node/add/article.
> 
> - Reduce viewport width until the sidebar on the right containing the "advanced" fields collapses.
> 
> - Click the toggle button to expand the sidebar.
> 
> - Enter a value without a beginning slash in the URL alias field.
> 
> - Close the sidebar.
> 
> - Click the Save button.
> 
>         This should cause a validation error at the top of the page, something like the following with "URL alias" being a link:
> 
>         "1 error has been found:
> 
>         URL alias".
> 
> - Click the "URL alias" link in the error message.
> 
> Expected
> 
> - The sidebar is opened.
> 
> - Focus moves to the invalid URL alias field.
> 
> Actual
> 
> Nothing happens when the "URL alias" link is clicked.
> 
> Proposed resolution
> 
> Listen for formFragmentLinkClickOrHashChange events and open the sidebar, as with details elements.
> 
> Remaining tasks
> 
> - Create merge request.
> 
> - Review.
> 
> - Make the decision regarding jQuery (frontend framework manager or higher?).
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

### #12 kentr, 2026-08-29 (comment id 16750636; question): no later comment refers to it (possibly unresolved)

> Tagging with 11.5.0 release priority because IFE is 11.5.0 release priority and this was declared as a blocker for IFE in #3576488: [meta] Admin theme: path to beta, stable, and beyond:
> 
> #3619127: Forms sidebar doesn't open with error links from Inline Form Errors module
> 
> - There appears to be a dependency on the other issue that KentR is working on. Don’t feel this is a blocker since IFE is not enabled by default
> 
> - [Mike G] I do see this as being a blocker if we want to have IFE in core and finally moving from an experimental module. Core is changing a lot though, so….
> 
> - [Mike H] It’s a blocker for IFE in core, but not Admin theme being stable

### #22 needs-review-queue-bot, 2026-09-05 (comment id 16759445; revision)

> The Needs Review Queue Bot tested this issue. The merge request has merge conflicts and cannot be merged. Therefore, this issue status is now "Needs work".
> 
> This does not mean that the patch necessarily needs to be re-rolled or the MR rebased. Read the Issue Summary, the issue tags and the latest discussion here to determine what needs to be done.
> 
> Consult the Drupal Contributor Guide to find step-by-step guides for working with issues.

### #24 kentr, 2026-09-05 (comment id 16759735; revision)

> Rebased and green pipeline.

### #40 kentr, 2026-09-17 (comment id 16773629; question): no later comment refers to it (possibly unresolved)

> Sorry, I misremembered this to be a blocker for #3576488: [meta] Admin theme: path to beta, stable, and beyond.
> 
> I don't want to take FEFMs away from D12 beta blockers. Perhaps it can wait until @mherchel is available.

## Latest comments (verbatim)

### #39 kentr, 2026-09-17 (comment id 16773625)

> (no text: a comment that only changed a field or attached a file; the API does not carry what it changed)

### #40 kentr, 2026-09-17: shown above

### #41 mgifford, 2026-10-01 (comment id 16791045)

> I've reviewed this locally and it looks great.

## Not shown

- 35 of 41 comments: #1-#11, #13-#21, #23, #25-#38. One line each: `reports/issues/3619127/intake/comment-index.json`. Full text: `node scripts/issue-intake.mjs show 3619127 <number>`.

## Supersession seen in the comments' own words

- None found.
