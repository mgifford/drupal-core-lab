<!-- DRAFT for a human to review and post. Do not post automatically. Rewrite it in your own words, attach the two patches, replace the evidence links, then delete this block.
     Check it with: node scripts/check-draft.mjs reports/issues/3636143/ISSUE-COMMENT-DRAFT-toggle.md -->

MR 17738 maps the toggle border to the input-border token. In Chromium on core 92e5c3a30476, the border measured 1.81:1 before and 3.11:1 in light mode with the MR.

In dark mode it changed from 7.89:1 to 5.02:1.

The MR does not change hover or keyboard focus. Hover only recolors the chevron.

I tested an addition in the navigation module's admin-toolbar CSS. Hover and keyboard focus take an accent border, an inner ring and a light background. Focus adds an offset outline.

The button stays 36 by 36 pixels. The outline is not clipped, and Enter and Space still collapse and expand the sidebar.

Full patch and interdiff are attached. They apply to current main and the MR base.

Firefox, WebKit, 200% zoom, a person's keyboard pass and a screen reader were not tested.

Generated with the help of an LLM.
