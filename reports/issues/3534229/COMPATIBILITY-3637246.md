# Compatibility analysis: #3637246 (!17909) CSS against a forced-colours mask correction for #3534229

**DRAFT — prepared 2026-11-27, not reviewed by a person, not a verification claim.**
The #3637246 merge request and its patch were **not** modified. This is a static CSS analysis plus a standalone
browser fixture; no Drupal site or DDEV environment was started (the task forbade it).

- Issue under evaluation: [#3534229 CKEditor config buttons not working in forced-colors mode](https://www.drupal.org/project/drupal/issues/3534229)
- Related issue (CSS under test): [#3637246 The styling of ckeditor buttons in the toolbar configuration field set has a too low color contrast and/or breaking style](https://www.drupal.org/project/drupal/issues/3637246)
- Merge request: [!17909](https://git.drupalcode.org/project/drupal/-/merge_requests/17909), target `main`, branch `3637246-ckeditor5-buttons-styling`, head `5917a35e0aaedcdc0403349b335cea6297833c99`
- Pinned core: `8a7df6cc3e69b6b5d427cb25ce8f66dda8393c29` (committed 2026-11-27)
- Fixture and raw measurements: [index.html](compat-3637246/index.html), [measure.mjs](compat-3637246/measure.mjs), [COMPATIBILITY-3637246.json](COMPATIBILITY-3637246.json)

## Short answer

1. **The premise in the brief needs correcting: pinned core does have `.dark-mode`, and it does define `--admin-color-bg`.** Both live in `core/themes/default_admin`, which is the Standard-install admin *and* default theme at this commit. So `filter: invert(1)` **does** apply on a stock install in Default Admin dark mode — but only in that theme. It does **not** apply under core's `stark`/`starterkit_theme`, and Gin — the origin of the fix — uses `gin--dark-mode`, not `.dark-mode`.
2. `background: var(--admin-color-bg)` therefore resolves in Default Admin (light ≈ `rgb(250,250,255)`, dark `rgb(27,27,29)`) but is **invalid at computed-value time in any theme that does not define it** (core's `stark`/`starterkit_theme`, Gin, …), so the `#fafafa` fill is lost (transparent), not preserved by the earlier declaration. Measured: `rgba(0, 0, 0, 0)`.
3. Measured in forced-colours mode: the mask correction (c) gives **21:1** in both forced palettes. `filter: invert(1)` on the same masked button (d) gives **1:1** — the icon disappears again in **both** forced-dark and dark-mode/forced-light. On the old background-image button (b), invert only “works” in forced-light by inverting the user's Canvas on that element; in forced-dark the surface and icon invert to the same colour (1:1). Invert also destroys a non-monochrome palette colour: Chromium forced-dark `LinkText` yellow `rgb(255,255,0)` on black (19.56:1) becomes blue `rgb(0,0,255)` on black (**2.44:1**).
4. **The two changes can be applied together cleanly, but they do not safely coexist as written.** Forced colours does not reset `filter`. A #3534229 patch must explicitly reset `filter: none` inside `@media (forced-colors: active)` with sufficient specificity (measured positive control (e): 21:1 restored), and must avoid `filter`, hard-coded colours, `.dark-mode` and theme variables. Recommendations for the !17909 author are in §4.

## Inputs and identity

| Item | Value |
|---|---|
| Pinned core commit | `8a7df6cc3e69b6b5d427cb25ce8f66dda8393c29` (2026-11-27) |
| Base blob of `core/modules/ckeditor5/css/toolbar.admin.css` | `40b04dd951244e04e41468289d5ce8a86f137361` |
| MR diff base blob (from diff header) | `40b04dd951244e04e41468289d5ce8a86f137361` — **matches pinned core** |
| MR head | `5917a35e0aaedcdc0403349b335cea6297833c99` |
| MR diff size / SHA-256 | 1095 bytes / `112c8136269dbbb9008c80d160a00ddb09ada1048e2f036726a3bb37069bbc30` |
| Snapshot provenance | `.lab-cache/sources/3637246/snapshot.json`, fetched 2026-11-27T14:28:11Z |
| #3534229 mask proposal | comment by kentr, 2026-07-24 ([issue](https://www.drupal.org/project/drupal/issues/3534229)): `background: buttontext` (a system colour) + `mask-image` per button, inside `@media (forced-colors: active)` |
| Browser | Chromium `157.0.8103.15` via lab Playwright (`1.65.0-alpha-2026-10-30`), macOS arm64, 2026-11-27 |
| Fixture | `file://…/reports/issues/3534229/compat-3637246/index.html`; icons referenced from `reports/issues/3534229/fixture/assets/icons/`, not duplicated |

The MR diff was read exactly from the snapshot. Its three changes are: `background: var(--admin-color-bg)` on
`.ckeditor5-toolbar-tray` and on `.ckeditor5-toolbar-active__buttons` (replacing `#fafafa`), and:

```css
/* 
 * Toolbar icon is defined as svg image applied as background-image 
 * css property, so there is no possibility to set the fill color 
 * directly. 
 */
.dark-mode .ckeditor5-toolbar-button {
  filter: invert(1);
}
```

The file has no `.pcss.css` source at this commit (the `core/modules/ckeditor5/css/` directory contains only plain
`.css`), so the “generated CSS must match its source” rule does not apply to this MR.

## 1. Does core have `.dark-mode`? How does core express dark mode?

**Yes — but only in the `default_admin` theme, and it is a JavaScript-applied class, not a media query.**

At `8a7df6cc`, `git grep -l "dark-mode"` matches **only** `core/themes/default_admin/*` (54 CSS files, 2 migration JS files,
1 PHP hook class, 2 test fixtures). `stark` and `starterkit_theme` contain no match. `core/themes/default_admin` is the
Standard-install theme at this commit:

```
core/profiles/standard/config/install/system.theme.yml
1:admin: default_admin
2:default: default_admin
```

Core expresses dark mode with a **class on `<html>` plus the `color-scheme` property and `light-dark()` colour values**,
not with `@media (prefers-color-scheme: dark)`:

```
core/themes/default_admin/css/base/elements.pcss.css
 16:  color-scheme: light; /* Can be overridden by inline styles. */
261:.dark-mode {
262:  color-scheme: dark;
263:}

core/themes/default_admin/migration/js/init.js
 34:  const darkModeClass = 'dark-mode';
 44:  if (
 45:    window.defaultAdminDarkMode == 1 ||
 46:    (window.defaultAdminDarkMode === 'auto' &&
 47:      window.matchMedia('(prefers-color-scheme: dark)').matches)
 48:  ) {
 49:    document.documentElement.classList.add(darkModeClass);
 50:  } else {
 51:    document.documentElement.classList.contains(darkModeClass) === true &&
 52:      document.documentElement.classList.remove(darkModeClass);
 53:  }

core/themes/default_admin/src/Hook/ThemeHooks.php
153:      'dark_mode_class' => 'dark-mode',
```

A `git grep` for `prefers-color-scheme` restricted to `*.css`/`*.pcss.css` in pinned core returns **no matches**; the only
occurrences are in `default_admin` JavaScript and `yarn.lock`. So core's CSS never switches on the OS preference directly.

### What that means for `filter: invert(1)`

- On a **stock Standard install** (`default_admin` for admin and default) the selector **does match** when Default Admin's
  dark mode is on: setting `enable_dark_mode = 1`, or `auto` with a dark OS scheme. In Chromium's forced-colours dark
  emulation, `prefers-color-scheme: dark` matches (measured), so Default Admin's `init.js` would add `.dark-mode`; the
  fixture simulates exactly that and measured computed `filter: invert(1)` in the forced-dark context.
- The CSS is **module-level** (`core/modules/ckeditor5/css/toolbar.admin.css`), so it also loads under `stark`,
  `starterkit_theme`, and contrib admin themes. In core's `stark`/`starterkit_theme` nothing adds the class, and Gin adds
  `gin--dark-mode`, so the icon fix silently does nothing there.
- The change **originates in Gin** (#3506329, the author's own comment: “The solution is based on my previous commit to the
  Gin theme: https://git.drupalcode.org/project/gin/-/work_items/3506329”). Gin MR
  [!656](https://git.drupalcode.org/project/gin/-/merge_requests/656.diff) uses the **Gin-scoped** class and token:

  ```css
  .gin--dark-mode .ckeditor5-toolbar-button {
    filter: invert(1);
  }
  .ckeditor5-toolbar-active__buttons {
    background: var(--gin-bg-layer3);
  }
  ```

  and `gin_toolbar.module` adds `'gin--dark-mode'` to the `<html>` classes. Core's port renamed the class to `.dark-mode`
  and the token to `--admin-color-bg` to match Default Admin. **Consequence:** the core rule does not apply in Gin
  (Gin's own MR handles that), and it only applies in core's Default Admin — it is not a theme-neutral core fix.

## 2. Does `--admin-color-bg` exist in pinned core?

**Yes, but only in the `default_admin` theme.** The property is defined in Default Admin's semantic variables
(`:root, [data-accent]`), in both the `.pcss.css` source and the compiled `.css`:

```
core/themes/default_admin/css/_variables/variables-color-semantic.pcss.css
 6::root,
 7:[data-accent] {
49:  --admin-color-bg: light-dark(color-mix(in lch, var(--accent-base), #fff 97%), #1b1b1d);

core/themes/default_admin/css/_variables/variables-color-semantic.css
56:  --admin-color-bg: light-dark(color-mix(in lch, var(--accent-base), #fff 97%), #1b1b1d);
```

It is also overridden by Default Admin's own accent/high-contrast layer
(`core/themes/default_admin/css/theme/accent.pcss.css:7,19`). Default Admin's `body` uses it:
`core/themes/default_admin/css/base/elements.pcss.css:24: background: var(--admin-color-bg);`. No other core theme defines
it (`workspaces_ui` uses `--admin-color-bg-item`; the Standard profile welcome page uses `--admin-color-bg-header` — those
are different properties).

### Consequence of `background: var(--admin-color-bg)` when the variable is absent

`var()` **without a fallback** is invalid at computed-value time when the custom property is not defined. For a shorthand
such as `background`, the declaration becomes `unset`, so every background longhand returns to its initial value —
**transparent**. It does *not* fall back to the earlier `background: #fafafa` declaration.

Measured with the fixture (row 4; the same `#fafafa` declaration followed by the MR declaration):

| Theme situation | Computed `background-color` | Rendered pixel (normal-light) | Rendered pixel (normal-dark) |
|---|---|---|---|
| Pinned core, `#fafafa` | `rgb(250, 250, 250)` | `[250,250,250]` | `[250,250,250]` |
| MR declaration, variable **undefined** (not Default Admin) | `rgba(0, 0, 0, 0)` | `[255,255,255]` (page) | `[18,18,18]` (page) |
| MR declaration, variable **defined** (Default Admin chain) | `lch(98.3275 2.7667 288.155)` (light) / `rgb(27, 27, 29)` (dark) | `[250,250,255]` | `[27,27,29]` |

So on a stock Default Admin install the change works as intended (and in dark mode replaces a light `#fafafa` tray with a
dark surface). In a theme that does not define it, the active-buttons tray loses its fill (only the `#c4c4c4` border remains). In
forced-colours mode the fill is forced to `Canvas` in every case, so this particular issue is neutral there.
`.ckeditor5-toolbar-tray` previously had no background declaration, so adding the same declaration there is a no-op when
the variable is undefined and — in Default Admin — equals the `body` background anyway.

## 3. What `filter: invert(1)` does in forced-colours mode (measured)

### Method

`reports/issues/3534229/compat-3637246/index.html` copies the relevant pinned-core and MR declarations into a standalone
page (no Drupal CSS loaded). Five Chromium contexts were measured: `normal-light`, `normal-dark`, `forced-light`
(`colorScheme: light`, `forcedColors: active`), `forced-dark` (`colorScheme: dark`, `forcedColors: active`), and
`forced-light-dark-mode` (forced-light palette while Default Admin's “always dark” setting is simulated by adding
`html.dark-mode`). The `.dark-mode` class is added the way Default Admin's `init.js` adds it (`auto` + dark OS scheme, or
explicit). `measure.mjs` screenshots each box, decodes the PNG in a helper page with `canvas.getImageData`, counts colours,
and computes WCAG contrast between the dominant backdrop colour and the icon's solid colour. A 1% minimum solid-colour
share is required so anti-aliased edge pixels are not mistaken for a visible icon (invert can leave a few grey fringe
pixels when the icon and its surface invert to the same colour).

Probes: **(a)** core black SVG background-image, no invert; **(b)** same + `filter: invert(1)`; **(c)** proposed
#3534229 mask (`background-color: CanvasText` + `mask-image: <icon>`), no invert; **(d)** same + `filter: invert(1)`;
**(e)** same as (d) plus a forced-colours `filter: none` reset (positive control).

### Results

Contrast is icon-vs-backdrop, WCAG ratio; “surface inverted” means the element's dominant backdrop is the **inverse** of
the page's Canvas.

| Context | (a) bg-image | (b) bg-image + invert | (c) mask, no invert | (d) mask + invert | (e) mask + invert + reset |
|---|---|---|---|---|---|
| normal-light | 18.1:1 visible | 18.88:1 visible | 18.1:1 visible | 18.88:1 visible | 18.88:1 visible |
| normal-dark (`.dark-mode`) | 18.1:1 visible (light `#eee` button) | 18.88:1 visible (white icon on inverted `#111` button) | 18.1:1 visible | 18.88:1 visible | 18.88:1 visible |
| **forced-light** | **21:1 visible** | **21:1 visible, surface inverted** (dominant `rgb(0,0,0)` = inverse of Canvas) | **21:1 visible** | **1:1 NOT visible** | **21:1 visible** |
| **forced-dark** | **1:1 NOT visible** (the #3534229 bug) | **1:1 NOT visible, surface inverted** (`rgb(255,255,255)`; icon merges with its own inverted surface) | **21:1 visible** | **1:1 NOT visible** | **21:1 visible** |
| **forced-light + `.dark-mode`** | 21:1 visible | 21:1 visible, surface inverted | 21:1 visible | **1:1 NOT visible** | **21:1 visible** |

Key readings:

- **Does invert make the icon visible?** Only in forced-light, and only by inverting the user's Canvas on that element
  (`(b)` becomes a black square with a white icon on a white page). In forced-dark, invert inverts both the forced
  Canvas background and the black icon to white — the icon is still 1:1, so it is still invisible. Invert does **not** fix
  #3534229.
- **What happens to the system colours of the surface?** Forced colours maps the author `background-color` of the legacy
  button (`#eee`) to Canvas (and keeps an author-specified system colour such as `CanvasText`). `filter` — which forced
  colours does **not** reset (computed `filter: invert(1)` was measured in the forced contexts) — is applied afterwards.
  The legacy button's surface is therefore `invert(Canvas)`, not Canvas; the masked icon is painted as `invert(CanvasText)`.
- **Mask + invert:** `(c)` paints the icon with the user's `CanvasText` and is visible in both forced palettes. Adding the
  MR's invert `(d)` inverts that system colour: black↔white, yellow↔blue, etc. In both forced-dark and
  forced-light-with-dark-mode the masked icon becomes 1:1 against its backdrop. In forced-light it becomes white on white.
- **The reset works:** `(e)` adds `filter: none` inside `@media (forced-colors: active)` with a selector at least as
  specific as `.dark-mode .ckeditor5-toolbar-button`; the mask is visible again at 21:1 in all forced contexts.

### The user's palette is destroyed, not just “inverted”

Chromium's forced-dark palette maps `LinkText` to **yellow** `rgb(255,255,0)` and Canvas to `rgb(0,0,0)`; forced-light maps
`LinkText` to `rgb(0,0,159)`. A masked icon painted `LinkText` measures:

| Forced context | Mask painted LinkText | Same + `filter: invert(1)` |
|---|---|---|
| forced-dark | `rgb(255,255,0)` on `rgb(0,0,0)` — **19.56:1** | `rgb(0,0,255)` on `rgb(0,0,0)` — **2.44:1** (fails 3:1; not a system colour) |
| forced-light | `rgb(0,0,159)` on `rgb(255,255,255)` — **13.99:1** | `rgb(255,255,96)` on `rgb(255,255,255)` — **1.06:1** |

Yellow-on-black becomes blue-on-black (2.44:1). That is the concrete harm beyond aesthetics: a palette colour the user
chose becomes a different, lower-contrast colour. (The mask correction itself paints `CanvasText`, white/black in these
palettes; the yellow probe shows the general effect of inverting system colours, using the browser's own forced palette.)

### Screenshots (fixture, 1280×1000, Chromium)

- [forced-dark](compat-3637246-forced-dark.png) — (a) invisible, (b) white inverted square with no distinguishable icon,
  (c) white mask icon visible, (d) invisible, (e) white mask icon visible again; palette probes yellow vs blue.
- [forced-light](compat-3637246-forced-light.png) — (a) black icon, (b) inverted black surface/white icon, (c) black mask
  icon, (d) invisible (white on white), (e) visible.
- [forced-light-dark-mode](compat-3637246-forced-light-dark-mode.png) — the Default Admin “always dark” + light forced
  palette combination; (d) collapses to 1:1.
- [normal-dark](compat-3637246-normal-dark.png) — the MR's intended normal-dark result: white icon on the inverted dark
  button; row 4 shows the light `#fafafa` tray (current core) vs `rgb(27,27,29)` (variable defined) vs transparent
  (variable undefined).
- [normal-light](compat-3637246-normal-light.png) — controls; no forced-colours rules apply.

## 4. Can the two changes coexist?

**Textually yes; semantically not safely as written.**

- The two patches touch different declarations and apply cleanly together (no textual conflict). The combined state is
  reproducible — the fixture does exactly that.
- But under `forced-colors` + Default Admin dark mode, `filter: invert(1)` remains in effect (forced colours does not reset
  `filter`), and it inverts the mask's `CanvasText` fill. The result is the original barrier again: **1:1**, in both
  forced-light-with-dark-mode and forced-dark (measured (d)).
- So the combination is only correct if #3534229's forced-colours block **explicitly neutralises the filter** (measured
  (e): `filter: none` with ≥ the MR's specificity restores 21:1). With that reset the two changes coexist; without it they
  do not.
- Each change is independently reproducible: #3637246 alone fixes the normal dark-mode icon/button (white icon on dark
  button) but leaves forced colours broken; #3534229 alone fixes forced colours but is defeated by the MR's filter when
  both are present.

### What the #3534229 patch should avoid

1. **No `filter`** (`invert`, `brightness`, `contrast`, `grayscale`) in forced-colours code. It is not overridden by
   forced colours and it inverts/desaturates the user's system colours.
2. **No `.dark-mode` / `prefers-color-scheme` dependency.** Forced colours is its own signal and already covers light and
   dark palettes; `.dark-mode` is Default-Admin-only and adds a second, fragile condition.
3. **No hard-coded colours and no black-SVG `background-image`** for the icons in forced-colours mode. Use
   `mask-image: url(<icon.svg>)` with `background-color: CanvasText` (or `ButtonText`), which the UA keeps as the user's
   system colour. The `background-color: #eee` variant was measured invisible in both forced palettes because forced
   colours overrides it to Canvas (the pre-existing probe reached the same result).
4. **Do not rely on theme variables** (`--admin-color-bg`, `--gin-bg-layer3`, …) for forced-colours colours. System colour
   keywords are the only palette-safe choice.
5. **Include the `filter` reset.** A bare `.ckeditor5-toolbar-button { filter: none; }` inside the forced block is weaker
   (0,1,0) than `.dark-mode .ckeditor5-toolbar-button` (0,2,0) and loses regardless of source order. Match or exceed the
   specificity (e.g. `.dark-mode .ckeditor5-toolbar-button { filter: none; }` placed after the invert rule, or the
   higher-specificity selector used in fixture probe (e)) or use `!important`, and add a regression check with
   `.dark-mode` present.
6. Keep all of this inside `@media (forced-colors: active)` so normal and Default Admin dark appearance are untouched.

### What to recommend to the !17909 author (without changing their MR)

1. **Use a fallback:** `background: var(--admin-color-bg, #fafafa);` (or the `light-dark()` + hard-coded colours the author
   themselves proposes in the issue comment) so themes that do not define the token keep the previous fill instead of
   losing the declaration. The variable is defined only by `default_admin`; module CSS loads in every theme.
2. **Note the selector is Default-Admin-specific.** `.dark-mode` is set only by `core/themes/default_admin`’s JS. Gin —
   where this fix started — uses `.gin--dark-mode` (Gin MR !656), and `stark`/`starterkit_theme` have no dark mode. So the
   core module rule silently does nothing outside Default Admin. If the intent is Default Admin only, the rule could live
   in that theme; if the intent is all admin themes, the invert needs a theme-neutral approach.
3. **`filter: invert(1)` is not forced-colours-safe.** It inverts focus outlines, borders and system colours on the
   element (measured palette destruction), and it collides with the #3534229 mask correction. Consider wrapping it in
   `@media (forced-colors: none)`, or at minimum accept that the #3534229 forced-colours block must reset it. This is a
   coordination note, not a request to change the MR here.
4. The author already identifies the root limitation (SVG `background-image` cannot take a fill colour) and the
   theme-variable problem in their 2026-11-24 comment; an inline SVG/`currentColor` or mask-based icon would remove both
   the invert and the theme coupling in the longer term.

## Not verified

- **No Drupal site was run** (DDEV was explicitly out of scope). The fixture copies the relevant declarations; it does not
  exercise CSS aggregation/load order, Default Admin's actual JS/settings, CKEditor's generated markup, the real
  `/admin/config/content/formats/manage/full_html` page, or module/theme library ordering.
- **Chromium only.** Firefox crashes on this machine (per the lab's existing probe); Safari and Edge were not tested.
  Chromium's forced-colours emulation only provides its built-in light/dark palettes — a **custom Windows high-contrast
  palette** was not tested (the yellow-on-black example uses Chromium's own forced-dark `LinkText`, not a user's custom
  palette).
- **No manual or assistive-technology review.** No person reviewed the screenshots; no keyboard-only, VO/NVDA, or
  disabled-user evaluation was done. The evidence is automated pixel measurement only.
- **Focus/hover states were not measured under invert.** The MR's filter also inverts the `:focus`/`:hover` background
  (`#e6e6e6`) and any focus outline on the same element; that was not measured here.
- **Other themes were not run.** The statements that `--admin-color-bg` and `.dark-mode` are absent from core's
  `stark`/`starterkit_theme` (core grep above) and from Gin (Gin MR !656 / `gin_toolbar.module`, fetched from
  git.drupalcode.org) are code/search-level, not measured in a live theme.
- **MR review threads were not read.** The cached snapshot records an HTTP 401 from the GitLab discussions API, so only
  the issue summary/comments and the exact diff were read; the MR was not cloned or checked out and review threads were
  not reviewed.
- **The patched bytes were not applied to the core checkout.** The base blob hash matches the diff header; the post-patch
  blob hash `991972ac12f9274f127ede6089acb097e3d12dc7` from the diff header was not independently recomputed (the MR and
  the core checkout were deliberately left untouched).
- The fixture is a **static reproduction**: the `light-dark()`/`color-mix()` chain was copied from Default Admin and
  rendered values are Chromium's, not a live Drupal page's. The `#3534229` “fix” is the POC shape from the issue comment,
  not a reviewed patch; its final selector structure may differ.

## Reproduce

```bash
node reports/issues/3534229/compat-3637246/measure.mjs
```

This regenerates `COMPATIBILITY-3637246.json` and the five `compat-3637246-*.png` screenshots next to this file.
To inspect a single context interactively, open `reports/issues/3534229/compat-3637246/index.html` in Chromium DevTools →
Rendering → “Emulate forced-colors: active” (and “prefers-color-scheme: dark” for the dark palette). Add `?darkMode=force`
to simulate a forced-on dark mode, `?darkMode=off` to force light.

## Sources

- Pinned core `8a7df6cc3e69b6b5d427cb25ce8f66dda8393c29`:
  `core/themes/default_admin/css/base/elements.pcss.css` (lines 16, 24, 261–263),
  `core/themes/default_admin/css/_variables/variables-color-semantic.pcss.css` (lines 6–7, 49),
  `core/themes/default_admin/css/theme/accent.pcss.css` (lines 7, 19),
  `core/themes/default_admin/migration/js/init.js` (lines 34, 44–53),
  `core/themes/default_admin/src/Hook/ThemeHooks.php` (line 153),
  `core/profiles/standard/config/install/system.theme.yml` (lines 1–2),
  `core/modules/ckeditor5/css/toolbar.admin.css` (base blob `40b04dd9…`),
  `core/modules/ckeditor5/js/ckeditor5.admin.js` (button markup),
  `core/modules/ckeditor5/css/basic.admin.css` (icon `background-image`).
- #3637246 / MR !17909: https://www.drupal.org/project/drupal/issues/3637246 and
  https://git.drupalcode.org/project/drupal/-/merge_requests/17909 (head `5917a35e…`; diff read from
  `.lab-cache/sources/3637246/snapshot.json`).
- Gin origin (#3506329): https://git.drupalcode.org/project/gin/-/work_items/3506329 and
  https://git.drupalcode.org/project/gin/-/merge_requests/656.diff (`.gin--dark-mode`, `--gin-bg-layer3`);
  `gin_toolbar.module` `hook_preprocess_html()` adds `gin--dark-mode`.
- #3534229 mask proposal: https://www.drupal.org/project/drupal/issues/3534229 (kentr comment, 2026-07-24) and the
  existing lab probe `reports/issues/3534229/fixture/probe.mjs` / `probe-results.json`.
- WCAG 2.2 SC 1.4.11 Non-text Contrast (3:1) used as the visibility threshold; SC 1.4.3 thresholds are reported as
  4.5:1 where relevant.

Generated with the help of an LLM. DRAFT for a person to review; nothing was posted or pushed.
