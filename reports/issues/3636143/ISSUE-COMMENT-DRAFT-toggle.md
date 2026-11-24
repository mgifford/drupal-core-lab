<!-- DRAFT for a human to review and post. Do not post automatically. Rewrite it in your own words, replace the evidence links, then delete this block.
     Reviews MR 17738 at head 8779866c (2026-11-24). Evidence: STATUS-2026-11-24.md, playwright/2026-11-24T22-2*.
     Check it with: node scripts/check-draft.mjs reports/issues/3636143/ISSUE-COMMENT-DRAFT-toggle.md -->

Tested MR 17738 at 8779866c in Chromium on core 92e5c3a30476, Standard install with Default Admin.

The toggle border measured 1.81:1 before and 3.11:1 after in light mode. In dark mode it measured 5.02:1 after.

Hover and keyboard focus now measured 7.51:1 in light mode and 11.02:1 in dark mode. The focus outline measured 5.13:1 and 5.94:1.

The button stays 36 by 36 pixels. Enter and Space still collapse and expand the sidebar, and the focus outline is not clipped.

In forced colors the border and outline measured 14.37:1 or higher. The axe scan found no new violations.

PHPCS, PHPStan and Stylelint pass, and the compiled CSS matches its source.

Before and after screenshots are attached. Firefox, WebKit, 200% zoom, a screen reader and a person's keyboard pass were not tested.

Generated with the help of an LLM.
