# Evidence: issue 2942404 (system messages)

Status: **DRAFT, AI-assisted.** Scripted evidence only; no person has reviewed it.
Last updated: 2026-11-26.

This file records the current Variant C evidence first, then the earlier evidence with its original
revision identity. Do not read a result from one revision as a result for another.

**Revision note (2026-11-26).** The three-patch stack below is the code used by the browser and
screen-reader runs in this file. The CI follow-up
([branches/2942404-ci-fixes.patch](branches/2942404-ci-fixes.patch)) is a fourth local patch
against MR head `b11a4441`. It changes `message.js` internals, two BigPipe fixture strings,
three performance expected values and one `JsMessageTest` method; it does not change the Twig
templates. The four-patch PHPUnit, BigPipeTest and lint results are in
[CI-FIXES.md](CI-FIXES.md). The lint report linked below was regenerated for the four-patch tree.

## Evidence: Variant C with ownership-safe lifecycle, 2026-11-26 (three-patch code; see revision note)

### Environments and revisions

| Side | Environment | Core commit | Patch stack |
|---|---|---|---|
| Before | `baseline-2942404-latest` | `0387fb948f786bc344a5cc54aa0d98b8f552e378` (2026-11-25) | none |
| After | `issue-2942404-consolidated` | `0387fb948f786bc344a5cc54aa0d98b8f552e378` (2026-11-25) | `2942404-consolidated-region.patch`, `2942404-consolidated-message-landmark.patch`, `2942404-consolidated-ownership.patch` |

The variant is `2942404-final` (issue-scoped), which extends `2942404-consolidated` and overrides the
After patch stack. The environment was not rebuilt; the third patch was applied and recorded in
place. Patch state is `verified` with no tracked changes outside the patches.

### Final commands

```bash
node tools/compare/setup.mjs 2942404-final --check-patches
node tools/playwright/evaluate-2942404.mjs 2942404-final
node tools/playwright/screenreader-2942404.mjs 2942404-final --mode=virtual
node scripts/lint.mjs 2942404-final
cd envs/issue-2942404-consolidated
ddev phpunit core/tests/Drupal/FunctionalJavascriptTests/Core/MessageLandmarkTest.php
ddev phpunit core/tests/Drupal/FunctionalJavascriptTests/Core/JsMessageTest.php
ddev phpunit core/modules/big_pipe/tests/src/FunctionalJavascript/BigPipeMessagesTest.php
ddev phpunit core/tests/Drupal/FunctionalJavascriptTests/Ajax/MessageCommandTest.php
```

### Final results

- Chromium light, 1280x900:
  [`playwright/2026-11-26T03-33-47-385Z-chromium-light-1280x900`](playwright/2026-11-26T03-33-47-385Z-chromium-light-1280x900/SUMMARY.md).
  0 After checks not met, 0 axe regressions, 8 scenarios.
- Guidepup virtual:
  [`screenreader/2026-11-26T03-34-45-279Z`](screenreader/2026-11-26T03-34-45-279Z/SUMMARY.md).
  After exposes `region, System messages`; the inner roles are unchanged.
- Lint:
  [`lint/2026-11-26-2942404-final-after.md`](lint/2026-11-26-2942404-final-after.md), PASS,
  CSpell/PHPStan/PHPCS/ESLint/Twig CS fixer, 14 files (four-patch tree; see the revision note).

PHPUnit on the three-patch code (the same four suites also pass on the four-patch tree with the
same counts; the BigPipeTest results are in [CI-FIXES.md](CI-FIXES.md)):

| Test | Result |
|---|---|
| `MessageLandmarkTest` | OK, 1 test |
| `JsMessageTest` | OK, 5 tests, 46 assertions |
| `BigPipeMessagesTest` | OK, 1 test, 3 assertions |
| `MessageCommandTest` | OK, 2 tests, 61 assertions |

The ownership and detection tests were first run against the earlier v2 lifecycle code, with the
same test files and no production change:

- `testLandmarkOwnership` failed at
  `[data-drupal-messages][role="alert"][aria-label="External messages"] not found`: v2 removed the
  attributes another script had set.
