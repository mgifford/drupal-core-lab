# #3593502: Introduce a new Menu UI to resolve memory issues and improve user experience

This lab compares unchanged Drupal core with the complete proposed result:

1. MR !15975.
2. The review interdiff in this report.

It does not update the MR or post to Drupal.org. The report, recipe, interdiff,
tests, and local evidence stay in this repository for a person to cite.

## What is built

| Side | Code | Environment |
|---|---|---|
| Before | Pinned, unchanged Drupal core | `envs/baseline-3593502` |
| After | The same core plus MR !15975, then the interdiff | `envs/issue-3593502` |

The ordered patch stack is:

1. `reports/issues/3593502/branches/patch-1-mr-15975.patch`
2. `reports/issues/3593502/interdiff/15975-to-review-fixes.interdiff`

Do not apply `branches/3593502-follow-up-review-fixes.patch` as a third patch.
It is a byte-identical convenience copy of patch 2.

The pinned variant uses core
`a7c1655a5fa9b94c61f8517a6c35068fc54acabf`. The latest variant uses whatever
core `main` points to when its environments are first created.

## 1. Stop the previous comparison

From the lab repository root:

```shell
node scripts/lab-env.mjs status
node scripts/lab-env.mjs stop <previous-slug>
```

Replace `<previous-slug>` with the pair that is running. Stopping preserves its
database and files. Do not use `delete` unless you intend to remove that pair.

If an older, incomplete #3593502 pair already exists, inspect it first:

```shell
node scripts/doctor.mjs 3593502-pinned
```

Use the normal build command below. If setup reports that the recipe or patch
record differs, use `--reinstall` or `--refresh-patches` only as the message
instructs. Both operations affect disposable lab environments, not this report.

## 2. Check the machine and patch stack

```shell
node scripts/doctor.mjs 3593502-pinned
node tools/compare/setup.mjs 3593502-pinned --check-patches
```

The patch check must report both patches, in the order above, as applying
cleanly. Stop if patch 1 fails. Patch 2 is an interdiff and cannot be applied
directly to unchanged core.

## 3. Build the pinned pair

```shell
node tools/compare/setup.mjs 3593502-pinned
```

This creates both Drupal worktrees, installs their DDEV sites, applies the same
recipe to both, and seeds 15,000 links into Main navigation. On After only,
`seed-menu.php` detects and enables the experimental `menu_tree_ui` module.
Seeding can take several minutes.

If setup was interrupted, rerun the same command. If the recipe reports a
partly seeded menu, reset this pair rather than adding more links to the partial
tree:

```shell
node scripts/lab-env.mjs reset 3593502-pinned --yes
```

Reset reinstalls both disposable sites. It does not change the patch or report.

## 4. Start the pair and viewer

```shell
node scripts/lab-env.mjs start 3593502-pinned --browser
```

Without `--browser`, open <http://localhost:8100>. The initial page is:

```text
/admin/structure/menu
```

On each side, find **Main navigation** and use its primary action. On Before the
unchanged label is **Edit menu**. On After the MR deliberately changes the
primary action to **Edit links**. Before opens
`/admin/structure/menu/manage/main`, the unchanged all-links form. With 15,000
seeded links, it may exhaust the configured PHP memory limit. That failure
reproduces the issue; it is not a successful page-load comparison.

After opens `/admin/structure/menu/manage/main/tree`, the experimental scalable
tree added by the MR. It should render the top level without building all 15,000
links into one form.

Do not expect `/admin/structure/menu/manage/main/tree` to work on Before. The
route does not exist in unchanged core, so a **Page not found** response there is
correct. The MR also moves the patched side's classic fallback to
`/admin/structure/menu/manage/main/links`, labelled **Edit links (no js)**. For a
direct classic-form comparison, use `/admin/structure/menu/manage/main` on
Before and `/admin/structure/menu/manage/main/links` on After.

## 5. Run the focused browser evaluation

```shell
node tools/playwright/evaluate-3593502.mjs 3593502-pinned
```

The evaluator:

