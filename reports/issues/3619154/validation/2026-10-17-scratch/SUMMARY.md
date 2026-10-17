# Evaluator validation, 2026-10-17 (scratch environment, not lab evidence)

DRAFT. Not reviewed by a person. Not counted by `scripts/coverage.mjs` (it reads `playwright/` only).

**Why this exists.** `tools/playwright/evaluate-3619154.mjs` was written without access to MR !16911's newest commits
(drupal.org and git.drupalcode.org were blocked from the cloud session). To make sure it works before it is used on the new
revision (head `175e6f17`, pushed 2026-10-17 14:55 UTC), it was run against the **previous** revision, the one the lab already
had (`6f7766cb`). "reproduced-and-fixed" here says the checks tell the two sides apart; it says nothing about the new revision.
In forced colours the run also catches the problem reported in comment #23 (the close button's icon disappears when it has
focus). That is the row to watch on the new revision, whose last commit is "Fix close button focus state when in forced colors".

## Conditions

| | |
|---|---|
| Core, both sides | `f2abd4143f87` (main, 2026-10-17 18:19 +0100, "#3622469 Fix field.settings:purge_batch_size…"), from the GitHub mirror github.com/drupal/drupal |
| After | that core plus `branches/sidebar-toggle-fixes.patch` (MR !16911 at `6f7766cb`, SHA-256 `d4c7c754…b667`), **without** its hunk for `core/profiles/demo_umami/tests/src/FunctionalJavascript/MultipleRequestsPerformanceTestAssertions/umamiNodeAddEditor.yml`, which no longer applies after core commit `aeca9d7` (2026-10-14). That file is a performance-test fixture; it does not change the page. |
| Site | Standard install, then `recipes/repro_3619154` (Default Admin as admin theme, Navigation, Article, one node). MariaDB 10.11. PHP 8.5 built-in server inside the `ddev/ddev-webserver:v1.24.10` image. **Not DDEV**: no router, no HTTPS, no lab patch-state or identity records. |
| Browser | Chromium 141.0.7390.37 headless, Linux x64, light; once without and once with forced colours (Playwright's `forcedColors: 'active'` emulation). Login with a one-time link. |
| Scenario | `tools/playwright/sidebar-3619154.mjs`, through `evaluate-3619154.mjs` with a shim in place of DDEV in `lib/lab-run.mjs` (`runArgs`, `launch`, `openSide`, `baseResults`). `axeScan`, `writeRun` and its schema check were the real ones. The live-region recorder was not active, so this run says nothing about announcements. |
| Runs | 800px narrow width, normal colours (`results.json`, the table below) and forced colours (`results-forced-colors.json`). An earlier run of the same scenario before the forced-colours, RTL and URL checks were added also ran at 480px: same rows except O9's covering element. |

## Result, normal colours: reproduced-and-fixed (0 not as expected)

12 fix checks: 11 as expected, F11 not applicable on Before. 14 regression checks: all as expected on After. 12 observations.

Fix: should fail Before and pass After. Regression: should pass After. Observed: recorded for a person to judge.

| | Kind | Check | Before | After | Result |
|---|---|---|---|---|---|
| F1 | fix | The toggle is a native `<button>` | false | true | as expected |
| F2 | fix | Space on the focused toggle opens or closes the sidebar | false | true | as expected |
| F3 | fix | The close control is a native `<button>` | false | true | as expected |
| F4 | fix | Below 1024px, the close button is the first focusable element in the open sidebar | false | true | as expected |
| F5 | fix | Below 1024px, opening with Enter moves focus into the sidebar | false | true | as expected |
| F6 | fix | Below 1024px, the page under the overlay is inert while the sidebar is open | false | true | as expected |
| F7 | fix | Below 1024px, 20 Tabs from the open sidebar never reach the covered page | false | true | as expected |
| F8 | fix | Below 1024px, Escape closes the sidebar and returns focus to the toggle | false | true | as expected |
| F9 | fix | First visit below 1024px: the sidebar is never painted on screen while the page loads | false | true | as expected |
| F11 | fix | 1100px, sidebar open and Navigation expanded: opening and closing a details element does not collapse Navigation | n/a | true | not applicable |
| F12 | fix | 1000px: the open sidebar starts at or below the bottom of the bars above it (no overlap) | false | true | as expected |
| F13 | fix | Right to left (dir="rtl" on `<html>`): dragging the handle outward widens the sidebar | false | true | as expected |
| R1 | regression | Mouse click on the toggle closes and reopens the sidebar | true | true | as expected |
| R2 | regression | Enter on the focused toggle opens or closes the sidebar | true | true | as expected |
| R3 | regression | aria-expanded on the toggle matches the sidebar after every desktop action | true | true | as expected |
| R4 | regression | Desktop: a closed sidebar stays closed after reload | true | true | as expected |
| R5 | regression | Desktop: an open sidebar stays open after reload | true | true | as expected |
| R6 | regression | Desktop: dragging the handle changes the width, and the width is kept after reload | true | true | as expected |
| R7 | regression | Below 1024px: a click on the overlay closes the sidebar | true | true | as expected |
| R8 | regression | Below 1024px: the close button closes the sidebar | false | true | as expected (Before also fails) |
| R9 | regression | Below 1024px: the sidebar is closed on load, and after reload | true | true | as expected |
| R10 | regression | Below 1024px: after closing, nothing more is inert than before opening | true | true | as expected |
| R11 | regression | Desktop, closed then reloaded: the sidebar is never painted on screen while the page loads | true | true | as expected |
| R12 | regression | Below 1024px: the close button's icon is drawn at rest and when focused (pixels) | n/a | true | as expected (n/a on Before) |
| R13 | regression | Below 1024px: focus on the close button changes how it looks (focus indicator) | n/a | true | as expected (n/a on Before) |
| R14 | regression | Below 1024px: closing with the overlay or the close button leaves the URL unchanged | true | true | as expected |
| O1 | observe | Toggle in the accessibility tree: open / closed | - button "Hide sidebar panel" [expanded] / - button "Show sidebar panel" | - button "Sidebar panel" [expanded] / - button "Sidebar panel" | recorded |
| O2 | observe | Alt+S toggles the sidebar (keyboard shortcut) | true | false | recorded |
| O3 | observe | Resize handle shown with the sidebar open at 960px / 1000px / 1280px | true / true / true | false / true / true | recorded |
| O4 | observe | Sidebar top minus bottom of the bars above it at 1000px / 1280px (px; negative = overlap) | -49 / 0 | 0 / 0 | recorded |
| O5 | observe | Sidebar top moved after first paint during load at 1280px (range, px) | 64–64 | 64–64 | recorded |
| O6 | observe | Focus after the narrow open / after Escape / after the close button | a.meta-sidebar__trigger / a.visually-hidden / a.meta-sidebar__trigger | button.meta-sidebar__close / button.meta-sidebar__trigger / button.meta-sidebar__trigger | recorded |
| O7 | observe | Where 20 Tabs went from the open narrow sidebar | top-bar 1, covered 8, sidebar 8, close 1, body 1, other 1 | sidebar 13, body 1, other 1, navigation 1, top-bar 2, toggle 1, close 1 | recorded |
| O8 | observe | 1100px: Navigation, sidebar shown (px) before / after opening details / after closing details (html height) | expanded, 0 / expanded, 0 / expanded, 0 (1042→865) | expanded, 320 / expanded, 320 / expanded, 320 (1042→865) | recorded |
| O9 | observe | Below 1024px: what covers the close button (mouse click blocked?) | button.toolbar-button in "Administrative top bar", click blocked | nothing | recorded |
| O10 | observe | 1100px, both stored open, first load: sidebar shown (px) / Navigation | 320 / collapsed | 320 / expanded | recorded |
| O11 | observe | Close button icon pixels at rest / focused, and pixels changed by focus (screenshots `*-close-rest.png`, `*-close-focus.png`) | 4 / not focused / — (covered by button.toolbar-button in "Administrative top bar") | 64 / 76 / 672 | recorded |
| O12 | observe | RTL drag: sidebar side, width before → after dragging outward 120px | left, 480 → 360 | left, 480 → 560 | recorded |

axe (WCAG 2.2 A/AA tags): 0 violations on both sides, desktop open, desktop closed after reload, and narrow open. No JavaScript errors.

## Result, forced colours: mixed (1 not as expected)

Every row is the same as in normal colours except these two:

| | Kind | Check | Before | After | Result |
|---|---|---|---|---|---|
| R12 | regression | Below 1024px: the close button's icon is drawn at rest and when focused (pixels) | n/a | false | NOT as expected on After |
| O11 | observe | Close button icon pixels at rest / focused, and pixels changed by focus (screenshots `*-close-rest.png`, `*-close-focus.png`) | 88 / not focused / — (covered by button.toolbar-button in "Administrative top bar") | 64 / 12 / 675 | recorded |

![Close button with the previous revision at 800px: in normal colours the × shows at rest and when focused; in forced colours it shows at rest, and only the focus ring shows when focused](close-button-6f7766cb.png)

The icon is a `mask-image` on the close button's `::before`, coloured with `background-color`. In the previous revision,
`.meta-sidebar__close:hover, :focus` sets a different `::before` background colour and has no `forced-colors` rule (the toggle's
matching rule has one: `background: buttonText`). Measured: 64 icon pixels at rest, 12 with focus, while the focus ring itself is
drawn (675 pixels change). Opening the sidebar with Enter puts focus on this button, so in forced colours the first thing a
keyboard user sees in the open sidebar is an empty ring. With the new revision, R12 should pass in forced colours.

## What a person should look at

- **R12 in forced colours** (above): the comment #23 finding, and what `175e6f17` says it fixes.
- **O2: Alt+S no longer toggles the sidebar** with the previous revision. Before has a document-wide Alt+S shortcut in `sidebar.js`; the previous revision's `sidebar-toggle.js` has none. The issue page does not mention it.
- **O1: the toggle's name no longer changes** ("Hide/Show sidebar panel" before; "Sidebar panel" with `aria-expanded` after), as the issue summary asks.
- **O10, `pair-nav-initial.png`: at 1100px, a returning user with both panels stored open** gets the sidebar open and Navigation collapsed on Before, and both open on After.
- **O3: the resize handle is hidden at 960px** on After (shown on Before), as the issue summary says.
- **O4/O9, `pair-width-1000-open.png`, `pair-narrow-open.png`: on Before the sidebar starts 49px under the top bar at 1000px**, and at 800px (and 480px) its close button is under the top bar, where a mouse click on it is blocked. After: the sidebar starts at the bar's bottom edge at 1000px, nothing covers the close button, and opening with Enter puts focus on it.
- **F13/O12: right to left** (`dir="rtl"` set on `<html>`, as the issue's testing steps do it): dragging the handle outward narrows the sidebar on Before (480 → 360px) and widens it on After (480 → 560px, the maximum).
- **F11 could not be exercised on Before.** Below 1280px each panel closes the other when opened by a click (Before's `sidebar.js`, and Default Admin's `navigation.js` on both sides), so "sidebar open with Navigation expanded" exists only after a page load from stored state; Before collapses Navigation on that load.

## Files

`results.json` and `results-forced-colors.json` (every state per side), `pair-*.png` (Before left, After right; 64 colours,
scaled to 1200px), `close-button-6f7766cb.png` (After's close button, 4× enlarged).

Not verified here: the new merge request revision; DDEV; Firefox, WebKit, dark; a person's keyboard pass; a screen reader; touch
resizing; resizing after an AJAX rebuild; the site without the Navigation module (comment #6).
