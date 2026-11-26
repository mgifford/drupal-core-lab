> **Historical record.** This preflight was written before the environments were built. The measured results, the v2 revision and the final recommendation are in [SUMMARY.md](SUMMARY.md) and [EVIDENCE.md](EVIDENCE.md).

# Preflight for #3426468 (2026-11-25)

Issue: https://www.drupal.org/project/drupal/issues/3426468
Existing MR: https://git.drupalcode.org/project/drupal/-/merge_requests/8446
Core under test: `0387fb948f786bc344a5cc54aa0d98b8f552e378` (2026-11-25)
Registered variant: `3426468-latest`
Lab patch: `branches/3426468-active-indicator.patch`, sha256 `887f9d9fdc55c45849ccaff8e58324569f32641229d06e0c2cd41e0968172865`

Everything below is from the issue page, the drupal.org API, the GitLab pages, and the core source at the pinned
commit. No environment was built for this issue and no browser measurement has been made yet; those are marked as
pending in [EVIDENCE.md](EVIDENCE.md).

## Assignment and competing work

| Check | Result |
|---|---|
| Assigned | **Unassigned** (issue page, 2026-11-25). The last assignment change was dishakatariya assigning and unassigning themselves on 2024-07-03 (comments #16–#17). |
| Last comment | #32, mortona2k, 2026-11-23: "Linking to other active style issues." |
| Open MRs | !8446 only. Opened 2024-06-18 by Gaurav; source branch `3426468-make-the-active`; head `da537706`; last updated 2026-02-05. |
| New MR since #28 | None. The MR search for `3426468` returns no second merge request. |
| Issue fork branches | The fork's only active branch is `11.x` (default), at `30fe89a1` "Update to Yarn 4.18.0" (2026-09-05). The old issue branch is not listed among active branches. |
| bluegeek9 commits (#30–#31, 2026-09-06) | First commit and hiding the `11.x` branch; no solution branch or MR was opened. |
| kentr's plan (#27–#28, 2026-02) | Said they were rebasing and would open a new MR because the old MR had conflicts and might not be the right approach. No new MR exists. |

**Decision: proceed.** No one is assigned, there is no competing implementation, and the only MR is stale
(2026-02-05). If someone is assigned while this work is in progress, stop and re-check.

## Related issues

| Issue | Title | Status | Relevance |
|---|---|---|---|
| [#3391723](https://www.drupal.org/project/drupal/issues/3391723) | [PLAN] Accessibility review for new Navigation bar | Active (parent) | The umbrella for Navigation accessibility work. |
| [#3426606](https://www.drupal.org/project/navigation/issues/3426606) | [META] Implement the final design system | Closed (fixed) | The design system this issue was postponed for. |
| [#3576830](https://www.drupal.org/project/drupal/issues/3576830) | Grandchild menu items lack focus indicator | Active | Overlaps the focus-indicator measurements; not the same fix. |
| [#3438046](https://www.drupal.org/project/drupal/issues/3438046) | Second level should be marked as active and expanded when level three menu item is active | Needs work | The ancestor/expanded behaviour this patch's top-level `:has()` rule touches. |

## What the issue decided

- **Comment #28 (kentr, 2026-02-06)** is the design basis. The Figma design specifies a **dark dot to the left of
  the active item**. The dot already exists for active "grandchild" items, but not for items at higher levels.
  kentr proposed `--toolbar-button-current-color: var(--admin-toolbar-color-gray-990)` for the active text and icon,
  and said the active background already matches the design (`#f3f5f9` / `--admin-toolbar-color-gray-050`). They
  questioned whether the hover colours need to change to make the active item stand out.
- **Comment #29 (mgifford, 2026-02-10)**: in a meeting with Mike Herchel, Ralf Koller and Kat Shaw it was decided
  that this is a **best practice to implement, not currently a WCAG 2.2 AA failure**, and there was support for
  kentr's ideas.
- The original MR's numbers ("1.5:1", "1.3:1", "1.1:1") are **state-to-state deltas** between active and inactive
  colours, not the contrast of text against its own background. The patch should not be described as fixing an
  SC 1.4.3 failure without a separate measurement.

## Approved design versus the Lab patch

The design image from comment #7 and the annotated image from comment #28 are linked here; they are not copied into
the repository. The sources are:

- https://www.drupal.org/files/issues/2024-05-07/active.png — the approved states. Active rows show a dark **dot**
  at the inline start: inside the item for text rows, outside the icon button when the sidebar is collapsed.
- https://www.drupal.org/files/issues/2026-02-06/issue-3426468-28-annotated-design-image.png — kentr's arrows
  pointing at the same dot, including the grandchild and great-grandchild rows.
- https://www.drupal.org/files/issues/2024-08-05/Nav_after.png — the old MR's "After"; colour changes only.

The Lab patch instead:

1. extends the existing **forced-colors vertical bar** (`border-inline-start: 4px` at
   `inset-inline-end: calc(100% + 5px)`) into normal display modes, for `.toolbar-button.current` and for the
   top-level item that contains an active descendant (`:has(+ .toolbar-popover__wrapper .is-active)`), and
2. changes `--toolbar-button-current-color` from `blue-700` to `gray-990`.

So the colour change is the one comment #28 asked for; the bar is **not** the design's dot. It is a smaller change
than adding dots at every level, and it matches the indicator the component already uses in forced-colors mode, but
it is a visible design deviation that a maintainer or designer would have to accept.

## Current core implementation at `0387fb9`

| Element | Current state |
|---|---|
| Top-level current (`.toolbar-button.current`) | `blue-700` text, `gray-050` background, no non-colour marker. |
| Top-level ancestor (`:has(+ .toolbar-popover__wrapper .is-active)`) | `gray-950` text, `gray-050` background, no non-colour marker. |
| Level-2 current link in a popover | It is a `.toolbar-button`, so it gets the same current styling as a top-level item. |
| Submenu current (`.toolbar-menu__link.current`) | `gray-990` text plus an 8×8 px dot (`::after`) at `inset-inline-start: -4px`. |
| Submenu ancestor (`.toolbar-menu__link:has(+ .toolbar-menu .is-active)`) | `gray-950` text, no marker. |
| Expanded control | `aria-expanded="true"`, chevron rotated, submenu displayed; item background `gray-050`. |
| Forced colours | Current and top-level ancestor get a 4 px `canvasText` bar; that is the rule the patch moves out of the media query. |
| `aria-current` | `ActiveLinkResponseFilter` adds `aria-current="page"` on an exact path/language/query match; the Navigation JS adds `current` and `is-active` on `document.URL === link.href`. Ancestors get neither. |

## Source-review findings to verify in the browser

1. **The bar is not the approved dot.** Whether that is acceptable is a design decision, not an accessibility one;
   the bar does provide a non-colour distinction.
2. **Submenu ancestors are not covered.** The patch adds a bar to the top-level ancestor, but a level-2/3 ancestor
   whose child is current (for example "Display modes" when "Form modes" is current) still relies on text colour and
   the open/expanded state. The evaluator records this as an observation, not automatically as a failure, because the
   expanded submenu is itself a visible state.
3. **`::before` is already the icon fallback.** `.toolbar-button--icon-*:not(:has(.toolbar-button__icon))::before`
   draws `attr(data-icon-text)`. The patch uses the same pseudo-element on `.current`. The selector collision is only
   possible when a button has an icon class but no icon child; the evaluator records the computed `::before` content
   on Before and After so this is not left to inference.
4. **The bar sits outside the button.** It is 5–9 px outside the inline-start edge, in the 16 px content padding.
   `.admin-toolbar__content` has `overflow-x: hidden` at desktop, so clipping is plausible at some widths; the
   evaluator measures the bar rectangle against every overflow ancestor and the viewport.
5. **Shortcuts case (c) is not reproducible on this core.** `core/modules/shortcut` does not exist at `0387fb9`
   (the module was removed from core), and the `navigation_shortcuts` block is gone. A Standard install therefore has
   no shortcuts group, so the issue's "top-level item also added to the shortcuts" case cannot be exercised without
   installing the contrib port (https://www.drupal.org/project/shortcut, "Shortcut (from core)"). The evaluator
   records the module's absence instead of pretending it tested the case.
   This is called out in [REPRODUCE.md](REPRODUCE.md) and [EVIDENCE.md](EVIDENCE.md).

## Not done yet

- No `baseline-3426468-latest` or `issue-3426468-latest` environment exists; provisioning was deliberately left until
  the shared `envs/.setup.lock` is free and the evaluator is ready.
- No browser run, contrast measurement, screenshot, CSS-build check, Stylelint or Core lint run.
- No manual keyboard pass by a person, no real screen reader, no real OS forced-colours mode.
