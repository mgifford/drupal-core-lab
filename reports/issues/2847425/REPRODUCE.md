# Reproduce #2847425: `#states` not affecting visibility/requirement of `managed_file`

Issue: https://www.drupal.org/project/drupal/issues/2847425
Merge request: https://git.drupalcode.org/project/drupal/-/merge_requests/7305
Patch: [branches/mr-7305.patch](branches/mr-7305.patch) (from a local branch `mr-7305`, not on the issue fork — see [BRANCHES.md](BRANCHES.md))

## The problem in one paragraph

`#states` on a `managed_file` element does not hide or un-require the element as it should: a hidden managed file can
show on load with no required marker, and hiding one inside a `<details>`/fieldset collapses the whole wrapper (the
fieldset case has no automated coverage). This is a WCAG 3.3.1 Error Identification concern.

## Status of this folder (2026-10-14)

This folder holds a self-contained **test kit**, not a lab-built Before/After pair, so there are no viewer steps, checks
or variants yet. The kit is in [`kit/`](kit/); its [README.md](kit/README.md) is the guide, and it includes:

- `kit/file_managed_states_test/` — a module with a self-diagnosing form at `/file-managed-states-test` that reports
  APPLIED / NOT applied and scores the fieldset case separately.
- `kit/recipes/managed_file_states_test/` — a recipe that installs the module.
- `kit/tests/guidepup/` — a VoiceOver/NVDA before/after capture.
- `kit/tools/screenshots/` — Playwright before/after screenshot capture.

## How to use it

Drop `kit/file_managed_states_test/` into a Drupal checkout under `modules/custom/`, enable it, and open
`/file-managed-states-test`; the **Patch diagnostics** panel reports the verdict. Before is plain `main`; After is the
MR applied (`kit/README.md` gives both a branch and a `git apply` route).

## What was verified, and what was not

Nothing has been run end to end in this lab. The kit was produced outside the lab build. See [EVIDENCE.md](EVIDENCE.md)
(DRAFT) and [STATUS.md](STATUS.md).

---

# 2026-11-26: Lab pair for the September corrective commit

This section supersedes the "no viewer steps, checks or variants" status above. The test kit is kept as historical
evidence and is **not** used for the comparison; see [EVIDENCE.md](EVIDENCE.md) for why its diagnostics no longer
match the MR.

## Versions

| | |
|---|---|
| Variant (lab) | `2847425-pinned` |
| Core baseline (Before) | `0387fb948f786bc344a5cc54aa0d98b8f552e378` — the merge base of MR !7305 |
| Current MR (After) | `7362966e1547505d2f5d7c3ad6992d293956abf1`, issue fork `drupal-2847425`, branch `11.x` |
| Merge request | [!7305](https://git.drupalcode.org/project/drupal/-/merge_requests/7305) |
| Environments | `envs/baseline-2847425`, `envs/issue-2847425` |
| Recipe | `recipes/repro_2847425/recipe.yml` (installs `file_test_states`; `testExtensions: true`) |
| Fixture form | `/file-test-states-form` |

## Patch stack

Before:

1. `branches/2847425-fixture-before.patch` — test support only: the fixture form the two sides share.

After:

1. `branches/2847425-complete.patch` — the full proposal against the same baseline: the MR, the extended fixture,
   the refinement and the extended test (6 files, +696/−1). It does not touch `FormTest.php`.

The MR itself is `branches/mr-7305-7362966.patch` (`git diff 0387fb948f 7362966e15`, 7 files, +196/−2) and the
minimal change from it is `branches/2847425-interdiff.patch` (5 files, +556/−55). Both are checked against their
declared tree. `2847425-fixture-extend.patch` and `2847425-refinements.patch` are intermediate captures kept for
provenance; they are not part of the current stack.

The fixture patch contains no implementation change. The stack is declared in
`reports/issues/2847425/variants.json` and recorded by every run.

## Build and run

```sh
node tools/compare/setup.mjs 2847425-pinned
node scripts/lab-env.mjs start 2847425-pinned
node tools/playwright/evaluate-2847425.mjs 2847425-pinned
node tools/playwright/evaluate-2847425.mjs 2847425-pinned --scheme=dark
node tools/playwright/evaluate-2847425.mjs 2847425-pinned --forced-colors
node scripts/lint.mjs 2847425-pinned
```

`scripts/coverage.mjs 2847425` reports which rows of the variant's matrix were actually run; anything not run is
reported as NOT TESTED, not as a pass. Light, dark and forced-colours Chromium runs were recorded on 2026-11-27;
Firefox, WebKit and 480 px were not.

Core's code checks on the six changed files: `node scripts/lint.mjs 2847425-pinned` (PASS; report in `lint/`).

## The fixture form

Three independent triggers, so that one state cannot mask another:

| Trigger | Field id |
|---|---|
| Visibility | `#edit-toggle` |
| Requirement | `#edit-toggle-required` |
| Disabled | `#edit-toggle-disabled` |

Managed files with, in order: conditional visibility (single and multiple), conditional requirement (single and
multiple), the inverse `optional` state, conditional disabled (single and multiple), combined visibility +
requirement from two independent triggers, a file with no states, and files inside `<details>`, a `<fieldset>` and a
`container`. Every managed file has a description, and unrelated textfields sit next to the grouped files.

## Regression tests

The proposed Core test is
`core/modules/file/tests/src/FunctionalJavascript/FileManagedStateTest.php` (kept in
[`tests-proposal/`](tests-proposal/)). It replaces the MR's single test method with one method per behaviour and adds
real AJAX upload, invalid-upload recovery and repeated upload/removal cycles, reacquiring the DOM after every
replacement. See [EVIDENCE.md](EVIDENCE.md) for the Before/After PHPUnit result table and how it was run.
