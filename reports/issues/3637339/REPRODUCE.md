# Reproduce Drupal issue 3637339

**DRAFT.** The unchanged MR assessment and separate experimental follow-up are identified below.
Findings and run identities are in [EVIDENCE.md](EVIDENCE.md).
For a guided review of the local proposal, start with [HUMAN-REVIEW.md](HUMAN-REVIEW.md).

## What to compare

- Issue: https://www.drupal.org/project/drupal/issues/3637339
- MR: https://git.drupalcode.org/project/drupal/-/merge_requests/17818
- Source branch: `3637339-skip-to-main`, tip `8c4a0e703168ebe9c3b37d3a8d00a2e89bc7ffa5`.
- Pinned comparison: `3637339-pinned`, core `7480c58b75c058f850b45e81664ac1df7d309744`.
- Latest comparison: `3637339-latest`, resolves upstream `main` when built; record the actual commit on both sides.
- Preconditions: plain Standard install, logged-in administrator, Default Admin administration theme.
  No recipe or content is needed.
- Before stack: no patches.
- After stack: only [the unchanged MR patch](branches/3637339-skip-to-main.patch).
  SHA-256: `d7f7290a5379e7019bc9ec0ed105a9db9763fef2b1dd3544c5cf96e3c312da1c`.
- Page: `/admin/appearance/settings/default_admin`.
- No local follow-up patch is part of this comparison.

The reported barrier is that keyboard users who customize the focus color encounter a different focus indicator on the
skip link. The test must distinguish the focus-color setting from the accent-color setting.
Changing only the accent does not necessarily change an independently configured focus color.

## Build and open the registered comparison

From the Lab repository root, with local Docker and DDEV:

```bash
node scripts/doctor.mjs 3637339-latest
node tools/compare/setup.mjs 3637339-latest --check-patches
node tools/compare/setup.mjs 3637339-latest
node scripts/lab-env.mjs start 3637339-latest
```

Open the printed Lab viewer URL. This registered comparison uses
`baseline-3637339-latest` and `issue-3637339-latest`; it is not two independent demonstration sites.
For the original MR base, use the same commands with `3637339-pinned`. That pair uses
`baseline-3637339` and `issue-3637339`.
Do not run both pairs at once when resources are limited. Stopping a pair preserves its data.

## Reproduce with real input

1. Log in using the Lab's one-time login links. Open the same settings page on both sites.
2. Save identical appearance, accent and focus options using Drupal's actual settings forms.
   Record the exact labels/values offered by this core version.
3. Disable focus mirroring in the viewer. Reload each page and use Tab to reach its skip link independently.
   Observe the actual active element after each key; do not inject focus classes or dispatch synthetic keyboard events.
4. Capture each focused state before switching documents. A browser cannot focus both frames simultaneously.
   Use the paired evidence screenshots to compare those genuinely focused states.
5. Compare the skip link's resolved outline color, width, offset and shadow with another keyboard-focused control.
   Inspect top and inline-start edges for clipping, not just color.
6. Press Enter on the skip link. Record its fragment, active element, subsequent Tab destination and scroll position.
   Determine whether keyboard navigation reached main content.
7. Repeat the matrix below, then repeat representative cases at tablet/mobile widths, RTL and emulated forced colors.
   Viewer RTL changes direction only; it is not a translated-language test.

## Required configuration matrix

| Appearance | Accent | Focus |
|---|---|---|
| Light | Default | Orange |
| Dark | Default | Green |
| Light | Pink | Same as Accent |
| Dark | Pink | Same as Accent |
| Light | Pink | Orange |
| Dark | Pink | Orange |

These are requested scenarios, not claims that every label exists in every version. Use verified equivalents or report an
unavailable option as not tested. Forced colors can override author colors; a system-color indicator is not expected to remain orange.

## Evidence and interpretation

The issue evaluator is [evaluate-3637339.mjs](../../../tools/playwright/evaluate-3637339.mjs), built on the existing Lab run library.
Timestamped output goes under [playwright/](playwright/). Consult each run's metadata for exact core and patch revisions,
browser version, settings, viewport, screenshots, keyboard trace, computed styles and axe results.