- `testMessageDetection` failed because an unrelated `[role="status"]` kept the landmark.

Both pass after the ownership/detection patch. `testMultipleInstances` and the server-plus-JavaScript
clear case pass on the final code.

The final stack and full patch were applied to separate throwaway worktrees of pristine
`0387fb948f78`; all 10 files had identical SHA-256 hashes. Final hashes:

- `branches/2942404-consolidated-full.patch`: `162da4576775cd4925f414a3e7bc8c6a142c18cd57f0eb34d91cadfc43f1f779`
- `branches/2942404-consolidated-ownership.patch`: `6cb142553971da7038a5d886c5c37e060677eaed3e05ef62991cce7f5f32bdbe`
- `interdiff/interdiff-consolidated-v2-to-final.diff`: `6cb142553971da7038a5d886c5c37e060677eaed3e05ef62991cce7f5f32bdbe`

### Real VoiceOver evidence

The 06:39 run is for the **final three-patch** implementation. Both After routes reached the button
and exposed `System messages region`; the groups kept `status`/`alert`, headings stayed at level 2,
and the unsolicited announcement was the combined three-message string. Its Before administration
route reached the button and had no message region. Its Before front route did not start (VoiceOver
reported "Heading not found" and did not reach the button); the earlier 01:31 run supplies that
Before-front result.

The 01:31, 01:38 and 01:42 runs are for the **two-patch** implementation. They show both After
routes, both Before routes, the same named region and the same combined announcement. They are kept
for their own revision identity.

macOS, Safari and VoiceOver versions are not in the run JSON and are not inferred. Tool versions for
the 01:31/01:42 runs: Node 22.23.5, npm 10.9.9, Guidepup 0.40.0, Guidepup setup 0.29.3, Guidepup
virtual reader 0.33.0.

## Earlier evidence: v2 lifecycle, 2026-11-26

### Environments and revisions

| Side | Environment | Core commit | Patch stack |
|---|---|---|---|
| Before | `baseline-2942404-latest` | `0387fb948f786bc344a5cc54aa0d98b8f552e378` (2026-11-25) | none |
| After | `issue-2942404-consolidated` | `0387fb948f786bc344a5cc54aa0d98b8f552e378` (2026-11-25) | `2942404-consolidated-region.patch` then `2942404-consolidated-message-landmark.patch` |

- Standard install, DDEV, PHP 8.5.7, Drupal 12.0-dev, recipe `recipes/repro_2942404`
  (Article content type, `system_test`, and the lab-only `lab_status_messages` page).
- Default and admin theme on both sides: Default Admin. The theme actually rendering each page is
  recorded in every scenario from `drupalSettings.labActiveTheme`. The recipe description's earlier
  claim that Stark was the front-end theme was wrong for this install.
- Patch state in the final run: `verified` for all files; no tracked changes outside the patches.
- The November 25 runtime identity was `92e5c3a30476`; this run's runtime identity is
  `0387fb948f78`. The old environments were absent (trimmed), so they were not rebuilt at the old
  commit and the old evidence was not repinned.

### Commands

```bash
node tools/compare/setup.mjs 2942404-consolidated
node tools/compare/setup.mjs 2942404-consolidated --check-patches
node tools/playwright/evaluate-2942404.mjs 2942404-consolidated
node tools/playwright/screenreader-2942404.mjs 2942404-consolidated --mode=virtual
node scripts/lint.mjs 2942404-consolidated
cd envs/issue-2942404-consolidated
ddev phpunit core/tests/Drupal/FunctionalJavascriptTests/Core/MessageLandmarkTest.php
ddev phpunit core/tests/Drupal/FunctionalJavascriptTests/Core/JsMessageTest.php
ddev phpunit core/modules/big_pipe/tests/src/FunctionalJavascript/BigPipeMessagesTest.php
ddev phpunit core/tests/Drupal/FunctionalJavascriptTests/Ajax/MessageCommandTest.php
```

### Chromium light, 1280x900

