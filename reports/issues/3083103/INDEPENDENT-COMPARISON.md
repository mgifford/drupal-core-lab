# Independent comparison: #3083103 error association

This replaces the conclusion of [3083103-comparison.md](3083103-comparison.md) ("my patch is preferred").
That document is kept unchanged as historical evidence; it compared an **11.4.x** diff with a **`main`** MR,
never applied one to the other, and did not test the default theme. Its verdict is not reproduced here.

Inputs: [SOURCE-REVIEW.md](SOURCE-REVIEW.md) (source), [EVIDENCE.md](EVIDENCE.md) (rendered DOM, Chromium,
`default_admin`, Inline Form Errors on and off), [SCREENREADER.md](SCREENREADER.md) (virtual reader only).

## What the issue actually requires

| Requirement | Basis | Status |
|---|---|---|
| An invalid control is programmatically associated with its error | issue title, WCAG 3.3.1 | confirmed |
| It works on a stock Standard install | Standard does **not** install `inline_form_errors`; `default_admin` is the default theme | confirmed by configuration |
| It works with Inline Form Errors enabled **and** disabled | comment #82 wants IFE ownership; kentr on #3590902 wants "all form errors, not just when IFE is enabled" | both are reviewer positions; neither alone is ratified |
| Existing help text and author `aria-describedby` are preserved | WCAG 1.3.1 / 3.3.2; task §9 | confirmed |
| Error presentation stays with Inline Form Errors / the theme | comment #82; module boundary | reviewer preference with a concrete reason (tests live in the module; template variables need a change record) |

The requirement that decides the comparison is the second one: **the association must survive the default
theme**, and it must exist when IFE is off, because that is how Standard ships.

## What was measured

Both proposals derive the error ID from the element `#id` and rely on the theme's error container to carry
it. In `default_admin` — the default and admin theme — **every error container was rendered without an
`id`** (16 of 16), so every `aria-errormessage`/`aria-describedby` added by either proposal dangles:

| | Before | MR !15692 | August 6 |
|---|---|---|---|
| Association, IFE **on**, `default_admin` | none | dangling | dangling |
| Association, IFE **off** | none | resolves (messenger region) | **none** |
| `#error_no_message` | — | dangling reference | correct (no ARIA) |
| Child radios/checkboxes | — | own dangling `aria-errormessage` each | `aria-invalid` only |
| Group `<fieldset>` | `aria-invalid` | + dangling errormessage/describedby | + dangling errormessage/describedby |
| Fatal on current `main` | — | **yes** (typed property conflict) | no |
| Presentation change | — | reorders details/fieldset content | none |
| Template / change record | — | new `error_id` variable in 3 templates | same, in 3 templates |

The virtual screen reader reports the same description for the Name field on both sides
("Your full name."), never the error. That is consistent with the dangling targets.

## Scorecard

| Criterion | MR !15692 | August 6 | Weight in this issue |
|---|---|---|---|
| Association resolves in the default theme | No | No | decisive |
| Association with IFE disabled | Yes (messenger, not adjacent) | No | high (Standard default) |
| Correct target for composites | No (fieldset role=group; per-child refs) | Partial (fieldset; no child refs) | high |
| Respects `#error_no_message` | No | Yes | medium |
| Module boundary | ARIA in core | ARIA only in the module | medium (reviewer preference) |
| API/BC risk | Renderer arg + fatal type conflict | none | high |
| Presentation/theme disruption | Reorders content; needs CR | Needs CR; reorders nothing | medium |
| Complexity / duplicated logic | 3 code paths, 3 templates | 1 class, 3 templates, dead table method | medium |
| Security | none found | dead raw-HTML table code (unescaped `#errors`) | low today |
| Test coverage | Unit + functional in `stark`; both pass while the default theme is broken | Unit only, array-level; no functional test | high |
| Maintenance | two owners of the same decision | one owner, but off by default | medium |

Neither wins. The August 6 patch is smaller and respects suppression, but it cannot work on a default
install. The MR is the only one that associates anything with IFE off, but it cannot work with IFE on in
the default theme, and it does not apply to `main` without a fix.

## Why both fail the same way

The ID is created in a **template variable**. Any theme that overrides the template drops it, and Core has
three template sets plus every contrib theme. A template variable also needs a change record. This is an
architectural choice, not a bug in either patch: the layer that can guarantee the DOM is the *content*
being printed, not a variable the template may ignore.

## Recommendation

**Pursue a minimal Core association mechanism with module-specific error presentation**, built on the MR's
placement but not its delivery mechanism:

1. **Carry the ID with the error content, not the template.** Make the value printed by `{{ errors }}` a
   render array whose wrapper carries the ID (for example `#prefix`/`#suffix` around the message), set where
   the error text is prepared (`FormPreprocess` in core, or the IFE theme hook for inline presentation).
   Every theme that prints the error then emits the ID, with no Twig change and no change record. This
   needs a proof-of-concept run before it is adopted; it is the only candidate the source review found that
   can satisfy the default-theme requirement without touching every theme.
2. **Keep Core's association for the IFE-off case.** When IFE is off, the only error text is the messenger
   message; give that message the same ID (the MR's mechanism, without the renderer dependency if the ID is
   carried in the message render array). Accept that the target is in the messages region.
3. **Fix the MR's portability defects**: type the renderer property, guard `#error_no_message`, and stop
   emitting per-child associations for radio/checkbox children (put the association on the group, and only
   `aria-describedby` there while the group is a `fieldset`, or give it `role=radiogroup`/`group` with a
   supported attribute set).
4. **Test in `default_admin`, not `stark`.** A Functional test that submits the fixture and asserts every
   `aria-errormessage`/`aria-describedby` token resolves to exactly one element would have failed both
   proposals. That test is the acceptance criterion.
5. **The proof of concept has been run and passes the gate** (7 of 7 in `default_admin`, Before 2 failures;
   [ACCEPTANCE-TEST-poc.md](ACCEPTANCE-TEST-poc.md)). It is still lab-only: no MR, no comment. The next step
   is to turn it into a minimal patch plus interdiff once the ID source (#3557245 / MR !16520) is settled.

Do not merge the August 6 patch as-is: it is inert on a default install, and its table method is dead code
that would be unsafe if called. Do not merge !15692 as-is: it is a fatal error on `main` and its
association does not resolve in the theme most forms use.

## Still to do before a Drupal.org comment

- Regression tests: written and run against both After states (see
  [ACCEPTANCE-TEST.md](ACCEPTANCE-TEST.md) and [ACCEPTANCE-TEST-aug6.md](ACCEPTANCE-TEST-aug6.md)); still open
  is an AJAX (FunctionalJavascript) variant.
- A real NVDA pass (Firefox/Chrome) and VoiceOver/Safari if available; the virtual reader is not enough.
- Firefox/WebKit accessibility trees, forced colours, dark scheme, mobile width.
- Proof-of-concept for recommendation (1).
- Read the unresolved MR threads (GitLab API returned 401) and re-check #3557245 / MR !16520 first.
