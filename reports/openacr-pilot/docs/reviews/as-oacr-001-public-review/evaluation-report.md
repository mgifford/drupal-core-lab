# Accessibility Evaluation Report: Drupal 11.4.4 Standard Reference Installation

> **Status:** `TEST DRAFT — NOT FOR RELEASE`  
> **Evaluation ID:** `AS-OACR-001`  
> **No whole-product conformance claim is made.**

## Evaluation identity

- Report identifier/version: `AS-OACR-001-EVAL-TEST-DRAFT-1`
- Evaluator: `TBD — internal-test override; not release eligible`
- Commissioner: `TBD — internal-test override; not release eligible`
- Responsible product/release party: `TBD`
- Evaluation window: 2026-08-23 15:58–17:51 EDT (`America/New_York`)
- Methodology: WCAG-EM 2.0
- Conformance target for the test: WCAG 2.2 Level AA
- Eventual test-draft report title: `Drupal 11.4.4 Standard Reference Installation — AS-OACR-001 Test Draft`
- Product/version: `Drupal 11.4.4 Standard Reference Installation — AS-OACR-001 Test Build`, version `11.4.4`
- OpenACR author/contact placeholder: `TBD`, `tbd@example.invalid`
- Feedback channel: `TBD — private internal test; not a public contact channel`

Release roles and feedback ownership remain intentionally deferred to the Drupal Association. The `TBD` values did not block this internal methodology test; this artifact is not release material.

## Scope

The evaluated object was one reproducible local Drupal 11.4.4 installation at source commit `1eabaf9ecfc3d2308a12e9146d84bb51bcf0d48b`, tag object `440423db2eb28a6068c9c9da9fe6cc289b6a6242`, tree `9a61a224fdde8392975df8e5965b8caa7e81a2e8`, and target-freeze digest `68ba978ba1f82fce0afcf8485627f3819c500d1ab20747c23af865c948e381bf`.

In scope: the Standard profile, core modules only, English, Olivero public/authenticated surfaces, Claro authoring/administration surfaces, synthetic content/image/accounts, the 22 frozen page samples, and five complete processes. Local process mutations were limited to one retained synthetic Article, one retained blocked synthetic account with notification disabled, and one configuration marker that was restored.

Out of scope: contributed/custom modules, production or staging systems, production data/accounts, third-party services, Drupal.org profile/issue activity, non-web documents, audio/video content not present in the installation, and a Revised Section 508 evaluation. The selected catalog name is an output-format choice and does not expand the evaluation target.

This report does not generalize to Drupal generally, another installation profile, a different module/theme configuration, or a future release.

## Accessibility-support baseline

| Combination | Use | Result boundary |
|---|---|---|
| macOS 26.5.2 build 25F84 + Chrome 151.0.7922.172 | Playwright 1.62.1, axe-core 4.13.0, real keyboard events, DOM/CDP AX tree, viewport/visual checks | Primary collected baseline; CDP AX tree is not screen-reader evidence |
| macOS 26.5.2 + Safari 26.5.2 + native VoiceOver 10 | Invalid-login error path, rotor, interaction, and caption-panel evidence | Sampled screen-reader baseline; not a 22-page VoiceOver sweep |
| Native macOS Voice Control | Spoken-label activation probes | “Click Main Menu” activated the Olivero control and changed its expanded state; two other probes were inconclusive |
| keyboard-a11y-tester 0.5.0 at pinned commit `7e852a7daface267a5554ab7e55bab93178eae8f` | Independent desktop/mobile keyboard matrix and driven live-region sessions | 44 of 44 matrix runs completed; driven Space-key selection changes produced explicit polite announcements |
| 1280×800 desktop, 768×1024 tablet, and 320×568 mobile viewports | Default, text-spacing, and forced-colors layouts | All 22 samples; 66 viewport runs and 88 full-page screenshots |
| Chrome browser UI at verified 200% zoom | Actual Command+Plus input across the sample | All 22 samples; device-pixel-ratio change verified the browser zoom |
| WCAG text-spacing override | General geometry and screenshot checks | Exact spacing values applied on all 22 samples at desktop, tablet, and mobile viewports |
| Reduced-motion browser preference | Baseline context | No motion defect was confirmed; no cross-platform generalization |

Unavailable: Windows NVDA/JAWS, iOS VoiceOver, Android TalkBack, switch access, actual Windows forced colors, and mobile touch/screen-reader testing.

## Additional requirements

- Eventual machine-readable artifact: OpenACR catalog `2.5-edition-wcag-2.2-508-en`, marked `TEST DRAFT — NOT FOR RELEASE`.
- Finding unit: one stable component/semantic target/rule/failure-kind fingerprint.
- No issue status, issue freshness, or remediation activity was used as an outcome source.
- No federal annex was created because Section 508 scope was not declared.

## Technologies relied upon

HTML, CSS, JavaScript, WAI-ARIA where rendered, browser-native form controls, local PNG delivery, Drupal core 11.4.4, PHP 8.3.31, nginx 1.26.3, MariaDB 11.8.8, and DDEV 1.25.3. No non-web technology was relied upon.

