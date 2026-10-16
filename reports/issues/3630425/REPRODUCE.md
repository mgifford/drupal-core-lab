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
