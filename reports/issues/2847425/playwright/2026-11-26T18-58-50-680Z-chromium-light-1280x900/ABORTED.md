# Aborted run

The evaluator stopped before writing `results.json`, so this folder is not evidence. The run was one of the
iterations while the evaluator's selectors and upload sequence were being corrected: element IDs are regenerated
after an AJAX replacement, and a temporary file name collided with an earlier run.

Valid runs are the ones with `results.json`: `2026-11-26T22-08-01` (current MR) and the three
`2026-11-27T00-*` runs (refinement). See [EVIDENCE.md](../../EVIDENCE.md).
