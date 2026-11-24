# Reproduce #3590502: Move local tasks out of the More actions menu into the content header

**DRAFT: setup instructions, not evidence that the barrier or correction has been verified.**

Issue: https://www.drupal.org/project/drupal/issues/3590502
Pinned core: `eef285cd039d` (selected base; not a verification claim).
Prepared: 2026-11-23. Last verified: never. Replace this only with a dated run reference.

## Task and barrier

On admin-themed entity pages, Navigation removes the entity's local tasks and redistributes
them into the top bar's More actions menu and featured actions. That hides the page's
structural context, makes the active task harder to identify, and adds another interaction
for common routes. MR !17640 keeps the local tasks in the content header and limits the
Navigation page-actions item to an unrelated Layout Builder action that is retained
temporarily for a test dependency.

This lab comparison uses the Standard install's user entity because `/user/1` and
`/user/1/edit` expose the same View/Edit local-task set without needing extra content.
The issue reports the same behavior for content, blocks, media and user pages.

## Preconditions and comparison identity

- Selected variant: `3590502-pinned`; latest variant: `3590502-latest`.
- Before environments: `baseline-3590502` / `baseline-3590502-latest`.
- After environments: `issue-3590502` / `issue-3590502-latest`.
- Pinned core: `eef285cd039d513938cf006bdc3cb931433ac437`; resolve and record the
  current `main` commit when using `3590502-latest`.
- Recipe: `recipes/repro_3590502/recipe.yml`. It explicitly relies on the Standard
  install; Navigation and Default Admin are already enabled.
- Patch stack: Before has no patches. After applies
  `reports/issues/3590502/branches/3590502-move-local-tasks.patch` only.
- Page and state: log in as the Standard install's administrator and use
  `/user/1/edit` and `/user/1`.
- Environment: the run record must capture browser, OS, viewport, colour mode and tool versions.

Confirm preconditions on both sides before assessing the change. Do not include credentials or live login tokens.

## Start locally

Run from the Lab repository root with Docker and DDEV available. Keep every command block safe to paste into zsh as well as bash:
no `#` comments (zsh reads them as comments only with `setopt interactivecomments`), no `!` (zsh history expansion: `!16335` gives
"no such event" and stops the whole paste), and no `<placeholder>` or `a|b` choices on a command line. Explain the commands in a list
under the block, and give real environment names and URLs.

```bash
node tools/compare/setup.mjs 3590502-pinned --check-patches
node tools/compare/setup.mjs 3590502-pinned
node scripts/lab-env.mjs start 3590502-pinned
```

Open the viewer and log in both frames. Use this issue's actual evaluator if one exists.
`tools/playwright/walkthrough.mjs` is specific to #3619127, not a generic evaluator.
If no evaluator exists, record that gap and perform the manual steps below.

## Start in DDEV Coder

Read `docs/CLOUD-QUICKSTART.md` and `tools/compare/cloud/README.md` first.
In the Freeform workspace form, DDEV project names must be:
`drupal-compare,drupal-compare-before,drupal-compare-after`.
The repository's copyable value comes from `node tools/compare/cloud/config.mjs --project-names`.
In the workspace repository root:

```bash
node scripts/cloud-bootstrap.mjs 3590502-pinned --check --core-url=https://github.com/drupal/drupal.git
node scripts/cloud-bootstrap.mjs 3590502-pinned --install-autostart --core-url=https://github.com/drupal/drupal.git
```

Open the printed viewer URL in a browser signed in to Coder. Confirm both real Coder frames and login yourself;
the smoke check cannot verify that authenticated browser interaction. Record setup and browser results separately.

## Shortest reproduction

Complete these steps before calling the comparison ready for evaluation:

| Step and input | Expected user outcome | Observed Before | Observed After |
|---|---|---|---|
| Go to `/user/1/edit` on both sides | The user edit form is available | Not tested | Not tested |
| Compare View/Edit in the page content and Navigation top bar | Both routes remain available through the appropriate controls | View in More actions; no visible primary local-task row | View and Edit are visible primary local tasks; Edit is active |
| With Mirror off, follow View using real keyboard input in each frame | The user reaches the profile's View page | The route is reached through top-bar More actions | The route is reached directly through the local task |
| Go to `/user/1` and compare the available Edit route | Edit is available without changing the entity context | Edit is a featured top-bar action | Edit is a primary local task; no featured top-bar Edit action |

Use real input for focus and activation. Describe what to inspect, not just what to click.
Label scripted results separately from a person's keyboard or assistive technology evaluation.

## Evidence and investigation

Record reproduction status (reproduced / intermittent / not observed / not tested /
needs evidence), attempts and dated run links in `EVIDENCE.md`. Keep the MR source
revision separate from the resolved core commit on each side.

## Acceptance and verification plan

The registered checks must show:

- View and Edit are present in `.tabs--primary` after the patch.
- View is not present in `#top-bar-page-actions` on `/user/1/edit`.
- Edit is not present as a featured `.top-bar__actions` link on `/user/1`.
- No page JavaScript errors occur.

Manual evaluation must additionally check keyboard order, active-state clarity, narrow
viewport layout and forced-colours presentation. Automated results are not a substitute
for a person's keyboard or screen-reader pass, and no RTBC conclusion follows from setup
alone.

## Try current core

```bash
node tools/compare/setup.mjs 3590502-latest --check-patches
node tools/compare/setup.mjs 3590502-latest
node scripts/lab-env.mjs start 3590502-latest
```

For Coder use the same bootstrap procedure with `3590502-latest`. Repeat the steps and record the resolved commit.
If a patch does not apply, inspect changed files and provenance before proposing a reroll; do not silently alter the stack.
If Before no longer fails, check the scenario, setup and upstream history before concluding that it was fixed.
If After still fails, distinguish setup failures from a remaining barrier. Preserve credible user reports after a failed rerun.

Re-pin only after reviewing the current-core evidence. Update the registered pinned variant where it is defined,
record the new revision and rerun; retain the old evidence with its original identity.

## Reporting guidance

See [Accessibility Bug Reporting Best Practices](https://github.com/mgifford/ACCESSIBILITY.md/blob/main/examples/ACCESSIBILITY_BUG_REPORTING_BEST_PRACTICES.md).
Use applicable fields; incomplete intake remains valid even when evaluation or remediation needs more investigation.
