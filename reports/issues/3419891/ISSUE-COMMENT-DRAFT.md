<!-- DRAFT — for a human to review before posting. Nothing is posted automatically.
     Facts come from reports/issues/3419891/EVIDENCE.md and the run in
     reports/issues/3419891/playwright/2026-10-15T21-21-23-304Z-chromium-light-1280x900/.
     Check it with: node scripts/check-draft.mjs 3419891
     Core's AGENTS.md rules for drupal.org prose: at most 180 words, sentences of at most 25 words,
     plain facts, no headers, no restating the issue, disclosure line last. -->

Tested on main (`47430c368b`, 2026-10-06) with the Default Admin theme in Chromium, on `/node/add/page` using the CKEditor5 image dialog.

The alternative text field is a single-line input on the baseline; typing a long string scrolls content horizontally out of view. With the patch from branch `3419891-increase-size-of`, the field becomes a textarea with `minRows=1, maxRows=6` that grows vertically as the user types. All content stays visible, no horizontal scroll occurs.

The patch changes 7 files: CSS for width 100%, JavaScript to use textarea with minRows/maxRows, and PHPUnit test updates.

Automated run on chromium/light/1280x900: Before field height 28px with horizontal scroll; After field height 74px (grows to fit), no horizontal scroll, rows=1.

Generated with the help of an LLM.
