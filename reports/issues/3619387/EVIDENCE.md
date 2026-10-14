# Evidence: issue 3619387

Status: **DRAFT — no lab run yet.** This folder has not been built as a Before/After pair in this lab, so there are no
automated checks, no manual pass and no human review. The material that exists was produced outside the lab build and
lives in [`issue-3619387-sidebar-errors/`](issue-3619387-sidebar-errors/) (see its [README.md](issue-3619387-sidebar-errors/README.md)):

- `3619387-sidebar-errors-full.patch`, `sidebar-errors-interdiff.patch` — the change and its delta.
- `guidepup/` — a before/after VoiceOver harness (`sidebar-modal.voiceover.mjs`) with expected screen-reader behavior.
- `sidebar-errors-review-bundle.zip` — all of it plus source copies.
- `sidebar-errors-comment.md` — a proposed issue-queue comment.

## Not verified

Everything in the lab sense: the patch has not been applied to a lab environment, no automated checks have been run, no
manual keyboard or screen-reader pass by a person, and no human has reviewed the material. Re-check the issue and MR
!17013 before relying on anything here.
