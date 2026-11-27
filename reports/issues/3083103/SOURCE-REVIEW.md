# Source review: #3083103 error association (2026-11-25)

Static review of the four recorded patches against the current Core checkout
`envs/core.git` `origin/main` = `0387fb948f7` (2026-11-25). Every claim below is marked:

- **[SOURCE]** read directly in Core or in the patch.
- **[RUNTIME]** plausible from source but must be seen in rendered HTML / an accessibility tree first.
- **[NOT A DEFECT]** investigated and the suspicion did not hold.

Nothing here is a rendered-DOM result. Axe, Guidepup, screen-reader speech and real-browser behaviour were
not run; the task said not to implement yet.

## 1. How the lifecycle actually works

| Step | Layer | What it knows |
|---|---|---|
| Validation | `FormValidator` | errors keyed by element name |
| `handleFormErrors()` | `FormErrorHandler` (core) | errors + full form render array |
| `displayErrorMessages()` | core **or** `inline_form_errors\FormErrorHandler` | error text; IFE additionally resolves each element and builds summary links from `$form_element['#id']` |
| `setElementErrorsFromFormState()` | core | sets `#errors` on each element; recurses the whole form |
| `#pre_render` | e.g. `Radios::preRenderCompositeFormElement` | rewrites `#attributes['id']` to `#id--wrapper`, adds a `fieldset` wrapper |
| preprocess | `FormPreprocess` (core) + `InlineFormErrorsThemeHooks` (module) | last place holding both the element array and template variables; IFE decides whether the template gets `errors` |
| template | theme | decides the actual DOM: where the text sits and whether it has an `id` |
| `RenderElementBase::preprocess()` | core | adds `aria-invalid` at render time |

Three consequences matter for every proposal:

1. **The template is the layer that knows the real error destination.** Core and the module only know the
   element's `#id`.
2. **`#id` is generated once, before validation** (`FormBuilder::doBuildForm()`, lines 1044–1062) via
   `Html::getUniqueId()`. It is unique per page (`edit-name`, `edit-name--2`, …) and gets a random suffix on
   AJAX. `#array_parents` is *not* unique across two instances of the same form. **[SOURCE]**
3. **`#attributes` render on the control**, not the wrapper: `FormPreprocess::preprocessFormElement()` uses
   `#wrapper_attributes` for the outer `.form-item` div. For radios/checkboxes the children are built during
   `#process` (before validation) from a *copy* of `#attributes`; the element itself then gets a `<fieldset>`
   wrapper (`CompositeFormElementTrait::preRenderCompositeFormElement()`). **[SOURCE]**

## 2. The four implementations

| | !1063 | !7080 | !15692 | August 6 |
|---|---|---|---|---|
| Base branch | `main` 2026-03-24 | `main` 2026-04-15 | `main` 2026-05-07 | **11.4.x 2026-08-06** |
| Files / + / − | 5 / 64 / 5 | 9 / 181 / 29 | 15 / 297 / 53 | 8 / 217 / 21 |
| Where ARIA is set | core `FormErrorHandler` + `RenderElementBase` | same | core `FormErrorHandler` + `RenderElementBase` + `FormPreprocess` | `inline_form_errors\FormErrorHandler` only |
| Error container ID | messenger message (`#prefix`/container) | messenger message (`#prefix`) | messenger message **and** template | template only |
| Renderer in core service | yes | yes | yes | no |
| Works with IFE **disabled** | yes (messenger) | yes (messenger) | yes (messenger) | **no** |
| Applies to current `main` | 4/5 files | 8/9 files | 14/15 files | 4/8 files |

`!1063` and `!7080` are the same design family and differ mainly in how the messenger message is built
(`#type => container` vs raw `#prefix`). `!15692` is !7080 plus preprocess/template work, composite-child
cleanup and `#error_id`. The August 6 proposal keeps the module boundary but adopts the same `#id`-derived
naming, so it is a hybrid, not a new architecture.

## 3. Cross-cutting findings

### 3.1 The default theme drops the association target **[SOURCE, RUNTIME to confirm]**

Standard installs `system.theme.yml` with `admin: default_admin` **and** `default: default_admin`.
`default_admin` overrides all three templates and prints error text without any `id`:

- `core/themes/default_admin/templates/form/form-element.html.twig:78-81`
- `core/themes/default_admin/templates/form/details.html.twig:85-88`
- `core/themes/default_admin/templates/form/fieldset.html.twig:101-104`

