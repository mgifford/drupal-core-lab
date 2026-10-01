# Drupal Core Keyboard Navigation Review

> **Generated:** 2026-04-29T15:57:30.704Z
> **Method:** Playwright keyboard-only tab sampling with real key presses
> **Base URL:** https://drupal-core.ddev.site
> **Admin Auth:** admin/admin (local default)

## Summary

| Metric | Value |
| :--- | :--- |
| Pages reviewed | 159 |
| Total keyboard findings | 0 |
| Pages with failures | 0 |
| Pages with warnings | 0 |
| Total failure findings | 0 |
| Total warning findings | 0 |
| HTTP 200 pages | 153 |
| HTTP 403 pages | 3 |
| HTTP 404 pages | 3 |
| Admin routes with 403 | 0 |
| Promoted findings (candidates) | 2 |

## Evaluated Pages

[desktop] [tablet] [mobile]
- https://drupal-core.ddev.site/
- /action-link
- /user/login
- /user/register
- /user/password
- /search/node
- /this-page-does-not-exist
- /admin
- /admin/form_style
- /admin/content
- /node/add/article
- /node/add/page
- /admin/structure
- /admin/structure/types
- /admin/structure/types/add
- /admin/structure/taxonomy
- /admin/structure/taxonomy/add
- /admin/structure/block
- /admin/appearance
- /admin/modules
- /admin/people
- /user/1/edit
- /admin/config
- /admin/config/content/formats
- /admin/config/content/formats/manage/restricted_html
- /admin/config/system/site-information
- /admin/reports
- /autocomplete
- /buttons
- /contact/checkbox_radio
- /dialog
- /dropbutton
- /contact/field_cardinality_test
- /admin/structure/types/manage/test_type/display/default
- /fieldset
- /contact/imagefile_file
- /contact/presuf_formatted
- /contact/imagefile_image
- /admin/structure/display-modes/form/add/contact_message
- /message
- /cd-navigation/config
- /contact/presuf_number
- /tabs/format/plain_text
- /password
- /progress
- /contact/select
- /node/add/cd
- /table
- /tabledrag
- /tabs
- /contact/textform
- /contact/presuf_text
- /contact/textarea

## Reproducible Issue Details

- No keyboard review findings were captured for the sampled routes.

## Broken Links Found During Crawl

- No unexpected 404 routes were detected during this crawl.
- Intentional 404 test route retained: /this-page-does-not-exist

## Voice Control / Label-in-Name Risks

- Total potential label-in-name mismatches: 3
- /admin/form_style [mobile] step 11
  - selector: #edit-test-datelist-month
  - xpath: //*[@id="edit-test-datelist-month"]
  - visible label: Month
Jan
Feb
Mar
Apr
May
Jun
Jul
Aug
Sep
Oct
Nov
Dec
  - accessible name: Month
- /admin/form_style [mobile] step 12
  - selector: #edit-test-datelist-day
  - xpath: //*[@id="edit-test-datelist-day"]
  - visible label: Day
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21
22
23
24
25
26
27
28
29
30
31
  - accessible name: Day
- /admin/structure/types/add [mobile] step 10
  - selector: div:nth-of-type(4) > div:nth-of-type(1) > details:nth-of-type(1) > summary:nth-of-type(1)
  - xpath: /html/body[1]/div[4]/div[2]/main[1]/div[4]/div[1]/form[1]/div[4]/div[1]/details[1]/summary[1]
  - visible label: Submission form settings
Title
  - accessible name: Submission form settingsTitle

## Dynamic Interaction Checks

- Routes with dynamic checks: /buttons, /dialog, /dropbutton, /tabs
- Dynamic checks executed: 12
- /buttons [desktop] (buttons)
  - attempted: true
  - opened: true
  - tab stayed in dialog: true
  - interaction succeeded: true
  - route changed: false
  - sample data supported: false
  - sample data entered: false
  - escaped/closed: true
  - focus returned to trigger: true
  - scoped axe violations: 0
- /buttons [tablet] (buttons)
  - attempted: true
  - opened: true
  - tab stayed in dialog: true
  - interaction succeeded: true
  - route changed: false
  - sample data supported: false
  - sample data entered: false
  - escaped/closed: true
  - focus returned to trigger: true
  - scoped axe violations: 0
