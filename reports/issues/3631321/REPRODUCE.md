# Reproduce #3631321

Installation: follow INSTALL.md in the focused ZIP, copying the named files into your existing lab first. Execution target: local DDEV. Prepared in an environment without Docker or DDEV.

Comparison: `3631321-pinned`. Recipe: `recipes/repro_3631321/recipe.yml`, applied to a Standard install on both sides; test extensions enabled. Languages: English and Farsi. No post-recipe script.

Before stack: reports/issues/3631321/branches/3604037-parent-c8136d010105.patch.
After stack: reports/issues/3631321/branches/3604037-parent-c8136d010105.patch, reports/issues/3631321/branches/3631321-inactive-tab-borders.patch.
Exact base, parent revision, and SHA-256 hashes: BRANCHES.md.

```sh
node scripts/forced-colors-pair.mjs validate
node scripts/forced-colors-pair.mjs 3631321 setup
node scripts/forced-colors-pair.mjs 3631321 start
# In a second terminal, after the viewer and both sites are ready:
node scripts/forced-colors-pair.mjs 3631321 evaluate
node scripts/lint.mjs 3631321-pinned
```

The start command opens the Lab browser with both frames. Choose forced colors light, then dark. Each frame must report forced colors active. In DevTools Rendering, also set prefers-contrast to more for the reporter's exact scenario.

1. Standard install, Default Admin theme, form_test, and Article recipe on both sides. The pinned parent MR is present on both.
2. Open /admin/config/people/accounts at 1280px width. Enable forced colors, dark palette, and more contrast in the lab browser.
3. Select the first, a middle, and the last email tab. Inspect the first and last outer borders and both boundaries beside the selected tab in light and dark palettes.

For RTL, use the actual Farsi route `/fa/admin/config/people/accounts` on both sides, or run the evaluator with `--rtl`. Do not claim a changed `dir` attribute is a complete RTL language test. Inspect keyboard focus, hover, selected erroneous tabs, and the narrow details fallback. Error subject values are changed only on disposable local installations.

Expected Before and After are hypotheses until a Drupal run and human review are recorded. Static CSS fixture tests are not Drupal reproduction evidence. Runtime evaluator records browser/OS versions, environment commits, patch hashes, theme, screenshots, axe findings, and accessibility snapshots.
