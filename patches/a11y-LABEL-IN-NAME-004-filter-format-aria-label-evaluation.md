# Patch Evaluation Report: a11y-LABEL-IN-NAME-004-filter-format-aria-label

**Generated:** 2026-07-18 at 6:09:10 p.m.

## Summary

- **Description:** Fix label-in-name violation for filter format configure link
- **WCAG Criteria:** 2.5.3 (A)
- **Affected Rules:** label-in-name (axe: label-content-name-mismatch)
- **Pattern Source:** reports/pattern-report-2026-07-05.json
- **Pattern Source (Markdown):** reports/pattern-report-2026-07-05.md
- **Pattern ID Match Type:** runtime-generated-only
- **Matched Pattern IDs (pattern source):** none
- **Generated Pattern IDs (current run):** DRU-90c99d19
- **Status:** ✅ **PASS** — Patch resolves targeted issues without introducing new violations
- **Outcome Reason:** `targeted-issues-fixed-without-regressions`
- **Eligible For Patch Recommendation:** yes
- **Requested color mode:** light
- **Patch preflight applicability:** applicable
- **Drupal initial state capture:** complete
- **Enabled modules (captured):** 44
- **Enabled modules hash:** ad1cdc924b2b1cd15043ba560c73bbf14337b4ff3410fa1bc17a71c7e3616c45
- **Core extension hash:** 9a0f64d89757cd8922c06a275a7513f0b59d73c1efa179691a31539f95c39e04
- **Pattern source modified:** 2026-07-13T20:45:12.596Z
- **Pattern source age (hours):** 121.4
- **Case generation mode:** fallback-config-testCases
- **Case generation count:** 1
- **Case generation fallback reason:** no-configured-pattern-ids
- **Page load HTTP statuses (baseline):** 200x1
- **Pages loaded successfully (2xx):** 1/1
- **Pages not loaded as 2xx:** 0/1
- **ID consistency issues:** patterns=0, instances=0
- **Pattern observed before patch attempt:** yes
- **Baseline observed instances:** 1
- **Fixed instances after patch:** 1
- **Remaining instances after patch:** 0

### Replication Instructions

Use the following deterministic steps to reproduce this exact evaluation run:

- Setup: `ddev drush cset system.theme default olivero -y`
- Setup: `ddev drush cset system.theme admin claro -y`
- Setup: `ddev drush cache-rebuild`
- Flow: Navigate to each test case URL under requested conditions and capture baseline evidence.
- Flow: Apply patch with: git apply "/Users/mike.gifford/drupal-core/patches/a11y-LABEL-IN-NAME-004-filter-format-aria-label.patch"
- Flow: Clear Drupal cache with: ddev drush cache-rebuild
- Flow: Revisit same URL + conditions and capture post-patch evidence.
- Flow: Revert patch with: git apply -R "/Users/mike.gifford/drupal-core/patches/a11y-LABEL-IN-NAME-004-filter-format-aria-label.patch"
- Variant ID: `default`
- Expected proof: Problem must be observed before patch and not observed after patch under the same recorded conditions.

### Drupal Initial State Snapshot

