# Human testing checklist for #3545814

**DRAFT.** For a person to confirm independently. Do not treat the automated runs as a substitute.

Setup: `node scripts/lab-env.mjs start 3545814-pinned`, then open https://drupal-compare.ddev.site (or `http://localhost:8100`). Log in both frames, press Go, then turn **Mirror off** before using the keyboard.

## Without the change (Before)

1. Open `/repro-3545814` in the left frame.
2. Tab to the numeric value field under `ID (exposed operator)`. Does your screen reader announce a name for it? Expected: no name, only the role and the fieldset legend.
3. Tab to the `Content type` select and the `Tags` select. Expected: no name.
4. Confirm the `ID (fixed operator)` filter has a visible label and no fieldset.

## With the change (After)

5. Repeat steps 2–4 in the right frame. Expected: `Value`, `Content types` and `Select terms from vocabulary Tags` are announced; `Operator` is announced for each operator select.
6. Check that no label is announced twice (once by the fieldset legend, once by the control) in a way that confuses the filter.
7. Confirm the `ID (fixed operator)` filter looks and reads exactly as before.

## Visual and layout

8. Compare the numeric filter's fieldset in both frames. The MR alone adds a visible `Value` label and 18 px of height; proposal C does not. Which is acceptable for this issue?
9. Check light and dark mode, forced colours and a 480 px viewport.
10. Confirm nothing shifts when switching operators (equal, between, empty) and that `Min`/`Max` remain labelled.

## Behaviour

11. Submit `ID > 2`, `ID between 2 and 3`, `ID empty`, `Content type = Article`, `Tags = News`, and `ID (fixed) = 3`. Expected on both sides: Gamma/Delta, Beta/Gamma, none, all four, Alpha/Beta, Gamma.
12. Open `/admin/structure/views/view/repro_3545814/edit`, press **Update preview** and repeat steps 2–5 there.

## Assistive technology

13. Repeat steps 2–6 with a real screen reader (VoiceOver, NVDA or JAWS) in Chrome and Safari or Firefox. Record the announcement verbatim.
14. Confirm the form submits with the keyboard alone and that focus stays visible.

## Not covered by the automated run

Firefox, a real screen reader, touch, translation, a subdirectory install, and a date/string/boolean filter. Add a note if you test any of them.

Record the browser, OS, screen reader and version next to each answer. Save the viewer log in `reports/issues/3545814/manual/`.
