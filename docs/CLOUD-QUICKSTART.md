# Cloud quickstart: before/after in a DDEV Coder workspace (browser only)

The shortest browser-only path to a side-by-side Before/After, for someone who has a Coder account on https://coder.ddev.com and no
local Docker. The full procedure, the status table and what is *not* verified live in
[`../tools/compare/cloud/README.md`](../tools/compare/cloud/README.md); this page is the walkthrough.

**Honesty first:** the steps below are assembled from the tested 2026-10-02 run plus the 2026-10-14 documentation
refresh. Creating the workspace *from the web form* (rather than the CLI) is **not tested** — the cloud README's status table records
that. On 2026-10-16 the core half of `--core-url` was checked outside a workspace (a Claude Code cloud container): the GitHub mirror
has the pinned core commit of `3619127-pinned` and its three patches apply (`setup.mjs 3619127-pinned --checkout-only
--core-url=https://github.com/drupal/drupal.git`, 8 seconds). The full build with the mirror *inside* a workspace, and
`--use-existing-core`, have not been run. One person running this once and recording it turns those rows into tested ones.

**No local tools needed.** Everything below happens in a browser: the Coder web pages and the workspace's own web terminal. You do
not need the Coder CLI, Docker, Node or an AI assistant on your own computer.

For #3619127 there is also a path with no lab at all: two plain DDEV sites built by an agent in the workspace from a recipe you
paste in VS Code ([`reports/issues/3619127/CODER-PROMPT.md`](../reports/issues/3619127/CODER-PROMPT.md); not run yet).

## What needs what

| Step | Needs |
|---|---|
| Pick the issue, write and validate the issue pack (`issue-from-url.mjs`, `issue-pack.mjs validate`) | Node only — any bask terminal, no Docker |
| Build the two sites and run the viewer | Docker + DDEV — i.e. inside the Coder workspace |

## 1. Create the workspace (web UI)

1. Sign in at https://coder.ddev.com/workspaces and click **New workspace**.
2. In the template search box, type "DDEV Freeform" and select **DDEV Freeform** from the dropdown.
   (Or click **See all templates** at the bottom, then pick **DDEV Freeform**.)

   ⚠ Do **not** pick **Drupal Core Development** (at `/templates/drupal-core`) or **Drupal Contrib Development**: those are
   single-site templates with issue/branch/profile parameters. The lab needs **DDEV Freeform**, which has the Freeform
   parameters (`project_names`, `share_projects`, `enable_claude_code`, etc.). A "Drupal Core Development" workspace can still be adopted later
   with `--use-existing-core`.
