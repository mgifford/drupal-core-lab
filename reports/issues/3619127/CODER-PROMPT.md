# #3619127 in DDEV Coder without the lab: a recipe and a prompt

**DRAFT, not run yet (written 2026-10-16).** Two plain DDEV sites, Before and After, in one DDEV Coder workspace, built by a coding
agent in that workspace (or by you, pasting the same commands). No lab viewer: you open the two sites in two browser tabs. Everything
happens in a browser. The steps are taken from what the lab does (`tools/compare/setup.mjs`, `scripts/lab-site.sh`). Steps 1 and 2
of the prompt (core from the GitHub mirror, the three patches, the `git status` check) were replayed exactly on 2026-10-16 outside a
workspace. Steps 3 to 7 (DDEV, Composer, install, recipe) and the whole sequence in a workspace have not been run. Record what
happened when you run it.

For the side-by-side viewer instead, use `docs/CLOUD-QUICKSTART.md` (it applies this recipe by itself).

## 1. Create the workspace

At https://coder.ddev.com/workspaces, choose **New workspace**, then **DDEV Freeform**:

| Field | Value |
|---|---|
| DDEV project names | `drupal-before,drupal-after` (exactly; each gets its own URL) |
| Public Sharing | off (the sites use admin / admin) |
| Enable Claude Code remote control | on, if you will use Claude Code in the workspace; off if you paste the commands yourself |
| Claude Code: skip permission prompts | off (you approve each step) |

If you use Claude Code there, sign in through its own browser login. Never paste a token into the terminal or a file.

## 2. Add the recipe with VS Code

Open the workspace's **VS Code**, create `recipes/ife_sidebar_repro/recipe.yml` in your home folder (so: `~/recipes/ife_sidebar_repro/recipe.yml`)
and paste this. It is the lab's `recipes/ife_sidebar_repro/recipe.yml`, unchanged (sha256 `7117cbd8…`).

```yaml
name: 'Repro: Inline Form Errors link and the Default Admin sidebar (#3619127)'
description: 'Puts a site in the starting state for the steps to reproduce: an Article content type with the Path module (URL alias field), and Inline Form Errors enabled. Safe to apply more than once.'
type: 'Testing'
# A dependency name containing '/' is resolved from the Drupal root, so this
# recipe works when copied to <environment>/recipes/ife_sidebar_repro.
# Default Admin as the admin theme comes from the Standard install (step 1).
recipes:
  - core/tests/fixtures/recipes/article_content_type
install:
  - node
  - path
  - path_alias
  - navigation
  - inline_form_errors
```

## 3. The prompt

Paste this into the agent in the workspace (Claude Code: run `claude` in the workspace terminal, or use remote control).

```text
You are in a DDEV Coder "DDEV Freeform" workspace. Build two Drupal core sites, Before and After, so I can compare Drupal issue
#3619127 (https://www.drupal.org/project/drupal/issues/3619127, MR !16895: the Default Admin sidebar does not open from an Inline
Form Errors link) in my own browser. I will do the manual test myself.

Facts (use them, do not re-derive them):
- The workspace's DDEV project names are drupal-before and drupal-after. A DDEV project with one of those exact names gets the URL
  https://<name>--$CODER_WORKSPACE_NAME--$CODER_WORKSPACE_OWNER_NAME.<host part of $CODER_AGENT_URL>/ after `ddev coder-setup` has
  been run in it. The URL is owner-only: from inside the workspace it redirects to the Coder sign-in, which is expected.
- Network egress is filtered: git.drupalcode.org and drupal.org are unreachable. Get Drupal core from the GitHub mirror
  https://github.com/drupal/drupal.git. GitHub zip downloads may be cut off; Composer then falls back to git sources, which is slow
  but works.
- Core commit for BOTH sites: d29add7ebc18954dcb88877ed38b5bd88cdbf967 (main, 2026-09-30). It needs PHP 8.5.
- The change under test, for After ONLY, is three patches applied in this order with `git apply`. Get them with
  `git clone --depth 1 https://github.com/mgifford/drupal-core-lab.git ~/drupal-core-lab` and check each sha256 before applying:
    1. reports/issues/3619127/branches/3619127-forms-sidebar-with-ife.patch  fe90ecc44366d998fda08fef35ec7f0cbf1415714a29988ac00c922f3c79ee33
    2. reports/issues/3619127/patch-0-vanilla-js-no-jquery.patch             177ff83f2fc6aacb0f03919c2ebbb8e65b75fdf5e426cb52f440c88ef7d41564
    3. reports/issues/3619127/patch-1-no-persist-and-waits.patch             63d1437ceea177e935b64f441d82998d0a9772a5f374ac6c4bc4d2394cb1eb5d
  Patch 1 is the MR; 2 and 3 are follow-ups proposed in that lab (no jQuery; do not save the sidebar state).
