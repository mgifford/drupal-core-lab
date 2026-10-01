# Handoff — start here next session

*Written 2026-07-06 (Sunday night), for the Wednesday session.*

## State: everything is pushed

`main` on github.com/mgifford/drupal-core is the single source of truth —
code, docs, and reports all current. Published reports:
<https://mgifford.github.io/drupal-core/>. The DDEV site `drupal-core` is
installed and healthy (admin/admin, PHP 8.5, all inventory modules +
permission fixes applied).

## What exists as of tonight

- **Corrected 2026-07-05 baseline scan** (1,341 records, all fixes in):
  79 patterns — 73 WCAG failures / 6 best practices. 70 patterns are
  color-contrast; 63 appear under Default Admin **accent variants**. The
  week's 19 upstream fixes visibly cleaned out the label/heading/role
  classes.
- **First sustainability history entry**: 95 pages, median 720 KB,
  ~10 g CO2/full-site view; heaviest = Default Admin admin routes ~1.33 MB.
- **Known-issues sync**: 550 open Accessibility-tagged core issues cached;
  first reconciliation = 3 likely-filed / 76 unmatched (title-only
  matching — low recall expected until embeddings, roadmap 15a).
- **15 tracked work orders**: TOOLING-ROADMAP.md items 1–14 + local-AI 15a–e,
  each = GitHub issue #25–#39, each executable by a smaller model.
- **8 drupal.org issue drafts** ready to file: ISSUE-DRAFTS-2026-07.md.

## Wednesday: recommended order

1. **Human triage (30–45 min, no AI needed):** open
   `reports/KNOWN-ISSUES-RECONCILIATION-latest.md` +
   `reports/PATTERN-REPORT-latest.md`. Confirm/reject the 3 keyword
   matches. Then the big call: the ~63 accent-contrast patterns almost
   certainly consolidate into a **handful of per-preset accent-AA issues**
   (your existing patch work is the fix) rather than 60 filings — decide
   the grouping, file the first rubric-gated issues with the suggested
   `Accessibility` + `wcag143` tags.
2. **File from ISSUE-DRAFTS-2026-07.md** — Draft 7 (admin PerformanceTestBase
   coverage) and Draft 1 (Default Admin RTL/dark/accent test states) are the
   two with the freshest supporting data.
3. **One AI session, one roadmap item.** Best first picks:
   - **Item 3 (#27) calibration harness** — S/M, unblocks trust in every
     later checker; or
   - **Item 15a embedding matcher** — if the llama.cpp server is reachable;
     it directly fixes the 3/79 match rate; or
   - **Item 10 (#34) nightly orchestrator** — if the local server is ready,
     this starts the nightly trend line, and everything downstream
     (attribution, OpenACR) hangs off it.

## Parked decisions (yours, no urgency)

- `patches/default-admin-accent-aa-defaults.patch` no longer applies
  (upstream orange-accent commit overlaps it) — drop from composer.json or
  trim to the unlanded remainder. Until then `composer install` warns.
- Upstream MR to git.drupalcode.org/project/ai_best_practices carrying the
  skill fixes (WCAG 2.4.7, honest-evidence example, confidence rubric,
  generated coverage matrix) — local copy is fixed; upstream isn't.
- GitHub is reporting 60 dependabot vulnerabilities on the fork — mostly
  inherited dev deps; worth a look, not blocking.
- WSG-ALIGNMENT.md review before it goes near drupal.org/about/sustainability.

## Learnings worth keeping (also in AI memory)

- One Playwright invocation at a time — global setup wipes crawl shards.
- The committed composer.lock previously downloaded drupal/core over
  `core/` — fixed, but check the lock's drupal/core entry stays
  `dist.type: path` after any composer update.
- api-d7 caps pages at 50 regardless of requested limit.
- Crawl ≈ 90 min now (real pages, all routes resolving); expect ~1,584
  tests → ~1,340 records + WSG/axTree fields appearing for the first time
  on the NEXT crawl (tonight's predates that code).
