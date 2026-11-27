# Prototype: three implementations, compared (#3534229)

DRAFT. The browser evidence is in `fixture/` (A/B/C/D on the same page) and the live-Drupal evidence in
`playwright/`. Nothing here was posted to drupal.org.

The question: restore the visibility of the CKEditor 5 toolbar-configuration icons in forced-colors mode
without changing normal-mode presentation, without replacing the icons, and without breaking contributed
plugins. The constraint from the issue thread: build on kentr's 2024-07-24 mask experiment (comment #7),
not on a new icon system.

## A. Current core: SVG `background-image`

Every icon is a fixed-fill SVG set with `background-image` on the 36×36 button span; the toolbar's shared
chip is `background-color: #eee`. Normal modes are fine.

In forced-colors mode the browser forces `background-color`/`color`/borders to system colours, but
**`background-image` values that contain `url()` are kept** (CSS Color Adjust: only values without `url()`
compute to `none`). The SVGs keep their baked-in black fill. On the dark forced palette `Canvas` is black,
so the icon is black on black: **invisible**. On the light forced palette it is black on white and stays
visible. That palette dependence is why the report says "completely invisible" while a light-palette
tester may see nothing wrong.

## B. kentr's experiment: mask the whole control

Comment #7's CSS sets `background: buttontext` (which, as a shorthand, also removes the background image)
and `mask-image: <the item's SVG>` on `.ckeditor5-toolbar-button`, with `buttonface/buttontext` for the
text dropdowns. The mechanism works for a plain icon-only button and is minimal.

It does not cover the whole inventory:

- the mask applies to the control **and its descendants**, so the alignment caret (`::after`) and the
  text labels of Heading/Style/Language are clipped; the experiment handled Style only, with a colour
  override, and did not handle Alignment's caret;
- `background: buttontext` removes the background image for **every** toolbar button, including buttons
  from contributed plugins in the same lists, which then render as solid system-colour boxes;
- using `ButtonText`/`ButtonFace` is defensible for a real button, but the list options in this UI are
  `role="option"` inside a `role="listbox"`; `CanvasText`/`Canvas` describe the actual surfaces.

So B is the right mechanism but the wrong scope for the full fieldset.

## C. Proposal: one icon URL, a dedicated mask surface, opt-in

