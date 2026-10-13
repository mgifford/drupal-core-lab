# Virtual screen reader: the "Structure" disclosure button (#3093378, 3093378-latest)

Guidepup virtual screen reader (@guidepup/virtual-screen-reader) over a jsdom snapshot of the toolbar button, closed and after opening the tray. It documents the button's role, accessible name and expanded state. It is **not** a real VoiceOver or NVDA run, and it does not test interaction (the button is read from markup after a real click in the browser).

| Side | Closed | Open |
|---|---|---|
| Before | button, Extend Structure | button, Collapse Structure |
| After | button, Structure menu, not expanded | button, Structure menu, expanded |

**Before and After differ — this is the change under test.**

## Markup snapshots

Before (closed): `<button class="toolbar-icon toolbar-handle" style="opacity: 0;"><span class="action">Extend</span> <span class="label">Structure</span></button>`
Before (open): `<button class="toolbar-icon toolbar-handle open" style=""><span class="action">Collapse</span> <span class="label">Structure</span></button>`
After (closed): `<button aria-expanded="false" class="toolbar-icon toolbar-handle" style="opacity: 0;"><span class="label visually-hidden">Structure menu</span></button>`
After (open): `<button aria-expanded="true" class="toolbar-icon toolbar-handle open" style=""><span class="label visually-hidden">Structure menu</span></button>`

## Read phrases, in order

### Before (closed)
- button, Extend Structure
- Extend
- Structure
- end of button, Extend Structure
- button, Extend Structure
- Extend
- Structure
- end of button, Extend Structure
- button, Extend Structure

### Before (open)
- button, Collapse Structure
- Collapse
- Structure
- end of button, Collapse Structure
- button, Collapse Structure
- Collapse
- Structure
- end of button, Collapse Structure
- button, Collapse Structure

### After (closed)
- button, Structure menu, not expanded
- button, Structure menu, not expanded
- button, Structure menu, not expanded
- button, Structure menu, not expanded
- button, Structure menu, not expanded
- button, Structure menu, not expanded
- button, Structure menu, not expanded
- button, Structure menu, not expanded
- button, Structure menu, not expanded

### After (open)
- button, Structure menu, expanded
- button, Structure menu, expanded
- button, Structure menu, expanded
- button, Structure menu, expanded
- button, Structure menu, expanded
- button, Structure menu, expanded
- button, Structure menu, expanded
- button, Structure menu, expanded
- button, Structure menu, expanded

## Interpretation

Before, the button announces a name that changes with state ("button, Extend Structure" → "button, Collapse Structure") and never announces expanded or collapsed. After, it keeps one name and announces the state ("button, Structure menu, not expanded" → "button, Structure menu, expanded"). This is the disposable evidence that the change conveys state to assistive technology through `aria-expanded` instead of a word swap. Synthetic output; a person must still confirm with a real screen reader.
