# Reproduce #3587661: Missing labels in "Limited files with a single pre-existing value (required) field."

**DRAFT.** Steps and commands, written 2026-10-19. The Before result and both After results were recorded by a script on that
day, in Default Admin and Claro, with the PHPUnit test ([EVIDENCE.md](EVIDENCE.md)). No person has done the keyboard or screen reader
pass yet.

Issue: https://www.drupal.org/project/drupal/issues/3587661 · Merge request !16335 (branch `3587661-missing-labels-in`)
Pinned core: `main` at `a50836dbcfe00d292a6c2960f5002ad482395d21` (2026-10-19). The three files involved are byte for byte the same on
`11.x` at `21e0dcbac719fc0da73d5f840e29870a0ac6b35d`, where the scripted runs were made.

## Task and barrier

A content editor adds files to a file field that allows more than one value and has "Enable Display field" on. Each uploaded file is
listed in a table whose "Display" column holds a checkbox: include this file in the display or not. That checkbox has no label and no
accessible name, so a screen reader announces only "checkbox, checked" and a voice control user has no name to say. axe-core reports
the `label` rule (critical). The column header "Display" shows the purpose visually only.

Cause: `FileThemeHooks::preprocessFileWidgetMultiple()` (`core/modules/file/src/Hook/FileThemeHooks.php`, line 285 on `main`) runs
`unset($widget['display']['#title']);` before it puts the checkbox in the table. `FileWidget::process()` gives the checkbox the title
"Include file in display", so a field that allows one value (no table) keeps its visible label and is not affected.

## Steps to reproduce (core only, no contributed modules)

1. Standard install. Log in as an administrator.
2. Structure > Content types > Article > Manage fields > Create a new field: **File**.
3. Set **Allowed number of values** to **Limited, 2** (or **Unlimited**) and tick **Enable Display field**. Save.
   "Required" makes no difference.
4. Go to `/node/add/article` and upload a small `.txt` file to that field.
5. The file appears in a table with a **Display** column. Inspect the checkbox in that column: there is no `<label for>`, no
   `aria-label` and no `aria-labelledby`. Run axe: rule `label` fails on `#edit-<field>-0-display`.

It is the node edit form, not the front end. The report's "Limited files with a single pre-existing value (required)" field came from a
test site built with the Theming Tools module; any multiple-value file field with the Display field on shows it.

The recipe [`recipes/repro_3587661`](../../../recipes/repro_3587661/recipe.yml) sets this up with three fields: two values; two values
and required; and one value, the control.

## Start locally (DDEV)

```bash
node tools/compare/setup.mjs 3587661-pinned --check-patches
node tools/compare/setup.mjs 3587661-pinned        # After = MR !16335 (aria-label)
node tools/compare/setup.mjs 3587661-proposal      # After = visually hidden label + test assertion
node scripts/lab-env.mjs start 3587661-pinned
```

In the viewer, upload a file to "Files (two values)" in each frame (a file chooser cannot be mirrored), then press Run checks.

Scripted evidence, for any running site:

```bash
node tools/playwright/label-3587661.mjs --url <site> --side before|after-mr|after-proposal --login <one-time link>
```

## Without DDEV (how the 2026-10-19 runs were made)

The session had PHP 8.3 and no Docker, and `main` needs PHP 8.5, so the runs used `11.x`, whose three files match `main`:

```bash
git clone --depth 1 --branch 11.x https://github.com/drupal/drupal.git core11 && cd core11
composer install --no-dev && composer dump-autoload        # dump-autoload: plugins were off, so autoload_runtime.php was missing
php core/scripts/dr install standard                       # random password, never used
cp -R <lab>/recipes/repro_3587661 recipes/ && php core/scripts/drupal recipe recipes/repro_3587661
php -S 127.0.0.1:8891 .ht.router.php
```

Log in with a one-time link (`user_pass_reset_url()` from a bootstrapped script, plus `/login`), run the script with `--side before`,
then `git apply` a patch, `php core/scripts/dr cache:rebuild`, and run again with the matching `--side`.

The PHPUnit test, against that server (`composer install` with the development packages first; see `AI-LEARNING.md` for the PHPStan
packages that could not be installed):

```bash
git apply <lab>/reports/issues/3587661/proposals/3587661-test.patch        # and, for After, the fix patch
SIMPLETEST_BASE_URL=http://127.0.0.1:8891 SIMPLETEST_DB=sqlite://localhost/$PWD/test.sqlite \
  vendor/bin/phpunit -c core core/modules/file/tests/src/Functional/FileFieldDisplayTest.php
```

## Acceptance

- The display checkbox of a multiple-value file field has the accessible name "Include file in display".
- axe-core reports no `label` violation on the form.
- The table looks the same as before (no visible label text in the Display column).
- The single-value field's checkbox keeps its visible label.
- A person's keyboard pass and a real screen reader confirm the name. Not done yet.
