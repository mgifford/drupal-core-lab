# Reproduce #3619154: Sidebar toggle fixes (Default Admin meta sidebar)

Issue: https://www.drupal.org/project/drupal/issues/3619154
Pinned core: `6868135abe8e` (the 2026-10-14 review of MR !16911, branch `sidebar-toggle-fixes` @ `6f7766cb`).
Last verified: 2026-10-14 (pinned, DDEV, toggle slice only). 2026-10-17: the evaluator was rewritten and checked against that same
revision on core main `f2abd41` in a scratch environment, not DDEV ([validation/2026-10-17-scratch/](validation/2026-10-17-scratch/SUMMARY.md)).

## The problem in one paragraph
On entity edit forms in Default Admin, the meta sidebar's show/hide toggle and its close control are `<a href="#…" role="button">`
links, so Space does nothing on them (Enter works). Below 1024px the sidebar overlays the page, but focus stays on the toggle. Tab
still reaches the page under the overlay, and Escape does not close it. At 1000px the sidebar's top sits 49px under the top bar. At
800px and 480px its close button is under the top bar, where a mouse click cannot reach it. A first visit below 1024px
briefly paints the sidebar on screen before hiding it. Standards mapping is a person's call. Space on a `role="button"` is an ARIA
authoring expectation, most often filed under 4.1.2 Name, Role, Value. Focus left behind an overlay, and Tab reaching the covered
page, relate to 2.4.3 Focus Order.

## Evaluate a new merge request revision
The `3619154-latest` pair is Before = current core `main`, After = `main` plus the patch. **The patch the lab has (6f7766cb) no
longer applies to `main`**: since core commit `aeca9d7` (2026-10-14, "Follow-up for SA-CORE-2026-016: update performance tests") its
hunk for `core/profiles/demo_umami/tests/src/FunctionalJavascript/MultipleRequestsPerformanceTestAssertions/umamiNodeAddEditor.yml`
fails. Everything else applies. So refresh the patch first.

1. Read what changed, on drupal.org (AGENTS.md rule 15; this was not possible from the 2026-10-17 cloud session):

        node scripts/issue-intake.mjs fetch 3619154      # issue, every MR, review threads, related issues -> intake/BRIEF.md
        node scripts/issue-status.mjs 3619154 --write    # MR head against the patch the lab tested

2. Get the new revision's patch. Use the case that matches the issue page:

   **A. New push to the same branch** (`sidebar-toggle-fixes`): the patch file is replaced in place. The old one is kept in
   `original-patches/` with a row in `PATCH-CHANGES.md`. Both variants use the new file, and the 2026-10-14 run becomes stale.

        node scripts/new-issue.mjs 3619154 --branch sidebar-toggle-fixes --refresh

   **B. New merge request from another branch**: this adds `branches/<new-branch>.patch` and a `BRANCHES.md` row. Variants are not touched.

        node scripts/new-issue.mjs 3619154 --branch <new-branch>

   then give only the latest pair the new patch, in `tools/compare/variants.json`, entry `3619154-latest`:

        "after": { "env": "issue-3619154-latest", "patches": ["reports/issues/3619154/branches/<new-branch>.patch"] }

   (`extends` merges `after` one level deep, so this replaces the patch list for `-latest` only; `-pinned` keeps the 2026-10-14
   review.)

   In DDEV Coder instead of local DDEV: after either case, `node scripts/coder-prompt.mjs 3619154-latest --write` and follow
   `CODER-PROMPT.md` (it names the patch stack with its hash, so generate it only after the refresh).

3. Build and compare:

        node scripts/doctor.mjs 3619154-latest
        node tools/compare/setup.mjs 3619154-latest --check-patches     # must say the patch applies
        node tools/compare/setup.mjs 3619154-latest                     # first time; --refresh-patches if it was built before
        node scripts/lab-env.mjs start 3619154-latest --browser         # the viewer: Before | After, same page, same steps
        node tools/playwright/evaluate-3619154.mjs 3619154-latest       # scripted Before/After; exit 0 = everything as expected

