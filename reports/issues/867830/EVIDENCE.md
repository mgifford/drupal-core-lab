# Evidence: issue 867830 ("Unpublished" style of rendered entities is not accessible)

Status: DRAFT until a person has reviewed it. No real VoiceOver or NVDA pass was made; no person has done a keyboard pass.
Date: 2026-11-06   Author/agent: Drupal Core Lab, AI-assisted (Copilot), for @mgifford.

## Environments (exact commits)
| Env | Directory | Commit | Notes |
|-----|-----------|--------|-------|
| Before | `envs/baseline-867830` | `422099995ecfe78f1e29248374fc05cd4a556c1d` (11.x, 2025-07-11) | pristine core; `git status` clean apart from the untracked `recipes/` copy |
| After | `envs/issue-867830` | same commit | plus `branches/867830-unpublished-style-of.patch` (fork branch tip `0fcbb553`, the #306 re-roll; recorded by setup as `d1bdd4fb`), then `branches/867830-lab-followup-mark-hook-defaults.patch` (lab follow-up, see BRANCHES.md) |

Both sites: Standard install, recipe `recipes/repro_867830` with `apply.sh` → `create-content.php` (nodes 1 to 3 with aliases `/lab/published-article`, `/lab/unpublished-article`, `/lab/unpublished-page`; comments 1 to 3). Front-end theme Olivero, admin theme Claro, Stark installed. The evaluate script sets the default theme to Olivero, Claro and Stark in turn on both sites and puts Olivero back.

Core `main` at `3fb1c69d` (2026-11-06): the branch patch does not apply (files removed with Claro, Olivero, Stable 9 and History). `867830-latest` was not built.

## Finding 1: the #306 re-roll, as submitted, breaks every page
After `node tools/compare/setup.mjs 867830-pinned` with only the branch patch, the first request after a cache rebuild returned HTTP 500 on every path of the After site. `ddev logs`:

    Uncaught PHP Exception Error: "Undefined constant "Drupal\Core\Theme\MARK_NEW"" at /var/www/html/core/lib/Drupal/Core/Theme/ThemeCommonElements.php line 136

Cause: the branch deletes `MARK_READ`, `MARK_NEW`, `MARK_UPDATED` from `core/includes/theme.inc` and does not touch `ThemeCommonElements.php`, where the `mark` hook's `status` variable defaults to `MARK_NEW`. Checked with `grep -rn MARK_ core` in the After checkout: that line is the only remaining use. The two-line lab follow-up (`status => NULL`, `type => NULL`) was added so the rest of the change could be observed; every result below is with it applied.

## Automated results (scripted, real browsers, logged in as admin)
`node tools/playwright/evaluate-867830.mjs 867830-pinned [flags]`; each run covers 3 themes × 2 sides × 3 pages, with axe-core (WCAG 2.0 to 2.2 A/AA) on every page and full-page screenshots.

| Run | Flags | Verdict (judged rows not as expected) | Folder |
|-----|-------|------|--------|
| Chromium 156.0.8078.4 light 1280 (macOS arm64) | (none) | mixed (10) | `playwright/2026-11-06T20-16-14-118Z-chromium-light-1280x900/` |
| Chromium dark | `--scheme=dark` | mixed (10) | `playwright/2026-11-06T20-20-18-367Z-chromium-dark-1280x900/` |
| Chromium forced colours | `--forced-colors` | mixed (10) | `playwright/2026-11-06T20-24-13-440Z-chromium-light-forced-1280x900/` |
| Chromium 480 px wide | `--viewport=480x900` | mixed (10) | `playwright/2026-11-06T20-28-07-923Z-chromium-light-480x900/` |
| Firefox 157.0 light | `--browser=firefox` | mixed (10) | `playwright/2026-11-06T20-32-03-786Z-firefox-light-1280x900/` |
| WebKit 27.2 light | `--browser=webkit` | mixed (10) | `playwright/2026-11-06T20-36-12-136Z-webkit-light-1280x900/` |

The same 10 rows differ from the ideal in every run (browser, scheme, forced colours and width make no difference to the DOM), so one table stands for all six:

| Theme | Check | Before | After |
|---|---|---|---|
| Olivero | Draft article: text says it is unpublished | none | none |
| Olivero | Draft page: text says it is unpublished | none | none |
| Olivero | Held comment: text says it is unpublished | none | none |
| Olivero | Draft article and held comment background | `#fff4f4`, 1.01:1 against the page | same |
| Olivero | Published comments' classes | `comment js-comment comment--level-1 by-node-author by-viewer` | adds a broken `comment--` class (the branch unsets `status` for published comments; Olivero's template does `'comment--' ~ status`) |
| Claro | Draft article: text says it is unpublished | none | `<span class="marker marker--warning">unpublished</span>` after "Submitted by …", 15.49:1 (`#232429` on white, 16 px, no other styling: the `classy/marker` library it attaches does not exist) |
| Claro | Draft page: text says it is unpublished | none | none (the marker is inside `{% if display_submitted %}`; Basic page does not display author information) |
| Claro | Held comment: text says it is unpublished | none | `<span class="marker marker--warning">unpublished</span>` in the comment footer |
| Claro | Draft article background | `#fff4f4`, 1.08:1 | white (the branch removes `.node--unpublished` from Claro's node template and CSS) |
| Claro | Held comment classes | `… unpublished …` | status class removed |
| Stark | Draft article and draft page | none | none (core's `node.html.twig` does not print `markers`) |
| Stark | Held comment | none | bare text node "unpublished" directly inside `article.js-comment` (core's `mark.html.twig` prints the status with no element) |
| all | Marker has visually hidden context ("This node is …") | no | no |
| all | Forced colours (Chromium): node and comment background | white, 1:1 (the pink cue is gone) | white; Claro marker text 21:1 |
| all | Live article and live comments: no false "unpublished" | correct | correct |
| all | axe violations, draft article / draft page / live article | Olivero 3/0/0 (`color-contrast`, pre-existing), Claro 0/0/0, Stark 7/0/4 | identical on After |
| all | JavaScript errors, PHP or Twig errors | none | none (with the follow-up) |

Accessibility tree and speech (Guidepup, synthetic): `node tools/playwright/tree-diff.mjs 867830-pinned` in Olivero (`tree-diff/867830-pinned/`): no difference apart from the fixtures' timestamps. In Claro (`tree-diff/867830-pinned-claro/`, both sites switched to Claro for the run): `/lab/unpublished-article` gains two spoken items on After, each the single word "unpublished" (article footer, held comment); `/lab/unpublished-page` is identical.

Core's code checks on the patched files (`node scripts/lint.mjs 867830-pinned`, `lint/2026-11-06-867830-pinned-after.md`): PHPStan and CSpell pass; Stylelint fails on `core/profiles/demo_umami/themes/umami/css/classy/components/node.css` line 6 (a leading space before `.node__status`, prettier/prettier).

## Manual results (keyboard, screen reader, forced colours)
Not done by a person yet. The viewer is ready: `node scripts/lab-env.mjs start 867830-pinned --browser`, log in both, follow REPRODUCE.md. Record browser, OS and screen reader versions here when done.

| Check | Before | After |
|-------|--------|-------|
| Olivero: can a sighted person tell the draft article from the live one without reading the title? | not tested | not tested |
| Claro: does VoiceOver read "unpublished" in a way that says what it refers to? | not tested | not tested |
| Forced colours, Olivero: any cue left? | not tested (automated: none) | not tested (automated: none) |

## Findings for the issue (observations, not recommendations)
1. As submitted, the branch fatals every page on the core it was rolled against (`MARK_NEW` left in `ThemeCommonElements.php`).
2. With that fixed, Olivero (Standard's front-end theme on that core) is unchanged: pink `#fff4f4` at about 1:1, no text, no speech.
3. Claro prints a bare, unstyled "unpublished" for articles and comments, not for Basic pages (tied to `display_submitted`), and drops the pink background and the `node--unpublished` / `unpublished` classes that themes and modules target.
4. Stark prints "unpublished" for comments only, as a text node with no element.
5. No variant provides the visually hidden context the issue summary asks for; the `classy/marker` library the templates attach does not exist in core.
6. Published comments in Olivero get an empty status class `comment--` (the `status` variable is no longer set for published comments).
7. The branch removes `MARK_*` constants and changes `node_mark()`'s return type without deprecation; `node_mark()` is itself deprecated for removal in 12.0.0.
8. Unrelated to the branch: in Stark, axe reports 7 (draft article) and 4 (live article) element violations on both sides; in Olivero 3 `color-contrast` nodes on the draft article on both sides. Not this issue's; not filed as findings yet.

## Not verified
- No real screen reader (VoiceOver, NVDA) was run; Guidepup output is synthetic and from a DOM snapshot.
- No person has done a keyboard or visual pass yet; screenshots exist in every run folder.
- Dark scheme: none of the three themes has a dark scheme, so the dark run equals light.
- Umami, Starterkit and Stable 9 templates changed by the branch were not viewed.
- Current core `main`: not built; the branch does not apply and the themes it changes are no longer in core.
- PHPUnit: the branch's test changes were not run.
