# #3083103 error association: 3083103-aug6

Verdict: **reproduced-not-fixed**. Before all references resolve; After has dangling references.

## Checks (After; Before in brackets)

| Check | Before | After |
|---|---|---|
| initialHasNoInvalidState | PASS | PASS |
| invalidShowsErrors | PASS | PASS |
| everyReferenceResolves | PASS | FAIL |
| everyErrorTargetExists | FAIL | FAIL |
| noDuplicateIds | PASS | PASS |
| correctedFieldsDropInvalid | PASS | PASS |
| helpTextPreserved | PASS | PASS |
| authorDescribedbyPreserved | PASS | PASS |
| suppressedHasNoDanglingRef | PASS | PASS |
| compositeGroupTargetResolves | PASS | FAIL |
| twoInstancesUniqueErrorIds | PASS | PASS |
| summaryLinkTargetExists | PASS | PASS |
| validSubmitClean | PASS | PASS |

## Dangling references

- Before: none
- After: `edit-name -> edit-name--error-message`, `edit-name -> edit-name--error-message`, `edit-message -> edit-message--error-message`, `edit-message -> edit-message--error-message`, `edit-choice -> edit-choice--error-message`, `edit-choice -> edit-choice--error-message`, `edit-colour--wrapper -> edit-colour--error-message`, `edit-colour--wrapper -> edit-colour--error-message`, `edit-features--wrapper -> edit-features--error-message`, `edit-features--wrapper -> edit-features--error-message`, `edit-tags-tag0 -> edit-tags-tag0--error-message`, `edit-tags-tag0 -> edit-tags-tag0--error-message`, `edit-phone -> edit-phone--error-message`, `edit-phone -> edit-phone--error-message`, `edit-street -> edit-street--error-message`, `edit-street -> edit-street--error-message`, `edit-postcode -> edit-postcode--error-message`, `edit-postcode -> edit-postcode--error-message`, `edit-table-select -> edit-table-select--error-message`, `edit-table-select -> edit-table-select--error-message`

## Per-scenario invalid controls (After)

