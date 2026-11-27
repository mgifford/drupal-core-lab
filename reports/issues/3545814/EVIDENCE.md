# Evidence: #3545814 Exposed filters with exposed operators are missing accessible names

**DRAFT.** Automated evidence recorded 2026-11-27. A person has not reviewed it and no real screen reader was run.

## Revisions evaluated

| | |
|---|---|
| Issue | [#3545814](https://www.drupal.org/project/drupal/issues/3545814), status **Needs work** (13), priority Normal, component `views.module`, tags **Accessibility, wcag412, Needs manual testing** (taxonomy terms 1101, 5148, 195758), unassigned, 20 comments, last changed 2026-07-27 |
| Merge request | [!13201](https://git.drupalcode.org/project/drupal/-/merge_requests/13201), opened, `3545814-numeric-filter-value-field-missing-name` into `main` |
| MR head | `12d23affb91181da61feadb7676386ee8bf28c50` (2026-11-27); tests at `2b30abc36b`, proposal C at `12d23affb9` |
| MR base / both Lab sides | `87de7098664fd7bb741f51d47ec750ab0a178c5a` (2026-07-25, Drupal 12.0-dev) |
| Current core `main` checked for applicability | `8a7df6cc3e69b6b5d427cb25ce8f66dda8393c29` (2026-11-27), checked 2026-11-27; the MR, test and C patches apply when stacked. `main` moves several times a day, so this is a timestamped check, not a standing claim. |
| MR review threads | 0 human threads; the 5 entries on the MR are system notes (target-branch change and commit pushes). The GitLab API v4 discussions endpoint answered HTTP 401, so the MR page's `discussions.json` endpoint was read instead. |
| MR CI | Pipeline **1071860 finished: passed with warnings** on the `12d23affb9` merge ref (2026-11-27T21:55Z). Lint **passed**; Tests **warning**. The two failed jobs are `PHPUnit Unit (Core): [8.6-ubuntu]` and `PHPUnit Unit (Component): [8.6-ubuntu]` (experimental PHP 8.6, allowed to fail); they also failed on the pre-C pipeline 1071829. Kernel, Functional, FunctionalJavascript and Nightwatch jobs passed. Additional tests were skipped. |

## Revision history (2026-11-27)

The MR moved during this evaluation. The Lab's browser evidence and PHPUnit fail/pass runs were recorded on the 26 July tip `d7e538c3` (base `87de7098`). On 27 November the branch was rebased onto `main` `c706424d7e` (616 upstream commits), then two commits were added by the issue owner:

- `2b30abc36b` — regression tests in `core/modules/views/tests/src/Functional/Plugin/ExposedFormTest.php` and `core/modules/views_ui/tests/src/Functional/FilterNumericWebTest.php`. They assert the native label association and the `Value` text, and `visually-hidden` for the content-type select. This supersedes the Lab's test interdiff: it is the same coverage, placed in `ExposedFormTest` instead of the Lab's `FilterTest` + new view.
- `12d23affb9` — proposal C folded in: `#title_display => $exposed ? 'invisible' : 'before'` in `NumericFilter::valueForm()`.

Current MR snapshot: `branches/3545814-mr13201-12d23affb9.diff` (5,814 bytes, sha256 `721feffab03d…`). The one-line C hunk is byte-identical to the Lab's corrected patch and applies cleanly at the new tip. The browser runs were not repeated on the rebased tip; CI is the validation for that revision.

Related issues read: parent [#933004](https://www.drupal.org/i/933004) (open), [#2096013](https://www.drupal.org/i/2096013) (open, exposed operators should have field labels), [#2625136](https://www.drupal.org/i/2625136) (closed: label visibility and wrapper container for exposed numeric/date filters), child/related [#3629900](https://www.drupal.org/i/3629900) (open, other missing `#title` values), plus the testing-policy issues named in comments #6, #7 and #15-#20. No competing branch or newer MR for #3545814 was found: the issue fork has one branch and the issue page lists one MR.

## Environments

| Side | Environment | Core | Patch stack |
|---|---|---|---|
| Before | `envs/baseline-3545814` | `87de7098664f` | none |
| After (MR) | `envs/issue-3545814` | `87de7098664f` | `3545814-numeric-filter-value-field-missing-name.patch` (sha256 `26ec2416f8f8…`) |
| After (proposal C) | `envs/issue-3545814-c` — **built and installed 2026-11-27** with `repro_3545814` | `87de7098664f` | MR patch (`26ec2416…`), then corrected `3545814-proposal-c-hide-numeric-value-label.patch` (sha256 `7aed4387344c…`) |

Recipe: `recipes/repro_3545814/` (core `article_content_type` fixture + core `tags_taxonomy` + `field_tags` + `views.view.repro_3545814` + `seed.php`). Both sides: Standard profile, front-end theme Olivero, admin theme Claro, PHP 8.5.7, 39 modules, identical module list.

## Patch artifacts

| Patch | Starting tree | sha256 | Applies to current `main` |
|---|---|---|---|
| `branches/3545814-numeric-filter-value-field-missing-name.patch` (immutable MR snapshot, 2 files) | `87de7098664f` | `26ec2416f8f82c410e91c800763b684ed5a78ef872774124de07c7d24df15046` | yes |
| `branches/3545814-tests-accessible-names.patch` (test-only interdiff, 3 files) | pristine core, or MR applied | `e46db38f450bcae6390ed0884f2ddec5b712f83ccabf385632701fd3055d3d63` | yes |
| `branches/3545814-combined-mr13201-plus-tests.patch` (complete proposal, 5 files) | `87de7098664f` | `638dca90c42e5279dd9023cf9fff5427f031dd4b552e7e4ef06afdec6d881c13` | yes |
| `branches/3545814-proposal-c-hide-numeric-value-label.patch` (corrective interdiff, 1 file) | MR applied | `7aed4387344cdaf2493d4a1321074f590429e117b69107e69a67aad6b0110f20` | yes (on MR) |
| `branches/3545814-proposal-c-mr13201-plus-c-plus-tests.patch` (MR + C + tests) | `87de7098664f` | `b07e411b89a960388c153f7af717d83d0f6ccb723ebb07dea82cd3cbd32763d8` | yes |

Each was checked with `git apply --check` against its declared tree, and the stacked proposal (MR, then C, then tests) against `8a7df6cc3e` on 2026-11-27. No unified-diff context marker was altered.

**Proposal C was corrected during review.** Its first draft set `#title_display => $exposed ? 'invisible' : NULL`. A present-but-`NULL` key is kept by Form API's `+=` defaults, so the label would not be rendered in the Views filter configuration form, where the issue summary asks for it to stay unchanged. The shipped interdiff uses `'before'` (the Form API default) instead; the original draft is superseded, was never run, and is not one of the files above.

## Rendered controls (Chromium 159.0.8154.6, light, 1280×900)

Run: `reports/issues/3545814/playwright/2026-11-27T13-39-33-840Z-chromium-light-1280x900/`. Native `<label for>` association and the computed accessible name (Playwright `ariaSnapshot`), on `/repro-3545814`:

| Control | Before | After (MR) | After (proposal C, recorded) |
|---|---|---|---|
| Numeric `id_open[value]` | **no label, no name** | label `Value`, **visible**; name `Value` | expected: label `Value`, visually hidden; name `Value` |
| Numeric operator `id_open_op` | label `Operator`, visually hidden; name `Operator` | unchanged | expected: unchanged |
| Content type `type` | **no label, no name** | label `Content types`, visually hidden; name `Content types` | expected: unchanged |
| Content type operator `type_op` | label `Operator`; name `Operator` | unchanged | expected: unchanged |
| Tags `tags` | **no label, no name** | label `Select terms from vocabulary Tags`, visually hidden; name `Select terms from vocabulary Tags` | expected: unchanged |
| Tags operator `tags_op` | label `Operator`; name `Operator` | unchanged | expected: unchanged |
| Fixed-operator `id_fixed` | label `ID (fixed operator)`, visible; no fieldset | unchanged | expected: unchanged |

Fieldset legends are unchanged on all three: `ID (exposed operator)`, `Content type`, `Tags`. Min/max labels in the numeric fieldset are `Min` and `Max` on both sides.

The same result holds in the View configuration preview (`/admin/structure/views/view/repro_3545814/edit`, "Update preview"): Before has no name on the numeric field and the content type select; After has `Value` and `Content types`.

## axe-core (WCAG 2.0 to 2.2 A/AA)

| Page | Before | After (MR) | After (C, recorded) |
|---|---|---|---|
| `/repro-3545814` | 3 nodes: `label` 1, `select-name` 2 | **0** | expected: 0 |
| View configuration preview | 3 nodes: `label` 1, `select-name` 2 | **0** | expected: 0 |

The three nodes are exactly the three unnamed controls. axe reports them; the accessible-name and label evidence above is independent of axe.

## Visual difference introduced by the MR alone

`before-numeric.png` (353×238) and `after-numeric.png` (353×256): After adds a visible `Value` label under the `ID (exposed operator)` legend and the fieldset grows by 18 px. The MR's own comment says "Hide label when operator is exposed", and the issue summary says "Visually, no changes". Proposal C removes the visible label and keeps the accessible name (`#title_display => 'invisible'` when the operator is exposed, `'before'` in the configuration form). It was recorded in the Lab: in the run below the numeric label renders with class `visually-hidden`, its accessible name stays `Value`, axe reports 0, and `after-numeric.png` is 353×238, the same as Before (the MR alone is 353×256). The fixed-operator branch is untouched by the patch.

## Proposal C run (recorded)

Run [`playwright/2026-11-27T16-41-46-552Z-chromium-light-1280x900/`](playwright/2026-11-27T16-41-46-552Z-chromium-light-1280x900/SUMMARY.md), variant `3545814-proposal-c`: Before `87de709866` (pristine), After the same core with the MR patch (`26ec2416…`) then the corrected C patch (`7aed4387…`). Recipe `917e9e76…` on both sides; Chromium 159, light, 1280×900; no tracked files outside the two patches.

- Verdict `reproduced-and-fixed`, 0 judged rows not as expected.
- Numeric value field: label `Value`, `visuallyHidden: true`, accessible name `Value`. Content type and Tags labels unchanged from the MR run.
- axe naming violations: 3 before, 0 after.
- `after-numeric.png` 353×238, the same as `before-numeric.png`; the MR alone was 353×256, so the 18 px visible-label growth is gone.
- Operator names, fieldset legends, the fixed-operator filter and all six submissions match the MR run.

| C run | Environment | Verdict |
|---|---|---|
| [2026-11-27T16-41-46-552Z](playwright/2026-11-27T16-41-46-552Z-chromium-light-1280x900/SUMMARY.md) | Chromium 159, light, 1280×900 | reproduced-and-fixed, 0 unexpected |
| [2026-11-27T19-14-13-735Z](playwright/2026-11-27T19-14-13-735Z-chromium-dark-1280x900/SUMMARY.md) | Chromium 159, dark, 1280×900 | reproduced-and-fixed, 0 unexpected |
| [2026-11-27T19-16-13-629Z](playwright/2026-11-27T19-16-13-629Z-chromium-light-forced-1280x900/SUMMARY.md) | Chromium 159, forced colours, 1280×900 | reproduced-and-fixed, 0 unexpected |
| [2026-11-27T19-17-16-485Z](playwright/2026-11-27T19-17-16-485Z-chromium-light-480x900/SUMMARY.md) | Chromium 159, light, 480×900 | reproduced-and-fixed, 0 unexpected |
| [2026-11-27T19-18-37-816Z](playwright/2026-11-27T19-18-37-816Z-webkit-light-1280x900/SUMMARY.md) | WebKit 27.2, light, 1280×900 | reproduced-and-fixed, 0 unexpected |

Each of the five runs checks the same rows as the MR run: accessible names, axe naming violations, fieldset legends, operator names, the fixed-operator filter and the six submissions. In all five the numeric label is visually hidden, the fieldset is 353×238 and axe reports no naming violation.

**Configuration-form check (the issue's manual-test case).** The Views filter handler form for both numeric filters (`nid_open` exposed with operator, `nid_fixed` fixed operator) was opened on Before and on MR+C. The `Value` field's label text, visibility and geometry are identical: label `Value`, `visually-hidden: false`, visible, 291×48 px. Evidence: `verification/config-form/` (two JSON captures and screenshots). The first `NULL` draft of C would have failed this check; the recorded patch uses `'before'`.

## Functional behaviour (real input, page reload)

| Submission | Before rows | After rows |
|---|---|---|
| ID is greater than 2 | Gamma, Delta | Gamma, Delta |
| ID is between 2 and 3 | Beta, Gamma | Beta, Gamma |
| ID is empty | (none) | (none) |
| Content type is one of Article | Alpha, Beta, Gamma, Delta | Alpha, Beta, Gamma, Delta |
| Tags is one of News | Alpha, Beta | Alpha, Beta |
| Fixed ID = 3 | Gamma | Gamma |

Query strings and selected values matched; no AJAX is used by the basic exposed form (the preview uses AJAX and was observed in the run's `ajax-*.json`).

## Keyboard

Real Tab presses from the top of the page: 29 stops reach the operator select, then the numeric value field. Before, the value field announces no name; After, it announces `Value`. Focus order is otherwise unchanged. A scripted Tab walk is not a person's keyboard pass.

## Proposed PHPUnit coverage (run with `ddev phpunit`, both sides)

| Test | Before | After |
|---|---|---|
| `views_ui` `FilterNumericWebTest::testFilterNumericUI` (existing test, new assertions) | **FAIL** — `Tests: 1, Assertions: 93, Failures: 1`; `Failed asserting that null is not null.` (no label for the value field) | **PASS** — `OK (1 test, 95 assertions)` |
| `views` `FilterTest::testExposedOperatorLabels` (new method, existing class) | **FAIL** — `Tests: 1, Assertions: 10, Failures: 1`; same message | **PASS** — `OK (1 test, 14 assertions)` |

Logs: `tests/before-numeric.log`, `tests/after-numeric.log`, `tests/before-filter.log`, `tests/after-filter.log`.

On proposal C (MR + C) the same two tests pass with the same counts: `OK (1 test, 95 assertions)` and `OK (1 test, 14 assertions)` (`tests/c-numeric.log`, `tests/c-filter.log`). The label is visually hidden but still present with the text `Value`, which is what the tests assert. The C checkout was restored to the two patched production files afterwards. The test patch applies to pristine core and to the MR; the checkouts were restored after the runs (Before had no tracked change; After had only the two MR files).

## Findings

1. **The reported defect is real and the MR fixes it.** Before, the numeric value field, the content type select and the Tags select have no accessible name when their operator is exposed. The fieldset legend groups them but does not name them (WCAG 4.1.2; axe `label` and `select-name`).
2. **The MR also fixes the cases in comment #8** (content type and taxonomy, not just numeric), because the base-class change keeps the title and hides it instead of unsetting it.
3. **The MR alone adds a visible `Value` label to the numeric filter** (+18 px fieldset). This contradicts the issue's "Visually, no changes" and the MR's own "Hide label when operator is exposed". Proposal C is the one-line correction; the fixed-operator filter and every other control are unchanged.
4. **Taxonomy/select labels are generic but meaningful enough**: `Select terms from vocabulary Tags` and `Content types`. The fieldset legend supplies the filter label independently.
5. **No duplicate ARIA was added.** All associations are native `label[for]`; there is no `aria-label` on any of these controls.
6. **The MR snapshot still applies to current `main`**, and the proposed test interdiff applies to both the pinned base and `main`.

## Independent verification (second pass, 2026-11-27)

A second agent re-checked the package without trusting the numbers above. Method and results:

1. **MR snapshot identity.** The published MR diff (`merge_requests/13201.diff`, 2159 bytes, sha256 `4abe2400…`) was fetched and its hunks compared with `branches/3545814-numeric-filter-value-field-missing-name.patch` after normalising index headers and hunk line numbers: identical content. The lab patch is a faithful snapshot of the 26 July MR head `d7e538c3` (kept for the browser evidence). The 27 November head `12d23affb9` is snapshotted in `branches/3545814-mr13201-12d23affb9.diff`.
2. **Test interdiff identity.** Applying `branches/3545814-tests-accessible-names.patch` to pristine copies of the three files in a scratch git repository reproduces the three files in `tests-proposal/` byte for byte.
3. **Patch applicability.** Re-checked on 2026-11-27 against core `main` `8a7df6cc3e` (checked at that commit; `main` moves several times a day): MR patch applies; test patch applies on pristine and on MR; corrected proposal C applies on MR; MR + C + tests applies to pristine. A corrected proposal C that used `NULL` would fail the issue's configuration-form requirement (see Patch artifacts).
4. **Rendered DOM, independent capture.** `curl` fetched `/repro-3545814` from both sites (HTTP 200) and the exposed-form fragments are kept in `verification/`. Before: no `<label for>` for `id_open[value]`, `type` or `tags`; operator selects have visually hidden labels; the fixed filter has a visible label. After: the `Value` label is present **without** `visually-hidden` (a visible change); `Content types` and `Select terms from vocabulary Tags` carry `visually-hidden`; the fixed filter markup is unchanged. The same fragment was captured in light, dark, forced-colours and 480 px browser runs: the label classes are identical in each, and the forced-colours capture was confirmed with `matchMedia('(forced-colors: active)').matches`.
5. **Computed names, axe, keyboard and submissions, independent script.** A small Playwright script written for this review (not `tools/playwright/evaluate-3545814.mjs`) recorded on 2026-11-27: accessible names before none / `Content types` / `Select terms from vocabulary Tags`, after `Value` / `Content types` / `Select terms from vocabulary Tags`; the operator selects and the fixed filter unchanged; axe `label` 1 + `select-name` 2 before and 0 after; real Tab reached the numeric field on both sides; typing `3` and pressing Enter returned `Gamma` on both sides; the same six filter submissions returned identical rows on both sides; no JavaScript errors. Raw result: `verification/independent-focus.json`; form fragments and screenshots are in the same folder.
6. **Configuration form (the issue's manual-test case).** The numeric value title is `Value` in the configuration form before and after the MR, and the label's display is the Form API default; the MR does not change the configuration form. The corrected proposal C explicitly keeps `'before'` there, so it stays unchanged; the first `NULL` draft would have suppressed the label (see Patch artifacts).
7. **Claims cross-checked.** `tree-diff/` and `screenreader.mjs` were not run (both need the sites, and the host ran out of DDEV capacity), so no synthetic speech evidence was produced. `node scripts/lint.mjs` was not used, but the same PHPCS and PHPStan were run directly and passed (`lint/LINT.md`).

## Resource usage

- Three environments are now built (`baseline-3545814`, `issue-3545814`, `issue-3545814-c`), about 0.6 GB each on disk including the shared core worktree; the third was built and seeded in about 20 minutes in a quiet window on 2026-11-27.
- Five current Playwright runs and two stale ones, each with screenshots and `results.json` (a few MB); the containers were already running for other work and were reused.
- PHPUnit: four runs of one test method each, about 4.5 minutes total.
- Browser downloads for the lab's resolved Playwright revision: Chromium 100 MB, WebKit 82 MB, Firefox 108 MB. Disk stayed around 15 GB free.
- The machine was shared with several other sessions; earlier attempts had to wait, and the proposal C build was done only after a quiet window (load1 under 10). No environment was deleted.

## Not verified

- **Firefox has no recorded run** (a launch/page crash on this host, recorded as blocked). The proposal C variant has Chromium light, dark, forced-colours, 480 px and WebKit runs; it does not have a Firefox run.
- **The remaining browser work could not be scheduled.** When this pass finished (2026-11-27), both sites were down and the host load average was between 40 and 106 from other sessions. A last recovery attempt made both containers healthy (nginx and php-fpm running) but the shared DDEV router did not serve TLS requests (curl 000) and was being restarted by the other sessions' commands, so a Chromium light run, `tree-diff`/synthetic speech and the wider related-test run could not be started. They remain gaps in COVERAGE.md and NEXT-STEPS.md.
- The 13:39 Chromium light run is marked stale by `scripts/coverage.mjs` because the recipe later gained `config.strict: false` for idempotent re-application; no fixture content changed. The later Chromium dark, forced-colours, 480 px and WebKit runs are current and cover the same View on both sides.
- A real screen reader (NVDA, JAWS, VoiceOver) and a person's keyboard pass; no Guidepup/tree-diff synthetic speech capture was produced for this issue (both need the sites running).
- A Chromium light 1280 px run against the current recipe: only the stale 13:38/13:39 runs exist; the current matrix has dark, forced-colours, 480 px and WebKit runs. See COVERAGE.md.
- Firefox (the Lab's macOS 27 host could not launch it; not recorded as a pass), WebKit and dark/forced-colours runs beyond those listed in the coverage report.
- Date, string, boolean, multiple-value and grouped exposed filters (not in this View; see FILTER-MATRIX.md).
- Translations (`exposedTranslate` with a non-English UI) and a subdirectory install.
- The one CI job that failed on the MR (PHPUnit Unit Component 8.6) was not investigated; it is not in the changed code's test suite.
- The wider related test classes (`ExposedFormTest`, `ExposedFormCheckboxesTest`, `views_ui` `ExposedFormUITest`) were not run: only the changed `FilterNumericWebTest` and the new `FilterTest` method were executed. They are listed in NEXT-STEPS.md for the first pass on a free host.
