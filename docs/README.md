# docs/

Current documentation for this lab (written or verified 2026-10-01), plus a `legacy/` folder.

| Document | What it covers |
|---|---|
| [FIRST-RUN.md](FIRST-RUN.md) | **Start here on a fresh clone:** prerequisites, the doctor check, building and starting your first comparison. |
| [USER-GUIDE.md](USER-GUIDE.md) | **Then:** how to use the viewer to test an issue, with screenshots, how to read the results, and what to do when something looks wrong. |
| [NEW-ISSUE.md](NEW-ISSUE.md) | Starting a new issue: scaffold, recipe, variant, steps and checks, evidence, and coming back to it later. |
| [ISSUE-PACK.md](ISSUE-PACK.md) | Bring your own issue: a chat assistant writes one YAML "issue pack" from a Drupal.org issue; the lab validates it (`scripts/issue-pack.mjs`) and imports it as a draft. |
| [TESTING-TOOLS.md](TESTING-TOOLS.md) | Each tool (axe-core, Playwright, Guidepup virtual screen reader, the viewer, the diff report, Accessibility Insights) and what it can and cannot tell you. |
| [ADDON-TRIAL-2026-10-01.md](ADDON-TRIAL-2026-10-01.md) | Trial of the DDEV add-on `justafish/ddev-drupal-core-dev`, with gotchas (Mutagen, router, SQLite). |
| [FRAME-LOADING-2026-10-01.md](FRAME-LOADING-2026-10-01.md) | Why viewer frames sometimes did not load, what was measured and fixed, how to diagnose it. |

Elsewhere:
- `../AGENTS.md`: how to work here, and the rules.
- `../reports/issues/README.md`: every issue evaluated, and how to come back to it (generated).
- `../tools/compare/README.md`: the side-by-side viewer, diff report, variants format.
- `../tools/playwright/README.md`: scripted walkthroughs and the virtual screen reader.
- `../MIGRATION.md`: how this repository was built from the old `mgifford/drupal-core` fork.

## legacy/
Everything inherited from the old `mgifford/drupal-core` fork before the lab existed (process notes, nightly pipeline,
`reset-core` workflow, old README/AGENTS/CLAUDE files, a Drupal.org documentation draft). **They describe a workflow that no
longer exists here**: commands, scripts and paths in them (`ddev reset-core`, `reports/axe-results/`, a core checkout at the
repository root) will not work. Read them for ideas and history; do not follow their commands without checking.
