# Drupal 3636143: navigation border and separate skip-link integration

> The toggle's own evaluation (versions A, B and C, the enhancement patch, interdiff and measurements) is in [TOGGLE-ENHANCEMENT.md](TOGGLE-ENHANCEMENT.md). This page covers the separate skip-link integration.

**DRAFT, AI-assisted; not RTBC.** Automated integration checked 2026-11-19. No human accessibility sign-off.

## What the screenshot showed

The reported screenshot came from the MR-only 3636143 site.
[MR !17738](https://git.drupalcode.org/project/drupal/-/merge_requests/17738) changes the navigation toggle border, not the skip link.
The blue skip-link ring with saved Orange focus was reproduced there.
It does not show that the separate [3637339 proposal](../3637339/SUMMARY.md) failed.

## Combined comparison now available

Open [the local integration viewer](https://drupal-compare.ddev.site/?variant=3636143-with-skip-focus).
Only this comparison's two Drupal sites should run, alongside the shared viewer proxy.

| Side | Code |
|---|---|
| Before | Core `92e5c3a30476` plus toggle-border MR !17738 |
| After | Same core and MR, plus the separate 3637339 skip-link focus/clearance proposal |

This is an integration stack, **not a new upstream patch for 3636143**.
Both original patch files are unchanged. [BRANCHES.md](BRANCHES.md) records the stack and hashes.
Use [REPRODUCE.md](REPRODUCE.md) for commands, settings and the correct site names.

With Orange saved, the After skip link follows the theme focus color in explicit Light and Dark modes.
A further Auto appearance / dark OS trial reproduces the screenshot's setting combination and shows Orange on After.
Enter reaches main content; the measured focus sequence remains unchanged. Narrow forced-colors emulation also passes the scoped checks.
See [EVIDENCE.md](EVIDENCE.md) and [the focused After capture](integration/after-auto-dark-orange-focused.png).

## Why the border check said "still fails"

The old check compared both appearances with one fixed RGB value.
Dark mode correctly uses a different border color, so that comparison could falsely report a failure.
The viewer now checks whether the toolbar uses the appearance-aware input-border token.
That is a code-mapping check, not a contrast verdict. The browser evaluator separately checks the 3:1 threshold.

| Saved appearance | MR border | Adjacent background | Computed contrast estimate |
|---|---|---|---|
| Light | `rgb(142, 146, 156)` | White | 3.11:1 |
| Dark | `rgb(153, 153, 153)` | `rgb(42, 42, 45)` | 5.02:1 |

Both meet the issue's 3:1 non-text objective in these measured states. This is not a text-contrast or whole-page conformance verdict.
Token-mapping fixtures reject the original mismatched token and accept both patched appearance states.
The visible desktop toggle also measures 21:1 in Chromium's dark forced-colors emulation.
At 375px the desktop toggle has no rendered area: its contrast check is explicitly not applicable, not passed.

## Remaining work

Real keyboard, screen-reader, Windows contrast-theme, translated RTL and zoom/reflow review remain outstanding.
The MR's discussion API returned HTTP 401; no inaccessible concerns are claimed resolved.
Comment #7 requests clearer visual evidence and questions contrast: measured border contrast does not settle every text/icon concern.

Next owner: the human contributor/reviewer. Review the saved focused captures, then test After in its own top-level tab.
Keep upstream submissions for 3636143 and 3637339 separate. Nothing here authorizes posting to Drupal.org.
