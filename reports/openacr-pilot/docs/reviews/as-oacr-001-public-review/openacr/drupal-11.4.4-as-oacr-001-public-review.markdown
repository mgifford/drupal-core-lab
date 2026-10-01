# Drupal 11.4.4 Standard Reference Installation — AS-OACR-001 Public Review Draft

Based on VPAT® 2.5 WCAG Edition

## Name of Product/Version
Drupal 11.4.4 Standard Reference Installation — AS-OACR-001 Test Build 11.4.4

## Report Dates and Version
- Report Date: 2026-08-23
- Last Modified Date: 2026-08-24
- Version: drupal 11.4.4 standard reference installation — as-oacr-001 test build-11.4.4-2

## Product Description
A reproducible, local, core-only Drupal 11.4.4 Standard profile reference installation evaluated as a methodology test and published for community review. This artifact does not describe Drupal generally or make a whole-product conformance claim.

## Contact Information
### Author Information
- Name: TBD


- Email: tbd@example.invalid



## Notes
PUBLIC REVIEW DRAFT — METADATA INCOMPLETE; NOT ISSUED. All 55 WCAG 2.2 A/AA criteria have a sample-scoped outcome; confirmed failures prevent an AA conformance statement. Author identity, author contact, official report feedback ownership, issuer, and release approval remain unresolved. Alex Urevick-Ackelsberg maintains this independent pull-request review package. This review copy uses the repository documentation license; that choice is not a Drupal Association license or issuance decision. Catalog criterion 4.1.1 is omitted because it was removed from WCAG 2.2.

## Evaluation Methods
WCAG-EM 2.0 sample-scoped evaluation of 20 structured and 2 deterministic random page samples plus five complete processes. The full suite completed 22 of 22 Playwright page tests with 1,183 forward and 1,161 reverse keyboard stops, 44 default/expanded axe runs, 66 viewport and text-spacing checks, and 88 full-page screenshots. An independent keyboard matrix completed 44 desktop/mobile runs. Additional evidence includes driven live-region interaction, actual 200% Chrome browser zoom across all samples, native Safari plus VoiceOver, native macOS Voice Control, rendered DOM facts, Chrome accessibility trees, reflow checks, and retained manual resolution evidence. Windows screen readers, mobile screen readers, switch access, and actual Windows forced colors were unavailable.

## Applicable Standards/Guidelines
This report covers the degree of conformance for the following accessibility standard/guidelines:

