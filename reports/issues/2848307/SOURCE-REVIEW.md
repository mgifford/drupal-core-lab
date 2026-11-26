# Source review: #2848307 table and tableselect inline errors

Core base `0387fb948f786bc344a5cc54aa0d98b8f552e378` (Drupal 12.0-dev, 2026-11-25).
Everything below was read in that checkout. Rendered behaviour is in [EVIDENCE.md](EVIDENCE.md),
not inferred from this review.

## 1. How a table element is built and rendered

| Layer | File | Finding |
|---|---|---|
| Element info | `core/lib/Drupal/Core/Render/Element/Table.php` (`getInfo()`) | `#theme => 'table'`, `#input => TRUE`, `#tree => TRUE`, `#tableselect => FALSE`, `#pre_render => [Table::preRenderTable]`. There is **no `#theme_wrappers`**, so the standard `form_element` template (and its inline error block) never wraps a table. |
| Element info | `core/lib/Drupal/Core/Render/Element/Tableselect.php` (`getInfo()`) | `#theme => 'table__tableselect'`, `#pre_render => [preRenderTable, preRenderTableselect]`, `#process => [processTableselect]`. Again no `#theme_wrappers`. |
| Processing | `Tableselect::processTableselect()` | Creates a checkbox or radio child for every `#options` row. It copies `$element['#attributes']` to each child and sets no `#error_no_message`. |
| Processing | `Table::processTable()` | When `#tableselect` is TRUE on a `#type => 'table'` element, it prefixes each row with a generated checkbox/radio and copies `$element['#attributes']` to it. It sets no `#error_no_message`. |
| Pre-render | `Table::preRenderTable()` | Converts child rows to `#rows`, sets `#attributes['id']` from `#id` (`Element::setAttributes($element, ['id'])`), adds sticky/responsive classes and tabledrag data, and returns. It does not read or render `#errors`. |
| Pre-render | `Tableselect::preRenderTableselect()` | Renders every child checkbox/radio immediately with `renderer->render($element[$key])`, then builds `#rows`. A parent pre-render callback that needs to change those children must therefore run **before** this callback. |
| Theme | `ThemePreprocess::preprocessTable()` | Builds `header`, `rows`, `footer`, `attributes` and `header_columns` for `table.html.twig`. It neither reads nor renders `#errors`. |
| Template | `core/modules/system/templates/table.html.twig` | Prints `<table{{ attributes }}>` and rows. No `errors` variable. |

`FormBuilder::doBuildForm()` gives every render element an `#id` (`edit-…`, unique per page,
with a suffix on AJAX rebuilds) and gives elements with `#description` an
`aria-describedby="<id>--description"`. For a table that ID is put on the `<table>`, but
`table.html.twig` does not print the description, so the description target is already absent
for tables on this base (pre-existing, not introduced here).

## 2. How errors reach elements and templates

`FormState::getError($element)` walks the element's `#parents` from the shortest prefix to the
longest and returns the first recorded error. `FormErrorHandler::setElementErrorsFromFormState()`
then stores that value in `#errors` on **every** element, including every descendant of the element
the error was recorded on. A table element therefore has `#errors` both when the error is its own
and when it was inherited from a parent (for example a details element containing it).

- `FormPreprocess::preprocessFormElement()` sets `$variables['errors'] = NULL` and passes
  `#wrapper_attributes`, description, label and children to `form-element.html.twig`.
- `InlineFormErrorsThemeHooks::setErrors()` copies `$element['#errors']` into `$variables['errors']`
  unless `#error_no_message` is set. It runs for `form_element`, `details`, `fieldset` and
  `datetime_wrapper`; there is no table hook.
- `form-element.html.twig` prints the error inside `.form-item--error-message` when `errors` is set.
  The default Admin override (`core/themes/default_admin/templates/form/form-element.html.twig`)
  prints it inside `.form-item__error-message` without an ID. Both templates are newline/DOM-near
  the control, but neither gives the message an ID for an IDREF.
- `RenderElementBase::setAttributes()` adds `aria-invalid="true"` whenever `#errors` is set and the
  element was validated; it does **not** check `#error_no_message`. That is why a group error on a
  parent can mark every checkbox/radio descendant invalid even when its message is suppressed.