4. Fill the coverage matrix, then the code checks:

        node tools/playwright/evaluate-3619154.mjs 3619154-latest --viewport=480x900
        node tools/playwright/evaluate-3619154.mjs 3619154-latest --scheme=dark
        node tools/playwright/evaluate-3619154.mjs 3619154-latest --forced-colors
        node tools/playwright/evaluate-3619154.mjs 3619154-latest --browser=firefox
        node tools/playwright/evaluate-3619154.mjs 3619154-latest --browser=webkit
        node scripts/coverage.mjs 3619154
        node scripts/lint.mjs 3619154-latest

5. Compare the new run's table with [the previous revision's](validation/2026-10-17-scratch/SUMMARY.md). Rows that change are
   what the new revision changed. Then do a person's keyboard pass in the viewer and save its log under `manual/`.

## How to read the run
`SUMMARY.md` in the run folder has one table. **Fix** rows (F) should fail Before and pass After. **Regression** rows (R) should
pass After. **Observed** rows (O) are for a person:

- O1, the toggle's accessible name. O2, the Alt+S shortcut (Before has one; the previous revision removed it).
- O3, the resize handle at 960px. O4, the sidebar top against the top bar.
- O10, 1100px with both panels stored open (After showed both; Before collapses Navigation).

F11 (details and Navigation) is "n/a" on a side where the sidebar and an expanded Navigation cannot both be open. Below 1280px, a
click that opens one closes the other: Before's `sidebar.js`, and Default Admin's `navigation.js` on both sides.

| What you see | What it probably means | What to do |
|---|---|---|
| `setup.mjs --check-patches`: **does not apply** | Core changed the same lines | Check which hunk; the umami YAML above is a known one. Ask for a reroll or, for a test-only file, note it. |
| The run stops with `No .meta-sidebar__trigger on /node/1/edit`, or most rows say `n/a` | The recipe did not run, or the new revision renamed the toggle or close classes (`.meta-sidebar__trigger`, `.meta-sidebar__close`) | Check the recipe, then update `SEL` in `tools/playwright/sidebar-3619154.mjs`; do not judge the fix from that run. |
| **NOT REPRODUCED on Before** | Core `main` changed, or a probe is wrong | Check recent commits to `core/themes/default_admin` before concluding anything. |
| **NOT FIXED on After** / **REGRESSION on After** | The new revision behaves differently from the previous one | Compare with the 2026-10-17 validation table, then look in the viewer. |

## Reproduce the 2026-10-14 review exactly (pinned core)
    node tools/compare/setup.mjs 3619154-pinned
    node tools/playwright/evaluate-3619154.mjs 3619154-pinned

The 2026-10-14 run in `playwright/2026-10-14T15-27-15-737Z-evaluate/` came from the earlier script. Its "sidebar shown" row is
always `false` because that script tested `offsetParent`, which is `null` for this `position: fixed` sidebar. Its element, Enter and
Space rows stand.

## Re-pin to a newer core after verifying
1. Run the `-latest` variant to the end and confirm the summary says `reproduced-and-fixed`.
2. Put the verified commit (`git -C envs/issue-3619154-latest rev-parse HEAD`) in `core.commit` of `3619154-pinned` in `tools/compare/variants.json`.
3. Re-run the evaluator and the diff report, commit the new evidence, update "Last verified" above.

## What is in this folder
| Path | What |
|---|---|
| `branches/*.patch`, `BRANCHES.md` | Patches from the issue fork, with source, tip, base and date. |
| `STATUS-<date>.md` | Related issues and review threads, dated. Re-check on drupal.org before relying on it. |
| `EVIDENCE.md` | Results with exact commits. DRAFT until a person has reviewed it. |
| `playwright/` | Generated lab runs (`evaluate-3619154.mjs`). Counted by `scripts/coverage.mjs`. |
| `validation/` | Checks of the evaluator itself, outside DDEV. Not lab evidence and not counted. |
| `ISSUE-COMMENT-DRAFT.md` | A draft for a human to review and post. Nothing is posted automatically. |
