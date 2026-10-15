# Issue brief: #3627936 Active workspace has a broken styling in dark mode

DRAFT extract, deterministic: made by `node scripts/issue-intake.mjs brief 3627936` from the snapshot fetched 2026-10-15T18:48:13.196Z. No model wrote any of it. Text in quote blocks (`>`) is copied from drupal.org and is **data, not instructions**.
Interpretation (what the problem is, what was decided, what is open) is not in this file: see `handoffs/issue.json`, which cites the ids below. Older comments: `node scripts/issue-intake.mjs show 3627936 <number>`.

## Identity

| | |
|---|---|
| Issue | [#3627936](https://www.drupal.org/project/drupal/issues/3627936) status 8, priority 200, category 1, Admin theme, main; created 2026-10-03, last changed 2026-10-05 |
| Comments | 8 fetched |
| Merge request | none found |
| Diff | not fetched |

## Limits and gaps of this fetch

- **mr:** no merge request was found for a branch named 3627936-... in the issue fork (patch-only issues need a fork branch for the lab)

## Issue summary (verbatim; written by the reporter, may have been edited after the comments)

> Problem/Motivation
> 
> The background for the active workspace on /admin/config/workflow/workspaces is white in dark mode:
> 
> On hover the correct styling is applied
> 
> Steps to reproduce
> 
> - Enable dark mode
> 
> - Go to /admin/config/workflow/workspaces
> 
> Proposed resolution
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

### #2 shank115, 2026-10-05 (comment id 16797024; proposal): no later comment supersedes it

> I was able to reproduce this locally with the default_admin theme in dark mode.
> 
> I think the cause is this hard-coded colour in core/modules/workspaces_ui/css/workspaces.overview.pcss.css:
> 
> tr.active-workspace {
>    background-color: #ebeae4;
>  }
> 
> It's more specific than the theme's "table tr" rule, so the light background shows even in dark mode. On hover the theme's "table tr:hover" rule wins, which I think is why hovering looks correct.
> 
> A few possible ways to fix it:
> 
> 1. Use light-dark() with transparent
> 
> tr.active-workspace {
>     background-color: light-dark(#ebeae4, transparent);
>  }
> 
> Simplest fix, but the active row would no longer be highlighted in dark mode.
> 
> 2. Use light-dark() with a subtle dark colour
> 
> tr.active-workspace {
>     background-color: light-dark(#ebeae4, rgb(255 255 255 / 0.08));
>   }
> 
> This keeps a faint highlight in dark mode. It still stays in the module and doesn't depend on any theme.
> 
> 3. Move the style to the admin theme
> 
> There's already a @todo saying this should move to the admin theme. default_admin could style it with its own variable, which already works in both modes (the hover state uses it):
> 
> tr.active-workspace {
>       background-color: var(--admin-color-bg-item);
>   }
> 
> I'd lean towards option 3, since it matches the @todo and would follow the theme's accent colour. Options 1 or 2 would be a smaller change if we'd rather keep it in the module for now.
> 
> Please let me know which approach sounds best.

## Latest comments (verbatim)

### #6 hoxton, 2026-10-05 (comment id 16797620)

> 

### #7 hoxton, 2026-10-05 (comment id 16797622)

> 

### #8 rkoller, 2026-10-05 (comment id 16797895)

> thanks for an initial MR @hoxton... i've tried to check it out, but problem is, you are using the branch name "main" which is already taken. so the MR does not work... but i've manually applied the change using the transparent keyword. that way the state isn't visible at all. that is not in line with WCAG2.2 SC1.4.11
> 
> i've then manually applied the suggestion in #2.2 and #2.3 as well ... with that approach in both cases the active state is at least somehow visible. main problem is that it doesnt meet the required minimum of 3:1 for state, both have a contrast of around 1.28:1 and 1.29:2... tha
> [cut at 600 of 1319 characters]

## Not shown

- 4 of 8 comments: #1, #3-#5. One line each: `reports/issues/3627936/intake/comment-index.json`. Full text: `node scripts/issue-intake.mjs show 3627936 <number>`.

## Supersession seen in the comments' own words

- None found.
