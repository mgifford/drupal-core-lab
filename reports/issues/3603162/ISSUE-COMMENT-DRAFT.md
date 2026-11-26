I reviewed MR !16166 at fe4adb4f against main 0387fb94. The consolidation is sound; several consumers lost their icons. I have a local revision, not pushed.

It restores the autocomplete magnifier and media-library pencil, fixes dark disabled checkbox and select states, keeps status masks visible in forced colours, and replaces the sticky loader pseudo-element because the controls are inputs. The loader now covers edit-submit, mirrors for RTL and has a reduced-motion fallback. Tabledrag tree strokes use currentColor. Fifteen unused assets and twenty registry entries are removed. Forty-five SVGs were optimised where Chromium pixels stayed identical.

icons.css falls from 40,615 to 26,315 bytes. Dark disabled checkbox contrast rises from 2.85:1 to 5.85:1; light stays 3.78:1.

Static validation, a reference audit, compiled-CSS equivalence, 46 regression checks and 14 theme Unit/Kernel tests pass. Axe found no violations on permissions, status and node forms. Functional tests and native Windows High Contrast were not run.

Rewrite this in your own words before posting. Nothing has been pushed or submitted.

Generated with the help of an LLM.
