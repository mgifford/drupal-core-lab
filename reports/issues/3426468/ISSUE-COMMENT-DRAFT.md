<!-- DRAFT for a human to review and post. Do not post automatically.
     Every sentence matches a recorded result in EVIDENCE.md. Delete this comment block when posting. -->

Tested on main at a48087f26ec with the Default Admin theme in Chromium, Firefox and WebKit. The patch adds a
4 px inline-start bar to the current top-level item and to a top-level item whose submenu contains the current
page.

Before the patch, the active top-level state was shown by text and background colour only; the same item now has a
bar. The bar measures 6.69:1 in light mode, 10.21:1 in dark mode and 21:1 in forced colours. It stays visible on
hover, with keyboard focus, in the collapsed sidebar, at 480 px and in right-to-left layout.

The current link was 4.53:1 against its background before and 5.82:1 after; the earlier 1.5:1 figure compared active
with inactive colours, not text contrast.

The submenu ancestor still has no marker. The approved design uses a dot; the patch uses a bar. The Shortcuts case
cannot be built because that module is no longer in core. Generated CSS and core checks pass.

Generated with the help of an LLM.
