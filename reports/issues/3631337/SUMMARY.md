# #3631337: Experimental error markers in forced colors

DRAFT local proposal. [Drupal issue](https://www.drupal.org/project/drupal/issues/3631337).

Forced-color error bars are double across grouping elements, including selected erroneous tabs; selection remains independently identifiable.

## Scope

Adds double error bars in forced colors across vertical tabs and details, including accordion details. Retains the parent CanvasText color, prohibition icons, and hidden contains-error text. Does not invent an Error system color or mislabel errors with ActiveText, Mark, or GrayText. Warnings, general form-input styling, message styling, and the CSSWG proposal remain open. This is a narrow visual experiment, not a claim to resolve the entire issue.

## Comparison

`3631337-pinned` in the existing Lab viewer. Standard installation plus `recipes/repro_3631337/recipe.yml`; no custom post-recipe script. See BRANCHES.md for ordered revisions and hashes, REPRODUCE.md for steps, and EVIDENCE.md for verification limits.

AI assistance: generated local patch, scripts, and draft documentation with ChatGPT/Codex. Nothing posted to Drupal.org or pushed to GitHub.
