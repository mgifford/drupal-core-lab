# Reproduce #3243173: HTML5 validation setting / form focus management

Issue: https://www.drupal.org/project/drupal/issues/3243173

## Status of this folder (2026-10-14)

A pair of **analysis notes**, not a lab-built Before/After pair: no variants, steps or checks. It holds two notes and two
patches (see [BRANCHES.md](BRANCHES.md)).

## What the notes say to do

**HTML5 validation:**

```bash
git apply 3243173-disable-html5-validation.patch
./vendor/bin/phpunit -c core core/tests/Drupal/Tests/Core/Form/FormPreprocessTest.php
./vendor/bin/phpunit -c core core/modules/system/tests/src/Kernel/System/Html5ValidationRequirementsTest.php
```

**Focus management:** enable the described `form_error_focus_test` module and submit the non-AJAX and AJAX forms at
`/form-error-focus-test/non-ajax` and `/form-error-focus-test/ajax`.

## To reproduce in this lab

`node scripts/new-issue.mjs 3243173 --branch <fork-branch>` and follow `docs/NEW-ISSUE.md`. Run the two topics as separate
pairs if they are separate issues.

## What was verified, and what was not

Nothing has been run in this lab. The notes report test results from outside the lab. See [EVIDENCE.md](EVIDENCE.md)
(DRAFT) and [SUMMARY.md](SUMMARY.md).
