# Evidence budget

`node scripts/evidence-budget.mjs <nid>|--all` inventories an issue's evidence and warns when it is larger than the
configured budget. It never deletes, moves, compresses or untracks anything.

## What is counted

| Category | Examples |
|---|---|
| Human-readable | `SUMMARY.md`, `EVIDENCE.md`, `STATUS.md`, `ISSUE-COMMENT-DRAFT.md`, `COMMUNICATION.md` |
| Structured | `results.json`, manifests, session/checkpoint JSON, run summaries |
| Raw diagnostics | `design/observations*.json`, `Archive.zip`, `playwright-trace-*.zip`, `.har` |
| Images | screenshots and visual evidence |

The report also groups Playwright runs by their meaningful inputs: variant, core commit, patch footprint, recipe,
browser and version, viewport, colour scheme, forced colours, reduced motion, direction, interaction and page. Runs
that share all of those are reported as duplicates. A duplicate is **not automatically waste**: it may be the
historical run that explains a behaviour change.

## Budgets

[`evidence-budgets.yml`](../evidence-budgets.yml) starts in `warn` mode:

| Limit | Starting value |
|---|---:|
| Files per issue | 100 |
| Bytes per issue | 5 MiB |
| Bytes per JSON file | 250 KiB |
| Images per Playwright run | 8 |

These are deliberately configurable and are not pass/fail gates. `--strict` exits 1 when a warning exists, for a
person who wants that in a local workflow; the default and `close-out` stay warn-only.

## Commands

```bash
node scripts/evidence-budget.mjs 3534229
node scripts/evidence-budget.mjs --all
node scripts/evidence-budget.mjs --all --write   # reports/issues/EVIDENCE-BUDGET.md
node scripts/evidence-budget.mjs --all --json
node scripts/evidence-budget.mjs --all --strict
```

`close-out.mjs` runs the single-issue report before it decides the issue is closed out, so a person sees the evidence
size before committing.

## What this does not do

- No deletion, compression or `git rm --cached`.
- No judgement that a large run is unnecessary. A large run may contain the failure that explains the fix.
- No replacement for `scripts/reports-audit.mjs`, which checks tracked files above a size ceiling and tracked-but-
  ignored files across `reports/`.

The right response to a warning is to ask whether the same finding can be represented by a compact structured result
and a smaller set of paired images, and to keep the historical failure that explains a change in behaviour.