- **Captured at:** 2026-07-18T22:08:51.619Z
- **Capture status:** complete
- **Default theme:** olivero
- **Admin theme:** claro
- **Enabled modules count:** 44
- **Enabled modules hash (sha256):** ad1cdc924b2b1cd15043ba560c73bbf14337b4ff3410fa1bc17a71c7e3616c45
- **Core extension hash (sha256):** 9a0f64d89757cd8922c06a275a7513f0b59d73c1efa179691a31539f95c39e04
- **Core extension modules hash (sha256):** fae84ec4543b6e91218b9c29981b0c6f3b2d22782c8c94deed6d50bdea5deab1
- **Core extension themes hash (sha256):** 30fb50fc341bcb258551ff29e9614194623fb4bbacb6032385a72afe815686ef
- **Drush status:** {"drupal-version":"12.0-dev","uri":"http://drupal-core.ddev.site","db-driver":"mysql","db-hostname":"db","db-port":3306,"db-username":"db","db-password":"db","db-name":"db","db-status":"Connected","bootstrap":"Successful","theme":"olivero","admin-theme":"claro","php-bin":"/usr/bin/php8.5","php-conf":["/etc/php/8.5/cli/php.ini"],"php-os":"Linux","php-version":"8.5.7","drush-script":"/var/www/html/vendor/bin/drush.php","drush-version":"14.9999999.9999999.9999999-dev","drush-temp":"/tmp","drush-conf":[],"drush-alias-files":[],"alias-searchpaths":[],"install-profile":"standard","root":"/var/www/html","drupal-settings-file":"sites/default/settings.php","site":"sites/default","themes":"sites/all/themes","modules":"sites/all/modules","files":"sites/default/files","temp":"/tmp","config-sync":"sites/default/files/sync","config":"sites/default/files/sync","%paths":{"%root":"/var/www/html","%site":"sites/default","%modules":"sites/all/modules","%themes":"sites/all/themes","%config-sync":"sites/default/files/sync","%config":"sites/default/files/sync","%files":"sites/default/files","%temp":"/tmp"}}
- **Enabled modules sample (first 40):** actionlink, announcements_feed, autocomplete, automated_cron, big_pipe, block, block_content, breakpoint, ckeditor5, config, contextual, datetime, dblog, dynamic_page_cache, editor, field, field_ui, file, filter, form_style, help, image, layout_builder, layout_discovery, link, menu_link_content, menu_ui, mysql, navigation, node, options, page_cache, path, path_alias, search, system, taxonomy, test_multifield_desc, text, theming_tools
- **Commands used:**
  - ✅ `ddev drush pm:list --type=module --status=enabled --format=json`
  - ✅ `ddev drush cget system.theme --format=json`
  - ✅ `ddev drush cget core.extension --format=json`
  - ✅ `ddev drush status --format=json`

### Pattern Source Candidates

| Path | Modified |
|---|---|
| reports/pattern-report-2026-07-05.json | 2026-07-13T20:45:12.596Z |

### Validation Proof (Before/After)

This run captured the target violation before patch application and confirmed it was absent after patch application under the same recorded conditions.

- Baseline observed: 1
- Fixed after patch: 1
- Remaining after patch: 0
- New violations introduced: 0

### Instance ID Coverage

- **Targeted instance IDs:** 1
- **Seen before patch:** 1
- **Fixed instances:** 1
- **Remaining instances:** 0
- **Not observed in baseline:** 0

| Instance ID | Pattern ID | Rule | Path | Status | Before IDs | After IDs |
|---|---|---|---|---|---|---|
| DRU-bb2f2dd6 | DRU-90c99d19 | label-content-name-mismatch | /admin/config/content/formats | fixed | DRU-bb2f2dd6, DRU-8a215924, DRU-fb14af17, DRU-8701c8e8 | - |

### Violation Counts

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| **Total violations** | 4 | 0 | -4 |

### Fixed Rules

- `label-content-name-mismatch`: 4 → 0 (−4)

---

## Test Cases

### Test 1: /admin/config/content/formats

**URL:** `http://drupal-core.ddev.site/admin/config/content/formats`

**Elements tested:** table a:has-text("Configure")

**Conditions:**
- Requested: {"screenType":"desktop","orientation":"landscape","colorMode":"light","direction":"ltr","viewport":{"width":1280,"height":1024}}
- Before: {"screenType":"desktop","orientation":"landscape","viewport":{"width":1280,"height":1024},"colorMode":"light","direction":"ltr","language":"en","colorSchemeDetected":"light","prefersContrast":"no-preference","forcedColors":"none","theme":"unknown","bodyClasses":["user-logged-in","path-admin"]}
- After: {"screenType":"desktop","orientation":"landscape","viewport":{"width":1280,"height":1024},"colorMode":"light","direction":"ltr","language":"en","colorSchemeDetected":"light","prefersContrast":"no-preference","forcedColors":"none","theme":"unknown","bodyClasses":["user-logged-in","path-admin"]}

**Authentication:**
- Before case: {"ensured":true,"neededRelogin":false,"before":{"loggedInClass":true,"logoutLink":true,"loginForm":true,"uid":1,"authenticated":true},"after":{"loggedInClass":true,"logoutLink":true,"loginForm":true,"uid":1,"authenticated":true},"loginAttempt":null}

#### Before Patch

- **Total violations:** 4
- **By rule:**
  - `label-content-name-mismatch`: 4

#### After Patch

- **Total violations:** 0

---

## Screenshots

Captured 2 screenshot(s) for this run. See the reports directory.

## HTML Snapshots

Captured 2 HTML snapshot(s) for this run.