## Method and evidence

- Deterministic exploration inventoried 358 declared routes, including 346 GET-capable pages, 275 admin pages, and 110 page-path families. The safe browser crawl observed 274 pages across four roles; the admin crawl cap left 378 queued links, so route inventory—not crawl completion—defines the broader enclosure.
- The frozen sample contained 20 structured and 2 deterministic random samples.
- The initial collection produced 50 sequential axe result files, default DOM facts, Chrome AX trees, real Tab/Shift+Tab traces, 320px geometry, text-spacing geometry, and screenshots.
- The full Playwright rerun completed 22 of 22 page tests. It recorded 1,183 forward and 1,161 reverse keyboard stops, closed the focus cycle on every page, ran axe in 44 default/expanded states, and collected 66 viewport checks plus 88 full-page screenshots.
- The independent keyboard-a11y-tester matrix completed 44 of 44 desktop/mobile runs. A driven content-selection session used real Tab and Space input and captured polite live-region announcements for both selection and deselection.
- Actual Chrome browser UI zoom was invoked with Command+Plus and verified at 200% on all 22 samples. Native Safari plus VoiceOver exposed the invalid-login error, and native macOS Voice Control successfully activated the Olivero Main Menu by its spoken label.
- Five driven complete processes used real keyboard activation for user-operable actions. Setup-only programmatic focus for the CKEditor-specific trace and direct local file injection were explicitly recorded.
- Automated output remained detector evidence. Link-in-text-block, target-size, transient link-name, table-drag focus, and landmark candidates were manually resolved with retained selector-level rendered facts, screenshots, DOM context, and pinned source receipts rather than automatically converted to failures.
- Public Drupal issue pages were searched only for remediation context. Nothing was posted; issue status did not change any criterion result.

## Sample set

### Structured and random samples

| ID | Selection | Role/theme | Path | States | Rationale |
|---|---|---|---|---|---|
| S-STR-001 | structured | anonymous/olivero | `/node` | ST-001, ST-002, ST-003, ST-004, ST-005, ST-008, ST-014, ST-015 | Public front/listing template, global navigation, skip link, empty/non-empty listing behavior, Olivero shared components. |
| S-STR-002 | structured | anonymous/olivero | `/node/1` | ST-001, ST-002, ST-003, ST-004, ST-005, ST-014, ST-015 | Published Basic page content detail and body markup in the public theme. |
| S-STR-003 | structured | anonymous/olivero | `/node/2` | ST-001, ST-002, ST-003, ST-004, ST-005, ST-010, ST-014, ST-015 | Published Article variation with local image and alternative text. |
| S-STR-004 | structured | anonymous/olivero | `/user/login` | ST-001, ST-002, ST-003, ST-005, ST-006, ST-007, ST-014, ST-015 | Authentication form, failure and success messages, autocomplete, focus transition, and session entry. |
| S-STR-005 | structured | anonymous/olivero | `/user/password` | ST-001, ST-002, ST-003, ST-005, ST-006, ST-014, ST-015 | Password-recovery instructions and validation without sending external mail. |
| S-STR-006 | structured | authenticated/olivero | `/user/2` | ST-001, ST-002, ST-003, ST-004, ST-005, ST-008, ST-014, ST-015 | Authenticated profile view and account navigation. |
| S-STR-007 | structured | authenticated/claro | `/user/2/edit` | ST-001, ST-002, ST-003, ST-005, ST-006, ST-007, ST-009, ST-014, ST-015 | Authenticated self-service account form, details disclosure, validation, and save status. |
| S-STR-008 | structured | author/claro | `/admin/content` | ST-001, ST-002, ST-003, ST-005, ST-008, ST-012, ST-014, ST-015 | Author-facing administration navigation, filters, table, bulk controls, and unpublished content. |
| S-STR-009 | structured | author/claro | `/node/add/article` | ST-001, ST-002, ST-003, ST-005, ST-006, ST-007, ST-009, ST-010, ST-011, ST-014, ST-015 | Primary authoring process with CKEditor, image upload, disclosures, validation, preview/save, and status messages. |
| S-STR-010 | structured | author/claro | `/node/2/edit` | ST-001, ST-002, ST-003, ST-005, ST-006, ST-007, ST-009, ST-010, ST-011, ST-014, ST-015 | Existing-content edit path and focus/status behavior after save. |
| S-STR-011 | structured | anonymous/claro | `/node/add` | ST-013, ST-002, ST-003, ST-005, ST-015 | Permission-denied response on an administrative route for a public user. |
| S-STR-012 | structured | admin/claro | `/admin` | ST-001, ST-002, ST-003, ST-005, ST-008, ST-014, ST-015 | Administration landing page and shared Navigation sidebar behavior. |
| S-STR-013 | structured | admin/claro | `/admin/people` | ST-001, ST-002, ST-003, ST-005, ST-008, ST-012, ST-014, ST-015 | Entity listing with table, exposed filters, checkboxes, actions, paging boundary, and user rows. |
| S-STR-014 | structured | admin/claro | `/admin/people/permissions` | ST-001, ST-002, ST-003, ST-005, ST-014, ST-015 | Very large permission matrix and sticky/dense table behavior. |
| S-STR-015 | structured | admin/claro | `/admin/structure/types/manage/article/fields` | ST-001, ST-002, ST-003, ST-005, ST-008, ST-012, ST-014, ST-015 | Field UI table, operations controls, local tasks, and entity configuration family. |
| S-STR-016 | structured | admin/claro | `/admin/structure/block` | ST-001, ST-002, ST-003, ST-005, ST-008, ST-009, ST-014, ST-015 | Block layout, region groupings, operations, placement controls, and responsive administration layout. |
| S-STR-017 | structured | admin/claro | `/admin/config/content/formats/manage/basic_html` | ST-001, ST-002, ST-003, ST-005, ST-006, ST-009, ST-011, ST-014, ST-015 | Complex text-format/CKEditor configuration, nested controls, orderable UI, and warning content. |
| S-STR-018 | structured | admin/claro | `/admin/config/system/site-information` | ST-001, ST-002, ST-003, ST-005, ST-006, ST-007, ST-014, ST-015 | Representative configuration form with required fields, validation, and reversible save process. |
| S-STR-019 | structured | admin/claro | `/admin/reports/status` | ST-001, ST-002, ST-003, ST-005, ST-009, ST-014, ST-015 | Status report with severity presentation, details disclosures, and diagnostic table-like content. |
| S-STR-020 | structured | admin/claro | `/admin/structure/views/view/content/edit/page_1` | ST-001, ST-002, ST-003, ST-005, ST-008, ST-009, ST-014, ST-015 | Views UI as the densest JavaScript-enhanced administration builder and overlay/dialog risk surface. |
| S-RND-001 | random | admin/claro | `/admin/people/create` | ST-001, ST-002, ST-003, ST-005, ST-014, ST-015 | Deterministic WCAG-EM Step 3.2 selection from eligible rank 1; digest 00de3528c1d259288e77d8ceef54716306e4dcb86260807497a496b0c9777877. |
| S-RND-002 | random | admin/claro | `/admin/content/block` | ST-001, ST-002, ST-003, ST-005, ST-014, ST-015 | Deterministic WCAG-EM Step 3.2 selection from eligible rank 2; digest 0105980936b2974d7973765104bcc9e8daf44b3c5db4c4c03e591e78d7d03ae0. |

