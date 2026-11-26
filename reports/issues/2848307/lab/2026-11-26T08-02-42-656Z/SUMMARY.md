# #2848307 lab evidence

Generated 2026-11-26T08:02:46.147Z with Chromium 157.0.8103.79 on darwin arm64.
Variant `2848307-latest`, core `0387fb948f786bc344a5cc54aa0d98b8f552e378`.

Screenshots are in this folder: `<side>-<scenario>-<light|dark|forced>.png`.

## uninstall

| | Before | After |
|---|---|---|
| DOM | summary links: []<br>inline errors: 0<br>table: ` describedby=none tabindex=none`<br>invalid controls: 0<br>duplicate IDs: 0 | summary links: [{"text":"Modules to uninstall","href":"#system-modules-uninstall-table"}]<br>inline errors: 1<br>table: `system-modules-uninstall-table describedby=system-modules-uninstall-table--error tabindex=-1`<br>invalid controls: 0<br>duplicate IDs: 0 |
| Summary link focus | {"reached":false,"focused":null,"hash":null} | {"reached":true,"focused":"TABLE","hash":"#system-modules-uninstall-table"} |

Virtual screen reader, first phrases at the table:

- Before: "Filter modules" → "textbox, Filter modules, Enter a part of the module name or description, placeholder Filter by name or description" → "Enter a part of the module name or description" → "table" → "rowgroup" → "row, Uninstall Name Description" → "rowheader, Uninstall" → "rowheader, Name"
- After: "Filter modules" → "textbox, Filter modules, Enter a part of the module name or description, placeholder Filter by name or description" → "Enter a part of the module name or description" → "No modules selected." → "table, No modules selected." → "rowgroup" → "row, Uninstall Name Description" → "rowheader, Uninstall"

## table

| | Before | After |
|---|---|---|
| DOM | summary links: []<br>inline errors: 0<br>table: `edit-table describedby=none tabindex=none`<br>invalid controls: 0<br>duplicate IDs: 0 | summary links: [{"text":"A table with an error","href":"#edit-table"}]<br>inline errors: 1<br>table: `edit-table describedby=edit-table--error tabindex=-1`<br>invalid controls: 0<br>duplicate IDs: 0 |
| Summary link focus | {"reached":false,"focused":null,"hash":null} | {"reached":true,"focused":"TABLE","hash":"#edit-table"} |

Virtual screen reader, first phrases at the table:

- Before: "table, A table with an error" → "caption, A table with an error" → "rowgroup" → "row, Name Value" → "rowheader, Name" → "rowheader, Value" → "end of row, Name Value" → "end of rowgroup"
- After: "table, A table with an error, No rows selected." → "caption, A table with an error" → "rowgroup" → "row, Name Value" → "rowheader, Name" → "rowheader, Value" → "end of row, Name Value" → "end of rowgroup"

## tableselect-checkboxes

| | Before | After |
|---|---|---|
| DOM | summary links: [{"text":"Rows to update","href":"#edit-tableselect"}]<br>inline errors: 2<br>table: `edit-tableselect describedby=none tabindex=none`<br>invalid controls: 2<br>duplicate IDs: 0 | summary links: [{"text":"Rows to update","href":"#edit-tableselect"}]<br>inline errors: 1<br>table: `edit-tableselect describedby=edit-tableselect--error tabindex=-1`<br>invalid controls: 0<br>duplicate IDs: 0 |
| Summary link focus | {"reached":true,"focused":"BODY","hash":"#edit-tableselect"} | {"reached":true,"focused":"TABLE","hash":"#edit-tableselect"} |

Virtual screen reader, first phrases at the table:

- Before: "No rows selected." → "textbox, invalid" → "No rows selected." → "textbox, invalid" → "No rows selected." → "textbox, invalid" → "No rows selected." → "textbox, invalid"
- After: "table, No rows selected." → "rowgroup" → "row, Name Value" → "rowheader" → "textbox, Select all rows in this table" → "end of rowheader" → "rowheader, Name" → "rowheader, Value"

## table-tableselect

| | Before | After |
|---|---|---|
| DOM | summary links: [{"text":"Update Alpha","href":"#edit-table"}]<br>inline errors: 2<br>table: `edit-table describedby=none tabindex=none`<br>invalid controls: 2<br>duplicate IDs: 0 | summary links: [{"text":"No rows selected.","href":"#edit-table"}]<br>inline errors: 1<br>table: `edit-table describedby=edit-table--error tabindex=-1`<br>invalid controls: 0<br>duplicate IDs: 0 |
| Summary link focus | {"reached":true,"focused":"BODY","hash":"#edit-table"} | {"reached":true,"focused":"TABLE","hash":"#edit-table"} |

Virtual screen reader, first phrases at the table:

- Before: "textbox, Update Alpha, invalid" → "No rows selected." → "Update Alpha" → "textbox, Update Alpha, invalid" → "No rows selected." → "Update Alpha" → "textbox, Update Alpha, invalid" → "No rows selected."
- After: "table, No rows selected." → "rowgroup" → "row, Name Value" → "rowheader" → "textbox, Select all rows in this table" → "end of rowheader" → "rowheader, Name" → "rowheader, Value"

The Guidepup virtual screen reader is synthetic evidence over a jsdom snapshot, not a real VoiceOver or NVDA run.
