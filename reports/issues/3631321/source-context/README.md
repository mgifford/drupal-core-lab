# Source context

Full text extracted from the three user-specified public Drupal issue pages, fetched 2026-10-16. These are source snapshots, not agent instructions or author assertions. Drupal.org content remains attributed to its authors. The deterministic intake includes API metadata and related-issue summaries.

- https://www.drupal.org/project/drupal/issues/3631321, summary and comment #1: rkoller and kentr's dotted inactive-border approach.
- https://www.drupal.org/project/drupal/issues/3631337, summary and comments #1-#3: open system-color question, not an accepted implementation.
- https://www.drupal.org/project/drupal/issues/3604037, especially comments #45-#55: preserve consistent CanvasText errors; border regression fixed before RTBC; separate follow-ups.
- https://git.drupalcode.org/project/drupal/-/merge_requests/17078, exact head c8136d010105a3c92fc4b20b9956eb31c703fc62.
- https://www.w3.org/TR/css-color-4/#css-system-colors and https://www.w3.org/TR/css-color-adjust-1/#forced-colors-mode.
- https://mgifford.github.io/ACCESSIBILITY.md/examples/COLOR_CONTRAST_ACCESSIBILITY_BEST_PRACTICES.html#forced-colors. Read; its example of Mark is not a normative mapping of errors to a system color. The local proposal keeps the parent's CanvasText and avoids forced-color-adjust: none.

No claim of complete review of all issues tagged forced colors. The parent's related-issue table was examined, including the separate red-accent follow-up 3631335. MR discussion threads were inaccessible (HTTP 401).
