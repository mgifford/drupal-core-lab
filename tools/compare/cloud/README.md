# Compare viewer in a DDEV Coder workspace (browser only)

Runs the existing Before/After viewer in a DDEV Coder **Freeform** workspace and opens it at Coder app URLs, with no local
Docker and no `coder port-forward`. The local workflow is unchanged. Everything here is opt-in and was tested on 2026-10-02 with
variant `3619127-pinned`; the status table says exactly what was and was not tested.

## Status

| Item | Status | Evidence |
|---|---|---|
| Create a workspace with the five project names at creation (`coder create --rich-parameter-file`) | **Tested** | `lab-fresh-1`, template version `impromptu_wise78`; names appeared in `CODER_PROJECT_NAMES`, all apps redirect to Coder sign-in (owner-only) |
| One command builds, registers, starts and smoke-checks (`scripts/cloud-bootstrap.mjs`) in a fresh workspace | **Tested** (smoke passed; about 7 minutes from clone to smoke on that run; its exit code was not logged) | `lab-fresh-1`, branch `cloud-bootstrap` at commit `72c25a6` |
| Safe to run again (skips the build, restarts what is stopped) | **Tested** | three reruns on two workspaces, one after a restart |
| Setup refuses a second concurrent run | **Tested locally** | live lock exits 2 with a message; stale lock taken over |
| Smoke check fails when something is broken | **Tested** | Before proxy stopped gives FAIL and exit 1; started again gives PASS |
| Recovery after a workspace restart through `~/.coder-startup.sh` | **Tested** | `lab-fresh-1` restarted twice; the second time everything, including the frame check, passed with no manual command |
| Repo's viewer security regression test (`tools/playwright/viewer-security.mjs`) | **Tested**, 10 of 10 pass | run in `lab-3619127` against a default (non-cloud) viewer |
| Viewer, both frames and login in a signed-in browser at the Coder URLs | **Tested by hand** by the pilot owner in `lab-3619127` | not re-checked in `lab-fresh-1`; the smoke check cannot check it (it reports NOT CHECKED) |
| The 3619127 reproduction steps and keyboard behaviour in the cloud frames | **Not tested** | |
| Creating the workspace from the Coder web form instead of the CLI | **Not tested** | |
| Anyone other than the pilot owner (access, quota, the sponsorship gate in `docs/CLOUD-PLAN.md`) | **Not tested** | |
| `compare-cloud.conf` and the full local workflow after these changes | **Partly**: viewer defaults checked locally; the DDEV nginx file was not (Docker was off) | |

## Prerequisites and access

- A Coder account on https://coder.ddev.com with access to the **Freeform** template. The pilot owner has it. Whether other accounts do is not verified;
  `docs/CLOUD-PLAN.md` describes a sponsorship gate.
- The Coder CLI (v2.37.2 matched the server) on your own machine, to create and stop the workspace.
- Do not enable **Public Sharing**: the sites use `admin` / `admin` and the viewer can drive them. Leave the workspace owner-only.
- The template defaults are 4 CPU and 8 GB (`variable "cpu"` and `"memory"` in the template source); the live workspace page showed the same. Quotas for other accounts are not verified.

## Procedure

1. Create the workspace. The DDEV project names must include the three proxy projects (`drupal-compare`, `drupal-compare-before`,
   `drupal-compare-after`), and every template parameter must be supplied (the CLI stops at any it is not given). Put them in a file, for example `params.yaml`:

       project_names: "repro-baseline-main,repro-issue-3619127-vanilla,drupal-compare,drupal-compare-before,drupal-compare-after"
       share_projects: "false"
       enable_claude_code: "false"
       claude_code_skip_permissions: "false"
       vscode_extensions: "[]"

       coder create --template freeform <name> --rich-parameter-file params.yaml --yes

   The two `repro-` names are the variant's environments; they are only needed if you also want a direct Coder URL to each site.
   Names are fixed at creation: changing them later worked only with `coder update <name> --always-prompt` (interactive).
   `coder restart --parameter` and `--rich-parameter-file` did not change them.
