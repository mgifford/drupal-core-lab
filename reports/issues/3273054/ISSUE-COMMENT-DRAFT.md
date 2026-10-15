<!-- DRAFT — for a human to review before posting. Nothing is posted automatically.
     Facts come from reports/issues/3273054/EVIDENCE.md and the run in
     reports/issues/3273054/playwright/2026-10-15T18-37-19-654Z-chromium-light-1280x900/.
     Check it with: node scripts/check-draft.mjs 3273054
     Core's AGENTS.md rules for drupal.org prose: at most 180 words, sentences of at most 25 words,
     plain facts, no headers, no restating the issue, disclosure line last. -->

Tested on `main` (`ad11ba71c0f0`, 2026-10-15) with the Default Admin theme in Chromium, on
`/admin/people/permissions`, filtered to the Filter section.

The invisible stop does not appear on `main`. The 12 text-format permission labels are still
`visually-hidden`, but none contains a link. A real-key tab walk from the Filter permissions field recorded 12
stops, 8 of them on text-format checkboxes. Every stop was a checkbox with a visible focus outline. No
`visually-hidden` label held a focusable element, and axe-core reported no violations.

The link was removed in #3619751 (commit `12b38bdace`, Dave Long), which ships in 12.0.0-alpha1. That change
rewrote the permission title to drop the anchor, to avoid rebuilding the router on every install.

The anchor is still present in `10.6.x` and in every `11.x` branch. This test did not measure those branches in
a browser, so it does not describe them.

Generated with the help of an LLM.
