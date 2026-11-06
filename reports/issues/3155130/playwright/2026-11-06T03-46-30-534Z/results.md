# #3155130 evaluator: 3155130-pinned

DRAFT. Chromium, real keyboard input (Tab, Enter) and clicks; no screen reader. Core f48d0a58b3 2026-08-31.

| | Before | After |
|---|---|---|
| Summary field name | `field_body[0][summary]` | `field_body[0][container][summary]` |
| Toggle inside a label | true | false |
| Summary inside a details element | false | true |
| Summary visible as loaded | false | true |
| Summary field comes before the Body field | true | true |
| Reached by Tab from Title | button "Edit summary" | summary "Summary" |
| After Enter: focus, summary shown (details open) | body "Skip to main content
    
    "; true | summary "Summary"; false |
| Summary kept after Save and Edit | true ("Summary typed by the evaluator") | false ("") |
