# AI usage, slice D: environment identity (2026-10-15)

DRAFT until a person has reviewed it. Slice D from [../phase-3-remainder/FINDINGS.md](../phase-3-remainder/FINDINGS.md), chosen by the owner, with the decision **block on a recipe mismatch**.
Base commit `e5f9bbc`. Nothing pushed.

## What changed

| File | Change |
|---|---|
| `tools/compare/env-state.mjs` (new) | Observed against requested, nothing stored: the base commit of each checkout, the commit a pinned variant pins, and the recipe applied to each site (the copy `lab-site.sh` puts in `<env>/recipes/<name>`) against `recipes/<name>` now. `identity()`, `blockMessage()` with the exact fix per kind, `identityRecord()`. |
| `tools/compare/setup.mjs` | Both checkouts are created first, then the pair is checked (`BLOCKED`, exit 4, before anything slow). A `latest` environment that is missing next to one that exists is **created at that one's commit**, not at the newest core, so the mismatch cannot start. A site that exists with a different recipe is refused before the recipe is applied on top (`--reinstall`, which `lab-env.mjs reset` runs, is the way through). After the build the whole identity is checked again. |
| `tools/playwright/lib/lab-run.mjs` | `launch()` throws the same message before any browser starts; `results.json` records `identity` (pin, both base commits, the recipe as requested and as applied, problems). |
| `scripts/lab-env.mjs` | `status` has a Core column (the checkout's commit, and the shared ref when it has moved on) and lists pairs that are not in the state their variant asks for. |
| `docs/PITFALLS.md`, `docs/COMMANDS.md` | The new BLOCKED row and the status line. |
| `tests/lab/env-state.test.mjs` (8), `tests/lab/setup-identity.test.mjs` (1, end to end), `tests/lab/e2e-lock.mjs` | See Checks. |

## Before and after, same cases

| Case | Before | After |
|---|---|---|
| One side missing, `latest` variant, upstream has moved | the missing side is rebuilt on the newest core; Before and After differ by every upstream commit; exit 0, "patches verified" (reproduced in the Phase 3 look) | the missing side is created at the existing side's commit; one base |
| A pair already on two bases | not noticed | `BLOCKED` exit 4, both commits named, tree untouched, patches not applied; fix: `lab-env.mjs delete <slug> --yes`, then setup |
| A pinned variant whose environments are on another commit | not noticed | `BLOCKED`, the environment and the pin named |
| A site whose recipe changed after it was set up | setup reapplied the new recipe on top of the old state (recipes never uninstall); runs recorded nothing | setup refuses (exit 4) and so does a run; fix: `lab-env.mjs reset <slug> --yes` |
| A recipe that was never applied to an existing site | not noticed | a run is refused; setup applies it (that is how it gets its first copy) |
| What a run records | commit and patch names | plus pin, both base commits, recipe requested and applied |

## On the real environments (read-only)

Four pairs pass: `3619127-pinned`, `3604037-latest`, `3093378-latest`, `3093378-pinned` (same base, same recipe, pin matched). **`3618230-latest` is blocked**: both sites hold recipe `aeda8bba45be`, the committed recipe is `e743844467f7`
(the widget `weight` change in commit `aca203e`). Until `node scripts/lab-env.mjs reset 3618230-latest --yes` is run (from the main checkout; it reinstalls both sites and loses any content in them, keeps the checkouts and patches), its evaluator will stop with the message above. I did not run it.
`lab-env.mjs status` also shows that the `3604037-latest` pair stands on `8cd44d484e3` while the shared core ref is at `3b94128e929`: not a problem (a pair on one base), now visible.

## Checks

- 206 tests, 205 pass, 1 skipped (Playwright is not installed here), three full-suite runs in a row; `node scripts/selftest.mjs` passes.
- Negative controls, each failing the end-to-end test and restored byte-identical: the missing side created at the newest core again; no base and pin check; no recipe check before reapplying.
- **A test problem found and fixed on the way:** run together, the two end-to-end setup test files (this one and slice A's) raced on the shared `envs/core.git` and `envs/.setup.lock` and left a stray clone behind. `tests/lab/e2e-lock.mjs` lets one in at a time (a lock from a dead process is taken over). I removed the stray clone, which pointed at a temp folder.
- The recipe case runs the full `setup.mjs` with stand-in `ddev`, `docker` and `npm` that do nothing, because the check stops it before any of them is used.

## Not done, and why

- **`launch()` was not exercised**: Playwright is not installed in this worktree. `identity()` and `blockMessage()` it calls are tested; the hook is three lines.
- **No real DDEV run** of the full setup path through a recipe reset. The first `lab-env.mjs reset 3618230-latest --yes` will be it.
- **Dirty baseline:** decided afterwards (option 3), see the addendum below.
- **Contrib identity (slice E)** and **stale runs in coverage (slice F)**: unchanged.

## Risks and rollback

- Blocking is the point, but it means a stale pair stops a run until it is reset or rebuilt; the message names the command.
- The recipe hash covers every file in `recipes/<name>` (names and bytes); a copy that DDEV or a recipe's own `apply.sh` writes extra files into would differ. None of the four passing pairs did.
- Rollback: revert the commit. Nothing is stored, so there is nothing to migrate.

## Addendum: dirty-baseline policy, option 3 (decided by the owner)

Setup **warns** about tracked changes in a baseline that its variant does not declare (`before.patches` is the sanctioned exception) and carries on; a **run refuses** until they are
reverted or declared, with the file names and `git -C envs/<env> checkout -- <files>` in the message. Extra edits on the After side only warn, and are recorded in
`results.json` as `patchState.after.outside`. `lab-env.mjs status` lists dirty baselines. Files: `tools/compare/patch-state.mjs` (`runBlockReason`, `patchState.outside`, the setup
warning), `tools/playwright/lib/lab-run.mjs`, `scripts/lab-env.mjs`, `docs/PITFALLS.md`, `AGENTS.md` rule 1.

Checks: one new unit test (a dirty baseline warns in setup and refuses a run; a declared change is not dirt; an extra edit next to a declared change is; After edits are recorded, not blocking)
and a step in the slice A end-to-end test (setup exits 0 with the warning and never reverts the edit). Three negative controls (a run that does not refuse; the After side refusing too; the declared
footprint counted as dirt) each fail it. 207 tests, 206 pass, 1 skipped. Real environments, read-only: none of the five baselines has undeclared changes, so no run is refused for this today.
