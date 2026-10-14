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
