# Nightly Regression Pipeline & OpenACR — Design

Target end-state: every night, on a local server (not GitHub CI), pull the
latest Drupal core and Drupal CMS, scan both comprehensively, identify the
accessibility issues **introduced since the previous night**, attribute each
to the commit/MR that shipped it, and regenerate two OpenACR conformance
reports. Reports push nightly so trends are public.

## 1. Why the existing pieces make this feasible

- **Stable pattern IDs** (`DRU-` = SHA-256 of rule + normalized selector):
  "what's new tonight" is a set difference between tonight's and last
  night's pattern-ID sets. Already computable from committed
  `bugs-YYYY-MM-DD.json` files.
- **Template inference** (`inferTemplate`, `drupal_file`): a new pattern
  usually names the Twig/CSS file responsible — which narrows attribution
  to commits touching that file in the last 24 h.
- **AX-tree snapshots**: diffs catch regressions rule-based scanning misses;
  same attribution path applies.

## 2. Nightly orchestrator (local server)

`scripts/nightly.sh`, cron/launchd-driven (scheduling patterns already in
A11Y-PROCESS.md §5):

```
1. git fetch upstream && git merge --ff-only upstream/11.x   (or main)
2. ddev composer install && ddev drush updb -y && drush cr
3. Full crawl (yarn test:a11y:playwright)
4. yarn a11y:analyze && npm run a11y:sustainability
5. node scripts/attribute-new-patterns.js      ← new (below)
6. node scripts/generate-openacr.js            ← new (below)
7. git add reports/ openacr/ && git commit && git push
```

Resilience requirements (all learned the hard way on 2026-07-04/05):
merge/restore in globalTeardown (done), fail on missing routes (done),
site-fidelity module set documented (done), and the orchestrator must
abort — not publish — when the crawl yields fewer records than ~90% of the
previous night's count.

## 3. New-pattern attribution (`attribute-new-patterns.js`)

For each pattern in tonight's report absent from last night's:

1. **Candidate window**: commits between last night's scanned HEAD and
   tonight's (record the scanned SHA in every report — add `coreCommit` to
   the summary block).
2. **File narrowing**: `git log <window> -- <inferred template/CSS file>` —
   in practice this yields 0–2 commits. One hit → attributed.
3. **Bisect fallback** (ambiguous/no file hit): `git bisect run` with a
   fast repro — one page × one rule × one theme is a ~15 s scan; a 24 h
   window is 5–15 commits → 3–4 bisect steps ≈ one minute per pattern.
   Requires the repro script to reinstall nothing (template/CSS changes
   need only `drush cr`; abort bisect if composer/schema changes appear
   in the window and fall back to "window" attribution).
4. **MR/issue linkage**: core commit subjects are
   `Issue #3123456 by name: summary` — parse the issue number →
   `https://www.drupal.org/i/3123456` (the MR lives on the issue). Include
   committer/author from git for the (ultimate) git-blame goal.
5. Output `reports/attribution-YYYY-MM-DD.json`:
   `{pattern_id, first_seen, core_commit, do_issue, author, confidence:
   file-match|bisect|window}` — appended to a cumulative
   `reports/attribution-log.json`. The pattern report shows a "New since
   last scan" section with attribution.

Honesty note: file-match and bisect give high confidence; "window" means
"one of these N commits" — never report a person's name at window
confidence.

## 4. Drupal CMS parallel track

[Drupal CMS](https://www.drupal.org/project/cms) is what new evaluators
actually install — its recipes, contrib modules (dashboard, project
browser, consent manager, …) and Gin-based admin deserve the same scrutiny
as core.

- Second DDEV project `drupal-cms` built from the `drupal/cms` template;
  nightly `composer create-project drupal/cms` (or git pull of the
  template) + recipe install.
- **Parameterize, don't fork, the suite**: `SITE_PROFILE=cms` env selects
  `lib/pages-cms.ts` (its own inventory: dashboard, project browser,
  recipes' content types), its own THEME_CONFIGS, and a namespaced
  reports tree (`reports/cms/…`, `reports/cms/sustainability/history.json`).
  Everything else (analyzer, sustainability, attribution, ACR generator)
  reads the namespace it's pointed at — they already honor
  `A11Y_REPORTS_DIR`.
- Attribution window for CMS = template repo commits + pinned dependency
  bumps (a new issue may arrive via a contrib module update; attribute to
  the composer.lock diff entry in that case).

## 5. OpenACR generation (`generate-openacr.js`)

Two conformance reports, regenerated nightly, each as **YAML (validating
against the [GSA OpenACR schema](https://github.com/gsa/openacr)) + HTML**
(the `openacr` CLI provides validate + HTML output; python-acr alignment
below):

- `openacr/drupal-core.openacr.yaml` + `.html`
- `openacr/drupal-cms.openacr.yaml` + `.html`

Per WCAG success criterion, the determination merges **three evidence
sources**:

| Source | Feeds | Nature |
| :--- | :--- | :--- |
| **Known issues** — d.o queue, `Accessibility` + `wcagXXX` tags (the tag convention makes this queryable per SC) | "known" | filed, public |
| **Discovered patterns** — `bugs-latest.json` WCAG failures not yet mapped to a d.o issue | "discovered, unfiled" | tracked in `openacr/issue-map.json` (`pattern_id → d.o URL once filed`) |
| **Human attestations** — `openacr/attestations.yaml`, hand-maintained | SCs with no automated signal | the WCAG SC coverage matrix (issue #32) tells us exactly which SCs need this |

Determination logic per SC: any open critical/serious failure →
`partially-supports` with notes citing pattern IDs and issue links;
no findings **and** automated coverage exists → `supports` (note: verified
by automated scan of N pages + attestation); no automated signal →
whatever `attestations.yaml` says, defaulting to `not-evaluated` — never
silently claim support. Chapters: WCAG A + AA for the web UI, **plus
authoring-tool chapters** — Drupal is an authoring tool and ATAG-relevant
criteria belong in the ACR.

Alignment: reuse the SC scaffolding and known-issue mapping approach from
[mgifford/python-acr](https://github.com/mgifford/python-acr) — next
session on this should read that repo first and either import its data or
generate into its format rather than inventing a third one.

This yields the vendor-attestation snapshot: at any commit, the ACR states
what is supported, what is partially supported (with the exact defects,
known and unfiled), and what hasn't been evaluated — regenerated nightly,
diffable in git, submittable via https://acreditor.section508.gov/.

## 6. Build order (one session each, per TOOLING-ROADMAP.md discipline)

1. `coreCommit` in report summaries + nightly.sh orchestrator (core only,
   no attribution yet) — **M**
2. attribute-new-patterns.js (file-match + window; bisect later) — **M**
3. Drupal CMS profile (pages-cms.ts + namespacing) — **M**
4. OpenACR generator spec (read python-acr + openacr schema first) — **L,
   spec session**
5. OpenACR generator implementation — **M/L**
6. Bisect fallback for attribution — **M**