| Scenario | Control | aria-invalid | aria-errormessage | describedby tokens | ax role / name / description |
|---|---|---|---|---|---|
| invalid | name (`edit-name`) | true | edit-name--error-message | edit-name--error-message edit-name--description | textbox / Name * / Your full name. |
| invalid | message (`edit-message`) | true | edit-message--error-message | edit-message--error-message edit-message--description | textbox / Message * / A short message. |
| invalid | choice (`edit-choice`) | true | edit-choice--error-message | edit-choice--error-message | combobox / Choice * /  |
| invalid | colour (`edit-colour--wrapper`) | true | edit-colour--error-message | edit-colour--error-message | group / Colour * /  |
| invalid | colour_input (`edit-colour-red`) | true |  |  | radio / Red /  |
| invalid | features (`edit-features--wrapper`) | true | edit-features--error-message | edit-features--error-message | group / Features * /  |
| invalid | features_input (`edit-features-one`) | true |  |  | checkbox / One /  |
| invalid | tag0 (`edit-tags-tag0`) | true | edit-tags-tag0--error-message | edit-tags-tag0--error-message | textbox / Tag 1 * /  |
| invalid | phone (`edit-phone`) | true | edit-phone--error-message | edit-phone--error-message edit-phone--description | textbox / Phone * / Include the area code. |
| invalid | street (`edit-street`) | true | edit-street--error-message | edit-street--error-message | textbox / Street * /  |
| invalid | postcode (`edit-postcode`) | true | edit-postcode--error-message | edit-postcode--error-message | textbox / Postcode * /  |
| invalid | table_select (`edit-table-select`) | true | edit-table-select--error-message | edit-table-select--error-message | table /  /  |
| invalid | email_primary (`edit-email-primary`) | true | edit-email-primary--error-message | edit-email-primary--error-message | textbox / Email address * /  |
| invalid | email_secondary (`edit-email-secondary`) | true | edit-email-secondary--error-message | edit-email-secondary--error-message | textbox / Email address * /  |
| invalid | custom (`lab-custom-id`) | true | lab-custom-id--error-message | lab-custom-id--error-message lab-existing-help-single | textbox / Custom ID * / Author-supplied help. |
| invalid | suppressed (`edit-suppressed`) | true |  |  | textbox / Suppressed * /  |
| invalid-repeat | name (`edit-name`) | true | edit-name--error-message | edit-name--error-message edit-name--description | textbox / Name * / Your full name. |
| invalid-repeat | message (`edit-message`) | true | edit-message--error-message | edit-message--error-message edit-message--description | textbox / Message * / A short message. |
| invalid-repeat | choice (`edit-choice`) | true | edit-choice--error-message | edit-choice--error-message | combobox / Choice * /  |
| invalid-repeat | colour (`edit-colour--wrapper`) | true | edit-colour--error-message | edit-colour--error-message | group / Colour * /  |
| invalid-repeat | colour_input (`edit-colour-red`) | true |  |  | radio / Red /  |
| invalid-repeat | features (`edit-features--wrapper`) | true | edit-features--error-message | edit-features--error-message | group / Features * /  |
| invalid-repeat | features_input (`edit-features-one`) | true |  |  | checkbox / One /  |
| invalid-repeat | tag0 (`edit-tags-tag0`) | true | edit-tags-tag0--error-message | edit-tags-tag0--error-message | textbox / Tag 1 * /  |
| invalid-repeat | phone (`edit-phone`) | true | edit-phone--error-message | edit-phone--error-message edit-phone--description | textbox / Phone * / Include the area code. |
| invalid-repeat | street (`edit-street`) | true | edit-street--error-message | edit-street--error-message | textbox / Street * /  |
| invalid-repeat | postcode (`edit-postcode`) | true | edit-postcode--error-message | edit-postcode--error-message | textbox / Postcode * /  |
| invalid-repeat | table_select (`edit-table-select`) | true | edit-table-select--error-message | edit-table-select--error-message | table /  /  |
| invalid-repeat | email_primary (`edit-email-primary`) | true | edit-email-primary--error-message | edit-email-primary--error-message | textbox / Email address * /  |
| invalid-repeat | email_secondary (`edit-email-secondary`) | true | edit-email-secondary--error-message | edit-email-secondary--error-message | textbox / Email address * /  |
| invalid-repeat | custom (`lab-custom-id`) | true | lab-custom-id--error-message | lab-custom-id--error-message lab-existing-help-single | textbox / Custom ID * / Author-supplied help. |
| invalid-repeat | suppressed (`edit-suppressed`) | true |  |  | textbox / Suppressed * /  |
| identical-text | email_primary (`edit-email-primary`) | true | edit-email-primary--error-message | edit-email-primary--error-message | textbox / Email address * /  |
| identical-text | email_secondary (`edit-email-secondary`) | true | edit-email-secondary--error-message | edit-email-secondary--error-message | textbox / Email address * /  |
| partial-correction | choice (`edit-choice`) | true | edit-choice--error-message | edit-choice--error-message | combobox / Choice * /  |
| partial-correction | email_primary (`edit-email-primary`) | true | edit-email-primary--error-message | edit-email-primary--error-message | textbox / Email address * /  |
| ajax-add-more | extra_tag (`edit-extra-tag`) | true | edit-extra-tag--error-message | edit-extra-tag--error-message | textbox / Extra tag * /  |
| ajax-add-more | name (`edit-name`) | true | edit-name--error-message | edit-name--error-message edit-name--description | textbox / Name * / Your full name. |
| disable-inline-form-errors | name (`edit-name`) | true |  | edit-name--description | textbox / Name * / Your full name. |
| disable-inline-form-errors | message (`edit-message`) | true |  | edit-message--description | textbox / Message * / A short message. |
| disable-inline-form-errors | choice (`edit-choice`) | true |  |  | combobox / Choice * /  |
| disable-inline-form-errors | colour (`edit-colour--wrapper`) | true |  |  | group / Colour * /  |
| disable-inline-form-errors | colour_input (`edit-colour-red`) | true |  |  | radio / Red /  |
| disable-inline-form-errors | features (`edit-features--wrapper`) | true |  |  | group / Features * /  |
| disable-inline-form-errors | features_input (`edit-features-one`) | true |  |  | checkbox / One /  |
| disable-inline-form-errors | tag0 (`edit-tags-tag0`) | true |  |  | textbox / Tag 1 * /  |
| disable-inline-form-errors | phone (`edit-phone`) | true |  | edit-phone--description | textbox / Phone * / Include the area code. |
| disable-inline-form-errors | street (`edit-street`) | true |  |  | textbox / Street * /  |
| disable-inline-form-errors | postcode (`edit-postcode`) | true |  |  | textbox / Postcode * /  |
| disable-inline-form-errors | email_primary (`edit-email-primary`) | true |  |  | textbox / Email address * /  |
| disable-inline-form-errors | email_secondary (`edit-email-secondary`) | true |  |  | textbox / Email address * /  |
| disable-inline-form-errors | custom (`lab-custom-id`) | true |  | lab-existing-help-single | textbox / Custom ID * / Author-supplied help. |
| disable-inline-form-errors | suppressed (`edit-suppressed`) | true |  |  | textbox / Suppressed * /  |
| two-instances | name (`edit-name`) | true | edit-name--error-message | edit-name--error-message edit-name--description | textbox / Name * / Your full name. |
| two-instances | message (`edit-message`) | true | edit-message--error-message | edit-message--error-message edit-message--description | textbox / Message * / A short message. |
| two-instances | choice (`edit-choice`) | true | edit-choice--error-message | edit-choice--error-message | combobox / Choice * /  |
| two-instances | colour (`edit-colour--wrapper`) | true | edit-colour--error-message | edit-colour--error-message | group / Colour * /  |
| two-instances | colour_input (`edit-colour-red`) | true |  |  | radio / Red /  |
| two-instances | features (`edit-features--wrapper`) | true | edit-features--error-message | edit-features--error-message | group / Features * /  |
| two-instances | features_input (`edit-features-one`) | true |  |  | checkbox / One /  |
| two-instances | tag0 (`edit-tags-tag0`) | true | edit-tags-tag0--error-message | edit-tags-tag0--error-message | textbox / Tag 1 * /  |
| two-instances | phone (`edit-phone`) | true | edit-phone--error-message | edit-phone--error-message edit-phone--description | textbox / Phone * / Include the area code. |
| two-instances | street (`edit-street`) | true | edit-street--error-message | edit-street--error-message | textbox / Street * /  |
| two-instances | postcode (`edit-postcode`) | true | edit-postcode--error-message | edit-postcode--error-message | textbox / Postcode * /  |
| two-instances | table_select (`edit-table-select`) | true | edit-table-select--error-message | edit-table-select--error-message | table /  /  |
| two-instances | email_primary (`edit-email-primary`) | true | edit-email-primary--error-message | edit-email-primary--error-message | textbox / Email address * /  |
| two-instances | email_secondary (`edit-email-secondary`) | true | edit-email-secondary--error-message | edit-email-secondary--error-message | textbox / Email address * /  |
| two-instances | custom (`lab-custom-id`) | true | lab-custom-id--error-message | lab-custom-id--error-message lab-existing-help-one | textbox / Custom ID * Custom ID * / Author-supplied help. |
| two-instances | suppressed (`edit-suppressed`) | true |  |  | textbox / Suppressed * /  |

