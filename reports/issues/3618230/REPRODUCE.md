# Reproduce #3618230: Adopt the ajax MessageCommand for file uploads

Issue: https://www.drupal.org/project/drupal/issues/3618230
Pinned core: `f5e265802542` (the commit the merge request was based on). **The pinned pair has not been built or verified.** Scripted checks were run on 2026-10-03 against current core `main` (`a19dfee86688`, commit date 2026-10-01) using the `-latest` variant; see [EVIDENCE.md](EVIDENCE.md).

## The problem in one paragraph
`ManagedFile::uploadAjaxCallback()` renders a status messages element into the replaced file widget's prefix and ships it inside the insert AJAX command. The merge request leaves a placeholder container in the widget instead and sends each message as a separate AJAX `MessageCommand`. The reporter's reasons: server-rendered messages lose theme markup (such as an SVG icon) to XSS filtering, the message command uses aria-live announcements, and themes get control of how messages render. The issue is Postponed (maintainer needs more info): comment #10 asks whether the problem occurs in the Default Admin theme. No accessibility conformance claim is made here. See [SUMMARY.md](SUMMARY.md).

## Reproduce it (pinned core, exactly as verified)
    node tools/compare/setup.mjs 3618230-pinned        # builds Before and After, applies the recipe and patches
    node tools/compare/serve.mjs 3618230-pinned        # side-by-side viewer

## Steps by hand in the viewer
1. Make a test file bigger than 1 KB on your own computer: `yes aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa | head -c 2048 > too-big.txt`
2. Open `/node/add/article` in both frames (it is already loaded after **Go**).
3. In EACH frame, choose `too-big.txt` in the **Attachment** field (a file chooser cannot be mirrored, so do this by hand).
4. Press **Run checks**: the `fix` check (the `.file-upload-messages` wrapper exists) should fail on Before and pass on After.

No scripted walkthrough has been written for this issue.

## Try it on the latest core
    node tools/compare/setup.mjs 3618230-pinned --check-patches    # (use 3618230-latest to check the current core)
    node tools/compare/setup.mjs 3618230-latest

## If the result is not what you expect
| What you see | What it probably means | What to do |
|---|---|---|
| A patch **does not apply** | Core changed the same lines | Reroll: rebase the issue fork branch on current `main`, regenerate the patch (`scripts/new-issue.mjs 3618230 --branch <branch> --refresh`), update the files in `branches/`. |
| **Before no longer fails** | Upstream may have fixed it, or the steps/selectors no longer match | Check the issue and recent commits to the files in the patch before concluding anything. |
| **After still fails** on newer core | The fix no longer works there | Review the diff of the changed file against current core; update the patch. |
| Everything as expected | Still reproducible | Record the new core commit (see "Re-pin" below). |

## Re-pin to a newer core after verifying
1. Run the `-latest` variant to the end and confirm in the viewer that the `fix` check fails on Before and passes on After.
2. Put the verified commit (`git -C envs/<after-env> rev-parse HEAD`) in `core.commit` of the `-pinned` variant in `tools/compare/variants.json`.
3. Re-run the checks and the diff report, commit the new evidence, update the date above.

## What is in this folder
| Path | What |
|---|---|
| `branches/*.patch`, `BRANCHES.md` | Patches from the issue fork, with source, tip, base and date. |
| `STATUS-<date>.md` | Related issues and review threads, dated. Re-check on drupal.org before relying on it. |
| `EVIDENCE.md` | Results with exact commits. DRAFT until a person has reviewed it. |
| `playwright/`, `compare/`, `screenreader/` | Generated evidence from the scripts. |
| `ISSUE-COMMENT-DRAFT.md` | A draft for a human to review and post. Nothing is posted automatically. |
