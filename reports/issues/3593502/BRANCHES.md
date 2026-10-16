# Branches and patches for #3593502

The lab applies these files in order:

| Order | Patch | Source | SHA-256 | Purpose |
|---:|---|---|---|---|
| 1 | `branches/patch-1-mr-15975.patch` | [MR !15975 diff](https://git.drupalcode.org/project/drupal/-/merge_requests/15975.diff), downloaded 2026-10-16; reviewed revision `6d566c319bcfecba885938b1d789115beb830834` | `1cca1f0893d2b0a6aba2f46c212c3c14c7fa4b31290877c79c096a3a64b77ebb` | The complete existing MR |
| 2 | `interdiff/15975-to-review-fixes.interdiff` | Lab review of MR !15975 | `f998897b3e4c4bbddd05c35050c1816cb73685ad28a9b1c4dae14ad7b73bd68c` | CSRF readiness, search dismissal tests, and forced-colours treatment |

`branches/3593502-follow-up-review-fixes.patch` is retained as a conveniently
named standalone follow-up. It is byte-identical to patch 2. Do not apply both
copies.

`lab/patch-stack-baselines.patch` changes Drupal Core Lab, not Drupal core. It
adds named Before and After patch stacks and validates both stacks. It must not
be included in a Drupal core merge request or issue patch queue. See
`lab/README.md`.

See `INTERDIFF.md` for an explanation of every changed file and the exact
static validation performed. See `REPRODUCE.md` for the DDEV lab procedure.
