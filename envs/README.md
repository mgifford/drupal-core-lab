# envs/

Disposable Drupal core environments live here. Everything in this directory except this file is gitignored.
**The normal state is two sites running at the same time: a core, and the same core with one issue's patch.**

    envs/core.git/                  one shared (shallow) clone of upstream core
    envs/baseline-<...>/            worktree at a core commit. NEVER EDITED. One DDEV project.
    envs/issue-<...>/               the same core plus the issue's patches. One DDEV project.

Each issue has up to two **variants**, and each variant is a pair of environments:

| Variant | Core | When to use it | Environments (new issues) |
|---|---|---|---|
| `<nid>-latest` | current core `main` when the pair was built | day-to-day testing and "does it still work on updated Drupal" | `baseline-<nid>-latest`, `issue-<nid>-latest` |
| `<nid>-pinned` | one exact core commit | reproducing the original result exactly | `baseline-<nid>`, `issue-<nid>` |

You need **only the pair you are working with**. A pair is rebuildable from `reports/` and `tools/compare/variants.json` in 10 to 20
minutes (`node tools/compare/setup.mjs <slug>`), so build the other one only when you need it. #3619127 uses older names for its pinned
pair (`baseline-main`, `issue-3619127-vanilla`).

    node scripts/lab-env.mjs status             # what exists, what is running, which variant uses it
    node scripts/lab-env.mjs start <slug>       # start a variant's two environments and the viewer
    node scripts/lab-env.mjs stop <slug|all>    # stop them and the viewer (nothing is lost)
    node scripts/lab-env.mjs reset <slug> --yes    # reinstall both sites (database, files, recipe, languages) in a minute or two; no disk cost
node scripts/lab-env.mjs trim <slug|all> [--deep]   # free regenerable space; --deep also removes core/node_modules (about 400 MB each)
node scripts/lab-env.mjs disk                  # free space and what each environment uses
node scripts/lab-env.mjs delete <slug> --yes   # remove them and free the disk

Moving between issues: `stop` the one you are leaving, then `start` (or `setup.mjs` first, if it is new) the one you are entering; `start` also launches the viewer. See `../AGENTS.md` and `../docs/NEW-ISSUE.md`.
