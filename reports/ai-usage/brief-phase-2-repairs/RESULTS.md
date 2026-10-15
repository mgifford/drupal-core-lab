# AI usage, the brief's Phase 2: targeted generation and repairs (2026-10-15)

DRAFT until a person has reviewed it. This is the brief's own Phase 2, not the folder called `phase-2` (the code-map step; see the naming note in [../README.md](../README.md)).
Nothing posted. Base: the branch of PR #12, after the compact intake step.

## The problem, as measured in Phase 0

`repairMessage()` ended every repair with "send the complete corrected file again". For one wrong field the message was 245 bytes and the reply was the whole 6,733 byte pack.

## What was built

| Piece | Where | What it does |
|---|---|---|
| The edit format | `tools/compare/pack-edit.mjs` | A **JSON Patch (RFC 6902)** limited to `add`, `remove`, `replace` and `test`, wrapped with `pack_edit_version` and `base`: the hash of the pack the edit was made for. An existing standard, not string replacement: an operation names a field by path |
| Refusals, with the pack untouched | the same, `applyEdit()` | A stale base; an unknown field, version or operation (`move` and `copy` are refused); a path that does not exist (except for `add`); names like `__proto__`; `pack_version`; more than 20 operations or a value over 24 KB; a `test` that does not hold, in which case **none** of the operations is applied; an edit that would **add a validator error**; with `--require-valid`, any remaining error. Writing the result as YAML is checked to read back to exactly the same values |
| Repair message | `targetedRepairMessage()`, `issue-pack.mjs validate --repair --targeted` | Per finding: where (the validator's name and the JSON Pointer, resolved against the pack, so `recipe.files.recipe.yml` is `/recipe/files/recipe.yml`), what is there now, what to do (the existing hints), the pack hash, and the shape of the reply. Not the pack. An unreadable YAML pack falls back to the full-file message, because there is nothing to edit |
| Applying | `issue-pack.mjs edit <pack> <edit.json> [--require-valid] [--dry-run] [--no-backup]` | Replaces the pack atomically (temporary file, rename) only when all of that passes; the old file stays as `<pack>.before-<hash>` |
| Deterministic metadata out of prose | `issue-pack.mjs sync-issue <pack> [--write]` | Title, URL, fork branch and merge request come from the fetched issue (`issue-intake.mjs fetch`), as an edit with `test` operations, not from a model. A different issue number is refused |
| Measure | `scripts/repair-benchmark.mjs` | Whole repair turn (message plus reply) on recorded packs |

Reused as they are: the validator (`validatePack`, the arbiter of unknown fields and values), its hints, the setup-block catalogue and check templates. Packs written by the chat assistant, `validate`, `import` and `--repair` without `--targeted` behave as before.

## The brief's required tests, mapped (`tests/issue-pack/pack-edit.test.mjs`, 12 tests)

| Required | Test | Negative control |
|---|---|---|
| One-field correction preserves unrelated values | five kinds of field (branch, title, URL, a note with markup, expected result) broken and put right: the result equals the verified pack value for value, and only that path is touched | |
| Stale edits fail without partial mutation | a changed pack refuses an old edit; an edit whose second operation fails applies none of its first; the input object is not touched | base not checked: fails; operations applied to the input instead of a copy: fails |
| An invalid update leaves the prior pack intact | 19 refusal cases (operation, field, path, name, type, size, version, base, JSON), then through the command: the file is byte for byte as it was and nothing appears beside it | new validator errors allowed: fails; dangerous names allowed: fails |
| The assembled pack passes the existing validation | the repaired pack has no errors; `--require-valid` refuses an edit that leaves one, the default accepts progress | `--require-valid` ignored: fails |
| Unsupported setup stays explicit | an unknown block is reported; an edit inventing another unknown block is refused; the accepted route lists it under `needs`, where the validator keeps warning that the block does not exist yet | |
| Old valid packs still import | every committed valid pack (the verified one, the example, the free-form recipe, each `reports/issues/*/PACK.yml`) reads back to the same values with the same validator output; the 145 existing issue-pack tests pass unchanged | |
| YAML serialization keeps meaningful multi-line content | 25 awkward strings (blank lines, indentation, trailing newline or none, `: ` and ` #`, quotes, unicode, numbers and booleans as text, empty, only spaces, `- `, `[`, `{`, `|`, `#`, tabs, CRLF, nested) read back identical; multi-line text is written as a literal block; a long line is not folded | default 80-column folding: fails |
| Message names field, path, current value, hash | asserted; the message is less than half the pack; unreadable YAML falls back | |

Also tested: the command applies atomically and keeps the old file; a dry run writes nothing; the same edit applied twice is refused as stale; `sync-issue` fixes title, branch and merge request, refuses another issue, and without `--write` changes nothing.
One more control: `test` operations not compared: fails.

## Measurements (`node scripts/repair-benchmark.mjs`, recorded packs, bytes)

| Case | Findings | Reply, whole pack to edit | Whole turn, whole pack to targeted | Applied; fixed; remaining |
|---|---|---|---|---|
| #3618230 verified pack, one field wrong (**exact**) | 1 | 6,674 to 195 (**97% less**) | 6,919 to 1,019 (**85% less**) | yes; 1; 0 |
| llm-draft-phantom-global | 2 | 6,240 to 284 (95% less) | 7,858 to 2,762 (65% less) | yes; 2; 0 |
| llm-draft-constant-probe (3 warnings; one is a missing recipe configuration an edit cannot invent) | 3 | 3,761 to 363 (90% less) | 5,263 to 2,730 (48% less) | yes; 2; 1 |

The first row is exact. In the other two the edit is one I wrote to fix the same findings; it stands in for what a model would send, so those reply sizes are **constructed, not measured from a model**.
The whole-pack reply is a lower bound (the pack itself), so the real saving is at least this. Target from the brief: at least 50% less generated repair output for a one-field correction: met (97%).
The turn total falls below 50% when there are several findings, because the targeted message carries each finding's current value. No model session was run, so total usage of a real repair turn (reasoning, retries) is not measured.

## What this does not show

- That a model produces a correct edit as reliably as it produces a whole pack. A model must now name a path and give a value; a bad path is refused, which costs a turn. That needs a paired model evaluation on held-out drafts, which was not run (it needs your authorization and spends allowance).
- That edits fix findings that need knowledge the pack lacks (a recipe's configuration): the benchmark's third case leaves one such warning on purpose.
- Anything about YAML comments: they are not kept (the pack is parsed and written again); every value is.

## Altered behaviour and risks

- `validate --repair` is unchanged unless `--targeted` is given; `HINTS` in `pack-validate.mjs` is now exported.
- An edit that leaves other errors in place is accepted by default if it adds none (progress); use `--require-valid` for the last turn.
- The old pack is kept next to it as `.before-<hash>`; these files are not committed by anything, and are the person's to delete.
- Rollback: revert the commit; nothing else depends on the new files.

## Next

Phase 5 of the brief is done, and Phases 1 and 2 of the brief now have a first version. What remains open is in [HANDOFF.md](HANDOFF.md).