- /buttons [mobile] (buttons)
  - attempted: true
  - opened: true
  - tab stayed in dialog: true
  - interaction succeeded: true
  - route changed: false
  - sample data supported: false
  - sample data entered: false
  - escaped/closed: true
  - focus returned to trigger: true
  - scoped axe violations: 0
- /dialog [desktop] (modal-dialog)
  - attempted: true
  - opened: true
  - tab stayed in dialog: true
  - sample data supported: false
  - sample data entered: false
  - escaped/closed: true
  - focus returned to trigger: true
  - scoped axe violations: 0
  - detail: No fillable text/select controls in dialog; sample data entry not applicable.
- /dialog [tablet] (modal-dialog)
  - attempted: true
  - opened: true
  - tab stayed in dialog: true
  - sample data supported: false
  - sample data entered: false
  - escaped/closed: true
  - focus returned to trigger: true
  - scoped axe violations: 0
  - detail: No fillable text/select controls in dialog; sample data entry not applicable.
- /dialog [mobile] (modal-dialog)
  - attempted: true
  - opened: true
  - tab stayed in dialog: true
  - sample data supported: false
  - sample data entered: false
  - escaped/closed: true
  - focus returned to trigger: true
  - scoped axe violations: 0
  - detail: No fillable text/select controls in dialog; sample data entry not applicable.
- /dropbutton [desktop] (dropbutton)
  - attempted: true
  - opened: true
  - tab stayed in dialog: true
  - interaction succeeded: true
  - secondary actions visible: true
  - sample data supported: false
  - sample data entered: false
  - escaped/closed: true
  - focus returned to trigger: true
  - scoped axe violations: 0
- /dropbutton [tablet] (dropbutton)
  - attempted: true
  - opened: true
  - tab stayed in dialog: true
  - interaction succeeded: true
  - secondary actions visible: true
  - sample data supported: false
  - sample data entered: false
  - escaped/closed: true
  - focus returned to trigger: true
  - scoped axe violations: 0
- /dropbutton [mobile] (dropbutton)
  - attempted: true
  - opened: true
  - tab stayed in dialog: true
  - interaction succeeded: true
  - secondary actions visible: true
  - sample data supported: false
  - sample data entered: false
  - escaped/closed: true
  - focus returned to trigger: true
  - scoped axe violations: 0
- /tabs [desktop] (tabs-nav)
  - attempted: true
  - opened: true
  - tab stayed in dialog: true
  - interaction succeeded: true
  - route changed: true
  - sample data supported: false
  - sample data entered: false
  - escaped/closed: true
  - focus returned to trigger: true
  - scoped axe violations: 0
- /tabs [tablet] (tabs-nav)
  - attempted: true
  - opened: true
  - tab stayed in dialog: true
  - interaction succeeded: true
  - route changed: true
  - sample data supported: false
  - sample data entered: false
  - escaped/closed: true
  - focus returned to trigger: true
  - scoped axe violations: 0
- /tabs [mobile] (tabs-nav)
  - attempted: true
  - opened: true
  - tab stayed in dialog: true
  - interaction succeeded: true
  - route changed: true
  - sample data supported: false
  - sample data entered: false
  - escaped/closed: true
  - focus returned to trigger: true
  - scoped axe violations: 0

## Promoted Findings for PATTERN-REPORT

- Promotion candidates: 2
- PROMOTE-001: /admin/form_style [mobile]
  - severity: Medium
  - type: dynamic-check
  - message: 2 potential label-in-name mismatches in sampled focus steps.
  - WCAG: 2.5.3
  - recommended contract: label-in-name-contract
  - rationale: Potential speech-command mismatch can block voice-control workflows and deserves contract coverage.
- PROMOTE-002: /admin/structure/types/add [mobile]
  - severity: Medium
  - type: dynamic-check
  - message: 1 potential label-in-name mismatches in sampled focus steps.
  - WCAG: 2.5.3
  - recommended contract: label-in-name-contract
  - rationale: Potential speech-command mismatch can block voice-control workflows and deserves contract coverage.

## Overlap with PATTERN-REPORT

- No keyboard findings were captured, so there is no overlap to report.

## Review Notes

- This report now follows a bug-report style structure for reproducibility and triage.
- Findings should be confirmed with targeted component-level keyboard tests for critical workflows.
- Recommended follow-up: add hard-gate keyboard specs for recurring failures.
