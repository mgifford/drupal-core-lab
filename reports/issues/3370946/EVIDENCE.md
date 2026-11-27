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

`3370946-supporting-artifacts.zip` held 11 files, all byte-identical to the top-level copies; it was deleted on
2026-11-26 with the owner's approval, after a per-member `shasum` comparison, and no evidence was lost. The
`3370946-supporting-artifacts/` directory described earlier no longer existed at that point. The raw Guidepup logs are
still committed in full; they should be summarised here at some point rather than left as the only record.
