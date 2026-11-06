# Reproduce #3155130: "Edit summary" toggle

Issue: https://www.drupal.org/project/drupal/issues/3155130

## Status of this folder (2026-11-06)

A lab-built pair exists: variant `3155130-pinned`, core `f48d0a58b3ec` (the last core with the widget), recipe `repro_3155130`, After = a port of the 2020 patch
(`BRANCHES.md`). Current core `main` no longer has the "Edit summary" widget, so there is no `-latest` variant.

## To reproduce in this lab

    node tools/compare/setup.mjs 3155130-pinned
    node scripts/lab-env.mjs start 3155130-pinned
    node tools/playwright/evaluate-3155130.mjs 3155130-pinned
    node tools/playwright/tree-diff.mjs 3155130-pinned --page=/node/add/page
    node tools/compare/diff.mjs 3155130-pinned

## What was verified, and what was not

One automated run (DRAFT). See [EVIDENCE.md](EVIDENCE.md) (DRAFT) and [SUMMARY.md](SUMMARY.md).
