# #3593502 in DDEV Coder: Before and After for the new Menu UI, from a browser

**DRAFT, not run yet (written 2026-10-16).** Two DDEV sites in one DDEV Coder workspace, built by a coding agent in the workspace (or
by you, pasting the commands). The merge request itself was **not read** when this was written: drupal.org and git.drupalcode.org
were unreachable from the session that wrote it. So the After side is built from the merge request's diff, which **you download in
your own browser**. See `SUMMARY.md` for what is and is not known.

Why both sides get the same large menu: the issue is that the menu edit form (`/admin/structure/menu/manage/main`) builds one form
row per link, so its memory grows with the size of the menu. Measured on unchanged core (see `SUMMARY.md`), building that form costs
about 70 KB per link. The recipe `recipes/repro_3593502` makes the same menu on both sides, without Drush.

## 1. Create the workspace

At https://coder.ddev.com/workspaces, **New workspace**, then **DDEV Freeform**:

| Field | Value |
|---|---|
| DDEV project names | `menu-before,menu-after` (exactly; each gets its own URL) |
| Public Sharing | off (the sites use admin / admin) |
| Enable Claude Code remote control | on if you will use Claude Code in the workspace; off if you paste the commands yourself |
| Claude Code: skip permission prompts | off |

## 2. Download the merge request's diff and put it in the workspace

1. On your desktop, open the issue: https://www.drupal.org/project/drupal/issues/3593502 and note the merge request number (the
   `!NNNNN` link in the issue fork box). Use the open merge request with the latest commits; if there are several, note which one.
2. Download its plain diff: `https://git.drupalcode.org/project/drupal/-/merge_requests/<NNNNN>.diff` (save the page as a file).
3. In the workspace's **VS Code**, create the folder `~/patches/` and drag the file into it as `~/patches/3593502.diff`.

## 3. The prompt

```text
You are in a DDEV Coder "DDEV Freeform" workspace. Build two Drupal core sites, Before and After, so I can compare Drupal issue
#3593502 (https://www.drupal.org/project/drupal/issues/3593502: "Introduce a new Menu UI to resolve memory issues and improve
user experience") in my own browser. I will do the manual and accessibility testing myself.

Facts (use them, do not re-derive them):
- The workspace's DDEV project names are menu-before and menu-after. A DDEV project with one of those exact names gets the URL
  https://<name>--$CODER_WORKSPACE_NAME--$CODER_WORKSPACE_OWNER_NAME.<host part of $CODER_AGENT_URL>/ after `ddev coder-setup` has
  been run in it. The URL is owner-only: from inside the workspace it redirects to the Coder sign-in, which is expected.
- Network egress is filtered: git.drupalcode.org and drupal.org are unreachable. Get Drupal core from the GitHub mirror
  https://github.com/drupal/drupal.git. GitHub zip downloads may be cut off; Composer then falls back to git sources (slow, works).
- The change under test is ~/patches/3593502.diff, which I downloaded from the merge request. If it is missing, stop and ask me.
  Record its sha256 and its first line. Do not edit it.
- The lab with the recipe: git clone --depth 1 https://github.com/mgifford/drupal-core-lab.git ~/drupal-core-lab
  (if recipes/repro_3593502 is not on its main branch yet, use: --branch ccr-6cf8eadd-xgkmk8).

Steps:
1. Pick ONE core commit for both sites: the current tip of main on the mirror
   (git ls-remote https://github.com/drupal/drupal.git refs/heads/main). For each site, in ~/menu-before and ~/menu-after:
   git init; git remote add origin https://github.com/drupal/drupal.git; git fetch --depth 1 origin <that commit>;
   git checkout --detach FETCH_HEAD
2. After only: git apply --check ~/patches/3593502.diff, then git apply. If it does not apply to that commit, stop and tell me
   which files fail; do not change the diff or pick another commit on your own.
3. Read the diff and tell me, before going on: which new modules it adds (new *.info.yml files, and whether they say
   `lifecycle: experimental`), which existing files it changes outside those new modules, the new routes (*.routing.yml) with their
   paths and the permissions they require, any hook_update_N or post-update functions, and any new JavaScript.
4. For each site: ddev config --project-type=drupal12 --docroot=. --php-version=<the version core's composer.json requires>
   --project-name=<menu-before|menu-after> --omit-containers=db --disable-settings-management; ddev coder-setup; ddev start
5. Both sites, the same PHP limits as common hosting: create .ddev/php/limits.ini containing the two lines `memory_limit = 256M`
   and `max_execution_time = 30`, then ddev restart.
6. ddev composer install --no-interaction; ddev add-on get justafish/ddev-drupal-core-dev; ddev restart
7. ddev drupal install standard --password=admin --site-name="Drupal core test site"
8. Copy ~/drupal-core-lab/recipes/repro_3593502 into the site's recipes/ folder, then:
   ddev exec php core/scripts/dr recipe:apply recipes/repro_3593502
   ddev exec bash recipes/repro_3593502/apply.sh      (makes 15,000 links in the Main navigation menu; takes minutes)
   ddev exec php core/scripts/dr cache:rebuild
9. After only: enable the new module(s) from step 3 with ddev exec php core/scripts/dr ex:install <module>, then cache:rebuild.
10. Both sites: make sites/default and sites/default/settings.php writable, append this line to settings.php, and make them
    read-only again:  include $app_root . '/recipes/repro_3593502/peak-memory.php';
    It logs every web request's peak memory, status and path to /tmp/lab-peak-memory.log in the web container (one-time login
    paths are redacted). It is site configuration, identical on both sides, not code under test.
11. Both sites: ddev exec php recipes/repro_3593502/measure-menu-form.php main   and keep its output line.

Before you say it is done, check (do not assume):
- git -C ~/menu-before status --short --untracked-files=no prints nothing (Before is untouched core).
- git -C ~/menu-after status --short --untracked-files=all lists only what the diff adds or changes (compare with the diff's file
  list; ignore recipes/, vendor/, sites/ and .ddev/).
- Both sites answer through the DDEV router with their Coder host name and return a Drupal page (an x-generator header).
- Inside each web container, log in and request a page the way a browser would, then read the log:
    ddev exec php core/scripts/dr user:login --uid=1 --url=http://127.0.0.1    (a one-time link; never print it in your reply)
    ddev exec curl -s -c /tmp/jar -b /tmp/jar -L -o /dev/null <that link>
    ddev exec curl -s -b /tmp/jar -o /dev/null -w '%{http_code} %{time_total}\n' --max-time 120 http://127.0.0.1/admin/structure/menu/manage/main
    ddev exec cat /tmp/lab-peak-memory.log
  On Before the expected result is a 500 and a log line ending in "FATAL: Allowed memory size of 268435456 bytes exhausted". On
  After, request the new Menu UI page(s) from step 3 the same way and record their lines. If the curl login does not work, say so
  and leave this to me.
- Record for each site: the core commit (git rev-parse --short HEAD), ddev --version, the PHP version, the memory and time limits
  the web server uses (from the log line's limit= and from ddev exec php -i), the measure-menu-form.php line, the log lines, and
  for After the sha256 of the diff.

Then give me: both URLs; one-time login links (ddev exec php core/scripts/dr user:login --uid=1 --url=<that site's Coder URL> gives it directly); the paths of the new Menu
UI pages on After (from the routes); the facts from step 3; the recorded versions and measurements;
and everything that failed, its cause, and what you did instead.

Rules: Do not post to drupal.org, comment on any issue, or push to any remote. Do not turn on Public Sharing. No tokens or passwords
in files or commands (admin/admin on these throwaway sites is fine). Do not change Before beyond the install, the recipe and the
memory limit. Do not add Drush or anything else to composer.json. When something fails, find the cause before working around it.
Do not claim that the change works or is accessible: that is my manual test.
```

