<!-- DRAFT for a human to review and post. Nothing has been posted. Written 2026-10-19.
     Follows Drupal core's AGENTS.md rules for drupal.org prose: rewrite it in your own words before posting; at most 180 words;
     sentences of at most 25 words; no headers; no tool or model names; end with the disclosure line exactly as below.
     Checked with: node scripts/check-draft.mjs 3587661. Every sentence matches a result in EVIDENCE.md.
     Before posting: read the issue and MR !16335 again (the lab read only the owner's pasted copies), and read #3587214.
     The steps also belong in the issue summary's "Steps to reproduce"; removing the "Needs steps to reproduce" tag is your call.
     The paragraph "I changed the MR" is true only once you have applied proposals/3587661-on-mr-16335.patch to the
     MR branch 3587661-missing-labels-in and pushed it. If you keep the MR's aria-label, rewrite that paragraph and the next.
     Delete this comment block when you post. -->

Tested on 11.x (21e0dcba), whose affected files match main, in Default Admin and Claro with Chromium.

Steps to reproduce:

1. Standard install, as an administrator.
2. Add a File field to Article, with "Allowed number of values" set to 2 or Unlimited, and "Enable Display field" ticked.
3. Go to /node/add/article and upload a .txt file to that field.
4. Inspect the checkbox in the files table's "Display" column.

It is the node form. "Required" makes no difference, no contributed module is needed, and a single-value field is not affected.

Without the MR, the checkbox has no accessible name, and axe reports "label". `FileThemeHooks::preprocessFileWidgetMultiple()` unsets its `#title`.

With the MR, the name is "Include file in display" and axe passes.

I changed the MR to set `#title_display` to 'invisible' there instead, as the weight select in that table does. That keeps a real, visually hidden label.

The new test checks that label on the edit form and after a save error, without and with Inline Form Errors. It fails without the fix.

No screen reader or manual keyboard test yet.

Generated with the help of an LLM.
