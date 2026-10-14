# Branch patches for #3415961

Extracted 2026-10-02 from https://git.drupalcode.org/issue/drupal-3415961.git with `git diff <merge-base> <branch tip>`: only the branch's own changes.
Not rebased onto current `main`. The MR on drupal.org is the source of truth.

| Patch | Source | Tip | Base | Base date and subject | Files |
|---|---|---|---|---|---|
| `branches/3415961-drupalmedia-using-the.patch` | https://git.drupalcode.org/issue/drupal-3415961.git `3415961-drupalmedia-using-the` | 2dfd37b47c7 | 33a306844561 | 2026-01-17 task: #3567650 Remove history from profiles and recipes | 1 |

## Lab test patch (this repository, not from the issue fork)

| Patch | What | Verified |
|---|---|---|
| `branches/3415961-test-focus-stays-in-editor.patch` | Adds `MediaLibraryTest::testFocusStaysInEditorAfterInsert()`. Applies cleanly to core `33a306844561` and `main` `4f9558d85e7`. | 2026-10-13: Before fails, After passes on both cores (see `TEST-EVIDENCE.md`) |
| `branches/3415961-fix-and-test.patch` | The fix patch and the test patch concatenated, for attaching the full MR state at once. | 2026-10-13: both hunks apply cleanly to `33a306844561` and `main` |

