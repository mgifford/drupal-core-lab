# Patch Evaluation Report: a11y-DRUPAL-A11Y-004-tabindex-buttons-test-form

**Generated:** 2026-07-18 at 6:13:35 p.m.

## Summary

- **Description:** Remove explicit tabindex from buttons on test form
- **WCAG Criteria:** 2.1.1 (A)
- **Affected Rules:** tabindex
- **Pattern Source:** reports/pattern-report-2026-07-05.json
- **Pattern Source (Markdown):** reports/pattern-report-2026-07-05.md
- **Target Pattern IDs:** DRU-CC36FB25
- **Pattern ID Match Type:** source-pattern-not-found
- **Matched Pattern IDs (pattern source):** none
- **Generated Pattern IDs (current run):** DRU-CC36FB25
- **Status:** 🟨 **INCONCLUSIVE** — No baseline instances were observed on targeted URLs/selectors
- **Outcome Reason:** `no-baseline-instances-observed`
- **Eligible For Patch Recommendation:** no
- **Requested color mode:** light
- **Patch preflight applicability:** applicable
- **Drupal initial state capture:** complete
- **Enabled modules (captured):** 45
- **Enabled modules hash:** 93861e900fb087fa20408946f236688feaac6b4726845e8ee70dfc7b73caf4e9
- **Core extension hash:** 4972863d3552dc4475c3453886cab6ba2cb69c93e53c35dd5d9fb646765d7a0d
- **Pattern source modified:** 2026-07-13T20:45:12.596Z
- **Pattern source age (hours):** 121.47
- **Case generation mode:** fallback-config-testCases
- **Case generation count:** 1
- **Case generation fallback reason:** no-pattern-ids-matched-in-report
- **Page load HTTP statuses (baseline):** 200x1
- **Pages loaded successfully (2xx):** 1/1
- **Pages not loaded as 2xx:** 0/1
- **Skip reasons:** baseline-target-not-observedx1
- **ID consistency issues:** patterns=0, instances=0
- **Pattern observed before patch attempt:** no
- **Baseline observed instances:** 0
- **Fixed instances after patch:** 0
- **Remaining instances after patch:** 0

### Replication Instructions

Use the following deterministic steps to reproduce this exact evaluation run:

- Setup: `ddev drush cset system.theme default olivero -y`
- Setup: `ddev drush cset system.theme admin claro -y`
- Setup: `ddev drush cache-rebuild`
- Flow: Navigate to each test case URL under requested conditions and capture baseline evidence.
- Flow: Apply patch with: git apply "/Users/mike.gifford/drupal-core/patches/a11y-DRUPAL-A11Y-004-tabindex-buttons-test-form.patch"
- Flow: Clear Drupal cache with: ddev drush cache-rebuild
- Flow: Revisit same URL + conditions and capture post-patch evidence.
- Flow: Revert patch with: git apply -R "/Users/mike.gifford/drupal-core/patches/a11y-DRUPAL-A11Y-004-tabindex-buttons-test-form.patch"
- Variant ID: `default`
- Expected proof: Problem must be observed before patch and not observed after patch under the same recorded conditions.

### Drupal Initial State Snapshot

