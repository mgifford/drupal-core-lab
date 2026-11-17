# Evidence: issue 867830 ("Unpublished" style of rendered entities is not accessible)

Status: DRAFT until a person has reviewed it. No real VoiceOver or NVDA pass was made; no person has done a keyboard pass.
Date: 2026-11-06   Author/agent: Drupal Core Lab, AI-assisted (Copilot), for @mgifford.

## Separate ribbon alternative (2026-11-17)

The [rail-and-ribbon report](RIBBON-PROPOSAL.md) records the new comparison
`867830-ribbon-pinned`: November 17 Core, the shared three-node recipe, three new
standalone patches and dedicated geometry, contrast and status-speech checks.
Earlier results below are preserved history, not verification of the ribbon
alternative. Its screenshots and manual-review gaps are linked from that report.

## Historical environments (exact commits)
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

## Current-Core proposal (2026-11-09)

Separate AI-assisted local draft; none of the historical #306 patch or lab MARK follow-up
is applied to this comparison. Variant `867830-current-authoring`, Standard install,
recipe `repro_867830_current` with its fixture script.

| Component | Exact revision |
|---|---|
| Before and After Core | `3fb1c69d36927265f30e4dbc418828f5b884b73f` |
| Contrib Olivero, both sides | `bcd108499147b5a8f6d0820758302345be6b24ca` |
| Contrib Claro, both sides | `474f080c47f5ce21961bf90515fb7bdea1d7dcd4` |
| Latest main, patch application only | `f6102ad483c5390eb46baeff2ad1374783500491` |

Before is `baseline-867830-current-authoring`, no patches, no tracked source changes.
After is `issue-867830-current-authoring`. Its ordered Core stack is the single
`branches/867830-current-core-status.patch`; contrib patch stacks are one patch each,
`branches/867830-olivero-status.patch` and `branches/867830-claro-status.patch`.

| Patch | SHA-256 |
|---|---|
| Core | `11784dea36b5106058b3990c3de0bd527e1242299c2cb20dc29b8a88ba714983` |
| Olivero | `7f01639398128f5919f1ce6e130d4593c23fde1fbe9d2ab7032b44d6d67ae305` |
| Claro | `0a5b33d7dbe1e11f66a12162fa167d648576148ae10576a5f69df81878771968` |

Both sites built successfully. No historical site database was reset or deleted.
The historical pair was stopped. The new fixture uses `text_long`: current Core
no longer provides `text_with_summary`. An interrupted initial fixture application
was resumed without resetting its database. DDEV's router dropped TLS connections
after the build; restarting only `ddev-router` restored connectivity.

### Live three-theme checks

Command: `node tools/playwright/evaluate-867830.mjs 867830-current-authoring --screenreader`.
Chromium `156.0.8078.4`, macOS arm64, 1280x900, light.
Each run covers three themes, two sides and three pages (18 page visits).
Exact identities, site context, screenshots, axe and synthetic spoken phrase logs
are recorded together in the run folder.
Snapshot URL token values are redacted in the retained JSON and Markdown; this
privacy-only sanitization does not change marker markup, speech or test outcomes.
The evaluator now applies the same redaction before writing new snapshots.

| Run | Result | Evidence |
|---|---|---|
| Chromium light | reproduced-and-fixed; 12/12 fix rows, no regression failures | [summary](playwright/2026-11-09T15-56-30-853Z-chromium-light-1280x900/SUMMARY.md), [results](playwright/2026-11-09T15-56-30-853Z-chromium-light-1280x900/results.json) |
| Chromium forced colours (`--forced-colors`) | reproduced-and-fixed; 12/12 fix rows, no regression failures | [summary](playwright/2026-11-09T16-00-35-400Z-chromium-light-forced-1280x900/SUMMARY.md), [results](playwright/2026-11-09T16-00-35-400Z-chromium-light-forced-1280x900/results.json) |

In every requested theme, draft Article and Basic page each have one visible label,
even when submission metadata is disabled; the held comment has one; published nodes
and comments have none. Guidepup's actual phrase logs include "This node is" followed
by "Unpublished", or "This comment is" followed by "Unpublished", exactly once per marker.
No new PHP/Twig/JavaScript errors were observed and existing status classes remain.

All three visible labels per theme were checked against the 4.5:1 normal-text threshold:
minimum 11.64:1 in Olivero, 14.38:1 in Claro, 15.54:1 in Default Admin.
In forced colours every visible status label measures 21:1 in all three themes.
Existing axe counts were unchanged, not zero everywhere: this is not a clean-site
or WCAG-conformance claim.

An earlier completed run, [15:49 light](playwright/2026-11-09T15-49-50-978Z-chromium-light-1280x900/SUMMARY.md),
is retained as **superseded collector evidence**, not a patch failure: its expanded
context detector wrongly counted ordinary comment body text ("This comment is approved").
All live Guidepup checks already passed in that run. The detector was narrowed to the
exact hidden context span, and the fresh 15:56 run passed without changing any patch.

### Code and tooling verification

- All three patches apply cleanly to their pins; the Core patch additionally applies to
  today's main. This is application evidence only, not a browser run on that newer commit.
- [Core lint](lint/2026-11-09-867830-current-authoring-after.md): CSpell, PHPStan and
  Twig CS Fixer pass on the 13 changed Core files.
