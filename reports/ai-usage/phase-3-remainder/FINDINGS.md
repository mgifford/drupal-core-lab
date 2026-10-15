# AI usage: the rest of the brief's Phase 3 (verify patch and environment revisions), looked at 2026-10-15

DRAFT until a person has reviewed it. An assessment, not an implementation: nothing in `setup.mjs`, the run library or the environments was changed. Base commit `c776642`.
Slice A ([../phase-1/RESULTS.md](../phase-1/RESULTS.md)) did the patch half of Phase 3. This checks what is left against the code, a throwaway repository, and the real environments (read-only).

## What is left, and what each check found

| # | Phase 3 item | Evidence | Verdict |
|---|---|---|---|
| R1 | Recipe or fixture change invalidates the starting state and the evidence | `lab-site.sh apply` copies `recipes/<name>` into the environment and applies it, and nothing compares that copy with the recipe later. Real data: the two #3618230 sites hold recipe hash `aeda8bba45`; the committed recipe is `e743844467`. The difference is one line of `recipe.yml` (a widget `weight: 10` became `0`, commit `aca203e`, 2026-10-14). The evidence runs after that commit used sites built before it, and no tool noticed. The other four built pairs match their recipes. | **Confirmed on real data**, undetected |
| R2 | One common base commit; a refresh produces the intended base | Throwaway repository: upstream moved to B, the After environment was lost and rebuilt, Before was kept. Result: Before at `02af103`, After at `52c23a6` (it contains a line Before lacks), `setup.mjs` exit 0, and the next run printed "patches verified by content". `setup.mjs:100-104` documents it ("existing ones are left alone"). The five real pairs currently share a base. A `-latest` variant that shares a baseline with another (`before.env` is meant to be shareable) is the likely way to hit it. | **Confirmed**, silent |
| R3 | Contrib module revision and contrib patches | `.lab-contrib-<name>` is checked for existence only and the message prints the variant's commit, not the recorded one; `.lab-contrib-patches-applied` is keyed by patch name, the defect slice A fixed for core patches (`setup.mjs`, contrib block). Real variants use it: `3093378` has `contrib` and `contribPatches` in `tools/compare/variants.json`. The block runs after `--checkout-only` returns, so it cannot be exercised without DDEV today. | **Confirmed by reading**, not exercised |
| R4 | A dirty baseline or unexplained changes block misleading evidence | Slice A reports tracked files outside the patches as a WARNING and does not stop. `AGENTS.md` rule 1 says to stop when the baseline has tracked changes. Real baselines: four clean; `baseline-3604037-latest` has its one declared `before.patches` file. | Gap; **needs a policy decision** (below) |
| R5 | A `-latest` environment is not called current without checking | `lab-env.mjs status` shows no commit; nothing compares an environment with the shared core ref (`refs/lab/main` is `3b94128e929`, one real pair is on `8cd44d484e3`, the other on `3b94128e929`). | Gap in visibility |
| R6 | Stale results are detected | Runs now record `patchState` (slice A) but `coverage.mjs` does not compare it with the patch files now; runs made before slice A have none. | Gap |
| R7 | Offline checks are told apart from real DDEV verification | Slice A and this look are offline plus read-only checks on real checkouts. No real DDEV run of the new patch step has been done. | Documented, still open |

## Proposed slices, in the order I would do them (each small, with its acceptance test and rollback)

**Slice D: environment identity (R2, R1, R5).** One module function and two hooks, no new stored state for R1 and R2:
- Observed against requested: `HEAD` of Before and After must be equal, and equal to `core.commit` for a pinned variant; the recipe copy inside each environment must hash equal to `recipes/<name>` now.
  Any mismatch is `BLOCKED` (exit 4) in `setup.mjs` and in `launch()` (the same message style as slice A), naming what differs and the fix: `lab-env.mjs delete <slug> --yes` then `setup.mjs <slug>` for a base mismatch (a rebuild is the only safe refresh: vendor, database and patches all depend on the base); `lab-env.mjs reset <slug> --yes` (cheap, keeps the checkout) for a recipe mismatch.
- Runs record `base` and `recipe` hashes per side; `lab-env.mjs status` gains a core column ("behind refs/lab/main").
- Acceptance tests (offline, the experiment above is the seed): bases differ, blocked in setup and in `launch`; pinned commit differs from the variant, blocked; same base, passes; recipe edited after apply, blocked, and passes again after the copy is replaced; a recipe equal on both sides but different from now, blocked; results record both hashes.
- Effect on the real environments today: the #3618230 pair would be blocked until `lab-env.mjs reset 3618230-latest --yes`. That is correct under the rule, and it is the owner's call to accept it (below).
- Rollback: revert the commit; no stored state.

**Slice E: contrib identity (R3).** Move the contrib steps into the module so they can be tested without DDEV: the module generalises slice A's functions with a directory prefix (`git apply --directory=modules/contrib/<name>`), records the module's commit and its patch hashes, and verifies the same way. Acceptance: a local contrib repository, the commit pin changed, a patch with changed bytes under the same name, no record, each blocked or verified. Do after D.

**Slice F: stale evidence and the dirty baseline (R6, R4).** `coverage.mjs` marks a run whose recorded patch hashes differ from the patch files now as stale, as it does for superseded runs; runs without the record are listed as "unrecorded", never as stale or current. For R4 see the decision below.

R7 closes with one real run (`node tools/compare/setup.mjs 3618230-latest`, then an evaluator) on a built pair; it needs sites started and is the owner's go.

## Decisions for the owner

1. **Block a run on a recipe mismatch?** It is the rule in the brief, and it blocks the #3618230 evaluator until `reset`. The alternative is to record the mismatch in the results and only warn. Recommendation: block, because a result from a site that does not match its recipe cannot be reproduced from the repository.
2. **Dirty baseline: stop, or warn?** `AGENTS.md` rule 1 says stop. Recommendation: stop for a baseline with tracked changes that its variant does not declare (`before.patches`); keep the warning for extra edits on the After side, recorded in the run.

## Not changed, not measured

No behaviour changed in this look. The throwaway experiments were removed (`envs/` and `reports/issues/` hold nothing of them). Token effect: none of this saves tokens; it prevents evidence from the wrong state and the reruns that follow.
