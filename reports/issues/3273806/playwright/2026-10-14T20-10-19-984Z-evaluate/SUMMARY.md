# #3273806 evaluate (live Toolbar) — 3273806-latest

Generated 2026-10-14T20:12:31.769Z.
Before: `baseline-3273806` @ 530d8959  ·  After: `issue-3273806` @ 530d8959
Page: /admin/content, Toolbar management tray open. Viewport 1280.

## Orientation toggle icon

| | Before | After |
|---|---|---|
| Toggle found | true | true |
| Rest icon colour | #bebebe | #787878 |
| Focus outline (keyboard) | none | 2px solid rgb(0, 125, 250) |

## Screenshots
- {before,after}-toolbar.png — the toolbar with the management tray open
- {before,after}-toggle-rest.png — the orientation toggle icon at rest
- {before,after}-toggle-focus.png — the orientation toggle with keyboard focus

## Reading
- Before: rest icon should be `#bebebe` (1.7:1, fails WCAG 1.4.11) and no focus outline.
- After: rest icon should be `#787878` (4.05:1, passes) and a visible `:focus-visible` outline.
