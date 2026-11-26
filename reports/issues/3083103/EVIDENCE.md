# Evidence: #3083103 programmatic error association

Status: **DRAFT — runtime comparison run 2026-11-26; not reviewed by a person; no real NVDA/VoiceOver pass.**
Everything here is reproducible from [REPRODUCE.md](REPRODUCE.md). Source-level findings that were not
exercised in the browser are in [SOURCE-REVIEW.md](SOURCE-REVIEW.md).

## What was built

| | |
|---|---|
| Core | `main` `0387fb948f786bc344a5cc54aa0d98b8f552e378` (2026-11-25), one shared baseline |
| Baseline | `envs/baseline-3083103` (Standard, `default_admin` default **and** admin theme) + fixture |
| After B | `envs/issue-3083103-15692` = baseline + MR !15692 ported to `main` |
| After C | `envs/issue-3083103-aug6` = baseline + the August 6 proposal ported from 11.4.x |
| Fixture | `branches/3083103-fixture.patch` (test-support, identical on both sides) |
| Browser | Chromium (Playwright 1.59.1), light scheme, 1280×900, logged in as admin |
| axe | `@axe-core/playwright`, WCAG 2.0/2.1/2.2 A+AA tags |

Runs:

| Run | Directory |
|---|---|
| B: MR !15692 | `reports/issues/3083103/playwright/2026-11-26T06-47-46-613Z-chromium-light-1280x900/` |
| C: August 6 | `reports/issues/3083103/playwright/2026-11-26T06-49-21-012Z-chromium-light-1280x900/` |
| Virtual screen reader (B) | `reports/issues/3083103/screenreader/2026-11-26T06-43-46-673Z/` |

## The defect, as rendered

Standard's `system.theme.yml` sets **`admin: default_admin` and `default: default_admin`**. The runs
record `theme: default_admin` for the fixture page. `default_admin` overrides
`form-element.html.twig`, `details.html.twig` and `fieldset.html.twig`, and its error containers carry
**no `id`**. In the `invalid` scenario the evaluator counted **16 error containers on both sides, every one
with `id: null`**.

Both proposals compute an error ID from the element's `#id` and point ARIA at it. On the default theme the
target is not rendered, so:

| Measurement (invalid submit, IFE enabled) | Before | B: MR !15692 | C: August 6 |
|---|---|---|---|
| Controls with `aria-invalid` | yes (core) | yes | yes |
| Controls with `aria-errormessage` | **none** | yes | yes |
| Error container with that `id` | **none** | **none** | **none** |
| IDREF resolves exactly once | n/a (no refs) | **no** | **no** |

With **Inline Form Errors disabled** (the module is not installed by Standard; the route carries
`#disable_inline_form_errors`):

| | Before | B: MR !15692 | C: August 6 |
|---|---|---|---|
| `aria-errormessage` on the field | none | `edit-name--error-message` | **none** |
| Target | — | **resolves once** (messenger message) | — |
| Target adjacent to the field | — | no (messages region) | — |

So the two proposals fail in *different* places, and neither associates the error in the default
configuration of the default theme:

- **MR !15692**: association exists only where core renders the error into the messenger (IFE off). With IFE
  on — the module whose job is inline errors — the ID is on the template the theme overrides, so it dangles.
- **August 6**: association only inside `inline_form_errors`; no association at all when the module is off,
  which is the Standard default; and the same dangling target when it is on.

## Per-control results (B, `invalid` scenario, `default_admin`)

| Control | aria-invalid | aria-errormessage | described-by tokens | accessibility tree |
|---|---|---|---|---|
| Name (textfield, help text) | true | `edit-name--error-message` (dangling) | help, error | textbox "Name *", description "Your full name." |
| Message (textarea) | true | dangling | help, error | textbox "Message *", description "A short message." |
| Choice (select) | true | dangling | error | combobox "Choice *" |
| Colour (radios) | true (on `<fieldset>`, role `group`) | dangling | error | group "Colour *" |
| Colour first radio | — | `edit-colour-red--error-message` (dangling) | error | radio "Red" |
| Features (checkboxes) | true (on `<fieldset>`) | dangling | error | group "Features *" |
| Features first checkbox | — | `edit-features-one--error-message` (dangling) | error | checkbox "One" |
| Table select | — | dangling | error | table (no name) |
| Email address (×2, identical text) | true | two distinct dangling IDs | error | textbox ×2, same name |
| Custom ID (`#id` override) | true | dangling | author help token, error | textbox "Custom ID *", description "Author-supplied help." |
| Suppressed (`#error_no_message`) | — | **`edit-suppressed--error-message` (dangling)** | error | textbox "Suppressed *" |

