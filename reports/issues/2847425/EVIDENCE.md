# Evidence: issue 2847425

Status: **DRAFT — no lab run yet.** This folder has not been built as a Before/After pair in this lab. What exists is a
test kit in [`kit/`](kit/) (see its [README.md](kit/README.md)):

- `kit/file_managed_states_test/` — a module whose form at `/file-managed-states-test` self-diagnoses the patch
  (APPLIED and complete / APPLIED but the fieldset case remains / NOT applied) and scores the fieldset case separately.
- `kit/tests/guidepup/` — a before/after VoiceOver/NVDA capture.
- `kit/tools/screenshots/` — before/after screenshots.

The kit expects the Scenario 3 fieldset case to **still fail** on the current MR — that gap is the point to raise.

## Not verified

Everything in the lab sense: the patch has not been applied to a lab environment, no automated checks have been run in
the lab, no manual pass by a person, and no human has reviewed the material. Re-check the issue and MR !7305 before
relying on anything here.