- **Captured at:** 2026-07-18T22:13:19.440Z
- **Capture status:** complete
- **Default theme:** olivero
- **Admin theme:** claro
- **Enabled modules count:** 45
- **Enabled modules hash (sha256):** 93861e900fb087fa20408946f236688feaac6b4726845e8ee70dfc7b73caf4e9
- **Core extension hash (sha256):** 4972863d3552dc4475c3453886cab6ba2cb69c93e53c35dd5d9fb646765d7a0d
- **Core extension modules hash (sha256):** 31108b91acada94f2d8a50c9dee0956211b7218c5aada5f96ac3d2034099b00c
- **Core extension themes hash (sha256):** 30fb50fc341bcb258551ff29e9614194623fb4bbacb6032385a72afe815686ef
- **Drush status:** {"drupal-version":"12.0-dev","uri":"http://drupal-core.ddev.site","db-driver":"mysql","db-hostname":"db","db-port":3306,"db-username":"db","db-password":"db","db-name":"db","db-status":"Connected","bootstrap":"Successful","theme":"olivero","admin-theme":"claro","php-bin":"/usr/bin/php8.5","php-conf":["/etc/php/8.5/cli/php.ini"],"php-os":"Linux","php-version":"8.5.7","drush-script":"/var/www/html/vendor/bin/drush.php","drush-version":"14.9999999.9999999.9999999-dev","drush-temp":"/tmp","drush-conf":[],"drush-alias-files":[],"alias-searchpaths":[],"install-profile":"standard","root":"/var/www/html","drupal-settings-file":"sites/default/settings.php","site":"sites/default","themes":"sites/all/themes","modules":"sites/all/modules","files":"sites/default/files","temp":"/tmp","config-sync":"sites/default/files/sync","config":"sites/default/files/sync","%paths":{"%root":"/var/www/html","%site":"sites/default","%modules":"sites/all/modules","%themes":"sites/all/themes","%config-sync":"sites/default/files/sync","%config":"sites/default/files/sync","%files":"sites/default/files","%temp":"/tmp"}}
- **Enabled modules sample (first 40):** a11y_test_routes, actionlink, announcements_feed, autocomplete, automated_cron, big_pipe, block, block_content, breakpoint, ckeditor5, config, contextual, datetime, dblog, dynamic_page_cache, editor, field, field_ui, file, filter, form_style, help, image, layout_builder, layout_discovery, link, menu_link_content, menu_ui, mysql, navigation, node, options, page_cache, path, path_alias, search, system, taxonomy, test_multifield_desc, text
- **Commands used:**
  - ✅ `ddev drush pm:list --type=module --status=enabled --format=json`
  - ✅ `ddev drush cget system.theme --format=json`
  - ✅ `ddev drush cget core.extension --format=json`
  - ✅ `ddev drush status --format=json`

### Pattern Source Candidates

| Path | Modified |
|---|---|
| reports/pattern-report-2026-07-05.json | 2026-07-13T20:45:12.596Z |

### Violation Counts

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| **Total violations** | 0 | 0 | 0 |

---

## Test Cases

### Test 1: /buttons

**Skipped:** baseline-target-not-observed

**Skip diagnostics:**
- Requested rules: ["tabindex"]
- Required conditions: {"authRequired":false,"requested":{"screenType":"desktop","orientation":"landscape","colorMode":"light","direction":"ltr","viewport":{"width":1280,"height":1024}},"observedBefore":{"screenType":"desktop","orientation":"landscape","viewport":{"width":1280,"height":1024},"colorMode":"light","direction":"ltr","language":"en","colorSchemeDetected":"light","prefersContrast":"no-preference","forcedColors":"none","theme":"unknown","bodyClasses":["user-logged-in","path-buttons"]}}
- Matching rule violations before: {"tabindex":0}
- Selector counts before: {"button[tabindex]":1}
- Navigation before: {"requestedUrl":"http://drupal-core.ddev.site/buttons","finalUrl":"http://drupal-core.ddev.site/buttons","httpStatus":200,"redirected":false,"title":"Buttons | Drush Site-Install","authState":{"loggedInClass":true,"logoutLink":true,"loginForm":false,"uid":1,"authenticated":true},"selectorCounts":{}}
- Reproduction candidates: []
- Auth setup: {"attempted":true,"success":true,"method":"uli","uli":"http://drupal-core.ddev.site/user/reset/1/1784412811/[REDACTED]/login","finalUrl":"http://drupal-core.ddev.site/user/1/edit?pass-reset-token=[REDACTED]&check_logged_in=1","authState":{"loggedInClass":true,"logoutLink":true,"loginForm":true,"uid":1,"authenticated":true},"credentialAttempted":false,"error":null}
- Auth before case: {"ensured":true,"neededRelogin":false,"before":{"loggedInClass":true,"logoutLink":true,"loginForm":true,"uid":1,"authenticated":true},"after":{"loggedInClass":true,"logoutLink":true,"loginForm":true,"uid":1,"authenticated":true},"loginAttempt":null}

---

## Screenshots

No screenshots were captured for this run.

## HTML Snapshots

Captured 1 HTML snapshot(s) for this run.
