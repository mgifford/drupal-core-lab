# Status of #3273054 (2026-10-15)

Issue: https://www.drupal.org/project/drupal/issues/3273054
Title: *Checkboxes of text formats in the filter section on the permissions page have visually hidden labels with links causing hidden focus states*
Status on drupal.org: 1 (Active). Priority: Normal. Category: Bug report. Component: user.module.
Version field on the issue: `main`. Created 2022-04-01 by rkoller. Last status change 2023-05-26 (branch housekeeping only).
Comments: 7. Files: none. Fork: none. Merge request: none.

## What the issue says

Tabbing through the Filter module section of `/admin/people/permissions` reaches a stop with no visible focus
outline before each text-format checkbox. The reporter traced it to the link inside the `visually-hidden` label
that `FilterPermissions::permissions()` puts in the permission title. WCAG 2.1 SC 2.4.7.

The issue body also links the WCAG explanation of focus visible (comment #7, mgifford). No patch has ever been
attached and no merge request has ever been opened.

## Related issues

| Issue | Relation | State (2026-10-15) |
|---|---|---|
| [#3163810](https://www.drupal.org/project/drupal/issues/3163810) | Parent: WCAG 2.4.7 focus visible audit | Fixed. |
| [#3619751](https://www.drupal.org/project/drupal/issues/3619751) | *"Remove links from filter permission descriptions"*, for performance | Fixed in `12.0.x`/`main`; **not** backported to 11.x or 10.6.x. |

## What this lab has established

Measured on `main` (`ad11ba71c0f0`, 2026-10-15), Before and After with no patch:

- **Not reproduced on `main`.** The 12 text-format permission labels are still `visually-hidden`, but none
  contains a link (`hasLink: false`), so there is no invisible focus stop: 0 focusable elements inside a
  visually-hidden label, 0 invisible keyboard stops, on both frames. The walk covered the text-format rows
  (the filter left 5 of 102 rows visible and 8 of 12 stops were text-format checkboxes). See `EVIDENCE.md` and
  the run in `playwright/2026-10-15T18-51-36-255Z-chromium-light-1280x900/`.
- **Cause of the change on `main`: #3619751** (`12b38bdace`, Dave Long, 2026-09-01) rewrote the title from
  `Use the <a href=":url">@label</a> text format` to `Use the @label text format` to avoid rebuilding the router
  on every install (about 500 ms). That ships in 12.0.0-alpha1. Removing the anchor also removed the invisible
  stop, so #3273054 is fixed on `main` as a side effect.
- **Still present in source on `10.6.x` and every `11.x` branch** (`11.2.x` through `11.5.x`): the permission
  title still holds the anchor. This lab has not run a browser test on those branches.

## Next actions (choose with the user; nothing is posted automatically)

1. Draft an issue comment: on `main` the link, and with it the invisible stop, was removed by #3619751
   (`12b38bdace`, 12.0.0-alpha1), so the reported problem no longer reproduces there; the anchor is still in
   `10.6.x` and all `11.x` branches.
2. If a backport is wanted, build an `11.5.x` pair, confirm in a browser that the invisible stop still renders,
   and record a fix (the one-line title change, or a narrower a11y fix) for the 11.x branch.
3. If nothing is wanted, close this folder out: no patch, `not-reproduced` on `main`.
