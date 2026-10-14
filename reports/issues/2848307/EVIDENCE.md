# Evidence: issue 2848307

Status: **DRAFT — scoping material only, no lab run.** The only content is the original work-log
[ISSUE_2848307_WORK_SUMMARY.md](ISSUE_2848307_WORK_SUMMARY.md).

That note reports a "baseline" capture at `tests/playwright/reports/issue-2848307/` (`result.json`, a screenshot, an
accessibility tree) and concludes "Bug Confirmed". That path **does not exist** in this repository, so the capture cannot
be re-checked here. The pieces it does describe are real: `tests/playwright/scripts/issue-2848307-mcp-check.js` and
`tests/playwright/tests/drupal-login.spec.ts`.

## Not verified

Everything in the lab sense: no environment, no pinned/latest pair, no automated checks, no manual pass by a person, no
human review, and no commit/tool/browser record. The WCAG SC 1.3.1 claim in the original note is the author's, not
confirmed here. Re-check the issue before relying on anything in this folder.
