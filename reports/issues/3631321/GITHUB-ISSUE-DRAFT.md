# Add a repeatable comparison for Drupal #3631321: Inactive vertical-tab borders

Support [Drupal #3631321](https://www.drupal.org/project/drupal/issues/3631321) in the Lab with registered pinned/latest variants, its own recipe and patch, and an evaluator using lib/lab-run.mjs.

The comparison includes MR !17078 at `c8136d010105a3c92fc4b20b9956eb31c703fc62` on both sides. The follow-up adds dotted inactive-tab borders and visible outer boundaries.

Acceptance criteria:

- [ ] Patch-stack check succeeds against pinned core `6868135abe8e18373329d51bcb2d2bc81967d8c0`.
- [ ] Existing Lab viewer displays `3631321-pinned` Before and After.
- [ ] Chromium forced colors light/dark, LTR/RTL, normal light/dark, and narrow fallback are recorded.
- [ ] First/middle/last selected tabs, hidden tabs, hover, focus, and selected errors are reviewed.
- [ ] Error icons and accessible contains-error labels are preserved.
- [ ] Native Windows/custom palettes and keyboard review recorded before calling it ready.
- [ ] Core lint passes; missing evidence remains explicit.

Local AI-assisted draft. No external issue or Drupal comment has been posted.
