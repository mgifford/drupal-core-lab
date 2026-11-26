# Status of #3155130 (snapshot 2026-11-25)

Re-check everything on drupal.org and GitLab before relying on it; statuses go stale.

## Upstream issue

| Field | Value |
|---|---|
| Issue | https://www.drupal.org/project/drupal/issues/3155130 |
| Title | "Edit summary" toggle on text fields has many accessibility issues |
| Upstream status | last recorded as **Needs work** (2026-10-18 snapshot; not re-checked for this run) |
| Upstream merge request | none |

The field type moved to the contributed **Text With Summary** project (`text_with_summary`), so a fix belongs there. No
issue or merge request has been opened in that project.

## In this lab (2026-11-25)

| Field | Value |
|---|---|
| Variant | `3155130-contrib` (Before = pristine contrib `2.0.x`, After = the two patches) |
| Core | `d29add7ebc18954dcb88877ed38b5bd88cdbf967` (Drupal 12.0-dev) |
| Module | `text_with_summary` `2.0.x` `89c4282cf25259564ce7fa41b9dd70f7fe7f496d` |
| Claro | contrib `4.0.x` `474f080c47f5ce21961bf90515fb7bdea1d7dcd4` |
| Implementation patch | [branches/3155130-persistent-disclosure.patch](branches/3155130-persistent-disclosure.patch) |
| Test patch | [branches/3155130-persistent-disclosure-tests.patch](branches/3155130-persistent-disclosure-tests.patch) |
| Functional tests | 10/10 fail on Before, 10/10 pass on After (156 assertions) |
| Browser matrix | 10 completed Chromium runs in Default Admin and Claro; see [browser/results.md](browser/results.md) |
| Human review | **none** |
| Real screen reader | **not run** |
| Posted / pushed | **nothing** |

Overall: **DRAFT, ready for a person to review the local evidence and the two patches.** Not RTBC, not an upstream merge
request, and not posted.

## Historical core evaluation (unchanged)

The 2026-11-06 run on core `f48d0a58b3ec` (last core with the widget) and the port of the 2020 `<details>` patch are
preserved in [EVIDENCE-2026-11-06-historical.md](EVIDENCE-2026-11-06-historical.md), `compare/3155130-pinned/`,
`tree-diff/3155130-pinned/` and `playwright/2026-11-06T03-46-30-534Z/`. That run showed the `<details>` port losing the
summary on save; it is evidence about that approach, not about this one.
