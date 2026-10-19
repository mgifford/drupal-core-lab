# #3587661 display checkbox label, after-mr (DRAFT)

2026-10-19T20:52:48.588Z, http://127.0.0.1:8891/node/add/article, Chromium 141.0.7390.37, theme `default_admin`, axe-core 4.14.0. A real .txt file was uploaded into each field first.

| Field | In the multiple-value table | `<label>` (class) | aria-label | Accessible name (Chromium) | Virtual screen reader (synthetic) | axe "label" |
|---|---|---|---|---|---|---|
| field_files_two (two values, not required) | yes, column "Display" | **none** | "Include file in display" | "Include file in display" | "checkbox, Include file in display, checked" | passes |
| field_files_required (two values, required) | yes, column "Display" | **none** | "Include file in display" | "Include file in display" | "checkbox, Include file in display, checked" | passes |
| field_file_single (one value (control)) | no | "Include file in display" (form-item__label option) | "Include file in display" | "Include file in display" | "checkbox, Include file in display, checked" | passes |

All axe violations (WCAG 2.0 to 2.2 A/AA): none.

Screenshots: [field_files_two](field_files_two.png), [field_files_required](field_files_required.png), [field_file_single](field_file_single.png).
