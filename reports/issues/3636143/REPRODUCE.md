# Reproduce 3636143 with the separate skip-link proposal

**DRAFT, AI-assisted.** Local integration, not a replacement upstream patch.
Read [SUMMARY.md](SUMMARY.md) for the distinction between the two issues and [EVIDENCE.md](EVIDENCE.md) for measured results.

## Exact comparison

- Slug: `3636143-with-skip-focus`.
- Both sides: core `92e5c3a30476e248e82679cb63fa44c51bc667d0`.
- Plain Standard install, administrator, Navigation and Default Admin enabled; no recipe.
- Before: `issue-3636143-latest`, with the 3636143 navigation-border MR.
- After: `issue-3636143-with-skip-focus`, with that MR followed by the complete 3637339 focus/clearance proposal.
- [Patch order, hashes and source bases](BRANCHES.md).

The pristine 3636143 comparison remains separate. Do not apply either patch again to these already-built integration sites.

## Start without deleting data

Stop other Lab comparison sites first; retain the shared viewer proxy and unrelated DDEV projects.
Both integration sites are already built. From the repository root:

```bash
rtk proxy node scripts/doctor.mjs 3636143-with-skip-focus
rtk proxy node tools/compare/setup.mjs 3636143-with-skip-focus --check-patches
rtk proxy node scripts/lab-env.mjs start 3636143-with-skip-focus
```

For a first build only, run `node tools/compare/setup.mjs 3636143-with-skip-focus` before starting.
No reset, reinstall or database clearing is needed to switch comparisons.

Open [the local integration viewer](https://drupal-compare.ddev.site/?variant=3636143-with-skip-focus).
Use the viewer's one-time login links; do not put login tokens in evidence.
Use Open outside this tool for independent keyboard/screen-reader review, with focus mirroring disabled.

| Side | Direct settings page |
|---|---|
| Before | https://repro-issue-3636143-latest.ddev.site/admin/appearance/settings/default_admin |
| After | https://repro-issue-3636143-with-skip-focus.ddev.site/admin/appearance/settings/default_admin |

## Repeat the reported observation

1. Save Orange focus on both sites. Record accent separately; accent color does not select focus color.
2. With Auto appearance, record the real OS scheme. Alternatively save explicit Light, then explicit Dark, on both sites.
3. Reload and advance from browser chrome with Tab, observing each destination rather than assuming a fixed key count.
4. On Before, inspect the browser-colored skip-link ring. On After, expect the configured Orange variant and the complete outline at top/start.
5. Press Enter. Record focus, scroll and reading position; continue with Tab. Verify navigation remains usable.
6. Inspect and operate the navigation toggle separately. The border MR is present on both integration sides, so this is not a pristine-to-border-fix comparison.
7. Record OS, browser, saved choices, viewport, zoom, exact stack and actual observations. Do not turn an automated result into a human pass.

Both sites currently retain Auto appearance and Orange focus for review.
The browser's real OS preference determines whether Auto renders light or dark.
Forced colors may replace Orange with a system color; it should not be judged against the Orange RGB literal.

## Scripted replay

```bash
rtk proxy node tools/playwright/evaluate-3637339.mjs 3636143-with-skip-focus --scenarios=light-pink-orange,dark-pink-orange
rtk proxy node tools/playwright/evaluate-3637339.mjs 3636143-with-skip-focus --scenarios=dark-pink-orange --scheme=dark --forced-colors --viewport=375x900
rtk proxy node tools/playwright/evaluate-3637339.mjs 3636143-with-skip-focus --scenarios=dark-pink-orange --scheme=dark --forced-colors --viewport=1280x900
```

Run sequentially, not while a person is changing appearance settings.
The evaluator saves/restores settings through the UI and records actual issue/variant identity.
Exit 0 means the measured expectations pass, 1 means an After expectation failed, and 2 means infrastructure failure or incomplete comparison.
The replay is not a real screen-reader or Windows contrast-theme evaluation.
At 375px the desktop toggle is hidden, so its border contrast is not applicable.
Use the desktop run to measure that control; the viewer's token-mapping check alone does not measure contrast.

## Human review and stopping

Use the operation checklist in [the separate skip-link human guide](../3637339/HUMAN-REVIEW.md), but use the integration URLs and stack above.
Do not restart its separate comparison while this pair is active.
Human keyboard/screen-reader, Windows contrast-theme, zoom/reflow and translated-RTL outcomes remain UNTESTED.

When finished, stop only this pair and its viewer; retain its data:

```bash
rtk proxy node scripts/lab-env.mjs stop 3636143-with-skip-focus
```
