# Evidence: issue 3370946

Status: **DRAFT — refresh note and artifacts only, no lab run.** The material is
[3370946-refresh-notes.md](3370946-refresh-notes.md), two patches ([BRANCHES.md](BRANCHES.md)), before/after screenshots
(`3370946-before.png`, `3370946-after.png`) and Guidepup logs (`3370946-guidepup-*`).

Reported in the note (produced outside this lab, not reproduced here):

- `RequestGeneratorTest`: "passes (8 tests, 10 assertions)".
- `PageTitleBlockTest`: boot issues fixed, but needs `SIMPLETEST_BASE_URL` to run in that shell.
- Guidepup: before 367 phrases, after 370; the note says to use the **normalized** logs for review because the raw diff has
  step-number churn.

## Not verified

Everything in the lab sense: no environment, no pinned/latest pair, no automated or manual checks, no human review, no
commit/tool/browser record. Re-check the issue before relying on anything here.

## Folder hygiene

`3370946-supporting-artifacts/` duplicates 9 of the top-level files byte-for-byte and holds
`3370946-supporting-artifacts.zip` (~57 KB). Per `AGENTS.md` the zip belongs in `bundles/` and raw logs should be
summarised, not committed in full. Flagged, not changed here.
