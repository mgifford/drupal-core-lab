# Evidence: #3426468 Make the active menu item visually stand out more

Status: **DRAFT** — measured in the Lab on 2026-11-26; a person has not yet reviewed the rendering. Every
browser number below comes from the dedicated evaluator and the run folders under `playwright/`.
Date: 2026-11-26   Author/agent: Lab session (AI-assisted)

## Test object

| | |
|---|---|
| Variant | `3426468-latest` |
| Before | `baseline-3426468-latest` — core `a48087f26ec0c76d6786592f6ca755be4068fb0d` (2026-11-26), Standard install, recipe `repro_3426468` |
| After | `issue-3426468-latest` — the same core, v1 + v2 applied |
| Drupal / PHP | 12.0-dev / 8.5.7 |
| Themes | Default Admin is both the default and the administration theme |
| Patches | v1 `3426468-active-indicator.patch` sha256 `887f9d9f…`; v2 `3426468-active-indicator-v2.patch` sha256 `5922b7c4…` |
| Full proposal | v1 + v2 stack; one-patch equivalent `css-build/2026-11-26-3426468-latest-followup-full.patch` sha256 `dfcb075b…` |
| Evaluator | `tools/playwright/evaluate-3426468.mjs` (built on `lib/lab-run.mjs`) |

Core `main` moved overnight: the patch was verified against `0387fb9…` on 2026-11-25, then the pair was built on
`a48087f26ec0` on 2026-11-26. v1 applied there without a conflict; both Navigation paths the patch touches are
unchanged between the two commits (`git diff 0387fb9 a48087f -- core/modules/navigation` and
`core/themes/default_admin/css/components/navigation.pcss.css` are empty). The run records the actual commit,
`a48087f26ec`.

## What was tested

On `/admin/appearance`, `/admin/structure/display-modes/form` and `/admin/content`:

- the current top-level link (`Appearance`, `Content`);
- the top-level ancestor that contains the current page (`Structure` on Form modes);
- the current submenu link (`Form modes`) and its dot;
- the submenu ancestor (`Display modes`, the open trigger containing Form modes);
- expanded/collapsed sidebar, 480 px, emulated RTL, light, dark, forced colours (light and dark), Chromium,
  Firefox and WebKit.

The evaluator waits for the sidebar slide to finish, opens a closed active trail with real Enter key presses, and
records the `::before`/`::after` computed styles, rectangles, clipping ancestors, focus rings (real Tab) and hover.

## Result

**v1 (the original Lab patch) was functionally right but not submission-ready.** It added the bar correctly, but:

- CSpell failed with 8 “Unknown word (colour)” errors (core uses US spelling).
- Its `--toolbar-button-current-color: gray-990` had **no rendered effect**: Default Admin's
  `css/components/navigation.pcss.css` sets `--toolbar-button-current-color: var(--admin-color-primary)` after the
  module, so the measured active text was the same `rgb(1, 94, 254)` before and after v1.

**v2** fixes both: comments use “color”, and the Default Admin theme now sets
`--toolbar-button-current-color: var(--admin-toolbar-color-gray-990)`. In Default Admin that token is
`--admin-color-primary-active` → `accent-600`, `rgb(25, 80, 212)` / `lch(37.644 77.8721 288.155)`; it is the same
token the existing submenu current item already uses. It is a dark blue, not a neutral gray. The bar remains the
4 px forced-colours indicator made `currentColor` in normal modes. All nine v2 runs are `reproduced-and-fixed`.

This alignment has a side effect worth stating: the active-vs-inactive text delta **falls** from 2.99 to 2.32,
because accent-600 is closer to the inactive gray than accent-500 was. The bar, not the text colour, is the durable
state cue; the text change brings the top level in line with the submenu and improves text contrast (4.53 → 5.82),
but it is not what removes the colour-only dependence.

## Measured matrix (v2)

| Run | Current indicator | Ancestor indicator | Current text | Clipped | Notes |
|---|---|---|---|---|---|
| Chromium light 1280×900 | 6.69:1 | 4.53:1 | 5.82:1 | no | bar 4×40 px, `rgb(25, 80, 212)` |
| Chromium dark 1280×900 | 10.21:1 | 7.39:1 | 7.95:1 | no | renders dark (`lch(88 …)`, body `rgb(27,27,29)`) |
| Chromium forced colours, light | 21:1 | 21:1 | 13.99:1 | no | baseline already has the system-colour bar |
| Chromium forced colours, dark | 21:1 | 21:1 | 19.56:1 | no | body black, CanvasText white, linkText yellow |
| Chromium collapsed 1280×900 | 6.69:1 | — | 5.82:1 | no | `data-admin-toolbar="collapsed"`, bar visible |
| Chromium 480×900 | 6.69:1 | 4.53:1 | 5.82:1 | no | drawer opened; hover not tested (touch width) |
| Chromium RTL 1280×900 | 6.69:1 | 4.53:1 | 5.82:1 | no | bar at x 1269–1273, right of the item (`inline-start`) |
| Firefox light 1280×900 | 6.69:1 | 4.53:1 | 5.82:1 | no | 1 px dotted focus ring on the pre-existing “Collapse sidebar” button |
| WebKit light 1280×900 | 6.69:1 | 4.53:1 | 5.82:1 | no | Tab order reached the current item |

