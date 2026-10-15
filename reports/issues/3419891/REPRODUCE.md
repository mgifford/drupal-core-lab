# Reproduce #3419891: Increase size of alternative text field in Image dialog

Issue: https://www.drupal.org/project/drupal/issues/3419891
Pinned core: `47430c368bbd` (main, 2026-10-06). Verified: 2026-10-15.

## The problem in one paragraph

The alternative text field in the CKEditor5 image dialog is a single-line `<input>` showing ~35 characters. When appropriate alternative text is longer, content scrolls horizontally out of view. The fix changes it to a `<textarea>` with `minRows=1, maxRows=6` that grows vertically, keeping all content visible.

## Reproduce it (pinned core, exactly as verified)

    node tools/compare/setup.mjs 3419891-pinned        # builds Before and After, applies recipe and patch
    node scripts/lab-env.mjs start 3419891-pinned --browser
    node tools/compare/serve.mjs 3419891-pinned        # side-by-side viewer
    node tools/playwright/evaluate-3419891.mjs 3419891-pinned   # scripted replay with real input

The patch is from the issue fork branch `3419891-increase-size-of` (7 files changed).

## Steps in the viewer

1. Standard install: Basic page content type with body field using CKEditor5.
2. Open `/node/add/page` in both frames (the viewer logs in).
3. Click in the Body field to activate CKEditor5, then click the Image icon in the toolbar.
4. In the Alternative text field, type a long string: `012345678 12345678 22345678 32345678 42345678 52345678 62345678 72345678`.
5. Before: content scrolls horizontally out of view. After: field grows vertically (up to 6 rows), all content visible.

## Try it on the latest core

    node tools/compare/setup.mjs 3419891-pinned --check-patches    # use 3419891-latest for current core
    node tools/compare/setup.mjs 3419891-latest
    node tools/playwright/evaluate-3419891.mjs 3419891-latest

`3419891-latest` follows `main`, so it answers "does this still reproduce upstream?".

## If the result is not what you expect

| What you see | What it probably means | What to do |
|---|---|---|
| **Before does not fail** (input doesn't scroll) | Upstream may have fixed it, or selectors no longer match | Check the issue and recent commits to the files in the patch. |
| **After still fails** (textarea doesn't grow) | The fix no longer works there | Review the diff of the changed files against current core; update the patch. |
| A patch **does not apply** | Core changed the same lines | Regenerate the patch from the issue fork branch. |
| Everything as expected | Still reproducible | Record the new core commit (see "Re-pin" below). |

## Re-pin to a newer core after verifying

1. Run the `-latest` variant to the end and confirm the walkthrough reports "Reproduced and fixed".
2. Put the verified commit (`git -C envs/issue-3419891-latest rev-parse HEAD`) in `core.commit` of the `-pinned` variant in `tools/compare/variants.json`.
3. Re-run the walkthrough and the diff report, commit the new evidence, update "Pinned core" above.
