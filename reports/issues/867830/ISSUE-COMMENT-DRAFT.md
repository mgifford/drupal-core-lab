<!-- DRAFT for a human to review and post. Do not post automatically.
     Follows Drupal core's AGENTS.md rules for drupal.org prose: rewrite it in your own words before posting; at most 180 words;
     sentences of at most 25 words; plain facts; no headers; no tool or model names; end with the disclosure line.
     Check it with: node scripts/check-draft.mjs 867830. Every sentence matches a row in EVIDENCE.md. Delete this block when you post. -->

Tested the #306 branch (867830-unpublished-style-of, 0fcbb553) on its base commit 422099995ecf, with Olivero, Claro and Stark.

As pushed, every page fails: `Undefined constant "Drupal\Core\Theme\MARK_NEW"` in ThemeCommonElements.php line 136. The branch removes the MARK_* constants but not that default.

With that default set to NULL locally, Olivero output is unchanged. The unpublished node has only the #fff4f4 background, measured 1.01:1 against the page. Published comments gain an empty `comment--` class.

In Claro, articles and comments get an unstyled "unpublished" span after the submitted line. Basic pages get nothing, because the marker sits inside `display_submitted`. The `node--unpublished` class and pink background are removed. The `classy/marker` library does not exist.

In Stark, only comments get the word, as a bare text node. No output has the hidden "This node is" context from the summary.

The branch no longer applies to main: Claro, Olivero, Stable 9 and History have left core.

Not tested: a real screen reader, the branch's PHPUnit changes.

Generated with the help of an LLM.
