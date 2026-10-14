# Reproduce #3155130: "Edit summary" toggle

Issue: https://www.drupal.org/project/drupal/issues/3155130

## Status of this folder (2026-10-14)

A **scoping note**, not a lab-built Before/After pair: no variants, steps or checks, and no patch attached. The original
material is [ISSUE-3155130.md](ISSUE-3155130.md) — a plain-language list of the problems, a path to a content type with a
long-text + summary field, and quick assessment steps. It refers to a patch
(`core-summary-a11y-3155130-6.patch`) that is not in this folder.

## To reproduce in this lab

Re-fetch the patch from the issue, then `node scripts/new-issue.mjs 3155130 --branch <fork-branch>` and follow
`docs/NEW-ISSUE.md`.

Re-map the note's URL to this lab's hosts (`baseline-*` / `issue-*` DDEV projects), not the retired
`drupal-core.ddev.site`.

## What was verified, and what was not

Nothing has been run in this lab. See [EVIDENCE.md](EVIDENCE.md) (DRAFT) and [SUMMARY.md](SUMMARY.md).
