# AI usage, slice F: stale runs in coverage (2026-10-15)

DRAFT until a person has reviewed it. Slice F from [../phase-3-remainder/FINDINGS.md](../phase-3-remainder/FINDINGS.md), chosen by the owner; the last item of the brief's Phase 3 (R6). Base commit `48f9095`. Nothing pushed.

## What changed

| File | Change |
|---|---|
| `tools/compare/run-record.mjs` (new) | `runStaleness(results, variant, ...)`: compares what a run recorded with the variant, its patch files and its recipe as they are now. **stale**: something recorded differs (core patch bytes or list, contrib patch bytes or list, the contrib pin, the recipe hash, the pinned commit), with the reason naming both hashes. **current**: the run recorded patch hashes and every recorded value still matches. **unrecorded**: it recorded no hashes, so nothing can be said (never "current", never "stale"). Parts a run did not record are listed as notes. For an unrecorded run, a hint when git shows a patch file was committed after the run. |
| `scripts/coverage.mjs` | A stale run is kept, listed under "Stale runs" with its reasons, and **not counted**: its matrix row shows "NOT TESTED against the current patches (N stale runs)" and the gap list says "only stale runs". A run that recorded hashes is marked `(record: current)`; an older one `(record: none, not checked against the current patches; <hint>: it may be stale)`. The summary line counts current, unrecorded and stale. |
| `docs/NEW-ISSUE.md`, `docs/COMMANDS.md` | The three marks, and that `run-mark.mjs --superseded` is still the manual way. |
| `tests/lab/run-record.test.mjs` (7) | Six on the module and one end to end through `coverage.mjs` on a throwaway issue folder. |

It reads what slices A, D and E already write into every new run (`patchState`, `identity`), so nothing about how runs are recorded changed.

## What it says about the existing runs (read-only, 28 runs in 8 issue folders)

**All 28 are unrecorded**: none recorded a hash (they predate slice A), so none is stale and none is current; it is the honest answer. Two 3093378 runs get a hint (the patch file was committed on 2026-10-13, after
the first two runs). Three issues' runs (3273806, 3618405, 3619154) have a variant slug that is not in this checkout (`-`), so they cannot be compared at all, and say so. I did not regenerate any `COVERAGE.md`
(they are generated, committed evidence; running `node scripts/coverage.mjs <nid>` will add the marks). The first run after merge records hashes, and from then on a changed patch or recipe turns it stale.

Round trip with the real run library (throwaway environments): the record `baseResults()` writes reads back as **current**; after the patch file is changed it is **stale** ("after patch ... changed since the run (run 4de24605, now a3da68f9)"); after the recipe is changed it is stale too.

## Checks

- 224 tests, 224 pass, none skipped; `node scripts/selftest.mjs` passes.
- Four negative controls, each failing tests and restored byte-identical: patch bytes not compared; an unrecorded run called current; the recipe not compared; `coverage.mjs` still counting a stale run.

## Not done, and why

- **Base commits are not a staleness rule.** A `latest` variant has no fixed base to compare with; slice D already refuses a run on mixed bases, and the run records both commits.
- **No change to the evaluators' steps and checks**: a run is not marked stale when the evaluator script itself changes. That would need the script's hash in the record.
- **Stale runs are not deleted or marked in their own `results.json`**; the mark is computed each time `coverage.mjs` runs, so it follows the current files.

## Rollback

Revert the commit; `coverage.mjs` goes back to counting every run.
