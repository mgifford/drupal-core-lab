# drupal-core-lab

A workspace for **evaluating Drupal core changes**, kept separate from Drupal core itself. For an issue it can: build upstream core
and a patched copy side by side, let a person reproduce the problem and confirm the fix, replay the steps with real input and
axe-core, compare what each site serves, and keep the evidence so the work can be **repeated later, on the same core or on updated
Drupal**. Local development only; nothing is posted anywhere automatically.

## Start here
| I want to... | Go to |
|---|---|
| Reproduce #3619127 (the worked example) | [reports/issues/3619127/REPRODUCE.md](reports/issues/3619127/REPRODUCE.md) |
| See every issue evaluated, and how to come back to it | [reports/issues/README.md](reports/issues/README.md) |
| Start a new issue | [docs/NEW-ISSUE.md](docs/NEW-ISSUE.md) |
| Use the side-by-side viewer and diff report | [tools/compare/README.md](tools/compare/README.md) |
| Run the scripted walkthroughs and the virtual screen reader | [tools/playwright/README.md](tools/playwright/README.md) |
| Know what each tool can and cannot tell me | [docs/TESTING-TOOLS.md](docs/TESTING-TOOLS.md) |
| Work here as an agent (rules, environments, commands) | [AGENTS.md](AGENTS.md) |
| Give someone a self-contained copy of one reproduction | `node scripts/make-bundle.mjs <slug>`, then `bundles/` |

## Quick start (needs Docker, DDEV 1.24+, git, Node 20+; about 10 GB; first run 10 to 20 minutes)
    node tools/compare/setup.mjs 3619127-pinned      # builds Before (upstream) and After (with the patches), applies the recipe
    node tools/compare/serve.mjs 3619127-pinned      # open http://localhost:8100/ and follow the steps on the page

## Layout
    AGENTS.md  MIGRATION.md  ACCESSIBILITY.md  STYLES.md
    docs/                  current docs; docs/legacy/ is inherited from the old fork and describes a workflow that no longer exists
    reports/issues/<nid>/  per issue: REPRODUCE.md, patches, validation, status, generated evidence (kept over time)
    reports/_templates/    EVIDENCE.md, ISSUE-COMMENT-DRAFT.md, REPRODUCE.md
    recipes/               Drupal recipes that create each issue's starting state
    tools/compare/         setup, viewer, diff report, variants.json (+ site/: optional DDEV address for the viewer)
    tools/playwright/      scripted walkthroughs, virtual screen reader, frame-load diagnostic
    scripts/               new-issue, make-bundle, index-issues, lab-site.sh
    bundles/               built zips (a slice of this repository plus a setup command; no Drupal core)
    patches/ tests/ tools/*.js   scanners and collected patches migrated from the old fork (legacy; see MIGRATION.md)
    .agents/ .claude/      AI skills and agent definitions
    envs/                  disposable core worktrees, one DDEV project each (gitignored)

Modelled on [justafish/ddev-drupal-core-dev](https://github.com/justafish/ddev-drupal-core-dev) (a DDEV add-on for core development)
and on the compare tool in FOSDEM-website.
