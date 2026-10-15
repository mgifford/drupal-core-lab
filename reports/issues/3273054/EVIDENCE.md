# Evidence for #3273054: text-format permission checkboxes have a hidden focus stop

**DRAFT.** A person has not reviewed this. Automated results only: no human keyboard pass, no screen-reader pass.

Issue: https://www.drupal.org/project/drupal/issues/3273054

## Environments

| Env | Directory | Commit | Notes |
|---|---|---|---|
| Before | `envs/baseline-3273054` | `ad11ba71c0f0` (2026-10-15) | upstream `main`, no patch |
| After | `envs/issue-3273054` | `ad11ba71c0f0` (2026-10-15) | same core; no patch was written (`after.authoring: true`) |

Both sides are the same commit on purpose: there is no issue fork and no merge request, and the run below
showed there is nothing to patch on `main`.

## Automated results

| Run | Command | Verdict | Directory |
|---|---|---|---|
| 2026-10-15T18:51Z | `node tools/playwright/evaluate-3273054.mjs 3273054-pinned` | **not-reproduced** | `playwright/2026-10-15T18-51-36-255Z-chromium-light-1280x900/` |

chromium 156.0.8078.4, light, 1280x900, darwin arm64. Recorded by `tools/playwright/lib/lab-run.mjs`.
axe-core, WCAG 2.0 to 2.2 A and AA. Real Playwright keys and a real click into the filter field.

An earlier run the same day was discarded: its keyboard walk did not apply the filter, because the script used
`locator.fill()`, which fires `input`/`change` but not `keyup`, and the page filter
(`core/modules/user/js/user.permissions.js`) listens on `keyup`. That walk recorded the first 40 checkboxes of
the unfiltered table (`access announcements`, `administer blocks`, …) and never reached the text-format rows.
The script now types with real keys and asserts the filter ran before it walks.

| Check | Kind | Before | After |
|---|---|---|---|
| Permissions page has the Filter permissions field and the table | precondition | true | true |
| Text-format permission labels found | precondition | 12 | 12 |
| Permission rows hidden by the filter (5 of 102 visible) | precondition | yes | yes |
| Keyboard stops that are text-format checkboxes (reached by the walk) | precondition | 8 | 8 |
| Focusable elements inside a `label.visually-hidden` (whole page) | fix | 0 | 0 |
| Invisible keyboard stops from the filter field (box under 4x4 px, or inside a `visually-hidden` label) | fix | 0 | 0 |
| Checkboxes in the permissions table | regression | 334 | 334 |
| Labels on the page / of them `visually-hidden` | regression | 333 / 332 | 333 / 332 |
| axe violations (elements) | regression | 0 | 0 |
| JavaScript errors | regression | 0 | 0 |
| Keyboard stops recorded from the filter field (observe) | observe | 12 | 12 |

The 12 text-format labels are the four roles (anonymous, authenticated, content editor, administrator) crossed
with the three text formats. Every one was `visually-hidden: true` and **`hasLink: false`** on both sides. The
label text is plain, for example `Anonymous user: Use the Basic HTML text format`; the rendered row contains no
`<a>`.

The walk covered the text-format rows: the filter left 5 of 102 permission rows visible, and 8 of the 12
keyboard stops landed on text-format checkboxes (the other text-format rows render a disabled inherited
checkbox for a role that does not hold the permission). Every stop landed on a checkbox (21x21 px) with
`:focus-visible` true and an outline of `solid 4px rgb(0, 125, 250)`. No stop was invisible. Drupal announced
*"4 permissions are available in the modified list."* (both sides, polite).

## What the source says, by branch (reconnaissance, 2026-10-15)

Read from `envs/core.git` with `git show <ref>:core/modules/filter/src/FilterPermissions.php`. This is not a lab
run; it is what the source on each branch tip contains.

| Branch tip | Commit | Permission title holds a link? |
|---|---|---|
| `10.6.x` | `9791cad006` (2026-10-14) | **present** — `Use the <a href=":url">@label</a> text format` |
| `11.2.x` | `6a2b8636d3` (2026-06-17) | **present** |
| `11.3.x` | `a4eeda75d6` (2026-10-15) | **present** |
| `11.4.x` | `f1c551b3c2` (2026-10-14) | **present** |
| `11.5.x` | `a16aa157b4` (2026-10-15) | **present** |
| `12.0.x` | `10d143eaa5` (2026-10-15) | removed — `Use the @label text format` |
| `main` | `ad11ba71c0` (2026-10-15) | **removed** |

Commit `12b38bdace` (*"task: #3619751 Remove links from filter permission descriptions"*, Dave Long, 2026-09-01)
made the change: it dropped the anchor from the title and deleted five lines from
`core/modules/filter/tests/src/Kernel/FilterDefaultConfigTest.php`. The reason on #3619751 was performance
(building the link rebuilt the router on every install, about 500 ms). The removal of the anchor also removes
the hidden focus stop. It ships in 12.0.0-alpha1 and later.

So the accessibility defect this issue describes is **gone from `main` and `12.0.x`**, and, on the source, still
possible on every supported 11.x branch and on `10.6.x`.

## Manual results (keyboard, screen reader, forced colours)

AT/browser/OS versions: not recorded; no manual pass has been done.

| Check | Baseline | Patched |
|---|---|---|
| Tab stop with no visible focus in the Filter section | not run by hand | not run by hand |

## Not verified

- No human keyboard pass, no real or virtual screen-reader pass, no forced-colours run (the coverage matrix has
  those rows; only the chromium/light/1280x900 run has been done).
- On `main` the result is **not-reproduced**; the invisible stop was not measured on any 11.x or 10.6.x core in
  this lab. The branch table above is a source read, not a browser run. The preconditions for the bug are present
  there (the link is in the label), but this lab has not confirmed that the tab stop renders invisibly on those
  branches in the Default Admin theme.
- The 334 checkboxes / 332 `visually-hidden` labels (all but the permissions-page filter field label itself) were
  measured, but no check asserts what a screen reader announces for a checkbox.