## 4. The manual test (yours)

Open both URLs in tabs of the same browser, signed in to Coder, and log in with the links the agent gave you.

**Before:** open `/admin/structure/menu/manage/main`. With 15,000 links and a 256M limit, expect a white screen or an error page.
That is the reported problem. Note what you see.

**After, the cost:** browse the new Menu UI the way an editor would (open it, expand deep branches, move a link, save), then ask the
agent for `/tmp/lab-peak-memory.log` from the After site. Every request, including the background ones the page makes while you
expand branches, is a line with its peak memory and status. Nothing should come near the 256M limit or end in FATAL.

**After:** open the new Menu UI page(s) the agent listed, on the same menu. Check what the issue promises (it opens, and stays fast,
on 15,000 links) and then, because this is a new admin interface every site may come to depend on:

- **Keyboard only:** reach every control; expand and collapse branches; **move a link to a new position and a new parent without a
  mouse** (WCAG 2.5.7 Dragging Movements: drag and drop needs a single-pointer or keyboard alternative); focus stays on or next to
  what you acted on after a branch loads, a link moves or a save finishes; focus is always visible.
- **Screen reader** (the lab's standard is the synthetic Guidepup reader; a real one if you choose): the tree is announced as a
  tree or a list with levels (expanded or collapsed, level, position); loading more links is announced; a move and a save are
  announced; errors are announced.
- **Zoom and reflow:** 200% and 400% zoom (320 CSS px wide): nothing cut off, no sideways scrolling for the tree itself.
- **Forced colours** (Windows High Contrast, or the lab browser's switch): expand/collapse icons, drop targets, focus and selected
  states stay visible.
- **Compared with Before at a size Before can handle** (for example LAB_MENU_LINKS=500 on a fresh pair): does the new UI keep what
  the old form offered: enable/disable a link, edit, delete, weights, "Show row weights", the parent field on the link form?

Record your browser and version, operating system, assistive technology, zoom, and what you saw in each tab, and say it was a DDEV
Coder workspace. That record is evidence only once you have reviewed it.

## 5. When you are done

**Stop** on the workspace page (files are kept). **Delete** removes everything.