- The recipe for BOTH sites is at ~/recipes/ife_sidebar_repro/recipe.yml (I added it). If it is missing, stop and ask me. If it
  differs from ~/drupal-core-lab/recipes/ife_sidebar_repro/recipe.yml, tell me, then use mine.

For each site, in ~/drupal-before (name drupal-before) and ~/drupal-after (name drupal-after):
1. git init; git remote add origin https://github.com/drupal/drupal.git;
   git fetch --depth 1 origin d29add7ebc18954dcb88877ed38b5bd88cdbf967; git checkout --detach FETCH_HEAD
2. After only: apply the three patches in order. If one does not apply, stop and tell me; do not edit a patch.
3. ddev config --project-type=drupal12 --docroot=. --php-version=8.5 --project-name=<name> --omit-containers=db --disable-settings-management
   then: ddev coder-setup; ddev start
4. ddev composer install --no-interaction
5. ddev add-on get justafish/ddev-drupal-core-dev; ddev restart   (it provides `ddev drupal`; SQLite, no database container)
6. ddev drupal install standard --password=admin --site-name="Drupal core test site"
7. Copy ~/recipes/ife_sidebar_repro into the site's recipes/ folder, then:
   ddev exec php core/scripts/dr recipe:apply recipes/ife_sidebar_repro; ddev drupal cache

Before you say it is done, check (do not assume):
- `git -C ~/drupal-before status --short --untracked-files=no` prints nothing (Before is untouched core).
- `git -C ~/drupal-after status --short --untracked-files=all core/themes/default_admin` prints exactly two lines:
   M core/themes/default_admin/migration/js/sidebar.js
  ?? core/themes/default_admin/tests/src/FunctionalJavascript/AdminInlineFormErrorsTest.php
  (Patch 1 adds core/jquery to default_admin.libraries.yml and patch 2 removes it again, so that file ends unchanged.)
- Each site answers through the DDEV router with its Coder host name and returns a Drupal page (an x-generator header), and
  /node/add/article (as admin) has the URL alias field.
- Record, for each site: `git rev-parse --short HEAD`, `ddev --version`, and the PHP version in the web container.

Then give me: both URLs; a one-time login link for each site (`ddev drupal login`, with its host replaced by that site's Coder
URL); the recorded versions; and everything that failed, its cause, and what you did instead.

Rules: Do not post to drupal.org, comment on any issue, or push to any remote. Do not turn on Public Sharing. No tokens or passwords
in files or commands (admin/admin on these throwaway sites is fine). Do not change Before beyond the install and the recipe. Do not
add Drush or anything else to composer.json. When something fails, find the cause before working around it. Do not claim that the
change works: that is my manual test.
```

## 4. The manual test (yours)

Open both URLs in tabs of the same browser, signed in to Coder, and log in with the links the agent gave you (or admin / admin).
Make the window narrow (tablet width or less, or the browser's responsive mode), so the sidebar of advanced fields is closed.
Do the same in each tab:

1. Open `/node/add/article`, click **Expand sidebar**, open **URL alias** and type `no-slash`.
2. Close the sidebar and click **Save**. An error summary appears: "1 error has been found: URL alias", with "URL alias" as a link.
3. Use that link with a real mouse click. Then reload the form, repeat steps 1 and 2, and use the link with the keyboard only (Tab to it, Enter).

Expected. **Before:** nothing visibly happens; the sidebar stays closed. **After:** the sidebar opens and the URL alias field has
keyboard focus (visible focus outline). Then open `/node/add/article` again: in After the sidebar should still start closed (the
link opened it without overwriting your saved choice).

Record your browser and version, operating system, window width, and what you saw in each tab, and say it was a DDEV Coder
workspace. That record is evidence only once you have reviewed it; it goes in `EVIDENCE.md` as a manual pass.

## 5. When you are done

Click **Stop** on the workspace page (files are kept). **Delete** removes everything.
