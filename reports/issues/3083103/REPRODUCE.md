# Reproduce #3083103: programmatic error association

Issue: https://www.drupal.org/project/drupal/issues/3083103

## Status of this folder (2026-10-14)

**Analysis notes + branch patches**, not a lab-built Before/After pair: no variants, steps or checks. It holds three
branch patches with provenance, one patch without, and two LLM notes (a patch description and a comparison with MR !15692).
See [BRANCHES.md](BRANCHES.md).

## To reproduce in this lab

`node scripts/new-issue.mjs 3083103 --branch <fork-branch>`, then follow `docs/NEW-ISSUE.md`. Confirm which of the three
branch patches is current (the one with the newest tip is `improve-error-accessibility`, 2026-05-07).

## What was verified, and what was not

Nothing has been run in this lab. See [EVIDENCE.md](EVIDENCE.md) (DRAFT) and [SUMMARY.md](SUMMARY.md).
