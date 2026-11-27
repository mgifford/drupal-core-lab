<!-- DRAFT for a human to review and post. Do not post automatically.
     Replies to kentr's mask experiment in #7 (2026-07-24) and follows Drupal core's AGENTS.md rules for drupal.org prose
     (at most 180 words, sentences of at most 25 words, plain facts, no headers, no tool or model names).
     Every sentence must match a recorded result in EVIDENCE.md. Check with: node scripts/check-draft.mjs 3534229 -->

Tested the mask idea from #7 on main (`8a7df6cc3e69`) in Default Admin, Chromium 159, with emulated forced colors.

Before a change, the icons stay black on the forced Canvas. In the dark palette Canvas is black, so 31 of 35 rendered controls in the three lists show no icon. The light palette keeps black icons on white, so the bug is palette-specific.

The mask works, but masking the whole control also clips Alignment's caret, and removing every background image would change contributed plugin icons too. In the proposed patch each icon URL is defined once as `--ckeditor5-toolbar-icon`; a shared forced-colors block masks only items that define it, in CanvasText. Heading, Style and Language keep their text; Alignment keeps its caret; un-opted plugin icons are unchanged. A forced-colors `filter: none` is included so a dark-mode `invert(1)` (#3637246) cannot invert the palette again.

All 35 rendered controls measure visible at 21:1 in both forced palettes; normal modes are pixel-identical. Windows contrast themes, Firefox and a human keyboard pass are not tested.

Generated with the help of an LLM.
