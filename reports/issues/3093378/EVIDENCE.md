# Evidence: issue 3093378 (Use ARIA disclosure pattern for submenu buttons in vertical toolbar orientation)

Status: **DRAFT**. Scripted runs on current core main and on pinned core `4f9558d8`, with contrib toolbar `2.x` + MR !6, across Chromium (light, dark, forced colours) and WebKit (light, dark), plus a Guidepup virtual screen-reader pass. No keyboard-only or real screen-reader pass by a person, and no human review yet.
Date: 2026-10-13   Author/agent: AI-assisted (opencode / big-pickle); scripted Playwright and Guidepup runs.

## Environments
| Env | Directory | Core commit | Contrib toolbar | Notes |
|-----|-----------|-------------|-----------------|-------|
| Baseline | `envs/baseline-3093378-latest` | `4f9558d85e7db3f2fc0e4a5cde195a1834cb6206` (2026-10-12) | `871ce78` (`2.x`) | Standard install, recipe `repro_3093378` applied |
| Patched  | `envs/issue-3093378-latest` | `4f9558d85e7db3f2fc0e4a5cde195a1834cb6206` (2026-10-12) | `871ce78` + MR !6 | working tree shows the 6 changed files (`branches/3093378-use-aria-disclosure.patch`) |

Both sites are a plain DDEV install (`admin`/`admin`), admin theme **Default Admin** (`default_admin`). The recipe ships an
`apply.sh` that **uninstalls the core `navigation` module**; otherwise Navigation's admin bar suppresses the contrib Toolbar
module entirely (`ToolbarHooks::pageTop()`). See `REPRODUCE.md`.
Where: local DDEV on macOS (`darwin arm64`). Browser: headless Chromium `153.0.8010.12` driven by Playwright; viewport
**480x900** (below the 1024px breakpoint, so the toolbar tray is vertical and the disclosure buttons render).

## Automated results (Chromium light, 480x900)
Scenario: log in as user 1 (one-time link), open the home page, open the "Manage" tray, then inspect the disclosure button
for the "Structure" submenu and click it once (real Playwright click). The checks below are the variant's own checks.

| Check | Before | After | Verdict |
|-------|--------|-------|---------|
| Disclosure button carries `aria-expanded` | no | yes | as expected |
| Label text | `Structure` | `Structure menu` | as expected |
| Old `Extend`/`Collapse` action span present | yes | no | as expected |
| `aria-expanded` changes on a real click | `null → null` | `false → true` | as expected |
| Regression: disclosure buttons rendered (count) | 12 | 12 | unchanged |
| Regression: axe violations (elements) | 2 | 2 | unchanged |
| Regression: JavaScript errors | 0 | 0 | unchanged |
| Visual: pixel diff of the same page state | — | — | **0 of 432000 px (0.000%)** |

Markup of the "Structure" disclosure button:

    Before (closed): <button class="toolbar-icon toolbar-handle"><span class="action">Extend</span> <span class="label">Structure</span></button>
    Before (open):   <button class="toolbar-icon toolbar-handle open"><span class="action">Collapse</span> <span class="label">Structure</span></button>
    After  (closed): <button aria-expanded="false" class="toolbar-icon toolbar-handle"><span class="label visually-hidden">Structure menu</span></button>
    After  (open):   <button aria-expanded="true" class="toolbar-icon toolbar-handle open"><span class="label visually-hidden">Structure menu</span></button>

Accessibility tree of the button (Playwright `ariaSnapshot`):

    Before: - button "Extend Structure"
    After:  - button "Structure menu"

This matches the markup in the issue summary and in comment #16802763 ("the 'before' and 'after' markup snippets … are the same"
when tested with the Default Admin theme) exactly.

## Findings
- The fix check distinguishes Before from After on **exactly** the intended axis: `aria-expanded` appears, the name stops
  flipping and becomes stable, and the old action span disappears. No change to the number of buttons, the axe result or
  JavaScript errors.
- The change is **visually identical**: the two screenshots of the same page state differ in 0 pixels. The `text-indent:
  -9999px` removal is safe because the label is now `.visually-hidden`.
- The 2 axe violations are `color-contrast` on both sides, before and after — pre-existing and unrelated to this MR.
- Review of the code (no blocking issue found): `initItems()` still runs before `openActiveItem()`, so auto-opening the
  active trail (`toggleList($activeTrail, true)`) sets `aria-expanded` correctly — there is no "open but collapsed" mismatch.
  No `.action`/`handleOpen`/`handleClose` reference is left anywhere in the module (no dead code). `@label` goes through
  `Drupal.t()`, so the name is HTML-escaped as before. Optional: the APG disclosure pattern recommends `aria-controls`
  linking the button to the submenu it toggles.

## Test matrix

`node scripts/coverage.mjs 3093378` produced `COVERAGE.md`. Every non-Firefox environment in the matrix now has a run on
**both** pinned core (`4f9558d8`) and current core main, all `reproduced-and-fixed` with 0 unexpected checks:

| Environment (480x900) | Pinned | Latest |
|---|---|---|
| Chromium · light | ✓ | ✓ |
| Chromium · dark | ✓ | ✓ |
| Chromium · light · forced colours | ✓ | ✓ |
| WebKit · light | ✓ | ✓ |
| WebKit · dark | ✓ | ✓ |
| Firefox · light | blocked | — |
| Firefox · dark | blocked | — |

Firefox is a declared, attempted block: Playwright's Firefox fails to launch on this machine (macOS 27), so Firefox must be
checked by hand in the viewer or on another machine. Emulated forced colours and WebKit are not Windows High Contrast or
Safari itself. Full run list and links: `COVERAGE.md` (generated).

## Virtual screen reader (Guidepup)

`tools/playwright/screenreader-3093378.mjs` drives the toolbar in the browser (open the "Manage" tray, real click on the
"Structure" handle) and then reads a jsdom snapshot of that button with the Guidepup virtual screen reader. It is
synthetic: it documents role, accessible name and expanded state, and is **not** a real VoiceOver/NVDA run. Run on both
pinned and current core main, with the same result:

| Side | Closed | Open |
|------|--------|------|
| Before | `button, Extend Structure` | `button, Collapse Structure` |
| After  | `button, Structure menu, not expanded` | `button, Structure menu, expanded` |

Before, the announcement changes with the state and never names it; After, one stable name is followed by the expanded/
collapsed state. Raw output: `screenreader/<stamp>/` (`results.json`, `SUMMARY.md`).

## Not verified
Keyboard-only and real screen-reader passes by a person (the Guidepup run is synthetic); the Nightwatch test in the MR
(`ddev nightwatch` is not available in this add-on); Firefox (Playwright's Firefox fails to launch on this machine);
any step by a person.

## Raw output
Ten Playwright run directories under `playwright/` — five on variant `3093378-pinned` (core frozen to `4f9558d85e7d`) and
five on `3093378-latest`: Chromium light (`18-38-03` / `18-22-29`), Chromium dark (`18-58-52` / `19-34-21`), Chromium light
forced colours (`18-59-13` / `19-34-29`), WebKit light (`18-59-43` / `19-34-35`), WebKit dark (`18-59-56` / `19-34-46`).
Each has `SUMMARY.md`, `results.json`, `before-1-tray.png`, `after-1-tray.png`, `before-2-structure-open.png`,
`after-2-structure-open.png` and `pixel-diff.png`; each reports `verdict: reproduced-and-fixed` and `unexpected: 0`.
Two Guidepup runs under `screenreader/` (`19-33-05` pinned / `19-34-57` latest), each with `results.json` and `SUMMARY.md`.