Run:
[`playwright/2026-11-26T00-41-15-177Z-chromium-light-1280x900`](playwright/2026-11-26T00-41-15-177Z-chromium-light-1280x900/SUMMARY.md).

All eight scenarios were rendered by Default Admin on both sides. The all-types fixture is core's
`system_test` page, which is the only stock page with a server-rendered warning.

| Scenario | Before | After |
|---|---|---|
| `article-saved` | no message role/name on the container; status group `status` | one `region` "System messages"; status group `status` |
| `article-form-error` | no container landmark; error group `alert` | one region; error group `alert` |
| `status-admin-cache-cleared` | no container landmark; status group `status` | one region; status group `status` |
| `js-warning-and-status` | no container landmark; JS warning `alert` and status `status` | one region; roles unchanged |
| `all-types-fixture` | no container landmark; status, warning and error groups | one region; warning stays `alert` |
| `js-next-to-server-messages` | no container landmark | one region; JS message is not inside another live region |
| `empty-state` | no `[data-drupal-messages]` | no container, no landmark |
| `logged-out-error` | no container landmark; error group `alert` | one region; error group `alert` |

Acceptance checks, After: 0 failures. They cover the default container, construction without a
message, first add, repeated adds, individual removal, clearing all JavaScript messages, restoration,
custom wrappers outside and inside the default container, author-defined role/name preservation,
empty containers, focus, and theme recording. Before fails the landmark checks and passes the
preservation/focus checks, which is the expected shape: the new behavior is absent, the old behavior
is unchanged.

axe-core (WCAG 2.2 A/AA tags), Before → After, per scenario: `0 → 0` for all eight.

Recorder counts (live-region changes / `Drupal.announce()` calls), Before → After: unchanged for
every scenario. The JavaScript warning/status scenario records 2 live changes and 3 announce calls on
both sides; this is a recorder observation, not speech.

### Drupal.Message lifecycle (After)

| Step | Container role | Accessible name | "System messages" regions |
|---|---|---|---|
| empty page | none | — | 0 |
| construct only | none | — | 0 |
| first add | region | System messages | 1 |
| second add | region | System messages | 1 |
| remove one | region | System messages | 1 |
| clear all JavaScript messages | none | — | 0 |
| add after clear | region | System messages | 1 |
| contextual wrapper outside | none (wrapper unchanged) | — | 0 |
| contextual wrapper inside | none (wrapper unchanged) | — | 0 |
| author-defined role/name, then add | region | Author-defined messages (not overwritten) | 0 "System messages" |

Focus is `body` at every step; adding, removing and clearing messages does not move focus.

### Duplicate IDs, by value

The only duplicate IDs in this run are six Views table-header IDs on `/admin/content`, in the
`js-warning-and-status` and `empty-state` scenarios. The Before and After sets are identical.

| ID | Count | Elements |
|---|---|---|
| `view-title-table-column` | 2 | `<th class="sortable-heading views-field views-field-title">` ×2 |
| `view-type-table-column` | 2 | `<th class="sortable-heading views-field views-field-type">` ×2 |
| `view-name-table-column` | 2 | `<th class="priority-low views-field views-field-name">` ×2 |
| `view-status-table-column` | 2 | `<th class="sortable-heading views-field views-field-status">` ×2 |
| `view-changed-table-column` | 2 | `<th class="priority-low sortable-heading views-field views-field-changed is-active">` ×2 |
| `view-operations-table-column` | 2 | `<th class="views-field views-field-operations">` ×2 |

These are not caused by the message change and are not fixed here. The November 25 run recorded the
count (6) but not the identities; this run establishes both the values and the identical Before/After
set.

### Screen reader

Guidepup virtual screen reader:
[`screenreader/2026-11-26T00-43-17-095Z`](screenreader/2026-11-26T00-43-17-095Z/SUMMARY.md).

- Before: no "System messages" region; messages are exposed as `status`, `alert`, `alert`.
- After: `region, System messages` wraps the server groups and the JavaScript messages; the inner
  groups remain `status`, `alert`, `alert`.
