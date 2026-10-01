# Patch Evaluation Report: a11y-DRUPAL-A11Y-002-submit-button-contrast

**Generated:** 2026-07-18 at 6:13:07 p.m.

## Summary

- **Description:** Fix primary button color contrast on admin yellow accent
- **WCAG Criteria:** 1.4.3 (AA)
- **Affected Rules:** color-contrast
- **Pattern Source:** reports/pattern-report-2026-07-05.json
- **Pattern Source (Markdown):** reports/pattern-report-2026-07-05.md
- **Pattern ID Match Type:** runtime-generated-only
- **Matched Pattern IDs (pattern source):** none
- **Generated Pattern IDs (current run):** DRU-6be5aeb9, DRU-bc27b0a7, DRU-85a47615
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
- **Pattern source age (hours):** 121.46
- **Case generation mode:** fallback-config-testCases
- **Case generation count:** 1
- **Case generation fallback reason:** no-configured-pattern-ids
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
- Flow: Apply patch with: git apply "/Users/mike.gifford/drupal-core/patches/a11y-DRUPAL-A11Y-002-submit-button-contrast.patch"
- Flow: Clear Drupal cache with: ddev drush cache-rebuild
- Flow: Revisit same URL + conditions and capture post-patch evidence.
- Flow: Revert patch with: git apply -R "/Users/mike.gifford/drupal-core/patches/a11y-DRUPAL-A11Y-002-submit-button-contrast.patch"
- Variant ID: `default`
- Expected proof: Problem must be observed before patch and not observed after patch under the same recorded conditions.

### Drupal Initial State Snapshot

- **Captured at:** 2026-07-18T22:12:53.801Z
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

### Test 1: /action-link

**Skipped:** baseline-target-not-observed

**Skip diagnostics:**
- Requested rules: ["color-contrast"]
- Required conditions: {"authRequired":false,"requested":{"screenType":"desktop","orientation":"landscape","colorMode":"light","direction":"ltr","viewport":{"width":1280,"height":1024}},"observedBefore":{"screenType":"desktop","orientation":"landscape","viewport":{"width":1280,"height":1024},"colorMode":"light","direction":"ltr","language":"en","colorSchemeDetected":"light","prefersContrast":"no-preference","forcedColors":"none","theme":"unknown","bodyClasses":["user-logged-in","path-action-link"]}}
- Matching rule violations before: {"color-contrast":0}
- Selector counts before: {"a[hreflang=\"he\"]":1,"#edit-submit":1,".button--action":1}
- Navigation before: {"requestedUrl":"http://drupal-core.ddev.site/action-link","finalUrl":"http://drupal-core.ddev.site/action-link","httpStatus":200,"redirected":false,"title":"Action links | Drush Site-Install","authState":{"loggedInClass":true,"logoutLink":true,"loginForm":false,"uid":1,"authenticated":true},"selectorCounts":{}}
- Reproduction candidates: [{"patternId":"DRU-01429747","ruleId":"color-contrast","path":"/contact/imagefile_image","selector":"#edit-imagefile-image-plain-dis-N--description","preferred":false},{"patternId":"DRU-01429747","ruleId":"color-contrast","path":"/contact/imagefile_image","selector":"#edit-imagefile-image-plain-dis-N--description > em","preferred":false},{"patternId":"DRU-01429747","ruleId":"color-contrast","path":"/contact/imagefile_image","selector":"#edit-imagefile-image-multi-dis-N--description","preferred":false},{"patternId":"DRU-0460FE2F","ruleId":"color-contrast","path":"/contact/imagefile_file","selector":"#edit-imagefile-file-dis-N--description","preferred":false},{"patternId":"DRU-0460FE2F","ruleId":"color-contrast","path":"/contact/imagefile_file","selector":"#edit-imagefile-file-dis-N--description > em","preferred":false},{"patternId":"DRU-0460FE2F","ruleId":"color-contrast","path":"/contact/imagefile_file","selector":"#edit-imagefile-file-req-dis-N--description","preferred":false},{"patternId":"DRU-05EC5EAB","ruleId":"color-contrast","path":"/admin/structure/types/manage/test_type/display/default","selector":".region-hidden-message > td[colspan=\"9\"]","preferred":false},{"patternId":"DRU-08EA9B05","ruleId":"color-contrast","path":"/contact/textform","selector":"#edit-daterange-ad-disabled-N--description","preferred":false},{"patternId":"DRU-09E68687","ruleId":"color-contrast","path":"/admin/structure","selector":".toolbar-button--icon--system-admin-structure > .toolbar-button__label[data-toolbar-text=\"\"]","preferred":false},{"patternId":"DRU-09E68687","ruleId":"color-contrast","path":"/admin/structure/block","selector":".toolbar-button--icon--system-admin-structure > .toolbar-button__label[data-toolbar-text=\"\"]","preferred":false}]
- Auth setup: {"attempted":true,"success":true,"method":"uli","uli":"http://drupal-core.ddev.site/user/reset/1/1784412784/[REDACTED]/login","finalUrl":"http://drupal-core.ddev.site/user/1/edit?pass-reset-token=[REDACTED]&check_logged_in=1","authState":{"loggedInClass":true,"logoutLink":true,"loginForm":true,"uid":1,"authenticated":true},"credentialAttempted":false,"error":null}
- Auth before case: {"ensured":true,"neededRelogin":false,"before":{"loggedInClass":true,"logoutLink":true,"loginForm":true,"uid":1,"authenticated":true},"after":{"loggedInClass":true,"logoutLink":true,"loginForm":true,"uid":1,"authenticated":true},"loginAttempt":null}

---

## Screenshots

Captured 2 screenshot(s) for this run. See the reports directory.

## HTML Snapshots

Captured 3 HTML snapshot(s) for this run.