Random selection used `ceil(10% × 20 structured samples) = 2`. The eligible universe contained 71 role/theme/route-family/state combinations after structured-family exclusion. The manifest SHA-256 was `3dbfdb3f392679b9552a018f467a0eccb5d0a7de358cec8b15e2f71d00272dee`; the ranked-list SHA-256 was `45d10c3f241b4230660c67c0ff3a3209405c12e7063bed54c19458a4b6c77cbe`. The selected random samples were `/admin/people/create` and `/admin/content/block`.

### Complete processes

| ID | Role | Sequence | Critical branches | Evidence |
|---|---|---|---|---|
| P-01 | anonymous | Use bypass and local content navigation → Read the Basic page and Article → Operate narrow Main Menu | bypass focus; local navigation; image alternative; expanded/collapsed navigation | `EVID-PROCESS-P-01` |
| P-02 | authenticated | Submit empty and invalid login states → Authenticate and open profile/edit → Log out | required errors; invalid credential error; account disclosure; anonymous destination | `EVID-PROCESS-P-02` |
| P-03 | author | Submit empty Article → Operate CKEditor and add local image alternative → Create Article and save reversible text edit | validation; CKEditor toolbar; local upload; success status | `EVID-PROCESS-P-03` |
| P-04 | admin | Inventory admin families → Create invalid site-setting state → Save and restore synthetic slogan marker | required error; success status; persisted marker; restored configuration | `EVID-PROCESS-P-04` |
| P-05 | admin | Submit empty account form → Create blocked synthetic local account → Verify notification suppression and result | required errors; password fields; blocked status; notification disabled | `EVID-PROCESS-P-05` |

All recorded process assertions passed operationally. The 9 findings were recorded at the criterion/page-state level. All five processes remain `cantTell` for complete-process conformance because native screen-reader and voice-control checks were sampled rather than repeated across every process step and technology combination.

## WCAG 2.2 A/AA outcomes

All 55 WCAG 2.2 A/AA criteria have a recorded outcome: **32 passed**, **8 failed**, **0 cantTell**, **0 untested**, and **15 inapplicable**. These are criterion results for this sample and evidence boundary, not a whole-product score.

