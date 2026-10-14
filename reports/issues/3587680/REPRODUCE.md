# Reproduce #3587680: Empty heading tags on dialog and tabs pages

Issue: https://www.drupal.org/project/drupal/issues/3587680

## Status of this folder (2026-10-14)

A **fix note**, not a lab-built Before/After pair: no variants, steps or checks. It holds
[3587680-update.md](3587680-update.md) (root cause + fix) and `3587680-empty-heading.patch`
(see [BRANCHES.md](BRANCHES.md)).

## What the note says to do

1. Open `/dialog` and `/tabs` on a site with the `theming_tools` contrib module.
2. Before: `curl -s <site>/dialog | grep -c "<h3></h3>"` → 4.
3. After the patch: the same count → 0, and `<h3>` lines show the format names.

## To reproduce in this lab

This touches a contrib module, not core, so it does not fit the pinned-core Before/After flow directly. Decide whether the
issue is the module's or core's first; the lab's variants assume core.

## What was verified, and what was not

Nothing has been run in this lab. See [EVIDENCE.md](EVIDENCE.md) (DRAFT) and [SUMMARY.md](SUMMARY.md).
