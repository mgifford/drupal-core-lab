# Reproduce #3637163: Custom accent color field lacks validation

**DRAFT: setup instructions, not evidence that the barrier or correction has been verified.**

Issue: https://www.drupal.org/project/drupal/issues/3637163
Pinned core: `92e5c3a30476` (selected base; not a verification claim).
Prepared: 2026-11-19. Last verified: 2026-11-19 on `3637163-latest` ([playwright/](playwright/README.md); scripted, no person).

## Task and barrier

Task: choose a custom accent or focus color on `/admin/appearance/settings/default_admin`. Barrier: an invalid value typed in the text field (omitted `#`, non-hex digits) is applied to the live styling when the field loses focus, making the Save button, labels and toggles invisible; nothing stops it on save. Source: the issue summary and the lab's scripted runs (Chromium, Firefox, WebKit); no testing with people.

## Preconditions and comparison identity

- Selected variant: `3637163-pinned`; latest variant: `3637163-latest`.
- Before/After environments: `baseline-3637163-latest` and `issue-3637163-latest` (pinned: `baseline-3637163`, `issue-3637163`).
- Core: `92e5c3a30476e248e82679cb63fa44c51bc667d0` on both sides.
- Recipe: none. Plain Standard install (Default Admin is the admin theme); log in as `admin` / `admin`.
- Patches: Before none. After: `branches/3637163-phase1-hex-validation.patch` (lab-authored, no merge request). The proposed tests are in `branches/3637163-tests-phase1.patch` and are not applied to After.
- Page and state: `/admin/appearance/settings/default_admin` as `admin`; choose the last Accent color swatch (Custom).
- Environment: record relevant browser, OS, assistive technology, input, viewport, zoom, preferences and locale.

Confirm preconditions on both sides before assessing the change. Do not include credentials or live login tokens.

## Start locally

Run from the Lab repository root with Docker and DDEV available. Keep every command block safe to paste into zsh as well as bash:
no `#` comments (zsh reads them as comments only with `setopt interactivecomments`), no `!` (zsh history expansion: `!16335` gives
"no such event" and stops the whole paste), and no `<placeholder>` or `a|b` choices on a command line. Explain the commands in a list
under the block, and give real environment names and URLs.

```bash
node tools/compare/setup.mjs 3637163-pinned --check-patches
node tools/compare/setup.mjs 3637163-pinned
node scripts/lab-env.mjs start 3637163-pinned
```

Open the viewer and log in both frames. The scripted replay is `node tools/playwright/evaluate-3637163.mjs 3637163-latest` (add `--scheme=dark`, `--forced-colors`, `--viewport=480x900`, `--browser=firefox` or `--browser=webkit`). It writes dated folders under `playwright/`; run `node scripts/run-readmes.mjs 3637163` for a README of paired screenshots in each.

## Start in DDEV Coder

Read `docs/CLOUD-QUICKSTART.md` and `tools/compare/cloud/README.md` first.
In the Freeform workspace form, DDEV project names must be:
`drupal-compare,drupal-compare-before,drupal-compare-after`.
The repository's copyable value comes from `node tools/compare/cloud/config.mjs --project-names`.
In the workspace repository root:

```bash
node scripts/cloud-bootstrap.mjs 3637163-pinned --check --core-url=https://github.com/drupal/drupal.git
node scripts/cloud-bootstrap.mjs 3637163-pinned --install-autostart --core-url=https://github.com/drupal/drupal.git
```

Open the printed viewer URL in a browser signed in to Coder. Confirm both real Coder frames and login yourself;
the smoke check cannot verify that authenticated browser interaction. Record setup and browser results separately.

## Shortest reproduction

Complete these steps before calling the comparison ready for evaluation:

| Step and input | Expected user outcome | Observed Before | Observed After |
|---|---|---|---|
| Choose Custom accent, type `777777`, press Tab | The interface keeps its colors; the field says what is accepted | `--accent-base: 777777` applied; Save button background becomes transparent | Color unchanged (`#015efe`); error shown, field marked invalid |
| Type `#zzzzzz`, then `#336699`, Tab each time | Invalid is not applied, the corrected value is | Invalid applied; valid applied | Invalid not applied; valid applied and error cleared; picker follows |
| With an invalid value, pick Red, then Custom again | The last valid color stays | Invalid text applied again | Red stays |
| Set Focus color to Custom, type `abc`, Tab; then Tab through the page | Focus indicator stays visible | `--admin-color-focus: abc` applied; focused controls show no outline (`outline-style: none`) | No custom style applied; solid 4px outline |
| Submit `zzzzzz` with the browser's validation off | The server rejects it and does not store it | Saved (`zzzzzz` stored) | Error naming the accepted format; not stored |

Use real input for focus and activation. Describe what to inspect, not just what to click.
Label scripted results separately from a person's keyboard or assistive technology evaluation.

## Evidence and investigation

Status: reproduced on Before and fixed on After in 7 scripted runs on 2026-11-19 (see [EVIDENCE.md](EVIDENCE.md)); not tested with people.
If direct reproduction is unavailable, preserve supporting evidence, limits and the next investigative action.
Keep raw tool outcomes separate from human interpretation. Describe visual attachments and redact sensitive details.
Put results in `EVIDENCE.md`; preserve earlier runs when a patch or recipe changes.

## Acceptance and verification plan

Define measurable user-facing outcomes. Repeat the original interaction and assess relevant regressions.
Record automated checks, manual evaluation and any planned testing with disabled people separately, with scope and limitations.
Record why each method is required or unnecessary. Do not infer conformance or RTBC from setup or automated passes.

## Try current core

```bash
node tools/compare/setup.mjs 3637163-latest --check-patches
node tools/compare/setup.mjs 3637163-latest
node scripts/lab-env.mjs start 3637163-latest
```

For Coder use the same bootstrap procedure with `3637163-latest`. Repeat the steps and record the resolved commit.
If a patch does not apply, inspect changed files and provenance before proposing a reroll; do not silently alter the stack.
If Before no longer fails, check the scenario, setup and upstream history before concluding that it was fixed.
If After still fails, distinguish setup failures from a remaining barrier. Preserve credible user reports after a failed rerun.

Re-pin only after reviewing the current-core evidence. Update the registered pinned variant where it is defined,
record the new revision and rerun; retain the old evidence with its original identity.

## Reporting guidance

See [Accessibility Bug Reporting Best Practices](https://github.com/mgifford/ACCESSIBILITY.md/blob/main/examples/ACCESSIBILITY_BUG_REPORTING_BEST_PRACTICES.md).
Use applicable fields; incomplete intake remains valid even when evaluation or remediation needs more investigation.
