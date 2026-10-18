# #3630425: empty multi-value actions header in Default Admin

[Issue](https://www.drupal.org/project/drupal/issues/3630425) | [MR !17421](https://git.drupalcode.org/project/drupal/-/merge_requests/17421)

Registered comparisons: `3630425-pinned` and `3630425-latest`. Pinned main: `dbfce851242d5b082adb8ed14634b4bc9cce374b`. Default Admin explicitly selected in the recipe. No contributed modules.

The MR adds visually hidden Operations text to the previously empty actions-column header. Expect the forms to look the same: inspect the table header, use the viewer's checks, or run the evaluator. Do not interpret a lack of visual difference as an unapplied patch.

Reporter confirmation is in comment #8, responding to the maintainer's Default Admin/main question in comment #7. Independent source inspection agrees. Live site reproduction is pending because this preparation environment lacks PHP, Docker, DDEV, and a browser.

See REPRODUCE.md for setup, BRANCHES.md for exact patch provenance, EVIDENCE.md for limitations, and CODER-PROMPT.md for generated cloud instructions. The evaluator explicitly enables axe's empty-table-header rule, which is not included by a WCAG-only rule selection.

AI-assisted lab integration; the production change matches the upstream MR; local regression tests are added. Nothing posted or pushed.
