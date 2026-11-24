# Evidence: issue #2574721

**DRAFT.** Recorded 2026-11-23. A person has not reviewed or posted this evidence.

## Environments

| Side | Environment | Core commit | Patch |
|---|---|---|---|
| Before | `baseline-2574721-current` | `97c6ff8b2534b242c0f1df3e4ba2493e56aebcec` | pristine |
| After | `issue-2574721-current` | `97c6ff8b2534b242c0f1df3e4ba2493e56aebcec` | `2574721-current-main-proposal.patch` |

Profile: Standard. Default and admin theme: `default_admin`. Drupal: 12.0-dev. PHP: 8.5.13. OS: macOS ARM64.

## Patch identity

| Artifact | Base/start | SHA-256 (short) | Result |
|---|---|---|---|
| MR patch | core `9e8373659f26`, tip `ed3917f4` | lab content `branches/drupal-2574721.patch` | applies cleanly on declared base |
| Interdiff | MR `ed3917f4` | `c6646ab6` | applies after MR patch |
| Full pinned proposal | core `9e8373659f26` | `6362593d` | applies cleanly as a full replacement |
| Current-main proposal | core `97c6ff8b253` | `e2ce2f3b` | applies cleanly |

## Automated and browser results

| Run | Result |
|---|---|
| `scripts/lint.mjs 2574721-latest` | PASS: CSpell, PHPStan, PHPCS, TwigCS, Stylelint, generated CSS |
| `ddev phpunit ... --filter testModuleListForm` on Before | PASS, 1 test, 11 assertions |
| `ddev phpunit ... --filter testModuleListForm` on After | PASS, 1 test, 15 assertions |
| Chromium 1280 light | reproduced-and-fixed; 0 axe violations; 0 JavaScript errors |
| Chromium 480 light | reproduced-and-fixed; 61 cells/72 links After; toggle and Tab passed; 0 axe violations |
| Chromium 1280 dark | reproduced-and-fixed; 0 axe violations; 0 JavaScript errors |
| Chromium 1280 forced colours | reproduced-and-fixed; one pre-existing color-contrast axe finding on both sides |
| Firefox 1280 | reproduced-and-fixed; 0 axe violations; 0 JavaScript errors |
| WebKit 1280 | reproduced-and-fixed for visibility/opening/viewport; link traversal recorded for human Safari confirmation |
| `tree-diff.mjs 2574721-latest --viewport=480x900` | +296 accessibility-tree lines, 0 unresolved ID references |

The exact Chromium, Firefox, and WebKit run reports and screenshots are in [`playwright/`](playwright/).
The narrow accessibility tree, ARIA, and Guidepup diffs are in [`tree-diff/2574721-latest-480x900/`](tree-diff/2574721-latest-480x900/).

## Interpretation

Before exposes 0 dedicated operations cells at 480px. After exposes operations for 61 module rows and 72 links.
The operation order is Configure, Permissions, then Help. One-link rows render without a multiple-action toggle through core’s dropbutton element.

The evidence supports the reflow and discoverability fix. It does not establish WCAG conformance or RTBC because automated testing cannot replace a person.

## Not verified

- Real VoiceOver or NVDA.
- Person-led keyboard pass and visual focus inspection.
- Safari with Full Keyboard Access enabled.
- 200% and 400% zoom review.
- Direct 320px viewport geometry.
- Disabled-user evaluation.