| SC | Level | Name | Outcome | Findings | Reason |
|---|---:|---|---|---|---|
| 1.1.1 | A | Non-text Content | **passed** | — | The sampled informative image loaded with a non-empty alternative; automated, DOM, and complete-process evidence also covered shared decorative/icon alternatives. |
| 1.2.1 | A | Audio-only and Video-only (Prerecorded) | **inapplicable** | — | Exploration and all 22 rendered DOM inventories found no prerecorded audio-only or video-only content. |
| 1.2.2 | A | Captions (Prerecorded) | **inapplicable** | — | No prerecorded synchronized media was present in the frozen core-only installation. |
| 1.2.3 | A | Audio Description or Media Alternative (Prerecorded) | **inapplicable** | — | No prerecorded synchronized media was present. |
| 1.2.4 | AA | Captions (Live) | **inapplicable** | — | No live synchronized media was present. |
| 1.2.5 | AA | Audio Description (Prerecorded) | **inapplicable** | — | No prerecorded video was present. |
| 1.3.1 | A | Info and Relationships | **passed** | — | Rendered headings, landmarks, form labels, tables, relationships, and accessibility trees were checked on representative Olivero/Claro forms and dense admin surfaces; no sampled failure was confirmed. |
| 1.3.2 | A | Meaningful Sequence | **passed** | — | DOM order and accessibility-tree order remained meaningful on representative public, authoring, and Views UI pages. |
| 1.3.3 | A | Sensory Characteristics | **passed** | — | Sampled instructions used textual labels and did not rely solely on shape, location, orientation, or sound. |
| 1.3.4 | AA | Orientation | **passed** | — | Wide and narrow layouts rendered without an enforced display orientation. |
| 1.3.5 | AA | Identify Input Purpose | **passed** | — | Authentication and account fields exposed expected purpose/autocomplete semantics in the sampled forms. |
| 1.4.1 | A | Use of Color | **failed** | a11y_olivero_tabs_trigger_focus_indicator | At the mobile breakpoint, the Olivero local-tabs trigger indicates keyboard focus only by changing its existing 1 CSS pixel border from gray to blue; the state-color difference is below 3:1, so color is the only visual cue. |
| 1.4.2 | A | Audio Control | **inapplicable** | — | No automatically playing audio was present. |
| 1.4.3 | AA | Contrast (Minimum) | **failed** | a11y_claro_bulk_button_contrast, a11y_claro_empty_region_contrast | Confirmed 4.24:1 small primary-button text on three admin surfaces and 3.78:1 empty-region text on Block layout. |
| 1.4.4 | AA | Resize Text | **passed** | — | All 22 samples were exercised at verified 200% Chrome browser zoom using real Command+Plus input. No sampled non-table text or control became unavailable; the dense permissions table remained a two-dimensional layout. |
| 1.4.5 | AA | Images of Text | **inapplicable** | — | No image of text was used to convey required information; the synthetic image label was test-fixture decoration with a text alternative. |
| 1.4.10 | AA | Reflow | **failed** | a11y_claro_article_edit_reflow, a11y_claro_status_report_reflow | The Article edit form and Status report required horizontal scrolling at 320 CSS pixels outside the two-dimensional content exception. |
| 1.4.11 | AA | Non-text Contrast | **failed** | a11y_olivero_tabs_trigger_focus_indicator | The focused Olivero mobile local-tabs trigger uses a blue border with a measured 2.902:1 contrast against its adjacent background, below the required 3:1 for visual component/state information. |
| 1.4.12 | AA | Text Spacing | **passed** | — | Exact WCAG text-spacing overrides produced no confirmed text-spacing-specific clipping or overlap in targeted public/form/status/Views UI checks; the independent reflow failures remain recorded under 1.4.10. |
| 1.4.13 | AA | Content on Hover or Focus | **failed** | a11y_navigation_focus_tooltip_not_dismissible | The collapsed Navigation toolbar exposes a focus-triggered tooltip over main content that remains visible after Escape, so the sampled additional content is not dismissible without moving focus. |
| 2.1.1 | A | Keyboard | **passed** | — | Real keyboard events completed the five representative processes, including CKEditor toolbar entry/navigation/exit. |
| 2.1.2 | A | No Keyboard Trap | **passed** | — | Forward and reverse traces plus complete processes did not trap focus in the sampled interfaces. |
| 2.1.4 | A | Character Key Shortcuts | **inapplicable** | — | No single-character keyboard shortcut was exposed; observed CKEditor shortcuts required modifiers. |
| 2.2.1 | A | Timing Adjustable | **inapplicable** | — | No user task in the sampled local installation imposed a time limit. |
| 2.2.2 | A | Pause, Stop, Hide | **inapplicable** | — | No moving, blinking, scrolling, or auto-updating content meeting the criterion thresholds was present. |
| 2.3.1 | A | Three Flashes or Below Threshold | **inapplicable** | — | No flashing content was present. |
| 2.4.1 | A | Bypass Blocks | **passed** | — | A real Tab then Enter activation of the bypass link moved focus to main content. |
| 2.4.2 | A | Page Titled | **passed** | — | Representative public, authoring, and administration pages had descriptive document titles. |
| 2.4.3 | A | Focus Order | **passed** | — | Recorded forward/reverse sequences and task traces followed the rendered interaction order; no sampled order failure was confirmed. |
| 2.4.4 | A | Link Purpose (In Context) | **passed** | — | Sampled link text and surrounding context identified destinations or actions. |
| 2.4.5 | AA | Multiple Ways | **passed** | — | Repeated site/admin navigation and breadcrumbs provided multiple routes to sampled pages within their page sets. |
| 2.4.6 | AA | Headings and Labels | **passed** | — | Representative form and status-report headings and labels described their topics and purpose. |
| 2.4.7 | AA | Focus Visible | **failed** | a11y_navigation_logo_focus_not_visible | Real Tab traversal reached the Navigation Home logo, but its focused and unfocused element screenshots were byte-identical and computed styles exposed no outline, border, or shadow change. |
| 2.4.11 | AA | Focus Not Obscured (Minimum) | **failed** | a11y_navigation_breadcrumb_focus_obscured | After a complete forward focus cycle, reverse keyboard traversal placed focus on the Article and Home breadcrumb links while the fixed Navigation top bar completely covered them; 25 sampled points per link had zero visible overlap with the focused link. |
| 2.5.1 | A | Pointer Gestures | **inapplicable** | — | No multipoint or path-based pointer gesture was required by the sampled interfaces. |
| 2.5.2 | A | Pointer Cancellation | **passed** | — | Real pointer sequences confirmed that down-events alone did not complete ordinary-control or tabledrag actions; the tabledrag change could be undone with the visible weight control before saving, and reload confirmed no persisted configuration change. |
| 2.5.3 | A | Label in Name | **failed** | a11y_claro_configure_label_not_in_name | Twelve Block layout links visibly labeled Configure had accessible names such as Edit Site branding that did not contain the visible label, preventing reliable activation by the presented label. |
| 2.5.4 | A | Motion Actuation | **inapplicable** | — | No device-motion actuation was present. |
| 2.5.7 | AA | Dragging Movements | **passed** | — | Block layout exposed select controls as non-drag alternatives for region assignment. |
| 2.5.8 | AA | Target Size (Minimum) | **passed** | — | Retained selector-level geometry and DOM context confirmed that the 20 CSS pixel-high Views UI links are constrained by the parent and surrounding non-target text at a 20 CSS pixel line-height, so the second branch of the WCAG inline exception applied; no other sampled target-size candidate remained. |
| 3.1.1 | A | Language of Page | **passed** | — | The rendered html language was English across representative Olivero and Claro samples. |
| 3.1.2 | AA | Language of Parts | **inapplicable** | — | Exploration found English-only content with no foreign-language passages requiring a language-of-parts declaration. |
| 3.2.1 | A | On Focus | **passed** | — | Real focus traversal did not trigger an unexpected change of context. |
| 3.2.2 | A | On Input | **passed** | — | Form input changes did not change context before explicit submit/activation. |
| 3.2.3 | AA | Consistent Navigation | **passed** | — | Repeated Olivero and Claro navigation mechanisms retained their relative order within each page set. |
| 3.2.4 | AA | Consistent Identification | **passed** | — | Repeated administrative components and actions were identified consistently across the sampled interfaces. |
| 3.2.6 | A | Consistent Help | **passed** | — | The repeated administrative Help mechanism consistently linked to /admin/help in the sampled administration page set. |
| 3.3.1 | A | Error Identification | **passed** | — | Real keyboard submissions moved focus to the first invalid field and exposed browser-native Please fill out this field messages; native Safari plus VoiceOver also exposed the invalid-login error as a named region and allowed navigation to its text. The password-manager prompt interrupted observation of any automatic announcement. |
| 3.3.2 | A | Labels or Instructions | **passed** | — | Sampled form inputs had visible labels and applicable instructions/descriptions. |
| 3.3.3 | AA | Error Suggestion | **passed** | — | Where correction guidance was known, keyboard-submitted required fields exposed a specific browser-native suggestion and the invalid-login state supplied a specific credential error; no sampled security-sensitive field required disclosure of a more detailed suggestion. |
| 3.3.4 | AA | Error Prevention (Legal, Financial, Data) | **passed** | — | Sampled data changes were reversible: the Article remained editable and the configuration marker was restored; no legal or financial transaction was present. |
| 3.3.7 | A | Redundant Entry | **inapplicable** | — | The sampled processes did not require re-entering previously supplied information in the same process. |
| 3.3.8 | AA | Accessible Authentication (Minimum) | **passed** | — | Authentication allowed entry, paste/autofill, and password-manager-compatible fields without a cognitive-function test. |
| 4.1.2 | A | Name, Role, Value | **passed** | — | Rendered native/custom controls exposed names, roles, and states in DOM/accessibility-tree evidence. A transient expanded-state link-name candidate resolved to a stable Content link in the steady accessibility tree. |
| 4.1.3 | AA | Status Messages | **passed** | — | A driven keyboard session announced both 1 item selected and No items selected through the live-region simulator after real Space-key toggles on the Content administration page. |

