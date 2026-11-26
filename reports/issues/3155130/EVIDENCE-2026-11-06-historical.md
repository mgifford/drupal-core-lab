# Evidence: issue 3155130

Status: **DRAFT.** One automated run on 2026-11-06; no person has reviewed it, and no screen reader, other browser, forced-colours or
dark-mode pass was done.

## What was tested

The 2020 patch (`core-summary-a11y-3155130-6.patch`, comment #6, nod_) wraps the summary field in a `<details>` element and deletes
`text.js`. It cannot apply to current core: `text_with_summary` and its widget were moved to their own module on 2026-08-31 (#3549134)
and removed on 2026-09-02 (#3620228). The lab therefore pins core at **f48d0a58b3ec** (2026-08-31, the last commit with the widget)
and applies a **port** of the patch's intent (`branches/3155130-ported-f48d0a58.patch`, written in the lab, not an MR). The port
keeps the original's design, including the `name` change its author warned about, so it tests the 2020 idea, not a corrected one.

Variant `3155130-pinned`; recipe `repro_3155130` (a Basic page with Body, one value, and Notes, three values, both Text (formatted,
long, with summary)). Before = core; After = core plus the port.

## Results (as loaded, then real keyboard input; Chromium 156)

| | Before | After |
|---|---|---|
| Summary field name | `field_body[0][summary]` | `field_body[0][container][summary]` |
| Toggle button inside the Body label | yes ("Edit summary") | no |
| Summary inside a `<details>` element | no | yes |
| Summary shown when the form loads | no (hidden) | **yes (open on a new node)** |
| Summary field comes before the Body field | yes | yes |
| Tab from Title reaches | button "Edit summary" | summary "Summary" |
| After Enter | button removed, focus falls to `<body>` | disclosure closes, focus stays on it |
| Summary still there after Save and Edit | yes | **no (saved as empty)** |

- Accessibility tree, as loaded (`tree-diff/3155130-pinned/`): Before has the button inside the Body label text ("Body ( Edit summary )",
  and the same in each of the three Notes rows). After has `button "Summary" expanded controls=...` in a group above the Body label,
  and a textbox "Summary". 3 of 3 views differ (accessibility tree, ARIA, speech: +36 / -24 spoken lines).
- Page diff (`compare/3155130-pinned/`): 2 of 187 items differ (the form markup); the CSS and JavaScript served are otherwise equal.
- Real-input run: `playwright/2026-11-06T03-46-30-534Z/results.md` and `results.json`, screenshots next to them. Script: `tools/playwright/evaluate-3155130.mjs`.

## What it shows

1. The port removes the invalid button-in-label and gives the disclosure native semantics (expanded state, Enter works, focus stays).
2. It **breaks saving the summary**: the renamed field is dropped on Save (confirmed with the details open, so not a typing problem).
3. It **opens the summary by default** on a new node (the port, like the original, tests `summary !== ''`, which is true for `NULL`).
4. The summary still comes before the Body field, which the issue lists as a problem.

## Not verified

- A person's keyboard pass and any real screen reader (VoiceOver, NVDA, JAWS); Firefox, Safari; dark mode, forced colours, mobile width.
- The 2020 patch itself: it does not apply to this or any current core, so only the port was run.
- Whether a corrected version (keeping the field name) would pass: not written.
- The multi-value case was loaded (three Notes rows in the tree diff) but not operated with the keyboard or saved.
- Relevance: the widget is no longer in core, so a fix belongs in whatever project now ships it. Check that before any comment.