## Error containers and summary links (After, invalid scenario)

- Error containers: <div NO ID> "Error message 14 errors have been found:"; <div NO ID> "Name field is required."; <div NO ID> "Message field is required."; <div NO ID> "Choice field is required."; <div NO ID> "Colour field is required."; <div NO ID> "Features field is required."; <div NO ID> "Tag 1 field is required."; <div NO ID> "Tag 2 field is required."; <div NO ID> "Phone field is required."; <div NO ID> "Street field is required."; <div NO ID> "Postcode field is required."; <div NO ID> "Rows field is required."; <div NO ID> "Rows field is required."; <div NO ID> "Email address field is required."; <div NO ID> "Email address field is required."; <div NO ID> "Custom ID field is required."
- Summary links: "Name" -> #edit-name (1 target); "Message" -> #edit-message (1 target); "Choice" -> #edit-choice (1 target); "Colour" -> #edit-colour (1 target); "Features" -> #edit-features (1 target); "Tag 1" -> #edit-tags-tag0 (1 target); "Tag 2" -> #edit-tags-tag1 (1 target); "Phone" -> #edit-phone (1 target); "Street" -> #edit-street (1 target); "Postcode" -> #edit-postcode (1 target); "Rows" -> #edit-table-select (1 target); "Email address" -> #edit-email-primary (1 target); "Email address" -> #edit-email-secondary (1 target); "Custom ID" -> #lab-custom-id (1 target)
- Summary link click focus: input#edit-name

## axe-core

- initial: 2 → 2 (label 2)
- invalid: 2 → 2 (label 2)
- invalid-repeat: 2 → 2 (label 2)
- identical-text: 2 → 2 (label 2)
- partial-correction: 2 → 2 (label 2)
- ajax-add-more: 2 → 2 (label 2)
- valid-submit: 2 → 2 (label 2)
- disable-inline-form-errors: 2 → 2 (label 2)
- two-instances: 4 → 4 (label 4)

## Context

| | Before | After |
|---|---|---|
| Core commit | `0387fb94 2026-11-25` | `0387fb94 2026-11-25` |
| Drupal, PHP | 12.0-dev, 8.5.7 | 12.0-dev, 8.5.7 |
| Profile; default / admin theme (config) | standard; default_admin / default_admin | standard; default_admin / default_admin |
| Theme that rendered each page | /user/1/edit → default_admin<br>/form-test/error-association → default_admin<br>/form-test/error-association/no-ife → default_admin<br>/form-test/error-association/two → default_admin | /user/1/edit → default_admin<br>/form-test/error-association → default_admin<br>/form-test/error-association/no-ife → default_admin<br>/form-test/error-association/two → default_admin |
| Languages (default) | none (en) | none (en) |
| Modules only on this side | none | none |
| Enabled modules | 41 | 41 |


## AJAX responses

Every Drupal AJAX response, in order; raw commands in `ajax-before.json` and `ajax-after.json`.

**Before** (1 response)

- `/form-test/error-association?ajax_form&_wrapper_format` 200: update_build_id, insert

**After** (1 response)

- `/form-test/error-association?ajax_form&_wrapper_format` 200: update_build_id, insert

