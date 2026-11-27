# Screen reader evidence for #3419891

**DRAFT.** Written 2026-11-26. A person has not reviewed it.

Tool: `tools/playwright/screenreader-3419891.mjs` — Guidepup virtual screen reader (`@guidepup/virtual-screen-reader` 0.x) over a jsdom snapshot of the live alternative text form, captured in Chromium. This documents semantics only. **No real VoiceOver or NVDA session was run**, and no OS screen reader is involved.

## Results

| | B — MR only (`3419891-pinned`) | C — MR + follow-up (`3419891-followup`) |
|---|---|---|
| Field announced as | `textbox, Alternative text` | `textbox, Alternative text` |
| Label association | label "Alternative text" for the textarea | same |
| Save on first open (empty) | `button, Save, disabled` | `button, Save, disabled` |
| Typed eight lines | 136 px | 136 px |
| Reopened after Cancel: value / height | `''` / 136 px | `''` / 32 px |
| Save after reopening | **`button, Save` (enabled)** | **`button, Save, disabled`** |

Transcripts:

- [`screenreader/2026-11-26T21-18-29-298Z-3419891-pinned/`](screenreader/2026-11-26T21-18-29-298Z-3419891-pinned/) — MR only.
- [`screenreader/2026-11-26T21-18-24-847Z-3419891-followup/`](screenreader/2026-11-26T21-18-24-847Z-3419891-followup/) — MR + follow-up.

Each directory has `results.json` (phrases, value, height, Save state) and `SUMMARY.md`.

## Phrase order on first open (C)

```
form
button, Decorative image, not pressed
textbox, Alternative text
button, Save, disabled
button, Cancel
end of form
```

The field is exposed as a multiline text box with the label "Alternative text". Decorative image is a toggle button before the field; Save is disabled while the field is empty; Cancel follows.

## What this does and does not prove

- Proves: the control's accessible name is "Alternative text"; its role is a text box; the label is associated; Save's disabled state is exposed to the accessibility tree and changes correctly with the value only with the follow-up.
- Does not prove: the spoken experience of a real screen reader. The virtual reader walks a DOM snapshot; it does not exercise VoiceOver's own navigation, verbosity, or Safari integration.
- Real VoiceOver with Safari, reading existing long text, navigating inside it, reaching Save and Cancel, and focus restoration after cancel/save were **not tested**. They remain open manual checks for a person.

## Not tested

- Real VoiceOver/Safari pass (spoken phrases and navigation actions).
- NVDA on Windows.
- Screen reader navigation inside a long, scrolled textarea.
- Whether the balloon's screen-reader output changes at narrow widths or forced colours.
