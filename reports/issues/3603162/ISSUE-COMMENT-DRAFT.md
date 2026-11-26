I reviewed MR !16166 at fe4adb4f against main 0387fb94. The consolidation is sound; several consumers lost their icons. The revision branch is pushed to the issue fork; the merge request is not open yet.

It restores the autocomplete magnifier and media-library pencil, fixes dark disabled checkbox and select states, keeps status masks visible in forced colours, and replaces the sticky-loader pseudo-element because the controls are inputs. The loader covers edit-submit, mirrors for RTL and has a reduced-motion fallback. Tabledrag strokes use currentColor. Fifteen unused assets and twenty registry entries are removed. Forty-five SVGs were optimised only where Chromium pixels stayed identical.

icons.css falls from 40,615 to 26,315 bytes. Dark disabled checkbox contrast rises from 2.85:1 to 5.85:1; light stays 3.78:1.

Static validation, 46 regression checks and 14 theme Unit/Kernel tests pass. Axe found no violations on three pages. Functional tests and native Windows High Contrast were not run.

Evidence: https://mgifford.github.io/svg-review/proposed/reports/revision-2026-11-25.html and https://github.com/mgifford/drupal-core-lab/blob/main/reports/issues/3603162/SUMMARY.md

Rewrite this in your own words before posting. No merge request or issue comment has been posted yet.

Generated with the help of an LLM.
