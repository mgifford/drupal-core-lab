*Draft only. Not reviewed by a person; the unresolved MR threads have not been read. Do not post as-is.*

I rebuilt the comparison on current main (0387fb948f7) with one shared baseline, using a fixture with
textfield, textarea, select, radios, checkboxes, multi-value, details, fieldset, nested container, table,
tableselect, an explicit `#id`, an author `aria-describedby`, `#error_no_message`, two instances and AJAX.

Standard uses `default_admin` for both the front end and admin. Its form-element, details and fieldset
templates print error containers without an `id`. After an empty submission all 16 error containers had no
`id` in both states.

MR !15692: with Inline Form Errors off, `aria-errormessage` resolves to the messenger message; with it on,
every reference dangles. The patch is also a fatal error on main: `FormErrorHandler::$renderer` is untyped
while the module now uses a typed promoted property.

The August 6 patch is an 11.4.x diff (`b2ce2022`), not a main one. It adds no association with Inline Form
Errors off, and the same dangling target with it on.

Evidence and steps: mgifford/drupal-core-lab, `reports/issues/3083103/`.

Generated with the help of an LLM.
