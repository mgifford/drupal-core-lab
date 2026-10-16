# #3615469 in DDEV Coder: Before and After for the maintenance mode link text, from a browser

**DRAFT, not run yet (written 2026-10-16).** Two DDEV sites in one DDEV Coder workspace, built by a coding agent in the workspace (or
by you, pasting the commands). The merge request was **not read** when this was written (drupal.org and git.drupalcode.org were
unreachable from the session that wrote it), so the After side is built from the diff **you download in your browser**. See
`SUMMARY.md` for what is and is not known.

**No recipe:** the page under test, `/admin/config/development/maintenance`, is on every Standard install, and the change is a
string. Nothing else needs setting up.

## 1. Create the workspace

At https://coder.ddev.com/workspaces, **New workspace**, then **DDEV Freeform**:

| Field | Value |
|---|---|
| DDEV project names | `maint-before,maint-after` (exactly; each gets its own URL) |
| Public Sharing | off (the sites use admin / admin) |
| Enable Claude Code remote control | on if you will use Claude Code in the workspace; off if you paste the commands yourself |
| Claude Code: skip permission prompts | off |

## 2. Download the merge request's diff

1. Open https://www.drupal.org/project/drupal/issues/3615469 and note the open merge request (a web search on 2026-10-16 named
   !16609; check it on the page). If there are several, use the one the latest comments are about.
2. Download `https://git.drupalcode.org/project/drupal/-/merge_requests/<number>.diff` (save the page as a file).
3. In the workspace's **VS Code**, create `~/patches/` and drag the file in as `~/patches/3615469.diff`.

## 3. The prompt

