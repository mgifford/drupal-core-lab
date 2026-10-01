# Drupal Core Accessibility Bug Report

> **Generated:** 2026-07-06T02:23:18.404Z
> **Tool:** axe-core via @axe-core/playwright | **Browser:** Chromium
> **Standard:** [ACCESSIBILITY_BUG_REPORTING_BEST_PRACTICES.md](https://github.com/mgifford/ACCESSIBILITY.md/blob/main/examples/ACCESSIBILITY_BUG_REPORTING_BEST_PRACTICES.md)

## Summary

| Metric | Value |
| :--- | :--- |
| Pages crawled | 1341 |
| Total violation instances | 2672 |
| Unique patterns | 79 |
| WCAG conformance failures | 73 |
| Best practices (Deque/axe — not WCAG failures) | 6 |
| Template-level patterns (≥3 pages) 🔁 | 48 |
| Critical | 0 |
| Serious | 75 |
| Moderate | 3 |
| Minor | 1 |

Project queue: https://www.drupal.org/project/issues/search?text=&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

## Validated Keyboard Promotion Findings

| Metric | Value |
| :--- | :--- |
| Promotion candidates (WCAG 2.5.3) | 2 |
| Contract checks | 4 |
| ❌ Failures | 1 |
| ✅ Passes | 3 |
| Results generated | 2026-04-29T18:00:08.808Z |

### ❌ Label-in-Name Failures (Action Required)

> **WCAG 2.5.3** — The accessible name of a control must contain the visible label text. Speech-input users who activate controls by speaking what they see will fail if these differ.

#### LABEL-IN-NAME-004: Configure action visible text appears in accessible name

- **Route:** `/admin/config/content/formats`
- **Selector:** `table tbody tr:has-text("Basic HTML") a:has-text("Configure")`
- **Visible label (expected in accessible name):** `Configure`
- **Actual accessible name (aria-label):** `Edit Basic HTML`
- **WCAG SC:** 2.5.3 Label in Name (Level A)

**How to reproduce:**

1. Log into Drupal and navigate to `/admin/config/content/formats`
2. Locate the element matching `table tbody tr:has-text("Basic HTML") a:has-text("Configure")`
3. Inspect the element — the visible text reads **"Configure"**
4. Check `aria-label` — it reads **"Edit Basic HTML"** which does not contain the visible text
5. A speech-input user saying *"click Configure"* cannot activate this control

**Fix:** Update the `aria-label` to include the visible label text, or remove it if the visible text already provides a sufficient accessible name.

<details>
<summary>✅ Passing label-in-name checks (3) — click to expand</summary>
<table><thead><tr><th>Contract ID</th><th>Route</th><th>Selector</th><th>Expected Label</th></tr></thead><tbody>
<tr><td>LABEL-IN-NAME-001</td><td><code>/admin/form_style</code></td><td><code>#edit-test-datelist-month</code></td><td>Month</td></tr>
<tr><td>LABEL-IN-NAME-002</td><td><code>/admin/form_style</code></td><td><code>#edit-test-datelist-day</code></td><td>Day</td></tr>
<tr><td>LABEL-IN-NAME-003</td><td><code>/admin/structure/types/add</code></td><td><code>summary:has-text("Submission form settings")</code></td><td>Submission form settings</td></tr>
</tbody></table>
</details>

<details>
<summary>✅ Promotion candidates that passed validation (2) — click to expand</summary>
<table><thead><tr><th>Candidate ID</th><th>Route</th><th>Finding</th></tr></thead><tbody>
<tr><td>PROMOTE-001</td><td><code>/admin/form_style</code></td><td>2 potential label-in-name mismatches in sampled focus steps.</td></tr>
<tr><td>PROMOTE-002</td><td><code>/admin/structure/types/add</code></td><td>1 potential label-in-name mismatches in sampled focus steps.</td></tr>
</tbody></table>
</details>

## Aggregated Accessibility Issues by Category

### CSS and Presentation

- **Total unique patterns:** 70
- **Rules:** `color-contrast`

  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /admin/config/content/formats/manage/restricted_html, /admin/config/system/site-information, /admin/form_style, /admin/modules, /admin/people, /admin/structure/display-modes/form/add/contact_message, /admin/structure/taxonomy, /admin/structure/taxonomy/add, /admin/structure/types/add, /admin/structure/types/manage/test_type/display/default, /autocomplete, /buttons, /contact/checkbox_radio, /contact/field_cardinality_test, /contact/imagefile_file, /contact/imagefile_image, /contact/presuf_number, /contact/presuf_text, /contact/select, /contact/textarea, /contact/textform, /dropbutton, /fieldset, /node/add/article, /node/add/cd, /node/add/page, /password, /progress, /user/1/edit
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /cd-navigation/config, /contact/presuf_number, /contact/presuf_text, /contact/select, /contact/textarea, /contact/textform, /message, /node/add/cd, /password, /progress, /table, /tabledrag, /tabs, /tabs/format/plain_text
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /admin/appearance, /admin/config/content/formats, /admin/config/system/site-information, /admin/content, /admin/form_style, /admin/modules, /admin/people, /admin/structure/block, /admin/structure/display-modes/form/add/contact_message, /admin/structure/taxonomy, /admin/structure/taxonomy/add, /admin/structure/types/add, /admin/structure/types/manage/test_type/display/default, /autocomplete, /buttons, /contact/checkbox_radio, /contact/field_cardinality_test, /contact/imagefile_file, /contact/imagefile_image, /contact/presuf_formatted, /contact/presuf_number, /contact/presuf_text, /contact/select, /contact/textarea, /contact/textform, /fieldset, /node/add/article, /node/add/cd, /node/add/page, /password, /progress, /table, /tabledrag, /user/1/edit
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /admin/appearance, /admin/config/system/site-information, /admin/content, /admin/structure/display-modes/form/add/contact_message, /admin/structure/types/manage/test_type/display/default, /autocomplete, /buttons, /cd-navigation/config, /contact/checkbox_radio, /contact/field_cardinality_test, /contact/imagefile_file, /contact/imagefile_image, /contact/presuf_formatted, /contact/presuf_number, /contact/presuf_text, /contact/select, /contact/textarea, /contact/textform, /dialog, /dropbutton, /fieldset, /message, /node/add/cd, /password, /progress, /table, /tabledrag, /tabs, /tabs/format/plain_text
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /admin, /admin/config, /admin/reports, /admin/structure, /admin/structure/types, /cd-navigation/config, /dialog, /message, /tabs, /tabs/format/plain_text, /this-page-does-not-exist
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /admin/config/content/formats, /admin/content, /admin/people, /admin/structure/taxonomy, /admin/structure/types
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /admin/people
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /admin/people
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /admin/people
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /admin/structure, /admin/structure/block, /admin/structure/taxonomy, /admin/structure/types
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /admin/structure/block
  - "No blocks in this region" placeholder text fails contrast (2.84:1, needs 4.5:1)
    - Affected routes (full list): /admin/structure/types/manage/test_type/display/default
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /contact/select
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /contact/textarea
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /contact/textarea
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /contact/textarea
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /contact/textarea
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /contact/textform
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /contact/textform
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /contact/textform
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /contact/textform
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /contact/textform
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /contact/textform
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /contact/textform
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /contact/textform
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /contact/textform
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /contact/textform
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /contact/textform
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /contact/textform
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /contact/textform
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /contact/textform
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /contact/textform
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /admin/config, /admin/config/content/formats, /admin/config/system/site-information
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /node/add/article, /node/add/cd, /node/add/page
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /admin/appearance
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /admin/config/content/formats/manage/restricted_html
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /admin/form_style
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /admin/modules
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /admin/people
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /admin/reports
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /admin/structure/types/add
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /admin/structure/types/add
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /admin/structure/types/add
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /admin/structure/types/add
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /admin/structure/types/add
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /buttons
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /contact/checkbox_radio
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /contact/checkbox_radio
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /contact/field_cardinality_test
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /contact/field_cardinality_test
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /contact/imagefile_file
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /contact/imagefile_file
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /contact/imagefile_file
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /contact/imagefile_file
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /contact/imagefile_file
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /contact/imagefile_file
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /contact/imagefile_file
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /contact/imagefile_file
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /contact/imagefile_image
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /contact/imagefile_image
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /contact/imagefile_image
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /contact/imagefile_image
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /contact/imagefile_image
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /contact/imagefile_image
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /contact/imagefile_image
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /contact/imagefile_image
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /contact/imagefile_image
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /dropbutton
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /dropbutton
  - color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min
    - Affected routes (full list): /tabs

### Input Modalities

- **Total unique patterns:** 2
- **Rules:** `target-size`

  - target-size: Ensure touch targets have sufficient size and space
    - Affected routes (full list): /tabledrag
  - target-size: Ensure touch targets have sufficient size and space
    - Affected routes (full list): /tabledrag

### Navigation

- **Total unique patterns:** 1
- **Rules:** `link-in-text-block`

  - link-in-text-block: Ensure links are distinguished from surrounding text in a way that does not rely
    - Affected routes (full list): /contact/imagefile_file

### Form Interactions

- **Total unique patterns:** 2
- **Rules:** `label-title-only`

  - label-title-only: Ensure that every form element has a visible label and is not solely labeled usi
    - Affected routes (full list): /contact/checkbox_radio
  - label-title-only: Ensure that every form element has a visible label and is not solely labeled usi
    - Affected routes (full list): /contact/checkbox_radio

### Semantic Structure

- **Total unique patterns:** 3
- **Rules:** `region`

  - Local task tab headings (#primary-tabs-title) are outside any landmark region
    - Affected routes (full list): /admin, /admin/appearance, /admin/content, /admin/modules, /admin/people, /admin/structure/types, /admin/structure/types/manage/test_type/display/default, /buttons, /contact/checkbox_radio, /contact/field_cardinality_test, /contact/imagefile_file, /contact/imagefile_image, /contact/presuf_formatted, /contact/presuf_number, /contact/presuf_text, /contact/select, /contact/textarea, /contact/textform, /dropbutton, /message, /progress, /tabledrag, /tabs, /tabs/format/plain_text
  - region: Ensure all page content is contained by landmarks
    - Affected routes (full list): /admin/config/content/formats, /admin/content, /admin/people, /admin/structure/taxonomy, /admin/structure/types
  - region: Ensure all page content is contained by landmarks
    - Affected routes (full list): /user/1/edit

### Data Tables

- **Total unique patterns:** 1
- **Rules:** `empty-table-header`

  - empty-table-header: Ensure table headers have discernible text
    - Affected routes (full list): /table

## Reproducible Issue Details — WCAG Conformance Failures

> These rules map directly to WCAG success criteria. File on drupal.org as bug reports with the `Accessibility` tag plus the per-SC `wcagXXX` tag listed under each issue.

### DRUPAL-A11Y-001—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-58ED44E2
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 48 of 1341 pages (4%)
**Selector:** label[for="edit-preferred-theme"]
**XPath:** //label[@for="edit-preferred-theme"]
**Parent Context:** N/A

**Affected URLs (full list):**
- https://drupal-core.ddev.site/admin/config/content/formats/manage/restricted_html
- /admin/config/system/site-information
- /admin/form_style
- /admin/modules
- /admin/people
- /admin/structure/display-modes/form/add/contact_message
- /admin/structure/taxonomy
- /admin/structure/taxonomy/add
- /admin/structure/types/add
- /admin/structure/types/manage/test_type/display/default
- /autocomplete
- /buttons
- /contact/checkbox_radio
- /contact/field_cardinality_test
- /contact/imagefile_file
- /contact/imagefile_image
- /contact/presuf_number
- /contact/presuf_text
- /contact/select
- /contact/textarea
- /contact/textform
- /dropbutton
- /fieldset
- /node/add/article
- /node/add/cd
- /node/add/page
- /password
- /progress
- /user/1/edit

**Conditions:**
- `admin` (dark desktop, dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow, dark mobile, dark mobile-landscape, dark tablet)

#### HTML Snippet
```html
<label for="edit-preferred-theme" class="form-item__label">Preferred theme</label>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 1.2 (foreground color: #ffffff, background color: #eaeaea, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. This issue may require expanding or activating interactive UI elements before running axe.
2. Go to https://drupal-core.ddev.site/admin/config/content/formats/manage/restricted_html
3. Use the matching context from Conditions: `admin` (dark desktop, dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow, dark mobile, dark mobile-landscape, dark tablet)
4. Open browser DevTools and run axe.run() in the Console.
5. Confirm rule color-contrast on selector label[for="edit-preferred-theme"].

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 1.2 (foreground color: #ffffff, background color: #eaeaea, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20for&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-58ED44E2
- Instance IDs: INS-4CE96C73, INS-BEBAEE99, INS-3109739F, INS-D97EA76E, INS-DAFA4C86, INS-3B4D82ED, INS-75A47865, INS-22C1311B, INS-78685421, INS-F7CC39E0, INS-23C49404, INS-7CD18366, INS-EADCB329, INS-44FCACE8, INS-5FABFE21, INS-FF0BE7E6, INS-35918395, INS-21DF06EB, INS-BC4411B5, INS-3BBD9BD5, INS-ADA0B8D0, INS-F5A01E7F, INS-11AA2F29, INS-6F0D2701, INS-97139980, INS-7C442FA9, INS-C7DA2EDF, INS-573985F2, INS-0D4F785F, INS-E4B2C2C3, INS-CBDBD996, INS-80E41BD7, INS-D483E40C, INS-55D3ED9F, INS-DE493395, INS-AFA1FF8E, INS-55CD26C0, INS-AD5CEC11, INS-2221869E, INS-7508A508, INS-E58A96AF, INS-D056F298, INS-1762ABFD, INS-7B4832F5, INS-AF3434F9, INS-A78E5F57, INS-BB3A11EC, INS-687A7BCD

### DRUPAL-A11Y-002—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-6CBB7080
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 42 of 1341 pages (3%)
**Selector:** .toolbar-button--icon--burger > .toolbar-button__label[data-toolbar-text=""]
**XPath:** //*[contains(@class,"toolbar-button--icon--burger > .toolbar-button__label[data-toolbar-text=""]")]
**Parent Context:** N/A
**Likely Template:** toolbar (admin theme)
**Template Hint:** Admin toolbar
**Drupal File:** See likely_template above

**Affected URLs (full list):**
- https://drupal-core.ddev.site/cd-navigation/config
- /contact/presuf_number
- /contact/presuf_text
- /contact/select
- /contact/textarea
- /contact/textform
- /message
- /node/add/cd
- /password
- /progress
- /table
- /tabledrag
- /tabs
- /tabs/format/plain_text

**Conditions:**
- `admin` (dark mobile, dark mobile-landscape, dark tablet)

#### HTML Snippet
```html
<span class="toolbar-button__label" data-toolbar-text="">Expand sidebar</span>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 1.5 (foreground color: #d2d3d3, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. This issue may require expanding or activating interactive UI elements before running axe.
2. Go to https://drupal-core.ddev.site/cd-navigation/config
3. Use the matching context from Conditions: `admin` (dark mobile, dark mobile-landscape, dark tablet)
4. Open browser DevTools and run axe.run() in the Console.
5. Confirm rule color-contrast on selector .toolbar-button--icon--burger > .toolbar-button__label[data-toolbar-text=""].

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 1.5 (foreground color: #d2d3d3, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20toolbar%20(admin%20theme)%20toolbar-button--icon--burger&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-6CBB7080
- Instance IDs: INS-FFDD0E70, INS-E54F6082, INS-C5421747, INS-EC98A7D5, INS-04BA395A, INS-8286C33E, INS-12818A09, INS-C88690BA, INS-E3E94319, INS-78C18018, INS-3AE5172D, INS-618FD992, INS-6711F306, INS-3571B450, INS-872A8F0E, INS-6A646C89, INS-F728B786, INS-C58F62BB, INS-96EDC993, INS-30E173A0, INS-500ABEB0, INS-5232EDDC, INS-98A284FF, INS-B1C146E1, INS-7271A15D, INS-E983A00E, INS-41091976, INS-ACFD8B9E, INS-6A93400B, INS-75BDDBD6, INS-07905855, INS-441EC7C7, INS-50CC7E7F, INS-2EAB1F56, INS-928DAAF2, INS-B423E138, INS-6DC269C7, INS-643AF3EF, INS-4FABE1C2, INS-EA05BDEC, INS-A10A3B05, INS-D199E667

### DRUPAL-A11Y-003—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-D62C6EC9
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 48 of 1341 pages (4%)
**Selector:** #edit-submit
**XPath:** //*[@id="edit-submit"]
**Parent Context:** N/A

**Affected URLs (full list):**
- https://drupal-core.ddev.site/admin/appearance
- /admin/config/content/formats
- /admin/config/system/site-information
- /admin/content
- /admin/form_style
- /admin/modules
- /admin/people
- /admin/structure/block
- /admin/structure/display-modes/form/add/contact_message
- /admin/structure/taxonomy
- /admin/structure/taxonomy/add
- /admin/structure/types/add
- /admin/structure/types/manage/test_type/display/default
- /autocomplete
- /buttons
- /contact/checkbox_radio
- /contact/field_cardinality_test
- /contact/imagefile_file
- /contact/imagefile_image
- /contact/presuf_formatted
- /contact/presuf_number
- /contact/presuf_text
- /contact/select
- /contact/textarea
- /contact/textform
- /fieldset
- /node/add/article
- /node/add/cd
- /node/add/page
- /password
- /progress
- /table
- /tabledrag
- /user/1/edit

**Conditions:**
- `admin` (dark desktop, dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow, dark mobile, dark mobile-landscape, dark tablet, light desktop accent:yellow), `claro` (light desktop, light mobile, light mobile-landscape, light tablet)

#### HTML Snippet
```html
<input data-drupal-selector="edit-submit" type="submit" id="edit-submit" name="op" value="Save configuration" class="button button--primary js-form-submit form-submit">
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 3.81 (foreground color: #111111, background color: #966705, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. This issue may require interaction state (typing/dragging/focus) to expose the failing element.
2. Go to https://drupal-core.ddev.site/admin/appearance
3. Use the matching context from Conditions: `admin` (dark desktop, dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow, dark mobile, dark mobile-landscape, dark tablet, light desktop accent:yellow), `claro` (light desktop, light mobile, light mobile-landscape, light tablet)
4. Open browser DevTools and run axe.run() in the Console.
5. Confirm rule color-contrast on selector #edit-submit.

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 3.81 (foreground color: #111111, background color: #966705, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20edit-submit&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-D62C6EC9
- Instance IDs: INS-A67A9E01, INS-2DF92ABB, INS-82415EDA, INS-F33227D7, INS-B288F0B1, INS-1334BD3E, INS-A3DBD29E, INS-B42CAB9D, INS-9CAC7E38, INS-8015E63B, INS-4EDFD1F0, INS-A3C4D63C, INS-595B7F04, INS-91E640A5, INS-F9F14A29, INS-A623258F, INS-AAE2831D, INS-2594210C, INS-8635FB56, INS-05EED564, INS-2D453C92, INS-AFABD6E7, INS-9E9E3A6E, INS-15C0E33F, INS-C30763AC, INS-E9B64E07, INS-AB65FFAB, INS-8F398DC9, INS-F9D51E91, INS-F80C06CB, INS-9068814C, INS-1FAEE9D4, INS-85757E9F, INS-3578DF3A, INS-95B3E936, INS-ED6D9F62, INS-7AAA5554, INS-F4363A69, INS-D4BF418F, INS-3CAD5090, INS-6BADCABE, INS-2FBAFC31, INS-E6EB8026, INS-201A9AED, INS-3122B3D0, INS-2E2457E9, INS-7CA7C012, INS-213AC9AF

### DRUPAL-A11Y-004—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-5CF2AC9D
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 29 of 1341 pages (2%)
**Selector:** .toolbar-button--icon--theming-tools-dashboard > .toolbar-button__label[data-toolbar-text=""]
**XPath:** //*[contains(@class,"toolbar-button--icon--theming-tools-dashboard > .toolbar-button__label[data-toolbar-text=""]")]
**Parent Context:** N/A
**Likely Template:** toolbar (admin theme)
**Template Hint:** Admin toolbar
**Drupal File:** See likely_template above

**Affected URLs (full list):**
- https://drupal-core.ddev.site/admin/appearance
- /admin/config/system/site-information
- /admin/content
- /admin/structure/display-modes/form/add/contact_message
- /admin/structure/types/manage/test_type/display/default
- /autocomplete
- /buttons
- /cd-navigation/config
- /contact/checkbox_radio
- /contact/field_cardinality_test
- /contact/imagefile_file
- /contact/imagefile_image
- /contact/presuf_formatted
- /contact/presuf_number
- /contact/presuf_text
- /contact/select
- /contact/textarea
- /contact/textform
- /dialog
- /dropbutton
- /fieldset
- /message
- /node/add/cd
- /password
- /progress
- /table
- /tabledrag
- /tabs
- /tabs/format/plain_text

**Conditions:**
- `admin` (dark desktop, dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)

#### HTML Snippet
```html
<span class="toolbar-button__label" data-toolbar-text="">Theming Tools</span>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 1.39 (foreground color: #1f242d, background color: #3b3b3f, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. This issue may require opening a dialog/off-canvas panel before running axe.
2. Go to https://drupal-core.ddev.site/admin/appearance
3. Use the matching context from Conditions: `admin` (dark desktop, dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)
4. Open browser DevTools and run axe.run() in the Console.
5. Confirm rule color-contrast on selector .toolbar-button--icon--theming-tools-dashboard > .toolbar-button__label[data-toolbar-text=""].

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 1.39 (foreground color: #1f242d, background color: #3b3b3f, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20toolbar%20(admin%20theme)%20toolbar-button--icon--theming-tools-dashboard&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-5CF2AC9D
- Instance IDs: INS-D05074CE, INS-E4A9005C, INS-C881A93E, INS-C25B7E16, INS-5957890F, INS-1A4B3186, INS-4B0BACFB, INS-AAC1D123, INS-4D3B59A3, INS-23334D2C, INS-5C83144F, INS-172624D6, INS-E48F388E, INS-B8323DC0, INS-34EB71C1, INS-5133A9AB, INS-29524F72, INS-E3FC59C7, INS-5FEDA3FB, INS-C1CAAF43, INS-A16F4FEB, INS-5C2ACA16, INS-F4062807, INS-82F2E69B, INS-74AEE6F5, INS-31BDD588, INS-57928335, INS-20ACCFCA, INS-3DCA4105

### DRUPAL-A11Y-005—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-850DCDEB
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 26 of 1341 pages (2%)
**Selector:** label
**XPath:** //label
**Parent Context:** N/A

**Affected URLs (full list):**
- https://drupal-core.ddev.site/admin
- /admin/config
- /admin/reports
- /admin/structure
- /admin/structure/types
- /cd-navigation/config
- /dialog
- /message
- /tabs
- /tabs/format/plain_text
- /this-page-does-not-exist

**Conditions:**
- `admin` (dark desktop, dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow, dark mobile, dark mobile-landscape, dark tablet)

#### HTML Snippet
```html
<label for="edit-preferred-theme" class="form-item__label">Preferred theme</label>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 1.22 (foreground color: #ffffff, background color: #e8e8e8, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. This issue may require opening a dialog/off-canvas panel before running axe.
2. Go to https://drupal-core.ddev.site/admin
3. Use the matching context from Conditions: `admin` (dark desktop, dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow, dark mobile, dark mobile-landscape, dark tablet)
4. Open browser DevTools and run axe.run() in the Console.
5. Confirm rule color-contrast on selector label.

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 1.22 (foreground color: #ffffff, background color: #e8e8e8, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20label&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-850DCDEB
- Instance IDs: INS-DA8536C0, INS-2E6E5277, INS-963A6B1C, INS-A1E49634, INS-2727AE27, INS-79261CE7, INS-97640BF9, INS-B6EBA962, INS-C7F392BD, INS-B9A69863, INS-6EC724FB, INS-A739D8F3, INS-12C55ECB, INS-55E847C8, INS-35EB9EBF, INS-95273731, INS-AB2A3508, INS-BB161EB8, INS-345C0C51, INS-06E5AE21, INS-A3BA463A, INS-1B7B35A4, INS-8B209364, INS-38F7C2DE, INS-19FC665A, INS-7B242CAB

### DRUPAL-A11Y-006—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-1296E451
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 5 of 1341 pages (0%)
**Selector:** .button--action
**XPath:** //*[contains(@class,"button--action")]
**Parent Context:** N/A

**Affected URLs (full list):**
- https://drupal-core.ddev.site/admin/config/content/formats
- /admin/content
- /admin/people
- /admin/structure/taxonomy
- /admin/structure/types

**Conditions:**
- `admin` (light desktop accent:yellow)

#### HTML Snippet
```html
<a href="/admin/config/content/formats/add" class="button button--action button--primary" data-drupal-link-system-path="admin/config/content/formats/add">Add text format</a>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 3.81 (foreground color: #111111, background color: #966705, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/admin/config/content/formats
2. Use the matching context from Conditions: `admin` (light desktop accent:yellow)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule color-contrast on selector .button--action.

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 3.81 (foreground color: #111111, background color: #966705, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20button--action&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-1296E451
- Instance IDs: INS-C6EB3D6D, INS-3B67D91D, INS-230DF573, INS-903DECEC, INS-650E20AF

### DRUPAL-A11Y-007—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-F4687B6D
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 4 of 1341 pages (0%)
**Selector:** summary
**XPath:** //summary
**Parent Context:** N/A

**Affected URLs (full list):**
- https://drupal-core.ddev.site/admin/people

**Conditions:**
- `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow, light desktop, light desktop accent:dark_purple, light desktop accent:green, light desktop accent:light_blue, light desktop accent:orange, light desktop accent:pink, light desktop accent:red, light desktop accent:teal, light desktop accent:yellow, light mobile, light mobile-landscape, light tablet)

#### HTML Snippet
```html
<summary>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 3.11 (foreground color: #f39b9d, background color: #745655, font size: 12.0pt (16px), font weight: bold). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/admin/people
2. Use the matching context from Conditions: `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow, light desktop, light desktop accent:dark_purple, light desktop accent:green, light desktop accent:light_blue, light desktop accent:orange, light desktop accent:pink, light desktop accent:red, light desktop accent:teal, light desktop accent:yellow, light mobile, light mobile-landscape, light tablet)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule color-contrast on selector summary.

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 3.11 (foreground color: #f39b9d, background color: #745655, font size: 12.0pt (16px), font weight: bold). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20summary&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-F4687B6D
- Instance IDs: INS-D5ED5CE3, INS-6F74B1DE, INS-3A4B92C9, INS-3093923A

### DRUPAL-A11Y-008—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-E5B556BF
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 4 of 1341 pages (0%)
**Selector:** summary > em:nth-child(1)
**XPath:** //summary > em:nth-child(1)
**Parent Context:** N/A

**Affected URLs (full list):**
- https://drupal-core.ddev.site/admin/people

**Conditions:**
- `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow, light desktop, light desktop accent:dark_purple, light desktop accent:green, light desktop accent:light_blue, light desktop accent:orange, light desktop accent:pink, light desktop accent:red, light desktop accent:teal, light desktop accent:yellow, light mobile, light mobile-landscape, light tablet)

#### HTML Snippet
```html
<em class="placeholder">Deprecated function</em>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 3.11 (foreground color: #f39b9d, background color: #745655, font size: 12.0pt (16px), font weight: bold). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/admin/people
2. Use the matching context from Conditions: `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow, light desktop, light desktop accent:dark_purple, light desktop accent:green, light desktop accent:light_blue, light desktop accent:orange, light desktop accent:pink, light desktop accent:red, light desktop accent:teal, light desktop accent:yellow, light mobile, light mobile-landscape, light tablet)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule color-contrast on selector summary > em:nth-child(1).

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 3.11 (foreground color: #f39b9d, background color: #745655, font size: 12.0pt (16px), font weight: bold). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20summary&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-E5B556BF
- Instance IDs: INS-605CFBC6, INS-C354186E, INS-0D30274C, INS-665BA162

### DRUPAL-A11Y-009—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-E34F9E45
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 12 of 1341 pages (1%)
**Selector:** em:nth-child(2)
**XPath:** //em:nth-child(2)
**Parent Context:** N/A

**Affected URLs (full list):**
- https://drupal-core.ddev.site/admin/people

**Conditions:**
- `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow, light desktop, light desktop accent:dark_purple, light desktop accent:green, light desktop accent:light_blue, light desktop accent:orange, light desktop accent:pink, light desktop accent:red, light desktop accent:teal, light desktop accent:yellow, light mobile, light mobile-landscape, light tablet)

#### HTML Snippet
```html
<em class="placeholder">Drupal\Core\Entity\ContentEntityBase-&gt;hasTranslation()</em>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 3.11 (foreground color: #f39b9d, background color: #745655, font size: 12.0pt (16px), font weight: bold). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/admin/people
2. Use the matching context from Conditions: `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow, light desktop, light desktop accent:dark_purple, light desktop accent:green, light desktop accent:light_blue, light desktop accent:orange, light desktop accent:pink, light desktop accent:red, light desktop accent:teal, light desktop accent:yellow, light mobile, light mobile-landscape, light tablet)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule color-contrast on selector em:nth-child(2).

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 3.11 (foreground color: #f39b9d, background color: #745655, font size: 12.0pt (16px), font weight: bold). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20em&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-E34F9E45
- Instance IDs: INS-70044269, INS-C5304CBB, INS-9863CD4D, INS-07E6C469, INS-31257362, INS-FEC80FC4, INS-491A5032, INS-DB9B5A12, INS-0CC9CF91, INS-A58F4C81, INS-F6C1CA01, INS-4BAE191A

### DRUPAL-A11Y-010—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-09E68687
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 4 of 1341 pages (0%)
**Selector:** .toolbar-button--icon--system-admin-structure > .toolbar-button__label[data-toolbar-text=""]
**XPath:** //*[contains(@class,"toolbar-button--icon--system-admin-structure > .toolbar-button__label[data-toolbar-text=""]")]
**Parent Context:** N/A
**Likely Template:** toolbar (admin theme)
**Template Hint:** Admin toolbar
**Drupal File:** See likely_template above

**Affected URLs (full list):**
- https://drupal-core.ddev.site/admin/structure
- /admin/structure/block
- /admin/structure/taxonomy
- /admin/structure/types

**Conditions:**
- `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)

#### HTML Snippet
```html
<span class="toolbar-button__label" data-toolbar-text="">Structure</span>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 1.39 (foreground color: #1f242d, background color: #3b3b3f, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/admin/structure
2. Use the matching context from Conditions: `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule color-contrast on selector .toolbar-button--icon--system-admin-structure > .toolbar-button__label[data-toolbar-text=""].

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 1.39 (foreground color: #1f242d, background color: #3b3b3f, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20toolbar%20(admin%20theme)%20toolbar-button--icon--system-admin-structure&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-09E68687
- Instance IDs: INS-A3357781, INS-30D1E69D, INS-70A37429, INS-D9F10DB4

### DRUPAL-A11Y-011—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-8D2B75C4
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 4 of 1341 pages (0%)
**Selector:** .enable > a
**XPath:** //*[contains(@class,"enable > a")]
**Parent Context:** N/A

**Affected URLs (full list):**
- https://drupal-core.ddev.site/admin/structure/block

**Conditions:**
- `claro` (light desktop, light mobile, light mobile-landscape, light tablet)

#### HTML Snippet
```html
<a href="/admin/structure/block/manage/claro_vertical_tabs_test/enable?destination=/admin/structure/block&amp;token=16wvRWcXRXX73FgpdQQdVXGZdDemQZPss2hL3KiLwNk">Enable</a>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 4.1 (foreground color: #6a6b6f, background color: #e1e2e5, font size: 9.5pt (12.64px), font weight: bold). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/admin/structure/block
2. Use the matching context from Conditions: `claro` (light desktop, light mobile, light mobile-landscape, light tablet)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule color-contrast on selector .enable > a.

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 4.1 (foreground color: #6a6b6f, background color: #e1e2e5, font size: 9.5pt (12.64px), font weight: bold). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20enable&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-8D2B75C4
- Instance IDs: INS-6308B25F, INS-3D0FF38F, INS-BEE6118A, INS-AEED493E

### DRUPAL-A11Y-012—2026-07-05: "No blocks in this region" placeholder text fails contrast (2.84:1, needs 4.5:1)

**Pattern ID:** DRU-05EC5EAB
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 4 of 1341 pages (0%)
**Selector:** .region-hidden-message > td[colspan="9"]
**XPath:** //*[contains(@class,"region-hidden-message > td[colspan="9"]")]
**Parent Context:** N/A
**Likely Template:** region.html.twig
**Template Hint:** Region template
**Drupal File:** core/themes/claro/css/theme/block-admin.css (or its .pcss.css source)

**Affected URLs (full list):**
- https://drupal-core.ddev.site/admin/structure/types/manage/test_type/display/default

**Conditions:**
- `claro` (light desktop, light mobile, light mobile-landscape, light tablet)

#### HTML Snippet
```html
<td colspan="9">No field is hidden.</td>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 3.78 (foreground color: #828388, background color: #ffffff, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/admin/structure/types/manage/test_type/display/default
2. Use the matching context from Conditions: `claro` (light desktop, light mobile, light mobile-landscape, light tablet)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule color-contrast on selector .region-hidden-message > td[colspan="9"].

#### Expected Behaviour
Foreground color #767676 or darker on white (#ffffff) background → 4.54:1

#### Actual Behaviour
color: #999999 on #ffffff → contrast ratio 2.84:1

#### Impact
low-vision

#### Suggested Fix
In Claro's block-admin CSS, darken the placeholder text:

/* Before (broken) */
.block-region .region-message em {
  color: #999999;
}

/* After (fixed) */
.block-region .region-message em {
  color: #767676; /* 4.54:1 on white */
}

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Known Drupal issue: https://www.drupal.org/project/drupal/issues/3318394
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20region.html.twig%20region-hidden-message%20%22No%20blocks%20in%20this%20region%22%20placeholder%20text%20fails%20contrast%20(2.84%3A1%2C%20needs%204.5%3A1)&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-05EC5EAB
- Instance IDs: INS-0FCEAFFE, INS-D6B1A3D6, INS-087176ED, INS-059307A6

### DRUPAL-A11Y-013—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-E2078A3F
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 8 of 1341 pages (1%)
**Selector:** #edit-select-single-disabled--description
**XPath:** //*[@id="edit-select-single-disabled--description"]
**Parent Context:** N/A

**Affected URLs (full list):**
- https://drupal-core.ddev.site/contact/select

**Conditions:**
- `admin` (dark desktop, dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow, dark mobile, dark mobile-landscape, dark tablet)

#### HTML Snippet
```html
<div id="edit-select-single-disabled--description" class="is-disabled form-item__description">
      Description of disabled single-value select.
    </div>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/contact/select
2. Use the matching context from Conditions: `admin` (dark desktop, dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow, dark mobile, dark mobile-landscape, dark tablet)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule color-contrast on selector #edit-select-single-disabled--description.

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20edit-select-single-disabled--description&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-E2078A3F
- Instance IDs: INS-0E76C28B, INS-E120C355, INS-FB144740, INS-C5933BC8, INS-2346D213, INS-D993BAAA, INS-EB5DE0E5, INS-63E1281F

### DRUPAL-A11Y-014—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-AD2BFF67
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 32 of 1341 pages (2%)
**Selector:** #edit-message-disabled-N-value--description
**XPath:** //*[@id="edit-message-disabled-0-value--description"]
**Parent Context:** N/A

**Affected URLs (full list):**
- https://drupal-core.ddev.site/contact/textarea

**Conditions:**
- `admin` (dark desktop, dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow, dark mobile, dark mobile-landscape, dark tablet)

#### HTML Snippet
```html
<div id="edit-message-disabled-0-value--description" class="is-disabled form-item__description">
      Description of the disabled message field
    </div>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/contact/textarea
2. Use the matching context from Conditions: `admin` (dark desktop, dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow, dark mobile, dark mobile-landscape, dark tablet)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule color-contrast on selector #edit-message-disabled-N-value--description.

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20edit-message-disabled-N-value--description&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-AD2BFF67
- Instance IDs: INS-23FBFBC5, INS-184F3C8C, INS-84F351C7, INS-FB02B62F, INS-D3B13DB8, INS-4DF4FD36, INS-E32D2ADF, INS-EFA87849, INS-4A14B725, INS-8CDC8A67, INS-9CDD38A6, INS-3B14D2E3, INS-ADC8F1BC, INS-7A90E833, INS-E5520753, INS-2E1E2A77, INS-63C77EA4, INS-49D9CAB3, INS-B6166925, INS-DF84FB05, INS-5BA8A50E, INS-368462D4, INS-38B0103B, INS-366342A8, INS-1EF47892, INS-87F2DAEF, INS-2AF11D19, INS-DD76FD16, INS-9393BEEE, INS-8127BB01, INS-3A9556AB, INS-23A8FB93

### DRUPAL-A11Y-015—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-41A4004B
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 8 of 1341 pages (1%)
**Selector:** #edit-formatted-disabled-N--description
**XPath:** //*[@id="edit-formatted-disabled-0--description"]
**Parent Context:** N/A

**Affected URLs (full list):**
- https://drupal-core.ddev.site/contact/textarea

**Conditions:**
- `admin` (dark desktop, dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow, dark mobile, dark mobile-landscape, dark tablet)

#### HTML Snippet
```html
<div id="edit-formatted-disabled-0--description" class="form-item__description is-disabled">Description of the disabled formatted text field</div>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/contact/textarea
2. Use the matching context from Conditions: `admin` (dark desktop, dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow, dark mobile, dark mobile-landscape, dark tablet)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule color-contrast on selector #edit-formatted-disabled-N--description.

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20edit-formatted-disabled-N--description&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-41A4004B
- Instance IDs: INS-6FF6C19D, INS-6B30DA13, INS-F3FEE6EE, INS-D0AABC7A, INS-D0E16C06, INS-420C4112, INS-2B338435, INS-1AB56E5E

### DRUPAL-A11Y-016—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-280E210A
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 4 of 1341 pages (0%)
**Selector:** #edit-formatted-summary-disabled-N-summary--description
**XPath:** //*[@id="edit-formatted-summary-disabled-0-summary--description"]
**Parent Context:** N/A

**Affected URLs (full list):**
- https://drupal-core.ddev.site/contact/textarea

**Conditions:**
- `admin` (dark desktop, dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow, dark mobile, dark mobile-landscape, dark tablet)

#### HTML Snippet
```html
<div id="edit-formatted-summary-disabled-0-summary--description" class="is-disabled form-item__description">
      Leave blank to use trimmed value of full text as the summary.
    </div>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/contact/textarea
2. Use the matching context from Conditions: `admin` (dark desktop, dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow, dark mobile, dark mobile-landscape, dark tablet)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule color-contrast on selector #edit-formatted-summary-disabled-N-summary--description.

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20edit-formatted-summary-disabled-N-summary--description&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-280E210A
- Instance IDs: INS-D82B666B, INS-8CD5C8B1, INS-8CC1DFD5, INS-08AF0F28

### DRUPAL-A11Y-017—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-26F035FD
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 8 of 1341 pages (1%)
**Selector:** #edit-formatted-summary-disabled-N--description
**XPath:** //*[@id="edit-formatted-summary-disabled-0--description"]
**Parent Context:** N/A

**Affected URLs (full list):**
- https://drupal-core.ddev.site/contact/textarea

**Conditions:**
- `admin` (dark desktop, dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow, dark mobile, dark mobile-landscape, dark tablet)

#### HTML Snippet
```html
<div id="edit-formatted-summary-disabled-0--description" class="form-item__description is-disabled">Description of the disabled <em>formatted text with summary</em> field</div>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/contact/textarea
2. Use the matching context from Conditions: `admin` (dark desktop, dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow, dark mobile, dark mobile-landscape, dark tablet)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule color-contrast on selector #edit-formatted-summary-disabled-N--description.

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20edit-formatted-summary-disabled-N--description&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-26F035FD
- Instance IDs: INS-778F76BE, INS-E94AB84A, INS-0F4545D5, INS-0AEF6A1B, INS-B3BD7010, INS-79F2CD1F, INS-460A78C6, INS-206F1284

### DRUPAL-A11Y-018—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-A2F30B05
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 8 of 1341 pages (1%)
**Selector:** .form-item__prefix.is-disabled
**XPath:** //*[contains(@class,"form-item__prefix.is-disabled")]
**Parent Context:** N/A
**Likely Template:** form-element.html.twig
**Template Hint:** Form element template
**Drupal File:** See likely_template above

**Affected URLs (full list):**
- https://drupal-core.ddev.site/contact/textform

**Conditions:**
- `admin` (dark desktop, dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow, dark mobile, dark mobile-landscape, dark tablet)

#### HTML Snippet
```html
<span class="form-item__prefix is-disabled">prefix</span>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/contact/textform
2. Use the matching context from Conditions: `admin` (dark desktop, dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow, dark mobile, dark mobile-landscape, dark tablet)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule color-contrast on selector .form-item__prefix.is-disabled.

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20form-element.html.twig%20form-item__prefix&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-A2F30B05
- Instance IDs: INS-CA204D13, INS-76082784, INS-04E72809, INS-01C0B249, INS-76505633, INS-B9E475DE, INS-A5AC29D9, INS-79339354

### DRUPAL-A11Y-019—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-9E85665A
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 8 of 1341 pages (1%)
**Selector:** #edit-link-disabled-N-uri--description > ul > li:nth-child(1)
**XPath:** //*[@id="edit-link-disabled-0-uri--description > ul > li:nth-child(1)"]
**Parent Context:** N/A

**Affected URLs (full list):**
- https://drupal-core.ddev.site/contact/textform

**Conditions:**
- `admin` (dark desktop, dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow, dark mobile, dark mobile-landscape, dark tablet)

#### HTML Snippet
```html
<li>Disabled link field description</li>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/contact/textform
2. Use the matching context from Conditions: `admin` (dark desktop, dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow, dark mobile, dark mobile-landscape, dark tablet)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule color-contrast on selector #edit-link-disabled-N-uri--description > ul > li:nth-child(1).

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20edit-link-disabled-N-uri--description&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-9E85665A
- Instance IDs: INS-6F4F5D98, INS-19F5F29D, INS-7C5539AA, INS-CC2A3148, INS-31BA1251, INS-CF01F41D, INS-AF1F8AF0, INS-1CA14945

### DRUPAL-A11Y-020—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-F3991A4A
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 20 of 1341 pages (1%)
**Selector:** #edit-link-disabled-N-uri--description > ul > li:nth-child(2) > em:nth-child(1)
**XPath:** //*[@id="edit-link-disabled-0-uri--description > ul > li:nth-child(2) > em:nth-child(1)"]
**Parent Context:** N/A

**Affected URLs (full list):**
- https://drupal-core.ddev.site/contact/textform

**Conditions:**
- `admin` (dark desktop, dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow, dark mobile, dark mobile-landscape, dark tablet)

#### HTML Snippet
```html
<em class="placeholder">/node/add</em>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/contact/textform
2. Use the matching context from Conditions: `admin` (dark desktop, dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow, dark mobile, dark mobile-landscape, dark tablet)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule color-contrast on selector #edit-link-disabled-N-uri--description > ul > li:nth-child(2) > em:nth-child(1).

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20edit-link-disabled-N-uri--description&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-F3991A4A
- Instance IDs: INS-B8FBD9FA, INS-A4B1B37D, INS-249EDAC4, INS-A1A675FD, INS-1FCB177E, INS-E34F60B2, INS-9BBF7781, INS-10BE73CE, INS-D9AEE371, INS-C6A160B2, INS-98883E61, INS-D024BCE1, INS-EEC060D1, INS-2DF905FD, INS-6640BBDF, INS-3A814057, INS-0AAC7B2D, INS-B064C463, INS-429205D5, INS-D1AA1DD6

### DRUPAL-A11Y-021—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-F62785C7
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 4 of 1341 pages (0%)
**Selector:** #edit-link-title-disabled-N > legend > .fieldset__label.is-disabled
**XPath:** //*[@id="edit-link-title-disabled-0 > legend > .fieldset__label.is-disabled"]
**Parent Context:** N/A

**Affected URLs (full list):**
- https://drupal-core.ddev.site/contact/textform

**Conditions:**
- `admin` (dark desktop, dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow, dark mobile, dark mobile-landscape, dark tablet)

#### HTML Snippet
```html
<span class="is-disabled fieldset__label">Link with title (disabled)</span>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/contact/textform
2. Use the matching context from Conditions: `admin` (dark desktop, dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow, dark mobile, dark mobile-landscape, dark tablet)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule color-contrast on selector #edit-link-title-disabled-N > legend > .fieldset__label.is-disabled.

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20edit-link-title-disabled-N&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-F62785C7
- Instance IDs: INS-D17BC578, INS-F49874C9, INS-5236FB25, INS-2A684A9E

### DRUPAL-A11Y-022—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-5CEC2B2B
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 8 of 1341 pages (1%)
**Selector:** #edit-link-title-disabled-N-uri--description
**XPath:** //*[@id="edit-link-title-disabled-0-uri--description"]
**Parent Context:** N/A

**Affected URLs (full list):**
- https://drupal-core.ddev.site/contact/textform

**Conditions:**
- `admin` (dark desktop, dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow, dark mobile, dark mobile-landscape, dark tablet)

#### HTML Snippet
```html
<div id="edit-link-title-disabled-0-uri--description" class="is-disabled form-item__description">
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/contact/textform
2. Use the matching context from Conditions: `admin` (dark desktop, dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow, dark mobile, dark mobile-landscape, dark tablet)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule color-contrast on selector #edit-link-title-disabled-N-uri--description.

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20edit-link-title-disabled-N-uri--description&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-5CEC2B2B
- Instance IDs: INS-5DA20BE9, INS-CB7886E8, INS-DB082DC5, INS-037105F5, INS-EE669E1E, INS-28024E12, INS-EFBBB3F6, INS-794D97B7

### DRUPAL-A11Y-023—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-1844614F
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 20 of 1341 pages (1%)
**Selector:** #edit-link-title-disabled-N-uri--description > em:nth-child(1)
**XPath:** //*[@id="edit-link-title-disabled-0-uri--description > em:nth-child(1)"]
**Parent Context:** N/A

**Affected URLs (full list):**
- https://drupal-core.ddev.site/contact/textform

**Conditions:**
- `admin` (dark desktop, dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow, dark mobile, dark mobile-landscape, dark tablet)

#### HTML Snippet
```html
<em class="placeholder">/node/add</em>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/contact/textform
2. Use the matching context from Conditions: `admin` (dark desktop, dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow, dark mobile, dark mobile-landscape, dark tablet)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule color-contrast on selector #edit-link-title-disabled-N-uri--description > em:nth-child(1).

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20edit-link-title-disabled-N-uri--description&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-1844614F
- Instance IDs: INS-3D02A223, INS-F04205AB, INS-F34726D4, INS-9BFA3BF8, INS-254D4236, INS-326DFD71, INS-E3FF49E5, INS-63711B77, INS-924B2F59, INS-2F01D8DC, INS-55586EEB, INS-29B16340, INS-194D889B, INS-0537E12C, INS-A700A4C6, INS-5827FECF, INS-63CD29F5, INS-601261C6, INS-190E3892, INS-F3698B9F

### DRUPAL-A11Y-024—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-947532A5
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 4 of 1341 pages (0%)
**Selector:** #edit-timestamp-disabled-N-value--label
**XPath:** //*[@id="edit-timestamp-disabled-0-value--label"]
**Parent Context:** N/A

**Affected URLs (full list):**
- https://drupal-core.ddev.site/contact/textform

**Conditions:**
- `admin` (dark desktop, dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow, dark mobile, dark mobile-landscape, dark tablet)

#### HTML Snippet
```html
<div id="edit-timestamp-disabled-0-value--label" class="is-disabled form-item__label">Timestamp (disabled)</div>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/contact/textform
2. Use the matching context from Conditions: `admin` (dark desktop, dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow, dark mobile, dark mobile-landscape, dark tablet)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule color-contrast on selector #edit-timestamp-disabled-N-value--label.

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20edit-timestamp-disabled-N-value--label&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-947532A5
- Instance IDs: INS-C2E1ED21, INS-478DF6D9, INS-20694906, INS-6900C902

### DRUPAL-A11Y-025—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-2E4D3107
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 8 of 1341 pages (1%)
**Selector:** #edit-date-disabled-N-value--label
**XPath:** //*[@id="edit-date-disabled-0-value--label"]
**Parent Context:** N/A

**Affected URLs (full list):**
- https://drupal-core.ddev.site/contact/textform

**Conditions:**
- `admin` (dark desktop, dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow, dark mobile, dark mobile-landscape, dark tablet)

#### HTML Snippet
```html
<div id="edit-date-disabled-0-value--label" class="is-disabled form-item__label">Date (disabled)</div>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/contact/textform
2. Use the matching context from Conditions: `admin` (dark desktop, dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow, dark mobile, dark mobile-landscape, dark tablet)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule color-contrast on selector #edit-date-disabled-N-value--label.

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20edit-date-disabled-N-value--label&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-2E4D3107
- Instance IDs: INS-1017B5C0, INS-75A9695C, INS-D0DC9E70, INS-7A99D9CA, INS-9E7690FB, INS-2AF8E90E, INS-4B2D4C9F, INS-13DA6ECC

### DRUPAL-A11Y-026—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-83F8AB83
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 8 of 1341 pages (1%)
**Selector:** #edit-datetime-disabled-N > legend > .fieldset__label.is-disabled
**XPath:** //*[@id="edit-datetime-disabled-0 > legend > .fieldset__label.is-disabled"]
**Parent Context:** N/A

**Affected URLs (full list):**
- https://drupal-core.ddev.site/contact/textform

**Conditions:**
- `admin` (dark desktop, dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow, dark mobile, dark mobile-landscape, dark tablet)

#### HTML Snippet
```html
<span class="is-disabled fieldset__label">Date and Time (disabled)</span>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/contact/textform
2. Use the matching context from Conditions: `admin` (dark desktop, dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow, dark mobile, dark mobile-landscape, dark tablet)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule color-contrast on selector #edit-datetime-disabled-N > legend > .fieldset__label.is-disabled.

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20edit-datetime-disabled-N&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-83F8AB83
- Instance IDs: INS-EB602501, INS-F431CE8A, INS-9286EC98, INS-F51F538E, INS-E9426898, INS-87B99184, INS-8CA3B929, INS-5F13DCCB

### DRUPAL-A11Y-027—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-4D02AC76
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 12 of 1341 pages (1%)
**Selector:** #edit-datetime-disabled-N--description
**XPath:** //*[@id="edit-datetime-disabled-0--description"]
**Parent Context:** N/A

**Affected URLs (full list):**
- https://drupal-core.ddev.site/contact/textform

**Conditions:**
- `admin` (dark desktop, dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow, dark mobile, dark mobile-landscape, dark tablet)

#### HTML Snippet
```html
<div id="edit-datetime-disabled-0--description" data-drupal-field-elements="description" class="is-disabled fieldset__description">Disabled 'date and Time' field description</div>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/contact/textform
2. Use the matching context from Conditions: `admin` (dark desktop, dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow, dark mobile, dark mobile-landscape, dark tablet)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule color-contrast on selector #edit-datetime-disabled-N--description.

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20edit-datetime-disabled-N--description&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-4D02AC76
- Instance IDs: INS-207E5EB8, INS-F21FBC1D, INS-76C084ED, INS-88D273CA, INS-99EBDADD, INS-7F162EDA, INS-C6C59829, INS-7FAD8950, INS-5E7B6047, INS-ED5E3C1D, INS-8268C78C, INS-C7C588A8

### DRUPAL-A11Y-028—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-E559EF47
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 8 of 1341 pages (1%)
**Selector:** #edit-daterange-disabled-N-end-value--label
**XPath:** //*[@id="edit-daterange-disabled-0-end-value--label"]
**Parent Context:** N/A

**Affected URLs (full list):**
- https://drupal-core.ddev.site/contact/textform

**Conditions:**
- `admin` (dark desktop, dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow, dark mobile, dark mobile-landscape, dark tablet)

#### HTML Snippet
```html
<div id="edit-daterange-disabled-0-end-value--label" class="is-disabled form-item__label">End date</div>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/contact/textform
2. Use the matching context from Conditions: `admin` (dark desktop, dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow, dark mobile, dark mobile-landscape, dark tablet)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule color-contrast on selector #edit-daterange-disabled-N-end-value--label.

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20edit-daterange-disabled-N-end-value--label&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-E559EF47
- Instance IDs: INS-C47CFE6B, INS-1209D3E5, INS-2677BEF2, INS-452EB680, INS-3EFE0339, INS-213586A2, INS-25523AC1, INS-C981CCC5

### DRUPAL-A11Y-029—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-4D55785C
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 4 of 1341 pages (0%)
**Selector:** #edit-daterange-ad-disabled-N > legend > .fieldset__label.is-disabled
**XPath:** //*[@id="edit-daterange-ad-disabled-0 > legend > .fieldset__label.is-disabled"]
**Parent Context:** N/A

**Affected URLs (full list):**
- https://drupal-core.ddev.site/contact/textform

**Conditions:**
- `admin` (dark desktop, dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow, dark mobile, dark mobile-landscape, dark tablet)

#### HTML Snippet
```html
<span class="is-disabled fieldset__label">Date range - all day (disabled)</span>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/contact/textform
2. Use the matching context from Conditions: `admin` (dark desktop, dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow, dark mobile, dark mobile-landscape, dark tablet)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule color-contrast on selector #edit-daterange-ad-disabled-N > legend > .fieldset__label.is-disabled.

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20edit-daterange-ad-disabled-N&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-4D55785C
- Instance IDs: INS-39823A47, INS-55CCADAE, INS-F0B4A620, INS-DA94CED4

### DRUPAL-A11Y-030—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-90FB867F
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 4 of 1341 pages (0%)
**Selector:** #edit-daterange-ad-disabled-N-value--label
**XPath:** //*[@id="edit-daterange-ad-disabled-0-value--label"]
**Parent Context:** N/A

**Affected URLs (full list):**
- https://drupal-core.ddev.site/contact/textform

**Conditions:**
- `admin` (dark desktop, dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow, dark mobile, dark mobile-landscape, dark tablet)

#### HTML Snippet
```html
<div id="edit-daterange-ad-disabled-0-value--label" class="is-disabled form-item__label">Start date</div>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/contact/textform
2. Use the matching context from Conditions: `admin` (dark desktop, dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow, dark mobile, dark mobile-landscape, dark tablet)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule color-contrast on selector #edit-daterange-ad-disabled-N-value--label.

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20edit-daterange-ad-disabled-N-value--label&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-90FB867F
- Instance IDs: INS-63FE25A5, INS-507EA512, INS-AF008E6F, INS-E7A5E995

### DRUPAL-A11Y-031—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-08EA9B05
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 4 of 1341 pages (0%)
**Selector:** #edit-daterange-ad-disabled-N--description
**XPath:** //*[@id="edit-daterange-ad-disabled-0--description"]
**Parent Context:** N/A

**Affected URLs (full list):**
- https://drupal-core.ddev.site/contact/textform

**Conditions:**
- `admin` (dark desktop, dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow, dark mobile, dark mobile-landscape, dark tablet)

#### HTML Snippet
```html
<div id="edit-daterange-ad-disabled-0--description" data-drupal-field-elements="description" class="is-disabled fieldset__description">Disabled 'date range - all day' field description</div>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/contact/textform
2. Use the matching context from Conditions: `admin` (dark desktop, dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow, dark mobile, dark mobile-landscape, dark tablet)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule color-contrast on selector #edit-daterange-ad-disabled-N--description.

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20edit-daterange-ad-disabled-N--description&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-08EA9B05
- Instance IDs: INS-EBFFDBCB, INS-CEA528AB, INS-13693F98, INS-58BDD7EA

### DRUPAL-A11Y-032—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-581297ED
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 4 of 1341 pages (0%)
**Selector:** #edit-color-disabled-N-value--description
**XPath:** //*[@id="edit-color-disabled-0-value--description"]
**Parent Context:** N/A

**Affected URLs (full list):**
- https://drupal-core.ddev.site/contact/textform

**Conditions:**
- `admin` (dark desktop, dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow, dark mobile, dark mobile-landscape, dark tablet)

#### HTML Snippet
```html
<div id="edit-color-disabled-0-value--description" class="is-disabled form-item__description">
      Disabled color field description
    </div>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/contact/textform
2. Use the matching context from Conditions: `admin` (dark desktop, dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow, dark mobile, dark mobile-landscape, dark tablet)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule color-contrast on selector #edit-color-disabled-N-value--description.

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20edit-color-disabled-N-value--description&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-581297ED
- Instance IDs: INS-845AAF83, INS-601967CB, INS-22E957C4, INS-6811A00B

### DRUPAL-A11Y-033—2026-07-05: target-size: Ensure touch targets have sufficient size and space

**Pattern ID:** DRU-5867174A
**Rule:** axe-core - target-size
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/target-size
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 2.5.8 - Target Size (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag258
**Frequency:** 41 of 1341 pages (3%)
**Selector:** tr[data-drupal-selector="edit-terms-tid10"] > .tabledrag-cell > .tabledrag-cell-content.js-tabledrag-cell-content > .tabledrag-cell-content__item > .tabledrag-handle[href="#"][title="Move in any direction"]
**XPath:** //tr[@data-drupal-selector="edit-terms-tid10"]
**Parent Context:** N/A

**Affected URLs (full list):**
- https://drupal-core.ddev.site/tabledrag

**Conditions:**
- `admin` (dark desktop, dark mobile, dark mobile-landscape, dark tablet, light desktop, light mobile, light mobile-landscape, light tablet)

#### HTML Snippet
```html
<a href="#" title="Move in any direction" class="tabledrag-handle"><div class="handle"></div></a>
```

#### Description
Fix any of the following:
  Target has insufficient size (33px by 20px, should be at least 24px by 24px)
  Target has insufficient space to its closest neighbors. Safe clickable space has a diameter of 6.4px instead of at least 24px.

#### Steps to Reproduce
1. This issue may require interaction state (typing/dragging/focus) to expose the failing element.
2. Go to https://drupal-core.ddev.site/tabledrag
3. Use the matching context from Conditions: `admin` (dark desktop, dark mobile, dark mobile-landscape, dark tablet, light desktop, light mobile, light mobile-landscape, light tablet)
4. Open browser DevTools and run axe.run() in the Console.
5. Confirm rule target-size on selector tr[data-drupal-selector="edit-terms-tid10"] > .tabledrag-cell > .tabledrag-cell-content.js-tabledrag-cell-content > .tabledrag-cell-content__item > .tabledrag-handle[href="#"][title="Move in any direction"].

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Target has insufficient size (33px by 20px, should be at least 24px by 24px)
  Target has insufficient space to its closest neighbors. Safe clickable space has a diameter of 6.4px instead of at least 24px.

#### Impact
motor, low-vision

#### Suggested Fix
Ensure interactive elements have a minimum 24×24px clickable area via padding or min-height/min-width in CSS.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/target-size
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- WCAG 2.2 - Target Size (Minimum): https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=target-size%20tabledrag-cell&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-5867174A
- Instance IDs: INS-5EA78166, INS-6661B13A, INS-E3BB0789, INS-CABE351F, INS-CB7A867F, INS-5303CF1E, INS-256A1DCD, INS-A85FEA1C, INS-9DE07E17, INS-4BF19DC3, INS-675340D9, INS-8B385950, INS-37A1465E, INS-DBAD0C17, INS-C3FD05EC, INS-75DE19A1, INS-4AAAE68C, INS-08F6917E, INS-5EE3416E, INS-31BA23CE, INS-C3897292, INS-26E6A9F6, INS-DA5438E5, INS-C7BDAF7E, INS-2A4BAF67, INS-806C2D17, INS-9DB78225, INS-BDCD5A4F, INS-CF90C839, INS-2BDB5009, INS-824CC67E, INS-53F5A2B3, INS-118F6D40, INS-9AF09B72, INS-6DDE1DAB, INS-35EE5F38, INS-8DA8635A, INS-446E4C9F, INS-18702AC0, INS-389F5609, INS-82F651E4

### DRUPAL-A11Y-034—2026-07-05: target-size: Ensure touch targets have sufficient size and space

**Pattern ID:** DRU-33BE632E
**Rule:** axe-core - target-size
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/target-size
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 2.5.8 - Target Size (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag258
**Frequency:** 38 of 1341 pages (3%)
**Selector:** #edit-terms-tid10-term
**XPath:** //*[@id="edit-terms-tid10-term"]
**Parent Context:** N/A

**Affected URLs (full list):**
- https://drupal-core.ddev.site/tabledrag

**Conditions:**
- `admin` (dark desktop, dark mobile, dark mobile-landscape, dark tablet, light desktop, light mobile, light mobile-landscape, light tablet)

#### HTML Snippet
```html
<a href="/taxonomy/term/1" data-drupal-selector="edit-terms-tid10-term" id="edit-terms-tid10-term" hreflang="en" class="menu-item__link">Abigo</a>
```

#### Description
Fix any of the following:
  Target has insufficient size (43.8px by 20px, should be at least 24px by 24px)
  Target has insufficient space to its closest neighbors. Safe clickable space has a diameter of 9.2px instead of at least 24px.

#### Steps to Reproduce
1. This issue may require interaction state (typing/dragging/focus) to expose the failing element.
2. Go to https://drupal-core.ddev.site/tabledrag
3. Use the matching context from Conditions: `admin` (dark desktop, dark mobile, dark mobile-landscape, dark tablet, light desktop, light mobile, light mobile-landscape, light tablet)
4. Open browser DevTools and run axe.run() in the Console.
5. Confirm rule target-size on selector #edit-terms-tid10-term.

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Target has insufficient size (43.8px by 20px, should be at least 24px by 24px)
  Target has insufficient space to its closest neighbors. Safe clickable space has a diameter of 9.2px instead of at least 24px.

#### Impact
motor, low-vision

#### Suggested Fix
Ensure interactive elements have a minimum 24×24px clickable area via padding or min-height/min-width in CSS.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/target-size
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- WCAG 2.2 - Target Size (Minimum): https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=target-size%20edit-terms-tid10-term&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-33BE632E
- Instance IDs: INS-0121A853, INS-BBF155EA, INS-ED4D799D, INS-8AD67582, INS-EF5572E4, INS-7FBA5663, INS-31C28646, INS-341ADCB1, INS-FE5445DB, INS-6DFD6F52, INS-6C9642BC, INS-A618F725, INS-18EB4A26, INS-C259D101, INS-A649312F, INS-00B24FE4, INS-36D2EA26, INS-94D6A7D0, INS-1780F0FF, INS-0A7B7C4F, INS-3D208FF7, INS-ADE19778, INS-55D3D92D, INS-0EA0F2E0, INS-76193C5B, INS-75EB2489, INS-2C7866F0, INS-3DC5CFBD, INS-EB6C0606, INS-3B8B3D61, INS-9135D088, INS-87085798, INS-392F4187, INS-91852888, INS-C0ED3656, INS-E4697A0E, INS-CEAF3BD5, INS-6F7D6151

### DRUPAL-A11Y-035—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-EE5E2CD9
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 3 of 1341 pages (0%)
**Selector:** .toolbar-button--icon--system-admin-config > .toolbar-button__label[data-toolbar-text=""]
**XPath:** //*[contains(@class,"toolbar-button--icon--system-admin-config > .toolbar-button__label[data-toolbar-text=""]")]
**Parent Context:** N/A
**Likely Template:** toolbar (admin theme)
**Template Hint:** Admin toolbar
**Drupal File:** See likely_template above

**Affected URLs (full list):**
- https://drupal-core.ddev.site/admin/config
- /admin/config/content/formats
- /admin/config/system/site-information

**Conditions:**
- `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)

#### HTML Snippet
```html
<span class="toolbar-button__label" data-toolbar-text="">Configuration</span>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 1.39 (foreground color: #1f242d, background color: #3b3b3f, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/admin/config
2. Use the matching context from Conditions: `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule color-contrast on selector .toolbar-button--icon--system-admin-config > .toolbar-button__label[data-toolbar-text=""].

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 1.39 (foreground color: #1f242d, background color: #3b3b3f, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20toolbar%20(admin%20theme)%20toolbar-button--icon--system-admin-config&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-EE5E2CD9
- Instance IDs: INS-F1B9C2A1, INS-C1D87390, INS-3DFA8277

### DRUPAL-A11Y-036—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-C173AC22
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 4 of 1341 pages (0%)
**Selector:** .toolbar-button--icon--navigation-create > .toolbar-button__label[data-toolbar-text=""]
**XPath:** //*[contains(@class,"toolbar-button--icon--navigation-create > .toolbar-button__label[data-toolbar-text=""]")]
**Parent Context:** N/A
**Likely Template:** toolbar (admin theme)
**Template Hint:** Admin toolbar
**Drupal File:** See likely_template above

**Affected URLs (full list):**
- https://drupal-core.ddev.site/node/add/article
- /node/add/cd
- /node/add/page

**Conditions:**
- `admin` (dark desktop, dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)

#### HTML Snippet
```html
<span class="toolbar-button__label" data-toolbar-text="">Create</span>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 1.39 (foreground color: #1f242d, background color: #3b3b3f, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/node/add/article
2. Use the matching context from Conditions: `admin` (dark desktop, dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule color-contrast on selector .toolbar-button--icon--navigation-create > .toolbar-button__label[data-toolbar-text=""].

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 1.39 (foreground color: #1f242d, background color: #3b3b3f, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20toolbar%20(admin%20theme)%20toolbar-button--icon--navigation-create&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-C173AC22
- Instance IDs: INS-0B689871, INS-A779AB7D, INS-D302E18A, INS-339EAFE5

### DRUPAL-A11Y-037—2026-07-05: link-in-text-block: Ensure links are distinguished from surrounding text in a way that does not rely

**Pattern ID:** DRU-D377125E
**Rule:** axe-core - link-in-text-block
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/link-in-text-block
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.1 - Use of Color (Level A)
**Suggested drupal.org issue tags:** Accessibility, wcag141
**Frequency:** 2 of 1341 pages (0%)
**Selector:** #edit-imagefile-file-limited-dis-N > .form-managed-file__main > .file.file--mime-text-plain.file--text > .menu-item__link[type="text/plain"]
**XPath:** //*[@id="edit-imagefile-file-limited-dis-1 > .form-managed-file__main > .file.file--mime-text-plain.file--text > .menu-item__link[type="text/plain"]"]
**Parent Context:** N/A
**Likely Template:** menu.html.twig
**Template Hint:** Menu template
**Drupal File:** See likely_template above

**Affected URLs (full list):**
- https://drupal-core.ddev.site/contact/imagefile_file

**Conditions:**
- `admin` (light mobile-landscape, light tablet)

#### HTML Snippet
```html
<a href="/sites/default/files/README.txt" type="text/plain" class="menu-item__link">README.txt</a>
```

#### Description
Fix any of the following:
  The link has insufficient color contrast of 2.88:1 with the surrounding text. (Minimum contrast is 3:1, link text: #0e7772, surrounding text: #222330)
  The link has no styling (such as underline) to distinguish it from the surrounding text

#### Steps to Reproduce
1. This issue may require expanding or activating interactive UI elements before running axe.
2. Go to https://drupal-core.ddev.site/contact/imagefile_file
3. Use the matching context from Conditions: `admin` (light mobile-landscape, light tablet)
4. Open browser DevTools and run axe.run() in the Console.
5. Confirm rule link-in-text-block on selector #edit-imagefile-file-limited-dis-N > .form-managed-file__main > .file.file--mime-text-plain.file--text > .menu-item__link[type="text/plain"].

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  The link has insufficient color contrast of 2.88:1 with the surrounding text. (Minimum contrast is 3:1, link text: #0e7772, surrounding text: #222330)
  The link has no styling (such as underline) to distinguish it from the surrounding text

#### Impact
users with disabilities

#### Suggested Fix
See axe documentation.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/link-in-text-block
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=link-in-text-block%20menu.html.twig%20edit-imagefile-file-limited-dis-N&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-D377125E
- Instance IDs: INS-451C3738, INS-4E969BBC

### DRUPAL-A11Y-038—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-4A814D8B
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 1 of 1341 pages (0%)
**Selector:** .toolbar-button--icon--system-themes-page > .toolbar-button__label[data-toolbar-text=""]
**XPath:** //*[contains(@class,"toolbar-button--icon--system-themes-page > .toolbar-button__label[data-toolbar-text=""]")]
**Parent Context:** N/A
**Likely Template:** toolbar (admin theme)
**Template Hint:** Admin toolbar
**Drupal File:** See likely_template above

**Affected URLs (full list):**
- https://drupal-core.ddev.site/admin/appearance

**Conditions:**
- `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)

#### HTML Snippet
```html
<span class="toolbar-button__label" data-toolbar-text="">Appearance</span>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 1.29 (foreground color: #002566, background color: #3b3b3f, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/admin/appearance
2. Use the matching context from Conditions: `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule color-contrast on selector .toolbar-button--icon--system-themes-page > .toolbar-button__label[data-toolbar-text=""].

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 1.29 (foreground color: #002566, background color: #3b3b3f, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20toolbar%20(admin%20theme)%20toolbar-button--icon--system-themes-page&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-4A814D8B
- Instance IDs: INS-B8136ED2

### DRUPAL-A11Y-039—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-AFF8AF72
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 1 of 1341 pages (0%)
**Selector:** #edit-actions-submit
**XPath:** //*[@id="edit-actions-submit"]
**Parent Context:** N/A

**Affected URLs (full list):**
- https://drupal-core.ddev.site/admin/config/content/formats/manage/restricted_html

**Conditions:**
- `admin` (light desktop accent:yellow)

#### HTML Snippet
```html
<input data-drupal-selector="edit-actions-submit" type="submit" id="edit-actions-submit" name="op" value="Save configuration" class="button button--primary js-form-submit form-submit">
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 3.81 (foreground color: #111111, background color: #966705, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/admin/config/content/formats/manage/restricted_html
2. Use the matching context from Conditions: `admin` (light desktop accent:yellow)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule color-contrast on selector #edit-actions-submit.

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 3.81 (foreground color: #111111, background color: #966705, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20edit-actions-submit&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-AFF8AF72
- Instance IDs: INS-BC44916A

### DRUPAL-A11Y-040—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-5C776A57
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 1 of 1341 pages (0%)
**Selector:** .toolbar-button--icon--form-style-form > .toolbar-button__label[data-toolbar-text=""]
**XPath:** //*[contains(@class,"toolbar-button--icon--form-style-form > .toolbar-button__label[data-toolbar-text=""]")]
**Parent Context:** N/A
**Likely Template:** toolbar (admin theme)
**Template Hint:** Admin toolbar
**Drupal File:** See likely_template above

**Affected URLs (full list):**
- https://drupal-core.ddev.site/admin/form_style

**Conditions:**
- `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)

#### HTML Snippet
```html
<span class="toolbar-button__label" data-toolbar-text="">Form Style</span>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 1.29 (foreground color: #002566, background color: #3b3b3f, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/admin/form_style
2. Use the matching context from Conditions: `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule color-contrast on selector .toolbar-button--icon--form-style-form > .toolbar-button__label[data-toolbar-text=""].

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 1.29 (foreground color: #002566, background color: #3b3b3f, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20toolbar%20(admin%20theme)%20toolbar-button--icon--form-style-form&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-5C776A57
- Instance IDs: INS-F201A5C3

### DRUPAL-A11Y-041—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-593DE53E
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 1 of 1341 pages (0%)
**Selector:** .toolbar-button--icon--system-modules-list > .toolbar-button__label[data-toolbar-text=""]
**XPath:** //*[contains(@class,"toolbar-button--icon--system-modules-list > .toolbar-button__label[data-toolbar-text=""]")]
**Parent Context:** N/A
**Likely Template:** toolbar (admin theme)
**Template Hint:** Admin toolbar
**Drupal File:** See likely_template above

**Affected URLs (full list):**
- https://drupal-core.ddev.site/admin/modules

**Conditions:**
- `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)

#### HTML Snippet
```html
<span class="toolbar-button__label" data-toolbar-text="">Extend</span>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 1.29 (foreground color: #002566, background color: #3b3b3f, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/admin/modules
2. Use the matching context from Conditions: `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule color-contrast on selector .toolbar-button--icon--system-modules-list > .toolbar-button__label[data-toolbar-text=""].

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 1.29 (foreground color: #002566, background color: #3b3b3f, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20toolbar%20(admin%20theme)%20toolbar-button--icon--system-modules-list&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-593DE53E
- Instance IDs: INS-8B00DF90

### DRUPAL-A11Y-042—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-F30C5DE6
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 1 of 1341 pages (0%)
**Selector:** .toolbar-button--icon--entity-user-collection > .toolbar-button__label[data-toolbar-text=""]
**XPath:** //*[contains(@class,"toolbar-button--icon--entity-user-collection > .toolbar-button__label[data-toolbar-text=""]")]
**Parent Context:** N/A
**Likely Template:** toolbar (admin theme)
**Template Hint:** Admin toolbar
**Drupal File:** See likely_template above

**Affected URLs (full list):**
- https://drupal-core.ddev.site/admin/people

**Conditions:**
- `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)

#### HTML Snippet
```html
<span class="toolbar-button__label" data-toolbar-text="">People</span>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 1.29 (foreground color: #002566, background color: #3b3b3f, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/admin/people
2. Use the matching context from Conditions: `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule color-contrast on selector .toolbar-button--icon--entity-user-collection > .toolbar-button__label[data-toolbar-text=""].

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 1.29 (foreground color: #002566, background color: #3b3b3f, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20toolbar%20(admin%20theme)%20toolbar-button--icon--entity-user-collection&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-F30C5DE6
- Instance IDs: INS-EFE0CA03

### DRUPAL-A11Y-043—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-8A39EE9E
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 1 of 1341 pages (0%)
**Selector:** .toolbar-button--icon--system-admin-reports > .toolbar-button__label[data-toolbar-text=""]
**XPath:** //*[contains(@class,"toolbar-button--icon--system-admin-reports > .toolbar-button__label[data-toolbar-text=""]")]
**Parent Context:** N/A
**Likely Template:** toolbar (admin theme)
**Template Hint:** Admin toolbar
**Drupal File:** See likely_template above

**Affected URLs (full list):**
- https://drupal-core.ddev.site/admin/reports

**Conditions:**
- `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)

#### HTML Snippet
```html
<span class="toolbar-button__label" data-toolbar-text="">Reports</span>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 1.39 (foreground color: #1f242d, background color: #3b3b3f, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/admin/reports
2. Use the matching context from Conditions: `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule color-contrast on selector .toolbar-button--icon--system-admin-reports > .toolbar-button__label[data-toolbar-text=""].

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 1.39 (foreground color: #1f242d, background color: #3b3b3f, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20toolbar%20(admin%20theme)%20toolbar-button--icon--system-admin-reports&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-8A39EE9E
- Instance IDs: INS-BB1C1DBE

### DRUPAL-A11Y-044—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-83A30AC0
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 1 of 1341 pages (0%)
**Selector:** #edit-save-continue
**XPath:** //*[@id="edit-save-continue"]
**Parent Context:** N/A

**Affected URLs (full list):**
- https://drupal-core.ddev.site/admin/structure/types/add

**Conditions:**
- `admin` (light desktop accent:yellow)

#### HTML Snippet
```html
<input data-drupal-selector="edit-save-continue" type="submit" id="edit-save-continue" name="op" value="Save and manage fields" class="button button--primary js-form-submit form-submit">
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 3.81 (foreground color: #111111, background color: #966705, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/admin/structure/types/add
2. Use the matching context from Conditions: `admin` (light desktop accent:yellow)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule color-contrast on selector #edit-save-continue.

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 3.81 (foreground color: #111111, background color: #966705, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20edit-save-continue&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-83A30AC0
- Instance IDs: INS-FDE3BFF7

### DRUPAL-A11Y-045—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-5F4C262C
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 1 of 1341 pages (0%)
**Selector:** summary[aria-controls="edit-submission"] > .gin-details__summary-summary
**XPath:** //summary[@aria-controls="edit-submission"]
**Parent Context:** N/A

**Affected URLs (full list):**
- https://drupal-core.ddev.site/admin/structure/types/add

**Conditions:**
- `admin` (light mobile)

#### HTML Snippet
```html
<span class="gin-details__summary-summary">Title</span>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 4.44 (foreground color: #767780, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/admin/structure/types/add
2. Use the matching context from Conditions: `admin` (light mobile)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule color-contrast on selector summary[aria-controls="edit-submission"] > .gin-details__summary-summary.

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 4.44 (foreground color: #767780, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20gin-details__summary-summary&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-5F4C262C
- Instance IDs: INS-3BAA4A64

### DRUPAL-A11Y-046—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-39203797
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 1 of 1341 pages (0%)
**Selector:** summary[aria-controls="edit-workflow"] > .gin-details__summary-summary
**XPath:** //summary[@aria-controls="edit-workflow"]
**Parent Context:** N/A

**Affected URLs (full list):**
- https://drupal-core.ddev.site/admin/structure/types/add

**Conditions:**
- `admin` (light mobile)

#### HTML Snippet
```html
<span class="gin-details__summary-summary">Published, Create new revision</span>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 4.44 (foreground color: #767780, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/admin/structure/types/add
2. Use the matching context from Conditions: `admin` (light mobile)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule color-contrast on selector summary[aria-controls="edit-workflow"] > .gin-details__summary-summary.

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 4.44 (foreground color: #767780, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20gin-details__summary-summary&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-39203797
- Instance IDs: INS-F21DC83A

### DRUPAL-A11Y-047—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-2E1DDC9D
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 1 of 1341 pages (0%)
**Selector:** summary[aria-controls="edit-language"] > .gin-details__summary-summary
**XPath:** //summary[@aria-controls="edit-language"]
**Parent Context:** N/A

**Affected URLs (full list):**
- https://drupal-core.ddev.site/admin/structure/types/add

**Conditions:**
- `admin` (light mobile)

#### HTML Snippet
```html
<span class="gin-details__summary-summary">Site's default language (English)</span>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 4.44 (foreground color: #767780, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/admin/structure/types/add
2. Use the matching context from Conditions: `admin` (light mobile)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule color-contrast on selector summary[aria-controls="edit-language"] > .gin-details__summary-summary.

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 4.44 (foreground color: #767780, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20gin-details__summary-summary&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-2E1DDC9D
- Instance IDs: INS-90B50CDE

### DRUPAL-A11Y-048—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-92165602
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 1 of 1341 pages (0%)
**Selector:** summary[aria-controls="edit-display"] > .gin-details__summary-summary
**XPath:** //summary[@aria-controls="edit-display"]
**Parent Context:** N/A

**Affected URLs (full list):**
- https://drupal-core.ddev.site/admin/structure/types/add

**Conditions:**
- `admin` (light mobile)

#### HTML Snippet
```html
<span class="gin-details__summary-summary">Display author and date information</span>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 4.44 (foreground color: #767780, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/admin/structure/types/add
2. Use the matching context from Conditions: `admin` (light mobile)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule color-contrast on selector summary[aria-controls="edit-display"] > .gin-details__summary-summary.

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 4.44 (foreground color: #767780, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20gin-details__summary-summary&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-92165602
- Instance IDs: INS-F7856501

### DRUPAL-A11Y-049—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-DA7603D7
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 2 of 1341 pages (0%)
**Selector:** #edit-danger--N
**XPath:** //*[@id="edit-danger--2"]
**Parent Context:** N/A

**Affected URLs (full list):**
- https://drupal-core.ddev.site/buttons

**Conditions:**
- `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)

#### HTML Snippet
```html
<input class="button--small button button--danger js-form-submit form-submit" data-drupal-selector="edit-danger" type="submit" id="edit-danger--2" name="op" value="Danger">
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 3.72 (foreground color: #ce6060, background color: #2a2a2d, font size: 9.0pt (12px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/buttons
2. Use the matching context from Conditions: `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule color-contrast on selector #edit-danger--N.

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 3.72 (foreground color: #ce6060, background color: #2a2a2d, font size: 9.0pt (12px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20edit-danger--N&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-DA7603D7
- Instance IDs: INS-7DC70FE7, INS-92F03543

### DRUPAL-A11Y-050—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-C309868C
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 1 of 1341 pages (0%)
**Selector:** #edit-checkbox-hidden-label-disabled-value--description
**XPath:** //*[@id="edit-checkbox-hidden-label-disabled-value--description"]
**Parent Context:** N/A

**Affected URLs (full list):**
- https://drupal-core.ddev.site/contact/checkbox_radio

**Conditions:**
- `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)

#### HTML Snippet
```html
<div id="edit-checkbox-hidden-label-disabled-value--description" class="is-disabled form-item__description">
      Description
    </div>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/contact/checkbox_radio
2. Use the matching context from Conditions: `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule color-contrast on selector #edit-checkbox-hidden-label-disabled-value--description.

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20edit-checkbox-hidden-label-disabled-value--description&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-C309868C
- Instance IDs: INS-AD06E5EC

### DRUPAL-A11Y-051—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-F4FDF091
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 1 of 1341 pages (0%)
**Selector:** #edit-checkbox-disabled-value--description
**XPath:** //*[@id="edit-checkbox-disabled-value--description"]
**Parent Context:** N/A

**Affected URLs (full list):**
- https://drupal-core.ddev.site/contact/checkbox_radio

**Conditions:**
- `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)

#### HTML Snippet
```html
<div id="edit-checkbox-disabled-value--description" class="is-disabled form-item__description">
      Disabled single checkbox description
    </div>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/contact/checkbox_radio
2. Use the matching context from Conditions: `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule color-contrast on selector #edit-checkbox-disabled-value--description.

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20edit-checkbox-disabled-value--description&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-F4FDF091
- Instance IDs: INS-7F2CFEDA

### DRUPAL-A11Y-052—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-21AECF5A
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 2 of 1341 pages (0%)
**Selector:** #edit-multitext-unlimited-disabled--description
**XPath:** //*[@id="edit-multitext-unlimited-disabled--description"]
**Parent Context:** N/A

**Affected URLs (full list):**
- https://drupal-core.ddev.site/contact/field_cardinality_test

**Conditions:**
- `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)

#### HTML Snippet
```html
<div id="edit-multitext-unlimited-disabled--description" class="form-item__description is-disabled">Help text for disabled 'Multiple, unlimited text'.</div>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/contact/field_cardinality_test
2. Use the matching context from Conditions: `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule color-contrast on selector #edit-multitext-unlimited-disabled--description.

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20edit-multitext-unlimited-disabled--description&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-21AECF5A
- Instance IDs: INS-52216A4F, INS-304F7A3A

### DRUPAL-A11Y-053—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-8A9D517F
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 2 of 1341 pages (0%)
**Selector:** #edit-multitext-unlimited-required-dis--description
**XPath:** //*[@id="edit-multitext-unlimited-required-dis--description"]
**Parent Context:** N/A

**Affected URLs (full list):**
- https://drupal-core.ddev.site/contact/field_cardinality_test

**Conditions:**
- `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)

#### HTML Snippet
```html
<div id="edit-multitext-unlimited-required-dis--description" class="form-item__description is-disabled">Help text for disabled 'Multiple, unlimited text' with a single default (preexisting) value.</div>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/contact/field_cardinality_test
2. Use the matching context from Conditions: `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule color-contrast on selector #edit-multitext-unlimited-required-dis--description.

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20edit-multitext-unlimited-required-dis--description&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-8A9D517F
- Instance IDs: INS-4B69812A, INS-0071DD6E

### DRUPAL-A11Y-054—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-0460FE2F
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 6 of 1341 pages (0%)
**Selector:** #edit-imagefile-file-dis-N--description
**XPath:** //*[@id="edit-imagefile-file-dis-0--description"]
**Parent Context:** N/A

**Affected URLs (full list):**
- https://drupal-core.ddev.site/contact/imagefile_file

**Conditions:**
- `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)

#### HTML Snippet
```html
<div id="edit-imagefile-file-dis-0--description" class="is-disabled form-item__description">
      Description for the <em>File (disabled)</em> field.<br>One file only.<br>500 bytes limit.<br>Allowed types: txt.

    </div>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/contact/imagefile_file
2. Use the matching context from Conditions: `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule color-contrast on selector #edit-imagefile-file-dis-N--description.

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20edit-imagefile-file-dis-N--description&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-0460FE2F
- Instance IDs: INS-83046A5E, INS-781AAF83, INS-E5115C38, INS-F5CCEC76, INS-6BFFEB30, INS-5F57CDB9

### DRUPAL-A11Y-055—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-B1649AF3
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 3 of 1341 pages (0%)
**Selector:** #edit-imagefile-file-req-N > .form-managed-file__main > .file.file--mime-text-plain.file--text > .file__size
**XPath:** //*[@id="edit-imagefile-file-req-0 > .form-managed-file__main > .file.file--mime-text-plain.file--text > .file__size"]
**Parent Context:** N/A

**Affected URLs (full list):**
- https://drupal-core.ddev.site/contact/imagefile_file

**Conditions:**
- `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)

#### HTML Snippet
```html
<span class="file__size">(399 bytes)</span>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/contact/imagefile_file
2. Use the matching context from Conditions: `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule color-contrast on selector #edit-imagefile-file-req-N > .form-managed-file__main > .file.file--mime-text-plain.file--text > .file__size.

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20edit-imagefile-file-req-N&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-B1649AF3
- Instance IDs: INS-74894675, INS-774C7035, INS-6F6FA2BB

### DRUPAL-A11Y-056—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-313AC57D
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 1 of 1341 pages (0%)
**Selector:** #edit-imagefile-file-req-dis-N-description--description
**XPath:** //*[@id="edit-imagefile-file-req-dis-0-description--description"]
**Parent Context:** N/A

**Affected URLs (full list):**
- https://drupal-core.ddev.site/contact/imagefile_file

**Conditions:**
- `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)

#### HTML Snippet
```html
<div id="edit-imagefile-file-req-dis-0-description--description" class="is-disabled form-item__description">
      The description may be used as the label of the link to the file.
    </div>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/contact/imagefile_file
2. Use the matching context from Conditions: `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule color-contrast on selector #edit-imagefile-file-req-dis-N-description--description.

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20edit-imagefile-file-req-dis-N-description--description&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-313AC57D
- Instance IDs: INS-EB57BAEF

### DRUPAL-A11Y-057—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-CD3435B9
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 4 of 1341 pages (0%)
**Selector:** #edit-imagefile-file-req-dis-N--description > em
**XPath:** //*[@id="edit-imagefile-file-req-dis-0--description > em"]
**Parent Context:** N/A

**Affected URLs (full list):**
- https://drupal-core.ddev.site/contact/imagefile_file

**Conditions:**
- `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)

#### HTML Snippet
```html
<em>File with a value (required)</em>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/contact/imagefile_file
2. Use the matching context from Conditions: `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule color-contrast on selector #edit-imagefile-file-req-dis-N--description > em.

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20edit-imagefile-file-req-dis-N--description&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-CD3435B9
- Instance IDs: INS-A7F55A99, INS-B8203DA3, INS-C36861CB, INS-F0AFA040

### DRUPAL-A11Y-058—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-B863238B
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 1 of 1341 pages (0%)
**Selector:** #edit-imagefile-file-plain-dis-N > .form-managed-file__main > .file.file--mime-text-plain.file--text > .file__size
**XPath:** //*[@id="edit-imagefile-file-plain-dis-0 > .form-managed-file__main > .file.file--mime-text-plain.file--text > .file__size"]
**Parent Context:** N/A

**Affected URLs (full list):**
- https://drupal-core.ddev.site/contact/imagefile_file

**Conditions:**
- `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)

#### HTML Snippet
```html
<span class="file__size">(399 bytes)</span>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/contact/imagefile_file
2. Use the matching context from Conditions: `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule color-contrast on selector #edit-imagefile-file-plain-dis-N > .form-managed-file__main > .file.file--mime-text-plain.file--text > .file__size.

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20edit-imagefile-file-plain-dis-N&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-B863238B
- Instance IDs: INS-19CD0F8F

### DRUPAL-A11Y-059—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-9A5E66BD
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 4 of 1341 pages (0%)
**Selector:** #edit-imagefile-file-multi-dis > .gin-details__wrapper.details-wrapper > .gin-details__description.is-disabled
**XPath:** //*[@id="edit-imagefile-file-multi-dis > .gin-details__wrapper.details-wrapper > .gin-details__description.is-disabled"]
**Parent Context:** N/A

**Affected URLs (full list):**
- https://drupal-core.ddev.site/contact/imagefile_file

**Conditions:**
- `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)

#### HTML Snippet
```html
<div class="gin-details__description is-disabled">Description for the <em>Unlimited file (disabled)</em> field.<br> Display and description properties are disabled.</div>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/contact/imagefile_file
2. Use the matching context from Conditions: `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule color-contrast on selector #edit-imagefile-file-multi-dis > .gin-details__wrapper.details-wrapper > .gin-details__description.is-disabled.

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20edit-imagefile-file-multi-dis&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-9A5E66BD
- Instance IDs: INS-CB97C3FA, INS-BEB161C4, INS-67421360, INS-C9078B1D

### DRUPAL-A11Y-060—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-232E0E39
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 2 of 1341 pages (0%)
**Selector:** #edit-imagefile-file-limited-dis > .gin-details__wrapper.details-wrapper > .gin-details__description.is-disabled > em
**XPath:** //*[@id="edit-imagefile-file-limited-dis > .gin-details__wrapper.details-wrapper > .gin-details__description.is-disabled > em"]
**Parent Context:** N/A

**Affected URLs (full list):**
- https://drupal-core.ddev.site/contact/imagefile_file

**Conditions:**
- `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)

#### HTML Snippet
```html
<em>Limited files with a single pre-existing value (required, disabled)</em>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/contact/imagefile_file
2. Use the matching context from Conditions: `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule color-contrast on selector #edit-imagefile-file-limited-dis > .gin-details__wrapper.details-wrapper > .gin-details__description.is-disabled > em.

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20edit-imagefile-file-limited-dis&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-232E0E39
- Instance IDs: INS-9E662893, INS-C1102271

### DRUPAL-A11Y-061—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-D6DB45E2
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 1 of 1341 pages (0%)
**Selector:** #edit-imagefile-file-limited-dis-N > .form-managed-file__main > .file.file--mime-text-plain.file--text > .menu-item__link[type="text/plain"]
**XPath:** //*[@id="edit-imagefile-file-limited-dis-0 > .form-managed-file__main > .file.file--mime-text-plain.file--text > .menu-item__link[type="text/plain"]"]
**Parent Context:** N/A
**Likely Template:** menu.html.twig
**Template Hint:** Menu template
**Drupal File:** See likely_template above

**Affected URLs (full list):**
- https://drupal-core.ddev.site/contact/imagefile_file

**Conditions:**
- `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)

#### HTML Snippet
```html
<a href="/sites/default/files/CHANGELOG.txt" type="text/plain" class="menu-item__link">CHANGELOG.txt</a>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 1.52 (foreground color: #ffbbff, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. This issue may require expanding or activating interactive UI elements before running axe.
2. Go to https://drupal-core.ddev.site/contact/imagefile_file
3. Use the matching context from Conditions: `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)
4. Open browser DevTools and run axe.run() in the Console.
5. Confirm rule color-contrast on selector #edit-imagefile-file-limited-dis-N > .form-managed-file__main > .file.file--mime-text-plain.file--text > .menu-item__link[type="text/plain"].

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 1.52 (foreground color: #ffbbff, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20menu.html.twig%20edit-imagefile-file-limited-dis-N&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-D6DB45E2
- Instance IDs: INS-8B030A1D

### DRUPAL-A11Y-062—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-F92CBCC7
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 2 of 1341 pages (0%)
**Selector:** .js-form-item-imagefile-image-req-N > .is-single.has-meta.no-upload > .form-managed-file__main > .file.file--mime-image-png.file--image > .file__size
**XPath:** //*[contains(@class,"js-form-item-imagefile-image-req-0 > .is-single.has-meta.no-upload > .form-managed-file__main > .file.file--mime-image-png.file--image > .file__size")]
**Parent Context:** N/A
**Likely Template:** form-element.html.twig
**Template Hint:** Form element template
**Drupal File:** See likely_template above

**Affected URLs (full list):**
- https://drupal-core.ddev.site/contact/imagefile_image

**Conditions:**
- `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)

#### HTML Snippet
```html
<span class="file__size">(40.68 KB)</span>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/contact/imagefile_image
2. Use the matching context from Conditions: `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule color-contrast on selector .js-form-item-imagefile-image-req-N > .is-single.has-meta.no-upload > .form-managed-file__main > .file.file--mime-image-png.file--image > .file__size.

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20form-element.html.twig%20js-form-item-imagefile-image-req-N&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-F92CBCC7
- Instance IDs: INS-BF0B27CE, INS-C2446ADB

### DRUPAL-A11Y-063—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-6C4DFB1F
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 3 of 1341 pages (0%)
**Selector:** #edit-imagefile-image-req-dis-N-alt--description
**XPath:** //*[@id="edit-imagefile-image-req-dis-0-alt--description"]
**Parent Context:** N/A

**Affected URLs (full list):**
- https://drupal-core.ddev.site/contact/imagefile_image

**Conditions:**
- `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)

#### HTML Snippet
```html
<div id="edit-imagefile-image-req-dis-0-alt--description" class="is-disabled form-item__description">
      Short description of the image used by screen readers and displayed when the image is not loaded. This is important for accessibility.
    </div>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/contact/imagefile_image
2. Use the matching context from Conditions: `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule color-contrast on selector #edit-imagefile-image-req-dis-N-alt--description.

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20edit-imagefile-image-req-dis-N-alt--description&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-6C4DFB1F
- Instance IDs: INS-6400455A, INS-9BB4EC56, INS-DA50C430

### DRUPAL-A11Y-064—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-5E5C0D86
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 2 of 1341 pages (0%)
**Selector:** .js-form-item-imagefile-image-plain-N > .is-single.no-upload.has-value > .form-managed-file__main > .file.file--mime-image-png.file--image > .file__size
**XPath:** //*[contains(@class,"js-form-item-imagefile-image-plain-0 > .is-single.no-upload.has-value > .form-managed-file__main > .file.file--mime-image-png.file--image > .file__size")]
**Parent Context:** N/A
**Likely Template:** form-element.html.twig
**Template Hint:** Form element template
**Drupal File:** See likely_template above

**Affected URLs (full list):**
- https://drupal-core.ddev.site/contact/imagefile_image

**Conditions:**
- `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)

#### HTML Snippet
```html
<span class="file__size">(40.68 KB)</span>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/contact/imagefile_image
2. Use the matching context from Conditions: `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule color-contrast on selector .js-form-item-imagefile-image-plain-N > .is-single.no-upload.has-value > .form-managed-file__main > .file.file--mime-image-png.file--image > .file__size.

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20form-element.html.twig%20js-form-item-imagefile-image-plain-N&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-5E5C0D86
- Instance IDs: INS-DEDF73B5, INS-4537462D

### DRUPAL-A11Y-065—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-01429747
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 3 of 1341 pages (0%)
**Selector:** #edit-imagefile-image-plain-dis-N--description
**XPath:** //*[@id="edit-imagefile-image-plain-dis-0--description"]
**Parent Context:** N/A

**Affected URLs (full list):**
- https://drupal-core.ddev.site/contact/imagefile_image

**Conditions:**
- `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)

#### HTML Snippet
```html
<div id="edit-imagefile-image-plain-dis-0--description" class="is-disabled form-item__description">
      Description for the <em>Plain image – no alt or title (disabled)</em> field.<br> Alt and title properties are disabled.<br> This field has a pre-existing value.
    </div>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/contact/imagefile_image
2. Use the matching context from Conditions: `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule color-contrast on selector #edit-imagefile-image-plain-dis-N--description.

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20edit-imagefile-image-plain-dis-N--description&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-01429747
- Instance IDs: INS-5746D4F5, INS-D0AAC97D, INS-A046CF75

### DRUPAL-A11Y-066—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-DB7EDA96
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 2 of 1341 pages (0%)
**Selector:** #edit-imagefile-image-multi-dis > .gin-details__wrapper.details-wrapper > .gin-details__description.is-disabled > em
**XPath:** //*[@id="edit-imagefile-image-multi-dis > .gin-details__wrapper.details-wrapper > .gin-details__description.is-disabled > em"]
**Parent Context:** N/A

**Affected URLs (full list):**
- https://drupal-core.ddev.site/contact/imagefile_image

**Conditions:**
- `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)

#### HTML Snippet
```html
<em>Unlimited image (disabled)</em>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/contact/imagefile_image
2. Use the matching context from Conditions: `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule color-contrast on selector #edit-imagefile-image-multi-dis > .gin-details__wrapper.details-wrapper > .gin-details__description.is-disabled > em.

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20edit-imagefile-image-multi-dis&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-DB7EDA96
- Instance IDs: INS-6A0CA6ED, INS-6915D506

### DRUPAL-A11Y-067—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-7BEBE47D
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 1 of 1341 pages (0%)
**Selector:** #edit-imagefile-image-multi-def-dis > .gin-details__wrapper.details-wrapper > .gin-details__description.is-disabled
**XPath:** //*[@id="edit-imagefile-image-multi-def-dis > .gin-details__wrapper.details-wrapper > .gin-details__description.is-disabled"]
**Parent Context:** N/A

**Affected URLs (full list):**
- https://drupal-core.ddev.site/contact/imagefile_image

**Conditions:**
- `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)

#### HTML Snippet
```html
<div class="gin-details__description is-disabled">
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/contact/imagefile_image
2. Use the matching context from Conditions: `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule color-contrast on selector #edit-imagefile-image-multi-def-dis > .gin-details__wrapper.details-wrapper > .gin-details__description.is-disabled.

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20edit-imagefile-image-multi-def-dis&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-7BEBE47D
- Instance IDs: INS-40E92D5B

### DRUPAL-A11Y-068—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-E2BB2305
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 1 of 1341 pages (0%)
**Selector:** #edit-imagefile-image-multi-def-dis-N--description
**XPath:** //*[@id="edit-imagefile-image-multi-def-dis-0--description"]
**Parent Context:** N/A

**Affected URLs (full list):**
- https://drupal-core.ddev.site/contact/imagefile_image

**Conditions:**
- `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)

#### HTML Snippet
```html
<div id="edit-imagefile-image-multi-def-dis-0--description" class="is-disabled form-item__description">
      Unlimited number of files can be uploaded to this field.<br>50 KB limit.<br>Allowed types: png jpg jpeg.

    </div>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/contact/imagefile_image
2. Use the matching context from Conditions: `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule color-contrast on selector #edit-imagefile-image-multi-def-dis-N--description.

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20edit-imagefile-image-multi-def-dis-N--description&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-E2BB2305
- Instance IDs: INS-8B523DB7

### DRUPAL-A11Y-069—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-397BCC7E
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 1 of 1341 pages (0%)
**Selector:** #edit-imagefile-image-limited-dis > .gin-details__wrapper.details-wrapper > .gin-details__description.is-disabled
**XPath:** //*[@id="edit-imagefile-image-limited-dis > .gin-details__wrapper.details-wrapper > .gin-details__description.is-disabled"]
**Parent Context:** N/A

**Affected URLs (full list):**
- https://drupal-core.ddev.site/contact/imagefile_image

**Conditions:**
- `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)

#### HTML Snippet
```html
<div class="gin-details__description is-disabled">Description for the <em>Limited image with a pre-existing value (required, disabled)</em> field.<br> Alt and title properties are allowed and alt is required.<br> The field has a pre-existing value.<br> Cardinality is set to 2.</div>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/contact/imagefile_image
2. Use the matching context from Conditions: `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule color-contrast on selector #edit-imagefile-image-limited-dis > .gin-details__wrapper.details-wrapper > .gin-details__description.is-disabled.

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 1.95 (foreground color: #55565b, background color: #2a2a2d, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20edit-imagefile-image-limited-dis&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-397BCC7E
- Instance IDs: INS-78D488C9

### DRUPAL-A11Y-070—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-D3A5FBE6
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 2 of 1341 pages (0%)
**Selector:** #edit-imagefile-image-limited-dis-table > tbody > .odd.draggable[data-once="claroTabledrag"] > .tabledrag-cell > .tabledrag-cell-content.js-tabledrag-cell-content > .tabledrag-cell-content__item > .has-meta.is-multiple.no-upload > .form-managed-file__main > .file.file--mime-image-png.file--image > .menu-item__link[type="image/png"]
**XPath:** //*[@id="edit-imagefile-image-limited-dis-table > tbody > .odd.draggable[data-once="claroTabledrag"] > .tabledrag-cell > .tabledrag-cell-content.js-tabledrag-cell-content > .tabledrag-cell-content__item > .has-meta.is-multiple.no-upload > .form-managed-file__main > .file.file--mime-image-png.file--image > .menu-item__link[type="image/png"]"]
**Parent Context:** N/A
**Likely Template:** menu.html.twig
**Template Hint:** Menu template
**Drupal File:** See likely_template above

**Affected URLs (full list):**
- https://drupal-core.ddev.site/contact/imagefile_image

**Conditions:**
- `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)

#### HTML Snippet
```html
<a href="/sites/default/files/drupal-8-logo-Stacked-CMYK-300.png" type="image/png" class="menu-item__link">drupal-8-logo-Stacked-CMYK-300.png</a>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 1.52 (foreground color: #ffbbff, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. This issue may require expanding or activating interactive UI elements before running axe.
2. Go to https://drupal-core.ddev.site/contact/imagefile_image
3. Use the matching context from Conditions: `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)
4. Open browser DevTools and run axe.run() in the Console.
5. Confirm rule color-contrast on selector #edit-imagefile-image-limited-dis-table > tbody > .odd.draggable[data-once="claroTabledrag"] > .tabledrag-cell > .tabledrag-cell-content.js-tabledrag-cell-content > .tabledrag-cell-content__item > .has-meta.is-multiple.no-upload > .form-managed-file__main > .file.file--mime-image-png.file--image > .menu-item__link[type="image/png"].

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 1.52 (foreground color: #ffbbff, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20menu.html.twig%20edit-imagefile-image-limited-dis-table&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-D3A5FBE6
- Instance IDs: INS-177A583C, INS-BBE3AAEB

### DRUPAL-A11Y-071—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-46B445F5
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 1 of 1341 pages (0%)
**Selector:** input[value="Single input"]
**XPath:** //input[@value="Single input"]
**Parent Context:** N/A

**Affected URLs (full list):**
- https://drupal-core.ddev.site/dropbutton

**Conditions:**
- `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)

#### HTML Snippet
```html
<input type="submit" name="op" value="Single input" class="button button--primary js-form-submit form-submit">
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 1.31 (foreground color: #111111, background color: #2a2a2d, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. This issue may require expanding or activating interactive UI elements before running axe.
2. Go to https://drupal-core.ddev.site/dropbutton
3. Use the matching context from Conditions: `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)
4. Open browser DevTools and run axe.run() in the Console.
5. Confirm rule color-contrast on selector input[value="Single input"].

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 1.31 (foreground color: #111111, background color: #2a2a2d, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20value&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-46B445F5
- Instance IDs: INS-7E0107C0

### DRUPAL-A11Y-072—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-C5A32380
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 1 of 1341 pages (0%)
**Selector:** input[value="Multiple inputs"]
**XPath:** //input[@value="Multiple inputs"]
**Parent Context:** N/A

**Affected URLs (full list):**
- https://drupal-core.ddev.site/dropbutton

**Conditions:**
- `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)

#### HTML Snippet
```html
<input data-name="one" type="submit" name="op" value="Multiple inputs" class="button button--primary js-form-submit form-submit">
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 1.31 (foreground color: #111111, background color: #2a2a2d, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. This issue may require expanding or activating interactive UI elements before running axe.
2. Go to https://drupal-core.ddev.site/dropbutton
3. Use the matching context from Conditions: `admin` (dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)
4. Open browser DevTools and run axe.run() in the Console.
5. Confirm rule color-contrast on selector input[value="Multiple inputs"].

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 1.31 (foreground color: #111111, background color: #2a2a2d, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20value&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-C5A32380
- Instance IDs: INS-9B12400D

### DRUPAL-A11Y-073—2026-07-05: color-contrast: Ensure the contrast between foreground and background colors meets WCAG 2 AA min

**Pattern ID:** DRU-57A3E114
**Rule:** axe-core - color-contrast
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/color-contrast
**Severity:** High (axe impact: serious)
**Classification:** WCAG failure
**WCAG SC:** 1.4.3 - Contrast (Minimum) (Level AA)
**Suggested drupal.org issue tags:** Accessibility, wcag143
**Frequency:** 1 of 1341 pages (0%)
**Selector:** .toolbar-button--icon--shortcuts > .toolbar-button__label[data-toolbar-text=""]
**XPath:** //*[contains(@class,"toolbar-button--icon--shortcuts > .toolbar-button__label[data-toolbar-text=""]")]
**Parent Context:** N/A
**Likely Template:** toolbar (admin theme)
**Template Hint:** Admin toolbar
**Drupal File:** See likely_template above

**Affected URLs (full list):**
- https://drupal-core.ddev.site/tabs

**Conditions:**
- `admin` (dark desktop, dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)

#### HTML Snippet
```html
<span class="toolbar-button__label" data-toolbar-text="">Shortcuts</span>
```

#### Description
Fix any of the following:
  Element has insufficient color contrast of 1.39 (foreground color: #1f242d, background color: #3b3b3f, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Steps to Reproduce
1. This issue may require expanding or activating interactive UI elements before running axe.
2. Go to https://drupal-core.ddev.site/tabs
3. Use the matching context from Conditions: `admin` (dark desktop, dark desktop accent:dark_purple, dark desktop accent:green, dark desktop accent:light_blue, dark desktop accent:neutral, dark desktop accent:orange, dark desktop accent:pink, dark desktop accent:purple, dark desktop accent:red, dark desktop accent:teal, dark desktop accent:yellow)
4. Open browser DevTools and run axe.run() in the Console.
5. Confirm rule color-contrast on selector .toolbar-button--icon--shortcuts > .toolbar-button__label[data-toolbar-text=""].

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element has insufficient color contrast of 1.39 (foreground color: #1f242d, background color: #3b3b3f, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

#### Impact
low-vision

#### Suggested Fix
Check foreground/background color combinations. Ensure ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt or 14pt bold). Update the relevant CSS file.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/color-contrast
- WCAG Understanding: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- DWP - Colour and contrast: https://accessibility-manual.dwp.gov.uk/tools-and-resources/colour-and-contrast
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=color-contrast%20toolbar%20(admin%20theme)%20toolbar-button--icon--shortcuts&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-57A3E114
- Instance IDs: INS-1026E203

## Reproducible Issue Details — Best Practices (not WCAG failures)

> These rules are Deque/axe best practices. They improve the experience for assistive technology users and are worth fixing, but they are **not** WCAG conformance failures — file them on drupal.org as tasks (not bugs), tagged `Accessibility`, and do not cite a WCAG SC as failing.

### DRUPAL-A11Y-074—2026-07-05: label-title-only: Ensure that every form element has a visible label and is not solely labeled usi

**Pattern ID:** DRU-546CD707
**Rule:** axe-core - label-title-only
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/label-title-only
**Severity:** High (axe impact: serious)
**Classification:** Best practice (Deque/axe)
**Related WCAG SC (advisory only — not a conformance failure):** 1.3.1 - Info and Relationships
**Suggested drupal.org issue tags:** Accessibility
**Frequency:** 4 of 1341 pages (0%)
**Selector:** #edit-checkbox-hidden-label-value
**XPath:** //*[@id="edit-checkbox-hidden-label-value"]
**Parent Context:** N/A

**Affected URLs (full list):**
- https://drupal-core.ddev.site/contact/checkbox_radio

**Conditions:**
- `admin` (light desktop, light mobile, light mobile-landscape, light tablet), `claro` (light desktop, light mobile, light mobile-landscape, light tablet)

#### HTML Snippet
```html
<input data-drupal-selector="edit-checkbox-hidden..." aria-describedby="edit-checkbox-hidden..." type="checkbox" id="edit-checkbox-hidden..." name="checkbox_hidden_labe..." value="1" class="form-checkbox form-b..." title="Checkbox with hidden...">
```

#### Description
Fix all of the following:
  Only title used to generate label for form element

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/contact/checkbox_radio
2. Use the matching context from Conditions: `admin` (light desktop, light mobile, light mobile-landscape, light tablet), `claro` (light desktop, light mobile, light mobile-landscape, light tablet)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule label-title-only on selector #edit-checkbox-hidden-label-value.

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix all of the following:
  Only title used to generate label for form element

#### Impact
blind, low-vision, voice-control

#### Suggested Fix
Replace title-only labels with aria-label or a visible/visually-hidden <label> element.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/label-title-only
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- GOV.UK Design System - Checkboxes: https://design-system.service.gov.uk/components/checkboxes/
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=label-title-only%20edit-checkbox-hidden-label-value&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-546CD707
- Instance IDs: INS-F6C861B6, INS-B4627DC9, INS-4F90EA44, INS-E95FF9C0

### DRUPAL-A11Y-075—2026-07-05: label-title-only: Ensure that every form element has a visible label and is not solely labeled usi

**Pattern ID:** DRU-9696BA88
**Rule:** axe-core - label-title-only
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/label-title-only
**Severity:** High (axe impact: serious)
**Classification:** Best practice (Deque/axe)
**Related WCAG SC (advisory only — not a conformance failure):** 1.3.1 - Info and Relationships
**Suggested drupal.org issue tags:** Accessibility
**Frequency:** 4 of 1341 pages (0%)
**Selector:** #edit-checkbox-hidden-label-disabled-value
**XPath:** //*[@id="edit-checkbox-hidden-label-disabled-value"]
**Parent Context:** N/A

**Affected URLs (full list):**
- https://drupal-core.ddev.site/contact/checkbox_radio

**Conditions:**
- `admin` (light desktop, light mobile, light mobile-landscape, light tablet), `claro` (light desktop, light mobile, light mobile-landscape, light tablet)

#### HTML Snippet
```html
<input data-drupal-selector="edit-checkbox-hidden..." aria-describedby="edit-checkbox-hidden..." disabled="disabled" type="checkbox" id="edit-checkbox-hidden..." name="checkbox_hidden_labe..." value="1" class="form-checkbox form-b..." title="Hidden label, disabl...">
```

#### Description
Fix all of the following:
  Only title used to generate label for form element

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/contact/checkbox_radio
2. Use the matching context from Conditions: `admin` (light desktop, light mobile, light mobile-landscape, light tablet), `claro` (light desktop, light mobile, light mobile-landscape, light tablet)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule label-title-only on selector #edit-checkbox-hidden-label-disabled-value.

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix all of the following:
  Only title used to generate label for form element

#### Impact
blind, low-vision, voice-control

#### Suggested Fix
Replace title-only labels with aria-label or a visible/visually-hidden <label> element.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/label-title-only
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- GOV.UK Design System - Checkboxes: https://design-system.service.gov.uk/components/checkboxes/
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=label-title-only%20edit-checkbox-hidden-label-disabled-value&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-9696BA88
- Instance IDs: INS-E665AD32, INS-95732264, INS-00DDD2B6, INS-1CB38A36

### DRUPAL-A11Y-076—2026-07-05: Local task tab headings (#primary-tabs-title) are outside any landmark region

**Pattern ID:** DRU-D8FCA413
**Rule:** axe-core - region
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/region
**Severity:** Medium (axe impact: moderate)
**Classification:** Best practice (Deque/axe)
**Related WCAG SC (advisory only — not a conformance failure):** 1.3.6 - Identify Purpose
**Suggested drupal.org issue tags:** Accessibility
**Frequency:** 108 of 1341 pages (8%)
**Selector:** #primary-tabs-title
**XPath:** //*[@id="primary-tabs-title"]
**Parent Context:** N/A

**Affected URLs (full list):**
- https://drupal-core.ddev.site/admin
- /admin/appearance
- /admin/content
- /admin/modules
- /admin/people
- /admin/structure/types
- /admin/structure/types/manage/test_type/display/default
- /buttons
- /contact/checkbox_radio
- /contact/field_cardinality_test
- /contact/imagefile_file
- /contact/imagefile_image
- /contact/presuf_formatted
- /contact/presuf_number
- /contact/presuf_text
- /contact/select
- /contact/textarea
- /contact/textform
- /dropbutton
- /message
- /progress
- /tabledrag
- /tabs
- /tabs/format/plain_text

**Conditions:**
- `admin` (dark desktop, dark mobile, dark mobile-landscape, dark tablet, light desktop, light mobile, light mobile-landscape, light tablet)

#### HTML Snippet
```html
<h2 id="primary-tabs-title" class="visually-hidden">Primary tabs</h2>
```

#### Description
Fix any of the following:
  Some page content is not contained by landmarks

#### Steps to Reproduce
1. This issue may require expanding or activating interactive UI elements before running axe.
2. Go to https://drupal-core.ddev.site/admin
3. Use the matching context from Conditions: `admin` (dark desktop, dark mobile, dark mobile-landscape, dark tablet, light desktop, light mobile, light mobile-landscape, light tablet)
4. Open browser DevTools and run axe.run() in the Console.
5. Confirm rule region on selector #primary-tabs-title.

#### Expected Behaviour
The <h2> heading is inside the <nav> it labels, or the <nav> itself is inside a landmark

#### Actual Behaviour
<h2 id="primary-tabs-title"> is a sibling of <nav>, and the nav may be outside main/aside/etc.

#### Impact
blind, low-vision

#### Suggested Fix
Move the heading inside the <nav> it labels:

{# Before #}
<h2 id="primary-tabs-title" class="visually-hidden">{{ 'Primary tabs'|t }}</h2>
<nav class="tabs-wrapper" aria-labelledby="primary-tabs-title">…</nav>

{# After — h2 moves inside nav #}
<nav class="tabs-wrapper" aria-labelledby="primary-tabs-title">
  <h2 id="primary-tabs-title" class="visually-hidden">{{ 'Primary tabs'|t }}</h2>
  …
</nav>

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/region
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- WAI - Page structure and landmarks: https://www.w3.org/WAI/tutorials/page-structure/landmarks/
- Known Drupal issue: https://www.drupal.org/project/drupal/issues/3318396
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=region%20primary-tabs-title%20Local%20task%20tab%20headings%20(%23primary-tabs-title)%20are%20outside%20any%20landmark%20region&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-D8FCA413
- Instance IDs: INS-B57BA048, INS-64DAB861, INS-7C4ECF9A, INS-77E73DFA, INS-0CEAA7E5, INS-D365F8D8, INS-9DE0DE1F, INS-4D46CB5A, INS-AD67BC06, INS-76134119, INS-266B4171, INS-E801B818, INS-CF3A3147, INS-11A3A2B1, INS-0ED7584D, INS-EA207539, INS-D54AFCD9, INS-82AE2746, INS-688F2BFA, INS-CE01B6CA, INS-730561CB, INS-F717AC93, INS-CD0BF54C, INS-97722B50, INS-D4377534, INS-FEFDA2D7, INS-F717EBB5, INS-630748A0, INS-A42B925C, INS-ED1BF4E7, INS-FA94085D, INS-012B6059, INS-733B1078, INS-2006BEC6, INS-26A9D6E9, INS-5276BA81, INS-DA039B6D, INS-6A5B2690, INS-80B289D0, INS-D0D78524, INS-E4149477, INS-7034BF8F, INS-202B6424, INS-6BD09A82, INS-49476331, INS-3FA02227, INS-BA7181E5, INS-072A3145, INS-B71C2136, INS-D62E3F2C, INS-352A38FE, INS-FA89120C, INS-FE14D9D0, INS-E1EE601D, INS-8F2E6F4B, INS-570254A6, INS-86995EE4, INS-C1853C63, INS-537B0CC7, INS-D9A9D733, INS-A28D10A7, INS-4C2710FE, INS-16683573, INS-61CFA519, INS-D9CAB081, INS-329153C6, INS-466E28F7, INS-3BF23532, INS-AADE4701, INS-1A6266CB, INS-FCAA79EB, INS-F9379863, INS-DCEC8401, INS-DF516354, INS-269E96E5, INS-F26BD436, INS-8AEE45A1, INS-B36D3C2D, INS-2E821A5B, INS-180E448F, INS-B0FEF76E, INS-C51151AE, INS-AF97AD65, INS-ADAFFDA0, INS-EF2CC113, INS-5BFE8910, INS-F9D7BFA4, INS-3A7BDCF8, INS-A0CCA8E5, INS-266BEE80, INS-2D263D4D, INS-223795B0, INS-4CCD7F30, INS-6A7D17F7, INS-F306FAF0, INS-0F4A7346, INS-570D68D0, INS-A8EDBE5D, INS-06391A61, INS-44EEF002, INS-A87DF88C, INS-44732944, INS-28CA37BF, INS-345CE6F6, INS-242757E5, INS-D7F45578, INS-85AB893C, INS-3EB51932

### DRUPAL-A11Y-077—2026-07-05: region: Ensure all page content is contained by landmarks

**Pattern ID:** DRU-6488726D
**Rule:** axe-core - region
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/region
**Severity:** Medium (axe impact: moderate)
**Classification:** Best practice (Deque/axe)
**Related WCAG SC (advisory only — not a conformance failure):** 1.3.6 - Identify Purpose
**Suggested drupal.org issue tags:** Accessibility
**Frequency:** 20 of 1341 pages (1%)
**Selector:** .top-bar__actions
**XPath:** //*[contains(@class,"top-bar__actions")]
**Parent Context:** N/A

**Affected URLs (full list):**
- https://drupal-core.ddev.site/admin/config/content/formats
- /admin/content
- /admin/people
- /admin/structure/taxonomy
- /admin/structure/types

**Conditions:**
- `admin` (light desktop, light mobile, light mobile-landscape, light tablet)

#### HTML Snippet
```html
<div class="top-bar__actions">
```

#### Description
Fix any of the following:
  Some page content is not contained by landmarks

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/admin/config/content/formats
2. Use the matching context from Conditions: `admin` (light desktop, light mobile, light mobile-landscape, light tablet)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule region on selector .top-bar__actions.

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Some page content is not contained by landmarks

#### Impact
blind, low-vision

#### Suggested Fix
Ensure all visible content is inside a landmark element (<main>, <nav>, <aside>, <header>, <footer>). Check page.html.twig and block placement.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/region
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- WAI - Page structure and landmarks: https://www.w3.org/WAI/tutorials/page-structure/landmarks/
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=region%20top-bar__actions&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-6488726D
- Instance IDs: INS-91951104, INS-976DE620, INS-4FD02D10, INS-0C18D945, INS-09912040, INS-E4416323, INS-A557CCB0, INS-A6E729ED, INS-E6BB2021, INS-43F9F2A6, INS-88A0510B, INS-36BE1EA0, INS-5EC29ADE, INS-779FC4CA, INS-7F724F31, INS-5C060EE9, INS-D8583430, INS-D955295B, INS-5805F851, INS-CFB59AA2

### DRUPAL-A11Y-078—2026-07-05: region: Ensure all page content is contained by landmarks

**Pattern ID:** DRU-EE349DA0
**Rule:** axe-core - region
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/region
**Severity:** Medium (axe impact: moderate)
**Classification:** Best practice (Deque/axe)
**Related WCAG SC (advisory only — not a conformance failure):** 1.3.6 - Identify Purpose
**Suggested drupal.org issue tags:** Accessibility
**Frequency:** 4 of 1341 pages (0%)
**Selector:** .toolbar-title__label
**XPath:** //*[contains(@class,"toolbar-title__label")]
**Parent Context:** N/A
**Likely Template:** toolbar (admin theme)
**Template Hint:** Admin toolbar
**Drupal File:** See likely_template above

**Affected URLs (full list):**
- https://drupal-core.ddev.site/user/1/edit

**Conditions:**
- `admin` (light desktop, light mobile, light mobile-landscape, light tablet)

#### HTML Snippet
```html
<span class="toolbar-title__label">
        admin
    </span>
```

#### Description
Fix any of the following:
  Some page content is not contained by landmarks

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/user/1/edit
2. Use the matching context from Conditions: `admin` (light desktop, light mobile, light mobile-landscape, light tablet)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule region on selector .toolbar-title__label.

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Some page content is not contained by landmarks

#### Impact
blind, low-vision

#### Suggested Fix
Ensure all visible content is inside a landmark element (<main>, <nav>, <aside>, <header>, <footer>). Check page.html.twig and block placement.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/region
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- WAI - Page structure and landmarks: https://www.w3.org/WAI/tutorials/page-structure/landmarks/
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=region%20toolbar%20(admin%20theme)%20toolbar-title__label&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-EE349DA0
- Instance IDs: INS-F3511025, INS-725071C4, INS-ADBF9E01, INS-B76964D5

### DRUPAL-A11Y-079—2026-07-05: empty-table-header: Ensure table headers have discernible text

**Pattern ID:** DRU-1D23B830
**Rule:** axe-core - empty-table-header
**Axe Rule URL:** https://dequeuniversity.com/rules/axe/4.11/empty-table-header
**Severity:** Low (axe impact: minor)
**Classification:** Best practice (Deque/axe)
**Suggested drupal.org issue tags:** Accessibility
**Frequency:** 4 of 1341 pages (0%)
**Selector:** #edit-table-empty > thead > tr > .select-all
**XPath:** //*[@id="edit-table-empty > thead > tr > .select-all"]
**Parent Context:** N/A

**Affected URLs (full list):**
- https://drupal-core.ddev.site/table

**Conditions:**
- `claro` (light desktop, light mobile, light mobile-landscape, light tablet)

#### HTML Snippet
```html
<th class="select-all"></th>
```

#### Description
Fix any of the following:
  Element does not have text that is visible to screen readers

#### Steps to Reproduce
1. Go to https://drupal-core.ddev.site/table
2. Use the matching context from Conditions: `claro` (light desktop, light mobile, light mobile-landscape, light tablet)
3. Open browser DevTools and run axe.run() in the Console.
4. Confirm rule empty-table-header on selector #edit-table-empty > thead > tr > .select-all.

#### Expected Behaviour
Element and interaction meet the mapped WCAG success criterion.

#### Actual Behaviour
Fix any of the following:
  Element does not have text that is visible to screen readers

#### Impact
users with disabilities

#### Suggested Fix
See axe documentation.

#### Additional References
- Deque Axe Rule: https://dequeuniversity.com/rules/axe/4.11/empty-table-header
- ACCESSIBILITY.md Trusted Sources: https://mgifford.github.io/ACCESSIBILITY.md/examples/TRUSTED_SOURCES.yaml
- WAI - Tables tutorial: https://www.w3.org/WAI/tutorials/tables/
- Search related Drupal accessibility issues (rule + selector/template): https://www.drupal.org/project/issues/search?text=empty-table-header%20edit-table-empty&projects=Drupal+core&assigned=&submitted=&project_issue_followers=&status%5B%5D=Open&issue_tags_op=%3D&issue_tags=Accessibility

#### Testing Environment
- Browser: Chromium (via Playwright)
- OS: macOS
- Tool: axe-core via @axe-core/playwright
- Base URL: https://drupal-core.ddev.site

#### Tracking IDs
- Pattern ID: DRU-1D23B830
- Instance IDs: INS-18F20817, INS-AE9385D3, INS-3C7A0BE8, INS-FD083698

---
## Deduplication & Pattern Grouping

- Patterns are merged by selector, parent context, and generalized route.
- Similar selectors are merged using fuzzy logic.
- Dynamic routes are collapsed (e.g., /node/1 → /node/[nid]).
