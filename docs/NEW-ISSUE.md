# Starting a new issue, and coming back to it later

The unit of work is **an issue**: a folder in `reports/issues/<nid>/`, a recipe in `recipes/`, and two variants in
`tools/compare/variants.json` (`<nid>-pinned` and `<nid>-latest`). #3619127 is the worked example.

## 1. Scaffold
    node scripts/new-issue.mjs <nid> --branch <issue-fork-branch> --title "Short title"
It fetches the issue fork's branch and current core `main`, writes the branch's own changes as
`reports/issues/<nid>/branches/<branch>.patch` (with source, tip, base and date in `BRANCHES.md`), pins the core commit the
patch was based on, creates `REPRODUCE.md`, `EVIDENCE.md`, a status note and a comment-draft stub, a recipe stub, and the two
variants. It needs `envs/core.git` (created by `setup.mjs`); `--depth 1500` if the branch is old; `--dry-run` shows the plan.
The issue's own drupal.org page lists the fork branch name (the MR source branch).

## 2. Describe how to reproduce it
Edit the `<nid>-pinned` entry in `tools/compare/variants.json`:
- `pages` and `login`: pages the diff report fetches; whether it logs in.
- `steps`: each `{ "text", "how": "recipe" | "mirror" | "each", "lookFor" }`. `recipe` = the recipe does it, `mirror` = do it once, the
  viewer repeats it in both frames, `each` = do it yourself in each frame (use this for the step that is the thing being tested).
- `expected` and `actual`: one sentence each, shown above the frames.
- `checks`: `{ "label", "probe", "expect", "kind" }`. `probe` is a JS expression run inside each frame; `expect` a value or `"same"`;
  `kind` is `precondition` (must pass on both or nothing means anything), `fix` (should fail Before and pass After) or
  `regression` (should be equal). Record events instead of reading state when only one frame can hold it (focus).
- `observe`: manual yes/no questions with `expectBefore` and `expectAfter`.
- `steps` also become an optional checklist in the viewer (people can tick them; ticks are saved in their browser and the downloaded log).
- `coverage` (optional): `{ "matrix": [...], "manual": [...], "blocked": { "firefox": "why it could not be run" } }` to replace the standard browser and colour-mode matrix.
Edit `recipes/repro_<nid>/recipe.yml` so the starting state exists (modules, content types, config).
Full field reference: `tools/compare/README.md`.

## 3. Build, check, look
Build the **`-latest`** pair first (updated core, and updated core plus the patch): that is the day-to-day pair. Build `-pinned` later,
when you want the exact original reproduction recorded. Stop the previous issue's pair first (`node scripts/lab-env.mjs stop <slug>`).
    node tools/compare/setup.mjs <nid>-pinned --check-patches    # do the patches apply to the pinned core?
    node tools/compare/setup.mjs <nid>-pinned                     # build Before and After (10 to 20 minutes the first time)
    node tools/compare/serve.mjs <nid>-pinned                     # viewer; reproduce by hand, answer the manual panel
Environments are named `baseline-<nid>` and `issue-<nid>`. Two issues may share a baseline if they pin the same core commit:
give them the same `before.env`. Keep two or three DDEV projects running at most (`ddev stop` the others).

## 4. Script it and record evidence
Copy `tools/playwright/walkthrough.mjs` and `flow.mjs` and adapt the selectors (the #3619127 versions are the pattern: real input,
mouse then keyboard-only, axe at each stage). Run it and `screenreader.mjs`. They write dated folders under
`reports/issues/<nid>/`. Fill in `EVIDENCE.md` (exact commits) and `STATUS-<date>.md`. Nothing is posted to drupal.org by any
script; `ISSUE-COMMENT-DRAFT.md` is a draft for a person to review and post.

## 4b. Record what has and has not been tested
    node tools/playwright/walkthrough.mjs <nid>-pinned --browser=webkit --scheme=dark     # also --forced-colors, --viewport=1280x900
    node scripts/coverage.mjs <nid>                                                        # writes COVERAGE.md
Run the standard matrix (Chromium, Firefox, WebKit; light and dark; forced colours). A missing row is a gap, shown as NOT TESTED. Save
viewer logs from people who tested by hand in `reports/issues/<nid>/manual/` and re-run `coverage.mjs`.

## 5. Package it
    node scripts/make-bundle.mjs <nid>-pinned          # writes bundles/drupal-repro-<nid>-<date>.zip
    node scripts/index-issues.mjs                      # refresh reports/issues/README.md
The zip holds the viewer, recipe, patches, steps, checks and evidence, and a setup command; it does not contain Drupal core.

## 6. Come back later, including on updated Drupal core
Everything is in `reports/issues/<nid>/REPRODUCE.md`. In short:
    node tools/compare/setup.mjs <nid>-pinned  --check-patches   # still applies to the pinned core?
    node tools/compare/setup.mjs <nid>-latest  --check-patches   # ...and to current core main?
    node tools/compare/setup.mjs <nid>-latest                    # build on current main
    node tools/playwright/walkthrough.mjs <nid>-latest           # read its "Interpretation"
The walkthrough says whether the problem was **reproduced and fixed**, **no longer reproduces** (upstream may have fixed it: check
the issue before concluding anything), or **reproduces but the patch no longer fixes it** (reroll). To re-pin after verifying, set
`core.commit` on the `-pinned` variant. To free resources when you move on: `ddev delete --omit-snapshot --yes` in each
`envs/<name>/` and `git -C envs/core.git worktree remove --force ../<name>`; the evidence stays in `reports/`.
