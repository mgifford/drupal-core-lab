# Expected before/after screen-reader behavior

Produced from the implemented ARIA (not a live VoiceOver capture — run
`sidebar-modal.voiceover.mjs` on a macOS host to confirm). The "before" column
is the unpatched `default_admin` sidebar; the "after" column is this patch.

## 1. After a failed submit with a sidebar child error
- **Before:** the sidebar toggle is announced only as a generic link/button
  ("Hide sidebar panel"). Nothing tells a screen-reader user the group contains
  errors. The error text exists in the page but the control gives no signal.
- **After:** the toggle is announced with `aria-invalid="true"` and an appended
  accessible name, e.g. "Hide sidebar panel, invalid, has errors". The error is
  conveyed at the control.

## 2. Opening the sidebar on a narrow viewport (overlay mode)
- **Before:** the panel opens over the form. The background form fields remain in
  the accessibility tree and Tab order; VoiceOver can wander into the content
  behind the greyed overlay. No dialog semantics.
- **After:** the panel is announced as a dialog
  (`role="dialog"`, `aria-modal="true"`, label "Sidebar"). The background is
  `inert` + `aria-hidden`, so it is removed from the Tab order and the
  screen-reader tree. VoiceOver stays within the panel.

## 3. Tab behavior while open
- **Before:** Tab moves freely between the panel and the background form.
- **After:** Tab / Shift+Tab cycle only within the panel and the single toggle
  control; focus cannot escape to the background.

## 4. Closing
- **Before:** only the toggle link collapses the panel; no Escape handling, no
  focus management.
- **After:** Escape closes the panel, the overlay is clickable to dismiss, and
  focus returns to the toggle control. The background becomes interactive again.

## 5. Controls
- **Before:** two close affordances exist (the toggle and a separate
  "Close sidebar panel" link inside the panel).
- **After:** one control — the toggle — opens and closes the panel in both
  states.