Before the patch, the current top-level item had **no** indicator in normal modes (0), text `rgb(1, 94, 254)` on
`rgb(237, 239, 245)` (4.53:1) and an active-vs-inactive text delta of 2.99. After v2 it has the bar and 5.82:1 text;
the delta is 2.32. The delta is reported as a state signal only: it is not an SC 1.4.3 measurement, and the bar, not
the text colour, is what removes the colour-only dependence.

## State-by-state findings

| State | Before | After v2 |
|---|---|---|
| Current top-level (`Appearance`, `Content`) | Blue text + gray-050 background, no marker | Bar + darker text; 6.69:1 bar, 5.82:1 text |
| Top-level ancestor (`Structure`) | Gray-950 text + gray-050 background, no marker | Bar (4.53:1) + existing ancestor colour |
| Current submenu (`Form modes`) | 8×8 dot, `aria-current="page"` | Unchanged dot and `aria-current` |
| Submenu ancestor (`Display modes`) | Open trigger + text colour, no marker | **Still no bar/dot** (observed 0) |
| Expanded control | `aria-expanded`, rotated chevron, open submenu | Unchanged |
| Hover (current) | Colour/outline only | Bar persists; inactive hover does not gain it |
| Keyboard focus | 2 px solid `rgb(0, 125, 250)` | Unchanged; the bar does not intersect the ring |
| Collapsed sidebar | No marker | Bar visible, not clipped |
| RTL | Logical properties | Bar mirrors to the right, not clipped |
| Shortcuts duplicate (case c) | N/A | N/A — the Shortcut module is not in core at this commit |

## WCAG mapping

| SC | Finding | Status |
|---|---|---|
| 1.4.1 Use of Color | Current top-level and top-level ancestor now have a non-colour bar. The submenu ancestor still relies on colour plus the open submenu. | **Pass for the tested top-level states; gap for the submenu ancestor** |
| 1.4.3 Contrast (Minimum) | Current text against its own background: 4.53:1 before, 5.82:1 after (light); 7.95:1 dark; 13.99/19.56 forced. The 2.99→2.32 delta is not this criterion. | **Pass** |
| 1.4.11 Non-text Contrast | Bar against the adjacent surface: 6.69:1 light, 10.21:1 dark, 21:1 forced; ancestor 4.53:1 light. | **Pass** |
| 2.4.7 Focus Visible | Every focused Navigation control has a visible outline. The current item keeps its 2 px solid ring. Firefox uses a 1 px dotted ring on the pre-existing “Collapse sidebar” button. | **Pass; one pre-existing style inconsistency** |
| 2.4.11 Focus Not Obscured (Minimum) | The new bar does not intersect the current item's focus ring. The pre-existing submenu dot touches the inset submenu focus ring (offset −2 px). | **Pass for the new bar; pre-existing dot/ring touch recorded** |
| 4.1.2 Name, Role, Value | The current submenu link has `aria-current="page"`. The current **top-level** link has neither `aria-current` nor an equivalent in both Before and After; no ancestor gets it. | **Pre-existing gap, not caused by this patch** |

## Other observations

- **Active trail is closed on load** for `/admin/structure/display-modes/form` on both sides (related #3438046).
  The evaluator opened Structure and Display modes with real Enter presses; the current submenu dot is only visible
  after that. This is not introduced by the patch.
- **The theme's “gray-990” is a dark blue, not a gray.** `--admin-toolbar-color-gray-990` maps to
  `--admin-color-primary-active`, so the design's near-black dot/text is implemented as the theme's active blue. A
  designer should confirm that this is the intended reading of the design; v2 makes the top level match the
  existing submenu current colour rather than inventing a new one.
- **The approved design asks for a dot**, not a bar. The bar is a different shape at the sidebar edge, although it
  is the component's existing forced-colours idiom and it passes 1.4.1/1.4.11. This needs a design/maintainer
  decision; v2 does not silently redesign it.
- **Case (c), shortcuts**, cannot be built on this core: `core/modules/shortcut` and the `navigation_shortcuts`
  block do not exist at `a48087f26ec`. A contrib port exists; installing it would be a fixture change and was not
  done.
- axe-core reports **0 violations** on all three routes, Before and After, in every run; that is a floor, not the
  conclusion.
- No layout shift (indicator absolutely positioned), no JavaScript errors.

## Patch quality

- `node scripts/css-build.mjs 3426468-latest --check --stylelint`: **PASS** (both compiled files match their
  `.pcss.css` sources; Stylelint PASS).
- `node scripts/lint.mjs 3426468-latest`: **PASS** on v1+v2 — CSpell, PHPStan, Stylelint and core's build:css.
  v1 alone failed CSpell; v2 fixes it.

## Not verified

- No real screen reader (NVDA, JAWS, VoiceOver, TalkBack) pass.
- No real OS forced-colours mode; the browser emulation is recorded with the actual palette.
- No installed RTL language; `dir="rtl"` on `<html>` is an emulation, not translated menus.
- No manual keyboard-only review by a person.
- WebKit does not reproduce Safari's macOS Full Keyboard Access preference in Playwright; the Tab result is the
  engine's, not a Safari-with-preference result.
- The approved Figma file itself was not opened; the comparison uses the issue's `active.png`, the annotated #28
  image and the DOM.
