# AI usage, Phase 1 (slice A): patches tracked by content (2026-10-15)

DRAFT until a person has reviewed it. Slice A from [../phase-0/FINDINGS.md](../phase-0/FINDINGS.md) section 6, chosen by the owner.
Base commit `2679680` (Phase 0). Nothing pushed.

## What changed

| File | Change |
|---|---|
| `tools/compare/patch-state.mjs` (new) | The identity logic: hashes of each patch and of every file the patches touch, verification, `ensurePatches`, refresh, the quick state a run records. |
| `tools/compare/setup.mjs` | The patch step (was `:151-162`) calls `ensurePatches`; new flag `--refresh-patches`; exit 4 on BLOCKED. `--dry-run` still only prints the plan. |
| `tools/playwright/lib/lab-run.mjs` | `launch()` refuses a run when a side does not match its patches; `baseResults()` records `patchState` (recorded and current patch hashes, footprint, base) for both sides. |
| `tests/lab/patch-state.test.mjs`, `tests/lab/setup-patches.test.mjs` (new) | 11 unit tests on throwaway repositories; 2 end-to-end tests through `setup.mjs --checkout-only` on a tiny local upstream. |
| `AGENTS.md`, `docs/NEW-ISSUE.md` | One command line and one pitfalls row; one line in "come back later". |

How it decides. A record lives in the checkout's git directory (`<gitdir>/lab-patches/state.json`): each patch's path and sha256, and for every file the
patches touch its content hash and executable bit. The old name list (`.lab-patches-applied`) is still written, so an older `setup.mjs` keeps working.
A rerun is **verified** when the patch hashes equal the patch files now and the files still hold what was recorded. An environment with no record (a name
list only, as every environment built so far, or nothing at all) is checked by applying the patches to a throwaway index and comparing: equal means
verified and recorded, different means blocked. Nothing is reset without `--refresh-patches`, which saves a diff of local edits in the touched files first,
and refuses before changing anything if the patches do not apply to the base commit.

## Before and after, same cases (Phase 0 reproduced the "before" column on a throwaway repository)

| Case | Before this change | After |
|---|---|---|
| Patch bytes changed, same file name | "patch already applied"; old change kept; exit 0 | `BLOCKED` exit 4, tree untouched, names the changed patch and the refresh command |
| No marker, tree modified, patch not applied | "assuming patches are applied"; nothing applied; "plus its patches" printed | `BLOCKED` exit 4 ("no record of any patch") |
| No marker, patch really applied | assumed | verified by content and recorded |
| Name list only (every existing environment) | trusted | verified by content once and recorded; blocked if the files differ |
| Nothing changed | reused | reused, "verified by content", nothing written |
| Unrelated edit in the patched tree | not mentioned | WARNING naming the files; not reset |
| A patched file edited afterwards | not detected | `BLOCKED`, the file is named |
| A run on a mismatched side | ran, recorded the commit and patch names | throws before any browser starts, same message; results record hashes and state |
| A patch that does not apply | `git apply` error halfway, partly applied | fails before touching anything |

## Acceptance (FINDINGS section 6)

| # | Test | Result |
|---|---|---|
| 1 | bytes changed under the same filename: blocked, tree untouched | passes (unit and end to end) |
| 2 | marker missing, tree modified: not "assuming" | passes. Refined: blocked **unless the files prove it** (then verified and recorded), which is stricter than blocking always |
| 3 | no change: reuses, applies nothing, exit 0 | passes |
| 4 | unrelated edit in a patched tree: reported, not reset | passes |
| 5 | name-only marker: not reported as verified without proof | passes. Refined: verified **by content** and said so, or blocked; never trusted. The brief's "unverified" label still appears for runs (`patchState.state = unverified`) |

Negative controls (each made the matching tests fail, then was restored byte-identical): the old filename-keyed `setup.mjs` against the end-to-end test;
a module that compares patch names but not hashes (5 tests fail); a module whose footprint never differs (2 tests fail).

## Measured

- Existing suite plus new: 186 tests, 185 pass, 0 fail, 1 skipped (Playwright is not installed in this worktree). `node scripts/selftest.mjs` passes.
- Read-only check against the real environments in the main checkout, using the real patch files: every patched side verified by content (`upgrade` state):
  `issue-3618230-latest` (1 patch), `issue-3604037-latest` and its baseline (1 patch each), `issue-3619127-vanilla` (a 3-patch stack, no marker at all).
  Unpatched sides report `none`. No false mismatch; 40 to 520 ms per side. What a run would record for them: `unverified` (name list only) or `none`; none is blocked.
- Token effect: none intended. `AGENTS.md` grew by about 0.8 KB (this slice plus the earlier `try-tests` line), a small increase in the starting context.

## Not done, and why

- **Contrib patches** (`contribPatches`, `.lab-contrib-patches-applied`) have the same name-keyed pattern (`setup.mjs`, contrib block). No fixture exists for them; left for Phase 3.
- **Hypothesis 7** (a `-latest` environment staying on an old commit): not changed. It is intentional and the visibility gap remains.
- **Dirty baseline blocking, recipe revisions, stale evidence flagged in `coverage.mjs`**: Phase 3 and 4. This slice reports outside edits as a WARNING only.
- **A real DDEV run on a built pair**: not done. The offline tests and the read-only check on real checkouts cover the patch step; the first real
  `node tools/compare/setup.mjs 3618230-latest` after merge should print "verified by content ... recorded now" and then carry on as before.

## Risks and rollback

- Verification builds the expected files in a throwaway index; a checkout that applies patches with different line-ending rules could differ from it. None did on the four patched real sides.
- A state file left behind by a reverted commit is harmless (an older `setup.mjs` ignores it and still reads the name list).
- Rollback: revert the commit. No migration.