`starterkit_theme` overrides them too. Both primary proposals only change
`core/modules/system/templates/*`. Therefore, **in the default Standard theme**, an ARIA reference to
`<element id>--error-message` points at an element that is not in the DOM. Their own functional tests use
`$defaultTheme = 'stark'`, which does **not** override those templates — so the tests can pass while the
default install produces dangling references. This is the single most important thing to see in the browser.

### 3.2 Composite elements: the attribute lands on a `<fieldset>` (role `group`) **[SOURCE]**

For radios/checkboxes the new attributes end up on the `<fieldset class="formgroup">` wrapper, not on the
inputs (`Radios.php:63,89`, `CompositeFormElementTrait`). `aria-invalid` and `aria-errormessage` are not
supported on role `group`; `aria-describedby` is global and is fine there. !15692's own functional test
asserts `fieldset[aria-errormessage=…]`, i.e. it codifies the invalid placement. axe-core's
`aria-allowed-attr` rule should report it; confirm in the run rather than counting attributes. The
accessibility tree, not a zero-violation axe result, is the evidence for "the group is announced as invalid".

### 3.3 `#error_no_message`

- Core today sets `aria-invalid` in `RenderElementBase::preprocess()` **without** checking
  `#error_no_message` — a baseline defect neither primary patch fully fixes.
- !15692 guards it in `RenderElementBase` and the two preprocess methods for form-element and fieldset, but
  **not** in `FormErrorHandler::setElementErrorsFromFormState()` and **not** in `preprocessDetails()`.
  Suppressed errors can therefore keep `aria-errormessage`/`aria-describedby` pointing at a container the
  template never prints. **[SOURCE]**
- August 6 guards it in `setElementInlineErrors()`, which is the better of the two.

### 3.4 Ordering

- !15692 **appends** the error ID after existing description IDs.
- August 6 **prepends** it.
- !15692 moves the details `{{ children }}` above the error/description block and moves fieldset errors below
  the children. That changes reading order for every details/fieldset on the site, i.e. it is a presentation
  change, not just an attribute change. Whether either ordering is right is a §10 question, not a source
  question.

### 3.5 Deduplication

!15692 uses `str_contains($existing, $error_id)` — substring, not token. With two similar IDs
(`edit-name--error-message` and `edit-name--2--error-message`) or an author token that contains the error ID,
it can wrongly conclude the token is present. August 6 splits on whitespace and filters exact tokens
(`prependErrorToDescribedby()`), which is correct. **[SOURCE]**

An element with `#description` already gets `aria-describedby = #id--description` from
`FormBuilder::doBuildForm()` (line 1062). Note that this **overwrites** any author-supplied
`aria-describedby` — a pre-existing Core behaviour, not caused by any patch, but it means "existing
author-defined attributes are preserved" can only be tested on elements *without* `#description` unless the
fixture sets them after build.

### 3.6 Tables and dead code

August 6 `setTableElementInlineErrors()` has **no caller** — only its own recursive call. **[SOURCE]** It
also builds `'<div id="…">' . $element['#errors'] . '</div>'` and puts it in `#prefix`, which Twig prints
unescaped. Dead code today, but it would be a real escaping problem the moment anything called it. It also
repeats the `id` that the template would emit, so calling it would create duplicate IDs. #2848307 (tables)
is still open and is the issue that this method appears to be for.

### 3.7 IDs and multiple form instances

`Html::getUniqueId()` gives each element on a page a distinct `#id`, so `<id>--error-message` is unique for
multiple instances. The August 6 **fallback**
(`'form-error-' . substr(md5(serialize($element['#array_parents'])), 0, 12)`) *is* identical for two
instances of the same form, but it is only reached when an element has **no** `#id`, which is rare.
**[NOT A DEFECT as stated]** for the main path; a real duplicate-ID risk only for ID-less elements.
`#error_id` is returned verbatim with no validation: spaces, quotes or a duplicate value produce an invalid
or duplicated ID. **[SOURCE]** — a real, if author-triggered, defect.

### 3.8 AJAX

`Html::getUniqueId()` adds a random suffix on AJAX responses, so the element's `#id` (and every derived error
ID) changes between the first page and an AJAX rebuild. Within one response, control and container are
generated from the same `#id`, so the pairing should survive; whether it does after `ajax_command_replace`
and whether old references linger is **[RUNTIME]**.

## 4. The August 6 weaknesses, one by one

