<!-- DRAFT for a human to review and post. Do not post automatically.
     Every sentence matches a recorded result in EVIDENCE.md. Delete this comment block when you post.
     Check with: node scripts/check-draft.mjs 3636987 -->

Tested current main (8a7df6cc3e69) in Default Admin with Chromium forced-colours emulation, before and after the November 20 patch.

Before: in forced-colours dark, the two selects on /admin/content kept Drupal's SVG background. So did the 18 extra-small selects on /admin/structure/block. The native caret was also visible. Light forced colours, focus and disabled states already showed one caret.

After: all of those selects have `background-image: none` and `appearance: auto`. Padding-inline-end stayed 12px for normal and 23px for extra-small selects. Box sizes did not change. The 480px run showed the same counts and box sizes, and simulated RTL lost its two custom backgrounds. Outside forced colours the custom chevron is unchanged. Stylelint passed, and core's build:css reports the compiled CSS in sync.

Not tested: a real Windows High Contrast theme, Firefox, WebKit, a native RTL language, and a person's keyboard or screen-reader pass.

Generated with the help of an LLM.
