# Reproduce #3627936: Active workspace has a broken styling in dark mode

Issue: https://www.drupal.org/project/drupal/issues/3627936
Pinned core: `ad11ba71c0f0` (the commit the evidence here was produced on). Last verified: 2026-10-15.

## The problem in one paragraph
On the Workspaces overview (`/admin/config/workflow/workspaces`) the row of the active workspace has a hard-coded light background (`#ebeae4`, `core/modules/workspaces_ui/css/workspaces.overview.pcss.css`). In dark mode with Default Admin it is a light bar under light text, so the row is hard to read; hovering shows the theme colour. Affects people who use dark mode and Workspaces. Related WCAG: 1.4.3 (text contrast), and 1.4.11 for how the active state is shown (discussed in comment #8; the proper visual indication belongs to #3207233).

No merge request can be tested: the issue fork branch has no commits and the merge request that was opened used the branch name `main`. After holds a fix written in the lab, so this reproduction is of the lab's patch, not of anyone's merge request.

## Reproduce it (pinned core, exactly as verified)
    node tools/compare/setup.mjs 3627936-pinned        # builds Before and After, applies the recipe and patches
    node tools/compare/serve.mjs 3627936-pinned        # side-by-side viewer
    node tools/playwright/walkthrough.mjs 3627936-pinned   # scripted replay with real input

## Try it on the latest core
    node tools/compare/setup.mjs 3627936-pinned --check-patches    # (use 3627936-latest to check the current core)
    node tools/compare/setup.mjs 3627936-latest
    node tools/playwright/walkthrough.mjs 3627936-latest

## If the result is not what you expect
| What you see | What it probably means | What to do |
|---|---|---|
| A patch **does not apply** | Core changed the same lines | Reroll: rebase the issue fork branch on current `main`, regenerate the patch (`scripts/new-issue.mjs 3627936 --branch <branch> --refresh`), update the files in `branches/`. |
| **Before no longer fails** | Upstream may have fixed it, or the steps/selectors no longer match | Check the issue and recent commits to the files in the patch before concluding anything. |
| **After still fails** on newer core | The fix no longer works there | Review the diff of the changed file against current core; update the patch. |
| Everything as expected | Still reproducible | Record the new core commit (see "Re-pin" below). |

## Re-pin to a newer core after verifying
1. Run the `-latest` variant to the end and confirm the walkthrough reports "Reproduced and fixed".
2. Put the verified commit (`git -C envs/<after-env> rev-parse HEAD`) in `core.commit` of the `-pinned` variant in `tools/compare/variants.json`.
3. Re-run the walkthrough and the diff report, commit the new evidence, update "Last verified" above.

## What is in this folder
| Path | What |
|---|---|
| `branches/*.patch`, `BRANCHES.md` | Patches from the issue fork, with source, tip, base and date. |
| `STATUS-<date>.md` | Related issues and review threads, dated. Re-check on drupal.org before relying on it. |
| `EVIDENCE.md` | Results with exact commits. DRAFT until a person has reviewed it. |
| `playwright/`, `compare/`, `screenreader/` | Generated evidence from the scripts. |
| `ISSUE-COMMENT-DRAFT.md` | A draft for a human to review and post. Nothing is posted automatically. |