The machine-readable `outcomes.json` contains sample/state evidence IDs for every criterion and independent per-subject records for all five WCAG conformance requirements.

## Five WCAG conformance requirements

| Requirement | Example independent record | Outcome and reason |
|---|---|---|
| Target level | S-STR-010 | **failed** because `a11y_claro_article_edit_reflow` fails 1.4.10 at the AA target |
| Full pages | S-STR-019 | **failed** because the complete Status report page requires horizontal scrolling at 320 CSS pixels (`a11y_claro_status_report_reflow`) |
| Complete processes | P-03 | **cantTell** because the authoring process completed operationally, but native assistive-technology checks were sampled rather than repeated at every step |
| Accessibility-supported use of technologies | S-STR-001 | **cantTell** because the sampled Safari/VoiceOver and Voice Control checks do not establish support across every page and technology combination |
| Non-interference | P-01 | **passed** independently: no keyboard trap, automatically playing audio, threshold timed motion, or flashing content interfered with the process |

A conforming alternate version was neither configured nor selected.

## Findings

### a11y_claro_article_edit_reflow — WCAG 2.2 SC 1.4.10 Reflow

- Severity: **MAJOR**
- Fingerprint: `ef650d1a6a171714fdf319e8743e3ecfc52bb2936e4793c4852f27257f70561b`
- Primary sample/state: S-STR-010 / ST-003
- Actual: The document is 345 CSS pixels wide in a 320 CSS pixel viewport because .top-bar__actions and its More actions button extend to x=345.375; the authoring form is not an inherently two-dimensional layout.
- Expected: Content and functionality reflow at 320 CSS pixels without requiring horizontal scrolling, except for content that inherently requires two-dimensional layout.
- Evidence: EVID-VISUAL-S-STR-010-REFLOW-320: retained 320 CSS pixel full-page screenshot. EVID-REFLOW-S-STR-010: document scroll width is 345 CSS pixels in a 320 CSS pixel viewport; .top-bar__actions extends to x=345.375.

