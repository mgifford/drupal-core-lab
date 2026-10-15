# Trial: amateescu/ddev-drupal-dev on #3618230 (2026-10-15)

Environment: DDEV v1.25.3, Docker Desktop 29.8.2, macOS arm64, PHP 8.5.7, PHPUnit 12.5.17 (the pilot record used 12.5.34 on a newer core lock), Composer 2.10.3.
Add-on: https://github.com/amateescu/ddev-drupal-dev v1.2.3 (2026-10-09, Apache-2.0).
Browser for the tests: `selenium/standalone-chromium:143.0.7499.169` (the add-on's container; the image was already in Docker for the lab).
Status: DRAFT. One run per side, no person has reviewed it. The lab was not changed (`setup.mjs`, `lib.mjs` untouched).

## What was built
Two throwaway projects outside `variants.json`, both git worktrees of `envs/core.git`, stopped (not deleted) at the end:

| | Directory | Core | Notes |
|---|---|---|---|
| Before | `envs/trial-amateescu-before` | `f5e26580254` (2026-08-20), the MR's merge base | no tracked changes |
| After | `envs/trial-amateescu-after` | branch `3618230-adopt-the-ajax`, MR tip `2d600f40b97` + test commit `01e19a6fbaa3` | tracks `drupal-3618230/3618230-adopt-the-ajax` |

Steps used: `ddev config --project-type=drupal12 --performance-mode=none`, `ddev start`, `ddev add-on get amateescu/ddev-drupal-dev`,
`ddev restart`, `ddev composer install`, then `extra.drupal-dev.pin-core-lock` and `config.audit.block-insecure=false` in
`composer.local.json` and `ddev composer update`. After then ran `ddev mr core 16777`. justafish's add-on was not installed in either.

### Differences from the brief, and why
1. **Before is at the MR's merge base, not at current `main` (`461fc552737`).** `ddev mr` checks out the MR branch as pushed, and !16777 is
   based on `f5e26580254`, two months behind `main`. A Before on `main` would differ from After by two months of core as well as by the MR.
   With the merge base, the only difference is the MR. The lab's own pairs do it the other way (the MR diff applied to `main`), so these
   results are about the MR on its own base, not on `main`.
2. **`--performance-mode=none`** (no Mutagen). The machine had 3.5 GB free of 228 GB (99% used); the first web-image build alone took 1.7 GB,
   and it fell to 1.5 GB at the lowest. Mutagen would add a second copy of each tree. Side effect: see finding 8.
3. **`audit.block-insecure=false`** in the overlay, which the brief did not mention: see finding 2.
4. **The proposed test now has four tests, not three** (`testFieldKeepsErrorState` was added on 2026-10-15, `pilot/TESTS-RUN.md`). I compared
   with that record; EVIDENCE.md still shows the three-test version.
5. **`commit-code-check --branch f5e26580254`, not `--branch main`**, because the local `main` in the shared bare repo is not Drupal core's
   `main` (finding 5).

## Result: the known results reproduce
| Check | Expected | Got |
|---|---|---|
| Before: tracked changes (`git status --untracked-files=no`) | none | none (after restoring two scaffold files, finding 3) |
| After: branch and tip | tracks the fork, `2d600f40` | `3618230-adopt-the-ajax` tracks `drupal-3618230/…`, `2d600f40b97` |
| Pinned locks | same dependency versions on both | 148 of 148 packages identical between Before and After; 145 of 145 shared packages identical to core's `composer.lock` |
| `ddev phpunit …/Kernel/ManagedFileTest.php` Before | 1 test | OK (1 test, 5 assertions) |
| the same, After | 2 tests | OK (2 tests, 19 assertions) |
| `FileUploadAjaxMessageTest` Before | `testErrorIsReplaced` passes, `testErrorIsAnnounced` and `testErrorKeepsThemeMarkup` fail | `Tests: 4, Assertions: 35, Failures: 2`: exactly those two fail; `testErrorIsReplaced` and `testFieldKeepsErrorState` pass |
| the same, After | all pass | OK (4 tests, 35 assertions) |
| `ddev commit-code-check` on After | passes | CSpell, PHPStan, PHPCS pass (3 files); the file-mode check reports a false positive (finding 8); git modes are all 100644 |

The four-test totals match `reports/issues/3618230/pilot/TESTS-RUN.md` (Before `Tests: 4, Assertions: 35, Failures: 2`, After `OK (4 tests, 35
assertions)`). The brief's "3 tests, 26 assertions" is the earlier revision recorded in EVIDENCE.md. No difference remains to explain.

Timings: `ddev composer install` 15 s (Composer cache already warm); FunctionalJavascript run 40 s (Before) and 37 s (After); Kernel 3 to 5 s.

## FunctionalJavascript: what it took
Nothing beyond `ddev add-on get` and `ddev restart`. The Selenium container starts with the project (`chrome:4444`, noVNC on port 7900), and
the add-on sets `SIMPLETEST_*`, `MINK_DRIVER_ARGS_WEBDRIVER` (with `--disable-features=HttpsUpgrades`) and the WebDriver variables in
`.ddev/config.drupal-dev.yaml`. The test's file upload worked from the separate browser container with no shared temp directory (the
Nightwatch run on 2026-10-14 needed one). There is no `core/.env` step.

