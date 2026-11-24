# #3466040: Modal dialog actions are pushed out of the viewport

**DRAFT.** The supplied proposal was reduced to a focused reroll and verified in a registered Before/After comparison. Human keyboard and screen-reader review remain open.

Issue: https://www.drupal.org/project/drupal/issues/3466040
Selected base: `97c6ff8b2534b242c0f1df3e4ba2493e56aebcec`. Prepared: 2026-11-23.
Fork branch: none (local authoring).

## Barrier, task and expected outcome

A dialog created with `height: '50%'` is initially small. Core converts that requested percentage height to `auto` when the initial content is shorter than the percentage. After the content expands, the dialog grows to the 95% `maxHeight` without moving from its original top position, so its action pane can move below the viewport.

The resubmission removes that conversion. Core keeps the requested percentage height and allows the existing jQuery UI content scroller to contain growth.

## People affected and evidence basis

The barrier affects keyboard and pointer users who need dialog actions after dynamic content growth. Evidence is from a lab-only dialog fixture using the same public `Drupal.dialog` API and `height` option used by core Media Library callers. No disabled participant evaluation occurred.

## Reproduction and comparison

- Registered comparison: `3466040-latest`.
- Core on both sides: `97c6ff8b2534b242c0f1df3e4ba2493e56aebcec`.
- Before: pristine core.
- After: [`3466040-resubmission.patch`](branches/3466040-resubmission.patch).
- Prior proposal: [`3466040-supplied-proposal.patch`](branches/3466040-supplied-proposal.patch).
- Interdiff: [`3466040-resubmission.interdiff`](branches/3466040-resubmission.interdiff).
- Recipe and lab-only fixture: [`repro_3466040`](../../../recipes/repro_3466040/recipe.yml).

## Continue after a reboot

The two checkouts, database files, patch, recipe, and evidence remain on disk. After Docker Desktop is running, restart the registered comparison with:

```bash
node scripts/doctor.mjs 3466040-latest
node scripts/lab-env.mjs start 3466040-latest --browser
```

Open https://drupal-compare.ddev.site, log in to both frames, and open `/lab/dialog-3466040`.

When finished, preserve the databases and stop only the running containers:

```bash
node scripts/lab-env.mjs stop 3466040-latest
```

If the checkouts were deleted, rebuild with `node tools/compare/setup.mjs 3466040-latest`; routine reboots do not require setup.

## Evidence and readiness

- Reproduced and fixed at 1280x900, 480x900, and forced colours.
- Core lint: PASS.
- Focused FunctionalJavascript regression test: PASS, 7 assertions.
- The full `DialogTest` run was incomplete because ChromeDriver failed to start one session; this was infrastructure, not a test assertion.

## Sources

- Issue #3466040 and the supplied local proposal are the source context for this packet.
- The supplied local proposal added a global flex/CSS/visual-viewport design. The interdiff explains why the resubmission removes that layer.
- The full patch also applies cleanly to current `origin/main` at `0f267dbcf05b38ef42e9d8dc5b207abe2955dbfe`.



## Not verified and next actions

- Real keyboard-only pass by a person.
- Real VoiceOver, NVDA, or JAWS pass.
- Firefox and WebKit runs.
- 400% text/zoom reflow on a real browser and operating system.

## Acceptance and verification

The action pane remains inside the viewport after dynamic growth; the content scrolls; the requested height is retained; one real Tab press reaches a visibly in-bounds Save button; JavaScript errors do not increase; automated axe results do not regress.



## Reporting guidance

Adapted for Lab issue evaluation from
[Accessibility Bug Reporting Best Practices](https://github.com/mgifford/ACCESSIBILITY.md/blob/main/examples/ACCESSIBILITY_BUG_REPORTING_BEST_PRACTICES.md).
Use relevant environment details, redact private content and credentials, and describe visual evidence in text.