- delays After's `/session/token` response by three seconds;
- clicks an Enabled checkbox before the token arrives;
- checks the eventual request has a token and persists;
- restores the original checkbox value;
- dismisses search results with a real Escape key press;
- dismisses them again with a real outside click;
- records axe results, JavaScript errors, and forced-colours computed styles.

Run the coverage combinations that matter to this review:

```shell
node tools/playwright/evaluate-3593502.mjs 3593502-pinned --browser=chromium --scheme=dark
node tools/playwright/evaluate-3593502.mjs 3593502-pinned --browser=chromium --forced-colors
node tools/playwright/evaluate-3593502.mjs 3593502-pinned --browser=firefox
node tools/playwright/evaluate-3593502.mjs 3593502-pinned --browser=webkit
node tools/playwright/evaluate-3593502.mjs 3593502-pinned --browser=chromium --viewport=390x844
```

Generated evidence goes under `reports/issues/3593502/playwright/`.

## Compare MR !15975 directly with the review interdiff

The default variants compare unchanged Drupal core with the completed patch
stack. The `3593502-interdiff` variant changes the baseline:

| Side | Patch stack |
|---|---|
| Before | MR !15975 exactly as saved in `patch-1-mr-15975.patch` |
| After | MR !15975, followed by `15975-to-review-fixes.interdiff` |

Both environments start from the same pinned core commit and receive the same
15,000-link recipe. The lab defines three reusable states and three comparisons:

| Variant | Before | After |
|---|---|---|
| `3593502-mr-only` | Drupal core | MR !15975 |
| `3593502-interdiff` | MR !15975 | MR !15975 plus interdiff |
| `3593502-pinned` | Drupal core | MR !15975 plus interdiff |

The variants reuse the same three environments. This avoids building duplicate
sites and keeps each comparison to two full-width frames.

```shell
node scripts/doctor.mjs 3593502-interdiff
node tools/compare/setup.mjs 3593502-interdiff --check-patches
node tools/compare/setup.mjs 3593502-interdiff
node scripts/lab-env.mjs start 3593502-interdiff --browser
```

The viewer opens `/admin/structure/menu/manage/main/tree` on both sides. The
labels should identify the sides as **MR !15975** and
**MR !15975 + review interdiff**.

To make all three pairings available in the viewer selector, build the default
pair and the interdiff pair, then start each once. The second start replaces the
viewer process but leaves the shared environments running:

```shell
node tools/compare/setup.mjs 3593502-pinned
node tools/compare/setup.mjs 3593502-interdiff
node scripts/lab-env.mjs start 3593502-pinned
node scripts/lab-env.mjs start 3593502-interdiff --browser
```

At that point the three Drupal environments are running and the comparison
viewer shows a **Compare patch stacks** row with direct buttons for all three
pairings. The general Comparison selector also lists them. An unbuilt pairing
is shown as **build required** instead of being silently omitted. Select it to
see the exact setup command in the viewer status. If an environment has been
stopped, start the desired variant again instead of treating a blank frame as evidence.
Use `stop`, not `delete`, while working across these variants. The variants
share environments, so deleting one pair can remove a site used by another
pair.

Run the focused evaluator against this pair:

```shell
node tools/playwright/evaluate-3593502.mjs 3593502-interdiff
```

### Stress-test the 15,000-link pair

The recipe installs the same data on both sides and enables request-level peak
memory logging. The repeatable resource benchmark records response time, PHP
peak memory, and sampled web/database container use as both JSON and Markdown.
It makes requests sequentially, so the Drupal versions do not compete during a
measured request.

For the normal MR-versus-interdiff comparison, the default is exactly the two
selected environments:

```shell
node scripts/measure-resources.mjs 3593502-interdiff --runs=10 --warmups=2
```

To include unchanged Drupal core as a third environment, opt in explicitly:

```shell
node scripts/measure-resources.mjs 3593502-interdiff --group --runs=10 --warmups=2
```

Use `--cold` for a separate cold-cache trial and `--page=/path` to measure a
different route. Results are saved under
`reports/issues/3593502/resources/`; refresh the viewer's **Resources** tab to
display the newest matching result.

