# Evidence: issue 3619154 (Accessibility fixes for Admin theme's node add/edit sidebar toggle control)

Status: DRAFT until a human has reviewed. MR: !16911 (branch `sidebar-toggle-fixes`).
Date: 2026-10-14   Author/agent: GitHub Copilot (Claude Opus 4.8)

## Environments (exact commits)
| Env | Directory | Commit | Notes |
|-----|-----------|--------|-------|
| Baseline (Before) | envs/baseline-3619154 | 6868135abe8e | upstream core at the MR base |
| Patched (After) | envs/issue-3619154 | 6868135abe8e + sidebar-toggle-fixes.patch | MR !16911 |

Both run Default Admin as the admin theme (set by recipes/repro_3619154), Navigation, an Article type and one node, so /node/1/edit shows the meta sidebar.

## Automated results

### Playwright toggle-slice evaluator (tools/playwright/evaluate-3619154.mjs)
| Fact | Before | After |
|------|--------|-------|
| Toggle / close element | `<a role="button">` | native `<button>` |
| Keyboard Space on the toggle | no change (anchor ignores Space) | toggles |
| First focusable in sidebar | a form field | the close button |

Evidence: `playwright/2026-10-14T15-27-15-737Z-evaluate/`.

### Proposed FunctionalJavascript test (branches/3619154-proposed-test.patch)
`SidebarToggleTest` (5 tests) covers: controls are `<button>`; aria-expanded tracks state on click; state and width persist across reload; below 1024px the covered content is `inert`, focus moves to the close button and Escape closes the sidebar and returns focus to the toggle; the close button is first in the sidebar.

| Run | Command | Result |
|-----|---------|--------|
| After (patched) | `ddev phpunit .../FunctionalJavascript/SidebarToggleTest.php` | OK — 5 tests, 51 assertions |
| Before (baseline) | same test copied in | FAILURES — 5 tests fail (toggle is `<a>`, no state/inert/focus/Escape) |

The MR itself adds no behavioral test; its only test change is a Umami performance byte-count assertion (`umamiNodeAddEditor.yml`).

## Not verified
- No-flash of the open sidebar on load (needs pre-paint timing; not reliably automatable — manual/visual only).
- Resize after AJAX, touch resize, and RTL drag (flaky under WebDriver; left to manual testing).
- Real screen-reader and forced-colours passes (out of scope here; forced-colours colour is tracked in #3619155).
