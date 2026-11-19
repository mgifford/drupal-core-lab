# #3637163: Custom accent color field lacks validation

**DRAFT, AI-assisted; not RTBC.** A lab-authored Phase 1 proposal exists (no merge request yet). Scripted checks ran on 2026-11-19; no person has reviewed them.

Issue: https://www.drupal.org/project/drupal/issues/3637163
Selected base: `92e5c3a30476e248e82679cb63fa44c51bc667d0`. Prepared: 2026-11-19.
Fork branch: none (local authoring). Patches: [branches/3637163-phase1-hex-validation.patch](branches/3637163-phase1-hex-validation.patch) (the fix) and [branches/3637163-tests-phase1.patch](branches/3637163-tests-phase1.patch) (proposed tests).

## Barrier, task and expected outcome

On `/admin/appearance/settings/default_admin`, the Custom Accent color and Custom Focus color fields accept any text. The live preview applies it
when the field loses focus, before anything is saved. An invalid value (`777777`, `#zzzzzz`) is written into `--accent-base` (or the custom focus style),
so the Save button, the Appearance labels, toggles and other controls can become invisible. The `pattern` attribute is only a browser hint: it neither
stops the preview nor the server from saving a bad value. The reporter also asks the field to say that a hex value is expected.
Expected: an invalid value never changes the live styling, is rejected on save with an actionable message, and the field names the accepted format.

Source: the issue summary (reporter rkoller) and the lab's own scripted runs.

## People affected and evidence basis

Record the task consequence, relevant interaction methods, workaround and its cost.
Distinguish user testimony, evaluation with disabled participants, manual inspection, tool output and inference.
State uncertainty; do not infer diagnoses or claim participant testing that did not occur.
These details have not been assessed by this generation step. Preserve credible reports while investigating missing evidence.

## Reproduction and comparison

Slug `3637163-latest` (core `main` at `92e5c3a30476`, plain Standard install, Default Admin as admin theme). Before is unmodified core; After applies the fix patch.
Details, commands and the step table: [REPRODUCE.md](REPRODUCE.md). The pinned variant lists the same patch and is not built yet.

## What the proposal changes (Phase 1 only)

- Live preview (`migration/js/accent.js`, `settings.js`): a custom color is applied only if it is a six-digit hex color. Otherwise the last valid color stays, the typed text stays editable, and the field gets `aria-invalid` and a `role="alert"` message tied to it by `aria-describedby`. The `#000` fallback of the "custom" preset is no longer installed, and an invalid custom focus color never switches `data-admin-focus` to `custom`.
- Server (`Settings.php`): the fields validate on save with a message that says what is accepted (only while the matching preset is Custom), have a description naming the format, and the HTML pattern is anchored.
- Rendering (`Settings::getRenderableColors()`, `PreprocessHooks`, `ThemeHooks`): a stored invalid value is never printed into the `style` attribute or `drupalSettings`; the preset falls back to the default.
- Not in this proposal: any color syntax beyond six-digit hex (Phases 2 to 4 of the implementation prompt: named colors, `rgb()`, `oklch()`, a parser, opacity policy). The contrast check for the accent color is a separate issue, [#3637296](https://www.drupal.org/i/3637296).

## Evidence and readiness

Status: **reproduced on Before, fixed on After in the scripted checks**; see [EVIDENCE.md](EVIDENCE.md). Seven runs (Chromium light, dark, light and dark forced colors, 480px; Firefox; WebKit)
each report 0 After checks not met and 8 or 9 Before checks not met. The proposed tests fail on Before and pass on After ([TESTS-REPORT.md](TESTS-REPORT.md)); core's lint checks pass ([lint](lint/)).
Runs with paired screenshots: [playwright/README.md](playwright/README.md). An automated pass establishes neither conformance nor RTBC.

## Sources

- Issue: https://www.drupal.org/project/drupal/issues/3637163 (summary and comments fetched 2026-11-19; [intake/BRIEF.md](intake/BRIEF.md)). No merge request or issue-fork branch existed when fetched.
- Related: [#3637296](https://www.drupal.org/i/3637296) (contrast check for the custom accent color, postponed on this one), [#3636028](https://www.drupal.org/i/3636028) (the active accent color is not communicated).

## Not verified and next actions

- No person has reviewed this. No real screen reader (VoiceOver, NVDA) and no human keyboard pass; the client message is checked as markup (`role="alert"`, `aria-invalid`, `aria-describedby`), not heard.
- Not run: 200% zoom, translated or real RTL, Windows contrast themes, the user-profile override form, or JavaScript tests (Nightwatch or FunctionalJavascript) for the new browser behavior.
- The pinned variant and the Coder path have not been built.
- Next (owner: the contributor): review the patch and screenshots, decide whether to open a merge request, and whether more color formats (Phase 2) belong in a separate issue. Nothing has been posted to drupal.org.

## Acceptance and verification

Define observable user outcomes. Record which checks are planned, completed, blocked or unnecessary and why.
Repeat the original interaction in the relevant environment and assess adjacent states and regressions.
Record separately whether evaluation with disabled people is required, with the rationale and limitations.
WCAG mapping, suspected cause, severity and priority are optional assessments supported by evidence.
Keep severity (task impact) separate from priority (when to act).



## Reporting guidance

Adapted for Lab issue evaluation from
[Accessibility Bug Reporting Best Practices](https://github.com/mgifford/ACCESSIBILITY.md/blob/main/examples/ACCESSIBILITY_BUG_REPORTING_BEST_PRACTICES.md).
Use relevant environment details, redact private content and credentials, and describe visual evidence in text.
