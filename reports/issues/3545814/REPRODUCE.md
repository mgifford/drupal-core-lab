# Reproduce #3545814: Exposed filters with exposed operators are missing accessible names

**DRAFT.** The commands below were run on 2026-11-27. The reproduction is scripted and recorded; a person has not yet done an independent keyboard and screen-reader pass.

Issue: https://www.drupal.org/project/drupal/issues/3545814  
Merge request: [!13201](https://git.drupalcode.org/project/drupal/-/merge_requests/13201), branch `3545814-numeric-filter-value-field-missing-name`  
Fork: https://git.drupalcode.org/issue/drupal-3545814.git

## What is compared

| | |
|---|---|
| Primary variant | `3545814-pinned` |
| Third proposal | `3545814-proposal-c` (the same MR plus one-line proposal C) |
| Before | `envs/baseline-3545814` — pristine core `87de7098664fd7bb741f51d47ec750ab0a178c5a` (2026-07-25), the merge request's base |
| After | `envs/issue-3545814` — the same core with `branches/3545814-numeric-filter-value-field-missing-name.patch` (MR !13201, head `d7e538c35ac3526ba1a0e0e8a441586f57bba312`, 2026-07-26) |
| After (proposal C) | `envs/issue-3545814-c` — the MR plus `branches/3545814-proposal-c-hide-numeric-value-label.patch` |
| Recipe | [`recipes/repro_3545814/`](../../../recipes/repro_3545814/) |
| View | `/repro-3545814` (page display), preview at `/admin/structure/views/view/repro_3545814/edit` |
| Theme | the site's front-end theme for the View page; the admin theme for the View configuration |

Both sides use the same core commit, recipe, content and theme settings. The MR is the only difference on the primary variant.

## Why a recipe, not Umami

The issue's steps use Umami (`ddev si -y demo_umami`) because the Standard profile no longer installs content types (comment #14). The Lab installs Standard only (`scripts/lab-site.sh`), so the recipe composes core's own test fixture `core/tests/fixtures/recipes/article_content_type` with `core/recipes/tags_taxonomy`, adds `field_tags` to Article, imports a small View, and seeds two terms and four articles. It is smaller than an Umami install and keeps both sides identical.

## Fixture

- Vocabulary `tags` with terms `News` and `Tutorial`.
- Article content type with a `Tags` (`field_tags`) term reference field, cardinality unlimited.
- Four published articles: `Alpha` (News), `Beta` (News, Tutorial), `Gamma` (Tutorial), `Delta` (no tags).
- View `repro_3545814`, base table `node_field_data`, page at `/repro-3545814`, fields Node ID and Title, pager full:
  - `ID (exposed operator)` — numeric `nid`, exposed, operator exposed (`id_open`, `id_open_op`).
  - `Content type` — bundle `type`, exposed, operator exposed (`type`, `type_op`).
  - `Tags` — taxonomy term filter (`taxonomy_index_tid`, vocabulary `tags`), exposed, operator exposed (`tags`, `tags_op`).
  - `ID (fixed operator)` — numeric `nid`, exposed value with a fixed `=` operator (`id_fixed`), the manual-test case from the issue summary.
- The exposed form is the basic Views plugin (no AJAX); submissions are normal GET requests.

## Build

```bash
node tools/compare/setup.mjs 3545814-pinned --check-patches
node tools/compare/setup.mjs 3545814-pinned
node scripts/lab-env.mjs start 3545814-pinned
```

For proposal C:

```bash
node tools/compare/setup.mjs 3545814-proposal-c --check-patches
node tools/compare/setup.mjs 3545814-proposal-c
```

The build installs Standard, applies `repro_3545814`, runs `seed.php` and clears caches. Re-applying the recipe is safe (`config.strict: false`; the View config gains a UUID after its first import).

## Steps to see the defect

1. Open `/repro-3545814` on both sides (anonymous access is enough; the evaluator logs in).
2. Inspect the three exposed filters that expose an operator. Before: the numeric value field, the Content type select and the Tags select have no `<label>` and no other name. The fieldset legend (`ID (exposed operator)`, `Content type`, `Tags`) groups them but does not name them.
3. The `ID (fixed operator)` filter is the visual-regression control: it has a visible label before and must keep it.
4. Open the View configuration preview (`/admin/structure/views/view/repro_3545814/edit`, "Update preview") and inspect the same controls.
5. Submit filters with real input and compare the result rows: `>` 2, between 2 and 3, empty, Content type Article, Tags News, fixed ID 3.

## Run the evidence

```bash
node tools/playwright/evaluate-3545814.mjs 3545814-pinned
node tools/playwright/evaluate-3545814.mjs 3545814-proposal-c
node tools/playwright/tree-diff.mjs 3545814-pinned
node scripts/lint.mjs 3545814-pinned
```

The evaluator writes `reports/issues/3545814/playwright/<stamp>-<envTag>/`. Use `--browser=webkit`, `--scheme=dark`, `--forced-colors` and `--viewport=480x900` for the matrix rows.

## Proposed test coverage

The proposal modifies two existing functional tests and adds one test view (no new test class, no new site installation beyond the existing classes):

- `core/modules/views_ui/tests/src/Functional/FilterNumericWebTest.php` — after exposing the operator, assert the numeric value field has a native label whose text is `Value`, taken from the rendered element's own ID, and that the fieldset legend still carries the configured label.
- `core/modules/views/tests/src/Functional/Plugin/FilterTest.php` — new method `testExposedOperatorLabels()` on the existing test class, importing one small new test view (`views.view.test_filter_exposed_operator_labels.yml`), asserting the numeric value field is labelled `Value` and the content type select is labelled `Content types`.
- No new Nightwatch test.

Apply it to a checkout with:

```bash
git apply reports/issues/3545814/branches/3545814-tests-accessible-names.patch
```

The tests obtain IDs from the rendered elements and use Drupal-generated paths, so they also run when Drupal is installed in a subdirectory.

`scripts/try-tests.mjs` refuses to overwrite files that exist in the checkout, so the two modified tests were run with `ddev phpunit` on both sides directly (logs in `tests/`), and the checkouts were restored afterwards.

## Expected result

- The three value controls gain an accessible name on After; Before they have none.
- The fixed-operator filter's label, the fieldset legends, the operator names and every result set are unchanged.
- The two proposed test methods fail on Before and pass on After.
- Proposal C keeps the numeric accessible name but does not add the visible `Value` label that the MR alone adds.

## Not covered here

Date, string and boolean filters, multiple-value selects and grouped exposed filters are not in this View; see [FILTER-MATRIX.md](FILTER-MATRIX.md). Firefox, a real screen reader and a person's keyboard pass were not run.
