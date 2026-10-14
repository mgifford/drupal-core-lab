# Reproduce #3617875: disabled elements in dark mode

Issue: https://www.drupal.org/project/drupal/issues/3617875

## Status of this folder (2026-10-14)

**Branch patches**, not a lab-built Before/After pair: no variants, steps or checks, and no notes. It holds two branch
patches with provenance and one patch without; see [BRANCHES.md](BRANCHES.md).

## To reproduce in this lab

`node scripts/new-issue.mjs 3617875 --branch <fork-branch>`, then follow `docs/NEW-ISSUE.md`. The change targets
`core/themes/default_admin`, so a colour-mode / forced-colours comparison is the natural evidence.

## What was verified, and what was not

Nothing has been run in this lab. See [EVIDENCE.md](EVIDENCE.md) (DRAFT) and [SUMMARY.md](SUMMARY.md).
