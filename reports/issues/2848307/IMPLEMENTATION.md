# Implementation: what changed, and what was removed

Patch: [branches/2848307-table-inline-errors.patch](branches/2848307-table-inline-errors.patch)
against core `0387fb948f786bc344a5cc54aa0d98b8f552e378`.
Interdiff from the experimental combined patch:
[branches/2848307-interdiff-experimental-to-consolidated.patch](branches/2848307-interdiff-experimental-to-consolidated.patch).

## The rendering path

1. `inline_form_errors\FormErrorHandler::handleFormErrors()` calls the core handler, then
   `flagTableElementErrors()`. That method looks up only the elements named by
   `$form_state->getErrors()` and sets `#inline_form_errors_own_error` on a `table` or
   `tableselect` element whose own `#parents` are the error key. It does not walk the form and
   it does not build markup. This is what distinguishes an error that belongs to the table from
   one inherited from a details/fieldset around it.
2. `RenderElementHelper::alterElementInfo()` adds `preRenderTableElement()` to the start of the
   `#pre_render` list for `table` and `tableselect`. It runs before `Table::preRenderTable()`
   and before `Tableselect::preRenderTableselect()` (which renders the child checkbox/radios).
3. `preRenderTableElement()` acts only when the element has its own error, no
   `#error_no_message`, and an `#id`:
   - gives the error the ID `<table id>--error`;
   - adds the `inline_form_errors_table` theme wrapper (a new IFE theme hook);
   - merges that ID into the table's `aria-describedby` (error token first, existing tokens kept,
     exact-token de-duplication);
   - adds `tabindex="-1"` if the table has no tabindex, so the summary link can move focus to it
     without adding a tab stop;
   - removes the inherited copy of the table's error from its descendants (recursively inside the
     table subtree) and sets `#error_no_message` on those descendants. A child's own, different
     error is kept.
4. `InlineFormErrorsThemeHooks` registers `inline_form_errors_table` with
   `'render element' => 'element'` and `preprocess_inline_form_errors_table()` supplies
   `children`, `errors` and `error_id`. `inline-form-errors-table.html.twig` renders the wrapper,
   the one error message (with its ID) and the table. No label is printed for the table.
5. `displayErrorMessages()` now chooses a table's summary link text from `#title`, then `#caption`,
   then the error text. It no longer uses a child checkbox title such as `Update Alpha` for a
   table/tableselect.

This is the shared rendering solution: the same wrapper, pre-render callback and template serve
`table`, `tableselect`, and `table` with `#tableselect => TRUE`.

## The modules uninstall form

- `$form['uninstall']` remains the selection group. It gets `#title => 'Modules to uninstall'` and
  `#id => 'system-modules-uninstall-table'`, so the summary has a meaningful link and a real
  destination. Its checkboxes get `#error_no_message` so IFE does not print the inherited error on
  every row.
- `SystemAdminThemePreprocess::preprocessSystemModulesUninstall()` clears the inherited `#errors`
  from each `module.checkbox` copy when it is the same message as the group error, and prepares
  `table_id`, `table_error` and `table_error_id`. Clearing here is what prevents
  `RenderElementBase::setAttributes()` from adding `aria-invalid` to every checkbox; it works
  whether IFE is enabled or not.
- `system-modules-uninstall.html.twig` prints the group error above the table, gives the table
  `id="{{ table_id }}"`, and adds `aria-describedby` and `tabindex="-1"` only when the error is
  present. The existing three headers and the existing `{{ form|without(...) }}` output are
  unchanged.
- `validateForm()` now sets the error on `uninstall`, not on the form root and not on `modules`.

## Original patch changes: retained, changed, removed