1. **Define the URL once.** Each icon stylesheet becomes:
   `.ckeditor5-toolbar-item-bold { --ckeditor5-toolbar-icon: url(../icons/bold.svg); }` plus the existing
   `.ckeditor5-toolbar-button-bold { background-image: var(--ckeditor5-toolbar-icon); }`. Normal modes are
   unchanged (including Alignment's background-position and RTL rules).
2. **Repaint only opted-in icons.** One block in `toolbar.admin.css`:
   `@media (forced-colors: active) { @container style(--ckeditor5-toolbar-icon) { … } }`. Inside it the
   button gets `background-color: CanvasText; background-image: none; mask-image:
   var(--ckeditor5-toolbar-icon)` with the same size/position as the background image, and a `:hover`
   variant. The container style query is what makes the block apply **only** where a stylesheet defined
   the property: a contributed plugin that still only sets `background-image` is not matched at all and
   keeps its current rendering. Supported in current Chromium/Firefox/Safari; a browser without style
   queries simply keeps the current behaviour (no regression).
3. **Handle the shapes that are not a plain icon.** Heading/Style/Language already render generated text
   and a CSS-border caret, which forced colors turns into `CanvasText`: they are not touched. Alignment
   (icon + caret) moves its icon to the free `::before` surface in forced colors so the mask cannot clip
   the `::after` caret; its 10px/30px LTR/RTL icon offsets are preserved on the mask.
4. **Cancel a dark-mode colour filter.** A theme-level `filter: invert(1)` for dark mode (as proposed in
   #3637246) would invert the user's forced palette and hide the masked icon again. The block resets
   `filter: none` for toolbar buttons in forced colors, with specificity above `.dark-mode
   .ckeditor5-toolbar-button`.

Why not the alternatives:

- adding `forced-color-adjust: none` to keep the `#eee` chip would ignore the user's palette;
- `filter: invert(1)` on its own turns a light palette into a dark surface (and back), i.e. it inverts the
  system colours; it only "works" by accident in one palette and cannot work for both;
- a new icon element, duplicate SVGs, or JavaScript are unnecessary: the existing `mask-image` +
  `CanvasText` does the job in CSS.

## What the fixture compares

`fixture/index.html` renders the same Core markup with A, B and C plus a simulated contributed plugin
(A/B/C/D). `fixture/evaluate.mjs` measures every item at rest, on hover and on focus, from **rendered
pixels** (PNG decoded in Node; a non-empty `mask-image` alone proves nothing) and records computed CSS,
geometry, tooltip state and a screenshot hash.

Fixture results (Chromium `157.0.8103.15`, 37 toolbar items per scenario: 29 plugin items + 2 structural + 1 simulated contributed plugin + the divider duplicates in the active list; rendered-pixel measurement, DDEV-free):

| Mode / direction / width | A current core | B kentr's mask | C proposal |
|---|---|---|---|
| normal light, LTR, 1280 | 37/37 visible | 37/37 | 37/37 |
| normal dark, LTR, 1280 | 37/37 | 37/37 | 37/37 |
| forced light, LTR, 1280 | 37/37 | 36/37 — the un-opted contributed control is gone | 37/37 |
| forced dark, LTR, 1280 | 4/37 — 33 invisible | 36/37 — contributed control gone | 36/37 — only the un-opted contributed control, exactly as in A |
| forced dark, RTL, 1280 | 4/37 | not measured | 36/37 |
| forced dark, LTR, 390 px | 4/37 | not measured | 36/37 |

What the numbers mean, and what the screenshots show:

- **A reproduces the defect only in the dark forced palette** (4/37: Heading, Style, Language and Alignment's caret; every icon-only control and both dividers are blank). The light palette is fine. Normal modes are fine.
- **B fixes every Core icon** but, because `background: buttontext` is a shorthand that removes the background image of every toolbar button, the un-opted contributed control becomes a solid `ButtonText` box: it is *visible as a box with no icon* in forced dark and equally wrong in forced light (36/37 in both). Its whole-control mask also clips the Alignment caret (visible in the B screenshot: the alignment item shows the icon without its `::after` caret); the text dropdowns keep their labels because the variant applies Kent's colour override to all three.
- **C fixes every Core icon and leaves the un-opted contributed control exactly as A had it** (invisible in forced dark, visible in forced light), which is the backward-compatibility requirement. Alignment keeps both its icon and its caret in forced dark, LTR and RTL, and at 390 px.
- Computed CSS agreed with the pixels in every scenario, including the negative cases: in A forced dark the icons have a non-empty `background-image` yet no distinguishable pixel; under C every mask that is set also renders (no "mask set but no pixels" rows).

Firefox: all launches failed on this host (`browser.newPage: Target crashed`; 44 recorded failures, 0 scenarios), the same blocker the Lab already records for #3619127. It is not evidence either way.


## What the live Drupal runs show

- **Forced dark, 1280 px (16:05:38):** Before 31/35 rendered control instances invisible, After 0/35; every After icon/text measures 21:1 against its surface; hover loses nothing; tooltips 35/35; axe identical Before/After. Verdict `reproduced-and-fixed`.
- **Forced light, 1280 px (16:07:55):** Before 0/35 invisible, After 0/35 — the light palette never reproduced the defect. Verdict `not-reproduced`.
- **Normal light (16:10:08) and normal dark (16:12:08):** every toolbar item's element screenshot is **byte-identical** Before/After (screenshot hashes compared by row), so the CSS-only change does not alter normal-mode rendering. Minimum measured contrast 17.16:1.
- **Forced dark RTL (16:14:01)** and **forced dark 480 px (16:15:49):** 31/35 → 0/35 invisible in both; the alignment icon+caret positioning and the wrapping/narrow layout keep working.
- Keyboard focus: the outline stays on the `role="option"` list item (`4px solid rgba(26, 235, 255, 0.8)`, `:focus-visible` true) and is not clipped by the masked button.
- **Interaction states** (run `19-37-00`, `unexpected 0`): keyboard reordering moves and reverse-moves the option identically Before/After; pointer drag keeps the icon visible (16.83:1); Save persists the order across a reload and the original order can be restored and saved. ArrowLeft/ArrowRight are intentionally silent in core (only add/remove announce). Focus lands on the first Available button after a keyboard move, identically Before/After: a pre-existing admin-UI behaviour under automation that needs a person to judge in normal use.
- **Combined #3637246 + this proposal** (own environment, `19-28-34` dark and `19-30-22` light): forced dark 31/35 → 0/35 and every toolbar button computes `filter: none`, so the MR's dark-mode `invert(1)` is cancelled in forced colors instead of inverting the user's palette; forced light stays not-reproduced (0/35). This is the live companion to `COMPATIBILITY-3637246.md`.

## Limits

- The fixture is representative, not pixel-identical to Default Admin.
- Forced-colors palettes are Chromium's emulated light/dark defaults, not a real Windows contrast theme or
  a custom palette. See `MANUAL-WINDOWS.md`.
- Firefox forced-colors rendering and a human keyboard/screen-reader pass are not covered.
