<!-- DRAFT for a human to review and post. Nothing has been posted. Written 2026-10-19.
     Follows Drupal core's AGENTS.md rules for drupal.org prose: rewrite it in your own words before posting; at most 180 words;
     sentences of at most 25 words; no headers; no tool or model names; end with the disclosure line exactly as below.
     Checked with: node scripts/check-draft.mjs 3587661. Every sentence matches a result in EVIDENCE.md.
     Before posting: read the issue and MR !16335 again (the lab read only the owner's pasted copies), and read #3587214.
     The steps also belong in the issue summary's "Steps to reproduce"; removing the "Needs steps to reproduce" tag is your call.
     Attach or push proposals/3587661-visually-hidden-label.patch and proposals/3587661-test.patch only if you choose that approach.
     Delete this comment block when you post. -->

Tested on 11.x (21e0dcba), whose affected files match main, in Default Admin and Claro with Chromium.

Steps to reproduce:

1. Standard install, logged in as an administrator.
2. Add a File field to Article, with "Allowed number of values" set to 2 or Unlimited, and "Enable Display field" ticked.
3. Go to /node/add/article and upload a .txt file to that field.
4. Inspect the checkbox in the "Display" column of the files table.

It is the node form. "Required" makes no difference, no contributed module is needed, and a single-value field is not affected.

Without the MR, the checkbox has no label and no accessible name, and axe reports "label". `FileThemeHooks::preprocessFileWidgetMultiple()` unsets its `#title`.

With the MR, the name is "Include file in display" and axe passes.

Setting `#title_display` to 'invisible' there, instead of unsetting `#title`, gives the same name with a visually hidden label. The weight select in that table already does this.

I added three assertions to `FileFieldDisplayTest::testDefaultFileFieldDisplay()`. They fail without that change and pass with it.

No screen reader or manual keyboard test yet.

Generated with the help of an LLM.