```text
You are in a DDEV Coder "DDEV Freeform" workspace. Build two Drupal core sites, Before and After, so I can compare Drupal issue
#3615469 (https://www.drupal.org/project/drupal/issues/3615469: the "user login" link in the maintenance mode form's description
leaves "page" out of the link text; WCAG 2.4.4 link purpose) in my own browser. I will do the manual and screen reader testing.

Facts (use them, do not re-derive them):
- The workspace's DDEV project names are maint-before and maint-after. A DDEV project with one of those exact names gets the URL
  https://<name>--$CODER_WORKSPACE_NAME--$CODER_WORKSPACE_OWNER_NAME.<host part of $CODER_AGENT_URL>/ after `ddev coder-setup` has
  been run in it. The URL is owner-only: from inside the workspace it redirects to the Coder sign-in, which is expected.
- Network egress is filtered: git.drupalcode.org and drupal.org are unreachable. Get Drupal core from the GitHub mirror
  https://github.com/drupal/drupal.git. GitHub zip downloads may be cut off; Composer then falls back to git sources (slow, works).
- The change under test is ~/patches/3615469.diff, which I downloaded from the merge request. If it is missing, stop and ask me.
  Record its sha256. Do not edit it.
- The string on core main (2026-10-16) is in core/modules/system/src/Form/SiteMaintenanceModeForm.php, the #description of the
  maintenance_mode checkbox: '... Only users with the "@permission-label" <a href=":permissions-url">permission</a> will be able to
  access the site. Authorized users can log in directly via the <a href=":user-login">user login</a> page.'
  core/modules/system/tests/src/Functional/System/SiteMaintenanceTest.php asserts that sentence's visible text.

Steps:
1. Pick ONE core commit for both sites: the current tip of main on the mirror
   (git ls-remote https://github.com/drupal/drupal.git refs/heads/main). For each site, in ~/maint-before and ~/maint-after:
   git init; git remote add origin https://github.com/drupal/drupal.git; git fetch --depth 1 origin <that commit>;
   git checkout --detach FETCH_HEAD
2. After only: git apply --check ~/patches/3615469.diff, then git apply. If it does not apply, stop and tell me which files fail.
3. Read the diff and tell me, before going on: every user-facing string it changes, old and new, exactly; which links' text
   changes; whether the "permission" link in the same sentence changes; whether SiteMaintenanceTest.php or any other test changes,
   and what the tests now assert; any other file it touches.
4. For each site: ddev config --project-type=drupal12 --docroot=. --php-version=<the version core's composer.json requires>
   --project-name=<maint-before|maint-after> --omit-containers=db --disable-settings-management; ddev coder-setup; ddev start
5. ddev composer install --no-interaction; ddev add-on get justafish/ddev-drupal-core-dev; ddev restart
6. ddev drupal install standard --password=admin --site-name="Drupal core test site"
7. For the tests: cp core/phpunit.xml.dist core/phpunit.xml; cp .ddev/core-dev/.env core/.env (if that file exists);
   mkdir -p sites/simpletest/browser_output
8. Both sites: ddev phpunit core/modules/system/tests/src/Functional/System/SiteMaintenanceTest.php, and any test the diff changes.
   Record pass or fail for each test on each side, with the failure message if any.

Before you say it is done, check (do not assume):
- git -C ~/maint-before status --short --untracked-files=no prints nothing (Before is untouched core).
- git -C ~/maint-after status --short --untracked-files=all lists only the files the diff touches (ignore vendor/, sites/, .ddev/
  and core/phpunit.xml, core/.env).
- On each site, log in inside the web container and quote the rendered description exactly:
    ddev exec php core/scripts/dr user:login --uid=1 --url=http://127.0.0.1    (a one-time link; never print it in your reply)
    ddev exec curl -s -c /tmp/jar -b /tmp/jar -L -o /dev/null <that link>
    ddev exec curl -s -b /tmp/jar http://127.0.0.1/admin/config/development/maintenance | grep -A4 'id="edit-maintenance-mode--description"'
  If the login does not work, say so and quote the #description string from SiteMaintenanceModeForm.php instead.
- Record for each site: the core commit (git rev-parse --short HEAD), ddev --version, the PHP version, and for After the diff's
  sha256.

Then give me: both URLs; one-time login links (ddev exec php core/scripts/dr user:login --uid=1 --url=<that site's Coder URL>);
the facts from step 3; the test results; the recorded versions; and everything that failed, its cause, and what you did instead.

Rules: Do not post to drupal.org, comment on any issue, or push to any remote. Do not turn on Public Sharing. No tokens or passwords
in files or commands (admin/admin on these throwaway sites is fine). Do not change Before beyond the install. Do not add Drush or
anything else to composer.json. When something fails, find the cause before working around it. Do not claim that the change
meets WCAG: that is my review.
```

## 4. The manual test (yours)

Open both URLs in tabs of the same browser, signed in to Coder, log in with the links the agent gave you, and go to
**Configuration > Development > Maintenance mode** (`/admin/config/development/maintenance`) on each.

1. **Read it.** The description under "Put site into maintenance mode" should read naturally on both sides, and the login link
   must still go to the login page.
2. **Links out of context** (the case WCAG 2.4.4 and 2.4.9 are about): open the screen reader's links list (NVDA: Insert+F7;
   VoiceOver: the rotor, Links; or the lab's synthetic reader, below). On each side, does each link name say where it goes without
   the sentence around it? Look at both links, "permission" as well as the login link.
3. **Reading the sentence:** read the description with the screen reader's reading keys. Does the login link and the word after
   it run together on either side (the issue's title says "user loginpage")? Note the screen reader, its version and the browser:
   that claim depends on them.
4. **Keyboard:** Tab to each link; focus is visible; Enter follows it.

Synthetic evidence, the lab's standard: `node tools/playwright/linktext-3615469.mjs --url <site> --side before|after --login
<one-time link>` records each link's accessible name, the text right after it, the page's whole links list and what the Guidepup
virtual screen reader announces. Before was recorded on 2026-10-16 (`screenreader/`, see `EVIDENCE.md`).

Record your browser and version, operating system, screen reader and version, and what you heard on each side, and say it was a
DDEV Coder workspace. That record is evidence only once you have reviewed it.

## 5. When you are done

**Stop** on the workspace page (files are kept). **Delete** removes everything.