- The virtual reader does not speak live-region changes. The `#drupal-live-announce` text after the
  button is the three JavaScript messages joined in one region, the same on both sides.

See [SCREENREADER.md](SCREENREADER.md) for the repeated-transcript investigation and the human
VoiceOver protocol.

### PHPUnit

After, all pass:

| Test | Result |
|---|---|
| `MessageLandmarkTest` | OK, 1 test, 2 PHPUnit assertions (the Mink assertions are not counted) |
| `JsMessageTest` (including the new lifecycle method) | OK, 2 tests, 41 assertions |
| `BigPipeMessagesTest` | OK, 1 test, 3 assertions |
| `MessageCommandTest` | OK, 2 tests, 61 assertions |

On unmodified Before, with the same test files copied in temporarily, the new landmark assertions
fail before reaching the rest of each test:

- `MessageLandmarkTest`: `Element matching css "[data-drupal-messages][role="region"][aria-label="System messages"]" not found.`
- `BigPipeMessagesTest`: the same missing element at the first BigPipe route.
- `MessageCommandTest`: the same missing element after the first default AJAX message.

The copied files were removed afterwards. The baseline checkout was left with only the recipe's
untracked test support (`modules/custom/`, `recipes/`).

### Lint

[`lint/2026-11-26-2942404-consolidated-after.md`](lint/2026-11-26-2942404-consolidated-after.md):
PASS (exit 0), CSpell, PHPStan, PHPCS, ESLint and Twig CS fixer. 10 files. Code style and static
analysis only; not accessibility evidence.

### Patch verification

- `node tools/compare/setup.mjs 2942404-consolidated --check-patches`: both patches apply cleanly in
  order to `0387fb948f78`.
- The full patch and the two-patch stack were each applied to throwaway worktrees of pristine
  `0387fb948f78`. All 10 resulting files had identical SHA-256 hashes. The full patch is
  `branches/2942404-consolidated-full.patch`; the stack is the two files listed above.
- The interdiff against the Twig-only Variant C patch is the second patch in content:
  `interdiff/interdiff-consolidated-v1-to-v2.diff` (sha256 `0f4ee1eb...`).

### Not verified in this run

- Any screen reader used by a person (VoiceOver, NVDA, JAWS, TalkBack), a keyboard pass, or testing
  with disabled people.
- Default Admin's dismissal behavior (existing defect; see EXPLAINER.md).
- Stark, starterkit and Umami in a browser on this core (Stark's system template is covered by
  `MessageLandmarkTest`; Umami is not).
- BigPipe in the Playwright evaluator (PHPUnit only), AJAX responses that carry a server-rendered
  message, multiple stock message containers on one page, and the #3618230 file-upload path.
- JavaScript disabled, 200% zoom, RTL, touch and a real OS high-contrast mode for this patch.

## Historical evidence: 2026-11-19/20 (design comparison, `92e5c3a30476`)

This was the original comparison of options, not the current patch. It compared main (no message
landmark) with the per-type region option (`2942404-main-region-option.patch`), which was Variant B.
The original defect (`role="contentinfo"`) did not reproduce on main.

- Seven runs (Chromium light, dark, forced colors, 480px; Firefox; WebKit) recorded zero new axe
  violations and no `contentinfo` in messages.
- The per-type option added one region per message type; the question of whether that is useful or
  noisy was left to a person.
- The option deliberately left out the old tests; it was not an upstream proposal and was never run
  through core's test suite.
- Files: the `2026-11-19T*` run directories, `branches/2942404-main-region-option.patch`,
  `lint/2026-11-19-2942404-latest-after.md`. The old MR evaluation is in
  [MR-EVALUATION.md](MR-EVALUATION.md).

## Historical evidence: 2026-11-25 (Variant C, `92e5c3a304`)

Preserved unchanged in its own run directories. It is runtime evidence for `92e5c3a304`; the
applicability of the patch to `0387fb948f` was checked separately and is not runtime evidence.

