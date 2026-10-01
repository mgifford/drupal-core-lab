# Screenshots

This directory is where `capture.mjs` writes images. It ships empty on purpose:
the screenshots must come from *your* running instance so they are real evidence
of before/after behaviour, not a mockup.

After running the capture script you will have, per label:

- `<label>-01-default.png` — the form on load
- `<label>-02-toggled.png` — after every trigger is toggled
- `<label>-03-diagnostics.png` — just the verdict panel

Capture `before` on plain core and `after` with MR !7305 applied, then attach
both sets to the issue.