2. `coder ssh <name>`, wait for the startup scripts to finish, then:

       git clone https://github.com/mgifford/drupal-core-lab.git && cd drupal-core-lab
       node scripts/cloud-bootstrap.mjs 3619127-pinned --install-autostart

   (Until the cloud scripts are on `main`, check out the branch that has them first.)
3. Open `https://drupal-compare--<workspace>--<owner>.coder.ddev.com/` in a browser signed in to Coder. The bootstrap prints the exact URL.
4. When finished, stop the workspace (`coder stop <name>`). Autostop is a 24-hour deadline that activity extends, so it does not stop within minutes of idleness.

`node scripts/cloud-bootstrap.mjs <slug> --check` only reports what is missing. Its preflight names the exact fix for each problem
(missing project names, no Docker, no `ddev coder-setup`, missing files).

## What the bootstrap does

1. Preflight (Coder variables, Node 20+, `ddev`, Docker, the `coder-setup` host command, the three project names, the files).
2. Builds both sites with `tools/compare/setup.mjs` unless they already exist (`--rebuild` forces it). `setup.mjs` refuses to run twice at once.
3. For `tools/compare/site` (the viewer address), `tools/compare/cloud/before` and `.../after`: `ddev coder-setup` and `ddev restart` the first time, `ddev start` later.
   The two small cloud projects give each frame its own Coder hostname and forward it to the viewer's proxy ports 8101 and 8102.
4. `scripts/lab-env.mjs start <slug>`, then `tools/compare/cloud/start-viewer.sh`, which restarts the viewer with the Coder origins.
5. Installs Playwright and Chromium, and reinstalls Chromium's system libraries when they are missing (they do not survive a workspace restart).
6. Runs `scripts/cloud-smoke.mjs`.
7. With `--install-autostart`, writes `~/.coder-startup.sh`, which the template runs at each workspace start (log: `/tmp/lab-cloud-bootstrap.log`).
   An existing `~/.coder-startup.sh` that this script did not write is left alone and the line to add is printed.

## Smoke check

`node scripts/cloud-smoke.mjs <slug>`: exit 0 when everything it can run passes, 1 on any failure, 3 when a check could not run.
- Each Coder hostname through the DDEV router: the viewer returns the viewer page; each site proxy must return a Drupal response (a Drupal `x-generator` header).
- Viewer health (both sites answer) and that the viewer's frame origins are the Coder app URLs.
- Both frames load a Drupal page, in a real Chromium, through a temporary viewer on port 8200 with local frame origins.
- **NOT CHECKED, always:** frames at the Coder app URLs. The workspace has no Coder session; confirm in a signed-in browser.

## Environment variables (viewer)

`LAB_EXTRA_ORIGINS` (the viewer's own origin), `LAB_BEFORE_ORIGIN`, `LAB_AFTER_ORIGIN` (frame origins) and `LAB_BIND` (listen address, default `127.0.0.1`).
`start-viewer.sh` sets them from the Coder variables. `LAB_BIND=0.0.0.0` is needed because the proxy containers reach the host over the Docker bridge
(172.17.0.1 on Linux), not loopback; it is reachable only inside the workspace. None of these relaxes the Host, Origin or frame-ancestors checks.

## Known limitations

- A workspace restart stops every DDEV project and the viewer. Use `--install-autostart`, or run the bootstrap again.
- Project names are fixed at creation (see the procedure).
- Routing assumes the template's `ddev coder-setup` behaviour, verified against the `ddev/coder-ddev` freeform source of 2026-09-27: one app per project name, routed to ddev-router by Host as `{project}--{workspace}--{owner}.{domain}`.
- The sites use `admin` / `admin`. Patches, recipes and test modules run code in the workspace: use a throwaway workspace and store no tokens in it.
- Variant `checks[].probe` expressions run inside the Before and After frames. Treat a variant from someone else as untrusted code.
- Not covered: issue scraping, patch selection, importing issues from elsewhere (see `docs/NEW-ISSUE.md` for the existing local scaffolding).
