# #3604037: evaluation of the open review points (2026-10-01)

DRAFT: automated measurements from `tools/playwright/evaluate-3604037.mjs`, run in Chromium on current core `main` (`8cd44d484e3`) with MR !17078 at tip
`e8b2e166be8` applied (After) and the same core without it (Before). A person should look at the images before anything is posted. Evidence:
`playwright/2026-10-01T14-02-09-801Z-evaluate/` (light, dark, the `z-index` alternative; sidebar accordion and narrow tabs included),
`playwright/2026-10-01T13-49-03-333Z-evaluate/` (forced colours and the icon proposals), `playwright/2026-10-01T13-43-45-778Z-evaluate/` (RTL, JavaScript off).
Chromium only; Firefox and Safari were not tried.

## 1. Forced-colours icon colour
**What the MR does:** `background: canvasText` on the error icon (`details.css`, `vertical-tabs.css`). **What we saw:** the icon is black in the light forced
palette and white in the dark one, while the label is link-coloured (blue; yellow in the dark palette), so the icon does **not** match the text it marks
(reviewer's point confirmed). It is always visible (21:1).

| Candidate (After only) | Light forced palette | Dark forced palette | Verdict |
|---|---|---|---|
| MR: `background: canvasText` | black icon, blue label | white icon, yellow label | visible, but not matching |
| `background: currentColor` alone | **icon disappears** (white on white, 1:1) | not tried | **do not use**: forced colours overrides it |
| `currentColor` + `forced-color-adjust: none` | red `#cc3d3d` | red `#ce6060` | visible, but ignores the user's palette |
| **`currentColor` + `forced-color-adjust: preserve-parent-color`** | blue, same as the label (14:1) | yellow, same as the label (19.6:1) | **matches the label automatically in both palettes** |
| `background: LinkText` | blue (same as label here) | yellow (same as label here) | works because both elements happen to be link-coloured |

**Suggestion:** use `preserve-parent-color` so the icon follows whatever colour forced colours gives the label, with a fallback for browsers that lack it:

    @media (forced-colors: active) {
      background: canvasText;              /* fallback */
      @supports (forced-color-adjust: preserve-parent-color) {
        background: currentColor;
        forced-color-adjust: preserve-parent-color;
      }
    }

The fallback keeps the MR's current behaviour. Browser support for `preserve-parent-color` was not checked beyond the Chromium used here, which is why the
`@supports` guard. Images: `compare-forced-preserve-details.png`, `compare-forced-dark-preserve-tabs.png`.

## 2. Transparent summary background on accordion-style details
**Finding:** on current core the summary background is already transparent at rest for these variants, so the MR's `background: transparent` only changes
other states (notably focus). **Test of an alternative:** we removed that rule and instead raised the error bar (`.details.error::before { z-index: 1; pointer-events: none }`).
In the narrow-width vertical-tab case (reviewer's screenshot) that **lost the red outline** on the top and right edges (`compare-light-zindex-tabsnarrow-focus.png`), so it is not
better. The MR's approach kept the full red outline in light and dark, at rest, hover and keyboard focus, in the sidebar accordion (URL alias) and in the narrow tabs.
**Observed behaviour worth a design decision, not a defect:** while hovered, the label turns link-blue (the normal hover style), so the error colour is lost for the label;
the bar and the icon stay red. Untested alternatives, if wanted: draw the bar as an inset `box-shadow` on the summary; keep the error colour on hover. 

## 3. Colour contrast (dark mode)
The error colour is one token: `--admin-color-error: light-dark(#cc3d3d, #ce6060)` in `_variables/variables-color-semantic.css`.

| Where (dark) | `#ce6060` ratio | Needs | Result |
|---|---|---|---|
| details summary label on `#2a2a2d` | 3.72:1 | 4.5:1 | **fails** |
| tab label on `#1b1b1d` | 4.48:1 | 4.5:1 | **fails by 0.02** |
| error icon on the hover background `#41434c` | 2.56:1 | 3:1 | **fails** |
| bar and icon at rest | 3.72 to 4.48:1 | 3:1 | passes |

Light mode: `#cc3d3d` on white is 4.88:1 and passes everywhere measured. The light-mode **hover** label (blue on a light-blue tint, 4.17:1) fails 4.5:1 but is identical on
Before, so it already exists and is not caused by the MR. The focus ring (`#51a8ff`) is 5.7 to 6.9:1 in dark mode.

**Alternatives (same hue and saturation, higher lightness):**
| Dark colour | on `#2a2a2d` | on `#1b1b1d` | on `#41434c` |
|---|---|---|---|
| `#ce6060` (now) | 3.72 | 4.48 | 2.56 |
| **`#d57777`** (smallest change that passes) | 4.59 | 5.51 | 3.16 |
| `#e57373` | 4.79 | 5.76 | 3.30 |
| `#f28b82` | 5.99 | 7.20 | 4.12 |

`#d57777` is the minimum; `#e57373` leaves more margin. Changing the token alters every error cue in Default Admin dark mode, so this belongs with
[#3625458](https://www.drupal.org/project/drupal/issues/3625458) (the contrast issue the reviewer mentions); alternatively scope the change to this MR with its own token.

## Other points checked
- **CSS and compiled CSS:** Drupal's own check (`node core/scripts/css/postcss-build.js --check`) on the four changed `.pcss.css` files reports they match their `.css`. Negative control: a deliberate edit to one `.css` made the check fail.
- **JavaScript off:** with the site's scripts removed, the server-rendered form still shows the error summary; the new markers (`details.error`, `data-child-error-count`) are present on After (3 on the form_test page) and none on Before. The vertical-tab page was not submitted in that run, so that case is not shown.
- **Right to left, real Farsi:** the lab can add Farsi (`/fa`, `lang="fa" dir="rtl"`; `scripts/lab-site.sh language <env> fa`). Measured in `playwright/2026-10-01T14-18-47-795Z-evaluate/` for the details, sidebar accordion, vertical tabs and narrow tabs: the bar is on the right (start) edge, the icon on the left (end), colours and contrast unchanged, no failures. The interface text stays English (no translations imported). Earlier, with the `dir` simulation: closed details and tabs look correct (bar on the start edge, icon at the end). In an open details the `summary::after` has no borders in either direction, so the physical `border-left: none` in the CSS has no visible effect (a style note at most).
- **MR's PHPUnit tests** (current core, `ddev phpunit`; logs in `phpunit/`): on After, `default_admin` `FormGroupingElementsTest` OK (2 tests, 8 assertions), core `FormGroupingElementsTest` OK (5, 48), `NodeEditFormTest` OK (4, 111). The same test files against Before's code (copied in temporarily, then removed): 2 tests with 1 error; 5 tests with 2 errors and 1 failure; 4 tests with 1 failure. The reasons are the missing feature (`data-child-error-count` markup not found; a new element absent). One of those errors is a stale-element error that could be timing noise, so the failing count there is not exact.
- **Not done:** a real screen-reader pass, Firefox/Safari, a real Windows contrast theme, Farsi interface translations.
