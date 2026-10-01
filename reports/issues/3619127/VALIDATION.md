# Validating the vanilla-JS variant for #3619127 (before / after)

Goal: show that opening the Default Admin sidebar from an Inline Form Errors
(IFE) link works with no jQuery dependency in `sidebar.js`, answering
mherchel's objection on MR !16895. Patches stack: 0, then 1, then 2 (optional).

Conditions held constant for every run: same upstream `main` base, same
browser (headless Chrome via the DDEV selenium add-on, or your own Chrome for
the manual pass), same viewport (800x823, so the sidebar starts closed), same
test node form (`/node/add/article`).

## A. Setup

    # in envs/issue-3619127-mr (MR !16895 rebased on upstream main)
    ddev start && ddev composer install
    cp -n core/phpunit.xml.dist core/phpunit.xml

Run the test with:

    ddev exec 'cd /var/www/html && BROWSERTEST_OUTPUT_DIRECTORY=/tmp \
      vendor/bin/phpunit -c core \
      core/themes/default_admin/tests/src/FunctionalJavascript/AdminInlineFormErrorsTest.php'

## B. Automated evidence (four states)

| # | State | How | Expected |
|---|-------|-----|----------|
| 1 | Baseline: no fix | `git checkout base-upstream -- core/themes/default_admin/migration/js/sidebar.js core/themes/default_admin/default_admin.libraries.yml`, keep the test | FAIL at the "field is visible after clicking the error link" assertion |
| 2 | MR as written (jQuery) | `git checkout test-3619127 -- <those two files>` | PASS |
| 3 | Patch 0: vanilla JS | `git apply reports/issues/3619127/patch-0-vanilla-js-no-jquery.patch` on state 2 | PASS, and `core/jquery` absent from the `sidebar` library |
| 4 | Patch 0 + 1: no persist, no sleeps | `git apply reports/issues/3619127/patch-1-no-persist-and-waits.patch` | PASS (13 assertions) |

Negative control for patch 1: change `showSidebar(false)` back to
`showSidebar()` in the fragment handler. The test must FAIL at the
`localStorage` assertion.

Static proof that jQuery is gone:

    git grep -n "jQuery\|\$(" core/themes/default_admin/migration/js/sidebar.js   # no matches
    git grep -n "core/jquery" core/themes/default_admin/default_admin.libraries.yml  # not under `sidebar:`

## C. Manual pass (keyboard, then screen reader)

Do this on a site with `inline_form_errors`, `node`, `navigation` enabled and
the Admin (Default Admin) theme, once on state 1 (before) and once on state 3
or 4 (after). Browser window about 800px wide so the sidebar starts closed.

Keyboard only (no mouse):

1. Open `/node/add/article`, Tab to the sidebar toggle, press Enter to open it.
2. Tab to "URL alias", press Enter/Space to open it, type `no-slash`.
3. Shift+Tab / Tab back to the toggle, press Enter to close the sidebar.
4. Tab to Save, press Enter. Confirm the error summary appears.
5. Tab to the "URL alias" link in the error summary, press Enter.

Pass criteria:
- Sidebar opens, the URL alias field is visible, and keyboard focus lands in it
  (2.4.3 Focus Order, 3.3.1/3.3.3 Error Identification/Suggestion).
- Focus is visible (2.4.7) and not hidden behind sticky UI (2.4.11).
- No keyboard trap; Shift+Tab leaves the sidebar normally (2.1.2).
- Pressing Enter a second time on the same error link (same hash, so no
  `hashchange`) still works. This is why the click listener exists.
- Reload: the sidebar returns to the state the user last chose, not to open.

Screen reader (VoiceOver + Safari, and NVDA + Firefox if available):

- Step 5 announces the focused field with its label, "invalid" state and the
  error text.
- The toggle's `aria-expanded` changes to `true` when the sidebar opens and its
  label becomes "Hide sidebar panel".
- Record: AT name/version, browser/version, OS, and result per step.

Forced colours (Chrome DevTools: Rendering > emulate `forced-colors: active`):
focus outline on the field is visible. This patch does not change CSS, so this
is a regression check only.

## D. Before/after record

| Check | Before | After (patch 0) | After (patch 0+1) |
|-------|--------|-----------------|-------------------|
| Automated test | | | |
| Keyboard: sidebar opens | | | |
| Keyboard: focus in field | | | |
| Re-click same link works | | | |
| `localStorage` preference unchanged | | | |
| jQuery in `sidebar` library | | | |
| VoiceOver announces field + error | | | |

Fill this in as evidence for the issue comment. Findings stay a DRAFT until
the manual rows are completed.
