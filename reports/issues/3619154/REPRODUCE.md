# Reproduce #3619154: Sidebar toggle fixes (Default Admin meta sidebar)

Issue: https://www.drupal.org/project/drupal/issues/3619154
Pinned core: `6868135abe8e` (the 2026-10-14 review of MR !16911, branch `sidebar-toggle-fixes` @ `6f7766cb`).
Last verified: 2026-10-14 (pinned, DDEV, toggle slice only). 2026-10-17: the evaluator was rewritten and checked against that same
revision on core main `f2abd41`, in normal and forced colours, in a scratch environment, not DDEV
([validation/2026-10-17-scratch/](validation/2026-10-17-scratch/SUMMARY.md)). MR head since 2026-10-17: `175e6f17`, not yet in the lab.

## The problem in one paragraph
On entity edit forms in Default Admin, the meta sidebar's show/hide toggle and its close control are `<a href="#…" role="button">`
links, so Space does nothing on them (Enter works). Below 1024px the sidebar overlays the page, but focus stays on the toggle. Tab
still reaches the page under the overlay, and Escape does not close it. At 1000px the sidebar's top sits 49px under the top bar. At
800px and 480px its close button is under the top bar, where a mouse click cannot reach it. A first visit below 1024px
briefly paints the sidebar on screen before hiding it. Standards mapping is a person's call. Space on a `role="button"` is an ARIA
authoring expectation, most often filed under 4.1.2 Name, Role, Value. Focus left behind an overlay, and Tab reaching the covered
page, relate to 2.4.3 Focus Order.

## Evaluate the new revision: MR !16911 at `175e6f17`
Same MR and branch (`sidebar-toggle-fixes`) as the 2026-10-14 review. The 2026-10-17 14:55 UTC push merged `main` and ended with
`175e6f17` "Fix close button focus state when in forced colors", the answer to comment #23 ([STATUS-2026-10-17.md](STATUS-2026-10-17.md)).
The lab still has `6f7766cb`, which no longer applies to `main`. Since core commit `aeca9d7` (2026-10-14), its hunk for
`core/profiles/demo_umami/tests/src/FunctionalJavascript/MultipleRequestsPerformanceTestAssertions/umamiNodeAddEditor.yml` fails.

**The first question:** does R12, the close button's icon when it has focus, pass in forced colours? It fails with `6f7766cb`
([validation](validation/2026-10-17-scratch/SUMMARY.md)). **The second:** did anything else change? Compare the whole table with that
validation run.

### 1. Put the new revision's patch in the lab
This needs a network that reaches git.drupalcode.org. **DDEV Coder workspaces and Claude Code cloud sessions do not**
(`tools/compare/cloud/README.md`), so do this step on your laptop, or in a browser.

- **Laptop (preferred: the lab records the tip and base for you):**

        node scripts/issue-intake.mjs fetch 3619154      # issue, MR threads, related issues -> intake/BRIEF.md (AGENTS.md rule 15)
        node scripts/issue-status.mjs 3619154 --write    # MR head against the patch the lab tested
        node tools/playwright/evaluate-3619154.mjs 3619154-pinned --forced-colors   # optional, BEFORE refreshing: 6f7766cb in the lab (R12 should fail)
        node scripts/new-issue.mjs 3619154 --branch sidebar-toggle-fixes --refresh  # tip should read 175e6f17

  The old patch is kept in `original-patches/`, with a row in `PATCH-CHANGES.md`. Commit the refreshed files and push them to this
  branch if you also want to use Coder.

- **Browser only:** open the issue page's "plain diff" link (https://git.drupalcode.org/project/drupal/-/merge_requests/16911.diff)
  and save it. Then give it to the lab in one of two ways. Attach it to the Claude session. Or upload it on GitHub with "Add file >
  Upload files" into `reports/issues/3619154/incoming/` on this branch. Then, in any checkout with Node (a Coder workspace included):

        cp reports/issues/3619154/incoming/16911.diff reports/issues/3619154/branches/sidebar-toggle-fixes.patch
        node scripts/patch-change.mjs record reports/issues/3619154/branches/sidebar-toggle-fixes.patch --by "<you>" \
          --reason "MR !16911 at 175e6f17 (head shown on the MR page), GitLab plain diff, downloaded <date>"

  A plain diff carries no commit hash, so the head goes in the reason. `BRANCHES.md` still names `6f7766cb` until someone runs the
  laptop command.

