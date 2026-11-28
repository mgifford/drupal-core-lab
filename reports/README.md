# Reports

This is the report area of the Drupal Core Lab. The current, maintained reports are:

| Start here | What it is |
|---|---|
| [issues/README.md](issues/README.md) | Every issue the lab has evaluated, grouped by what needs attention, what is waiting and what is archived |
| [issues/FOCUS.md](issues/FOCUS.md) | The shorter priority-ordered view |
| `issues/<nid>/SUMMARY.md` | **The entry point for one issue**: what was tested, what was and was not verified, and links to the evidence |
| [resources/SUMMARY.md](resources/SUMMARY.md) | Resource accounting: AI tokens/cost, CPU/memory, CI time, host capacity, energy estimate |
| [infrastructure/](infrastructure/) | Cross-issue infrastructure and coordination evidence |
| [findings/README.md](findings/README.md) | Barriers found outside the issue being tested |
| [archive/](archive/) | Dated bundles of older cross-issue reports |
| [_templates/](_templates/) | Hand-written templates used by the issue workflows |
| [legacy/](legacy/) | Historical Default Admin theme reports and early experiments; not maintained |
| [ai-usage/](ai-usage/) | AI-usage reduction studies and handoffs (current background material) |
| [axe-results/](axe-results/) | Generated axe crawl shards and indexes; support data, not a report |
| [info-yml/](info-yml/) | The info.yml malformed-file investigation |
| [openacr-pilot/](openacr-pilot/) | Independent OpenACR traceability pilot proposal |
| [issue-drafts/](issue-drafts/), [issue-queue-933004/](issue-queue-933004/), [module-impact/](module-impact/), [patches/](patches/), [sustainability/](sustainability/), [themes/](themes/) | Older cross-issue material retained for reference; do not start new work here |


## One issue

```text
reports/issues/<nid>/
  SUMMARY.md              entry point
  REPRODUCE.md            how to reproduce and re-pin
  EVIDENCE.md             what was verified, with exact commits
  STATUS.md               current drupal.org/MR state
  BRANCHES.md             patches and their bases
  COVERAGE.md             browser/scheme/width coverage
  ISSUE-COMMENT-DRAFT.md  draft for the human to post
  status.json             last upstream state
  branches/               patch files
  playwright/             selected runs: results.json, SUMMARY.md, paired images
  screenreader/           screen-reader evidence
  intake/                 deterministic issue/MR brief and comment index
  handoffs/               short stage handoffs with cited sources
  ARCHIVED.md             present when the issue is finished
```

`docs/RESULTS-LAYOUT.md` is the detailed rule for this folder. `node scripts/index-issues.mjs`
generates the issue index and `node scripts/close-out.mjs <nid>` checks the folder before the next issue.

## Rules

1. **Summary first.** A person should be able to open `issues/<nid>/SUMMARY.md` and understand the result,
   the exact commits, and what was not verified without opening every run.
2. **Generated artefacts say so.** Run folders, indexes, `playwright/README.md` and the root issue index are
   generated; do not hand-edit them.
3. **Keep raw scan output out of git.** A run keeps `results.json`, `SUMMARY.md`, a manifest and the paired
   Before/After images that the summary references. Multi-megabyte `observations.json`, browser traces,
   `Archive.zip` and full-page screenshot dumps stay local or compressed outside the normal report tree.
4. **One canonical document per issue.** Stable per-issue documents are uppercase (`SUMMARY.md`, `EVIDENCE.md`,
   `STATUS.md`). Dated snapshots go in a `history/` subfolder or `reports/archive/`, not beside the canonical file.
5. **One latest per generated family.** Generated families use lowercase kebab-case and one `latest` entry;
   dated snapshots live under `reports/archive/YYYY-MM-DD/`.
6. **Retire, do not delete.** Finished issues get `ARCHIVED.md` and keep their folder so links from drupal.org
   continue to work. `node scripts/issue-archive.mjs <nid>` does this.
7. **Large files need an explicit reason.** Tracked report files above 5 MB need a manifest entry explaining why
   the file is committed. `node scripts/reports-audit.mjs` reports the current exceptions.

## Legacy

The Default Admin theme reports that used to sit directly in this directory, and the early design-scan
experiments, were moved under [legacy/](legacy/) on 2026-11-28. They are historical: paths, scripts and
recommendations inside them may be out of date. Current work starts at [issues/README.md](issues/README.md) and
`issues/<nid>/SUMMARY.md`.
