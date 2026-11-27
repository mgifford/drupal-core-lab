# Explainer: why the error is not announced

A form field can show an error message next to it and still be inaccessible. If nothing in the HTML links
the field to the message, a screen reader user who tabs to the field hears the label, the help text and
"invalid", but not *why* it is invalid. They must leave the form, find the error summary, read it, and come
back.

The link is made with an ID: the error text carries `id="name-error"`, and the field says
`aria-describedby="name-error"` (or `aria-errormessage="name-error"`). If no element with that ID exists,
the reference is silently ignored. The page looks right and is still broken.

## What this issue is about

#3083103 asks Drupal Core to make that link. Two things make it harder than adding one attribute:

1. **Themes decide where the error text is.** Drupal renders a form field through a Twig template, and a
   theme can replace that template. This Core has three sets (the base one, `default_admin`, and
   `starterkit_theme`). A patch that adds an `id` in one set does nothing in the others.
2. **The default theme is `default_admin`.** On a Standard install it renders both the front end and the
   admin pages, and its three form templates print the error text without an `id`. So a patch that works in
   the base theme still fails where most forms are used.

There is a third wrinkle: the Inline Form Errors module is what normally turns errors into links and moves
them next to the field, and Standard does not install it. A fix that lives only inside that module does
nothing on a default site.

## What was measured

With an empty submit on a fixture containing every common element type, in `default_admin`:

- 16 error messages were on the page;
- none of the 16 had an `id`;
- both patches pointed `aria-errormessage`/`aria-describedby` at IDs that therefore did not exist.

With Inline Form Errors switched off, one patch pointed at the message in the page-level messages region
(which does exist), the other added no link at all.

## What would work

The ID has to travel with the error text itself, not with a template variable the theme may ignore. If the
value printed by the template carries the ID, every theme that prints the error prints the ID too, and no
theme needs changing. That is the direction the independent comparison recommends testing first.

## What this means for a screen reader user today

On an invalid form in the default theme: the field is announced as invalid, the error is somewhere else on
the page, and the field's description is only its help text. The summary link still takes them to the field,
which is useful, but it is not the same as the field carrying its error.
