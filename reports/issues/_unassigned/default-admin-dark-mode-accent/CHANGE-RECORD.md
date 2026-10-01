# Default Admin — High-contrast mode and focus-ring contrast

## Problem

The default_admin "Increase contrast" mode previously forced `--admin-color-bg`
to `#fff`/`#000` and set text, icon, border, and focus to `rgb(0,0,0,0.8)` /
`rgb(255,255,255,0.8)`. The black/white backgrounds flattened the dark surface
hierarchy, the 0.8 alpha reduced contrast, and the dark variant relied on a
`.gin--dark-mode &` descendant that never matched the same element. Light-mode
HC text was also lighter than normal text, so it was invisible.

The focus ring was translucent `color-mix(in srgb, #007dfa 60%, transparent)` at
2.27:1 on white, below WCAG 1.4.11 (≥ 3:1).

## Fix

High-contrast mode now sits in a single `@media (forced-colors: none)` rule and
uses `light-dark()`. It preserves the dark surfaces (`#1b1b1d`, `#2a2a2d`,
`#3b3b3f`, `#47474c`) and a light/dark text ramp: loud `#000`/`#fff`, default
`#151619`/`#f2f2f4`, soft `#303238`/`#e8e8e8`. No `--admin-color-bg` override and
no `.gin--dark-mode &` descendant.

Focus rings are now solid `light-dark()` pairs reaching ≥ 3:1 in both modes
(gin `#003ecc`/`#99b8ff`, plus green/claro/orange presets). A separate
`--admin-color-accent-fg` token, computed with `oklch()`, replaces the old dark
`lch(l*20)` formula so accent-derived links, active states, and focus targets
stay readable and hue-preserved on dark surfaces.

Dark-mode accent fill is now `lch(l*0.45, c*0.9)`, keeping white labels visible.

High-contrast borders keep their semantic ladder instead of collapsing to one
black/white value. `--admin-color-border-loud` stays the strongest divider
(`#000`/`#fff`), default `--admin-color-border` is strong (`#333`/`#e0e0e0`),
`--admin-color-border-input` is strongest to identify controls (`#000`/`#fff`),
table separators stay subtle (`#707070`/`#8c8d92`), and soft hairlines remain
decorative (`#444`/`#888`). The surfaces are untouched, so the raised/nested/
sunken distinctions survive within high contrast.

Focus is treated as its own semantic state. `--admin-color-focus`
(`#003ecc`/`#99b8ff`) is a distinct blue, not black/white and not the ordinary
accent token. It is tested against canvas, raised, input, toolbar and
accent-filled surfaces. Where a single ring cannot differentiate — an
accent-filled primary button or checked box in light mode (a blue ring on the
blue fill is about 1.6:1) — the controls use a two-part indicator. A
`--admin-color-focus-gap` token draws a surface gap ring between the fill and
the focus ring, so the ring also reads on accent fills. In dark mode the gap is
effectively the fill color, so the focus ring rides directly on the fill, which
already passes.

Interactive states are resolved semantically instead of as "accent darker".
Link hover and active are separate states, distinct in light mode (accent-600
and accent-700) and both foreground-safe in dark mode. The darker accent steps
lose contrast on dark surfaces (accent-600 and accent-700 resolve to about
1.1:1 to 2.8:1). Link active no longer uses the accent-900 step; its dark
branch modifies the foreground-safe accent toward accent-900 with a 20%
color-mix, so active stays a distinct pressed state without losing contrast.

The red accent needs a preset-specific dark foreground override. Its shared
foreground is about 4.43:1 on the raised surface, under the 4.5:1 text
threshold, which also leaves no headroom for the active color-mix. A
`[data-gin-accent="red"]` rule raises the dark foreground to full lightness,
clearing 5:1.

Coverage: 197 contrast checks in the attached matrix; 14 PHPUnit tests, 888
assertions, pass. The JavaScript contrast test needs WebDriver and currently
runs in CI.

Generated with the help of an LLM.
