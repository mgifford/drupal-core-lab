# Harness plan: #3466040 (modal dialog does not adjust to increased inner height)

DRAFT — harness plan and capability notes. No browser run is recorded in this file. The lab pair for
`3466040-pinned` (`envs/baseline-3466040`, `envs/issue-3466040`) was still being built when this plan was
written; the directories now exist but the sites must be started and checked before a run.

- Issue: [#3466040](https://www.drupal.org/project/drupal/issues/3466040)
- Merge request: [!9088](https://git.drupalcode.org/project/drupal/-/merge_requests/9088), branch
  `3466040-dialog-buttoninputs-not`, tip `aed1df5eeddf`, base `97c6ff8b2534`
- Variants: `3466040-pinned` (evidence) and `3466040-latest` (follows core `main`)
- Patch under test: [`../branches/3466040-dialog-buttoninputs-not.patch`](../branches/3466040-dialog-buttoninputs-not.patch)
  (`core/misc/dialog/dialog.position.js`: observe the dialog content with a `ResizeObserver`, call
  `autoResize` when it changes size, disconnect on `dialog:beforeclose`; plus a test-support route/test)
- Evaluator: [`../../../tools/playwright/evaluate-3466040.mjs`](../../../tools/playwright/evaluate-3466040.mjs)
- Lifecycle note: [`lifecycle-instrumentation.md`](lifecycle-instrumentation.md)
- Source reviews that ask for runtime checks: [`code-review.md`](code-review.md), [`test-review.md`](test-review.md)

## What the harness must show

The issue's own alternatives are the two scenarios the evaluator runs on **both** sides from the same
pinned commits:

| | Scenario | Interaction that grows the dialog |
|---|---|---|
| A | Field UI (issue "Alternatively 2") | Add a *Date and time* (datetime) field, reach the field config edit form in the modal, tick **Set default value** (the case in related issue [#3640810](https://www.drupal.org/i/3640810)) |
| B | Views (issue "Alternatively 1") | `/admin/structure/views/view/content` → click the **Content: Content type** filter → expand/collapse the details elements in its modal |

For each stage the evaluator records geometry, operability (an `elementFromPoint` hit-test, not just
`offsetParent`), the document's active element, a keyboard-only Tab walk (real keys, no programmatic
scrolling) and the page-level lifecycle counters. What counts as a fix check is stated in every
`SUMMARY.md`: the dialog must stay inside the viewport after the content grows and the primary action
button (Save/Continue/Apply) must be inside the viewport and hit-testable — false on Before, true on
After. Everything else is recorded, not judged.

## What `tools/playwright/lib/lab-run.mjs` already provides

| Capability | Where | Notes for #3466040 |
|---|---|---|
| Opens both sides from the variant | `openSide()` | Reads the variant's env names, picks the shortest DDEV host; both sides are separate browser contexts. |
| Login without a typed password | `openSide()` → `loginPath()` | Uses the one-time link from `ddev drupal login`; the run starts logged in as admin. |
| Refuses to run on an unbuilt or mismatched pair | `launch()` | Stops when the Before/After patches do not match the variant by content, and when the pinned commit or recipe does not match (`BLOCKED`). Records `patchState`, `identity`, commits and the CSS-build state in `results.json`. This is the "same pinned revisions" guarantee. |
| Real input | not `lab-run` itself | `lab-run` creates contexts; the *evaluator* uses Playwright's trusted `.click()`, `.fill()`, `keyboard.press('Tab'/'Escape')`. No synthetic DOM events are dispatched. |
| Context per side | `openSide()` | PHP, Drupal, profile, default/admin theme, enabled modules and languages (`lib/site-context.php`), plus the theme of every page the run loads. |
| AJAX commands | `openSide()` | Every Drupal AJAX response's commands summarised in `results.json`, raw in `ajax-<side>.json`. The Add-field and Views-filter modals are AJAX, so the commands show which steps ran. |
| Announcements and live regions | `openSide()` (`lib/recorder.mjs`) | Every `Drupal.announce()` call, every live-region text change, and "silent changes" after each input. Useful evidence, but this issue is geometry, not speech. |
| JavaScript errors | `rec.jsErrors` | `page.on('pageerror')`, **with the `ResizeObserver loop` notice deliberately filtered out** (lab-run line 115). The evaluator therefore keeps its own page-level `error` listener to retain that notice, see the lifecycle note. |
| axe | `axeScan(page)` helper + `TAGS` | The evaluator calls it at the growth stage; axe does not evaluate dialog reflow, so it is a regression row, not the fix check. |
| One JSON shape for scripts | `baseResults()` / `writeRun()` | `results.json` must satisfy `lib/run-schema.mjs`; `scripts/coverage.mjs` reads `environment` (browser, scheme, forced, viewport width), `variant`, `when`, `commits` and the verdict. A run fills a coverage row only when those match. |
| Coverage row | `scripts/coverage.mjs` | The variant's `coverage.matrix` for #3466040 is currently 1280 px wide (chromium light, chromium dark, chromium forced colours, firefox light, webkit light) plus a 480 px wide chromium-light row. A run fills a row only when its `environment.browser`, `colorScheme`, `forcedColors` and `viewport.width` match. The manual checklist still includes "Text zoom to 200% and reflow at 400% (320 CSS px)". |

### What `lab-run` does not do (the evaluator or a person must)

- **No screenshots.** Each evaluator takes its own. `evaluate-3466040.mjs` writes a viewport PNG per
  stage and a *clipped* dialog PNG; it never uses an element screenshot, because Playwright scrolls an
  element into view before screenshotting it and that would change the state being measured.
- **No geometry or operability model.** No dialog rects, no `clientHeight/scrollHeight`, no
  `elementFromPoint` hit-testing, no "is the button in the viewport" check, no `Drupal.displace` read.
- **No keyboard walker.** No Tab loop, no record of where focus went or what the browser scrolled.
- **No console-message capture.** Only uncaught `pageerror`s; `console.warn/error` from the page and
  browser-level console messages need `page.on('console')`.
- **No per-stage instrumentation.** There is no hook for ResizeObserver callback counts, `autoResize`
  executions, `dialogContentResize` events or observer teardown. The evaluator installs page-level
  probes (see the lifecycle note; no patch or environment change).
- **No zoom.** `runArgs()` understands `--browser`, `--scheme`, `--forced-colors`, `--viewport`,
  `--out`, `--observe`, `--playwright-trace`. It has no scale/zoom option, and `launch()` passes no
  `deviceScaleFactor`.
- **No scenario selection, no ABORTED handling.** A missing content type or an unavailable Views page
  would otherwise produce a misleading `results.json`; the evaluator writes `ABORTED.md` and exits 3
  without a `results.json`, so coverage does not count a setup failure as evidence.
- **No assistive technology, no OS high contrast, no touch, no real Zoom magnification.** Those stay
  manual (see Limits).

## Browsers: Chromium, Firefox, WebKit

Browsers are installed once:

```bash
cd tools/playwright
npx playwright install chromium firefox webkit
```

Then, from the repository root (both DDEV sites must be running):

```bash
node tools/playwright/evaluate-3466040.mjs 3466040-pinned --browser=chromium
node tools/playwright/evaluate-3466040.mjs 3466040-pinned --browser=firefox
node tools/playwright/evaluate-3466040.mjs 3466040-pinned --browser=webkit
```

- The default is `chromium`. `--browser` is validated by `runArgs()` (chromium, firefox or webkit).
- The actual engine version is read from `browser.version()` and written to
  `results.json.environment.browserVersion` and the `SUMMARY.md` header. Record it with every result.
- **WebKit is not Safari.** It is Playwright's WebKit build (the engine Safari uses), with no Safari
  chrome, no Safari settings or extensions, no macOS Safari keyboard behaviour (for example Safari's
  "Full Keyboard Access" does not focus buttons on click the way Chromium does), no Safari version
  number and **no VoiceOver**. "Passes in WebKit" is not "passes in Safari"; say so in any write-up.
  The same caution applies to Playwright's Firefox/Chromium builds versus branded browsers.
- Environment observation from this session (not a lab-run limitation): a local, non-lab probe of
  `firefox 159.0` launched from this checkout crashed with `browserContext.newPage: Target crashed`
  on a `data:` URL, while `chromium 159.0.8154.6` and `webkit 27.2` started normally and reported the
  emulated `(forced-colors: active)` and `(prefers-color-scheme: dark)` values correctly. If the
  Firefox run also crashes for you, record "Firefox not tested on this machine, crashed at launch"
  rather than a pass or fail; do not silently drop the browser from the matrix.

## Zoom (200%, 400%) and viewport sizes

`lab-run` has **no zoom option**. The only viewport control is `--viewport=WxH` (CSS pixels);
`runArgs()` defaults to `1280x900`, `walkthrough.mjs` uses `480x900`. On this issue the *height* matters
at least as much as the width: `dialog.position.js` converts the dialog's `maxHeight: '95%'` using
`$(window).height()` minus `Drupal.displace` top/bottom offsets, so a short CSS viewport means a short
dialog and an earlier overflow.

How the lab handles zoom today:

1. **Reflow-equivalent CSS viewport (what `--zoom` does in this evaluator).** Browser zoom makes the
   CSS viewport smaller: a 1920x1080 window at 200% lays out like 960x540 CSS px, at 400% like
   480x270. Playwright has no cross-browser browser-zoom API, so `evaluate-3466040.mjs` computes
   `CSS viewport = physical viewport / zoom factor` and records the method in `results.json.zoom`;
   the output folder is suffixed `-zoom200` / `-zoom400`. This is the standard reflow equivalence and
   the same idea as the lab checklist's "1280 at 400% zoom = 320 CSS px" (`docs/TODO-VISUAL-DIFF.md`).
   It is **not** a real browser zoom: `devicePixelRatio` stays at the emulated value, text is not
   rasterised at the zoomed size, and the browser UI is absent. Do not describe it as "tested at 400%
   zoom" in a drupal.org comment without saying it is the reflow-equivalent emulation.
2. **Text-only zoom** (`--text-zoom=200`): sets `document.documentElement.style.fontSize = '200%'`
   after each navigation. This approximates the WCAG 1.4.4 *text resize* case (the lab uses the same
   approach in `evaluate-3155130-contrib.mjs` `--zoom=200` and in the #361830 ribbon stress runs). It
   is synthetic: "synthetic 200% root text size, not browser zoom".
3. **Not the same thing:** `deviceScaleFactor` is screen pixel density, not zoom (used for
   high-DPI screenshots in `evaluate-3273806.mjs`); Chromium's CDP
   `Emulation.setPageScaleFactor` is pinch-zoom (visual magnification without reflow). Neither is
   browser zoom and neither is used here.
4. **Real browser zoom stays manual.** Ctrl/Cmd `+`/`-` in a real Chromium, Firefox or Safari, with
   the site open as a person would, is the only real check. It remains an unticked manual item in
   `scripts/coverage.mjs`'s list, and needs a person.

Viewport commands for the lead (after both sites are running):

```bash
node tools/playwright/evaluate-3466040.mjs 3466040-pinned --viewport=1920x1080
node tools/playwright/evaluate-3466040.mjs 3466040-pinned --viewport=1920x720
node tools/playwright/evaluate-3466040.mjs 3466040-pinned --viewport=1920x1080 --zoom=200
node tools/playwright/evaluate-3466040.mjs 3466040-pinned --viewport=1920x1080 --zoom=400
node tools/playwright/evaluate-3466040.mjs 3466040-pinned --viewport=480x900
node tools/playwright/evaluate-3466040.mjs 3466040-pinned --viewport=320x900
```

Notes: `1920x720` is a short laptop viewport where the button pane is likely to fall below the fold;
`480x900` is the lab's narrow width; `320x900` is the WCAG 1.4.10 reflow width (1280 at 400%).
`--zoom` with a viewport below roughly 160x120 CSS px is refused with a message, because the admin
dialog cannot open in it.

## Colour scheme and forced colours

Both are Playwright browser-context options, applied by `lab-run`'s `runArgs()`/`openSide()`:

- `--scheme=dark` → `colorScheme: 'dark'` → the page's `(prefers-color-scheme: dark)` matches. This
  can also change Drupal's own appearance when the admin theme is set to follow the OS preference;
  the run records the theme that rendered each page (`pages[].theme`) and the emulated media value per
  stage (`measure.media.prefersDark`), so read those rather than assuming.
- `--forced-colors` → `forcedColors: 'active'`. Per `docs/FORCED-COLORS.md` this is **emulation**, not
  a real Windows contrast theme: author colours are replaced, system colour keywords survive, and
  `forced-color-adjust: none` opts out. Each stage records the actual
  `matchMedia('(forced-colors: active)')` value, so a silent no-op shows up instead of being trusted.
- The lab also has person-driven paths for the same features: `node scripts/lab-env.mjs start <slug> --browser`
  opens the viewer in the lab browser with a **User preferences** switch, and the viewer's
  "Open preference emulation window" gives forced colours Off/Light/Dark, contrast, motion and
  transparency for both frames at once. Use those for a visual/manual check; a real OS contrast theme
  still needs a real Windows (or Firefox "Always" high-contrast) setting.
- Colour is secondary for this issue. The fix is a size/position change, so light/dark/forced runs are
  about regression (borders, scrollbar, close button) rather than the barrier itself.

## Preconditions the lead must confirm before the run

1. Both sites exist and are running:
   `node tools/compare/setup.mjs 3466040-pinned` (build; the lead runs this, not this harness task)
   and `node scripts/lab-env.mjs start 3466040-pinned`. `launch()` refuses to run otherwise.
2. A content type with a **Manage fields** page. The recipe `recipes/repro_3466040/recipe.yml` now
   applies `core/tests/fixtures/recipes/article_content_type` on top of the Standard install and adds
   `language` and `config_translation`; Standard supplies the Article type, Field UI, Views UI and the
   Datetime module. Confirm the recipe applied on both sides before reading a run (`results.json` →
   `identity` records the recipe; `sides.*.site.modules` shows the enabled modules). The evaluator
   tries `/admin/structure/types/manage/article/fields` first and falls back to the first content type
   listed at `/admin/structure/types`. If neither works it aborts with `ABORTED.md` and exit 3 (not a
   `results.json`).
3. Views UI for scenario B. If `/admin/structure/views/view/content` is unavailable, scenario B is
   recorded as a scenario error and the run's verdict is `mixed` — scenario A still runs.
4. Logged-in admin. `lab-run` logs in with the one-time link, so nothing to type.

The recipe also installs French and Config Translation so the Views **translation** modal (issue
comment #24) can be opened. That is a third possible scenario and is **not** implemented in this
evaluator; the two scenarios here are the issue's "Alternatively 1" and "Alternatively 2". A future run
could add `/admin/structure/views/view/content/translate` (open a translation, expand details) with the
same capture helper.

The scenario never saves the new field: it stops in the config modal, so the sites' configuration is
unchanged by a run (the private temp store may hold the half-finished field). A second run on the same
site can therefore repeat the Add-field flow; if a Date and time field exists and the Add-field control
is missing, the evaluator edits that field instead.

## The command to run once the sites are up

```bash
node tools/playwright/evaluate-3466040.mjs 3466040-pinned
```

That runs both scenarios, both sides, Chromium at 1280x900 in light mode, and writes
`reports/issues/3466040/playwright/<stamp>-chromium-light-1280x900/` with `SUMMARY.md`,
`results.json`, `ajax-before.json`, `ajax-after.json` and the stage screenshots. Then run the matrix
above (Firefox, WebKit, dark, forced colours, the viewports, 200%/400%) and, after re-pinning,
`3466040-latest`. Add `--scenario=field-ui` or `--scenario=views` to run one; `--out=<dir>` sends a
trial run elsewhere (used by `scripts/selftest.mjs --live`).

Read the `SUMMARY.md` in this order: the **Checks** table (fix rows false→true, regression rows equal),
then the scenario stage-geometry tables (dialog top→bottom against the viewport, content
`clientHeight/scrollHeight`, overflow, button-pane/buttons, active element, lifecycle deltas), then the
keyboard trail, then the lifecycle counters, then the screenshots named per stage. `results.json` has the
full per-stage measurement, and `scripts/coverage.mjs 3466040` turns runs into the browser/mode matrix.

## Reusable capture helpers (for a person or another script)

The evaluator exports its page-side capture so the same measurements can be taken by hand later:

```js
import { chromium } from '@playwright/test';
import { installCapture, measureDialog, activeState, keyboardReach, captureOnce } from './evaluate-3466040.mjs';

const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
await installCapture(page);            // before the first navigation; installs __labCapture + lifecycle probes
await page.goto(url);                  // then click/open the dialog as a person would
const measurement = await measureDialog(page);   // dialogs, rects, computed styles, hit-tests, displace, media
const keyboard = await keyboardReach(page, { maxTabs: 60 });
const shot = await captureOnce(page, outDir, 'before', 'manual');
```

`measureDialog()` returns, for every visible `.ui-dialog` (topmost first): id/class/z-index, rect,
`fitsVertically`, overflow px, computed `height`/`max-height`/`overflow-y`/`position`, titlebar and
`.ui-dialog-titlebar-close` measurements, `.ui-dialog-content` (`clientHeight`, `scrollHeight`,
`scrollTop`, `scrollableY`, overflow), `.ui-dialog-buttonpane`, every action button in the pane *and*
in `.form-actions` (rect, `inViewport`, `visible`, `enabled`, centre/corner hit-test, `primary`), the
`details` elements, the Views `.scroll` container, and page state (`window.innerWidth/innerHeight`,
`scrollY`, `scrollX`, `visualViewport`, `Drupal.displace.offsets`, emulated media, active element).
`keyboardReach()` walks with real Tab presses from the current focus and reports whether the primary
action was reached and in the viewport, whether the browser scrolled the page or the dialog content,
and the full focus trail.

## Limits: what must be handled by a person (and what this harness cannot claim)

- **Keyboard and screen reader.** The Tab walk is evidence, not a person's keyboard pass, and no
  screen reader is run here. VoiceOver/NVDA (and Safari/VoiceOver in particular) remain manual.
- **A real browser zoom** (200%/400% via Ctrl/Cmd ±) and OS-level magnification/screen readers'
  zoom: `--zoom`/`--text-zoom` are approximations and must be named as such.
- **A real OS contrast theme** (Windows Contrast Themes, Firefox "Always" colours): forced colours
  here is Playwright emulation.
- **Safari itself**: WebKit is the engine only.
- **Touch/pointer-device behaviour** and Windows/macOS scrollbar width differences: not emulated.
- **Firefox** on this machine: see the crash observation above; if it persists, record the gap.
- The existing Views workaround matters: `core/modules/views_ui/js/dialog.views.js` already dispatches
  `dialogContentResize` when a `.scroll` summary is clicked and re-sizes the scroll container. Scenario
  B's Before side is therefore not a naive baseline; the run records those events separately, and a
  scenario B "does not reproduce" is a finding about that workaround, not automatically a failed run.
- The patch's own test route (`dialog_renderer_test`, `/dialog_renderer-content-details`) exists only on
  the After side, so it cannot be a Before/After comparison. Core's CI
  (`ModalRendererTest::testModalContentGrows`, added by the patch) covers it; do not add it as an
  asymmetric "Before" row.