| Standard/Guideline | Included In Report |
| --- | --- |
| [Web Content Accessibility Guidelines 2.2](https://www.w3.org/TR/WCAG22/) | <ul><li>Table 1: Success Criteria, Level A</li><li>Table 2: Success Criteria, Level AA</li><li>Table 3: Success Criteria, Level AAA</li></ul> |

## Terms
The terms used in the Conformance Level information are defined as follows:
- **Supports**: The functionality of the product has at least one method that meets the criterion without known defects or meets with equivalent facilitation.
- **Partially Supports**: Some functionality of the product does not meet the criterion.
- **Does Not Support**: The majority of product functionality does not meet the criterion.
- **Not Applicable**: The criterion is not relevant to the product.
- **Not Evaluated**: The product has not been evaluated against the criterion. This can only be used in WCAG Level AAA criteria.

## WCAG 2.2 Report

### Table 1: Success Criteria, Level A

Notes: Sample-scoped WCAG 2.2 Level A results. Every Level A criterion in the target catalog has a recorded outcome.

Conformance to the 31 criteria listed below is distributed within each category as follows:

| Conformance Level | Web |
| --- | --- |
| Supports | 18 |
| Partially Supports | 0 |
| Does Not Support | 2 |
| Not Applicable | 11 |


| Criteria | Conformance Level | Remarks and Explanations |
| --- | --- | --- |
| [1.1.1 Non-text Content](https://www.w3.org/TR/WCAG22/#non-text-content) | <ul><li>**Web**: Supports</li> </ul> | <ul><li>**Web**: Sample-scoped: passes across 20 structured + 2 random samples (WCAG-EM). Criterion-specific retained evidence covers S-STR-003. The sampled informative image loaded with a non-empty alternative; automated, DOM, and complete-process evidence also covered shared decorative/icon alternatives.</li> </ul> |
| [1.2.1 Audio-only and Video-only (Prerecorded)](https://www.w3.org/TR/WCAG22/#audio-only-and-video-only-prerecorded) | <ul><li>**Web**: Not Applicable</li> </ul> | <ul><li>**Web**: Not present: Exploration and all 22 rendered DOM inventories found no prerecorded audio-only or video-only content.</li> </ul> |
| [1.2.2 Captions (Prerecorded)](https://www.w3.org/TR/WCAG22/#captions-prerecorded) | <ul><li>**Web**: Not Applicable</li> </ul> | <ul><li>**Web**: Not present: No prerecorded synchronized media was present in the frozen core-only installation.</li> </ul> |
| [1.2.3 Audio Description or Media Alternative (Prerecorded)](https://www.w3.org/TR/WCAG22/#audio-description-or-media-alternative-prerecorded) | <ul><li>**Web**: Not Applicable</li> </ul> | <ul><li>**Web**: Not present: No prerecorded synchronized media was present.</li> </ul> |
| [1.3.1 Info and Relationships](https://www.w3.org/TR/WCAG22/#info-and-relationships) | <ul><li>**Web**: Supports</li> </ul> | <ul><li>**Web**: Sample-scoped: passes across 20 structured + 2 random samples (WCAG-EM). Criterion-specific retained evidence covers S-STR-009, S-STR-014, S-STR-020. Rendered headings, landmarks, form labels, tables, relationships, and accessibility trees were checked on representative Olivero/Claro forms and dense admin surfaces; no sampled failure was confirmed.</li> </ul> |
| [1.3.2 Meaningful Sequence](https://www.w3.org/TR/WCAG22/#meaningful-sequence) | <ul><li>**Web**: Supports</li> </ul> | <ul><li>**Web**: Sample-scoped: passes across 20 structured + 2 random samples (WCAG-EM). Criterion-specific retained evidence covers S-STR-001, S-STR-009, S-STR-020. DOM order and accessibility-tree order remained meaningful on representative public, authoring, and Views UI pages.</li> </ul> |
| [1.3.3 Sensory Characteristics](https://www.w3.org/TR/WCAG22/#sensory-characteristics) | <ul><li>**Web**: Supports</li> </ul> | <ul><li>**Web**: Sample-scoped: passes across 20 structured + 2 random samples (WCAG-EM). Criterion-specific retained evidence covers S-STR-001, S-STR-018. Sampled instructions used textual labels and did not rely solely on shape, location, orientation, or sound.</li> </ul> |
| [1.4.1 Use of Color](https://www.w3.org/TR/WCAG22/#use-of-color) | <ul><li>**Web**: Does Not Support</li> </ul> | <ul><li>**Web**: Sample-scoped: fails in S-STR-004 (WCAG-EM). Findings: a11y_olivero_tabs_trigger_focus_indicator. At the mobile breakpoint, the Olivero local-tabs trigger indicates keyboard focus only by changing its existing 1 CSS pixel border from gray to blue; the state-color difference is below 3:1, so color is the only visual cue.</li> </ul> |
| [1.4.2 Audio Control](https://www.w3.org/TR/WCAG22/#audio-control) | <ul><li>**Web**: Not Applicable</li> </ul> | <ul><li>**Web**: Not present: No automatically playing audio was present.</li> </ul> |
| [2.1.1 Keyboard](https://www.w3.org/TR/WCAG22/#keyboard) | <ul><li>**Web**: Supports</li> </ul> | <ul><li>**Web**: Sample-scoped: passes across 20 structured + 2 random samples (WCAG-EM). Criterion-specific retained evidence covers S-STR-001, S-STR-004, S-STR-009, S-STR-018, S-RND-001. Real keyboard events completed the five representative processes, including CKEditor toolbar entry/navigation/exit.</li> </ul> |
| [2.1.2 No Keyboard Trap](https://www.w3.org/TR/WCAG22/#no-keyboard-trap) | <ul><li>**Web**: Supports</li> </ul> | <ul><li>**Web**: Sample-scoped: passes across 20 structured + 2 random samples (WCAG-EM). Criterion-specific retained evidence covers S-STR-001, S-STR-009, S-STR-020. Forward and reverse traces plus complete processes did not trap focus in the sampled interfaces.</li> </ul> |
| [2.1.4 Character Key Shortcuts](https://www.w3.org/TR/WCAG22/#character-key-shortcuts) | <ul><li>**Web**: Not Applicable</li> </ul> | <ul><li>**Web**: Not present: No single-character keyboard shortcut was exposed; observed CKEditor shortcuts required modifiers.</li> </ul> |
| [2.2.1 Timing Adjustable](https://www.w3.org/TR/WCAG22/#timing-adjustable) | <ul><li>**Web**: Not Applicable</li> </ul> | <ul><li>**Web**: Not present: No user task in the sampled local installation imposed a time limit.</li> </ul> |
| [2.2.2 Pause, Stop, Hide](https://www.w3.org/TR/WCAG22/#pause-stop-hide) | <ul><li>**Web**: Not Applicable</li> </ul> | <ul><li>**Web**: Not present: No moving, blinking, scrolling, or auto-updating content meeting the criterion thresholds was present.</li> </ul> |
| [2.3.1 Three Flashes or Below Threshold](https://www.w3.org/TR/WCAG22/#three-flashes-or-below-threshold) | <ul><li>**Web**: Not Applicable</li> </ul> | <ul><li>**Web**: Not present: No flashing content was present.</li> </ul> |
| [2.4.1 Bypass Blocks](https://www.w3.org/TR/WCAG22/#bypass-blocks) | <ul><li>**Web**: Supports</li> </ul> | <ul><li>**Web**: Sample-scoped: passes across 20 structured + 2 random samples (WCAG-EM). Criterion-specific retained evidence covers S-STR-001. A real Tab then Enter activation of the bypass link moved focus to main content.</li> </ul> |
| [2.4.2 Page Titled](https://www.w3.org/TR/WCAG22/#page-titled) | <ul><li>**Web**: Supports</li> </ul> | <ul><li>**Web**: Sample-scoped: passes across 20 structured + 2 random samples (WCAG-EM). Criterion-specific retained evidence covers S-STR-001, S-STR-009, S-STR-019. Representative public, authoring, and administration pages had descriptive document titles.</li> </ul> |
| [2.4.3 Focus Order](https://www.w3.org/TR/WCAG22/#focus-order) | <ul><li>**Web**: Supports</li> </ul> | <ul><li>**Web**: Sample-scoped: passes across 20 structured + 2 random samples (WCAG-EM). Criterion-specific retained evidence covers S-STR-001, S-STR-009, S-STR-018, S-RND-001. Recorded forward/reverse sequences and task traces followed the rendered interaction order; no sampled order failure was confirmed.</li> </ul> |
| [2.4.4 Link Purpose (In Context)](https://www.w3.org/TR/WCAG22/#link-purpose-in-context) | <ul><li>**Web**: Supports</li> </ul> | <ul><li>**Web**: Sample-scoped: passes across 20 structured + 2 random samples (WCAG-EM). Criterion-specific retained evidence covers S-STR-001, S-STR-019. Sampled link text and surrounding context identified destinations or actions.</li> </ul> |
| [2.5.1 Pointer Gestures](https://www.w3.org/TR/WCAG22/#pointer-gestures) | <ul><li>**Web**: Not Applicable</li> </ul> | <ul><li>**Web**: Not present: No multipoint or path-based pointer gesture was required by the sampled interfaces.</li> </ul> |
| [2.5.2 Pointer Cancellation](https://www.w3.org/TR/WCAG22/#pointer-cancellation) | <ul><li>**Web**: Supports</li> </ul> | <ul><li>**Web**: Sample-scoped: passes across 20 structured + 2 random samples (WCAG-EM). Criterion-specific retained evidence covers S-STR-016. Real pointer sequences confirmed that down-events alone did not complete ordinary-control or tabledrag actions; the tabledrag change could be undone with the visible weight control before saving, and reload confirmed no persisted configuration change.</li> </ul> |
| [2.5.3 Label in Name](https://www.w3.org/TR/WCAG22/#label-in-name) | <ul><li>**Web**: Does Not Support</li> </ul> | <ul><li>**Web**: Sample-scoped: fails in S-STR-016 (WCAG-EM). Findings: a11y_claro_configure_label_not_in_name. Twelve Block layout links visibly labeled Configure had accessible names such as Edit Site branding that did not contain the visible label, preventing reliable activation by the presented label.</li> </ul> |
| [2.5.4 Motion Actuation](https://www.w3.org/TR/WCAG22/#motion-actuation) | <ul><li>**Web**: Not Applicable</li> </ul> | <ul><li>**Web**: Not present: No device-motion actuation was present.</li> </ul> |
| [3.1.1 Language of Page](https://www.w3.org/TR/WCAG22/#language-of-page) | <ul><li>**Web**: Supports</li> </ul> | <ul><li>**Web**: Sample-scoped: passes across 20 structured + 2 random samples (WCAG-EM). Criterion-specific retained evidence covers S-STR-001, S-STR-009, S-STR-019. The rendered html language was English across representative Olivero and Claro samples.</li> </ul> |
| [3.2.1 On Focus](https://www.w3.org/TR/WCAG22/#on-focus) | <ul><li>**Web**: Supports</li> </ul> | <ul><li>**Web**: Sample-scoped: passes across 20 structured + 2 random samples (WCAG-EM). Criterion-specific retained evidence covers S-STR-001, S-STR-009, S-STR-020. Real focus traversal did not trigger an unexpected change of context.</li> </ul> |
| [3.2.2 On Input](https://www.w3.org/TR/WCAG22/#on-input) | <ul><li>**Web**: Supports</li> </ul> | <ul><li>**Web**: Sample-scoped: passes across 20 structured + 2 random samples (WCAG-EM). Criterion-specific retained evidence covers S-STR-004, S-STR-009, S-STR-018, S-RND-001. Form input changes did not change context before explicit submit/activation.</li> </ul> |
| [3.2.6 Consistent Help](https://www.w3.org/TR/WCAG22/#consistent-help) | <ul><li>**Web**: Supports</li> </ul> | <ul><li>**Web**: Sample-scoped: passes across 20 structured + 2 random samples (WCAG-EM). Criterion-specific retained evidence covers S-STR-012. The repeated administrative Help mechanism consistently linked to /admin/help in the sampled administration page set.</li> </ul> |
| [3.3.1 Error Identification](https://www.w3.org/TR/WCAG22/#error-identification) | <ul><li>**Web**: Supports</li> </ul> | <ul><li>**Web**: Sample-scoped: passes across 20 structured + 2 random samples (WCAG-EM). Criterion-specific retained evidence covers S-STR-004, S-STR-009, S-STR-018, S-RND-001. Real keyboard submissions moved focus to the first invalid field and exposed browser-native Please fill out this field messages; native Safari plus VoiceOver also exposed the invalid-login error as a named region and allowed navigation to its text. The password-manager prompt interrupted observation of any automatic announcement.</li> </ul> |
| [3.3.2 Labels or Instructions](https://www.w3.org/TR/WCAG22/#labels-or-instructions) | <ul><li>**Web**: Supports</li> </ul> | <ul><li>**Web**: Sample-scoped: passes across 20 structured + 2 random samples (WCAG-EM). Criterion-specific retained evidence covers S-STR-004, S-STR-009, S-RND-001. Sampled form inputs had visible labels and applicable instructions/descriptions.</li> </ul> |
| [3.3.7 Redundant Entry](https://www.w3.org/TR/WCAG22/#redundant-entry) | <ul><li>**Web**: Not Applicable</li> </ul> | <ul><li>**Web**: Not present: The sampled processes did not require re-entering previously supplied information in the same process.</li> </ul> |
| [4.1.2 Name, Role, Value](https://www.w3.org/TR/WCAG22/#name-role-value) | <ul><li>**Web**: Supports</li> </ul> | <ul><li>**Web**: Sample-scoped: passes across 20 structured + 2 random samples (WCAG-EM). Criterion-specific retained evidence covers S-STR-001, S-STR-009, S-STR-020. Rendered native/custom controls exposed names, roles, and states in DOM/accessibility-tree evidence. A transient expanded-state link-name candidate resolved to a stable Content link in the steady accessibility tree.</li> </ul> |


### Table 2: Success Criteria, Level AA

Notes: Sample-scoped WCAG 2.2 Level AA results. Every Level AA criterion in the target catalog has a recorded outcome.

Conformance to the 24 criteria listed below is distributed within each category as follows:

| Conformance Level | Web |
| --- | --- |
| Supports | 14 |
| Partially Supports | 0 |
| Does Not Support | 6 |
| Not Applicable | 4 |


| Criteria | Conformance Level | Remarks and Explanations |
| --- | --- | --- |
| [1.2.4 Captions (Live)](https://www.w3.org/TR/WCAG22/#captions-live) | <ul><li>**Web**: Not Applicable</li> </ul> | <ul><li>**Web**: Not present: No live synchronized media was present.</li> </ul> |
| [1.2.5 Audio Description (Prerecorded)](https://www.w3.org/TR/WCAG22/#audio-description-prerecorded) | <ul><li>**Web**: Not Applicable</li> </ul> | <ul><li>**Web**: Not present: No prerecorded video was present.</li> </ul> |
| [1.3.4 Orientation](https://www.w3.org/TR/WCAG22/#orientation) | <ul><li>**Web**: Supports</li> </ul> | <ul><li>**Web**: Sample-scoped: passes across 20 structured + 2 random samples (WCAG-EM). Criterion-specific retained evidence covers S-STR-001, S-STR-018. Wide and narrow layouts rendered without an enforced display orientation.</li> </ul> |
| [1.3.5 Identify Input Purpose](https://www.w3.org/TR/WCAG22/#identify-input-purpose) | <ul><li>**Web**: Supports</li> </ul> | <ul><li>**Web**: Sample-scoped: passes across 20 structured + 2 random samples (WCAG-EM). Criterion-specific retained evidence covers S-STR-004, S-STR-007, S-RND-001. Authentication and account fields exposed expected purpose/autocomplete semantics in the sampled forms.</li> </ul> |
| [1.4.3 Contrast (Minimum)](https://www.w3.org/TR/WCAG22/#visual-audio-contrast-contrast) | <ul><li>**Web**: Does Not Support</li> </ul> | <ul><li>**Web**: Sample-scoped: fails in S-STR-008, S-STR-013, S-STR-016, S-STR-020 (WCAG-EM). Findings: a11y_claro_bulk_button_contrast, a11y_claro_empty_region_contrast. Confirmed 4.24:1 small primary-button text on three admin surfaces and 3.78:1 empty-region text on Block layout.</li> </ul> |
| [1.4.4 Resize text](https://www.w3.org/TR/WCAG22/#visual-audio-contrast-scale) | <ul><li>**Web**: Supports</li> </ul> | <ul><li>**Web**: Sample-scoped: passes across 20 structured + 2 random samples (WCAG-EM). Criterion-specific retained evidence covers S-STR-001, S-STR-002, S-STR-003, S-STR-004, S-STR-005, S-STR-006, S-STR-007, S-STR-008, S-STR-009, S-STR-010, S-STR-011, S-STR-012, S-STR-013, S-STR-014, S-STR-015, S-STR-016, S-STR-017, S-STR-018, S-STR-019, S-STR-020, S-RND-001, S-RND-002. All 22 samples were exercised at verified 200% Chrome browser zoom using real Command+Plus input. No sampled non-table text or control became unavailable; the dense permissions table remained a two-dimensional layout.</li> </ul> |
| [1.4.5 Images of Text](https://www.w3.org/TR/WCAG22/#visual-audio-contrast-text-presentation) | <ul><li>**Web**: Not Applicable</li> </ul> | <ul><li>**Web**: Not present: No image of text was used to convey required information; the synthetic image label was test-fixture decoration with a text alternative.</li> </ul> |
| [1.4.10 Reflow](https://www.w3.org/TR/WCAG22/#reflow) | <ul><li>**Web**: Does Not Support</li> </ul> | <ul><li>**Web**: Sample-scoped: fails in S-STR-010, S-STR-019 (WCAG-EM). Findings: a11y_claro_article_edit_reflow, a11y_claro_status_report_reflow. The Article edit form and Status report required horizontal scrolling at 320 CSS pixels outside the two-dimensional content exception.</li> </ul> |
| [1.4.11 Non-text Contrast](https://www.w3.org/TR/WCAG22/#non-text-contrast) | <ul><li>**Web**: Does Not Support</li> </ul> | <ul><li>**Web**: Sample-scoped: fails in S-STR-004 (WCAG-EM). Findings: a11y_olivero_tabs_trigger_focus_indicator. The focused Olivero mobile local-tabs trigger uses a blue border with a measured 2.902:1 contrast against its adjacent background, below the required 3:1 for visual component/state information.</li> </ul> |
| [1.4.12 Text Spacing](https://www.w3.org/TR/WCAG22/#text-spacing) | <ul><li>**Web**: Supports</li> </ul> | <ul><li>**Web**: Sample-scoped: passes across 20 structured + 2 random samples (WCAG-EM). Criterion-specific retained evidence covers S-STR-009, S-STR-010, S-STR-019, S-STR-020. Exact WCAG text-spacing overrides produced no confirmed text-spacing-specific clipping or overlap in targeted public/form/status/Views UI checks; the independent reflow failures remain recorded under 1.4.10.</li> </ul> |
| [1.4.13 Content on Hover or Focus](https://www.w3.org/TR/WCAG22/#content-on-hover-or-focus) | <ul><li>**Web**: Does Not Support</li> </ul> | <ul><li>**Web**: Sample-scoped: fails in S-STR-020 (WCAG-EM). Findings: a11y_navigation_focus_tooltip_not_dismissible. The collapsed Navigation toolbar exposes a focus-triggered tooltip over main content that remains visible after Escape, so the sampled additional content is not dismissible without moving focus.</li> </ul> |
| [2.4.5 Multiple Ways](https://www.w3.org/TR/WCAG22/#multiple-ways) | <ul><li>**Web**: Supports</li> </ul> | <ul><li>**Web**: Sample-scoped: passes across 20 structured + 2 random samples (WCAG-EM). Criterion-specific retained evidence covers S-STR-002, S-STR-019. Repeated site/admin navigation and breadcrumbs provided multiple routes to sampled pages within their page sets.</li> </ul> |
| [2.4.6 Headings and Labels](https://www.w3.org/TR/WCAG22/#headings-and-labels) | <ul><li>**Web**: Supports</li> </ul> | <ul><li>**Web**: Sample-scoped: passes across 20 structured + 2 random samples (WCAG-EM). Criterion-specific retained evidence covers S-STR-009, S-STR-019. Representative form and status-report headings and labels described their topics and purpose.</li> </ul> |
| [2.4.7 Focus Visible](https://www.w3.org/TR/WCAG22/#focus-visible) | <ul><li>**Web**: Does Not Support</li> </ul> | <ul><li>**Web**: Sample-scoped: fails in S-STR-008 (WCAG-EM). Findings: a11y_navigation_logo_focus_not_visible. Real Tab traversal reached the Navigation Home logo, but its focused and unfocused element screenshots were byte-identical and computed styles exposed no outline, border, or shadow change.</li> </ul> |
| [2.4.11 Focus Not Obscured (Minimum)](https://www.w3.org/TR/WCAG22/#focus-not-obscured-minimum) | <ul><li>**Web**: Does Not Support</li> </ul> | <ul><li>**Web**: Sample-scoped: fails in S-STR-010 (WCAG-EM). Findings: a11y_navigation_breadcrumb_focus_obscured. After a complete forward focus cycle, reverse keyboard traversal placed focus on the Article and Home breadcrumb links while the fixed Navigation top bar completely covered them; 25 sampled points per link had zero visible overlap with the focused link.</li> </ul> |
| [2.5.7 Dragging Movements](https://www.w3.org/TR/WCAG22/#dragging-movements) | <ul><li>**Web**: Supports</li> </ul> | <ul><li>**Web**: Sample-scoped: passes across 20 structured + 2 random samples (WCAG-EM). Criterion-specific retained evidence covers S-STR-016. Block layout exposed select controls as non-drag alternatives for region assignment.</li> </ul> |
| [2.5.8 Target Size (Minimum)](https://www.w3.org/TR/WCAG22/#target-size-minimum) | <ul><li>**Web**: Supports</li> </ul> | <ul><li>**Web**: Sample-scoped: passes across 20 structured + 2 random samples (WCAG-EM). Criterion-specific retained evidence covers S-STR-020. Retained selector-level geometry and DOM context confirmed that the 20 CSS pixel-high Views UI links are constrained by the parent and surrounding non-target text at a 20 CSS pixel line-height, so the second branch of the WCAG inline exception applied; no other sampled target-size candidate remained.</li> </ul> |
| [3.1.2 Language of Parts](https://www.w3.org/TR/WCAG22/#language-of-parts) | <ul><li>**Web**: Not Applicable</li> </ul> | <ul><li>**Web**: Not present: Exploration found English-only content with no foreign-language passages requiring a language-of-parts declaration.</li> </ul> |
| [3.2.3 Consistent Navigation](https://www.w3.org/TR/WCAG22/#consistent-navigation) | <ul><li>**Web**: Supports</li> </ul> | <ul><li>**Web**: Sample-scoped: passes across 20 structured + 2 random samples (WCAG-EM). Criterion-specific retained evidence covers S-STR-001, S-STR-002, S-STR-012, S-STR-019. Repeated Olivero and Claro navigation mechanisms retained their relative order within each page set.</li> </ul> |
| [3.2.4 Consistent Identification](https://www.w3.org/TR/WCAG22/#consistent-identification) | <ul><li>**Web**: Supports</li> </ul> | <ul><li>**Web**: Sample-scoped: passes across 20 structured + 2 random samples (WCAG-EM). Criterion-specific retained evidence covers S-STR-008, S-STR-013, S-STR-020. Repeated administrative components and actions were identified consistently across the sampled interfaces.</li> </ul> |
| [3.3.3 Error Suggestion](https://www.w3.org/TR/WCAG22/#error-suggestion) | <ul><li>**Web**: Supports</li> </ul> | <ul><li>**Web**: Sample-scoped: passes across 20 structured + 2 random samples (WCAG-EM). Criterion-specific retained evidence covers S-STR-004, S-STR-009, S-STR-018, S-RND-001. Where correction guidance was known, keyboard-submitted required fields exposed a specific browser-native suggestion and the invalid-login state supplied a specific credential error; no sampled security-sensitive field required disclosure of a more detailed suggestion.</li> </ul> |
| [3.3.4 Error Prevention (Legal, Financial, Data)](https://www.w3.org/TR/WCAG22/#error-prevention-legal-financial-data) | <ul><li>**Web**: Supports</li> </ul> | <ul><li>**Web**: Sample-scoped: passes across 20 structured + 2 random samples (WCAG-EM). Criterion-specific retained evidence covers S-STR-009, S-STR-018. Sampled data changes were reversible: the Article remained editable and the configuration marker was restored; no legal or financial transaction was present.</li> </ul> |
| [3.3.8 Accessible Authentication (Minimum)](https://www.w3.org/TR/WCAG22/#accessible-authentication-minimum) | <ul><li>**Web**: Supports</li> </ul> | <ul><li>**Web**: Sample-scoped: passes across 20 structured + 2 random samples (WCAG-EM). Criterion-specific retained evidence covers S-STR-004. Authentication allowed entry, paste/autofill, and password-manager-compatible fields without a cognitive-function test.</li> </ul> |
| [4.1.3 Status Messages](https://www.w3.org/TR/WCAG22/#status-messages) | <ul><li>**Web**: Supports</li> </ul> | <ul><li>**Web**: Sample-scoped: passes across 20 structured + 2 random samples (WCAG-EM). Criterion-specific retained evidence covers S-STR-008. A driven keyboard session announced both 1 item selected and No items selected through the live-region simulator after real Space-key toggles on the Content administration page.</li> </ul> |


### Table 3: Success Criteria, Level AAA

Notes: WCAG 2.2 Level AAA was outside this engagement&#x27;s target.

Conformance to the 31 criteria listed below is distributed within each category as follows:

| Conformance Level | Web |
| --- | --- |
| Supports | 0 |
| Partially Supports | 0 |
| Does Not Support | 0 |
| Not Applicable | 0 |


| Criteria | Conformance Level | Remarks and Explanations |
| --- | --- | --- |
| [1.2.6 Sign Language (Prerecorded)](https://www.w3.org/TR/WCAG22/#sign-language-prerecorded) | <ul><li>**Web**: Not Evaluated</li> </ul> | <ul><li>**Web**: Not evaluated at this engagement&#x27;s conformance target (WCAG 2.2 AA).</li> </ul> |
| [1.2.7 Extended Audio Description (Prerecorded)](https://www.w3.org/TR/WCAG22/#extended-audio-description-prerecorded) | <ul><li>**Web**: Not Evaluated</li> </ul> | <ul><li>**Web**: Not evaluated at this engagement&#x27;s conformance target (WCAG 2.2 AA).</li> </ul> |
| [1.2.8 Media Alternative (Prerecorded)](https://www.w3.org/TR/WCAG22/#media-alternative-prerecorded) | <ul><li>**Web**: Not Evaluated</li> </ul> | <ul><li>**Web**: Not evaluated at this engagement&#x27;s conformance target (WCAG 2.2 AA).</li> </ul> |
| [1.2.9 Audio-only (Live)](https://www.w3.org/TR/WCAG22/#audio-only-live) | <ul><li>**Web**: Not Evaluated</li> </ul> | <ul><li>**Web**: Not evaluated at this engagement&#x27;s conformance target (WCAG 2.2 AA).</li> </ul> |
| [1.3.6 Identify Purpose](https://www.w3.org/TR/WCAG22/#identify-purpose) | <ul><li>**Web**: Not Evaluated</li> </ul> | <ul><li>**Web**: Not evaluated at this engagement&#x27;s conformance target (WCAG 2.2 AA).</li> </ul> |
| [1.4.6 Contrast (Enhanced)](https://www.w3.org/TR/WCAG22/#contrast-enhanced) | <ul><li>**Web**: Not Evaluated</li> </ul> | <ul><li>**Web**: Not evaluated at this engagement&#x27;s conformance target (WCAG 2.2 AA).</li> </ul> |
| [1.4.7 Low or No Background Audio](https://www.w3.org/TR/WCAG22/#low-or-no-background-audio) | <ul><li>**Web**: Not Evaluated</li> </ul> | <ul><li>**Web**: Not evaluated at this engagement&#x27;s conformance target (WCAG 2.2 AA).</li> </ul> |
| [1.4.8 Visual Presentation](https://www.w3.org/TR/WCAG22/#visual-presentation) | <ul><li>**Web**: Not Evaluated</li> </ul> | <ul><li>**Web**: Not evaluated at this engagement&#x27;s conformance target (WCAG 2.2 AA).</li> </ul> |
| [1.4.9 Images of Text (No Exception)](https://www.w3.org/TR/WCAG22/#images-of-text-no-exception) | <ul><li>**Web**: Not Evaluated</li> </ul> | <ul><li>**Web**: Not evaluated at this engagement&#x27;s conformance target (WCAG 2.2 AA).</li> </ul> |
| [2.1.3 Keyboard (No Exception)](https://www.w3.org/TR/WCAG22/#keyboard-no-exception) | <ul><li>**Web**: Not Evaluated</li> </ul> | <ul><li>**Web**: Not evaluated at this engagement&#x27;s conformance target (WCAG 2.2 AA).</li> </ul> |
| [2.2.3 No Timing](https://www.w3.org/TR/WCAG22/#no-timing) | <ul><li>**Web**: Not Evaluated</li> </ul> | <ul><li>**Web**: Not evaluated at this engagement&#x27;s conformance target (WCAG 2.2 AA).</li> </ul> |
| [2.2.4 Interruptions](https://www.w3.org/TR/WCAG22/#interruptions) | <ul><li>**Web**: Not Evaluated</li> </ul> | <ul><li>**Web**: Not evaluated at this engagement&#x27;s conformance target (WCAG 2.2 AA).</li> </ul> |
| [2.2.5 Re-authenticating](https://www.w3.org/TR/WCAG22/#re-authenticating) | <ul><li>**Web**: Not Evaluated</li> </ul> | <ul><li>**Web**: Not evaluated at this engagement&#x27;s conformance target (WCAG 2.2 AA).</li> </ul> |
| [2.2.6 Timeouts](https://www.w3.org/TR/WCAG22/#timeouts) | <ul><li>**Web**: Not Evaluated</li> </ul> | <ul><li>**Web**: Not evaluated at this engagement&#x27;s conformance target (WCAG 2.2 AA).</li> </ul> |
| [2.3.2 Three Flashes](https://www.w3.org/TR/WCAG22/#three-flashes) | <ul><li>**Web**: Not Evaluated</li> </ul> | <ul><li>**Web**: Not evaluated at this engagement&#x27;s conformance target (WCAG 2.2 AA).</li> </ul> |
| [2.3.3 Animation from Interactions](https://www.w3.org/TR/WCAG22/#animation-from-interactions) | <ul><li>**Web**: Not Evaluated</li> </ul> | <ul><li>**Web**: Not evaluated at this engagement&#x27;s conformance target (WCAG 2.2 AA).</li> </ul> |
| [2.4.8 Location](https://www.w3.org/TR/WCAG22/#location) | <ul><li>**Web**: Not Evaluated</li> </ul> | <ul><li>**Web**: Not evaluated at this engagement&#x27;s conformance target (WCAG 2.2 AA).</li> </ul> |
| [2.4.9 Link Purpose (Link Only)](https://www.w3.org/TR/WCAG22/#link-purpose-link-only) | <ul><li>**Web**: Not Evaluated</li> </ul> | <ul><li>**Web**: Not evaluated at this engagement&#x27;s conformance target (WCAG 2.2 AA).</li> </ul> |
| [2.4.10 Section Headings](https://www.w3.org/TR/WCAG22/#section-headings) | <ul><li>**Web**: Not Evaluated</li> </ul> | <ul><li>**Web**: Not evaluated at this engagement&#x27;s conformance target (WCAG 2.2 AA).</li> </ul> |
| [2.4.12 Focus Not Obscured (Enhanced)](https://www.w3.org/TR/WCAG22/#focus-not-obscured-enhanced) | <ul><li>**Web**: Not Evaluated</li> </ul> | <ul><li>**Web**: Not evaluated at this engagement&#x27;s conformance target (WCAG 2.2 AA).</li> </ul> |
| [2.4.13 Focus Appearance](https://www.w3.org/TR/WCAG22/#focus-appearance) | <ul><li>**Web**: Not Evaluated</li> </ul> | <ul><li>**Web**: Not evaluated at this engagement&#x27;s conformance target (WCAG 2.2 AA).</li> </ul> |
| [2.5.5 Target Size (Enhanced)](https://www.w3.org/TR/WCAG22/#target-size-enhanced) | <ul><li>**Web**: Not Evaluated</li> </ul> | <ul><li>**Web**: Not evaluated at this engagement&#x27;s conformance target (WCAG 2.2 AA).</li> </ul> |
| [2.5.6 Concurrent Input Mechanisms](https://www.w3.org/TR/WCAG22/#concurrent-input-mechanisms) | <ul><li>**Web**: Not Evaluated</li> </ul> | <ul><li>**Web**: Not evaluated at this engagement&#x27;s conformance target (WCAG 2.2 AA).</li> </ul> |
| [3.1.3 Unusual Words](https://www.w3.org/TR/WCAG22/#unusual-words) | <ul><li>**Web**: Not Evaluated</li> </ul> | <ul><li>**Web**: Not evaluated at this engagement&#x27;s conformance target (WCAG 2.2 AA).</li> </ul> |
| [3.1.4 Abbreviations](https://www.w3.org/TR/WCAG22/#abbreviations) | <ul><li>**Web**: Not Evaluated</li> </ul> | <ul><li>**Web**: Not evaluated at this engagement&#x27;s conformance target (WCAG 2.2 AA).</li> </ul> |
| [3.1.5 Reading Level](https://www.w3.org/TR/WCAG22/#reading-level) | <ul><li>**Web**: Not Evaluated</li> </ul> | <ul><li>**Web**: Not evaluated at this engagement&#x27;s conformance target (WCAG 2.2 AA).</li> </ul> |
| [3.1.6 Pronunciation](https://www.w3.org/TR/WCAG22/#pronunciation) | <ul><li>**Web**: Not Evaluated</li> </ul> | <ul><li>**Web**: Not evaluated at this engagement&#x27;s conformance target (WCAG 2.2 AA).</li> </ul> |
| [3.2.5 Change on Request](https://www.w3.org/TR/WCAG22/#change-on-request) | <ul><li>**Web**: Not Evaluated</li> </ul> | <ul><li>**Web**: Not evaluated at this engagement&#x27;s conformance target (WCAG 2.2 AA).</li> </ul> |
| [3.3.5 Help](https://www.w3.org/TR/WCAG22/#help) | <ul><li>**Web**: Not Evaluated</li> </ul> | <ul><li>**Web**: Not evaluated at this engagement&#x27;s conformance target (WCAG 2.2 AA).</li> </ul> |
| [3.3.6 Error Prevention (All)](https://www.w3.org/TR/WCAG22/#error-prevention-all) | <ul><li>**Web**: Not Evaluated</li> </ul> | <ul><li>**Web**: Not evaluated at this engagement&#x27;s conformance target (WCAG 2.2 AA).</li> </ul> |
| [3.3.9 Accessible Authentication (Enhanced)](https://www.w3.org/TR/WCAG22/#accessible-authentication-enhanced) | <ul><li>**Web**: Not Evaluated</li> </ul> | <ul><li>**Web**: Not evaluated at this engagement&#x27;s conformance target (WCAG 2.2 AA).</li> </ul> |


## Legal Disclaimer
PUBLIC REVIEW DRAFT — NOT ISSUED. This review copy is based on the frozen AS-OACR-001 sample and evidence boundary. It is not a Drupal Association position, Mike Gifford approval, release-readiness decision, Section 508 report, or whole-product conformance claim.

## Repository
https://github.com/mgifford/drupal-core



## Copyright

[OpenACR](https://github.com/GSA/openacr) is a format maintained by the [GSA](https://gsa.gov/). The content is the responsibility of the author.

This content is licensed under a [Creative Commons Attribution Share Alike 2.0 Generic](https://creativecommons.org/licenses/by-sa/2.0/legalcode).
