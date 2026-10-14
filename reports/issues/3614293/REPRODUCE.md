# Reproduce #3614293: aria-invalid test coverage

Issue: https://www.drupal.org/project/drupal/issues/3614293

## Status of this folder (2026-10-14)

An **update note**, not a lab-built Before/After pair: no variants, steps or checks. It holds
[3614293-update.md](3614293-update.md) and one patch (see [BRANCHES.md](BRANCHES.md)).

## What the note says to do

```bash
SIMPLETEST_BASE_URL=https://drupal-core.ddev.site vendor/bin/phpunit -c core \
  core/modules/system/tests/src/Functional/Form/FormAriaInvalidTest.php
cd tests/playwright && npx playwright test tests/a11y-aria-invalid-sr.spec.ts
```

Note: `tests/playwright/tests/a11y-aria-invalid-sr.spec.ts` is not present in this repository, so the second command
cannot be run as written.

## To reproduce in this lab

`node scripts/new-issue.mjs 3614293 --branch <fork-branch>` and follow `docs/NEW-ISSUE.md`; re-map the base URL to this
lab's hosts.

## What was verified, and what was not

Nothing has been run in this lab. See [EVIDENCE.md](EVIDENCE.md) (DRAFT) and [SUMMARY.md](SUMMARY.md).