If the environments were built with an earlier copy of the recipe, reapply the
updated recipe first. Seeding is idempotent, so this does not create another
15,000 links:

```shell
bash scripts/lab-site.sh apply baseline-3593502 repro_3593502
bash scripts/lab-site.sh apply issue-3593502-mr-only repro_3593502
bash scripts/lab-site.sh apply issue-3593502 repro_3593502
```

The benchmark clears its own request log after login and warm-up. For
interaction coverage, also run the evaluator and exercise the viewer in both
frames:

1. Reload the tree three times, alternating which side loads first.
2. Expand the same branch through at least four levels.
3. Search for `Lab seed 1.1`, `Lab seed 9`, and a string with no result.
4. Toggle and restore ten Enabled checkboxes.
5. Perform ten keyboard moves and ten pointer moves, cancelling half and saving
   half.
6. Repeat once at 390 CSS pixels and once in forced-colours mode.

Do not reduce this to a single fastest run. Compare median navigation time,
slowest navigation time, peak memory for the full tree page, peak memory for
child and search requests, HTTP failures, JavaScript errors, and rendered row
counts. The evaluator records browser navigation timing and initial row count;
the PHP log records server memory for each request.

## 6. Run the new Drupal tests and code checks

The interdiff adds the test code directly to the After checkout. Run:

```shell
cd envs/issue-3593502
ddev phpunit core/modules/menu_tree_ui/tests/src/FunctionalJavascript/MenuTreeUiColumnToggleTest.php
ddev phpunit core/modules/menu_tree_ui/tests/src/FunctionalJavascript/MenuTreeUiSearchTest.php
cd ../..
node scripts/lint.mjs 3593502-pinned
```

The column test replaces `/session/token` with a three-second delayed test
controller and proves that an immediate toggle still reaches storage. The
search tests cover Escape and outside-click dismissal while preserving the
query.

## 7. Perform the manual checks

The automation cannot decide these results. Record them in the viewer's Manual
panel and download the log.

- Keyboard: navigate, expand, collapse, pick up, move, drop, and cancel. Confirm
  visible focus and useful announcements after each change.
- Forced colours: check the handle, grabbed row, target outline, drop position,
  and focus indicator in forced light and forced dark.
- Screen reader: check names, levels, expanded state, loading, move, save,
  cancellation, and errors.
- Reflow: test 200 and 400 percent zoom and a 320 CSS-pixel viewport.
- Pointer: complete moves without a path-based drag gesture.
- Search: confirm Escape and outside click close results without clearing the
  query.
- Performance: open and use the new UI with 15,000 links. Record response time
  and peak memory rather than relying on visual responsiveness alone.

The current 15,000-link recipe has fan-out 10. It does not test the known
wide-sibling risk. A separate data shape with 5,000 top-level siblings and
5,000 children under one parent is still required before claiming the memory
problem is bounded at every level.

## 8. Test against current core

After the pinned review is understood:

```shell
node tools/compare/setup.mjs 3593502-latest --check-patches
node tools/compare/setup.mjs 3593502-latest
node scripts/lab-env.mjs start 3593502-latest --browser
node tools/playwright/evaluate-3593502.mjs 3593502-latest
```

If the stack no longer applies, do not edit the downloaded MR patch silently.
Record a reroll as a new patch and explain the change.

## 9. Finish the report

```shell
node scripts/coverage.mjs 3593502
node scripts/index-issues.mjs
node scripts/selftest.mjs
```

Update `EVIDENCE.md` with exact core commits, patch hashes, browser and OS
versions, command results, and the manual findings. Keep it marked DRAFT until a
person has reviewed the evidence.

## What this procedure omits

- It does not post a comment, alter the issue, push to the issue fork, or update
  MR !15975.
- It does not treat axe or computed styles as proof of accessibility.
- It does not test static YAML-link search, atomic multi-operation Save, or the
  unresolved sibling-paging design.
- It does not apply the standalone follow-up patch in addition to the
  interdiff, because that would apply the same changes twice.
