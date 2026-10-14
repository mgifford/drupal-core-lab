# Plan and status: running the lab in DDEV Coder Workspaces

Status (2026-10-02): **partly built.** The workspace bootstrap (3B), the viewer at Coder app URLs and a smoke check exist and were tested in one workspace; see `tools/compare/cloud/README.md` for what was tested and what was not. The text below is the original proposal, written 2026-10-01 after reading https://start.coder.ddev.com/ (landing page, issue picker,
quickstart). Items marked **VERIFY** are things I could not confirm from the public pages.

Status (2026-10-14): **unchanged in code; documentation refreshed.** Browser-only walkthrough: `docs/CLOUD-QUICKSTART.md`. The repository now has 14 variants, but only `3619127-pinned`
has ever been built in the cloud, so the cloud path is still a single-variant trial. Before using it:
- The guide published from `cloud/` points "Run in the cloud" at the issue picker (`tools/compare/index.html`), which is *not* the
  Freeform path the lab built. The bridge — `cloud-bootstrap.mjs --use-existing-core` (phase 3) — was added on 2026-10-14 and seeds
  the core commit from a workspace checkout (`setup.mjs --core-from`); it is dry-run tested only, not run in a workspace.
- Inside a workspace the container's egress is filtered (`git.drupalcode.org`, `drupal.org`, `repo.yarnpkg.com` were unreachable on
  2026-10-14). `cloud-bootstrap.mjs` now passes the `--core-url` GitHub mirror that `setup.mjs` supports (or `$LAB_CORE_URL`), and
  `--use-existing-core` avoids the clone entirely. See `tools/compare/cloud/README.md`; both flags are new and unrun in a workspace.
- The Freeform `project_names` parameter is declared `mutable = true` in `freeform/template.tf`, so the "names are fixed at creation"
  finding from 2026-10-02 may be a Coder-CLI artefact; re-test.
- The two rows that decide whether anyone but the pilot owner can use it are still untested: frames at the real Coder URLs in a
  signed-in browser, and a second person's access/quota.
- `cloud/` is generated and can go stale; `scripts/build-cloud.mjs --check` (run by `pages-check.yml` and `scripts/selftest.mjs`) is
  red until it is rebuilt.

## 1. What the cloud service is (facts from its pages)
- Browser-based DDEV + Docker workspaces on coder.ddev.com, "ready in about a minute". Source: https://github.com/ddev/coder-ddev.
- Two guided entries: **Drupal Issue picker** (paste an issue URL; it checks out the issue fork branch and installs a site; core issues
  use the `drupal-core` template) and **Vanilla Drupal Core** (10.x/11.x/12.x, chosen profile, nothing else). Also a **Freeform**
  template for several or custom DDEV projects in one workspace.
- Inside: `ddev-drupal-dev` conventions (`~/drupal-core`, `ddev phpunit`, Drush via `composer.local.json`), DDEV Web link, VS Code for
  the Web, a terminal (`coder ssh`). Stop keeps files; delete removes everything. Admin login is `admin` / `admin`.
- **Access is not "any ddev.com account".** It needs sign-in with GitHub **and** membership of a sponsoring GitHub organisation
  ($100+/month sponsors of DDEV) or of the `ddev` / `coder-ddev-com` orgs. Individuals can *request contributor access* through an
  issue in `coder-ddev-com/access-requests`. So "free for anyone with an account" is not how it works today. Anything we build must
  assume some people cannot use it, and must not depend on it. **Confirmed 2026-10-14** on the live start page: "you must be a member
  of a sponsoring GitHub organization, or of the `ddev` or `coder-ddev-com` org", and individuals may request contributor access.

## 2. What we would be offering
A sister capability, not a replacement: **"open this lab issue in a cloud workspace"** for people who cannot or do not want to run
Docker locally. Local stays the primary, supported path (it is the one with evidence, pinned cores and full control).

| | Local lab (today) | Cloud workspace (proposed) |
|---|---|---|
| Needs | Docker, DDEV, ~10 GB, Node | a browser, a GitHub login with access |
| Two sites side by side | yes (two DDEV projects + viewer) | yes in Freeform, **VERIFY** resources and ports |
| Evidence you can trust for the coverage matrix | yes (recorded browser/OS/AT) | yes, but record "cloud workspace, <browser you used>" |
| Cost | your disk and time | sponsor-funded; limits unknown (**VERIFY** CPU, RAM, disk, idle stop) |
| Failure modes seen | full disk, DDEV router flake | unknown |

## 3. The three pieces

### A. GitHub Pages site (static, public, no accounts)
GitHub Pages cannot run the viewer (it needs Node proxies and a live Drupal), so Pages is a **front door and catalogue**:
- One page per issue generated from `tools/compare/variants.json` and `reports/issues/<nid>/` (title, what to look for, pinned/latest
  status, COVERAGE and STATUS summaries, screenshots, the bundle zip).
