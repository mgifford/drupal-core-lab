# Environment Setup & Operations

One place for everything needed to run this testing environment — for
Drupal core today and the Drupal CMS parallel track as it lands
([#36](https://github.com/mgifford/drupal-core/issues/36)). Process detail
lives in [A11Y-PROCESS.md](A11Y-PROCESS.md); this file is setup, variations,
publishing, and the failure modes we have already hit so nobody hits them
twice.

## 1. Prerequisites

- Docker Desktop + [DDEV](https://ddev.readthedocs.io/)
- Node.js ≥ 22, npm
- `gh` CLI authenticated to the GitHub account that owns this fork
- ~4 GB free disk (site + browsers + reports)

## 2. Drupal core site (this repo)

```bash
git clone git@github.com:mgifford/drupal-core.git && cd drupal-core

# DDEV project — docroot is the repo root (core dev checkout, NOT the
# recommended-project layout from the official DDEV guide). PHP >= 8.5.
ddev config --project-type=drupal12 --docroot=. --project-name=drupal-core --php-version=8.5
ddev start

# PHP deps. composer.lock pins drupal/core to the core/ path repository —
# if composer ever DOWNLOADS drupal/core, stop: that overwrites core/
# including this suite (fixed in commit a42d3b6; keep the lock healthy).
ddev composer install

# Site install — admin/admin matches the crawl defaults.
ddev drush site:install standard --account-name=admin --account-pass=admin -y

# Test-content modules the page inventory REQUIRES. Without these, 29 of 53
# inventory routes are 404s (the crawl now fails loudly on them).
MODS=$(ls modules/contrib/theming_tools/modules/ | grep -v "devhelp\|pointertracker\|lang_hebrew\|testfilters" | tr -d '/' | paste -sd, -)
ddev drush en -y "theming_tools,form_style,contact,search,$MODS"

# Post-install permissions/config the inventory expects (modules enabled
# after site install don't get the standard profile's default grants):
ddev exec "drush role:perm:add anonymous 'search content' -y \
  && drush role:perm:add authenticated 'search content' -y \
  && drush config:set user.settings register visitors -y"
ddev drush cache:rebuild

# Playwright browser (matches the pinned @playwright/test version)
cd core/tests/playwright && npx playwright install chromium
```

Sanity check: `curl -sk -o /dev/null -w "%{http_code}" https://drupal-core.ddev.site/user/login` → `200`.

## 3. Variations

| Variation | How | Notes |
| :--- | :--- | :--- |
| Themes ×4 | automatic | Olivero, Claro, Default Admin light + dark (only Gin-based themes have dark mode) |
| Accent presets ×10 | automatic | real `preset_accent_color` via drush; color rules only |
| Viewports ×4 | automatic | desktop / tablet / mobile portrait + landscape |
| RTL | opt-in | `ddev drush en language locale -y && ddev drush language:add he` then `RTL_LANG=he yarn test:a11y:playwright`. The `lang_hebrew` theming_tools submodule helps with content. |
| Base URL / creds | env | `DRUPAL_BASE_URL`, `DRUPAL_ADMIN_USER`, `DRUPAL_ADMIN_PASS` |
| Reports dir | env | `A11Y_REPORTS_DIR` — analyzers read/write an alternate tree (used for testing and for the CMS namespace) |

**Drupal CMS (parallel track, [#36](https://github.com/mgifford/drupal-core/issues/36)):** second
DDEV project from the `drupal/cms` template; `SITE_PROFILE=cms` selects its
own page inventory (`lib/pages-cms.ts`), theme configs, and `reports/cms/`
namespace. Same suite, same analyzers — never fork the code, parameterize it.

## 4. Running scans

```bash
cd core/tests/playwright
npx playwright test tests/a11y-axe-crawl.spec.ts     # full crawl (~80 min)

# From the repo root afterwards:
yarn a11y:analyze                 # pattern report (WCAG vs best-practice)
npm run a11y:sustainability       # page weight/CO2/WSG checks + trends
npm run a11y:known-issues         # d.o queue sync + reconciliation
npm run a11y:coverage             # regenerate user-story coverage matrix
```

⚠️ **One Playwright invocation at a time.** Global setup clears the
in-progress shard directory — starting a smoke run while a crawl is running
destroys the crawl's partial results. `--list` is safe.

Smoke test (3 tests, ~1 min, validates theme switch + dark + accent):

```bash
npx playwright test tests/a11y-axe-crawl.spec.ts --grep "(Theme: Olivero — anonymous pages.*Homepage \[desktop\])|(Theme: Admin \(experimental/Gin\) \(dark\) — admin pages.*Content list \[desktop\])|(Accent: teal \(light\).*Content list)"
```

## 5. Publishing (GitHub Pages)

`reports/` deploys to <https://mgifford.github.io/drupal-core/> via
`.github/workflows/pages.yml` on any push to `main` touching `reports/**`.
So publishing is just:

```bash
git add reports/
git commit -m "chore(reports): a11y scan $(date +%Y-%m-%d)"
git push origin main
```

Committed reports are the trend history: dated `bugs-*.json` files, the
append-only `sustainability/history.json`, and `ax-tree/latest/*.yml`
(git-diffable accessibility trees). The nightly automation of this loop is
[#34](https://github.com/mgifford/drupal-core/issues/34); design in
[NIGHTLY-PIPELINE.md](NIGHTLY-PIPELINE.md).

## 6. Known bugs vs. discovered bugs

The filing workflow (detail: bug-reporting skill + A11Y-PROCESS.md §6):

1. `npm run a11y:known-issues` — pulls open `Accessibility`-tagged core
   issues from the d.o API into `reports/known-issues.json` and writes
   `KNOWN-ISSUES-RECONCILIATION-latest.md`:
   - **Likely already filed** — keyword-matched candidates. Confirm by
     hand, record in `openacr/issue-map.json`, and use the generated
     **draft comment** to retrofit the issue with a pattern ID and
     fresh still-reproducible evidence (issues filed by others won't
     follow the bug-reporting schema — the comment adds the tracking
     data without demanding they rewrite).
   - **No match** — filing candidates. Run the confidence rubric; the
     per-pattern manual search link is the double-check on the matcher.
2. Nothing posts to drupal.org automatically. Drafts are for human review.

## 7. Troubleshooting (all field-tested)

| Symptom | Cause | Fix |
| :--- | :--- | :--- |
| `composer install` rewrites/deletes `core/` | lock resolving drupal/core from packages.drupal.org | restore from git; ensure lock's drupal/core entry has `dist.type: path, url: core` (commit a42d3b6) |
| drush fatals: PHP >= 8.5 required | container on older PHP | `ddev config --php-version=8.5 && ddev restart` |
| Playwright: "Executable doesn't exist … chromium_headless_shell" | browser cache from another Playwright version | `cd core/tests/playwright && npx playwright install chromium` |
| Whole site hangs / curl code 000 | wedged PHP-FPM workers (e.g. after parallel request bursts) | `ddev restart` |
| Crawl "completed" but few/no records | pre-2026-07-05 code: per-worker afterAll merge wiped shards | fixed (globalTeardown, commit 7170bf5) — if it recurs, check `reports/.tmp-crawl` survived to teardown |
| Many routes scan clean at near-zero violations | scanning themed 404s | fixed — scan now fails on HTTP ≥ 400; enable the §2 module set |
| Crawl died mid-run (power/Docker) | external | shards survive worker restarts; re-run; site theme may need `drush config:set system.theme default olivero -y` |
| First page load after enabling modules times out | cold caches | warm with one curl before crawling |
