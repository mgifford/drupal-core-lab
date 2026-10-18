# Draft only: testing #3630425 on current main / Default Admin

Do not post this as a successful test until the live evaluator and manual checks have run.

Prepared a core-only Lab comparison using an unlimited plain-text field on Article, with Default Admin as the admin theme. Before is pristine main; After adds the main-based version of MR !17421 with local regression coverage. Source inspection confirms the empty actions header persists through Default Admin preprocessing and its table template.

Pending evidence: exact environment/browser versions, initial empty-table-header finding Before and its absence After, header markup/accessibility tree, AJAX add/remove results, and manual keyboard review. No Paragraphs dependency is required for this scenario.

AI-assisted draft.
