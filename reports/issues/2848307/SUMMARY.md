# #2848307: Tableselect + Inline Form Errors (work summary)

**DRAFT.** Scoping material only — nothing has been built or run in this lab. This folder was converted to the standard shape
on 2026-10-14; the original note is unchanged.

**This is the entry point for this issue.** Start with **Files and links** below.

Issue: https://www.drupal.org/project/drupal/issues/2848307
Patch: none in this folder
Status snapshot: [STATUS.md](STATUS.md)

## Summary

The issue reports that a validation error on a `tableselect` (the modules-uninstall table) is shown only in the message
summary, not inline with the control or associated with it — claimed as a WCAG 2.2 AA failure (SC 1.3.1 Info and
Relationships). The folder holds an AI work-log describing Playwright MCP setup, a login regression test, a
reproducibility script and a claimed baseline run, with candidate fixes (extend `FormErrorHandler`, or restructure
`ModulesUninstallForm`).

## Files and links

| What | Where |
|---|---|
| Original work summary (unchanged) | [ISSUE_2848307_WORK_SUMMARY.md](ISSUE_2848307_WORK_SUMMARY.md) |
| How to reproduce | [REPRODUCE.md](REPRODUCE.md) |
| Evidence | [EVIDENCE.md](EVIDENCE.md) |
| Draft comment (do not post) | [ISSUE-COMMENT-DRAFT.md](ISSUE-COMMENT-DRAFT.md) |
| Status snapshot | [STATUS.md](STATUS.md) |

## Sources

- https://www.drupal.org/project/drupal/issues/2848307 (checked 2026-10-14)

## Not verified

- No lab run; no pinned Before/After pair, no environment, no commit record.
- The claimed "baseline" capture points at `tests/playwright/reports/issue-2848307/`, which **does not exist** in this
  repository, so the result cannot be re-checked here.
- No patch in this folder; no human review.

## Notes

- The described Playwright artifacts do exist: `tests/playwright/scripts/issue-2848307-mcp-check.js` and
  `tests/playwright/tests/drupal-login.spec.ts`.
- Related: #3083103 (programmatically associate error messages); the `inline_form_errors` module.
