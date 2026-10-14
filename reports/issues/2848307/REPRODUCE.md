# Reproduce #2848307: Tableselect inline errors

Issue: https://www.drupal.org/project/drupal/issues/2848307

## Status of this folder (2026-10-14)

A **scoping note**, not a lab-built Before/After pair: there are no variants, steps or checks, and no patch is attached.
The original material is [ISSUE_2848307_WORK_SUMMARY.md](ISSUE_2848307_WORK_SUMMARY.md) — an AI work-log covering
Playwright MCP setup, a login regression test, a reproducibility script and a claimed baseline run, plus candidate fixes
(extend `FormErrorHandler` — "Option B" — or restructure `ModulesUninstallForm`).

## To reproduce in this lab

The issue carries no patch, so a branch or merge request is needed first. Then start with
`node scripts/new-issue.mjs 2848307 --branch <fork-branch>` and follow `docs/NEW-ISSUE.md` for a pinned/latest pair.

## What was verified, and what was not

Nothing has been run in this lab. The claimed baseline capture points at `tests/playwright/reports/issue-2848307/`, which
does not exist in this repository. See [EVIDENCE.md](EVIDENCE.md) (DRAFT) and [SUMMARY.md](SUMMARY.md).
