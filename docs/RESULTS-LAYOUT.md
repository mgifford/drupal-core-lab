# Where results go

Moved out of `AGENTS.md` on 2026-10-15 so that file, which every session loads, stays short (AI-usage option C: scope the starting context). The text is unchanged except where noted.


One directory per issue: `reports/issues/<nid>/`.

- `SUMMARY.md`: **the entry point** (written by `scripts/issue-pack.mjs`, or by hand): the issue summary, what was and was not
  verified, and links to every file below. `scripts/index-issues.mjs` links each issue in `reports/issues/README.md` to it when it exists.
- `REPRODUCE.md`: how to reproduce, pinned and on latest core, what each outcome means, how to re-pin.
- `branches/*.patch` and `BRANCHES.md`: patches from the issue fork with source, tip, base, date; numbered `patch-N-*.patch` if stacked.
- `EVIDENCE.md`: how it was validated, results with exact commits. DRAFT until a person has reviewed them. (`VALIDATION.md` is the old name; rename it.)
- `STATUS.md`: the current status snapshot; `STATUS-<date>.md` is a dated snapshot kept for history. Related issues and review threads. Statuses go stale; re-check on drupal.org.
- `playwright/`, `screenreader/`, `compare/`: generated, dated evidence. Each summary records the core commits.
- `variants.json`: the issue's own variants (written by a pack import). Older issues keep theirs in `tools/compare/variants.json`; `tools/compare/lib.mjs` merges both.
- `ISSUE-COMMENT-DRAFT.md`: a draft for the human to post. New drafts follow core's `AGENTS.md` rules for drupal.org prose (template in `reports/_templates/`); check with `scripts/check-draft.mjs`.
- `intake/` (`scripts/issue-intake.mjs`): `BRIEF.md` (deterministic extract: identity of the issue and merge request, limits and gaps of the fetch, related issues (parent, related, child, reverse-related, mentioned) with their state, the unresolved review threads on the merge requests verbatim, the comments that carry decisions, proposals, questions or revisions verbatim and quoted as data, what was left out), `comment-index.json` (one entry per comment), `sources.json` (the manifest: each source's id, revision, fetch time and hash). The complete snapshot is in `.lab-cache/` and is not committed.
- `handoffs/<stage>.json` (`issue-intake.mjs handoff`): a short summary, facts and open questions that each cite `comment:<n>`, `source:<id>` or `file:<path>`, pointers to files that hold the detail, and the hash of every source cited (`based_on`). `handoff check` says which are stale. Written by a model or a person; the brief is not.
- `PATCH-CHANGES.md` and `original-patches/` (`scripts/patch-change.mjs`): who changed a patch under `branches/`, when and why, with the version it replaced.
- `status.json`: the last `scripts/issue-status.mjs --write` fetch, so the next one can say what changed.
- `variants.json` of a new issue carries `coverage.matrix`: the browser, scheme and width combinations that count as tested (`tools/compare/coverage-matrix.mjs`).

Barriers found outside an issue's question go in `reports/findings/` (`scripts/findings.mjs`), not in the issue's folder.

Reports are Markdown plus small artifacts. Do not commit large raw scan output (multi-MB JSON); summarise it and say where it lives.
Built zips go in `bundles/`.