### a11y_claro_bulk_button_contrast — WCAG 2.2 SC 1.4.3 Contrast (Minimum)

- Severity: **MINOR**
- Fingerprint: `11dd54564bf43f0220d0ac98776461ed439771c79b145bb725877ac11b0fa40a`
- Primary sample/state: S-STR-008 / ST-015
- Actual: The 12.64 CSS pixel bold white label renders at 4.24:1 against #3371ff on all three sampled administrative surfaces and both sampled viewport widths.
- Expected: Normal-sized control text has a contrast ratio of at least 4.5:1 against its background.
- Evidence: EVID-AXE-S-STR-008-DEFAULT-DESKTOP and EVID-AXE-S-STR-008-DEFAULT-NARROW: 4.24:1 white text on #3371ff. EVID-AXE-S-STR-013-DEFAULT-DESKTOP and EVID-AXE-S-STR-013-DEFAULT-NARROW: the same Claro button component measures 4.24:1. EVID-AXE-S-STR-020-DEFAULT-DESKTOP and EVID-AXE-S-STR-020-DEFAULT-NARROW: the same Claro button component measures 4.24:1.

### a11y_claro_configure_label_not_in_name — WCAG 2.2 SC 2.5.3 Label in Name

- Severity: **MAJOR**
- Fingerprint: `003f0e41582a8c922a8963b92a766320b888276af0f37e529f9db15485a98812`
- Primary sample/state: S-STR-016 / ST-001
- Actual: The links visibly say Configure, but their accessible names begin with Edit and do not contain Configure.
- Expected: The accessible name contains the visible label Configure, preferably at the start, so users can activate the control by its presented text.
- Evidence: EVID-FULL-SUITE-SUMMARY: 12 distinct Block layout links visibly labeled Configure had accessible names such as Edit Site branding and Edit Main navigation in both default and expanded-state inventories. BlockListBuilder changes the inherited operation title from Edit to Configure, but EntityListBuilder has already assigned an aria-label using Edit plus the entity label. The visible word Configure is absent from each affected accessible name.

### a11y_claro_empty_region_contrast — WCAG 2.2 SC 1.4.3 Contrast (Minimum)

