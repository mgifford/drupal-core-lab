# Reproduce #3619387: Sidebar toggle shows child errors (indicator and modal behavior)

Issue: https://www.drupal.org/project/drupal/issues/3619387
Merge request: !17013 · Fork branch: `drupal-3619387` (see [BRANCHES.md](BRANCHES.md))
Patch: [branches/3619387-sidebar-child-errors.patch](branches/3619387-sidebar-child-errors.patch)

## The problem in one paragraph

In the Default Admin theme, the sidebar of advanced settings does not signal that a field inside it has a validation
error, and on narrow viewports it overlaps content without behaving like a dialog. The change adds a `has-error`
indicator (class, `aria-invalid`, a visually hidden "has errors") to the sidebar toggle and makes the sidebar modal when
it overlaps content (background `inert`, focus trapped, `role="dialog"`, `Esc` to close, focus returned to the toggle).

## Status of this folder (2026-10-14)

This folder holds review material produced outside the lab's Before/After build, in
[`issue-3619387-sidebar-errors/`](issue-3619387-sidebar-errors/) (see its [README.md](issue-3619387-sidebar-errors/README.md)).
It has **not been built as a lab pair**, so there are no viewer steps, checks or variants yet.

## How to use the material

    ddev exec env SIMPLETEST_BASE_URL=https://drupal-core.ddev.site \
      ./vendor/bin/phpunit -c core core/themes/default_admin/tests/src/Functional/SidebarChildErrorsTest.php
    ddev exec bash ./core/scripts/dev/commit-code-check.sh

Environment: install Standard (`drush site:install standard -y`), apply the recipe `core/recipes/replicate_core_testing`,
then add an Article, set the URL alias to an invalid value and save — the sidebar should show `has-error`.

## What was verified, and what was not

Nothing has been run end to end in this lab. The material in `issue-3619387-sidebar-errors/` carries its own before/after
Guidepup harness and a proposed comment. See [EVIDENCE.md](EVIDENCE.md) (DRAFT) and [STATUS.md](STATUS.md).
