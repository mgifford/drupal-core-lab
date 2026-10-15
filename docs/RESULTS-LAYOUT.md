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
- `status.json`: the last `scripts/issue-status.mjs --write` fetch, so the next one can say what changed.
- `variants.json` of a new issue carries `coverage.matrix`: the browser, scheme and width combinations that count as tested (`tools/compare/coverage-matrix.mjs`).

Barriers found outside an issue's question go in `reports/findings/` (`scripts/findings.mjs`), not in the issue's folder.

Reports are Markdown plus small artifacts. Do not commit large raw scan output (multi-MB JSON); summarise it and say where it lives.
Built zips go in `bundles/`.