3. Fill the **DDEV Freeform** parameters (these are the Freeform template's fields; the UI labels differ from the Terraform names):

   | UI Label | Terraform Name | Value |
   |---|---|---|
   | **DDEV project names** | `project_names` | `drupal-compare,drupal-compare-before,drupal-compare-after` (add `repro-<env>` names only if you want a direct URL to each site) |
   | **Public Sharing** | `share_projects` | Unchecked / `false` — keep the workspace owner-only; the sites use `admin` / `admin` |
   | **Enable Claude Code remote control** | `enable_claude_code` | Unchecked / `false` |
   | **Claude Code: skip permission prompts** | `claude_code_skip_permissions` | Unchecked / `false` |
   | **VS Code Extensions** | `vscode_extensions` | Leave empty / `[]` |

   The three `drupal-compare*` names are required: two give each frame its own hostname and the third is the viewer's own address.
   Set `project_names` at creation; changing it afterwards was unreliable in the 2026-10-02 trial.

## 2. In the workspace web terminal

Wait until the workspace page says **Running** and its startup scripts have finished, then click **Terminal** on the workspace page
(it opens a shell in the workspace in a new browser tab). Paste:

    git clone https://github.com/mgifford/drupal-core-lab.git && cd drupal-core-lab
    node scripts/test-mr.mjs 3619127

- Replace `3619127` with the issue you want; an issue number means its `-latest` variant (current core `main`), and a full slug
  such as `3619127-pinned` also works. `--dry-run` first prints the plan and changes nothing.
- It runs from any folder, brings the checkout up to date (local changes in the way go to `git stash`, never deleted), stops other
  comparisons' sites, and runs `scripts/cloud-bootstrap.mjs <slug> --install-autostart --core-url=https://github.com/drupal/drupal.git`:
  the GitHub mirror because the workspace's egress filter blocks `git.drupalcode.org` and `drupal.org`, autostart so a workspace
  restart brings both sites and the viewer back by itself. It ends with the viewer address in a framed block.
- Run it again whenever you like; that is also how a changed patch reaches the After site (bootstrap reapplies a patch file that
  changed since the site was built).
- To test a newer merge request revision: save its plain diff in a browser, upload it on GitHub into
  `reports/issues/<nid>/incoming/`, then `node scripts/test-mr.mjs <nid> --diff=reports/issues/<nid>/incoming/<file>`.
- If a `drupal-core` issue-picker checkout already exists in the workspace, `node scripts/cloud-bootstrap.mjs <slug>
  --install-autostart --use-existing-core` seeds the same core revision with no clone at all.
- Do not also run `tools/compare/cloud/start-viewer.sh` or `ddev stop --all` by hand: the first, without a variant, showed another
  issue in the viewer; the second stops the proxy projects the frames need.
- For core's Yarn 4, also `export COREPACK_NPM_REGISTRY=https://registry.npmjs.org` if you plan to lint.
- `--check` only reports what is missing, if the bootstrap stops.

Expect roughly 7 minutes from clone to smoke check in a fresh workspace (measured 2026-10-02). `cloud-smoke.mjs` runs at the end and
prints PASS/FAIL/NOT CHECKED. If the workspace network will not let Playwright download Chromium, the bootstrap says so and carries
on: the sites and the viewer are already running, and only the smoke check's frame check is NOT RUN (check the frames by hand).

If the preflight says the three `drupal-compare*` project names are missing, it prints the fix: in the browser, the workspace page >
**Settings** > **Parameters** (not tested), or create a new Freeform workspace with the names set at creation.

## 3. Open and use the viewer

The bootstrap prints the exact URL, of the form

    https://drupal-compare--<workspace>--<owner>.coder.ddev.com/

Open it in a browser signed in to Coder (apps are owner-only). The viewer, both frames and the logins work exactly as in
`docs/USER-GUIDE.md`. **The smoke check cannot check the frames at the real Coder URLs** — it reports NOT CHECKED — so confirm them
by hand in the signed-in browser.

### What to do in the viewer for #3619127

The viewer's Steps tab lists them; in short: press **Log in both as admin**, pick the **Tablet** or **Mobile** width, open
`/node/add/article`, click **Expand sidebar**, open **URL alias** and type `no-slash`, close the sidebar, click **Save**. Then turn
Mirror off and, in each frame, use the **URL alias** link in the error message with a real mouse click and again with the keyboard
(Tab to it, press Enter). Before: nothing visibly happens. After: the sidebar opens and the URL alias field has focus. Then press
**Run checks**. This is the first time the #3619127 steps are done in the cloud frames: note your browser and what you saw.

## 4. Lifespan, restarts and coming back

- To stop the workspace when you are done, press **Stop** on the workspace page (files are kept; **Delete** removes everything).
- A workspace has a **timed lifespan** (a deadline that activity extends) plus an idle autostop; it can expire. The app URL is
  derived from the workspace name, so recreating the workspace changes it.
- After any restart, `--install-autostart` (or running the bootstrap again) brings everything back; a restart stops every DDEV
  project and the viewer otherwise.
- If the workspace is gone, recreate it (step 1) and run the bootstrap again. Prefer `--use-existing-core` when a `drupal-core`
  checkout is already there.

## 5. Bring your own issue (optional)

The pack flow (`docs/ISSUE-TO-LAB.md`) runs in the workspace terminal too:

    node scripts/issue-from-url.mjs https://www.drupal.org/project/drupal/issues/<nid> --ai-recipe

It prepares the chat prompt, you save the assistant's reply as `issue-pack-<nid>.yml`, run it again to validate and import, then
`node scripts/test-mr.mjs <nid>`. Nothing here posts, pushes or signs in to anything on its own.

## What is not covered

- Frames and login at the real Coder URLs from a signed-in browser (section 3) — confirm by hand.
- The 3619127 reproduction steps and keyboard behaviour inside the cloud frames (the steps are above; nobody has recorded a run).
- The web-form creation itself (this page documents the intended values; nobody has recorded a run).
- Any user other than the pilot owner; the access gate is described in `docs/CLOUD-PLAN.md`.