MR !15692 also gives **each child radio and checkbox its own dangling `aria-errormessage`** (`edit-colour-red--error-message`,
`edit-features-one--error-message`), which no template ever renders. The August 6 run is different: child
radios/checkboxes get `aria-invalid=true` from core but no errormessage, and the group `<fieldset>` carries
the (dangling) errormessage.

## Lifecycle

| Scenario | B: MR !15692 | C: August 6 |
|---|---|---|
| Initial, no submission | no stale invalid state | no stale invalid state |
| Empty submit | errors shown, references dangle | errors shown, references dangle |
| Repeat empty submit | same IDs, no duplicates | same IDs, no duplicates |
| Partial correction | corrected fields drop `aria-invalid` | same |
| All values supplied | no invalid state remains | same |
| AJAX add-more, then submit | added field's ID is random (`edit-extra-tag--<random>`); reference dangles | same mechanism |
| Two instances on one page | unique `#id`s per instance (core counter), no duplicate error IDs; both dangle | same |
| Identical error text, two fields | distinct IDs, both dangle | same |
| `#error_no_message` | **dangling reference remains** | no ARIA added — passes |
| `#disable_inline_form_errors` | resolves to the messenger message | **no association** |
| Error-summary link | link target resolves once; clicking moves focus to the control | same |

Duplicate IDs: none in any scenario on either side (the error-ID scheme is unique per page because `#id`
is generated with `Html::getUniqueId()`).

## axe-core

Counts per scenario are in each run's `results.json`. In the `invalid` scenario both sides report the same
two `label` violations (a pre-existing fixture issue with the tableselect), and there are **no axe
regressions**. axe reported **nothing** about the dangling `aria-errormessage`/`aria-describedby` targets:
they were only found by resolving every IDREF against the DOM. A clean axe run is not evidence that the
association works.

## Virtual screen reader (Guidepup, jsdom; not a real screen reader)

On the `invalid` page in `default_admin`, Before and After produce the same phrases around the field:

    textbox, Name, Your full name., invalid, required
    Name field is required.
    Your full name.

The error is a separate node after the field, not part of its name or description. The synthetic reader
does not demonstrate `aria-errormessage` support, so this is context, not proof of speech behaviour.
Real NVDA/VoiceOver runs were **not** done — see [SCREENREADER.md](SCREENREADER.md).

## Defects confirmed at runtime (not only by reading source)

1. **`default_admin` drops the association target** for both proposals (dangling IDREFs; 16/16 containers
   without an id).
2. **MR !15692 is a fatal error on current `main` as submitted**: `inline_form_errors\FormErrorHandler`
   uses a typed promoted `protected RendererInterface $renderer` (core changed to promoted properties in
   `780eb17c`, 2026-11-04), while the MR adds an untyped `protected $renderer` to the parent. The port
   types the parent property; the original patch cannot be applied and enabled without it.
3. **MR !15692 leaves a dangling reference on `#error_no_message`** (association set in
   `FormErrorHandler::setElementErrorsFromFormState()` without checking the flag), while the template
   suppresses the container.
4. **MR !15692 adds per-child radio/checkbox associations** (`edit-<group>-<key>--error-message`) that no
   template renders.
5. **August 6 has no effect with IFE disabled** — the Standard default.
6. **AJAX-rebuilt elements get a random ID suffix** (`edit-extra-tag--<random>`), so any stored IDREF or
   test selector must be rebuilt with the element, not cached.

## Not verified

- Firefox and WebKit accessibility trees; forced colours; dark scheme; mobile width.
- Real NVDA (Firefox/Chrome) and VoiceOver (Safari) speech; live-region behaviour.
- Whether axe reports `aria-allowed-attr` for `aria-invalid` on the radios/checkboxes `<fieldset>` in a
  rule set the lab did not enable.
- A person's keyboard pass.
- Regression tests: not yet added (see "Still to do" in [INDEPENDENT-COMPARISON.md](INDEPENDENT-COMPARISON.md)).
