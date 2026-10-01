# 3370946 refresh notes (against current main)

## Deliverables

- New refreshed patch from current `main`:
  - `3370946-page-title-refresh-main.patch`
- Old backport patch downloaded for comparison:
  - `3370946-page-title-backport-10-2-10.patch`
- Diff between old and new patch artifacts:
  - `3370946-refresh-vs-2024-11-12.patch.diff`

## What changed in this refresh

This refresh was reconstructed from current `main` and the effective behavior of the historical issue branch, not by preserving the 128-commit branch history.

### 1) Core title-context model retained and modernized

- `PageTitleBlock` now supports contextual section titles via `base_route_title`.
- Section title + visually-hidden current title behavior is retained for orientation/accessibility.
- The block is now container-injected and uses current services.

Key file:
- `core/lib/Drupal/Core/Block/Plugin/Block/PageTitleBlock.php`

### 2) HTML `<title>` context support adapted to current architecture

- Current `main` moved preprocessing from procedural `theme.inc` to `ThemePreprocess` service methods.
- The contextual base route title logic was applied in `ThemePreprocess::preprocessHtml()`.

Key file:
- `core/lib/Drupal/Core/Theme/ThemePreprocess.php`

### 3) Base-route title resolution kept as explicit services

- `BaseRouteTitleResolver` service/class is included.
- `RequestGenerator` service/class is included in `Drupal\Core\Routing` namespace.
- Service aliases were aligned to current namespace usage.

Key files:
- `core/lib/Drupal/Core/Controller/BaseRouteTitleResolver.php`
- `core/lib/Drupal/Core/Routing/RequestGenerator.php`
- `core/core.services.yml`

### 4) Route/local-task integration updates preserved

- Local task manager changes that support base-route title lookup are included.

Key files:
- `core/lib/Drupal/Core/Menu/LocalTaskManager.php`
- `core/lib/Drupal/Core/Menu/LocalTaskManagerInterface.php`

### 5) Config/update-path behavior is currently still included

- The patch currently includes post-update and default-config wiring for `base_route_title` on page-title blocks.
- Claro default remains enabled in this implementation path.

Key files:
- `core/modules/block/block.post_update.php`
- `core/modules/system/config/schema/system.schema.yml`
- `core/themes/claro/config/optional/block.block.claro_page_title.yml`
- plus corresponding profile/theme config updates

### 6) Tests carried forward and updated for modern PHPUnit

- Added unit tests for `RequestGenerator` and updated to PHPUnit 12 data providers.
- Added functional test coverage for page title block behavior.
- Related functional expectations were updated where head-title behavior changes.

Key files:
- `core/tests/Drupal/Tests/Core/Routing/RequestGeneratorTest.php`
- `core/modules/block/tests/src/Functional/PageTitleBlockTest.php`
- plus related functional test expectation updates

## What differs from the 2024-11-12 backport patch

At a high level:

- Rebased onto current `main` architecture (including `ThemePreprocess` service approach).
- Reconstructed as a clean contemporary diff, not a historic backport carry-forward.
- Includes modern test-framework compatibility fixes needed for PHPUnit 12.
- Keeps behavior scope focused on current core service structure and test baselines.

For exact line-level comparison, see:
- `3370946-refresh-vs-2024-11-12.patch.diff`

## Validation run in this environment

- Local site: `https://drupal-core.ddev.site/`
- Initial 500 was resolved by clearing caches after conflict cleanup.
- Site currently responds `HTTP/2 200`.

Automated checks run:

- `RequestGeneratorTest`: passes (`8 tests, 10 assertions`).
- `PageTitleBlockTest`: class boot issues were fixed (separate-process attribute added), but execution in this shell requires `SIMPLETEST_BASE_URL` env setup for functional BrowserTestBase runs.

## Steps to reproduce (including screenshots)

Use these steps to recreate the same before/after screenshots on `Manage display` for the Article content type.

1. Start and verify local site.

```bash
ddev start
ddev exec "./vendor/bin/drush cr -y"
ddev exec "./vendor/bin/drush uli --uri=https://drupal-core.ddev.site"
```

2. Ensure an `article` content type exists with enough fields to mirror the proposed screen.

```bash
ddev exec "./vendor/bin/drush scr /var/www/html/.tmp/article_setup.php && ./vendor/bin/drush cr -y"
```

Notes:
- The setup script used during this refresh is at `.tmp/article_setup.php`.
- It creates `article` and adds `Subtitle`, `Standfirst`, `Read time (minutes)`, and `Published on` fields, plus display settings for `default` and `teaser`.

3. Capture BEFORE (contextual title OFF):

