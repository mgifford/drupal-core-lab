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

The recipe [`recipes/repro_3587661`](../../../recipes/repro_3587661/recipe.yml) sets this up with one field, "Files (two values)", and
hides Article's Image field on the form, so it is the only upload. Until 2026-10-19 it also had a required two-value field and a
one-value field (the control); the first runs used those to show that "required" makes no difference and that a one-value field is
not affected (EVIDENCE.md). They were removed at the owner's request to keep the form simple.

## Start locally (DDEV)

The command blocks below have no comments and no `!`, so they paste as they are into zsh or bash. (In zsh, `!16335` in a comment
starts history expansion, "no such event", and stops the whole paste; and zsh treats `#` as a comment only with
`setopt interactivecomments`.)

From the lab folder, run these one at a time. Each build takes 10 to 20 minutes the first time and can be re-run if it stops.

```bash
node tools/compare/setup.mjs 3587661-pinned --check-patches
node tools/compare/setup.mjs 3587661-pinned
node tools/compare/setup.mjs 3587661-proposal
node scripts/lab-env.mjs start 3587661-pinned
```

1. `--check-patches` only reports whether the patches apply to the pinned core. It fetches core the first time, but builds no site.
2. `3587661-pinned` builds Before (core `main` at `a50836d`, `envs/baseline-3587661`) and After with MR !16335, the `aria-label`
   (`envs/issue-3587661`).
3. `3587661-proposal` reuses that Before and builds After with the visually hidden label and the test (`envs/issue-3587661-proposal`).
4. `start` starts both sites of the MR comparison and the viewer. To compare the proposal instead:
   `node scripts/lab-env.mjs start 3587661-proposal`.

In the viewer, upload a file to "Files (two values)" in each frame (a file chooser cannot be mirrored), then press Run checks.

The PHPUnit test, in the proposal's site (it covers the edit form, and a save error without and with Inline Form Errors):

```bash
cd envs/issue-3587661-proposal
ddev phpunit core/modules/file/tests/src/Functional/FileFieldDisplayTest.php
cd ../..
```

Scripted evidence, one side at a time. Get a one-time login link inside that site's folder, then pass it to the script. For Before:

```bash
cd envs/baseline-3587661
ddev drupal login
cd ../..
node tools/playwright/label-3587661.mjs --url https://repro-baseline-3587661.ddev.site --side before --login PASTE-THE-LINK-HERE
```

For the MR, use `envs/issue-3587661`, `https://repro-issue-3587661.ddev.site` and `--side after-mr`. For the proposal, use
`envs/issue-3587661-proposal`, `https://repro-issue-3587661-proposal.ddev.site` and `--side after-proposal`. The link is used once
and is not saved. `lab-env.mjs status` prints each site's URL if yours differ.

## Without DDEV (how the 2026-10-19 runs were made)

The session had PHP 8.3 and no Docker, and `main` needs PHP 8.5, so the runs used `11.x`, whose three files match `main`. Set `LAB`
to the lab folder first. `composer dump-autoload` was needed because Composer plugins were off, so `autoload_runtime.php` was
missing. The install sets a random password, which was never used.

```bash
LAB="$HOME/drupal-core-lab"
git clone --depth 1 --branch 11.x https://github.com/drupal/drupal.git core11
cd core11
composer install --no-dev
composer dump-autoload
php core/scripts/dr install standard
cp -R "$LAB/recipes/repro_3587661" recipes/
php core/scripts/drupal recipe recipes/repro_3587661
php -S 127.0.0.1:8891 .ht.router.php
```

Log in with a one-time link (`user_pass_reset_url()` from a bootstrapped script, plus `/login`), run the script with `--side before`,
then `git apply` a patch, `php core/scripts/dr cache:rebuild`, and run again with the matching `--side`.

The PHPUnit test, against that server, in a second terminal. It needs `composer install` with the development packages first; see
`AI-LEARNING.md` for the PHPStan packages that could not be installed. Apply the test, and for After also the fix:

```bash
git apply "$LAB/reports/issues/3587661/proposals/3587661-test.patch"
git apply "$LAB/reports/issues/3587661/proposals/3587661-visually-hidden-label.patch"
SIMPLETEST_BASE_URL=http://127.0.0.1:8891 SIMPLETEST_DB="sqlite://localhost/$PWD/test.sqlite" vendor/bin/phpunit -c core core/modules/file/tests/src/Functional/FileFieldDisplayTest.php
```

## Acceptance

- The display checkbox of a multiple-value file field has the accessible name "Include file in display".
- axe-core reports no `label` violation on the form.
- The table looks the same as before (no visible label text in the Display column).
- A single-value file field's checkbox keeps its visible label (shown by the first runs; the recipe no longer has one).
- The label is still there when the form comes back with an error, without and with the Inline Form Errors module (the PHPUnit test
  checks both).
- A person's keyboard pass and a real screen reader confirm the name. Not done yet.
