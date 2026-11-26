# #3426468: Make the active menu item visually stand out more

Issue: [#3426468](https://www.drupal.org/project/drupal/issues/3426468)
Existing MR: [!8446](https://git.drupalcode.org/project/drupal/-/merge_requests/8446) (head `da537706`, last updated 2026-02-05)
Variant: `3426468-latest`
Core measured: `a48087f26ec0c76d6786592f6ca755be4068fb0d` (2026-11-26), Drupal 12.0-dev, PHP 8.5.7, Standard, Default Admin
Proposal: v1 + v2. v1 sha256 `887f9d9f…`; v2 (interdiff) sha256 `5922b7c4…`; full one-patch equivalent sha256 `dfcb075b…`.

**Status: DRAFT** — measured in the Lab on 2026-11-26; a person has not yet reviewed the rendering.

## Result

The Lab patch needed **one refinement**, and v2 is now a submission-ready proposal for the accessibility question:

- **v1 was functionally right.** It added a 4 px inline-start bar to the current top-level item and to a top-level
  ancestor containing the current page. That removes the colour-only dependence at those levels.
- **v1 was not submission-ready.** CSpell failed on “colour” (core uses US spelling), and its active-colour change
  had no effect: Default Admin sets `--toolbar-button-current-color` after the module, so the rendered text stayed
  the same blue (`rgb(1, 94, 254)`) before and after.
- **v2** fixes both. The theme now sets the variable to `var(--admin-toolbar-color-gray-990)`, which renders as
  `rgb(25, 80, 212)` (the theme's active blue, the same token the submenu current already uses); the bar and text
  pass contrast, and all Core checks pass. The active/inactive text delta falls to 2.32, so the bar is the durable
  state cue.

Nine v2 runs pass: Chromium light, dark, forced colours (light and dark), collapsed sidebar, 480 px, emulated RTL,
Firefox and WebKit.

| Measurement (light, 1280 px) | Before | After v2 |
|---|---|---|
| Current top-level indicator | none | 4×40 px bar, **6.69:1** |
| Top-level ancestor indicator | none | 4×40 px bar, **4.53:1** |
| Current text against own background | 4.53:1 | **5.82:1** |
| Active-vs-inactive text delta (state signal, not 1.4.3) | 2.99 | 2.32 (the bar is the durable cue) |
| Clipped / layout shift / axe violations | — | none / none / 0 |

Dark: bar 10.21:1, text 7.95:1. Forced colours: bar 21:1, text 13.99:1 (light) and 19.56:1 (dark). The bar survives
hover, keyboard focus, the collapsed sidebar, 480 px and RTL (mirrored to the right); it does not intersect the
focus ring.

## What is still not aligned with the design

1. **The bar is not the approved dot.** Comment #28 and `active.png` specify a dark dot at the inline start; the
   patch uses the forced-colours bar at the sidebar edge. Both are non-colour indicators and both pass 1.4.1/1.4.11,
   but the shape is a design deviation. This needs a maintainer/designer decision; the Lab did not silently redesign
   it.
2. **The submenu ancestor has no marker.** “Display modes”, the open trigger containing “Form modes”, still relies on
   colour and the open submenu. The top-level ancestor is covered.
3. **The active trail is closed on load** for `/admin/structure/display-modes/form` (related #3438046). The current
   submenu dot is only visible after the user opens Structure → Display modes. Not introduced here.
4. **The current top-level link has no `aria-current`** (the current submenu link does). This is the same Before and
   After; the patch is CSS-only. The evaluator confirms no ancestor is falsely marked.
5. **Case (c), shortcuts**, is not testable on this core: `core/modules/shortcut` and the `navigation_shortcuts`
   block are gone. A contrib port exists; installing it would change the fixture and was not done.

## Preflight

- **Unassigned** on 2026-11-25; the last assignment change was July 2024.
- !8446 is the **only** MR and has not been updated since 2026-02-05. The issue fork has no competing solution
  branch. kentr's February plan to open a new MR produced none.
- Related: parent #3391723, #3576830 (grandchild focus), #3438046 (second level active/expanded), #3426606 (design
  system, closed).

## Revision and provenance

- v1: [`branches/3426468-active-indicator.patch`](branches/3426468-active-indicator.patch), preserved byte for byte.
- v2 (interdiff): [`branches/3426468-active-indicator-v2.patch`](branches/3426468-active-indicator-v2.patch), four
  files (component `.pcss.css`/`.css` spelling; Default Admin theme `.pcss.css`/`.css` colour).
- Full proposal: the v1+v2 stack, or the one-patch equivalent
  [`css-build/2026-11-26-3426468-latest-followup-full.patch`](css-build/2026-11-26-3426468-latest-followup-full.patch).
- Core moved from `0387fb9…` (where v1 was verified) to `a48087f26ec0` during provisioning; v1 applied cleanly and
  the Navigation files are unchanged between the two commits.
- Patch quality: `css-build --check --stylelint` **PASS**; `scripts/lint.mjs` **PASS** (CSpell, PHPStan, Stylelint,
  build:css).

## Files

- [`EVIDENCE.md`](EVIDENCE.md) — measured matrix, state-by-state findings, WCAG mapping, limits.
- [`REPRODUCE.md`](REPRODUCE.md) — exact environments, patch stack, evaluator modes and commands.
- [`PREFLIGHT-2026-11-25.md`](PREFLIGHT-2026-11-25.md) — assignment/MR/design evidence.
- [`BRANCHES.md`](BRANCHES.md) — patch provenance, hashes and revision history.
- [`ISSUE-COMMENT-DRAFT.md`](ISSUE-COMMENT-DRAFT.md) — a human-postable draft, limited to recorded facts.
- `playwright/` — 9 v2 runs, each with `results.json`, `SUMMARY.md` and Before/After screenshots; the `README.md` in
  each folder pairs them. The superseded v1 runs were removed after the revision; v1's CSpell failure and inert
  colour are recorded in [BRANCHES.md](BRANCHES.md) and [EVIDENCE.md](EVIDENCE.md).
- `lint/`, `css-build/` — Core checks and the generated-CSS report.

No environment, baseline, issue status or Drupal.org content was changed outside this issue's scope. Nothing was
pushed or posted.