```bash
ddev exec "./vendor/bin/drush cset block.block.claro_page_title settings.base_route_title 0 -y --uri=https://drupal-core.ddev.site"
ddev exec "./vendor/bin/drush cset block.block.olivero_page_title settings.base_route_title 0 -y --uri=https://drupal-core.ddev.site"
ddev exec "./vendor/bin/drush cr -y"
```

Open:
- `https://drupal-core.ddev.site/admin/structure/types/manage/article/display/default`

Expected before-state heading at this viewport:
- Visible H1: `Manage display`

4. Capture AFTER (contextual title ON):

```bash
ddev exec "./vendor/bin/drush cset block.block.claro_page_title settings.base_route_title 1 -y --uri=https://drupal-core.ddev.site"
ddev exec "./vendor/bin/drush cset block.block.olivero_page_title settings.base_route_title 1 -y --uri=https://drupal-core.ddev.site"
ddev exec "./vendor/bin/drush cr -y"
```

Open the same URL again:
- `https://drupal-core.ddev.site/admin/structure/types/manage/article/display/default`

Expected after-state heading at this viewport:
- Visible H1: `Article`

5. Optional second-level local task screenshot:

Open:
- `https://drupal-core.ddev.site/admin/structure/types/manage/article/display/teaser`

This gives the `Default` vs `Teaser` local-task context on the same route family.

## Screenshot comparison summary

Use this summary in the issue comment alongside the before/after images.

- Route used for both captures:
  - `https://drupal-core.ddev.site/admin/structure/types/manage/article/display/default`
- Viewport:
  - Same browser width for both screenshots (no resize between captures).

Before (`base_route_title = 0`):
- Visible H1 is the task name only: `Manage display`.
- Entity context (`Article`) appears only in breadcrumb/local-task context.

After (`base_route_title = 1`):
- Visible H1 is contextualized: `Article`.
- Task remains clearly represented in local tasks (`Manage display` with `Default` sub-tab active).

Observed impact:
- The contextualized heading keeps page context (the content type/entity area) visible at all times.
- The task context is still present in tabs and the document title.
- At narrow/mobile-like widths this improves orientation by avoiding a generic task-only H1.

## Guidepup logs (before/after)

Generated artifacts (repo root):

- `3370946-guidepup-before.log`
- `3370946-guidepup-after.log`
- `3370946-guidepup-before-vs-after.diff`
- `3370946-guidepup-before.normalized.log`
- `3370946-guidepup-after.normalized.log`
- `3370946-guidepup-before-vs-after.normalized.diff`
- `3370946-guidepup-before-vs-after.normalized.counts.diff`

Scope used for both logs:

- URL: `https://drupal-core.ddev.site/admin/structure/types/manage/article/display/default`
- Before state: `base_route_title = 0`
- After state: `base_route_title = 1`

Result summary:

- Before phrases: `367`
- After phrases: `370`
- The logs are highly similar overall; the primary semantic differences are in heading/tab announcements around the page title context.
- This matches the expected behavior that contextual title changes should be mostly presentation/context orientation changes rather than broad semantic restructuring.

Normalization note (recommended for review):

- The raw diff includes step-number churn, which can obscure meaningful changes when one insertion shifts all subsequent indices.
- Use the normalized logs/diffs for issue review because they strip step numbers and volatile headers.

Reproduce normalized files from raw logs:

```bash
awk 'NR>4 {sub(/^[[:space:]]*[0-9]+\. /, ""); print}' 3370946-guidepup-before.log > 3370946-guidepup-before.normalized.log
awk 'NR>4 {sub(/^[[:space:]]*[0-9]+\. /, ""); print}' 3370946-guidepup-after.log > 3370946-guidepup-after.normalized.log
diff -u 3370946-guidepup-before.normalized.log 3370946-guidepup-after.normalized.log > 3370946-guidepup-before-vs-after.normalized.diff || true

sort 3370946-guidepup-before.normalized.log | uniq -c > 3370946-guidepup-before.normalized.counts
sort 3370946-guidepup-after.normalized.log | uniq -c > 3370946-guidepup-after.normalized.counts
diff -u 3370946-guidepup-before.normalized.counts 3370946-guidepup-after.normalized.counts > 3370946-guidepup-before-vs-after.normalized.counts.diff || true
```

## Potential outstanding decisions

1. Configurability question (important)

- This refresh currently keeps the configurable `base_route_title` switch and update-path machinery.
- You may still choose to simplify and remove configurability (opinionated default behavior), as discussed in issue history.

2. Functional test execution in this environment

- To run BrowserTestBase suites locally from this shell, `SIMPLETEST_BASE_URL` and related test env values need to be set for your DDEV test flow.

3. Final issue-level polish

- Depending on your preference, we can trim update-path/config complexity before upload.
- We can also run broader affected suites once your preferred functional test env invocation is confirmed.