| Change in the experimental combined patch (MR !16355 + comment 28) | Decision |
|---|---|
| `FormErrorHandler::handleFormErrors()` override that calls a second recursive traversal | **Removed.** Replaced by the targeted error-key lookup in `flagTableElementErrors()`; the handler no longer constructs HTML. |
| `FormErrorHandler::setTableElementInlineErrors()` | **Removed.** Replaced by the table pre-render callback + theme wrapper + preprocess. |
| Manual `<div id="…">` markup in `#prefix`, with `Html::escape()` | **Removed.** Twig renders the message; no raw HTML in PHP, no `#prefix` mutation. |
| `aria-describedby` added directly to the table in the handler | **Replaced** by the merge in pre-render, which keeps existing ID references and avoids copying the attribute to child controls. |
| Unit test setup for table/tableselect and `testTableElementErrorsInline()` | **Removed.** The test asserted the manual `#prefix` markup. New unit tests cover the pre-render callback and the handler's own-error flag; functional tests cover the rendered DOM. |
| Forbidden CSpell word "Please" in the MR test messages | **Gone.** The adapted tests use "No rows selected." / "Select at least one row." |
| `ModulesUninstallForm`: `$form['modules']` changed to `#type => 'table'` with a new `#header` | **Removed.** The metadata branch is not rendered as a table, and the template already supplies the three translated headers. |
| `ModulesUninstallForm`: fully-qualified `\Drupal\Core\Extension\ModuleExtensionList::sortByName()` | **Removed.** The imported `ModuleExtensionList` is used again; unrelated to the issue. |
| `ModulesUninstallForm`: `setErrorByName('modules', …)` | **Changed** to `setErrorByName('uninstall', …)`, so the error belongs to the selection group. The parent propagation is handled at the rendering layer and with `#error_no_message`; it does not mark every checkbox invalid. |
| `ModulesUninstallForm`: no title/ID on the selection group | **Added** `#title` and a stable `#id` for the summary link. |
| `ModulesUninstallForm`: checkboxes had no suppression | **Added** `#error_no_message` and the preprocess cleanup. |

## Was the additional recursive traversal eliminated?

The **global recursive error renderer** introduced by MR !16355 is eliminated. There is no
whole-form walk in `handleFormErrors()` and no manual HTML construction.

One bounded recursion remains: `RenderElementHelper::clearInheritedError()` walks the descendants
of a table **only when that table has its own error**, to remove the copy of the same message that
`FormState::getError()` put there and to stop every child from being marked invalid. It is not a
whole-form traversal and it does not run for tables without their own error. The error-key loop in
`flagTableElementErrors()` is iterative and only visits the elements named by errors.

## Alternatives considered and rejected

- **Give `#type => 'table'` a `form_element` theme wrapper.** This is the smallest change, but
  `form_element` prints a `<label for="<table id>">` when the table has a `#title`, and a table is
  not labelable. It also has no ID on its error message, and themes override it (default_admin and
  starterkit both do), so the association would not survive. A dedicated wrapper avoids all three.
- **Add error rendering to `table.html.twig`.** It would run for every data table, including
  tables outside forms, and would require every theme override of `table.html.twig` to change.
  The wrapper is added only to a form table with its own error.
- **Wrap the table in a native `<fieldset><legend>`.** This was investigated for group semantics.
  It would add a wrapper and a legend only in the error state, needs a label source that many
  tables and tableselects do not have, and changes the layout of the table in themes that style
  fieldsets. It also does not remove the need for the table's own association. The table keeps its
  native semantics; the error is associated with the table and the summary link focuses it.
- **Put `aria-describedby` on every checkbox.** It would announce the same group error on every
  row, which is exactly the repetition this issue is trying to remove, and it would keep every
  checkbox `aria-invalid`. The table owns the group error instead.
- **Use a synthetic sibling element as the uninstall error carrier.** It would avoid parent
  propagation, but it would not associate the error with the selection group. Keeping the error on
  `uninstall` and clearing the inherited copies at render time is the closer semantic match.
- **Reuse the #3083103 general error-association framework.** Not merged, and it changes core
  templates and composite elements across the site. This patch only covers the group-level table
  error; #3083103 remains the place for individual control IDREFs.

## Theme and API compatibility

- The table wrapper is a new theme hook. It is additive: no existing hook or template is changed
  for `table`/`tableselect`, and a theme can override
  `inline-form-errors-table.html.twig` without touching core's table templates.
- `form-element.html.twig`, `table.html.twig`, `default_admin` and `starterkit_theme` form
  templates are untouched.
- `system-modules-uninstall.html.twig` is changed. A theme that overrides that template must add
  the error block and the `id`/`aria-describedby`/`tabindex` attributes from `table_id`,
  `table_error` and `table_error_id`; otherwise the summary link has no destination and the
  inline error is not printed. `default_admin` and `starterkit_theme` do not override it.
- No CSS or generated CSS is changed, so no `.pcss.css`/`.css` rebuild is required.
- There is no new public API. `#inline_form_errors_own_error`, `#inline_form_errors_error_id` and
  the wrapper hook are internal to `inline_form_errors`.
