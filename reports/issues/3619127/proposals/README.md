# #3619127: proposed follow-up changes to MR !16895 (DRAFT, not posted)

Three patches that stack on top of the MR branch tip. Each is a suggestion for the reviewer discussion on the MR (the objection to `jQuery` in `sidebar.js`, and the saved sidebar preference). They live one level up in this folder.

| Patch (apply in this order) | What it does | Effect |
|---|---|---|
| `../branches/3619127-forms-sidebar-with-ife.patch` | The MR itself (reference, extracted from the issue fork; base `d29add7ebc1`) | Opens the sidebar when the URL fragment changes |
| `../patch-0-vanilla-js-no-jquery.patch` | Removes the jQuery dependency from `sidebar.js` (vanilla JS), drops `core/jquery` from the `sidebar` library | Answers the review objection about jQuery |
| `../patch-1-no-persist-and-waits.patch` | Opens the sidebar from the fragment handler **without** saving the open state, and replaces fixed `wait(500)` pauses in the test | The user's saved preference is not overwritten (checked by the test's `localStorage` assertion); less flaky waits |
| `../patch-2-optional-base-class.patch` | *Optional*: a `DefaultAdminJavascriptTestBase` test base class suggested by a reviewer | Only if the base class is wanted |

The uncommitted work in the author's local checkout (`~/drupal-core`, branch `test-3619127-vanilla`) was compared with these patches and is identical to patches 0 + 1 + 2 applied to that branch's committed files, so nothing exists only there.

## Apply and check
    node tools/compare/setup.mjs 3619127-pinned          # Before (core d29add7ebc1) and After (MR + patches 0, 1); resumable
    node scripts/lab-env.mjs start 3619127-pinned
    node tools/playwright/walkthrough.mjs 3619127-pinned  # real mouse and keyboard input; exit code 2 if anything is not as expected
    (cd envs/issue-3619127-vanilla && ddev phpunit core/themes/default_admin/tests/src/FunctionalJavascript/AdminInlineFormErrorsTest.php)

## Replication recipes
- Starting state: `recipes/ife_sidebar_repro/recipe.yml` (Article content type, Inline Form Errors on, Default Admin); applied by `setup.mjs`.
- A newer core: `node tools/compare/setup.mjs 3619127-latest` (follows current `main`; `--check-patches` tells you whether the stack still applies).
- Everything in one zip: `bundles/drupal-repro-3619127-<date>.zip` (`node scripts/make-bundle.mjs 3619127-pinned`).
- Steps, expected result and the checks are in `tools/compare/variants.json` (shown in the viewer) and `../REPRODUCE.md`.