- Chromium light:
  [`playwright/2026-11-25T23-27-54-093Z-chromium-light-1280x900`](playwright/2026-11-25T23-27-54-093Z-chromium-light-1280x900/SUMMARY.md).
  Eight scenarios, zero axe violations on both sides, one region for server-rendered messages, no
  landmark for JavaScript-only messages, one landmark for mixed messages (containment to verify),
  no landmark on empty pages, six duplicate IDs on both sides (count only). The saved summary's
  heading and prose still describe the earlier per-type design; its `results.json` records
  `variant: "2942404-consolidated"` and the Twig-only Variant C patch. A
  [`NOTE.md`](playwright/2026-11-25T23-27-54-093Z-chromium-light-1280x900/NOTE.md) in that folder
  records the discrepancy. The 2026-11-26 evaluator output uses the corrected description.
- Guidepup virtual:
  [`screenreader/2026-11-25T23-48-06-731Z`](screenreader/2026-11-25T23-48-06-731Z/SUMMARY.md).
- Guidepup with real VoiceOver:
  [`screenreader/2026-11-25T23-50-28-424Z`](screenreader/2026-11-25T23-50-28-424Z/SUMMARY.md).
  VoiceOver read the System messages region and kept status/alert identification. The transcript's
  six repetitions of the three JavaScript messages are a navigation artifact, explained in
  [SCREENREADER.md](SCREENREADER.md), not six unsolicited announcements.

## CI follow-up: 2026-11-26

MR !17968 failed CI on `BigPipeTest::testBigPipe`, `BigPipeTest::testBigPipeNoJs` and three
performance budgets (`OpenTelemetryPerformanceTest`, `MultipleRequestsPerformanceTest`,
`StandardPerformanceTest`). Full detail, commands and reasoning:
[CI-FIXES.md](CI-FIXES.md). Summary of what was run:

| Check | Before | After |
|---|---|---|
| `BigPipeTest` (full class, after the fixture fix) | — | OK, 5 tests, 160 assertions |
| `BigPipeTest::testBigPipe` + `::testBigPipeNoJs` (after the fixture change) | — | OK, 2 tests, 90 assertions |
| `MessageLandmarkTest` | — | OK, 1 test, 2 assertions |
| `JsMessageTest` | — | OK, 6 tests, 47 assertions |
| `BigPipeMessagesTest` | — | OK, 1 test, 3 assertions |
| `MessageCommandTest` | — | OK, 2 tests, 61 assertions |
| `node scripts/lint.mjs 2942404-final` | — | PASS (CSpell, PHPStan, PHPCS, Twig CS, ESLint; 14 files, four-patch tree) |
| `core/misc/message.js`, compact bytes | 2,765 | 4,643 (+1,878) |
| `core/misc/message.js`, source bytes | 8,424 | 13,293 (+4,869) |

The follow-up patch is [`branches/2942404-ci-fixes.patch`](branches/2942404-ci-fixes.patch),
sha256 `14f1f5d3eb3cf355ec8077a118c084c16ead80148d41f59288dbc03a11e703df`; the full squashed
patch is [`branches/2942404-consolidated-full-v2.patch`](branches/2942404-consolidated-full-v2.patch),
sha256 `a5cb02b0aa6012f385715ad8df68a565c1e3f02d36eea5c8d988e05ce69f58f9`. Both were applied
to throwaway worktrees; the 14 files from the full patch matched the tested files by SHA-256.

The three performance tests could not be executed here: `PerformanceTestBase` skips core
performance tests on MariaDB, and this lab runs MariaDB 11.8. The `ScriptBytes` centres were
moved by the measured compact delta only; the tolerance was not changed. The three updated
fixtures are `administratorNodePage.yml` (189,038), `umamiFrontAndRecipePagesAuthenticated.yml`
(62,549) and `testAdmin.yml` (156,990).

During the run the host disk filled and Docker Desktop remounted its VM disk read-only
(`emergency_ro`); PHPUnit could not write `tempnam()` files and browser tests could not install
a site. Restarting Docker Desktop recovered it. The test results above were recorded before and
after that event with the same code and the same test counts. This is infrastructure, not a code
failure.
