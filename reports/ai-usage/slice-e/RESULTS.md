# AI usage, slice E: contrib modules and patches tracked by content (2026-10-15)

DRAFT until a person has reviewed it. Slice E from [../phase-3-remainder/FINDINGS.md](../phase-3-remainder/FINDINGS.md), chosen by the owner. Base commit `705b47b`. Nothing pushed.

## The defect (R3 of the Phase 3 look, confirmed by reading and now by tests)

A variant's `contrib` modules are extracted at a pinned commit, without `.git`, into `<env>/modules/contrib/<name>`, and the After side's `contribPatches` are applied inside them.
`setup.mjs` remembered a module by the **existence** of `.lab-contrib-<name>` and printed the *variant's* commit, not the recorded one; it remembered a patch by its **file name**
(`.lab-contrib-patches-applied`). So a changed pin, a patch rewritten under the same name, or a hand edit in the module went unnoticed. The module files are untracked in the core
checkout's git, so slice A's core check could not see them either. Real variants use it: `3093378` and `3273806`.

## What changed

| File | Change |
|---|---|
| `tools/compare/contrib-state.mjs` (new) | The old contrib steps, moved out of `setup.mjs` so they can be tested without DDEV (shared clone, extraction at the commit, patches), plus identity: a record in the checkout's git directory (`lab-patches/contrib.json`: per module the commit, each patch's sha256, the content hash and executable bit of every file, the files the patches touch). An environment with no record is checked by building the expected files in a temporary folder (the commit extracted, the patches applied) and comparing; equal means verified and recorded, different means blocked. The old markers are still written. `sideState()` combines core and contrib for a run. |
| `tools/compare/setup.mjs` | The contrib block calls `ensureContrib`; `--refresh-patches` now also extracts a mismatched module again at its pin and patches it, **moving the old folder to a backup** in the checkout's git directory. `--dry-run` prints the plan. The old `materializeContrib` is gone from `setup.mjs`; its clone, fetch and `git archive` steps are in `ensureShared` and `buildExpected`. |
| `tools/playwright/lib/lab-run.mjs`, `scripts/lab-env.mjs` | A run and `lab-env.mjs status` use the combined state. A contrib mismatch refuses a run like a core patch mismatch; `status` lists patch and contrib mismatches for both sides. |
| `tools/compare/patch-state.mjs` | Exports `gitDir`; the run-block message says why when a module is missing instead of "the patches are not applied". |
| `docs/PITFALLS.md`, `docs/COMMANDS.md` | Rows and flag text cover contrib. |
| `tests/lab/contrib-state.test.mjs` (9), `tests/lab/setup-contrib.test.mjs` (1, end to end) | See Checks. |

Policy, kept consistent with the earlier decisions: a changed pin, changed patch bytes, or an edit inside a file a patch touches **blocks** (setup exit 4, and a run). An edit in another file of the module is "outside the patches": on the
After side a warning that a run records; on the Before side a dirty baseline (setup warns, a run refuses), as decided for core files.

## Before and after, same cases

| Case | Before | After |
|---|---|---|
| Variant's pin changed, module already extracted | "contrib module already in place: name @ <new pin>" (it printed the variant's commit; the folder had the old one) | `BLOCKED`, both commits named; `--refresh-patches` extracts the new commit |
| Contrib patch rewritten under the same name | "contrib patch already applied", old change kept, exit 0 | `BLOCKED`, "changed since it was applied" |
| Hand edit inside a patched file | not noticed | `BLOCKED`, the file named; a refresh restores it (the edit is kept in the backup) |
| Hand edit elsewhere in the module | not noticed | After: warning, recorded. Before: setup warns, a run refuses |
| An environment with only the old markers (all existing ones) | trusted | verified by content once and recorded, or blocked; a marker that names another commit is blocked |
| A patch that does not apply to the pinned commit | `git apply` error in a half-built module | fails before anything is changed |
| A deleted module folder | re-extracted only if the marker was also deleted | a run refuses; setup re-extracts on `--refresh-patches` |

## On the real environments (read-only)

All four built contrib sides verify by content: `baseline-3093378-latest`, `issue-3093378-latest`, `baseline-3093378-pinned`, `issue-3093378-pinned` (the pinned `toolbar` commit extracted, plus the patch on the After side,
equals the folder in each; about 100 ms). `3273806` is not built. A run's quick state for them is `unverified` (markers only) and allowed; the first `setup.mjs` run after merge records them.

## Checks

- 217 tests, 217 pass, 0 skipped, twice in a row; `node scripts/selftest.mjs` passes.
- Four negative controls, each failing one test and restored byte-identical: patch hash ignored; commit not compared; edits inside patched files treated as outside; a marker-only module trusted without comparing.
- The end-to-end test runs the full `setup.mjs` with stand-in `ddev`, `docker` and `npm`: the module is extracted at the pin on both sides and patched on the After side only, a re-run verifies, new patch bytes block (exit 4), `--refresh-patches` applies them.
- Found on the way: the refresh message put a `;` straight after the backup path, so a pattern that reads the path picked it up; the message now ends the path with `)`.

## Not done

- **No real DDEV run** of the contrib path; the first `node tools/compare/setup.mjs 3093378-latest` after merge should print "verified by content ... recorded now" twice and carry on.
- **`scripts/lint.mjs` still does not check contrib patches** (it says so); unchanged.
- **Stale runs in `coverage.mjs`** (slice F) and the **50% prompt target** remain.

## Rollback

Revert the commit. The record file and backups in a checkout's git directory are ignored by an older `setup.mjs`, which still reads the old markers.