- Buttons per issue: **"Run locally"** (copy-paste `lab-env.mjs start <slug>` and the one-time setup) and **"Run in the cloud"**
  (a link into the coder.ddev.com picker for that issue, plus a clear note that access is gated).
- Generated by a script (`scripts/build-cloud.mjs`) and published by a GitHub Action from `docs/` or a `site/` directory. It would
  reuse `scripts/index-issues.mjs`, so there is one source of truth. Accessibility of the site itself is part of the job (it is an
  accessibility lab): axe in CI, keyboard pass, no colour-only meaning.

### B. A workspace bootstrap (the actual cloud hook)
Goal: in a fresh workspace, one command gives the same two sites and viewer.
1. Start from the **Freeform** template (or the issue picker for a single site).
2. `git clone https://github.com/mgifford/drupal-core-lab && cd drupal-core-lab`
3. `node scripts/cloud-bootstrap.mjs <slug>` (new): checks it is in a Coder workspace, skips the parts that assume a Mac (Playwright
   browser cache paths, `ddev-router` workarounds), then runs the existing `setup.mjs`, `lab-env.mjs start`.
4. The viewer must be reachable from the browser: either through a Coder "app"/port-forward for port 8100 (**VERIFY**: how
   workspace apps are declared in the templates; we may need a Freeform template variant maintained with DDEV) or by running the
   viewer behind the workspace's DDEV Web hostname the way `tools/compare/site` does locally.
5. Known differences to handle: the cloud add-on set is `ddev-drupal-dev` + Drush, ours is `justafish/ddev-drupal-core-dev` with no
   Drush (lab rule 6 forbids adding Drush to a core checkout; inside a disposable workspace we should still keep to the rule). The
   `--use-existing-core` mode that was planned here was added on 2026-10-14 and does the bounded half: it seeds the lab's core
   objects from the workspace checkout (`setup.mjs --core-from=<path>`) so no network clone is needed, but it does **not** yet adopt
   the picker's DDEV project or skip the add-on install — the lab still builds its own two environments from the same core.

### C. Getting a person's own issue and recipe into the workspace
Options, from simplest:
1. **Issue fork only (works today):** the picker already checks out the fork; the lab clone then adds a *before* worktree from
   upstream at the fork's merge-base and the viewer compares them. No recipe needed for many issues.
2. **Recipe from a URL:** `cloud-bootstrap.mjs <nid> --recipe <git-or-gist-url>`; the script fetches it into `recipes/` and applies it
   with `lab-site.sh apply`. Works with a public GitHub repo or gist; no tokens in the repo or chat.
3. **Edit in the workspace:** VS Code for the Web is already there. Put `recipes/<nid>/recipe.yml` and `variants.json` entries in the
   workspace clone; `scripts/new-issue.mjs <nid> --branch <fork-branch>` scaffolds them (it already does this locally). The person
   edits the recipe and steps, runs setup again, and can **download the bundle zip** (`make-bundle.mjs`) to keep their work, because
   deleting a workspace deletes everything.
4. **Contribute back:** their issue scaffold is a pull request to `drupal-core-lab` (or a separate community repo), so issues
   accumulate. Never post to drupal.org from the lab; drafts stay drafts.

## 4. Pairing local and cloud
- **Same artefacts everywhere:** `variants.json`, recipes, patches, bundle zip. A variant created in the cloud runs locally and the other
  way round, because the bundle is self-contained.
- **Evidence has one shape:** results record where they ran (`environment.host = local | coder`). `coverage.mjs` shows it as a column so
  nobody mistakes a cloud run for a run on their own browser and assistive technology.
- **Division of labour:** cloud for "does it reproduce, can others see it" (setup, viewer, scripted Playwright walkthrough in the
  workspace); local for assistive-technology and multi-browser checks, which need the person's own machine.
- **The browser matters:** the viewer runs in *your* browser even when the sites are in the cloud, so manual keyboard and screen-reader
  checks are still yours. Scripted Playwright in the workspace is Linux Chromium/Firefox/WebKit only (no Safari/VoiceOver).

## 5. Risks and open questions
1. **Access gate** (section 1). Mitigation: Pages catalogue and local path stay fully usable without it. Do not promise "free for all".
2. **Policy/affiliation:** this is DDEV's sponsored service. Ask in `ddev/coder-ddev` or Drupal Slack #ddev whether a lab-driven use is
   welcome, what the resource limits are, and whether a Freeform template with an extra port is acceptable, **before** building.
3. **Security:** workspaces are shared infrastructure. Admin `admin`/`admin` is acceptable only because sites are private; if a
   workspace's site is made public the guide must say to change it. No tokens in `variants.json`, recipes, URLs or the Pages site.
   The Pages site must not embed deep links that carry personal data.
4. **Local-only rule:** the lab's standing rule is local development only. Cloud use is opt-in, per person, per issue; it is not
   enabled by default and not used by me without your say-so.
