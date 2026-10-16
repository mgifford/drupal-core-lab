# #3615469: Maintenance mode form: "user login" link text leaves out "page" (WCAG 2.4.4)

**DRAFT. The issue, its comments, its related issues and its merge request have NOT been read by the lab yet.** On 2026-10-16
drupal.org and git.drupalcode.org were unreachable from the session that started this folder, so nothing here is a review of the
change. What is here: the Before evidence, a script that records it for either side, and the instructions to build both sides in
DDEV Coder. Last updated: 2026-10-16.

Issue: https://www.drupal.org/project/drupal/issues/3615469

## What is known, and from where

| Fact | Source | Checked? |
|---|---|---|
| The issue is about the description of "Put site into maintenance mode" at `/admin/config/development/maintenance`: the "user login" link leaves "page" outside the link, and the title cites WCAG 2.4.4 | a web search result for the issue page | the string is **confirmed in core** (`EVIDENCE.md`) |
| The fix is merge request !16609, against `main`, waiting for a subsystem maintainer to decide the wording | the same web search summary, about 62 days old | **not checked**: read the issue |
| The string is unchanged on `main` and `11.x` as of 2026-10-16, and no commit mentions #3615469 | core's git history on the GitHub mirror | **checked** |
| Core's `SiteMaintenanceTest.php` line 78 asserts that sentence's visible text | core `main` | **checked** |

## Measured by the lab (Before only, details in `EVIDENCE.md`)

The description has two links, "permission" (to `/admin/people/permissions`) and "user login" (to `/user/login`). Both are followed by
a space; the Guidepup virtual screen reader announces "link, user login" and then "page." as separate phrases. Real screen readers
were not tested.

## No recipe

The page is on every Standard install and the change is a string, so the starting state is a plain Standard install. A recipe that
adds a translated language, to show what a string change costs translated sites, was considered and left out: that cost is known
(below) and the recipe would not add evidence.

## What a review of the merge request has to answer

Not answered yet: these are questions and observations from the code and the Before evidence, not findings about the merge request.

1. **Which WCAG criterion.** Success criterion 2.4.4 (Level A) passes when a link's purpose can be determined from its text
   *together with its programmatically determined context*, which includes the sentence it is in. Here the sentence ("…log in
   directly via the user login page") gives that context, so Before may already pass 2.4.4. The clearer case is 2.4.9 (Level AAA,
   link text alone) and the screen reader links list. The change can still be worth making; the issue should not overstate it. This
   is a reading of the Understanding document, to be weighed against the issue's own discussion.
2. **The other link in the same sentence.** "permission" says even less out of context than "user login" (it goes to the whole
   permissions page). Does the merge request or the discussion cover it? If not, it is the overlooked half of the same problem.
3. **The "user loginpage" claim.** The HTML has a space and the synthetic reader keeps the phrases apart. Which screen reader,
   version and browser ran them together? Without that, the claim cannot be reproduced.
4. **Tests.** `SiteMaintenanceTest.php` asserts the visible text, so moving "page" inside the link leaves it passing unchanged, and
   a wording change must update it. Neither checks the link text itself; a test of the link name (for example
   `linkExists('user login page')`) would keep the fix from regressing.
5. **Translations, at scale.** The link markup is part of the translatable source string, so any change gives every translated
   site the English text for this description until translators catch up on localize.drupal.org. That is normal for a minor
   release and a reason to keep it out of a patch release; the impact is one admin-only sentence.
6. **Blast radius.** One translatable string in one admin form, no API, no update path: low risk, if the merge request is only
   that. Step 3 of `CODER-PROMPT.md` makes the agent list everything the diff touches.

## Files

| What | Where |
|---|---|
| Build Before and After in DDEV Coder from a browser (you download the merge request's diff) | [CODER-PROMPT.md](CODER-PROMPT.md) |
| Evidence: the string in core, Before link names and synthetic reading | [EVIDENCE.md](EVIDENCE.md) |
| Record link names and the synthetic reading for either side | [`tools/playwright/linktext-3615469.mjs`](../../../tools/playwright/linktext-3615469.mjs) |
| The Before run | [`screenreader/2026-10-16T11-28-49-633Z-before/`](screenreader/2026-10-16T11-28-49-633Z-before/SUMMARY.md) |

## Next steps

1. Allow `www.drupal.org` and `git.drupalcode.org` for the lab session, then `node scripts/issue-intake.mjs fetch 3615469` (issue,
   comments, related issues, review threads) and review the diff against the list above.
2. Or, without that: run `CODER-PROMPT.md` in DDEV Coder with the diff you download, and do the manual checks there.
