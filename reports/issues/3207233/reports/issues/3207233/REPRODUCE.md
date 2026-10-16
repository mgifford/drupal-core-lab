# Reproduce #3207233: active workspace indication

DRAFT local test package for Drupal Core Lab. Run commands from your existing `drupal-core-lab` repository root, except where a subshell changes directory. Sites are disposable issue-specific DDEV projects. The recipe does not touch other issue environments.

## Install these additions

Save the supplied ZIP outside your checkout. Inspect its file list, then extract with overwrite disabled:

```bash
unzip -l /path/to/3207233-local-test-kit.zip
unzip -n /path/to/3207233-local-test-kit.zip -d /path/to/drupal-core-lab
cd /path/to/drupal-core-lab
node scripts/index-issues.mjs
git status --short
```

The ZIP adds only this issue's report folder, recipe folder, and replay script. It does not replace shared lab tooling or variants. `-n` skips existing files; if a prior version exists, compare and reconcile it before continuing. The lab automatically discovers `reports/issues/3207233/variants.json`. No issue-pack import or new-issue scaffold is needed.

## Build the pinned pair first

Start Docker Desktop, Colima, or OrbStack and make sure DDEV is installed. Stop other issue pairs to conserve resources. Do not reset another issue's environment.

```bash
node scripts/doctor.mjs 3207233-pinned
node tools/compare/setup.mjs 3207233-pinned --check-patches
node tools/compare/setup.mjs 3207233-pinned
node scripts/lab-env.mjs start 3207233-pinned --browser
```

First setup can take 10 to 20 minutes. If interrupted, rerun setup. If Drupal GitLab cannot be reached, use the official GitHub mirror:

```bash
node tools/compare/setup.mjs 3207233-pinned --core-url=https://github.com/drupal/drupal.git
```

The comparison viewer is normally https://drupal-compare.ddev.site or http://localhost:8100. Use the URL printed by lab-env on your machine. Use its login controls, or run `ddev drupal login` inside the relevant environment and open that one-time URL locally. Do not save login URLs in reports.

The setup builds:

| Variant | Before | After |
|---|---|---|
| `3207233-pinned` | `envs/baseline-3207233` | `envs/issue-3207233` |
| `3207233-latest` | `envs/baseline-3207233-latest` | `envs/issue-3207233-latest` |

Both pinned sites use core `ca18edacfe9b9c2afc217151cd40653b90575f9e`. Only After receives the core patch. The shared recipe installs Workspaces UI. Its post-step creates Lab stage, Lab summer event, Lab nested campaign (child of Lab stage), and Lab <em>literal</em> & review (literal angle brackets). It neither changes the active workspace nor overwrites existing workspace values. A conflicting fixture ID stops setup.

## Inspect by hand

Open `/admin/config/workflow/workspaces` in both sites. Turn click mirroring off for workspace switching and confirm each switch separately. Start with Live, switch to Lab stage, then Lab nested campaign, then the literal-label workspace, then back to Live.

After should show a bold active label, including `(active)` in a named workspace's link, and a caption such as `Current workspace: Lab stage`. Before should retain its original highlighted row without the new text. Check that the nested row retains indentation, angle-bracket text is not rendered as emphasis, and old active markers disappear after switching.

Use Tab to reach the active named-workspace link. Check visible focus and activation. Live is static text when active; it should not acquire an artificial tab stop. Use table reading to find its state. Check forced colors and a narrow viewport. Open the off-canvas workspace switcher and verify that names and switching still work; the patch must not add `(active)` to unrelated choices.

No finding about a success announcement is established by this listing patch. Record any announcement problem separately.

## Run the recorded replay

Install the lab's existing browser dependencies once. No new package is added:

```bash
npm ci --prefix tools/playwright
(cd tools/playwright && npx playwright install chromium firefox webkit)
node tools/playwright/evaluate-3207233.mjs 3207233-pinned
```

The replay logs in locally as administrator and changes the active workspace on these two test sites. On successful completion it returns both to Live. If interrupted, the next run normalizes the starting state to Live. It uses real Enter activation for switching, real Tab navigation to the active link, ARIA snapshots, a Guidepup DOM simulation, screenshots, and axe at five stages. Output goes under `reports/issues/3207233/playwright/<timestamp>-<configuration>/`, including `SUMMARY.md` and `results.json`. It records exact core revisions, patch hashes, modules, themes, browser, OS, AJAX, and live-region observations using the existing lab library.

```bash
node tools/playwright/evaluate-3207233.mjs 3207233-pinned --scheme=dark
node tools/playwright/evaluate-3207233.mjs 3207233-pinned --forced-colors
node tools/playwright/evaluate-3207233.mjs 3207233-pinned --viewport=480x900
node tools/playwright/evaluate-3207233.mjs 3207233-pinned --browser=firefox
node tools/playwright/evaluate-3207233.mjs 3207233-pinned --browser=webkit
node scripts/coverage.mjs 3207233
```

Exit 0 means the scripted expectations matched. Exit 2 means at least one expectation differed. A runtime exception means the replay did not complete; do not report it as an accessibility failure. A `mixed` result needs investigation. If Before already has active text, check whether upstream fixed the issue before changing expectations. Guidepup simulates DOM semantics; it does not establish actual screen reader speech or navigation timing. Browser dark-mode emulation does not prove the theme supports dark mode.

Do not use the generic `screenreader.mjs` here: it targets a different issue's URL-alias field. This replay records its own table simulation.

## Run Drupal checks

With the pair built and started:

```bash
node scripts/lint.mjs 3207233-pinned
(cd envs/issue-3207233 && ddev phpunit core/modules/workspaces/tests/src/Functional/WorkspaceTest.php --filter testWorkspaceList)
```

The first command runs the lab's Drupal code checks. The PHPUnit command runs the updated existing regression test on After. The modified test is already part of the declared patch, so do not use try-tests to copy it over an existing core test. Run the remaining Workspaces tests before proposing upstream inclusion. No PHPUnit success is claimed in this package.

## Try current main later

```bash
node scripts/lab-env.mjs stop 3207233-pinned
node tools/compare/setup.mjs 3207233-latest --check-patches
node tools/compare/setup.mjs 3207233-latest
node scripts/lab-env.mjs start 3207233-latest --browser
node tools/playwright/evaluate-3207233.mjs 3207233-latest
```

The latest pair inherits the recipe, patch, steps, and checks. Existing latest environments retain their checked-out commit. Use the lab's documented retirement/rebuild workflow when a fresh main checkout is needed, keeping prior evidence.

If a patch is revised, record the change with `scripts/patch-change.mjs record`, then use `setup.mjs <slug> --refresh-patches`; never edit Before. If fixture setup changes, follow the lab's snapshot/reset guidance instead of layering a new recipe over an unrelated state.

## Record results and stop

Review the dated replay summary and fill in EVIDENCE.md with the actual run folder, revisions, failures, and manual observations. Keep DRAFT until reviewed. Do not turn missing runs into PASS results. Record pagination, read-only access, translations, and off-canvas checks as untested until performed.

```bash
node scripts/coverage.mjs 3207233
node scripts/index-issues.mjs
node scripts/lab-env.mjs stop 3207233-pinned
```

Use `3207233-latest` in the stop command if that is the pair you started. No command here posts to Drupal.org or pushes to GitHub.
