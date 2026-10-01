# Testing workflow (hard-coded process)

This directory is the durable home for Drupal-core patch work: the generated patch,
interdiff, issue-queue comment, screen-reader harness, and a full review bundle. It is
committed to the GitHub fork (`origin`) so the work and the *process* survive across
sessions, machines, and different LLMs.

## Layout
```
testing/<issue-id>-<short-title>/
  <issue>-full.patch            # full patch vs branch base (uploadable)
  <issue>-interdiff.patch       # diff vs the previous/aggregate patch
  <issue>-comment.md            # proposed drupal.org issue-queue comment
  <issue>-review-bundle.zip     # everything zipped for quick review
  guidepup/                     # before/after VoiceOver harness + analysis
  src/                          # copies of changed source files for direct review
  README.md                     # what this issue changed + how to verify
core/recipes/replicate_core_testing/   # composite Drupal recipe that builds the test environment
scripts/reset-site.sh           # reset the dev site to a clean baseline
.dddev/commands/host/reset-site  # `ddev reset-site` wrapper
```

## Daily loop (patch -> review -> reset -> next patch)
1. **Develop** the patch in the working tree (e.g. under `core/themes/default_admin`).
2. **Test**:
   ```bash
   ddev exec env SIMPLETEST_BASE_URL=https://drupal-core.ddev.site \
     ./vendor/bin/phpunit -c core core/themes/default_admin/tests/src/Functional/SidebarChildErrorsTest.php
   ddev exec bash ./core/scripts/dev/commit-code-check.sh
   ```
3. **Produce review artifacts** (patch + interdiff + comment + guidepup + bundle):
   ```bash
   git add -N core/themes/default_admin/tests/src/Functional/SidebarChildErrorsTest.php
   git diff HEAD -- core/themes/default_admin > testing/<issue>/<issue>-full.patch
   ```
   Copy the result into `testing/<issue>/` (keep the bundle + comment in sync).
4. **Reset for the next patch** (complete DB reset; code is never touched):
   ```bash
   ddev reset-site            # restore saved snapshot
   ddev reset-site --capture  # after intentionally changing the baseline
   ddev drush uli             # log back in
   ```
5. **Push progress** to GitHub so it is not lost:
   ```bash
   git add testing/ scripts/ recipes/ .ddev/commands/host/reset-site
   git commit -m "Issue #<n>: store review artifacts + reset/recipe tooling"
   git push origin "$(git branch --show-current)"
   ```

## Building the test environment (recipe, not a blank slate)
The baseline is **not** a bare install. It is a standard profile plus the
`core/recipes/replicate_core_testing` recipe, which layers comments, taxonomy, media
types, editorial workflow, multiple text formats, user pictures and responsive images,
and sets Default Admin as the administration theme so the sidebar / advanced-group
behavior can be reproduced.

```bash
ddev exec drush site:install standard -y
ddev exec drush recipe core/recipes/replicate_core_testing
ddev drush uli
```

`ddev reset-site` restores a saved database snapshot (fast) and falls back to the recipe
rebuild above when no snapshot exists. The snapshot is machine-local; the **recipe is the
portable, committed source of truth** for the environment.

## Disclosure
Any drupal.org issue-queue prose in `*/comment.md` ends with the required line:
`Generated with the help of an LLM.`
