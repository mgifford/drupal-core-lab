# Reproduce the Default Admin icon revision

## 1. Revisions and objects

```sh
cd ~/svg-review-lab
git --git-dir=drupal.git fetch --depth=120 \
  https://git.drupalcode.org/issue/drupal-3603162.git \
  3603162-consolidate-and-cleanup:refs/lab/mr16166-head
git --git-dir=drupal.git fetch --depth=120 \
  https://git.drupalcode.org/project/drupal.git main:refs/lab/upstream-main
git --git-dir=drupal.git merge-base refs/lab/mr16166-head refs/lab/upstream-main
# 29b0a0b2256eb5ed27df6ec5e4e4e33142a717e8

git --git-dir=drupal.git worktree add --detach work/mr16166 refs/lab/mr16166-head
cd work/mr16166
git switch -c 3603162-svg-revision
git rebase --onto refs/lab/upstream-main 29b0a0b2256eb5ed27df6ec5e4e4e33142a717e8
```

## 2. Static checks

```sh
cd core
node ./scripts/css/postcss-build.js --check \
  --file themes/default_admin/css/base/icons.pcss.css \
  --file themes/default_admin/css/components/autocomplete-loading.module.pcss.css \
  --file themes/default_admin/css/components/file.pcss.css \
  --file themes/default_admin/css/components/form--select.pcss.css \
  --file themes/default_admin/css/components/form--checkbox-radio.pcss.css \
  --file themes/default_admin/css/components/system-status-report-general-info.pcss.css \
  --file themes/default_admin/css/components/more-actions.pcss.css \
  --file themes/default_admin/css/components/tabledrag.pcss.css
./node_modules/.bin/stylelint "themes/default_admin/css/**/*.css"
cd ../..
python3 tools/validate_svgs.py work/mr16166/core/themes/default_admin/images work/evidence/svg-validation.json
node tools/icon_usage.mjs work/mr16166/core/themes/default_admin work/evidence/icon-usage.json
python3 -m unittest discover -s tests -p '*_test.py' -v
```

The CSS build needs the Core `core/node_modules` tree. This session symlinked the existing install's dependencies instead of installing another Composer or Yarn tree.

## 3. Real Drupal components

Use an installed Drupal 12.0-dev site with `default_admin` enabled. This session used the existing `~/drupal-core-lab/envs/baseline-main` SQLite site and replaced only `core/themes/default_admin` with the branch theme, after backing up the original theme.

Required temporary fixture changes:

- `$settings['core_admin_theme_use_sticky_action_buttons'] = 'content_forms';`
- `media`, `media_library` enabled;
- an image media item;
- a `field_media` entity reference on Article with the Media library widget in the content region;
- a nested Main navigation link for tabledrag indentation.

Start the local server:

```sh
cd ~/drupal-core-lab/envs/baseline-main
DRUPAL_DOCROOT=$PWD php -S 127.0.0.1:8899 -t . ~/svg-review-lab/work/router-baseline.php
```

Run the evidence scripts in `work/` with Playwright and the saved authenticated state. The scripts inject Drupal's real AJAX progress markup for the sticky loader and insert the theme's media edit markup in the selected item; these are documented limitations.

## 4. PHPUnit

```sh
cd ~/drupal-core-lab/envs/baseline-main
SIMPLETEST_DB='sqlite://localhost//Users/mgifford/drupal-core-lab/envs/baseline-main/sites/default/files/.test.sqlite' \
  ./vendor/bin/phpunit -c core core/themes/default_admin/tests/src/Unit core/themes/default_admin/tests/src/Kernel
```

Functional tests require a web server that uses the test database and a `SIMPLETEST_BASE_URL`; that was not available.

## 5. Restore the test site

The original theme was saved to `/tmp/default_admin-baseline.tgz`. The temporary admin password hash and settings change were also saved for restoration. Restore them before reusing the install for another evaluation.
