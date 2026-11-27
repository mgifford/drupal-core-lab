# Playwright evidence: #2847425 (2847425-pinned)

Run 2026-11-26T22:08:09.199Z. Core Before `0387fb948f 2026-11-25`, After `0387fb948f 2026-11-25` plus `2847425-fixture-extend.patch`. chromium 159.0.8154.6, light, 1280x900, darwin arm64. Real clicks, real Tab presses, real file inputs (Playwright setInputFiles), axe-core WCAG 2.0 to 2.2 A/AA. Recorders: tools/playwright/lib/lab-run.mjs.

Rule: **fix** rows differ as intended; **regression** rows match on both sides; **observe** and **context** rows are recorded, not judged.

| Type | Check | Before | After | Verdict |
|---|---|---|---|---|
| context | Theme that rendered the form | default_admin | default_admin | recorded |
| fix | Managed file whose visible state is false is hidden on load | no | yes | as expected |
| regression | The details textfield is visible on load | yes | yes | as expected |
| fix | After checking the visibility trigger the visible file hides and the hidden one shows | no | yes | as expected |
| regression | The details textfield stays visible after the toggles change | yes | yes | as expected |
| fix | Required marker and required attribute after checking the requirement trigger | no | yes | as expected |
| fix | The inverse "optional" state is not required on load and is required when its trigger is checked | no | yes | as expected |
| observe | data-drupal-states ownership on load: single_required | none | wrapper+upload | recorded |
| observe | data-drupal-states ownership on load: single_hidden (visibility) | missing | missing | recorded |
| observe | data-drupal-states ownership after a file exists: combined | none | wrapper+fids | recorded |
| observe | Server-rendered wrapper attributes while required: required/disabled present? | no/no | required/no | recorded |
| observe | After the upload: required attribute on the wrapper <div> / on the hidden file IDs input | no / no | no / no | recorded |
| regression | A managed file without states stays visible, optional and enabled | yes/no/no | yes/no/no | as expected |
| fix | The file input is disabled after checking the disabled trigger | no | yes | as expected |
| observe | Dangling label[for] references after a file exists | edit-combined-upload---QKR_FK8A3I | edit-combined-upload--teCfu-Rg15c | recorded |
| regression | Duplicate IDs on load | none | none | as expected |
| fix | The visibility trigger still controls the element after the AJAX replacement (hidden when unchecked) | no | yes | as expected |
| observe | Required marker after the AJAX upload, and after the trigger is changed again (#1091852) | no -> no | no -> yes | recorded |
| observe | Required marker after removing the last file, and after its trigger is changed again | no -> no | no -> yes | recorded |
| regression | The invalid upload shows an error and a valid one is then accepted | yes/yes | yes/yes | as expected |
| observe | Focus after the AJAX upload / after removal | input#edit-toggle / input#edit-toggle-required | input#edit-toggle / input#edit-toggle-required | recorded |
| observe | First trigger reached with real Tab presses, and its focus indicator | yes (42) solid 4px rgb(0, 125, 250) | yes (39) solid 4px rgb(0, 125, 250) | recorded |
| regression | Non-control elements with a disabled attribute on /form-test/disabled-elements | div.form-item.form-datetime-wrapper | div.form-item.form-datetime-wrapper, div#edit-managed-file.js-form-managed-file.form-managed-file.is-single.has-upload.no-value.no-meta | **NOT as expected** |
| regression | [disabled] elements on /form-test/disabled-elements (the FormTest count) | 45 | 46 | **NOT as expected** |
| regression | The disabled managed_file control itself is still disabled on /form-test/disabled-elements | yes | yes | as expected |
| regression | axe violations (elements) on load / after the upload | 0 / 3 | 0 / 3 | as expected |
| regression | JavaScript errors | 0 | 0 | as expected |

## State ownership, per element and moment

Each cell names the element(s) that carry `data-drupal-states`: "wrapper" is the `div.js-form-managed-file`, "upload" the `<input type="file">`, "fids" the hidden file-IDs input.

| Element | Before load | After load | Before, file present | After, file present |
|---|---|---|---|---|
| single_required | none | wrapper+upload | none | wrapper+upload |
| managed_file_initially_hidden | none | wrapper+upload | none | wrapper+upload |
| combined | none | wrapper+upload | none | wrapper+fids |
| single_disabled | none | wrapper+upload | none | wrapper+upload |
| multi_required | none | wrapper+upload | none | wrapper+upload |

## Label and description associations on load

| Element | Side | label | label for | resolves | aria-describedby resolves | description |
|---|---|---|---|---|---|---|
| managed_file_initially_visible | Before | Managed File Initially Visible | edit-managed-file-initially-visible-upload | yes | yes | Description for the initially visible managed file. |
| managed_file_initially_visible | After | Managed File Initially Visible | edit-managed-file-initially-visible-upload | yes | yes | Description for the initially visible managed file. |
| managed_file_initially_hidden | Before | Managed File Initially Hidden | edit-managed-file-initially-hidden-upload | yes | yes | Description for the initially hidden managed file. |
| managed_file_initially_hidden | After | Managed File Initially Hidden | edit-managed-file-initially-hidden-upload | yes | yes | Description for the initially hidden managed file. |
| managed_file_initially_optional | Before | Managed File Initially Optional | edit-managed-file-initially-optional-upload | yes | yes | Description for the initially optional managed file. |
| managed_file_initially_optional | After | Managed File Initially Optional | edit-managed-file-initially-optional-upload | yes | yes | Description for the initially optional managed file. |
| single_required | Before | Single file, conditional requirement | edit-single-required-upload | yes | yes | Description for the single file with conditional requirement. |
| single_required | After | Single file, conditional requirement | edit-single-required-upload | yes | yes | Description for the single file with conditional requirement. |
| single_optional_inverse | Before | Single file, conditional optional | edit-single-optional-inverse-upload | yes | yes | Description for the single file with the inverse optional state. |
| single_optional_inverse | After | Single file, conditional optional | edit-single-optional-inverse-upload | yes | yes | Description for the single file with the inverse optional state. |
| multi_visible | Before | Multiple files, conditional visibility | edit-multi-visible-upload | yes | yes | Description for the multiple files with conditional visibility. |
| multi_visible | After | Multiple files, conditional visibility | edit-multi-visible-upload | yes | yes | Description for the multiple files with conditional visibility. |
| multi_required | Before | Multiple files, conditional requirement | edit-multi-required-upload | yes | yes | Description for the multiple files with conditional requirement. |
| multi_required | After | Multiple files, conditional requirement | edit-multi-required-upload | yes | yes | Description for the multiple files with conditional requirement. |
| single_disabled | Before | Single file, conditional disabled | edit-single-disabled-upload | yes | yes | Description for the single file with conditional disabled state. |
| single_disabled | After | Single file, conditional disabled | edit-single-disabled-upload | yes | yes | Description for the single file with conditional disabled state. |
| multi_disabled | Before | Multiple files, conditional disabled | edit-multi-disabled-upload | yes | yes | Description for the multiple files with conditional disabled state. |
| multi_disabled | After | Multiple files, conditional disabled | edit-multi-disabled-upload | yes | yes | Description for the multiple files with conditional disabled state. |
| combined | Before | Combined visibility and requirement | edit-combined-upload | yes | yes | Description for the combined visibility and requirement file. |
| combined | After | Combined visibility and requirement | edit-combined-upload | yes | yes | Description for the combined visibility and requirement file. |
| no_states_file | Before | Managed file without states | edit-no-states-file-upload | yes | yes | Description for the managed file without states. |
| no_states_file | After | Managed file without states | edit-no-states-file-upload | yes | yes | Description for the managed file without states. |
| validated_file | Before | Validated single file | edit-validated-file-upload | yes | yes | Only .txt files up to 1 KB are accepted. |
| validated_file | After | Validated single file | edit-validated-file-upload | yes | yes | Only .txt files up to 1 KB are accepted. |
| managed_file_in_details | Before | Managed File In Details | edit-managed-file-in-details-upload | yes | yes | Description for the managed file inside details. |
| managed_file_in_details | After | Managed File In Details | edit-managed-file-in-details-upload | yes | yes | Description for the managed file inside details. |
| unrelated_in_details | Before | Unrelated managed file in details | edit-unrelated-in-details-upload | yes | yes | Description for the unrelated managed file inside details. |
| unrelated_in_details | After | Unrelated managed file in details | edit-unrelated-in-details-upload | yes | yes | Description for the unrelated managed file inside details. |
| managed_file_in_fieldset | Before | Managed file in fieldset | edit-managed-file-in-fieldset-upload | yes | yes | Description for the managed file inside a fieldset. |
| managed_file_in_fieldset | After | Managed file in fieldset | edit-managed-file-in-fieldset-upload | yes | yes | Description for the managed file inside a fieldset. |
| managed_file_in_container | Before | Managed file in container | edit-managed-file-in-container-upload | yes | yes | Description for the managed file inside a container. |
| managed_file_in_container | After | Managed file in container | edit-managed-file-in-container-upload | yes | yes | Description for the managed file inside a container. |

## Through the AJAX lifecycle

| | Before | After |
|---|---|---|
| Upload control rendered after the upload | no | no |
| File link rendered after the upload | yes | yes |
| Element hidden again when the visibility trigger is unchecked after the upload | no | yes |
| Upload control back after removing the last file | yes | yes |
| Required attribute after removing the last file | no | no |
| Required attribute after the trigger is changed again | no | yes |
| Dangling label[for] after the upload | edit-combined-upload---QKR_FK8A3I | edit-combined-upload--teCfu-Rg15c |
| Focus before / after the upload | input#edit-toggle / input#edit-toggle | input#edit-toggle / input#edit-toggle |
| Focus before / after the removal | input#edit-toggle-required / input#edit-toggle-required | input#edit-toggle-required / input#edit-toggle-required |
| Error after the invalid upload | Error message The specified file too-big-mwy3t9t9-3nwjm.txt could not be uploaded.The file is 2 KB exceeding the maximum file size of 1 KB. Hide | Error message The specified file too-big-mwy3tjf1-bjwia.txt could not be uploaded.The file is 2 KB exceeding the maximum file size of 1 KB. Hide |

> After an AJAX replacement the new dependents do not receive the dependees' current state until a trigger changes (core issue #1091852). The rows above record that; they do not treat it as this MR's regression.

## Screenshots

- `before-1-load.png` / `after-1-load.png`
- `before-2-visible.png` / `after-2-visible.png`
- `before-3-required.png` / `after-3-required.png`
- `before-4-disabled.png` / `after-4-disabled.png`
- `before-5-after-upload.png` / `after-5-after-upload.png`
- `before-6-after-remove.png` / `after-6-after-remove.png`
- `before-7-invalid.png` / `after-7-invalid.png`
- `before-8-form-test-disabled.png` / `after-8-form-test-disabled.png`

## Context

| | Before | After |
|---|---|---|
| Core commit | `0387fb948f 2026-11-25` | `0387fb948f 2026-11-25` |
| Drupal, PHP | 12.0-dev, 8.5.7 | 12.0-dev, 8.5.7 |
| Profile; default / admin theme (config) | standard; default_admin / default_admin | standard; default_admin / default_admin |
| Theme that rendered each page | /user/1/edit → default_admin<br>/file-test-states-form → default_admin<br>/form-test/disabled-elements → default_admin | /user/1/edit → default_admin<br>/file-test-states-form → default_admin<br>/form-test/disabled-elements → default_admin |
| Languages (default) | none (en) | none (en) |
| Modules only on this side | none | none |
| Enabled modules | 41 | 41 |

## AJAX responses

Every Drupal AJAX response, in order; raw commands in `ajax-before.json` and `ajax-after.json`.

**Before** (5 responses)

- `/file-test-states-form?element_parents&ajax_form&_wrapper_format` 200: settings, update_build_id, insert:replaceWith
- `/file-test-states-form?element_parents&ajax_form&_wrapper_format` 200: settings, update_build_id, insert:replaceWith
- `/file-test-states-form?element_parents&ajax_form&_wrapper_format` 200: settings, update_build_id, insert:replaceWith
- `/file-test-states-form?element_parents&ajax_form&_wrapper_format` 200: settings, update_build_id, insert:replaceWith [markup has alert]
- `/file-test-states-form?element_parents&ajax_form&_wrapper_format` 200: settings, update_build_id, insert:replaceWith

**After** (5 responses)

- `/file-test-states-form?element_parents&ajax_form&_wrapper_format` 200: settings, update_build_id, insert:replaceWith
- `/file-test-states-form?element_parents&ajax_form&_wrapper_format` 200: settings, update_build_id, insert:replaceWith
- `/file-test-states-form?element_parents&ajax_form&_wrapper_format` 200: settings, update_build_id, insert:replaceWith
- `/file-test-states-form?element_parents&ajax_form&_wrapper_format` 200: settings, update_build_id, insert:replaceWith [markup has alert]
- `/file-test-states-form?element_parents&ajax_form&_wrapper_format` 200: settings, update_build_id, insert:replaceWith

## What could be announced

`Drupal.announce()` calls, and text changes inside live regions (role alert/status/log or aria-live). A recorded change is not proof that a screen reader spoke it; see the screen-reader run for that.

| Side | Source | Politeness | Text |
|---|---|---|---|
| before | none | | |
| after | none | | |

## Changes after input, and how a screen reader learns of them

After each click, key press or typing, the text that appeared or changed on the page. **Silent**: not in a live region, no `Drupal.announce()` after the same action, focus did not move to it, and the control pressed did not disclose it. A silent change is a candidate for WCAG 2.2 SC 4.1.3 Status Messages, for a person to judge: not every change is a status message. See docs/SILENT-CHANGES.md.

| | Side | Page | After | Text (first; last) | Where | Times |
|---|---|---|---|---|---|---|
| **new in After** | after | `/file-test-states-form` | click input#edit-toggle "Toggle fields" | Description for the initially hidden managed file. | `div#edit-managed-file-initially-hidden--descripti…` | 2 |
| **new in After** | after | `/file-test-states-form` | click input#edit-toggle "Toggle fields" | Description for the multiple files with conditional visibility. | `div#edit-multi-visible--description` | 2 |
| **new in After** | after | `/file-test-states-form` | click input#edit-toggle "Toggle fields" | Description for the combined visibility and requirement file. | `div#edit-combined--description` | 1 |
| **new in After** | after | `/file-test-states-form` | click input#edit-toggle "Toggle fields" | Description for the managed file inside details. | `div#edit-managed-file-in-details--description` | 2 |
| **new in After** | after | `/file-test-states-form` | click input#edit-toggle "Toggle fields" | Description for the managed file inside a container. | `div#edit-managed-file-in-container--description` | 2 |
| **new in After** | after | `/file-test-states-form` | click input#edit-toggle "Toggle fields" | Description for the initially visible managed file. | `div#edit-managed-file-initially-visible--descript…` | 1 |
| **new in After** | after | `/file-test-states-form` | click input#edit-toggle "Toggle fields" | combined-mwy3ti8x-2w2qf.txt (16 bytes) | `span.file.file--mime-text-plain` | 1 |
| **new in After** | after | `/file-test-states-form` | click input#edit-toggle "Toggle fields" | Description for the combined visibility and requirement file. | `div#edit-combined--wmd7qCDRQow--description` | 1 |
| on both sides | after | `/file-test-states-form` | key Tab a.breadcrumb__link "Back to site" | combined-mwy3ti8x-2w2qf.txt (16 bytes) | `span.file.file--mime-text-plain` | 1 |
| on both sides | after | `/file-test-states-form` | click input#edit-toggle-required "Toggle requirement" | single-mwy3tj13-k7xu9.txt (14 bytes) | `span.file.file--mime-text-plain` | 1 |

Before: 0 in a live region, 0 Drupal.announce() after the same action, 0 focus moved to it, 0 shown by the control pressed (expanded), 0 inside the control itself, 0 the name of a control that appeared or changed, 2 silent.
After: 0 in a live region, 0 Drupal.announce() after the same action, 0 focus moved to it, 0 shown by the control pressed (expanded), 0 inside the control itself, 11 the name of a control that appeared or changed, 14 silent.

axe rules: Before {} then {"color-contrast":3}, After {} then {"color-contrast":3}. JavaScript errors: Before [], After [].

**2 judged row(s) not as expected**: read the table before drawing a conclusion.

---
Automated evidence is a DRAFT: DOM, AJAX and axe checks do not replace a keyboard and screen-reader pass by a person.
