# Drupal Core Accessibility Testing Process

This document describes the end-to-end workflow for finding, triaging, fixing, and preventing regressions of accessibility issues in Drupal core — across all three core themes.

Reference: [Drupal Accessibility Coding Standards](https://www.drupal.org/docs/getting-started/accessibility/accessibility-coding-standards)

---

## Overview

Drupal core uses a **three-layer automated testing strategy** for accessibility:

| Layer | Tool | Purpose | When it runs |
| :--- | :--- | :--- | :--- |
| Nightwatch + axe | axe-core via Nightwatch | Fast checks on ~10 key pages | Every MR (GitLab CI) |
| Playwright crawl + axe | axe-core via Playwright | Full-site multi-theme crawl, pattern analysis | Weekly or on demand |
| **Playwright + multi-scanner** | **axe + IBM EA + virtual SR** | **Cross-validated accessibility scan** | **On demand (opt-in)** |
| Playwright + Lighthouse | Lighthouse | Accessibility scores per page | On demand |
| Regression suite | Playwright + axe | Guards re-enabled rules | Every MR |

Automated testing catches a **subset** of issues. Manual keyboard and screen reader testing remains required for complex widgets and dynamic interactions.

---

## 1. Local Environment Setup

### Prerequisites

- [DDEV](https://ddev.readthedocs.io/) installed and running
- Node.js ≥ 22 (managed via corepack/yarn in `core/`)
- Drupal core checked out and DDEV site installed
- Admin credentials: `admin` / `admin` (DDEV default)

### First-time setup

On a fresh clone there is no `.ddev/` or `vendor/` (both are gitignored), so
the DDEV project and the site must be created once. Note that the
[official DDEV install guide](https://www.drupal.org/docs/getting-started/installing-drupal/install-drupal-using-ddev-for-local-development)
targets a *new site* built from `drupal/recommended-project` (docroot
`web/`); this repo is a **core development checkout** (drupal/drupal layout,
docroot at the repo root), so the flow differs:

```bash
# 1. Create the DDEV project (docroot is the repo root, not web/).
#    Core main requires PHP >= 8.5.
ddev config --project-type=drupal12 --docroot=. --project-name=drupal-core --php-version=8.5
ddev start

# 2. Install PHP dependencies (drush etc.).
#    composer.lock pins drupal/core to the core/ path repository. If composer
#    ever downloads drupal/core from packages.drupal.org instead, STOP — that
#    overwrites core/ including this test suite (see the "composer: resolve
#    drupal/core from the core/ path repo" commit for the fix pattern).
ddev composer install

# 3. Install the site (admin/admin matches the crawl defaults).
ddev drush site:install standard --account-name=admin --account-pass=admin -y

# 4. Install Playwright's Chromium browser (once)
cd core/tests/playwright
npx playwright install chromium
```

### Environment variables (optional overrides)

| Variable | Default | Description |
| :--- | :--- | :--- |
| `DRUPAL_BASE_URL` | `https://drupal-core.ddev.site` | Base URL of your running Drupal site |
| `DRUPAL_ADMIN_USER` | `admin` | Admin username for admin page tests |
| `DRUPAL_ADMIN_PASS` | `admin` | Admin password |

---

## 2. Themes Tested

The crawl tests three themes that ship with Drupal core:

| Theme ID | Label | Public pages | Admin pages | Dark mode | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `olivero` | Olivero | ✅ | — | — | Default public theme (no dark mode) |
| `claro` | Claro | ✅ | ✅ | — | Stable admin theme (no dark mode) |
| `admin` | Admin (experimental) | ✅ | ✅ | ✅ | Gin-based, the future admin theme |

The crawl switches themes between groups via `ddev drush` and restores the original configuration when done. **No manual theme switching is needed.**

Dark mode is scanned only for the Default Admin theme — the only core theme
that supports it. The crawl sets `default_admin.settings enable_dark_mode: auto`
so Playwright's `prefers-color-scheme` emulation drives the theme's real dark
rendering. Accent presets are applied via the real
`default_admin.settings preset_accent_color` setting and re-scanned with
color-related rules only (accents can only change colors).

### RTL crawl (opt-in)

Right-to-left rendering cannot be simulated by flipping `dir` client-side —
Drupal serves different CSS per language direction. To crawl real RTL pages,
install an RTL language once and pass `RTL_LANG`:

```bash
ddev drush en language locale -y
ddev drush language:add he     # or: ar
cd core
RTL_LANG=he yarn test:a11y:playwright
```

RTL scans visit language-prefixed paths (`/he/admin/content`) at desktop and
mobile-portrait viewports. If the language is not installed, the RTL groups
are skipped with a warning.

> **Note on the Admin theme:** `core/themes/admin` is the Drupal core integration of the [Gin admin theme](https://www.drupal.org/project/gin). It is marked experimental and is expected to replace Claro in a future major release.

---

## 3. Running the Full Multi-Theme Crawl

### Quick command (recommended)

```bash
cd core
yarn a11y:crawl-and-report
```

This single command:
1. Runs the Playwright axe crawl across all three themes (~15–20 min)
2. Runs the pattern analyzer
3. Commits the dated reports to `reports/`
4. Pushes to GitHub

### Step by step

```bash
# 1. Start DDEV if not running
ddev start

# 2. Run the multi-theme crawl (switches Olivero → Claro → Admin)
cd core
yarn test:a11y:playwright

# 3. Analyze patterns and generate reports
yarn a11y:analyze

# 4. Generate the sustainability report + append to the trend history
cd .. && npm run a11y:sustainability

# 5. Commit and push the dated reports
git add reports/
git commit -m "chore(reports): a11y scan $(date +%Y-%m-%d)"
git push github main
```

### Sustainability metrics (WSG)

Every full-rule page scan also captures resource metrics via the Resource
Timing API on a cold cache: transfer bytes, request count, decoded bytes, DOM
node count, and per-format image breakdown. `npm run a11y:sustainability`
then:

- estimates CO2 per page view with [CO2.js](https://www.thegreenwebfoundation.org/co2-js/)
  (Sustainable Web Design model v4),
- appends one entry per scan date to `reports/sustainability/history.json`
  (append-only; per theme × page, so page-weight and violation trends are
  queryable with `jq` over time),
- writes `SUSTAINABILITY-latest.md` / `.html` with per-theme baselines, the
  heaviest pages, image-format breakdown, and a regression table for pages
  ≥10% heavier than the previous run.

This supports Drupal's alignment with the draft
[W3C Web Sustainability Guidelines](https://www.w3.org/TR/web-sustainability-guidelines/).

### What the crawl does

For each theme:
1. Drush switches `system.theme.default` and `system.theme.admin` to that theme
2. Drush rebuilds the cache (~5–10s per theme)
3. Playwright visits all applicable pages with Chromium at 4 viewports
   (desktop, tablet, mobile-portrait, mobile-landscape)
4. axe-core runs the full WCAG 2.2 + best-practice rule set — **no rules are
   suppressed**. Rule tags are recorded so the analyzer can separate WCAG
   conformance failures from Deque best practices.
5. Violations are recorded with `theme`, `screen`, `colorScheme`, and page info

Then the reduced variant passes run:
- **Dark mode** — Default Admin pages re-scanned with dark emulation (full rules)
- **Accent presets** — Default Admin admin pages × 10 presets × light/dark,
  desktop only, color rules only (applied via drush, ~10 s per preset)
- **RTL** — only when `RTL_LANG` is set and the language is installed

At the end:
- Original theme configuration (including accent and dark-mode settings) is restored
- Results written to `reports/axe-results-YYYY-MM-DD.json` and `reports/axe-results.json`

---

## 4. Multi-Scanner Accessibility Crawl

The multi-scanner crawl runs **three independent accessibility tools** on every page and cross-references findings to distinguish real barriers from false positives.

### How it works

1. **axe-core** — structural/CSS/ARIA violations (fastest)
2. **IBM Equal Access** — WCAG rule-based scanning (accessibility-checker)
3. **Guidepup virtual SR** — semantic accessibility tree validation (slowest)

All three run on every page, then cross-reference results:

| Confidence level | Meaning | Action |
| :--- | :--- | :--- |
| **CONFIRMED** (2+ tools) | High confidence real barrier | Fix it |
| **INVESTIGATE** (1 tool) | May be false positive | Manual review |
| **AXE-ONLY** | Visual/structural issue | CSS or HTML fix |
| **IBM-EA-ONLY** | IBM-specific WCAG rule | Check IBM rule details |
| **SR-ONLY** | Semantic issue | Accessibility tree fix |

### Running the multi-scanner crawl

```bash
cd tests/playwright
npm install  # first time only
NODE_TLS_REJECT_UNAUTHORIZED=0 npx playwright test --grep "Multi-Scanner"
```

This runs all three scanners across all core pages, themes, and viewports. Results are written to `tests/playwright/reports/.tmp-crawl/multi-scanner-*.json`.

### Generating reports

```bash
cd tests/playwright
node scripts/merge-results.js
```

Reports:
- `reports/MULTI-SCANNER-REPORT-latest.md` — human-readable with confidence badges
- `reports/bugs-multi-scanner.json` — structured bug reports per ACCESSIBILITY_BUG_REPORTING_BEST_PRACTICES

### What each scanner checks

| Scanner | Strengths | Limitations |
| :--- | :--- | :--- |
| axe-core | Color contrast, ARIA roles, landmarks, heading order | No semantic tree validation |
| IBM Equal Access | Target spacing, label placement, ARIA validity | IBM-specific rules may differ from other tools |
| Virtual SR | Empty names, heading skips, missing landmarks, unlabeled inputs | Can hang on very large DOM (30s timeout) |

### safeguards

- **PHP error detection** — pages with fatal errors are skipped (prevents false positives)
- **Virtual SR timeout** — 30s limit prevents hangs on complex pages (e.g., Modules page with 5000+ DOM nodes)
- **403/404 handling** — inaccessible or missing pages are skipped gracefully

---

## 5. Analyzing Patterns and Reports

```bash
cd core
yarn a11y:analyze
```

Output files in `reports/`:

| File | Description |
| :--- | :--- |
| `bugs-YYYY-MM-DD.json` | Full structured bug report (per ACCESSIBILITY_BUG_REPORTING_BEST_PRACTICES.md) |
| `bugs-latest.json` | Always the most recent scan |
| `bugs-YYYY-MM-DD.csv` | Spreadsheet-friendly, one row per pattern |
| `bugs-latest.csv` | Always current CSV |
| `PATTERN-REPORT-YYYY-MM-DD.md` | Human-readable prioritized report |
| `PATTERN-REPORT-latest.md` | Always current Markdown |
| `archive/YYYY-MM-DD.tar.gz` | Previous scans, compressed (~73% smaller) |

### Cross-theme analysis

Each bug entry includes:
- **`pattern_id`** — `DRU-XXXXXXXX` stable MD5 hash (rule + selector + screen, no theme). Same ID across themes means same underlying bug.
- **`instance_id`** — `INS-XXXXXXXX` per page + theme. Tracks when a specific page's bug was fixed.
- **`screen`** — `desktop` or `mobile` (from viewport width)
- **`mode`** — `light` (dark mode support planned)

The pattern report has a **Cross-Theme Analysis** section:
- **Universal** — violations in ALL themes → highest priority (fix once in core, benefits everything)
- **Multi-theme** — violations in 2+ themes → template or shared CSS issue
- **Theme-specific** — violation in one theme only → theme's own CSS/templates

### Reading the pattern report

```bash
open reports/PATTERN-REPORT-latest.md
```

Key indicators:
- 🔁 = pattern appears on ≥3 pages → fix the Twig template, not each page
- Sorted by axe impact: **Critical** → **Serious** → **Moderate** → **Minor**, then by page count
- Each pattern includes inferred Twig template, specific file path, and before/after fix code
- WCAG 2.2 A violations are prioritized before AA; within same level, axe impact drives order

### Stable bug IDs for tracking regressions

```bash
# Find a specific bug's ID
jq '.issues[] | select(.rule_id == "listitem") | {id, pattern_id, pages: .frequency.pages_affected}' \
  reports/bugs-latest.json

# Compare two scans — find newly introduced bugs
comm -13 \
  <(jq -r '.issues[].pattern_id' reports/archive/2026-03-30.tar.gz | sort) \
  <(jq -r '.issues[].pattern_id' reports/bugs-latest.json | sort)

# Count unique bugs over time (should decrease as fixes land)
jq '.summary.uniquePatterns' reports/bugs-latest.json
```

### Cross-project fingerprints (dual-write)

Every `DRU-`/`INS-` pattern and instance ID (and every `MS-` ID from the
multi-scanner crawl) is now accompanied by a versioned, cross-project
fingerprint from the canonical
[ACCESSIBILITY.md fingerprint profiles](https://mgifford.github.io/ACCESSIBILITY.md/examples/fingerprints/README.html):
`a11y_pattern_fingerprint` / `a11y_pattern_display_id` and
`a11yOccurrenceFingerprint` / `a11yOccurrenceDisplayId` (per-page instance)
in `bugs-latest.json`.

This is a **dual-write**, not a replacement:

- `DRU-`, `INS-`, and `MS-` continue to be generated exactly as before —
  nothing about them has changed, and no historical value has been
  recomputed or reformatted.
- The new fingerprints are additional fields alongside the existing ones.
- Generation for all of these (legacy and new) is centralized in
  [`tools/a11y-fingerprints.js`](tools/a11y-fingerprints.js), shared by
  `core/tests/playwright/scripts/analyze-patterns.js` and
  `tests/playwright/scripts/merge-results.js`. See
  [`tools/a11y-fingerprints.test.js`](tools/a11y-fingerprints.test.js) for
  golden tests asserting the legacy formulas are unchanged and the new
  fingerprints match the frozen profiles' published test vectors.
- A short `A11Y-PAT-`/`A11Y-OCC-` display ID is **not** authoritative — see
  [ACCESSIBILITY_FINDING_TRACKING.md](https://mgifford.github.io/ACCESSIBILITY.md/examples/ACCESSIBILITY_FINDING_TRACKING.html)
  for why. Use the full 64-character fingerprint for any automated
  comparison.

Do not change the frozen fingerprint profiles, their canonicalization, or
their display-ID derivation in `tools/a11y-fingerprints.js` without first
reading
[the fingerprint profile stability requirements](https://mgifford.github.io/ACCESSIBILITY.md/examples/fingerprints/README.html) —
a profile change that alters an already-emitted fingerprint requires a new
profile version, not an in-place edit.

### Pattern tracker map

[`reports/pattern-tracker-map.json`](reports/pattern-tracker-map.json) links
a pattern ID (and its `a11y/pattern/v1` fingerprint) to a filed Drupal.org
issue, when one exists. This is separate from the `drupal_issue` field
already present on some patterns in `bugs-latest.json` (drawn from
`analyze-patterns.js`'s internal rule+selector fix table): the tracker map
is keyed by the stable pattern identifier itself, so it survives even if the
fix-table heuristic that originally matched the pattern changes.

Regenerate it after a scan with:

```bash
node tools/build-pattern-tracker-map.js
```

This only adds entries for patterns whose `drupal_issue` is a real, filed
Drupal.org issue URL (not a `.../issues/new` placeholder). It never guesses
or infers a tracker relationship — see the file's own `notes` field.

---

## 6. Scheduling Regular Runs

### macOS launchd (recommended for local dev)

Create `~/Library/LaunchAgents/com.drupal.a11y-crawl.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.drupal.a11y-crawl</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>-c</string>
    <string>cd /Users/mike.gifford/drupal-core/core && yarn a11y:crawl-and-report >> /tmp/drupal-a11y.log 2>&1</string>
  </array>
  <key>StartCalendarInterval</key>
  <dict>
    <key>Weekday</key><integer>1</integer>
    <key>Hour</key><integer>6</integer>
    <key>Minute</key><integer>0</integer>
  </dict>
  <key>RunAtLoad</key>
  <false/>
</dict>
</plist>
```

```bash
# Install (runs every Monday at 6am)
launchctl load ~/Library/LaunchAgents/com.drupal.a11y-crawl.plist

# Run manually now
launchctl start com.drupal.a11y-crawl

# Unload
launchctl unload ~/Library/LaunchAgents/com.drupal.a11y-crawl.plist
```

### cron (Linux / CI)

```bash
# Run every Monday at 6am, log to /tmp/drupal-a11y.log
0 6 * * 1 cd /path/to/drupal-core/core && yarn a11y:crawl-and-report >> /tmp/drupal-a11y.log 2>&1
```

### GitLab CI (already configured)

The `🎭 Playwright A11y` job in `.gitlab-ci.yml` runs on a daily schedule and on MRs that touch `.twig` files. The CI job uses the single-theme crawl (no drush theme switching). Multi-theme crawl is a local/periodic workflow.

---

## 7. Fixing a Violation

### Step 1 — Identify the template

1. Open `reports/PATTERN-REPORT-latest.md`.
2. Find the violation — note the **pattern_id** (`DRU-XXXXXXXX`), the **Drupal file(s)** field, and the **Suggested fix** code block.
3. Confirm the template with Twig debug if needed: in `settings.local.php`, set `$settings['twig_debug'] = TRUE;`. Twig debug comments in the HTML show the exact template file.

### Step 2 — File a drupal.org issue (if not already filed)

- Tag: `Accessibility`
- Component: affected module or theme
- Priority: match the axe impact (Critical → Critical, Serious → Major, Moderate → Normal, Minor → Minor)
- Include the `pattern_id`, selector, WCAG criterion, and the suggested fix from the report

### Step 3 — Make the fix

Follow the [Drupal Accessibility Coding Standards](https://www.drupal.org/docs/getting-started/accessibility/accessibility-coding-standards):

- Prefer semantic HTML over ARIA
- Use `visually-hidden` class to hide content from sighted users only
- Use `Drupal.announce()` for dynamic content changes
- Use `aria-expanded`, `aria-describedby`, `aria-current` where semantic HTML is insufficient
- Group related form elements with `<fieldset>` and `<legend>`
- Honour `prefers-reduced-motion` for animations

### Step 4 — Verify locally

Re-run the crawl and confirm the violation is gone:

```bash
cd core
yarn test:a11y:playwright
yarn a11y:analyze

# Check that the pattern_id is no longer in the report
jq '.issues[] | select(.pattern_id == "DRU-XXXXXXXX")' reports/bugs-latest.json
# Should return nothing if fixed
```

Also check cross-theme — if the pattern was universal, confirm it's gone from all themes.

### Step 5 — Add a regression test

```bash
cd core
yarn a11y:add-regression \
  --rule listitem \
  --page /admin/content \
  --issue 3318XXX \
  --name "Content list action links are properly wrapped in a ul"
```

This appends a permanent guard to `tests/a11y-regressions.spec.ts`. The test hard-fails if the violation ever re-appears.

### Step 6 — Commit and push

```bash
git add <changed-template-or-css-file> core/tests/playwright/tests/a11y-regressions.spec.ts
git commit -m "fix(a11y): [#ISSUE] description of fix

Fixes: <rule-id> violation on <template-name>
Pattern ID: DRU-XXXXXXXX
Themes affected: universal / claro / admin
Pages fixed: N (template-level fix)
axe impact: serious/critical/moderate
WCAG: <criterion>

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"

# Push to your GitHub mirror
git push github main

# Push a patch branch to drupal.org issue fork
git push drupal-NNNNNN HEAD:11.x
```

---

## 8. Adding Pages to the Inventory

When core adds a new route or you find a page type not covered, add it to `lib/pages.ts`:

```typescript
// In anonymousPages or adminPages array:
{
  name: 'My new page',
  path: '/my/path',
  requiresAuth: false,
  // viewport: { width: 375, height: 812 }, // uncomment for mobile-specific tests
},
```

All rules run on every page — there are no per-page suppressions. If a page has a known tracked issue that is not yet fixed, the violation will appear in the report with the matching `DRU-` pattern ID and can be filtered there.

To add a new **theme** to the crawl, edit `lib/theme-configs.ts` and add an entry to `THEME_CONFIGS`.

---

## 9. CI Integration

### GitLab CI jobs

| Job | Stage | Trigger |
| :--- | :--- | :--- |
| `🦉 Nightwatch` | ⚡️ Tests | Every MR |
| `🎭 Playwright A11y` | 🗜️ Additional tests | Daily schedule; MR touching `.twig` files or `tests/playwright/` |

### Artifacts

The `🎭 Playwright A11y` job saves:
- `axe-results.json` — full per-page violation data (90-day retention)
- `bugs.json` — structured bug report (90-day retention)
- `PATTERN-REPORT.md` — human-readable report (available directly in GitLab CI artifacts)

### Viewing CI results

In GitLab, on any completed `🎭 Playwright A11y` pipeline:
1. Open the job → **Browse** artifacts
2. Download or preview `PATTERN-REPORT.md`

---

## 10. Tracking Progress Over Time

The stable `DRU-XXXXXXXX` pattern IDs make it possible to track the accessibility debt reduction over time:

```bash
# Count unique patterns in each scan (look for decreasing numbers)
for f in reports/bugs-*.json; do
  echo "$f: $(jq '.summary.uniquePatterns' "$f") patterns"
done

# Count universal (cross-theme) issues
jq '.summary.crossThemeAnalysis.universalCount' reports/bugs-latest.json

# List all serious+ issues not yet fixed
jq -r '.issues[] | select(.impact == "serious" or .impact == "critical") | "\(.pattern_id) \(.rule_id) \(.frequency.pages_affected) pages"' \
  reports/bugs-latest.json | sort -k3 -rn
```

Each committed `bugs-YYYY-MM-DD.json` in git history gives a permanent record. The `DRU-` IDs are stable across scans, so you can `grep` for a pattern ID across the git history to see when a bug was introduced or fixed.

---

## 11. Phased Rule Re-enablement in Nightwatch

The Nightwatch tests still suppress some axe rules for CI noise reasons. Now that the Playwright crawl captures everything, re-enabling them in Nightwatch is lower urgency. The current priority (tracked in `ACCESSIBILITY.md` section 9):

1. `duplicate-id-aria` — Critical, WCAG 2.2 A → [#3318398](https://drupal.org/i/3318398)
2. `duplicate-id-active` — Serious, WCAG 2.2 A → [#3318394](https://drupal.org/i/3318394)
3. `color-contrast` — Serious, WCAG 2.2 AA → [#3318394](https://drupal.org/i/3318394)
4. `heading-order` — Moderate, WCAG 2.2 A → [#3318398](https://drupal.org/i/3318398)
5. `region` — Moderate, WCAG 2.2 A → [#3318396](https://drupal.org/i/3318396)

Work one rule at a time. File all child issues before starting. See `ACCESSIBILITY.md` section 9 for the full process.

---

## 12. Quick Reference

```bash
# ── Full workflow ──────────────────────────────────────────────────────────
# Run multi-theme crawl + analyze + commit reports (all-in-one)
cd core && yarn a11y:crawl-and-report

# ── Individual steps ───────────────────────────────────────────────────────
# Run multi-theme axe crawl only (~15-20 min, switches 3 themes via drush)
cd core && yarn test:a11y:playwright

# Run virtual screen reader crawl (semantic validation, ~3 min)
cd tests/playwright && NODE_TLS_REJECT_UNAUTHORIZED=0 npx playwright test --grep "Virtual SR"

# Run virtual SR modal dialog tests
cd tests/playwright && NODE_TLS_REJECT_UNAUTHORIZED=0 npx playwright test --grep "Virtual SR.*modal"

# Analyze latest crawl results → reports/bugs-latest.{json,csv,md}
cd core && yarn a11y:analyze

# Run Lighthouse audit
cd core && yarn test:a11y:lighthouse

# Add regression test after fixing a violation
cd core && yarn a11y:add-regression --rule RULE --page /path --issue NNNNNN

# ── Reports ───────────────────────────────────────────────────────────────
# Open latest human-readable report
open reports/PATTERN-REPORT-latest.md

# Count unique bugs in latest scan
jq '.summary.uniquePatterns' reports/bugs-latest.json

# List all serious+ issues
jq -r '.issues[] | select(.impact == "serious" or .impact == "critical") | "\(.pattern_id) \(.rule_id)"' \
  reports/bugs-latest.json

# Inspect a specific bug by pattern ID
jq '.issues[] | select(.pattern_id == "DRU-XXXXXXXX")' reports/bugs-latest.json

# Extract archive from a previous scan
tar -xzf reports/archive/2026-03-31.tar.gz

# ── Setup ──────────────────────────────────────────────────────────────────
# Install Playwright browser (first time only)
cd core && npx playwright install chromium --with-deps
```

---

## Related Files

| File | Purpose |
| :--- | :--- |
| `ACCESSIBILITY.md` | Standards, severity taxonomy, governance |
| `core/tests/playwright/lib/pages.ts` | Page inventory for crawls |
| `core/tests/playwright/lib/theme-configs.ts` | Theme configurations (Olivero / Claro / Admin) |
| `tests/playwright/lib/virtual-sr.ts` | Virtual SR helpers (inject, audit, analyze, cross-reference) |
| `core/tests/playwright/tests/a11y-axe-crawl.spec.ts` | Multi-theme axe crawl |
| `tests/playwright/tests/a11y-virtual-sr-crawl.spec.ts` | Multi-theme virtual SR crawl |
| `tests/playwright/tests/a11y-modal-sr.spec.ts` | Virtual SR modal dialog validation |
| `core/tests/playwright/tests/a11y-regressions.spec.ts` | Regression guards |
| `core/tests/playwright/scripts/analyze-patterns.js` | Pattern analyzer + report generator |
| `core/tests/playwright/scripts/add-regression.js` | Regression test scaffolding |
| `core/tests/Drupal/Nightwatch/Tests/a11yTestDefault.js` | Nightwatch axe (Olivero) |
| `core/tests/Drupal/Nightwatch/Tests/a11yTestAdmin.js` | Nightwatch axe (Claro) |
| `.gitlab-ci.yml` | CI pipeline configuration |
| `reports/` | Scan outputs — dated JSON, CSV, MD; archive/ for previous scans |
| `GUIDE-TO-GUIDEUP-AND-AXE-IN-DRUPAL.md` | Standalone guide to virtual SR + axe-core approach |

---
