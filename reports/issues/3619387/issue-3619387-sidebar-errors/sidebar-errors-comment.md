## Sidebar errors: indicator + modal behavior

This patch improves the admin content-form sidebar (the "advanced" group panel) for users who rely on the keyboard or a screen reader.

**1. Error indicator**
When the sidebar/advanced group has child validation errors, the sidebar toggle gets a visible `has-error` class and `aria-invalid="true"`. A visually-hidden "(has errors)" note is added to its accessible name so screen readers are informed. Implemented with a lazy builder that reads the error flag after the form renders.

**2. Modal behavior when overlapping**
On narrow viewports the sidebar overlays the page. In that mode it now behaves as a modal dialog:
- The background (form fields, actions, and unrelated chrome) is made `inert` and `aria-hidden`, so it cannot be reached by Tab or a screen reader.
- Focus is trapped inside the panel; `Esc` or clicking the overlay closes it.
- The panel gets `role="dialog"`, `aria-modal="true"`, `aria-label`.
- Focus moves into the panel on open and returns to the toggle on close.

On wide viewports the sidebar stays a push-aside and remains fully interactive.

**3. Single control**
A duplicate "Close sidebar panel" link inside the panel was removed. One toggle control now opens and closes the panel in both states.

**4. Test**
`SidebarChildErrorsTest` submits an invalid path alias and asserts the toggle shows `has-error`.

Generated with the help of an LLM.