- The contrib lint wrapper reports [NOTHING CHECKED](lint/2026-11-09-867830-current-authoring-after-contrib.md)
  because it only handles PHP. Direct Core Twig CS Fixer on all five changed contrib
  Twig files passes with zero notices, warnings or errors.
  Command from the After checkout:
  `ddev exec vendor/bin/twig-cs-fixer lint -c core/.twig-cs-fixer.php themes/contrib/olivero/templates/content/node.html.twig themes/contrib/olivero/templates/content/node--teaser.html.twig themes/contrib/olivero/templates/content/comment.html.twig themes/contrib/claro/templates/classy/content/node.html.twig themes/contrib/claro/templates/classy/content/comment.html.twig`.
- `node --test tests/lab/unpublished-speech.test.mjs`: 3/3 pass. Negative controls
  reject missing, duplicate, invisible and context-free markers and published false positives.
- Focused theme-support suite: 29 passed, one setup test initially skipped while a real
  setup held the lock; rerunning that setup test separately passed (no remaining skip).
- `node scripts/selftest.mjs`: 9/9 checks pass, including syntax, 223 Lab tests,
  157 issue-pack tests, 36 design-observation tests, variant checks, documentation
  links, generated guide freshness and skill evaluations. The first run exposed a
  non-read-only viewer probe and stale generated guide; both were corrected.

### Remaining acceptance and handoff

Everything remains DRAFT. No real VoiceOver/NVDA, person-led keyboard/visual pass,
participant usability session, current-proposal Firefox/WebKit/dark/narrow run,
live Starterkit/Umami rendering or Core PHPUnit feature test was performed.
Guidepup reads live markup snapshots but is synthetic, not a human screen-reader test.

What worked: author against the exact pins, capture separate project patches, then
verify the registered pair. What failed: assuming older Standard fixtures and field
plugins still existed, and letting a broad text detector match fixture prose.
Repeat the small fixture and detector checks before expensive browser matrices.

Next owner: @mgifford reviews the comparison and performs the human acceptance pass.
Use `node scripts/lab-env.mjs start 867830-current-authoring --browser`, follow
[REPRODUCE.md](REPRODUCE.md), and record the manual results before approving an
upstream contribution. No commit, push or drupal.org posting was made.

## Focused Default Admin replay (2026-11-17)

**DRAFT.** The shared walkthrough now uses the same three-node fixture for
Default Admin, Claro, Olivero and newly generated Starterkit themes.
This changes scenario instructions, not the three proposal patches.
The [walkthrough](REPRODUCE.md) distinguishes Before observations from After
expectations and records untested themes rather than requiring four test suites.

The representative browser runs below cover **Default Admin only**:
`node tools/playwright/evaluate-867830.mjs 867830-current-authoring --themes=default_admin --screenreader`
with the additional flags shown. Both sides use Core
`3fb1c69d36927265f30e4dbc418828f5b884b73f`, Standard and `repro_867830_current`.
The Core and contrib patch hashes are unchanged from the November 9 table.
Run identity checks report matching recipe content, verified patch states and
no source changes outside the registered patches. This is not a fresh-main run.

| Mode | Additional flags | Result and evidence |
|---|---|---|
| Light | none | Four fix rows as expected, zero regression failures: [run](playwright/2026-11-17T17-05-15-147Z-chromium-light-1280x900/SUMMARY.md) |
| Dark preference | `--scheme=dark` | Four fix rows as expected, zero regression failures: [run](playwright/2026-11-17T17-13-23-064Z-chromium-dark-1280x900/SUMMARY.md) |
| Forced colours | `--forced-colors` | Four fix rows as expected, zero regression failures: [run](playwright/2026-11-17T17-15-05-416Z-chromium-light-forced-1280x900/SUMMARY.md) |

Chromium 156.0.8078.4, macOS arm64, 1280x900. Each run visits three pages on each
side. Screenshots, axe results, markup and synthetic spoken phrases are retained
in the linked run folders. Published nodes/comments remain unmarked; unpublished
Article, Basic page and held comment gain contextual status text.

Other checks: shared synthetic status controls 3/3 pass; Coder handoff tests
4/4 pass; generated Coder prompt and cloud guide are current; documentation links
pass with zero missing references. Core's applied patch passes reverse application
checking without changing the checkout.

### Boundaries and next review

- No new browser tests were added for Claro, Olivero or Starterkit. Earlier
  Claro/Olivero evidence remains separate; generated Starterkit output is not
  live-tested. Existing generated themes do not automatically receive the change.
- These checks do not evaluate the Navigation Top Bar chip or its interaction
  with entity status text. They do not establish WCAG conformance.
- Do not use the generated background/contrast observations to decide the
  community's transparent-colour questions: the collector does not composite
  translucent backgrounds or parse every modern CSS colour syntax.
- Real VoiceOver/NVDA, person-led keyboard/visual/zoom review, narrow layouts and
  independent code/accessibility review remain open.

What worked: reuse one fixture and the existing evaluator with a theme selector;
no separate theme suites or new dependencies were needed.
Next owner: @mgifford reviews the screenshots and six-step walkthrough, then
confirms scope and the status-chip requirements before any upstream submission.
No commit, push, issue posting or MR creation was performed.
