# Reproduce #867830: "Unpublished" style of rendered entities is not accessible

**DRAFT: setup instructions and a record of the scripted runs. A person has not yet reviewed the result.**

Issue: https://www.drupal.org/project/drupal/issues/867830
Pinned core: `422099995ecfe78f1e29248374fc05cd4a556c1d` (11.x, 2025-07-11, the base of the fork branch).
Prepared: 2026-11-06. Last verified by script: 2026-11-06 (EVIDENCE.md). Last verified by a person: never.

## Task and barrier

An editor or reviewer with permission to see unpublished content opens a node or a comment that is not published. They need to know, before
acting on it, that visitors cannot see it. Reported: the only cue is a very pale pink background (`#fff4f4`) on the node in Olivero, Claro and
Umami, and a CSS class with no styling on the comment. Low-vision users, people on a phone in sunlight, anyone in forced colours or with a
custom stylesheet, and screen reader users get no cue at all. Measured here: the pink is 1.01:1 to 1.08:1 against the page; nothing is in
the text or the accessibility tree; in forced colours the background is white on both sides. WCAG mapping used in the issue: 1.4.11
Non-text Contrast (and 1.3.1 for a state conveyed by colour alone). The measurements are tool output; the user impact is the issue's report.

## Preconditions and comparison identity

- Variant: `867830-pinned` (`tools/compare/variants.json`). `867830-latest` is registered but blocked (the branch does not apply to `main`).
- Before: `envs/baseline-867830`, core `422099995ecf`, no patches.
- After: `envs/issue-867830`, same core, then in order:
  1. `reports/issues/867830/branches/867830-unpublished-style-of.patch`: the fork branch's one commit `0fcbb553` (the #306 re-roll). No merge request exists.
  2. `reports/issues/867830/branches/867830-lab-followup-mark-hook-defaults.patch`: a lab follow-up, two lines in `ThemeCommonElements.php`, because without it every page of After is an error (BRANCHES.md). It is not part of the issue's change.
- Recipe: `recipes/repro_867830/recipe.yml` (installs Stark next to Standard's Olivero and Claro) and `apply.sh` → `create-content.php`, which creates
  `/lab/published-article` (live, one live comment), `/lab/unpublished-article` (not published; a live comment and a held comment) and
  `/lab/unpublished-page` (a Basic page, not published). Titles avoid the word "unpublished" so the checks cannot match ordinary text.
- Account: `admin` (user 1), logged in with the viewer's one-time link. Unpublished content and held comments are shown to this account only.
- Themes: the same pages are viewed in Olivero (Standard's default), Claro and Stark; the evaluate script switches the default theme on both sites and restores Olivero. In the viewer, steps 5, 6 and 10 do the same by hand (mirrored, so both sites change together).
- Environment of the recorded runs: Chromium 156, Firefox 157, WebKit 27.2 (Playwright), macOS arm64, 1280×900 and 480×900, light and dark, forced colours.

## Start locally

```bash
node scripts/doctor.mjs 867830-pinned
node tools/compare/setup.mjs 867830-pinned --check-patches
node tools/compare/setup.mjs 867830-pinned
node scripts/lab-env.mjs start 867830-pinned --browser
```

1. `doctor` says whether Docker, DDEV and the browsers are ready.
2. `--check-patches` confirms both patches apply to the pinned core (they did on 2026-11-06).
3. `setup` builds both sites (10 to 20 minutes the first time) and applies the recipe and its content.
4. `start` runs both sites and opens the viewer, https://drupal-compare.ddev.site, in the lab browser. Log in both as admin.

If the After site answers 500 with `Undefined constant "Drupal\Core\Theme\MARK_NEW"`, the follow-up patch is missing: `node tools/compare/setup.mjs 867830-pinned --refresh-patches`.
If both sites refuse TLS connections, `ddev poweroff` and start again (docs/PITFALLS.md).

## Scripted replay

```bash
node tools/playwright/evaluate-867830.mjs 867830-pinned
node tools/playwright/evaluate-867830.mjs 867830-pinned --forced-colors
node tools/playwright/evaluate-867830.mjs 867830-pinned --browser=firefox
node tools/playwright/tree-diff.mjs 867830-pinned
node scripts/lint.mjs 867830-pinned
node scripts/coverage.mjs 867830
```

Each evaluate run writes `playwright/<stamp>-<browser>-<scheme>-<size>/SUMMARY.md` with one table per theme, accessibility snapshots of the
article footer and the held comment, screenshots, axe and the recorders' context. `--themes=claro` limits it to one theme. The runs must not
overlap: they share the two sites and switch their default theme.

## Shortest reproduction (by hand, in the viewer)

| Step and input | Expected user outcome | Observed Before (script, 2026-11-06) | Observed After (script, 2026-11-06) |
|---|---|---|---|
| Open `/lab/unpublished-article` in Olivero | A visible text marker and a spoken cue say the article is not published | Pink background only (1.01:1); no text; nothing in the accessibility tree | Identical to Before |
| Same page in Claro (set Claro as default, mirrored) | Same | Pink only (1.08:1) | Unstyled word "unpublished" after "Submitted by"; held comment also gets "unpublished"; pink gone |
| `/lab/unpublished-page` in Claro | Same for a Basic page | Pink only | No marker (no author line on Basic page) |
| Same page in Stark | Same | Nothing | Comment: bare text "unpublished"; node: nothing |
| Forced colours, any theme | A cue that survives without colour | None | Claro and Stark markers survive; Olivero none |
| `/lab/published-article` (control) | No marker | None | None |

Use real input for anything about focus; these pages need none. A person's visual and screen reader pass is still needed: the scripted
rows are DOM and colour measurements.

## Try current core

Not possible with this branch: on `main` (`3fb1c69d`, 2026-11-06) the files it changes under Claro, Stable 9 and History no longer exist, and
Olivero is no longer in core. A current-core comparison needs a new patch against `core/modules/node/templates/node.html.twig`,
`core/modules/comment/templates/comment.html.twig`, `core/modules/system/templates/mark.html.twig` and the themes that remain
(`default_admin`, `starterkit_theme`, Umami), with Olivero and Claro added from contrib if they are to be covered. Do not re-pin until that exists.
