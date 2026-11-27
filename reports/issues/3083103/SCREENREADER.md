# Screen reader: #3083103

Status: **virtual screen reader only. A real NVDA/VoiceOver pass was not done.** A virtual screen reader is
evidence of semantics, not of speech; a person's review is better.

## What was run

`tools/playwright/screenreader-3083103.mjs 3083103-latest` on 2026-11-26. The Guidepup virtual screen reader
read a jsdom snapshot of the invalid form, in `default_admin`, Before and After MR !15692.
Output: `reports/issues/3083103/screenreader/2026-11-26T06-43-46-673Z/`.

### Around the Name field

| Side | Phrases |
|---|---|
| Before | `Name` → `textbox, Name, Your full name., invalid, required` → `Name field is required.` → `Your full name.` |
| After (MR !15692) | identical |

The error is a separate node after the field. It is **not** part of the textbox's name or description on
either side, which matches the DOM finding: in `default_admin` the error container has no `id`, so the
`aria-errormessage`/`aria-describedby` the MR adds does not resolve.

Caveat: the virtual reader does not demonstrate `aria-errormessage` support, and jsdom has no layout or
live regions. This run cannot show whether a real screen reader would announce the error, or announce it
twice, if the target existed.

## Not done

- NVDA with Firefox or Chrome (Windows). No machine available in this lab.
- VoiceOver with Safari (macOS). Guidepup's VoiceOver driver is installed but was not run; it speaks aloud
  and needs `npx @guidepup/setup install` once.
- Live-region announcements after an AJAX validation response.
- Keyboard pass.

## Reproducible manual test

For NVDA (Firefox or Chrome), after building the environments:

1. Enable Inline Form Errors and open `/form-test/error-association` on both sites.
2. Submit with every field empty. Note what is announced immediately (summary) and what is **not**.
3. Tab to the Name field. Record the spoken name, state ("invalid") and description.
4. Shift+Tab away and back. Record whether the error is spoken again.
5. Follow the "Name" summary link. Record where focus lands and what is spoken.
6. Correct Name and submit again; return to the field and record whether "invalid" and the error are gone.
7. Repeat on the Colour radio group and the Features checkbox group. Record whether the error is attached to
   the group or to each option.
8. Repeat with Inline Form Errors disabled.

For VoiceOver (Safari): the same steps with VO+arrow navigation, paying attention to whether the error is
read as part of the field or as the next item.

Expected from the 2026-11-26 DOM: in `default_admin` with IFE enabled, the error is not associated at all,
so the field's description is only the help text; with IFE disabled, MR !15692 points at the messages region,
so the error may be read as part of the field's description only if the reader follows the reference out of
the form.

Record the tool versions, OS and browser with the result. Do not use a virtual reader result as a substitute.
