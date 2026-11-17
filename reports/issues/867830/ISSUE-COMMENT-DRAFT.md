<!-- DRAFT for a human to review and post. Do not post automatically.
     Follows Drupal core's AGENTS.md rules for drupal.org prose: rewrite it in your own words before posting; at most 180 words;
     sentences of at most 25 words; plain facts; no headers; no tool or model names; end with the disclosure line.
     Check it with: node scripts/check-draft.mjs 867830. Every sentence matches a row in EVIDENCE.md. Delete this block when you post. -->

The lab now has a separate current-Core proposal, not a re-test of the historical #306 branch.

It adds visible Unpublished text with hidden node/comment context, independently of author metadata.
Separate patches cover Core, Claro and Olivero. Core includes Default Admin and Starterkit templates; existing generated themes need their own updates.

The shared fixture has three nodes and published/held comments, with fixed aliases and published-content controls.
November 17 Default Admin checks passed in light, dark and forced colours on Core 3fb1c69d3692.
November 9 checks also covered Claro and Olivero.

This does not settle the Navigation Top Bar chip's styling, contrast or duplicate-status questions.
No person-led keyboard, visual or real screen-reader review has been completed.

Before RTBC, we still need a targeted summary update, agreement on scope, and independently reviewed implementation and accessibility evidence.

The [lab report](https://github.com/mgifford/drupal-core-lab/tree/main/reports/issues/867830) contains the reproduction recipe, patch identities, evidence and proposed Claro follow-up.
Please review this draft and the linked proposals before posting.

Generated with the help of an LLM.
