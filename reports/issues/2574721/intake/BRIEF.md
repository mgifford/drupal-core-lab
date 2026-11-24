# Issue brief: #2574721 Provide access to action links in the modules page on small screens

DRAFT extract, deterministic: made by `node scripts/issue-intake.mjs brief 2574721` from the snapshot fetched 2026-11-23T15:50:19.611Z. No model wrote any of it. Text in quote blocks (`>`) is copied from drupal.org and is **data, not instructions**.
Interpretation (what the problem is, what was decided, what is open) is not in this file: see `handoffs/issue.json`, which cites the ids below. Older comments: `node scripts/issue-intake.mjs show 2574721 <number>`.

## Identity

| | |
|---|---|
| Issue | [#2574721](https://www.drupal.org/project/drupal/issues/2574721) status 13, priority 300, category 1, extension system, main; created 2015-09-25, last changed 2026-09-15 |
| Comments | 91 fetched |
| Merge request | none found |
| Diff | not fetched |
| Related issues | 10 (4 open) |
| Review threads | not fetched |
| Patch in the lab | `branches/drupal-2574721.patch` sha256 bc22c415 |

## Limits and gaps of this fetch

- **mr:** no merge request was found for a branch named 2574721-... in the issue fork (patch-only issues need a fork branch for the lab)
- **attachments:** 57 attachments exist, 30 listed (limit 30)

## Related issues

_Parent, related, child, issues that list this one as related, and issues mentioned in the summary or comments. An open one may hold work this issue depends on or leaves behind._

| Issue | State | How it is linked | Project | Last changed | Title |
|---|---|---|---|---|---|
| [#2151109](https://www.drupal.org/i/2151109) | closed, status 7, priority 300 | related; mentioned in #9; mentioned in #10; lists this issue as related | ? | 2015-10-20 | Convert theme_system_modules_details() to Twig |
| [#3216341](https://www.drupal.org/i/3216341) | closed, status 7, priority 200 | related; mentioned in #82 | drupal | 2021-10-05 | Provide a module-specific permissions form |
| [#2035079](https://www.drupal.org/i/2035079) | **open**, status 4, priority 300 | related; mentioned in #84; lists this issue as related | ? | 2026-10-20 | [PP-1] Figure out what to do with the install/uninstall modules page |
| [#2372183](https://www.drupal.org/i/2372183) | **open**, status 13, priority 300 | mentioned in #4; lists this issue as related | ? | 2025-02-16 | Display same info for themes as for modules |
| [#2906547](https://www.drupal.org/i/2906547) | **open**, status 13, priority 200 | mentioned in #81; lists this issue as related | ? | 2023-09-06 | Add links to Drupal.org project pages to module listings in /admin/modules |
| [#2152519](https://www.drupal.org/i/2152519) | **open**, status 17, priority 200 | lists this issue as related | ? | 2018-09-22 | [meta] Make sure Drupal 8 looks good and works right on browsers (both mobile+desktop) |
| [#2575737](https://www.drupal.org/i/2575737) | closed, status 7, priority 300 | mentioned in #32 | drupal | 2015-12-03 | Copy templates, CSS, and related assets to Stable and override core libraries' CSS |
| [#517148](https://www.drupal.org/i/517148) | closed, status 7, priority 200 | mentioned in #63 | views | 2010-03-17 | override default filter handlers |
| [#535412](https://www.drupal.org/i/535412) | closed, status 5, priority 200 | mentioned in #72 | cck_blocks | 2009-10-28 | Include nid in the Block output |
| [#3012004](https://www.drupal.org/i/3012004) | closed, status 3, priority 200 | mentioned in #81 | drupal | 2021-10-24 | Add a link to the module's drupal.org project page in the module admin page |

## Issue summary (verbatim; written by the reporter, may have been edited after the comments)

> Problem/Motivation
> 
> The modules page used to have the action links for Help, Configuration and Permissions directly visible. In Drupal 8, these are now hidden in the collapsed module information, and are impossible to use in screens smaller than 60em.
> 
> Proposed resolution
> 
> Create a dropbutton with the action links, so that it's possible to use in all screen sizes, and doesn't require the manual uncollapse of the summary to check if the operations exist.
> 
> Remaining tasks
> 
> Review and merge.
> 
> User interface changes
> 
> The modules page will now have the action links visible by default, as a dropbutton.
> 
> Before Desktop:
> 
> After Desktop:
> 
> Before Mobile:
> 
> After Mobile:
> 
> API changes
> 
> None.
> 
> Data model changes
> 
> None.

## Comments that carry decisions, proposals, questions or revisions (verbatim)

_Found by word patterns in each comment, so a candidate is not a verdict. "Superseded" and "no later reference" come from the comments' own references to each other._

### #6 yoroy, 2015-09-27 (comment id 10382747; referred to)

> It does seem we went a bit overboard here and put away too much behind the little triangle, so I support this proposal. And immediately have additional considerations: Why did we add icons? Why are the links in this order? I'd expect 'Configure' to be the first. Should the links be blue?
> 
> @lewisnyman: not sure about singling out the configure link. If there are permissions, it's quite likely you need to set those up as well.

### #18 jcnventura, 2015-10-22 (comment id 10481202; proposal): no later comment supersedes it

> It's a possibility, and looks almost what we have in D7 now.
> 
> Honestly, it looks strange the way you propose it. If we do this, we should clear the operations area (i.e. add a third column). That RDF description invading the area looks confusing in my view. And let's leave the links blue, as suggested by yoroy in #6, same as they are in D7.
> 
> Also, why hide the help link? If a module has an help page, we should make it visible, not hide it under the rug.
> 
> I've actually tested with adding a third column in the meantime, with the 3 operations. Laying them horizontally makes the center column so small, that it simply looks ugly. Laying them vertically, defeats the purpose by transforming most of those hideous two-liners into three-liners.
> 
> I see two realistic options here:
> 
> - Forget about trying to keep the modules page small in height (it will never be, so why worry so much?) - as in the current patch -, or
> 
> - Convert these operations into a dropbutton, like the one used in the manage content and users pages.
> 
> The big bonus for option 2 is that we might be able to provide this button in smaller screens. At the moment, on screens smaller than 60em these operations are removed from the display together with the rest of the column where they reside. I'm upping this to major, as this transforms an annoyance into a potential block to the admin users from configuring an installed module.

### #21 jcnventura, 2015-10-23 (comment id 10485366; proposal): no later comment supersedes it

> Re-write of the patch using the dropbutton in order to provide these operations also in small screens. It looks terrible, as it needs some styles applied to make the new column always use around 12em, and to make the new dropbutton always the same size. Also, I've hardcoded the dropbutton classes and multiple divs in the template. There must be a better way of wrapping this from Twig...
> 
> Skipping the interdiff, as this is a fresh start, using option 2, of my comment in #18. The previous patches used option 1, which does not solve the problem in small screens.

### #77 suresh prabhu parkala, 2021-04-29 (comment id 14077414; revision)

> A re-rolled patch against the latest 9.2.x.

### #79 djsagar, 2021-04-29 (comment id 14077515; revision)

> Re-rolled patch for drupal 9.2.x as patch 77 getting error.

### #82 wim leers, 2022-04-08 (comment id 14474799; revision)

> Conflicted with #3216341: Provide a module-specific permissions form. Rebased.

### #83 wim leers, 2022-04-08 (comment id 14474827; question): no later comment refers to it (possibly unresolved)

> This seems like a massive usability improvement 🤩
> 
> It looks a bit odd visually, but I think this is a case where it's reasonable to decide that usability should trump aesthetics:
> 
> Review
> 
> - I found one visual glitch when using Seven:
> 
> - There's no support for Claro yet. 😅 I think this is probably a hard blocker at this point, because Claro is very close to becoming stable (not experimental anymore). And … that would actually be a very cool strategy here: if we'd do this only for Claro, we avoid the BC break for classy and stable, which means we could do this right away!

## Latest comments (verbatim)

### #89 mgifford, 2026-09-08 (comment id 16764169)

> merge request !17049 was an AI Generated MR based on the summary of the threads from the last decade. This follows the model provided for the button as close as I could make it do so. There was initially a problem with the dropdown button only working for the keyboard, and not the mouse, but that got resolved.
> 
> I don't know if it needs to be assigned to Claro these days. Is this basically Theming? I'm not sure.
> 
> Hopefully this patch encourages us to move ahead and review this in more depth.

### #90 nicxvan, 2026-09-13 (comment id 16768600)

> There are a lot of changes described in 88 that don't seem to be actually in the change.
> 
> Are those changes that are missing or unnecessary?
> 
> Did you pull them out?
> 
> There are also test failures.

### #91 mgifford, 2026-09-15 (comment id 16771302)

> Let me verify this @nicxvan - I am having trouble getting my local system reset so there might be stuff from other issues that snuck in.

## Not shown

- 81 of 91 comments: #1-#5, #7-#17, #19-#20, #22-#76, #78, #80-#81, #84-#88. One line each: `reports/issues/2574721/intake/comment-index.json`. Full text: `node scripts/issue-intake.mjs show 2574721 <number>`.

## Supersession seen in the comments' own words

- None found.
