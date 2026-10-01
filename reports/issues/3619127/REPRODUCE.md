# Reproduce #3619127: forms sidebar does not open from Inline Form Errors links

Issue: https://www.drupal.org/project/drupal/issues/3619127 (MR !16895, Default Admin theme, WCAG 3.3.3).
Pinned core: `d29add7ebc18954dcb88877ed38b5bd88cdbf967` (2026-09-30). Last verified: 2026-10-01.
Also verified on core `main` at `073a7d38198` (2026-10-01): the patches apply and the walkthrough reports "reproduced and fixed".

## The problem in one paragraph
With the Inline Form Errors (IFE) module on, an error summary lists a link per invalid field. In the Default Admin theme,
fields in the sidebar of advanced settings ("URL alias", "Authoring information" and so on) are hidden when the sidebar is
closed, which it is by default on narrow screens. Clicking the error link does nothing: the sidebar stays closed, the field
is not shown and does not receive focus, so a keyboard or screen-reader user cannot reach the invalid field. The change
makes the sidebar open (without overwriting the saved open/closed preference) and the field receive focus.

## Steps to reproduce (the viewer shows these with checks)
1. Default Admin is the admin theme (the Standard install does this).
2. Create an Article content type with the Path module (recipe `recipes/ife_sidebar_repro` does 1 to 3).
3. Enable Inline Form Errors.
4. Open `/node/add/article`. 5. Make the window narrow so the sidebar of advanced fields collapses.
6. Press the sidebar toggle to open it. 7. In "URL alias" enter a value with no leading slash, for example `no-slash`.
8. Close the sidebar. 9. Press Save: an error summary appears with "URL alias" as a link.
10. Click that link, with a real click, and again using only the keyboard.

**Expected:** the sidebar opens and keyboard focus moves to the invalid URL alias field.
**Before the change:** nothing happens.

## Reproduce it, pinned core (exactly as verified)
Needs Docker, DDEV 1.24+, git, Node 20+, about 10 GB disk. First run takes 10 to 20 minutes.

    node tools/compare/setup.mjs 3619127-pinned        # clones core at the pinned commit, builds Before and After
    node tools/compare/serve.mjs 3619127-pinned        # viewer: http://localhost:8100/  (add --ddev for https://drupal-compare.ddev.site)
    node tools/playwright/walkthrough.mjs 3619127-pinned    # needs: cd tools/playwright && npm install && npx playwright install chromium

In the viewer: Log in, follow the steps (Mirror does 4 to 9 in both frames), turn Mirror off, click the link yourself in
each frame, then Run checks and answer the manual panel. The expected end state is a green banner.
Other ways in: the zip bundle (`bundles/`), or the individual patches in this folder.

## Latest core (does it still work on updated Drupal?)
    node tools/compare/setup.mjs 3619127-pinned --check-patches    # do the patches still apply to the pinned core?
    node tools/compare/setup.mjs 3619127-latest  --check-patches    # ...and to the current core main?
    node tools/compare/setup.mjs 3619127-latest                     # build Before and After on current core main
    node tools/playwright/walkthrough.mjs 3619127-latest            # reproduce and verify; read its "Interpretation"

The patch stack is, in order: `branches/3619127-forms-sidebar-with-ife.patch` (the MR), `patch-0-vanilla-js-no-jquery.patch`
(removes jQuery, answering a review objection), `patch-1-no-persist-and-waits.patch` (does not overwrite the saved
preference; test waits). `patch-2-optional-base-class.patch` is not applied by default.

## If the result is not what you expect
| What you see | What it probably means | What to do |
|---|---|---|
| A patch **does not apply** | Core changed the same lines (`core/themes/default_admin/migration/js/sidebar.js` or its library file) | Rebase the issue fork branch on current `main`, regenerate: `node scripts/new-issue.mjs 3619127 --branch 3619127-forms-sidebar-with-ife` (it keeps existing notes), then re-create patches 0 and 1 on top. |
| **Before no longer fails** | Upstream may have fixed it, or this theme's markup changed so the steps no longer match | Check the issue and `git log` for `core/themes/default_admin/migration/js/sidebar.js` before concluding anything. If merged, the walkthrough "Interpretation" will say it does not reproduce. |
| **After still fails** | The fix no longer works on this core | Compare the diff of `sidebar.js` against current core and update the patch. |
| Frames do not load | DDEV router or a stalled request | The viewer raises an alert; use Reload. See `docs/FRAME-LOADING-2026-10-01.md`. |
| Everything as expected on latest | Still reproducible and still fixed | Re-pin (below). |

## Re-pin to a newer core after verifying
1. Run the `3619127-latest` walkthrough and confirm "Reproduced and fixed".
2. Set `core.commit` of the `3619127-pinned` variant in `tools/compare/variants.json` to the commit the after environment is on
   (`git -C envs/issue-3619127-latest rev-parse HEAD`), and update the `pinnedNote`.
3. Re-run the walkthrough and diff report on pinned, commit the new evidence, update "Last verified" above.
Old evidence in `playwright/` folders is kept (each has its core commits in its summary).

## What was verified, and what was not
See `COVERAGE.md` for the matrix of browsers and colour modes (generated by `node scripts/coverage.mjs 3619127`; a missing row is a gap).
Verified 2026-10-01 on the pinned core: automated PHPUnit test (fails without the change, passes with it), Playwright
walkthrough with real mouse and keyboard-only input (Before fails the three fix checks, After passes; regression checks
unchanged; axe 0 violations both sides), a virtual screen reader run (announcement identical on both sides), the diff report
(1 changed served file, `sidebar.js`), and the live viewer. **Not done:** a real VoiceOver or NVDA pass (deferred by
decision), Firefox (Playwright's Firefox does not launch on this machine), other themes. Evidence is a DRAFT until a person has reviewed it.
See `FINDINGS-2026-10-01.md` (including an upstream finding that is not caused by the patch) and `STATUS-2026-10-01.md`
(related issues, review threads; **re-check on drupal.org before relying on it**).

## Folder map
| Path | What |
|---|---|
| `branches/`, `BRANCHES.md` | Patches from the issue forks with source, tip, base, date. |
| `patch-0/1/2-*.patch`, `VALIDATION.md` | The stacked patches and how they were validated. |
| `FINDINGS-2026-10-01.md`, `STATUS-2026-10-01.md` | Findings and a dated snapshot of related issues. |
| `playwright/`, `screenreader/`, `compare/` | Generated evidence (summary, results, screenshots). |
| `dark-mode-accent/` | Unconfirmed material, filed here by file overlap (see `BRANCHES.md`). |
