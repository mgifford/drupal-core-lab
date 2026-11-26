# Reproduce #3630425 with Default Admin

Execution target: local DDEV. Prepared without Docker/DDEV.
Comparison: 3630425-pinned. Recipe: recipes/repro_3630425/recipe.yml, on a Standard install. No post-recipe script. Before has no patches; After applies the main-based MR port including local regression tests; the production fix is unchanged from MR !17421 at f1f524f92276. See BRANCHES.md for full revisions and hash.

```sh
node scripts/doctor.mjs 3630425-pinned
node tools/compare/setup.mjs 3630425-pinned --check-patches
node tools/compare/setup.mjs 3630425-pinned
node scripts/lab-env.mjs start 3630425-pinned --browser
```

Stop the previously running pair before starting this one. In the viewer, open /node/add/article. The recipe puts Lab multi-value text near the top with First sample and Second sample defaults. Find its Remove controls. Run checks. Before should fail the two header-label checks; After should pass. The displayed forms should otherwise look the same.

The first header spans two columns; the affected actions header is the second DOM th and the third logical column. Inspect it in DevTools. After contains a visually-hidden span with Operations. The Order header is separate.

Enable Best-practice rules under Audits if using the viewer's live axe checks. A WCAG-tag-only scan can omit empty-table-header. The dedicated evaluator always runs this rule explicitly.

In another terminal:

```sh
node tools/playwright/evaluate-3630425.mjs 3630425-pinned
node scripts/lint.mjs 3630425-pinned
node scripts/coverage.mjs 3630425
```

The evaluator checks initial and AJAX add/remove states with trusted input, saves header DOM, accessibility snapshots, screenshots, explicit axe-rule results and the normal lab context. It does not save a node. Manually check keyboard focus and announcement quality. For a future main rerun, use 3630425-latest after checking patch applicability.

## MR !17622 comparison (registered, not yet built)

The preferred upstream proposal is now MR !17622, registered as `3630425-mr17622`. Before is the same pristine pin and recipe as `3630425-pinned`; After is the pin plus `branches/17622-090a74cd28aa.patch` (head `090a74cd28aa`, base `555acb124a50`). Do not reuse results from !17421 or from the Lab's main port for this variant.

```sh
node scripts/doctor.mjs 3630425-mr17622
node tools/compare/setup.mjs 3630425-mr17622
node scripts/lab-env.mjs start 3630425-mr17622
node tools/playwright/evaluate-3630425.mjs 3630425-mr17622
stamp=$(find reports/issues/3630425/playwright -mindepth 1 -maxdepth 1 -type d 2>/dev/null | sort | tail -1)
node tools/playwright/screenreader-3630425.mjs 3630425-mr17622 --mode=virtual --from="${stamp%/}"
node tools/playwright/screenreader-3630425.mjs 3630425-mr17622 --mode=voiceover
```

The virtual mode reuses the table HTML the evaluator saved, so pass the evaluator run folder. The second line picks the newest run without a placeholder. The VoiceOver mode needs an exclusive machine and Safari; it opens one new Safari window and closes only that window.

The MR test is `core/modules/field/tests/src/Functional/FormTest.php --filter testFieldFormUnlimited`. On After it runs in place. On Before, copy the After test file into the Before container at `/tmp` and run it there, so the baseline checkout stays pristine:

```sh
web=$(docker ps --format '{{.Names}}' | grep '^ddev-repro-baseline-3630425-web$')
docker cp envs/issue-3630425-mr17622/core/modules/field/tests/src/Functional/FormTest.php "$web:/tmp/FormTestMr17622.php"
cd envs/baseline-3630425 && ddev phpunit /tmp/FormTestMr17622.php --filter testFieldFormUnlimited
cd ../issue-3630425-mr17622 && ddev phpunit core/modules/field/tests/src/Functional/FormTest.php --filter testFieldFormUnlimited
```

Expected: the before run fails on the new assertions; the after run passes. If PHPUnit refuses a test file outside the checkout, stop and record that; do not edit the baseline. The Lab's `MultipleValueWidgetTest` AJAX test in `branches/3630425-main-mr17421.patch` stays as supplemental coverage and is not added to the upstream MR.
