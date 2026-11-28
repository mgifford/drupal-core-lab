# Branch patches for #3466040

Extracted 2026-11-27 from https://git.drupalcode.org/issue/drupal-3466040.git with `git diff <merge-base> <branch tip>`: only the branch's own changes.
Not rebased onto current `main`. The MR on drupal.org is the source of truth.

| Patch | Source | Tip | Base | Base date and subject | Files |
|---|---|---|---|---|---|
| [`branches/3466040-dialog-buttoninputs-not.patch`](branches/3466040-dialog-buttoninputs-not.patch) | https://git.drupalcode.org/issue/drupal-3466040.git `3466040-dialog-buttoninputs-not` | aed1df5e | 97c6ff8b2534 | 2026-11-23 task: #3635770 PHPUnit 13.2 - Replace expectExceptionMessage() with expectExceptionMessageIs*() - later additions | 4 |

## Lab-derived patches (not part of the MR)

These are test-support and test-only artifacts. They do not change production code; the imported MR patch
above is the only production change under test.

| Patch | What it is | Applies to | sha256 |
|---|---|---|---|
| [`branches/3466040-test-support.patch`](branches/3466040-test-support.patch) | The MR's three test/fixture hunks only (`dialog_renderer_test.routing.yml`, `TestController.php`, `ModalRendererTest.php`), with `dialog.position.js` removed. Used to give the **Before** side the same regression-test fixture that the After side gets from the full MR, so `ModalRendererTest::testModalContentGrows` can run on both sides. | base `97c6ff8b2534` | `262dd0fc8d71ec586f3f85ab5f8c2f2fb8de9bf071721975b4b002d871674222` |
| [`branches/3466040-test-hardening.patch`](branches/3466040-test-hardening.patch) | **Proposal only, not applied to the MR.** Adds three assertions to `testModalContentGrows`: the details element is closed before the click and open after it, and `.ui-dialog-content` actually scrolls (`scrollHeight > clientHeight` with `overflow-y: auto/scroll`). The existing test can pass when the click did not open the details element, and a clipping "fix" would satisfy its geometry checks. | MR post-image (test file blob `1dfb9f27f8`) | `322469468dc2693c70ad992aa6be47c87205a6f2d5956139044d6a1ec26f1fe9` |

The full MR patch's own sha256 is
`1adba92d55f15f34d4f98a90277c391efa96b196d4329bdc6efe30f65bfbfae8` (lab extraction). The GitLab-served
diff recorded by `issue-intake.mjs fetch` has sha256 prefix `a0810d63` for 6030 bytes; the lab extraction is
6013 bytes because it is `git diff` output with the default index abbreviation. Both contain the same four
files and the same hunks.

### How the test-support patch was verified

```bash
GIT_INDEX_FILE=/tmp/idx-3466040 git --git-dir=envs/core.git read-tree 97c6ff8b2534
GIT_INDEX_FILE=/tmp/idx-3466040 git --git-dir=envs/core.git apply --cached --check reports/issues/3466040/branches/3466040-test-support.patch
```

exit 0: it applies cleanly to the pinned base. The resulting blobs equal the MR's post-image blobs
(`4a5273852e`, `3cb5741b0a`, `1dfb9f27f8`), and base + test-support differs from base + full MR only in
`core/misc/dialog/dialog.position.js`.
