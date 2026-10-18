# #3631321: Inactive vertical-tab borders

DRAFT local proposal. [Drupal issue](https://www.drupal.org/project/drupal/issues/3631321).

Inactive borders are dotted in forced colors; selected and neighboring boundaries are solid; outer borders are visible in normal mode.

## Scope

Adds dotted inactive borders in forced colors, preserves solid boundaries next to selected tabs, and supplies normal-mode first/last menu borders. Uses logical properties and visible-sibling selectors to accommodate RTL and hidden tabs. No interaction or semantics changes.

## Comparison

`3631321-pinned` in the existing Lab viewer. Standard installation plus `recipes/repro_3631321/recipe.yml`; no custom post-recipe script. See BRANCHES.md for ordered revisions and hashes, REPRODUCE.md for steps, and EVIDENCE.md for verification limits.

AI assistance: generated local patch, scripts, and draft documentation with ChatGPT/Codex. Nothing posted to Drupal.org or pushed to GitHub.
