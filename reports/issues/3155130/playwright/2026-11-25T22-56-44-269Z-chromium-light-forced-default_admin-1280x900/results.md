# #3155130 browser evaluation: 3155130-contrib

DRAFT. chromium 159.0.8154.6, light, forced colours, default_admin, 1280x900. Core {"before":"d29add7e 2026-09-30","after":"d29add7e 2026-09-30"}. Module 89c4282cf252. Real keyboard input; no screen reader.

| Check | Before | After |
|---|---|---|
| Toggles inside a label | 4 | 0 |
| Disclosure buttons | 4 | 4 |
| Summary before the Body value | true | true |
| Collapsed summary visible | false | false |
| aria-expanded on the Body control | ,,, | false,false,false,false |
| aria-controls on the Body control | ,,, | edit-field-body-0-summary-content,edit-field-notes-0-summary-content,edit-field-notes-1-summary-content,edit-field-notes-2-summary-content |
| Body summary label | Summary | Summary for Body |
| Required summary label (visible field) | Summary | Summary for Required summary |
| Body toggle immediately before its content | false | true |
| Toggle reached by Tab from Title | true | true |
| Focus kept after Enter | false | true |
| Focus kept after Space | n/a | true |
| Summary kept after Save and Edit | true | true |
| Summary kept after collapse and Save | true | true |
| Submitted summary name | field_body[0][summary] | field_body[0][summary] |
| Required summary has a disclosure | 0 | 0 |
| Required summary error visible | true | true |
| axe violations, collapsed | 0 | 0 |
| axe violations, expanded | 0 | 0 |
| Theme override class | true | true |
| Theme override button text | Edit summary | Custom override: Edit summary for Body |

Screenshots, ARIA snapshots and `results.json` are in this folder. Page errors: {"before":[],"after":[]}.