Run one command at a time: each run saves and restores theme settings through the UI, so concurrent runs would interfere.

```bash
node tools/playwright/evaluate-3637339.mjs 3637339-latest --viewport=1280x900
node tools/playwright/evaluate-3637339.mjs 3637339-latest --viewport=768x900
node tools/playwright/evaluate-3637339.mjs 3637339-latest --viewport=375x900
node tools/playwright/evaluate-3637339.mjs 3637339-latest --forced-colors --scheme=light --scenarios=light-default-orange
node tools/playwright/evaluate-3637339.mjs 3637339-latest --forced-colors --scheme=dark --scenarios=dark-pink-accent --viewport=375x900
node tools/playwright/evaluate-3637339.mjs 3637339-latest --rtl --scenarios=dark-pink-accent --viewport=375x900
node tools/playwright/evaluate-3637339.mjs 3637339-latest --scenarios=light-pink-focus-default,dark-pink-focus-default
node tools/playwright/evaluate-3637339.mjs 3637339-latest --browser=firefox --scenarios=light-pink-orange
node tools/playwright/evaluate-3637339.mjs 3637339-latest --browser=webkit --scenarios=light-pink-orange --tab-key=Alt+Tab
```

Default six-scenario runs include both saved Light and Dark appearance, irrespective of the OS scheme flag.
The evaluator repeats each configuration twice in fresh documents. Exit 1 can mean the explicit fully-in-viewport
outline expectation was not met even when the configured color passes. Exit 2 means an infrastructure error or incomplete
comparison, including an unavailable option or unreached keyboard state; it is not a product-failure verdict.
Read the individual results, not just the exit code.

WebKit plain Tab did not reach links on either side in this macOS automation environment. The explicit `Alt+Tab` command
tests its alternate link-navigation behavior; it is not evidence that plain Tab passed. Do not silently substitute keys.

The expected correction is configuration-sensitive focus styling, not simply different screenshots.
Geometry can identify a clipping risk but screenshots and visual review must corroborate painted visibility.
An automated detector pass is not accessibility conformance or RTBC.

WCAG 2.2: Focus Visible (2.4.7) and Focus Not Obscured (Minimum, 2.4.11) are AA; Non-text Contrast (1.4.11) is AA.
Focus Appearance (2.4.13) is AAA, not an AA gate. Partial clipping of an outline is not automatically a failure of 2.4.11.

Real Windows High Contrast, human keyboard review, real screen-reader behavior and zoom/reflow need separate evidence.
Browser-emulated forced colors are not Windows testing. See [SUMMARY.md](SUMMARY.md) for completed and outstanding checks.

## Separate experimental follow-up

Only after evaluating the original MR, the Lab registered `3637339-focus-clearance`.
Its Before is MR-only `issue-3637339-latest`; After is `issue-3637339-focus-clearance` with the MR followed by the
[captured clearance interdiff](branches/3637339-focus-clearance.patch). Both use fixed core `ecb483ff6d4b`.
The original MR and pristine baseline remain unchanged.

```bash
node tools/compare/setup.mjs 3637339-focus-clearance --check-patches
node tools/compare/setup.mjs 3637339-focus-clearance
node scripts/lab-env.mjs start 3637339-focus-clearance
node tools/playwright/evaluate-3637339.mjs 3637339-focus-clearance --viewport=1280x900
```

The [complete experimental patch](branches/3637339-focus-clearance-full.patch) is for clean core at that fixed revision.
The interdiff applies directly to MR tip `8c4a0e70`. Do not apply both artifacts together.
Review the experiment's actual outcomes in [EVIDENCE.md](EVIDENCE.md) before considering it an improvement.

## Retest after upstream changes

```bash
node scripts/issue-intake.mjs fetch 3637339
node scripts/issue-status.mjs 3637339
node tools/compare/setup.mjs 3637339-latest --check-patches
```

If the MR changes, refresh the saved patch using the documented `new-issue.mjs --refresh` workflow, record the patch change,
and collect fresh evidence. Do not silently substitute a local fix for the official MR.
