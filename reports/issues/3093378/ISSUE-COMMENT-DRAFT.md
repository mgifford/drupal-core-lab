<!-- DRAFT for a human to review and post to https://www.drupal.org/project/toolbar/issues/3093378. Do not post automatically. -->
**AI-assisted:** yes. Tool: opencode (big-pickle). External code copied: no.

### What I tested
MR !6 (`3093378-use-aria-disclosure`, tip `d1e97b5`) against the contrib `toolbar` `2.x` branch (`871ce78`) on current
Drupal core `main` (`4f9558d85e7db3f2fc0e4a5cde195a1834cb6206`, 2026-10-12), in a plain Standard install with the **Default
Admin** theme. Before is `2.x`, After is `2.x` plus the MR. The admin `navigation` module from core was uninstalled so the
contrib Toolbar renders (it yields to Navigation otherwise). Scripted headless Chromium, viewport 480x900 (vertical toolbar).

### Result — reproduced and fixed, no visual change
| | Before | After |
|---|---|---|
| Disclosure button carries `aria-expanded` | no | yes (`false`, then `true` after a click) |
| Accessible name (Playwright `ariaSnapshot`) | `button "Extend Structure"` → flips to `"Collapse Structure"` | `button "Structure menu"` (stable) |
| Old `<span class="action">` present | yes | no |
| Pixel diff of the same page state | — | **0 of 432000 pixels** |

Markup seen (collapsed), matching the summary:

    Before: <button class="toolbar-icon toolbar-handle"><span class="action">Extend</span> <span class="label">Structure</span></button>
    After:  <button aria-expanded="false" class="toolbar-icon toolbar-handle"><span class="label visually-hidden">Structure menu</span></button>

The name no longer encodes the state, the state is exposed with `aria-expanded`, and the change is visually identical
(the `text-indent: -9999px` removal is safe now the label is `.visually-hidden`). Number of buttons, axe violations
(2 `color-contrast`, already present on both sides) and JavaScript errors are unchanged.

Repeated on pinned core `4f9558d8` and on current `main`, in Chromium (light, dark, forced colours) and WebKit (light,
dark): every environment reproduced the defect before and fixed it after, with the same result. Firefox could not be
launched by Playwright on this machine and is not claimed.

### What a screen reader announces (Guidepup virtual screen reader, synthetic)
Reading the "Structure" button from the DOM, closed then after a real click:

| | Closed | Open |
|---|---|---|
| Before | `button, Extend Structure` | `button, Collapse Structure` |
| After | `button, Structure menu, not expanded` | `button, Structure menu, expanded` |

Before, the name changes with the state and the state is never announced; After, the name is stable and the state is
announced. This is a virtual screen reader (no operating-system AT); a person should still confirm with VoiceOver/NVDA.

### Steps to reproduce
Open the home page, open the **Manage** tray, and inspect the disclosure button next to **Structure** at a viewport under
1024px (vertical toolbar); expand it and re-inspect. Compare the button's markup and accessibility tree, not the pixels.

### Code review notes (nothing blocking)
- `initItems()` runs before `openActiveItem()`, so auto-opening the active trail also sets `aria-expanded` — no
  "open-but-collapsed" mismatch.
- No `.action` / `handleOpen` / `handleClose` reference remains anywhere in the module (no dead code).
- `@label` still goes through `Drupal.t()`, so the name is HTML-escaped as before.
- Optional: the APG disclosure pattern recommends `aria-controls` linking the button to the submenu it toggles.

### Not verified
Keyboard-only and real screen-reader passes (the Guidepup run is synthetic), the MR's Nightwatch test (no `ddev
nightwatch` in this toolchain), Firefox (Playwright's Firefox fails to launch on this machine), and any step by a person.
Automated and virtual-AT evidence only; not reviewed by a person.