| Claim | Verdict |
|---|---|
| Hash of `#array_parents` collides across instances | **[NOT A DEFECT] for elements with `#id`** (unique per page). Real only on the fallback path. |
| `#error_id` may create duplicate/invalid IDs | **[SOURCE] confirmed** — used verbatim, no validation. |
| Recursive traversal processes render properties | **[SOURCE] confirmed** — iterates every array key, including `#attributes`, `#prefix`, `#theme`. Low impact today, wrong layer. |
| ARIA assigned after the parent handler ran | **[SOURCE] confirmed** but harmless in itself: attributes are set before render; the real problem is that the *template* decides whether the target exists. |
| `setTableElementInlineErrors()` has no caller | **[SOURCE] confirmed** — dead code. |
| Raw HTML in table handling needs escaping | **[SOURCE] confirmed** — unescaped `#errors` in `#prefix`; currently unreachable. |
| Both attributes point at the same error | **[SOURCE] confirmed** — `aria-errormessage` and `aria-describedby` carry the same ID; double announcement is **[RUNTIME]**. |
| No association when IFE is disabled | **[SOURCE] confirmed** — and Standard does not install `inline_form_errors`, so this is the default install. |

Additional August 6 findings not on the list:

- It flips `enable_html5_validation` from `TRUE` to `FALSE` in `FormPreprocess` — an unrelated, site-wide
  change to native validation, valid on its 11.4.x base, already the default on `main`. Scope leak.
- It adds `aria-invalid`/`aria-errormessage` to **every** array with `#errors`, including containers, tables,
  details and fieldsets — exactly the indiscriminate application §9 warns about.
- Its six new unit tests assert intermediate PHP arrays, not rendered DOM.
- No functional test was added at all.

## 5. The MR !15692 weaknesses, one by one

| Claim | Verdict |
|---|---|
| Service constructor compatibility | **[SOURCE] real BC concern**: `form_error_handler` gains a required `RendererInterface`. Core's own `inline_form_errors\FormErrorHandler` defines its own constructor and does not call `parent::__construct()`, so Core itself is fine, but any contrib subclass or direct `new FormErrorHandler()` breaks. |
| Rendering errors during form processing | **[SOURCE] confirmed**: `displayErrorMessages()` calls `renderInIsolation()` inside `handleFormErrors()`, i.e. rendering happens during processing, before the theme layer. |
| Error IDs surviving render and AJAX | **[RUNTIME]** |
| Template structure and error placement | **[SOURCE] confirmed**: details children moved above errors/description; fieldset errors moved below children. Presentation change for every site. |
| Multiple errors with the same text | **[RUNTIME]** — IDs are per element, so text duplication should not matter, but the messenger merge behaviour needs checking. |
| Existing theme overrides | **[SOURCE] confirmed defect**: `default_admin` and `starterkit_theme` drop the ID (§3.1). |
| Association targets for composite elements | **[SOURCE] confirmed**: lands on `<fieldset role=group>`; invalid `aria-invalid`/`aria-errormessage` placement. |
| `role` / ARIA combinations | **[SOURCE] confirmed** as above; needs axe + accessibility tree to record. |
| Description ordering and deduplication | **[SOURCE]**: appends after help text; substring dedupe (§3.5). |

Additional !15692 findings:

- Association logic exists in **three** places (`FormErrorHandler`, `RenderElementBase`, `FormPreprocess`)
  with different guards — high maintenance burden.
- It sets `aria-invalid` regardless of `#error_no_message` in `FormErrorHandler` (dangling target).
- `preprocessDetails()` does not check `#error_no_message`.
- Its functional test asserts attributes that are invalid for the element they land on, and runs in `stark`.

## 6. What this points at (provisional)

The technical question is narrower than the patch comparison suggests: **where can an ID be attached to the
error text in a way that every theme inherits?** A new template variable cannot do that, because themes
override templates and a change record would be required. Two candidates survive the source review:

1. **Carry the ID with the error value**, not with a template variable: make the `errors` variable a render
   array with a wrapper/id set in `InlineFormErrorsThemeHooks::setErrors()` (module boundary, no Twig change,
   no change record), so any theme printing `{{ errors }}` emits the ID.
2. **Keep the ID on the messenger-rendered error** (the !1063/!7080/!15692 mechanism) and accept that the
   target is in the messages region rather than adjacent — works with IFE off, but the description is not
   next to the field.

Neither is proven. Both need the rendered comparison in §7–§11 of the task before a recommendation. The
August 6 proposal as recorded is the weakest of the four on the stated requirements: no effect on a default
Standard install, target missing in the default theme, invalid ARIA on composites, and dead table code.
That does **not** make !15692 the answer — it shares the theme defect and adds a presentation change.

The comparison document's verdict ("my patch is preferred") is **not supported** by this review. It is
preserved unchanged as historical evidence, and it is unverified.
