# Reproduce #3370946: contextual page title

Issue: https://www.drupal.org/project/drupal/issues/3370946

## Status of this folder (2026-10-14)

**A refresh note plus artifacts**, not a lab-built Before/After pair: no variants, steps or checks. It holds
[3370946-refresh-notes.md](3370946-refresh-notes.md), two patches ([BRANCHES.md](BRANCHES.md)), before/after screenshots and
Guidepup logs.

## What the note says to do

The note's steps use `ddev`, `drush` and the host `drupal-core.ddev.site` from an older setup:

1. Set `block.block.claro_page_title settings.base_route_title 0` (and olivero) for the BEFORE screenshot; clear caches.
2. Open `/admin/structure/types/manage/article/display/default` — BEFORE shows H1 "Manage display".
3. Set `base_route_title 1` for the AFTER screenshot. AFTER shows H1 "Article".

It also gives `awk`/`diff` commands to rebuild the normalized Guidepup logs.

## To reproduce in this lab

`node scripts/new-issue.mjs 3370946 --branch <fork-branch>` and follow `docs/NEW-ISSUE.md`; re-map the host and replace
`drush` with the add-on's commands.

## What was verified, and what was not

Nothing has been run in this lab. See [EVIDENCE.md](EVIDENCE.md) (DRAFT) and [SUMMARY.md](SUMMARY.md).
