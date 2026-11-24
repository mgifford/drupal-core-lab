# Where to focus

Built from the local `status.json` snapshots, `BRANCHES.md` and `ARCHIVED.md` by `node scripts/focus-issues.mjs`. No model was called and nothing here posts to drupal.org. The status and MR data can be stale; open the issue before acting.

**Priority:** Reopened archive → Needs review → RTBC → Needs work → Active/postponed → close-out. 0 reopened, 4 need review, 2 are RTBC, 18 need work.

| Tier | Count |
|---|---|
| P0 · Reopened archive | 0 |
| P0 · Review now | 4 |
| P1 · Final verification | 2 |
| P2 · Unblock / refresh | 18 |
| P3 · Watch | 11 |
| P4 · Postponed | 1 |
| P5 · Close out | 5 |
| P6 · Not checked | 0 |
| P7 · Archived | 0 |

## P0 · Review now — Needs review (4)

Needs review: the most useful place to help a reviewer. If the MR moved since the lab tested it, re-test first; do not review stale evidence.

| Issue | Title | Priority | MR | Lab tested | Why now | Next action |
|---|---|---|---|---|---|---|
| [#3619127](3619127/SUMMARY.md) | Forms sidebar doesn't open with error links from Inline Form Errors module | Major | [!16895](https://git.drupalcode.org/project/drupal/-/merge_requests/16895) opened at `cdff6661` | `cdff6661` | Current head tested: review | Review the current evidence and draft a comment |
| [#2847425](2847425/) | #states not affecting visibility/requirement of managed_file | Major | [!7305](https://git.drupalcode.org/project/drupal/-/merge_requests/7305) opened at `6e43afa2` | `71b1ad1d` | MR head changed: re-test first | `node scripts/test-mr.mjs 2847425` — MR !7305 is at 6e43afa2; the lab tested 71b1ad1d; then review |
| [#3606655](3606655/) | Allow user-configurable UI settings - starting with dark mode | Normal | [!16432](https://git.drupalcode.org/project/drupal/-/merge_requests/16432) opened at `170be9e3` | `08a4cb4c` | MR head changed: re-test first | `node scripts/test-mr.mjs 3606655` — MR !16432 is at 170be9e3; the lab tested 08a4cb4c; then review |
| [#3207233](3207233/SUMMARY.md) | Improve the visual indication of the active workspace in the Workspaces… | Major | [!17464](https://git.drupalcode.org/project/drupal/-/merge_requests/17464) opened, draft at `278ea9ee` | not recorded | Draft MR: confirm readiness | Draft MR !17464: confirm it is ready before reviewing; do not review unfinished work |

## P1 · Final verification — RTBC (2)

RTBC: one final run on current core main.

| Issue | Title | Priority | MR | Lab tested | Next action |
|---|---|---|---|---|---|
| [#3619387](3619387/) | Indicate on forms sidebar toggle button that sidebar has child element… | Major | [!17013](https://git.drupalcode.org/project/drupal/-/merge_requests/17013) opened at `052a9309` | `cb915a48` | `node scripts/test-mr.mjs 3619387` on current core main — MR !17013 is at 052a9309; the lab tested cb915a48; if green, confirm with maintainers |
| [#3615469](3615469/SUMMARY.md) | Change link text on Maintenance mode form to 'user login page' | Normal | [!16609](https://git.drupalcode.org/project/drupal/-/merge_requests/16609) opened at `21bbeeb1` | `21bbeeb1` | `node scripts/test-mr.mjs 3615469` on current core main; if green, confirm with maintainers |

## P2 · Unblock / refresh — Needs work (18)

Needs work: review the queue and decide whether a patch or test can move it. Queue review means reading the recent comments, tags and MR before deciding; it is not a request to bump the issue.

| Issue | Title | Priority | MR | Lab tested | Flag | Queue tags | Next action |
|---|---|---|---|---|---|---|---|
| [#3155130](3155130/SUMMARY.md) | "Edit summary" toggle on text fields has many accessibility issues | Normal | none found | not recorded | No MR found: find a patch | Accessibility | `node scripts/issue-intake.mjs fetch 3155130`; find or refresh a patch/MR |
| [#3593502](3593502/SUMMARY.md) | Introduce a new Menu UI to resolve memory issues and improve user experience | Major | [!15975](https://git.drupalcode.org/project/drupal/-/merge_requests/15975) opened at `0a887245` | `6d566c31` | MR head changed: refresh and re-test | Needs usability review, Needs accessibility review, Accessibility | `node scripts/test-mr.mjs 3593502` — MR !15975 is at 0a887245; the lab tested 6d566c31; then review the queue |
| [#3636143](3636143/SUMMARY.md) | Regression: The toggle button border in the navigation sidebar has a too… | Normal | [!17738](https://git.drupalcode.org/project/drupal/-/merge_requests/17738) opened at `2de21052` | `5e5521e4` | MR head changed: refresh and re-test | Accessibility, wcag1411 | `node scripts/test-mr.mjs 3636143` — MR !17738 is at 2de21052; the lab tested 5e5521e4; then review the queue |
| [#3637339](3637339/SUMMARY.md) | Skip to main content link is not using the selected focus color in light… | Normal | [!17818](https://git.drupalcode.org/project/drupal/-/merge_requests/17818) opened at `3a86954d` | `8c4a0e70` | MR head changed: refresh and re-test | Accessibility | `node scripts/test-mr.mjs 3637339` — MR !17818 is at 3a86954d; the lab tested 8c4a0e70; then review the queue |
| [#2951317](2951317/SUMMARY.md) | Radios element missing "required" attribute | Normal | [!15536](https://git.drupalcode.org/project/drupal/-/merge_requests/15536) opened at `c76e9244` | `ab7ab046` | MR head changed: refresh and re-test | Accessibility, Needs accessibility review, wcag131, Needs Review Queue Initiative | `node scripts/test-mr.mjs 2951317` — MR !15536 is at c76e9244; the lab tested ab7ab046; then review the queue |
| [#3619154](3619154/) | Accessibility fixes for Admin theme's node add/edit sidebar toggle control | Normal | [!16911](https://git.drupalcode.org/project/drupal/-/merge_requests/16911) opened at `65e64ee4` | `175e6f17` | MR head changed: refresh and re-test | Accessibility | `node scripts/test-mr.mjs 3619154` — MR !16911 is at 65e64ee4; the lab tested 175e6f17; then review the queue |
| [#3604037](3604037/SUMMARY.md) | Indicate that grouping elements have child element errors for UX and a11y | Major | [!17078](https://git.drupalcode.org/project/drupal/-/merge_requests/17078) opened at `c3c52b00` | not recorded | No tested revision: record it | Accessibility, wcag331 | Record the tested revision; review recent comments/tags and the patch |
| [#3587661](3587661/SUMMARY.md) | Missing labels in "Limited files with a single pre-existing value… | Normal | [!16335](https://git.drupalcode.org/project/drupal/-/merge_requests/16335) opened at `3ec7eefd` | not recorded | No tested revision: record it | Accessibility, Needs Review Queue Initiative | Record the tested revision; review recent comments/tags and the patch |
| [#3370946](3370946/SUMMARY.md) | Page title should contextualize the local navigation | Normal | [!4479](https://git.drupalcode.org/project/drupal/-/merge_requests/4479) opened at `1ff37e70` | not recorded | No tested revision: record it | wcag242, wcag246, Accessibility | Record the tested revision; review recent comments/tags and the patch |
| [#2848307](2848307/SUMMARY.md) | Inline errors not working on form table elements | Normal | [!16355](https://git.drupalcode.org/project/drupal/-/merge_requests/16355) opened at `46e9b7e7` | not recorded | No tested revision: record it | Accessibility, wcag331 | Record the tested revision; review recent comments/tags and the patch |
| [#2574721](2574721/SUMMARY.md) | Provide access to action links in the modules page on small screens | Major | [!17049](https://git.drupalcode.org/project/drupal/-/merge_requests/17049) opened at `ed3917f4` | `ed3917f4` | Queue review | Needs subsystem maintainer review, wcag1410, Accessibility | `node scripts/issue-intake.mjs fetch 2574721`; review recent comments/tags and decide whether to update |
| [#3426468](3426468/) | Make the active menu item visually stand out more | Normal | [!8446](https://git.drupalcode.org/project/drupal/-/merge_requests/8446) opened at `da537706` | `da537706` | Queue review | Accessibility, wcag141, WCAG 143, wcag1411 | `node scripts/issue-intake.mjs fetch 3426468`; review recent comments/tags and decide whether to update |
| [#3630425](3630425/SUMMARY.md) | Multi-value field widget table renders an empty <th> for the actions… | Normal | [!17421](https://git.drupalcode.org/project/drupal/-/merge_requests/17421) opened at `f1f524f9` | `f1f524f9` | Queue review | Accessibility | `node scripts/issue-intake.mjs fetch 3630425`; review recent comments/tags and decide whether to update |
| [#3419891](3419891/SUMMARY.md) | Increase size of alternative text field in Image dialog | Normal | [!16984](https://git.drupalcode.org/project/drupal/-/merge_requests/16984) opened at `1931822c` | `1931822c` | Queue review | Accessibility | `node scripts/issue-intake.mjs fetch 3419891`; review recent comments/tags and decide whether to update |
| [#3415961](3415961/SUMMARY.md) | [drupalMedia] Using the Insert Media button causes the window to scroll to… | Normal | [!12348](https://git.drupalcode.org/project/drupal/-/merge_requests/12348) opened at `2dfd37b4` | `2dfd37b4` | Queue review | Accessibility, Needs accessibility review | `node scripts/issue-intake.mjs fetch 3415961`; review recent comments/tags and decide whether to update |
| [#3618405](3618405/) | Purpose of views exposed filters form is unclear when zoomed in | Normal | [!17043](https://git.drupalcode.org/project/drupal/-/merge_requests/17043) opened at `c95dbac4` | `c95dbac4` | Queue review | Accessibility | `node scripts/issue-intake.mjs fetch 3618405`; review recent comments/tags and decide whether to update |
| [#3083103](3083103/SUMMARY.md) | Programmatically associate error messages with inputs | Normal | [!15692](https://git.drupalcode.org/project/drupal/-/merge_requests/15692) opened at `ed60e948` | `ed60e948` | Queue review | Accessibility, wcag331 | `node scripts/issue-intake.mjs fetch 3083103`; review recent comments/tags and decide whether to update |
| [#2942404](2942404/SUMMARY.md) | System messages should be accessible | Normal | [!6112](https://git.drupalcode.org/project/drupal/-/merge_requests/6112) opened at `7dc95633` | `7dc95633` | Queue review | Accessibility, wcag131 | `node scripts/issue-intake.mjs fetch 2942404`; review recent comments/tags and decide whether to update |

## P3 · Watch — Active (11)

Active: no reviewable change yet.

| Issue | Title | Priority | MR | Why watch |
|---|---|---|---|---|
| [#867830](867830/SUMMARY.md) | "Unpublished" style of rendered entities is not accessible (and looks bad) | Major | none found | Monitor |
| [#3619933](3619933/) | Drupal Admin Theme Colors | Major | [!16922](https://git.drupalcode.org/project/drupal/-/merge_requests/16922) opened at `63ea50be` | Monitor |
| [#3046089](3046089/SUMMARY.md) | Accessibility of Main toolbar items and internal editing | Major | none found | Monitor |
| [#3637163](3637163/SUMMARY.md) | The custom accent color field is in lack of a form validation check | Normal | none found | Monitor |
| [#3243173](3243173/SUMMARY.md) | Form focus / screen reader issues related to server side form validation | Normal | none found | Monitor |
| [#3631337](3631337/SUMMARY.md) | Decide how to semantically label HTML elements for errors/warnings in… | Normal | none found | Monitor |
| [#3631321](3631321/SUMMARY.md) | Improve the visual representation of none active vertical tabs in forced… | Normal | none found | Monitor |
| [#3618230](3618230/SUMMARY.md) | Adopt the ajax MessageCommand for file uploads | Normal | [!16777](https://git.drupalcode.org/project/drupal/-/merge_requests/16777) opened at `01e19a6f` | Monitor |
| [#3587680](3587680/SUMMARY.md) | empty-heading: Ensure headings have discernible text | Normal | none found | Monitor |
| [#3614293](3614293/SUMMARY.md) | Automated Form Validation Accessibility Testing | Normal | none found | Monitor |
| [#3273054](3273054/SUMMARY.md) | Checkboxes of text formats in the filter section on the permissions page… | Normal | none found | Monitor |

## P4 · Postponed / to be ported (1)

Postponed or to be ported; leave it alone unless it moves.

| Issue | Title | Status | MR |
|---|---|---|---|
| [#3593539](3593539/SUMMARY.md) | [PP-1] Replace compact mode link with a switch to improve accessibility | Postponed | none found |

## P5 · Close out — fixed / closed upstream (5)

Fixed or closed upstream: confirm, then archive. Confirm the fix is in core main before archiving; archiving keeps the folder, evidence and pinned comparison.

| Issue | Title | drupal.org status | Action |
|---|---|---|---|
| [#3627936](3627936/) | Active workspace has a broken styling in dark mode | Closed (fixed) | Closed (fixed): confirm, then `node scripts/issue-archive.mjs 3627936` |
| [#3093378](3093378/SUMMARY.md) | Use ARIA disclosure pattern for submenu buttons in vertical toolbar… | Closed (fixed) | Closed (fixed): confirm, then `node scripts/issue-archive.mjs 3093378` |
| [#3617875](3617875/SUMMARY.md) | Better Dark Mode Support for Disabled Elements | Closed (fixed) | Closed (fixed): confirm, then `node scripts/issue-archive.mjs 3617875` |
| [#3087389](3087389/SUMMARY.md) | When selecting media to add through the media library modal, the # of #… | Closed (duplicate) | Closed (duplicate): confirm, then `node scripts/issue-archive.mjs 3087389` |
| [#3273806](3273806/SUMMARY.md) | WCAG color constrast fails on toolbar direction icon | Closed (duplicate) | Closed (duplicate): confirm, then `node scripts/issue-archive.mjs 3273806` |

## How this is ranked

- **Needs review** first: it is the highest-leverage place to help a reviewer. A changed MR head is re-tested before review.
- **RTBC** next: one final run on current core main; then confirm and close.
- **Needs work** next: read the recent comments, tags and MR, then decide whether a patch refresh or re-test can unblock it.
- **Active** and postponed issues are watched, not bumped.
- **Fixed/closed** issues are close-out candidates: confirm on core main, then archive with `scripts/issue-archive.mjs`.
- A status snapshot is not a review: open the issue, its comments and its MR threads before acting. Nothing here posts to drupal.org.
