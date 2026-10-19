# #3587661 display checkbox label, before (DRAFT)

2026-10-19T22:35:25.607Z, http://127.0.0.1:8891/node/add/article, Chromium 141.0.7390.37, theme `default_admin`, axe-core 4.14.0. A real .txt file was uploaded into each field first.

| Field | In the multiple-value table | `<label>` (class) | aria-label | Accessible name (Chromium) | Virtual screen reader (synthetic) | axe "label" |
|---|---|---|---|---|---|---|
| field_files_two (two values, not required) | yes, column "Display" | **none** | none | **empty** | "checkbox, checked" | **fails** |

Not on this form (the recipe no longer adds them): field_files_required, field_file_single.

All axe violations (WCAG 2.0 to 2.2 A/AA): label (1).

Screenshots: [field_files_two](field_files_two.png).