`InlineFormErrors\FormErrorHandler::displayErrorMessages()` builds the summary. For each error it
finds the element by name, takes `#title` (or a descendant title), requires an `#id`, and links to
`#<id>`; elements with `#error_no_message` are removed from the summary without being printed.
A table with no `#title` therefore either got no link or, worse, a link named after the first
row's checkbox title (`Update Alpha`).

`#disable_inline_form_errors` is handled twice: `RenderElementHelper::processElement()` sets
`#error_no_message` on every element during processing, and `displayErrorMessages()` delegates to
the parent handler. That is the existing mechanism for turning inline errors off for a form.

## 3. The modules uninstall form is a separate architecture

`ModulesUninstallForm::buildForm()` creates two branches:

- `$form['modules'][<module>]` holds `#module_name`, a `name` markup cell, a `description` markup
  cell, and optional `#validation_reasons` / `#required_by`.
- `$form['uninstall'][<module>]` holds the actual checkboxes (`#tree => TRUE`).

`SystemAdminThemePreprocess::preprocessSystemModulesUninstall()` combines them into a flat
`$variables['modules']` list, taking `checkbox` and `checkbox_id` from the second branch.
`system-modules-uninstall.html.twig` prints that list as a **hand-written** `<table>` and excludes
`modules`, `uninstall` and `filters` from `{{ form|without(...) }}`. The `modules` branch is never
rendered as a table element: `Table::preRenderTable()`, its `#theme`, and any `#prefix` on it are
never used. Changing `$form['modules']` to `#type => 'table'` therefore does not change the
rendered table, and a `#prefix`/`#id` set there has no destination in the DOM.

The rendered selection group is the `uninstall` checkbox tree in the table's first column. Setting
an error on `uninstall` is the right group association, but `getError()` propagates it to every
checkbox. `#error_no_message` stops the message being printed, but does not stop the `aria-invalid`
that `RenderElementBase::setAttributes()` adds from the inherited `#errors`. Without a rendering-stage
cleanup, every row checkbox would be marked invalid.

`default_admin` and `starterkit_theme` have no override of `system-modules-uninstall.html.twig`, so
the system template is the one that renders the form in the installed Standard profile.

## 4. Existing constraints this implementation has to respect

- `#theme_wrappers` are applied after `#theme`, but `#pre_render` runs before both. A table wrapper
  can be added in pre-render. For Tableselect it must run before `preRenderTableselect()`, because
  that callback renders the child controls.
- `#attributes` render on the `<table>`, while `#wrapper_attributes` render on the outer form item.
  A table is not a labelable control; a `<label for="<table id>">` is invalid.
- A table is not focusable by default, so a summary link fragment does not move keyboard or screen
  reader focus to it unless the table is made programmatically focusable.
- An error on a parent is inherited by every descendant. Rendering it at the table and at each
  child would duplicate the message and mark every control invalid.
- A theme hook with a `variables` declaration receives only those variables; a wrapper around a
  render element must use `render element` so it gets `$variables['element']` and can read
  `#children`, `#errors` and `#id`.
- The uninstall table is not a render element, so the generic table wrapper cannot reach it; its
  own template must print the error and the association.

## 5. Scope check against #3083103

`#3083103` ("Programmatically associate error messages with inputs") is the general-purpose
framework for putting an ID on every error and referencing it from every control. Its open MR
`!15692` changes core `FormErrorHandler`, `RenderElementBase`, `FormPreprocess`, the form-element,
details and fieldset templates and the default_admin/starterkit overrides. This issue does not
duplicate that work. It only associates a **group-level table error** with the table that owns it,
and leaves the individual control/error IDREF work to #3083103. The lab's source review of that
issue (`reports/issues/3083103/SOURCE-REVIEW.md`) found the same theme-override and composite-element
problems there; this patch deliberately does not depend on those changes.

If #3083103 (or a successor) lands first, its generic mechanism may give every element with
`#errors` its own error ID and `aria-describedby`/`aria-errormessage`, including a table. In that
case the table wrapper here should use that generic ID and container instead of adding a second
one, or the table should be excluded from the generic ID assignment to avoid two error messages
and two IDREFs. That is a follow-up to this issue, not something this patch should pre-empt.