### 2a. Compare on your laptop (local DDEV)

        node scripts/doctor.mjs 3619154-latest
        node tools/compare/setup.mjs 3619154-latest --check-patches     # must say the patch applies
        node tools/compare/setup.mjs 3619154-latest                     # first time; --refresh-patches if it was built before
        node scripts/lab-env.mjs start 3619154-latest --browser         # the viewer, with the lab browser's forced-colours switch
        node tools/playwright/evaluate-3619154.mjs 3619154-latest --forced-colors   # R12 is the comment #23 question
        node tools/playwright/evaluate-3619154.mjs 3619154-latest                   # normal colours; exit 0 = everything as expected

### 2b. Compare in DDEV Coder (browser only)
Follow [docs/CLOUD-QUICKSTART.md](../../../docs/CLOUD-QUICKSTART.md). Its own status table says the web-form creation and the
frames at the real Coder URLs have not been recorded by anyone yet.

1. At https://coder.ddev.com/workspaces create a **DDEV Freeform** workspace. Set **DDEV project names** to
   `drupal-compare,drupal-compare-before,drupal-compare-after` and leave **Public Sharing** off (the sites use admin / admin).
2. In the workspace's web terminal:

        git clone https://github.com/mgifford/drupal-core-lab.git && cd drupal-core-lab
        git checkout ccr-93c98e37-lv7mfj             # until this work is merged into main
        # step 1, browser-only route, if the refreshed patch is not in the repository yet
        node scripts/cloud-bootstrap.mjs 3619154-latest --check --core-url=https://github.com/drupal/drupal.git
        node scripts/cloud-bootstrap.mjs 3619154-latest --install-autostart --core-url=https://github.com/drupal/drupal.git

3. Open the viewer address the bootstrap prints, in a browser signed in to Coder. The **Steps** tab lists the issue's testing steps,
   including the forced-colours one. For forced colours in a cloud lab, use your own browser: Chrome or Edge DevTools > More tools >
   Rendering > "Emulate CSS media feature forced-colors" (it applies to the whole tab, both frames), or a Windows contrast theme.
   The lab browser and **Open preference emulation window** start Chromium on the machine that runs the lab, so they are for
   local DDEV only.
4. Scripted, in the same terminal (Chromium is installed by the bootstrap's smoke check unless the network refuses it; not yet run
   inside a workspace):

        node tools/playwright/evaluate-3619154.mjs 3619154-latest --forced-colors

   For an agent in the workspace instead: `node scripts/coder-prompt.mjs 3619154-latest --write` writes `CODER-PROMPT.md`. Generate
   it only after step 1: it names the patch with its hash.

### 3. Fill the coverage matrix, then the code checks

        node tools/playwright/evaluate-3619154.mjs 3619154-latest --viewport=480x900
        node tools/playwright/evaluate-3619154.mjs 3619154-latest --scheme=dark
        node tools/playwright/evaluate-3619154.mjs 3619154-latest --browser=firefox
        node tools/playwright/evaluate-3619154.mjs 3619154-latest --browser=webkit
        node scripts/coverage.mjs 3619154
        node scripts/lint.mjs 3619154-latest

Then do a person's keyboard pass in the viewer and save its log under `manual/`.

## How to read the run
`SUMMARY.md` in the run folder has one table. **Fix** rows (F) should fail Before and pass After. **Regression** rows (R) should
pass After. **Observed** rows (O) are for a person:

- R12 (with `--forced-colors`): the close button's icon with focus, comment #23. O11 gives the pixel counts; the run folder has
  `*-close-rest.png` and `*-close-focus.png`.
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
