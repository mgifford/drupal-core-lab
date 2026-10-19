# Changes after input that nothing announces

Every evaluator run (`tools/playwright/evaluate-<nid>.mjs` on `lib/lab-run.mjs`) records, after each real click, key press or
typing, the text that appeared or changed on the page and how a screen reader user would learn of it. A change nothing tells them
about is **silent**: a candidate for [WCAG 2.2 SC 4.1.3 Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html),
which asks that a status message (a result, an error, progress, "3 items found") be announced without moving focus. In Drupal that
is `Drupal.announce()` or a live region.

Nothing to run separately: the recorder is in every page of every run since 2026-10-19. The run's `SUMMARY.md` has a section
**Changes after input, and how a screen reader learns of them** (evaluators that use `speechMarkdown()`), and `results.json` has
each action in `sides.<side>.speech.changes`.

## How each change is sorted

| How | Meaning | Flagged? |
|---|---|---|
| in a live region | Inside `[aria-live]`, `role` alert, status, log, marquee or timer, or `<output>`: announced. | no |
| `Drupal.announce()` | `Drupal.announce()` was called after the same action. (The text may differ from what appeared; the call is listed in "What could be announced".) | no |
| focus moved to it | Focus moved to it or into the dialog holding it, or it describes the focused control (`aria-describedby`, `aria-errormessage`, ...). | no |
| shown by the control pressed | Inside what the pressed control now shows as expanded (`aria-expanded="true"` + `aria-controls`, or an opened `<details>`): the user asked for it and heard "expanded". | no |
| inside the control itself | The pressed or focused control's own text changed (a "Show" that became "Hide"). A screen reader may not say it again; listed for a person. | listed |
| the name of a control | A button, link, tab or field label that appeared or changed (a toolbar that regroups when there is room shows these). A new control is not a status message. | no |
| **silent** | None of the above. | **yes** |

The summary compares the sides: **new in After** (a regression to look at), **gone in After** (often what the change fixed), on
both sides (not this change's doing). Typing into a field, one window per key, is one row with how many times the text changed.

## How it works

`tools/playwright/lib/recorder.mjs` runs in the page before Drupal's scripts. A trusted pointer press, key press or input event
opens a window; the next action, the run collecting, or 10 seconds closes it. At each end it lists every text node the page renders
(visually hidden text included; `<select>` options and field values left out) and counts as new only text that nothing shown
before accounts for: text that became visible is new, text an AJAX response rendered again unchanged is not. New text is grouped by
its nearest block, and the smallest element holding it is named in `Where`. Each finished window goes to the run at once, so a
later page load does not lose it. What was typed is never recorded; controls are named by their label.

`tools/playwright/lib/silent-changes.mjs` groups the windows and writes the summary section. Tests: `tests/lab/silent-changes.test.mjs`
(a page with one case of each kind, driven by real Playwright input).

## First results (2026-10-19, throwaway sites on core `main` `f2abd414`, not DDEV)

- **#3619154, MR !16911 at `175e6f17`** (the evaluator run through a stand-in for DDEV): Before, the sidebar's keyboard shortcut
  (Alt+S) shows the sidebar's content silently (focus stays where it was; nothing announced): 4 silent changes. After, the same
  shortcut moves focus into the sidebar, so all four are **gone in After**. The toggle's own text ("Hide/Show sidebar panel")
  changes on Before only, as the tree diff shows.
- **Core, the same on both sides** (a probe of a few admin pages, for a person to check against drupal.org before anything else):
  - the machine-name preview while typing a content type's name ("Machine name: recipe_card") is silent;
  - the password suggestions ("Recommendations to make your password stronger:" and its tips) appear silently, while the
    strength ("Weak") and "Passwords match: no" are in live regions;
  - the modules and permissions filters and the content list's select-all call `Drupal.announce()`, as they should.

## Limits

- Only what the evaluator's steps do: a page no step touches is not checked, and an issue without an evaluator has no record.
- Removed text is not listed (a message that disappeared, rows a filter hid); `Drupal.announce()` calls are, in "What could be
  announced".
- Chromium only, the page's rendered text only: a change of state with no text (an icon, a colour) is not seen, and neither is
  a change a screen reader does not reach for other reasons (`aria-hidden`).
- A silent change is a candidate. Content revealed below the control pressed, new fields appearing, and changes far from the
  user's attention are often fine; WCAG 4.1.3 is about status messages. A person decides, ideally with a screen reader.