5. **Deep-link parameters (VERIFY, still unresolved 2026-10-14):** can the picker be opened pre-filled (`?issue=3604037`)? The
   picker at https://start.coder.ddev.com/drupal-issue is a form with an "Issue URL or project name" field and a Load button; no
   query parameter is documented. Treat deep links as unavailable: link to the picker and show the issue URL to paste (which is what
   `cloud/` does today).
6. **Resources:** two Drupal sites plus Chrome for Lighthouse may exceed a default workspace; may need a "light" profile
   (viewer + axe, no Lighthouse) for cloud.
7. **Maintenance:** one more environment to keep working. Keep the bootstrap thin; fail with a clear message rather than adapt to every
   template change.

## 5b. Phase 1 status (built 2026-10-01, published since)
`cloud/` is generated by `node scripts/build-cloud.mjs` from the same `tools/compare/index.html` and `variants.json` the local viewer
uses, so nothing is duplicated. The page detects where it runs (`github.io`, `?mode=static`, or a `variants.json` marked `static`) and
hides everything marked `data-needs="live"` (frames, logins, cache clearing, Mirror, live axe, Lighthouse, checks, manual panel). A
read-only panel gives the local command, a DDEV cloud link, the reports and the drupal.org issue. That cloud link points at the
**issue picker**, which is the single-site `drupal-core` template, not the Freeform comparison path in section 3B; phase 4 should
replace it. `.github/workflows/pages.yml` publishes `cloud/` (set Pages > Source to "GitHub Actions"); `pages-check.yml` fails CI if
`cloud/` is stale. Any new server-dependent element must carry `data-needs="live"` and any new server URL must be relative (no
leading `/`).

## 5c. Browser facts recorded 2026-10-14

The DDEV Coder manual has the user-facing half of this, which section 1 (written from the landing page) did not capture:

- https://start.coder.ddev.com/user/getting-started.html — create a workspace, the `freeform` template, prerequisites.
- https://github.com/ddev/coder-ddev/blob/main/docs/user/using-workspaces.md — the workspace page: apps, terminal, restart, update.
- Sign in and manage workspaces at https://coder.ddev.com/workspaces; templates at https://coder.ddev.com/templates.

Which template to pick: the lab needs **Freeform** (the lab runs *two* DDEV projects side by side plus the viewer). The
"Drupal Issue picker" (`https://start.coder.ddev.com/drupal-issue`) is a different, single-site template; a workspace created from it
can still be adopted with `cloud-bootstrap.mjs --use-existing-core` (phase 3), but it is not the comparison path.

Workspace and app URLs: apps are routed as `{project}--{workspace}--{owner}.{domain}`, so the viewer for a workspace `lab-3619127`
owned by `mgifford` is `https://drupal-compare--lab-3619127--mgifford.coder.ddev.com/`. A workspace has a **timed lifespan** (a
deadline that activity extends, distinct from the idle autostop), so it can expire: recreate it, and use `--core-url` or
`--use-existing-core` to avoid a fresh core clone under the filtered egress.

## 6. Phased plan (each phase usable on its own; stop whenever it stops being worth it)
| Phase | Deliverable | Effort | Needs from you | Status (2026-10-14) |
|---|---|---|---|---|
| 0 | Ask DDEV about fit, limits, deep links, port exposure. Request contributor access for you (or confirm your org's). | small | a decision to ask; you do the asking and the sign-in | partly: access gate and limits are understood from the public pages; deep links unresolved; "ask DDEV" still open |
| 1 | Pages catalogue from existing reports + "run locally" instructions. No cloud dependency. | small | approval to enable Pages on the repo | **done**; `cloud/` can go stale and is currently behind |
| 2 | Manual trial: in a workspace, clone the lab, run `setup.mjs` for #3604037, record what breaks. Written up like `docs/ADDON-TRIAL-2026-10-01.md`. | small-medium | you sign in; I drive only what you allow | **done for #3619127**, not #3604037; see `tools/compare/cloud/README.md` |
| 3 | `cloud-bootstrap.mjs` + `--use-existing-core`, viewer exposed. | medium | results of phase 2 | bootstrap + viewer **done and smoke-tested**; `--use-existing-core` + `--core-url` **added 2026-10-14, dry-run only** |
| 4 | Recipe-from-URL and the "bring your own issue" flow; Pages "Run in the cloud" buttons. | medium | | **partly**: `scripts/issue-from-url.mjs` + `issue-pack prepare --ai-recipe` do the "bring your own issue + AI recipe" flow locally (see `docs/ISSUE-TO-LAB.md`); recipe-from-URL and the Pages button are not started |
| 5 | Evidence host column in coverage; docs; optional separate sister repo if the cloud parts grow. | small | | not started |

Sister repository or same repository? Start in this repo (`scripts/`, `docs/`, `site/`), so the data stays single-sourced. Split into
`drupal-core-lab-cloud` only if the template or Action code outgrows it.

## 7. Recommendation
Do phases 0 and 1 now (cheap, no commitment, useful anyway), run the phase 2 trial by hand with you signed in, and decide on phases 3
to 5 from what it shows. The biggest unknowns are access and exposing the viewer's port, not code.