- Severity: **MINOR**
- Fingerprint: `ed164876556fcf32becf6b1b25a18cc9b57dd99d053316bc697e3df67fb7a75a`
- Primary sample/state: S-STR-016 / ST-015
- Actual: The 16 CSS pixel normal-weight empty-region text renders at 3.78:1 (#828388 on #ffffff) in five sampled empty region rows at both viewport widths.
- Expected: Normal-sized informational text has a contrast ratio of at least 4.5:1 against its background.
- Evidence: EVID-AXE-S-STR-016-DEFAULT-DESKTOP and EVID-AXE-S-STR-016-DEFAULT-NARROW: five empty-region messages measure 3.78:1 (#828388 on #ffffff). EVID-DOM-S-STR-016-DEFAULT: retained DOM inventory for the sampled Block layout surface.

### a11y_claro_status_report_reflow — WCAG 2.2 SC 1.4.10 Reflow

- Severity: **MAJOR**
- Fingerprint: `86763aafc456bcf8ba0069a633ce0471035d3c42f0f1f3dfb132444f43dbb8f4`
- Primary sample/state: S-STR-019 / ST-003
- Actual: The document is 357 CSS pixels wide in a 320 CSS pixel viewport. Status-value and description content extends to x=356.86, requiring horizontal scrolling and squeezing prose into narrow side-by-side columns.
- Expected: Status information reflows at 320 CSS pixels without requiring horizontal scrolling, because the prose/status values do not inherently require two-dimensional layout.
- Evidence: EVID-VISUAL-S-STR-019-REFLOW-320: retained 320 CSS pixel full-page and horizontal-end screenshots. EVID-REFLOW-S-STR-019: document scroll width is 357 CSS pixels in a 320 CSS pixel viewport; status content extends to x=356.86.

### a11y_navigation_breadcrumb_focus_obscured — WCAG 2.2 SC 2.4.11 Focus Not Obscured (Minimum)

- Severity: **MINOR**
- Fingerprint: `f0d17128b665121d18ef809bdf0f40958645cc6768e01c00a79b03b958bffb19`
- Primary sample/state: S-STR-010 / ST-002
- Actual: The fixed Navigation top bar completely covers both focused breadcrumb links during reverse keyboard traversal.
- Expected: When a user interface component receives keyboard focus, it is not entirely hidden by author-created content.
- Evidence: EVID-FULL-SUITE-SUMMARY: a 23-stop forward cycle and 22-stop reverse traversal used real Tab and Shift+Tab events on /node/2/edit. EVID-FULL-SUITE-RESOLUTIONS: the Article and Home breadcrumb links received focus at y=33 while the fixed Navigation top bar was the top element over all 25 sampled points for each link. Each focused breadcrumb had a visible sample fraction of 0 even though the focus style was present underneath the overlay.

### a11y_navigation_focus_tooltip_not_dismissible — WCAG 2.2 SC 1.4.13 Content on Hover or Focus

- Severity: **MINOR**
- Fingerprint: `e1cb98be0dc9252b79759d6dc7488d68e3857ea49f289e9e4bb4a9560c947e94`
- Primary sample/state: S-STR-020 / ST-001
- Actual: The focus-triggered Navigation tooltip overlays the main content and remains visible after Escape; the implementation has no dismissal mechanism that preserves focus on the trigger.
- Expected: Additional content shown on focus can be dismissed without moving focus when it obscures other content.
- Evidence: EVID-INTERACTION-S-STR-020-HOVER-FOCUS: focusing the collapsed Navigation Blocks link displays a 71.25 by 34 CSS pixel author-controlled tooltip over the main content. EVID-INTERACTION-S-STR-020-HOVER-FOCUS: pressing Escape while focus remains on the trigger does not dismiss the tooltip.

### a11y_navigation_logo_focus_not_visible — WCAG 2.2 SC 2.4.7 Focus Visible

- Severity: **MAJOR**
- Fingerprint: `2f47889baa9602c5bb1ef8573390c7eef7bc7fff720cf936cb491f86187a49d8`
- Primary sample/state: S-STR-008 / ST-002
- Actual: The Home logo receives focus, but its focused rendering is pixel-identical to its unfocused rendering.
- Expected: A visible focus indicator identifies the Navigation Home logo when it receives keyboard focus.
- Evidence: EVID-FULL-SUITE-RESOLUTIONS: two real Tab presses reached .admin-toolbar__logo on /admin/content. The focused element had no outline, border, or box shadow, and its focused and unfocused PNG captures had the identical SHA-256 e165cb22a87ff3455f7b1c47860b4398a108a7a4e3e5c9a762125035f73cf77b. The independent keyboard matrix also recorded the shared Navigation logo in the tab sequence.

### a11y_olivero_tabs_trigger_focus_indicator — WCAG 2.2 SC 1.4.1 Use of Color and SC 1.4.11 Non-text Contrast

- Severity: **MINOR**
- Fingerprint: `75ebf8641d40c486fab1ea80493c45532f512aa0ec4be735f1c7f8fe1719676c`
- Primary sample/state: S-STR-004 / ST-002
- Actual: Focus changes only the color of the existing 1 CSS pixel border, and the focused border measures 2.902:1 against the adjacent background.
- Expected: Keyboard focus has a non-color cue or a color change with sufficient luminance contrast, and the visual focus indicator reaches at least 3:1 against adjacent colors.
- Evidence: EVID-FULL-SUITE-RESOLUTIONS: five real Tab presses reached the visible .tabs__trigger at a 320 by 568 CSS pixel viewport. The existing 1 CSS pixel border changed from rgb(234, 238, 240) to rgb(27, 154, 228); no outline or shadow appeared. The focused border measured 2.902:1 against the adjacent rgb(246, 248, 248) background, below 3:1.

Severity is user-impact-based and independent of the criterion outcome. The two reflow findings, missing Navigation-logo focus indicator, and Configure label-in-name mismatch are `MAJOR`; the obscured breadcrumbs are `MINOR` because they occur during a narrow reverse-traversal sequence and another Shift+Tab exits the obscured stops. The retained evidence does not establish complete task blockage.

## Representativeness result

The two deterministic random samples introduced no new route/component type and no additional confirmed finding family beyond the structured sample. S-RND-001 completed as P-05 with no WCAG failure confirmed. S-RND-002 exposed a data table with horizontal overflow, but the two-dimensional layout exception applied. No sample expansion was triggered. The final structured count remained 20, so the required random count remained 2 and was satisfied.

The retained P-03 Article changed local content state after the initial evidence-sampling freeze. It was intentionally process evidence and did not replace or silently re-run the frozen initial sample.

## Coverage boundary

| ID | Surface/combination | Status | Reason |
|---|---|---|---|
| CB-001 | macOS Chrome automated, DOM, AX-tree, full keyboard, process, and visual evidence | **covered** | All 22 samples completed the full Playwright suite; the independent keyboard matrix completed 44 desktop/mobile runs. |
| CB-002 | macOS Safari plus VoiceOver 10 | **covered-sampled** | Native VoiceOver located and announced the invalid-login error through the rotor and caption panel; this was not a 22-page VoiceOver sweep. |
| CB-003 | Windows with NVDA or JAWS | **unavailable** | No Windows or supported screen-reader environment was available. |
| CB-004 | iOS VoiceOver and Android TalkBack | **unavailable** | No mobile device/simulator screen-reader environment was available. |
| CB-005 | Native macOS Voice Control | **covered-sampled** | A spoken Click Main Menu command activated the Olivero control and changed aria-expanded from false to true. Two additional spoken-label probes were inconclusive and are not reported as passes or failures. |
| CB-006 | Switch access | **unavailable** | No switch-access test environment was available. |
| CB-007 | Actual Windows forced-colors/high-contrast rendering | **unavailable** | Chrome on macOS cannot establish actual Windows forced-colors behavior. |
| CB-008 | Chrome browser UI zoom at 200% across all 22 samples | **covered** | Real Command+Plus input produced a verified 2.0 device-pixel-ratio change and 200% browser zoom on every sample. |
| CB-009 | Drupal.org public issue search | **covered-read-only** | Public issue pages were searched for remediation context only; nothing was posted, and issue status was not used as conformance evidence. |
| CB-010 | Revised Section 508 chapters and functional performance criteria | **inapplicable** | This internal test evaluated WCAG 2.2 A/AA only and did not declare a Section 508 evaluation. |

## Evaluation conclusion

This internal test evaluated all 55 WCAG 2.2 A/AA criteria and found 8 failed criteria backed by 9 findings. No criterion remains `cantTell` or untested. The confirmed failures mean the evidence does not support an AA conformance statement for the frozen build, the sampled pages/processes, or Drupal as a whole.

What this report does claim: the named findings, outcome map, complete-process observations, dismissed detector candidates, and coverage boundaries are supported by the private AS-OACR-001 evidence corpus.

What it does not claim: release readiness, a Drupal Association position, Section 508 conformance, assistive-technology/browser support beyond the tested combinations, issue freshness, remediation status, or whole-product conformance.

## Machine-readable linkage

- Outcome map: `outcomes.json`, SHA-256 `73994007232a5868d9ffb14fc326bfb7283000350852aefe345585258b514d4f`
- a11y_claro_article_edit_reflow: `findings/a11y_claro_article_edit_reflow.json`, SHA-256 `959d4b1dc454f314013c61acca7b90171ba194eecbf495d970b28af2d48d350f`
- a11y_claro_bulk_button_contrast: `findings/a11y_claro_bulk_button_contrast.json`, SHA-256 `7216c83d2fdfc976beca42dba2b324e179700a73ffd83622bb2c06d61fdbb9e1`
- a11y_claro_configure_label_not_in_name: `findings/a11y_claro_configure_label_not_in_name.json`, SHA-256 `924e36d6b453480e0f39a249fed04512a3bae5e36ba3f2eba98364e6980bca94`
- a11y_claro_empty_region_contrast: `findings/a11y_claro_empty_region_contrast.json`, SHA-256 `7122aaaa9fb959f9bf97dcd4f45a475d191a279fff96cbdf16a8d6245acd17ee`
- a11y_claro_status_report_reflow: `findings/a11y_claro_status_report_reflow.json`, SHA-256 `37c5a6094c031deac54978b71e11edb15786a57d28df002e2546e4425514ea30`
- a11y_navigation_breadcrumb_focus_obscured: `findings/a11y_navigation_breadcrumb_focus_obscured.json`, SHA-256 `aa969dd10845d7a1f72cacec4117b8e7679ad6ffee5c176dac4c97e5c0f69e0e`
- a11y_navigation_focus_tooltip_not_dismissible: `findings/a11y_navigation_focus_tooltip_not_dismissible.json`, SHA-256 `081fc0a8a2d4345bc1f0872a16adb0dcad08de5de522416ce8180daeb7abbf5a`
- a11y_navigation_logo_focus_not_visible: `findings/a11y_navigation_logo_focus_not_visible.json`, SHA-256 `42312a91ef6931152898ac8c0cf77fee913a46a90d9cebaeb8067b7d106859b0`
- a11y_olivero_tabs_trigger_focus_indicator: `findings/a11y_olivero_tabs_trigger_focus_indicator.json`, SHA-256 `0a083bc7644c811dfa673b8f4e3bc558ffc4ff49325f11875aa1d661340efccc`
- OpenACR: not yet serialized at this report stage; any resulting artifact must remain `TEST DRAFT — NOT FOR RELEASE`.
- Federal annex: none; Section 508 was not in scope.
- Aggregated score: none.