## Installing a site (step 3)
The add-on has no install command and its README only mentions Drush as an optional overlay package. Used instead: core's own script,
`ddev exec php core/scripts/dr install standard --site-name=…`, after deleting `sites/default/settings.php`.
- `dr install` stops with "Drupal is already installed" whenever `settings.php` carries database settings, and DDEV writes one at
  `ddev config` time. The check is the presence of connection info, not an empty database.
- It always installs onto SQLite, never onto the add-on's MariaDB container.
- Both sites then returned HTTP 200. The tests do not need this site (they build their own from `SIMPLETEST_DB`); it was done to answer
  step 3 and the replacement question below.

## Findings
1. **`ddev mr` on its own failed here, and the cause is the lab's layout.** The shared bare repo already has remote `f3618230` (the same fork,
   all branches, HTTPS). `ddev mr` added `drupal-3618230` (SSH, only the MR branch), then stopped: "several remotes have a branch called …".
   Fix used: `git switch --track drupal-3618230/3618230-adopt-the-ajax`, then `ddev mr core 16777` again, which finished. I did not set
   `checkout.defaultRemote`, because that would change the shared repo for every lab worktree. In a plain clone there is one remote and
   the problem does not arise. Both remotes now sit in `envs/core.git/config`.
2. **`pin-core-lock` cannot reproduce an old core's lock under Composer 2.10.** Core's lock at `f5e26580254` pins `symfony/http-foundation`
   v8.1.1, `symfony/yaml` v8.1.1 and `composer/composer` 2.9.8; the solver output names 14 advisories against those and other locked
   packages, and Composer refuses to solve with them ("Problem 1 to 4", `ddev composer update` exit 2). Setting `config.audit.block-insecure` to `false` in `composer.local.json` (gitignored;
   core's `composer.json` untouched) fixes it. What pinning does: without it, 95 of the 145 shared packages differed from core's lock
   (for example guzzle 8.2.0 against 8.0.0); with it, 0. The lab's own builds run `composer install` from core's lock (`setup.mjs:179`),
   and its pinned variants built two days ago, so they do not hit this; I did not rebuild one. Not tried: a core commit recent enough
   to have no advisories on its lock.
3. **`composer update` rewrites two tracked files, and `ddev mr` and `ddev switch core` both run it.** `autoload.php` and
   `autoload_runtime.php` gain a "generated by drupal-scaffold" comment. The lab's builds only run `composer install`, which does not. Rule 1
   would flag Before, and on the MR branch the two files show as modified and could be committed by accident. I restored them with
   `git checkout -- autoload.php autoload_runtime.php` after every update, and committed with an explicit path. An override in the overlay
   (`extra.drupal-scaffold.file-mapping` set to `false` for both files) did not stop it; I removed it and do not claim a fix.
4. **A worktree does not work for `ddev commit-code-check`, and it reports success.** The container cannot see the worktree's git directory
   (a host path under `envs/core.git/worktrees/`). The script prints "fatal: not a git repository" twice, then "There are no files to check", and
   exits 0: a pass that checked nothing. It worked after a read-only bind mount of `envs/core.git` at the same path
   (`.ddev/docker-compose.gitdir.yaml` in After, kept so the owner can run it again). A normal clone does not need this.
5. **The local `main` in `envs/core.git` is not Drupal core's `main`** (it is a 2026-08-26 merge commit from an unrelated repository), so
   `--branch main` would compare against the wrong tree. The check above used the MR's base, `--branch f5e26580254`.
6. **SSH works for `ddev mr`.** The fetch used the owner's SSH key (read only; `ssh -T git@git.drupal.org` answered with the account name).
   Nothing was pushed. `git push.default` is unset (Git's default, `simple`), and the branch name matches its upstream, so a plain `git push` goes
   to `git@git.drupal.org:issue/drupal-3618230.git`.
7. **Database.** The add-on assumes a MariaDB container (`SIMPLETEST_DB=mysql://db:db@db/db`); the lab omits it. The Kernel tests ran on
   MariaDB; `ddev phpunit --db=sqlite` exists. One more container per project.
8. **File-mode check: false positive caused by my setup, not by the code.** With `performance_mode: none` the bind mount makes `test -x`
   true for every file in the container (even `README.md`, mode 644), so the script says the three files "should not be executable".
   Git records 100644 for all three. Under Mutagen this would need a re-run to confirm.
9. **Disk.** Both trial trees at the end: 631 MB (After, includes `core/node_modules` from the first lint) and 235 MB (Before), plus Docker
   volumes. Free space went 3.5 GB, 1.5 GB at the lowest, 2.0 GB at the end. This machine has little room for a second pair beside the lab's.
10. **No `drupal` or `nightwatch` commands**, as the brief expected: there is no install, uninstall, login, cache or Nightwatch command.
    The table below lists what replaces each.

## The lab's use of justafish commands, and the replacement
By distinct command there are six (install, uninstall, login, cache, `test:extensions-enable`, the `.env` file); `ddev nightwatch` has no
caller in code, only in the 2026-10-14 manual run. By call site there are 13 in four files, plus the `add-on get` line and one text hint.

| Lab use | Where | Replacement | Checked in this trial |
|---|---|---|---|
| `ddev add-on get justafish/ddev-drupal-core-dev` | `setup.mjs:183` | `ddev add-on get amateescu/ddev-drupal-dev`, `ddev restart`, `ddev composer install`; no `--omit-containers=db --disable-settings-management` | yes (with a db container) |
| copy `.ddev/core-dev/.env` to `core/.env` | `setup.mjs:203` | not needed: the add-on sets `SIMPLETEST_*` and the WebDriver variables in `.ddev/config.drupal-dev.yaml` | yes (tests ran with no `.env`) |
| `ddev drupal uninstall` | `setup.mjs:208`, `lab-site.sh:47` | remove `sites/default/files` and `sites/default/settings.php` (what `dr install` itself tells you) | no |
| `ddev drupal login` as an "is it installed" probe | `setup.mjs:214` | test for `settings.php` with connection info, or the login script below | partly |
| `ddev drupal install standard --password=admin --site-name=…` | `setup.mjs:216`, `lab-site.sh:50` | `ddev exec php core/scripts/dr install standard --password=admin --site-name=…`, with no `settings.php` present | yes, without `--password` |
| `ddev drupal test:extensions-enable` | `setup.mjs:217` | add `$settings['extension_discovery_scan_tests'] = TRUE;` to `settings.php` (that line is in the `3604037` baseline's `settings.php`; I inferred this is what the command writes) | no |
| `ddev drupal login` (one-time link) | `lib.mjs:57`, `lib.mjs:64` | a short PHP script that boots Drupal and prints `user_pass_reset_url(User::load(1)) . '/login'`, run with `ddev exec php`; or Drush through the overlay | yes: the link opened `/user/1/edit?pass-reset-token=…` with HTTP 200 |
| `ddev drupal cache` | `serve.mjs:268`, `lab-site.sh:34,39,58`, hint in `make-bundle.mjs:118` | `ddev exec php core/scripts/dr cache:rebuild` | yes, HTTP 200 afterwards |
| `ddev nightwatch` | manual run, EVIDENCE.md | `ddev exec` with `yarn --cwd core test:nightwatch`; the add-on sets the `DRUPAL_NIGHTWATCH_*` variables but ships no command | no |
| `ddev phpunit` | `try-tests.mjs:145` | same name and arguments; the add-on's runs inside the project directory and understands `--db` | yes |

## Recommendation: use amateescu only for contributor work; keep justafish for the comparison pairs
1. **Switching the lab costs more than it gives.** Four files need glue for five commands that justafish provides (`dr install` plus
   settings handling, a login script, uninstall, the test-extensions line, `dr cache:rebuild`), the sites become MariaDB-backed or need the
   settings workaround, and the two add-ons cannot share a project because both ship `ddev phpunit`.
2. **Its pinning breaks on old core commits, and the lab has `*-pinned` variants,** unless audit blocking is switched off, which is a weaker
   default for an evaluation lab. The current builds install core's lock directly (finding 2).
3. **What it does add is real but small for this lab:** `ddev mr` finds the fork, tracks the MR branch and sets up SSH, so `git push` updates
   the MR. In a worktree of `envs/core.git` the same result takes `git remote add`, `git fetch`, `git switch --track`, which worked here
   as one command. If the owner wants this regularly, a standalone clone (not a worktree) with the add-on avoids findings 1, 4 and 5, and a
   lab command wrapping those three git steps would avoid installing an add-on at all. Either is a decision for the owner; neither was built.
4. For #3618230 the add-on did what was asked: the MR checkout, the pinned lock, the four-test results and the commit are all done.

## The test commit (not pushed)
- Commit `01e19a6fbaa3ceb964c0d5d91bf528fb7093fe98` on `3618230-adopt-the-ajax`, one file
  (`core/modules/file/tests/src/FunctionalJavascript/FileUploadAjaxMessageTest.php`, 157 lines), identical to
  `reports/issues/3618230/tests-proposal/…`. It was applied from `branches/3618230-tests-messagecommand.patch` (revision 2).
- Author is the owner's configured identity (Mike Gifford). The message follows `core/AGENTS.md` section 5 (short, no LLM-credit trailers),
  plus the disclosure line from section 1. Core asks that commit messages not be LLM-written, so **rewrite the message in your own words
  before pushing**; `git commit --amend` in that directory does it.
- To push (owner, with your SSH key):

      cd /Users/mgifford/drupal-core-lab/envs/trial-amateescu-after
      git log -1
      git push

  or explicitly `git push drupal-3618230 3618230-adopt-the-ajax`. The branch is based on `f5e26580254`, so the MR is still two months behind
  `main`. The same four tests gave the same results on core `3b94128e929` in the pilot run (`pilot/TESTS-RUN.md`, 2026-10-15).

## Cleaning up
Both projects are stopped. Start After again with `ddev start` in its directory (the gitdir mount is still in `.ddev/`). To delete them,
**after the push** (`remote remove` drops the branch's upstream, so `git push` would stop working; the push should also work from
`git -C …/envs/core.git push drupal-3618230 3618230-adopt-the-ajax`, which does not need the After worktree, but I could not test it without pushing):

    cd /Users/mgifford/drupal-core-lab/envs/trial-amateescu-before && ddev delete --omit-snapshot --yes
    cd /Users/mgifford/drupal-core-lab/envs/trial-amateescu-after  && ddev delete --omit-snapshot --yes
    git -C /Users/mgifford/drupal-core-lab/envs/core.git worktree remove --force /Users/mgifford/drupal-core-lab/envs/trial-amateescu-before
    git -C /Users/mgifford/drupal-core-lab/envs/core.git worktree remove --force /Users/mgifford/drupal-core-lab/envs/trial-amateescu-after
    git -C /Users/mgifford/drupal-core-lab/envs/core.git remote remove drupal-3618230

The commit lives on the local branch `3618230-adopt-the-ajax` in `envs/core.git`, which `worktree remove` keeps. Delete that branch
(`git -C …/envs/core.git branch -D 3618230-adopt-the-ajax`) only after the push. A `git fetch f3618230` during this trial added that fork's
other 44 branches as remote-tracking refs (`git remote prune` would not remove them, since the branches still exist upstream). They were
deleted afterwards by hand, leaving `refs/remotes/f3618230/3618230-adopt-the-ajax` like the lab's other fork remotes; `git fetch f3618230`
brings them back.

## Not verified
- Mutagen mode (the default); the file-mode check and sync behaviour may differ.
- The add-on on a core commit with no advisories on its lock, and on current `main`; `ddev switch`, `ddev add-module`, `--db=pgsql`, `--https`.
- Each test run more than once per side (the 2026-10-01 trial found a flaky upstream FunctionalJavascript test).
- `dr uninstall` equivalent, the `test:extensions-enable` replacement, `ddev nightwatch` replacement, Drush.
- The push itself, by design.

## Process notes
- At the start I stopped the lab's `3618230-latest` pair (two projects at most); they are still stopped.
- By mistake I ran `ddev start` in `envs/baseline-3618230-latest` while comparing file modes, and stopped it again straight away. Nothing
  in it changed.
- My first two `git worktree add` calls used a path relative to `envs/core.git` and created two worktrees inside it; I removed them
  (nothing had been done in them) and recreated both under `envs/`.

AI-assisted: yes. Tool: Claude Code. External code copied: no. Sources: the add-on's README, `install.yaml`, commands and docs on GitHub; this lab's
reports. Copyright concern: none known.
