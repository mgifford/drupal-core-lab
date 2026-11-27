# Reproduce #3419891: alternative text textarea

**DRAFT.** Rewritten 2026-11-26 for the re-pinned core. A person has not reviewed it.

Issue: https://www.drupal.org/project/drupal/issues/3419891
MR: https://git.drupalcode.org/project/drupal/-/merge_requests/16984

## The problem in one paragraph

The CKEditor 5 image dialog's Alternative text field was a single-line `<input>` showing about 35 characters; longer text scrolled horizontally out of view. MR !16984 replaces it with a `TextareaView` (`minRows=1`, `maxRows=6`). Reviewer feedback raised two further points: no scrollbar appears when the field is full, and reopening the dialog after an accidental outside click restores the saved text but keeps the previous height.

## Registered comparisons

| Slug | Before | After |
|---|---|---|
| `3419891-pinned` | pristine `0387fb948f7` | MR patch only |
| `3419891-followup` | the same pristine environment | MR patch + follow-up patch |

Both share `envs/baseline-3419891`; the After checkouts are `envs/issue-3419891` (MR) and `envs/issue-3419891-followup` (MR + follow-up). Patches are listed in [BRANCHES.md](BRANCHES.md).

## Build

```
node scripts/doctor.mjs 3419891-pinned
node tools/compare/setup.mjs 3419891-pinned --reinstall
node tools/compare/setup.mjs 3419891-followup --reinstall
node scripts/lab-env.mjs start 3419891-followup
```

`--reinstall` is required when a site exists: applying the recipe a second time is refused by core's recipe applier when the active config differs (`The configuration 'core.entity_form_display.node.page.default' exists already and does not match the recipe's configuration`). It reinstalls both sides, so Before and After still start from the same state.

The follow-up checkout's bundle is already in the patch. If the JavaScript source is edited again:

```
cd envs/issue-3419891-followup
ddev exec bash -lc "cd core && corepack yarn build:ckeditor5"
```

## Recipe path

`recipes/repro_3419891/config/` (not `config/install/`). At this core revision a recipe's own configuration is read from `<recipe>/config`; the old `config/install` layout imported nothing. Both sides use the corrected recipe.

## Run the evidence

```
node tools/playwright/evaluate-3419891.mjs 3419891-pinned --browser=chromium
node tools/playwright/evaluate-3419891.mjs 3419891-pinned --browser=webkit
node tools/playwright/evaluate-3419891.mjs 3419891-followup --browser=chromium
node tools/playwright/evaluate-3419891.mjs 3419891-followup --browser=webkit
node tools/playwright/evaluate-3419891.mjs 3419891-followup --browser=chromium --scheme=dark
node tools/playwright/evaluate-3419891.mjs 3419891-followup --browser=chromium --forced-colors
node tools/playwright/evaluate-3419891.mjs 3419891-followup --browser=chromium --viewport=480x900
node tools/playwright/screenreader-3419891.mjs 3419891-followup
node scripts/lint.mjs 3419891-followup
```

Expected: `3419891-pinned` → `reproduced-not-fixed` with `reopen-cancel` failing; `3419891-followup` → `reproduced-and-fixed` with no failing functional requirement. Each run writes `results.json`, `SUMMARY.md` and screenshots to `reports/issues/<nid>/playwright/<stamp>-<condition>/`.

## Regression test

```
cd envs/issue-3419891-followup
ddev phpunit core/modules/ckeditor5/tests/src/FunctionalJavascript/CKEditor5Test.php --filter testAlternativeTextFormResetsAfterCancel
```

Passes on the follow-up. On the MR alone it fails with `Failed asserting that 136.0 is less than 136.0`.

## Known lab-side pitfalls seen while building this

- The add-on rebuilds a per-project web image; a per-project image is the same DDEV web image under a different tag. Reusing an existing built tag avoids a 13-minute build. This does not change site code, which comes from the checkout.
- Mutagen can lag behind `lab-site.sh` on a busy machine; `dr recipe:apply` may run before the `recipes/` copy reaches the container. A retry after a successful flush, or `--reinstall`, recovers.
- `ddev stop` removes the project containers; this DDEV configuration keeps the database in the web container, so stopping a project discards its site database. Use `ddev restart` for a pause.
- Docker Desktop restarted during this work and stopped every container. `docker start ddev-router` followed by `ddev start` in each project restored the sites with their databases intact.
