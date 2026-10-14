# Cloud quickstart: before/after in a DDEV Coder workspace (browser only)

The shortest browser-only path to a side-by-side Before/After, for someone who has a Coder account on https://coder.ddev.com and no
local Docker. The full procedure, the status table and what is *not* verified live in
[`../tools/compare/cloud/README.md`](../tools/compare/cloud/README.md); this page is the walkthrough.

**Honesty first:** the steps below are assembled from the tested 2026-10-02 run plus the 2026-10-14 documentation
refresh. Creating the workspace *from the web form* (rather than the CLI) is **not tested** — the cloud README's status table records
that — and `--core-url` / `--use-existing-core` are dry-run tested only. One person running this once and recording it turns those
rows into tested ones.

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
   | **Workspace name** | — | e.g. `drupal-lab-3619127` (simple name, no commas; used in the app URL) |
   | **DDEV project names** | `project_names` | `drupal-compare,drupal-compare-before,drupal-compare-after` (add `repro-<env>` names only if you want a direct URL to each site) |
   | **Public Sharing** | `share_projects` | Unchecked / `false` — keep the workspace owner-only; the sites use `admin` / `admin` |
   | **Enable Claude Code remote control** | `enable_claude_code` | Unchecked / `false` |
   | **Claude Code: skip permission prompts** | `claude_code_skip_permissions` | Unchecked / `false` |
   | **VS Code Extensions** | `vscode_extensions` | Leave empty / `[]` |

   The three `drupal-compare*` names in **DDEV project names** are required: two give each frame its own hostname and the third is the viewer's own address.
   Set `project_names` at creation; changing it afterwards was unreliable in the 2026-10-02 trial.

## 2. In the workspace web terminal

    git clone https://github.com/mgifford/drupal-core-lab.git && cd drupal-core-lab
    node scripts/cloud-bootstrap.mjs 3619127-pinned --install-autostart --core-url=https://github.com/drupal/drupal.git

- Replace `3619127-pinned` with the variant you want (a `-latest` slug follows current core `main`).
- `--core-url` points at the GitHub mirror: the workspace's egress filter blocks `git.drupalcode.org` and `drupal.org`.
- If a `drupal-core` issue-picker checkout already exists in the workspace, use `--use-existing-core` instead of `--core-url` to seed
  the same core revision with no clone at all.
- `--install-autostart` writes `~/.coder-startup.sh`, so a workspace restart brings both sites and the viewer back by itself.
- For core's Yarn 4, also `export COREPACK_NPM_REGISTRY=https://registry.npmjs.org` if you plan to lint.
- `--check` only reports what is missing, if the bootstrap stops.

Expect roughly 7 minutes from clone to smoke check in a fresh workspace (measured 2026-10-02). `cloud-smoke.mjs` runs at the end and
prints PASS/FAIL/NOT CHECKED.

## 3. Open and use the viewer

The bootstrap prints the exact URL, of the form

    https://drupal-compare--<workspace>--<owner>.coder.ddev.com/

Open it in a browser signed in to Coder (apps are owner-only). The viewer, both frames and the logins work exactly as in
`docs/USER-GUIDE.md`. **The smoke check cannot check the frames at the real Coder URLs** — it reports NOT CHECKED — so confirm them
by hand in the signed-in browser.

### Troubleshooting: frames show 403 / origin mismatch / "Log in" fails

If the frames show 403 errors, the "Log in both as admin" button does nothing, or the console shows:

> Failed to execute 'postMessage' ... target origin provided ('https://drupal-compare-before--...') does not match the recipient window's origin ('https://drupal-compare--...')

**The frames are loading the viewer's error page, not the Drupal sites.** This means the Drupal environments aren't reachable from the viewer's proxy.

**Checklist:**
1. **Drupal environments running?** In the workspace terminal: `ddev list` — you should see `baseline-<nid>` and `issue-<nid>` (or `baseline-latest`/`issue-latest`) with status `running`. If not: `node scripts/lab-env.mjs start <slug>`.
2. **Viewer proxy ports listening?** `curl -s http://127.0.0.1:8101/ | head -5` should return a Drupal page (or redirect to `/user/login`), not the viewer HTML. If it returns the viewer page or 502, the Drupal environment isn't built or isn't running.
3. **Environments exist?** `ls envs/` should show `baseline-...` and `issue-...` directories with `.ddev/config.yaml`. If missing: `node tools/compare/setup.mjs <slug> --rebuild`.
4. **Workspace name:** Use a unique name like `drupal-lab-3619127` (not `compare`). The app URL is `https://drupal-compare--<workspace>--<owner>.coder.ddev.com/`.
5. **Re-run bootstrap:** `node scripts/cloud-bootstrap.mjs <slug> --rebuild` (rebuilds sites, restarts everything).

## 4. Lifespan, restarts and coming back

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
`cloud-bootstrap.mjs <nid>-latest`. Nothing here posts, pushes or signs in to anything on its own.

## What is not covered

- Frames and login at the real Coder URLs from a signed-in browser (section 3) — confirm by hand.
- The 3619127 reproduction steps and keyboard behaviour inside the cloud frames.
- The web-form creation itself (this page documents the intended values; nobody has recorded a run).
- Any user other than the pilot owner; the access gate is described in `docs/CLOUD-PLAN.md`.
