# Reproduce #3615469: maintenance form login link text

DRAFT. This uses the existing Drupal Core Lab viewer with two independent Standard sites. It never requires enabling maintenance mode. All commands run from your drupal-core-lab repository root unless a subshell says otherwise.

## Install the additions

Extract 3615469-local-test-kit.zip into Downloads. It contains a folder named 3615469-local-test-kit. From your repository root, preview and install:

```bash
python3 ~/Downloads/3615469-local-test-kit/install-3615469.py
python3 ~/Downloads/3615469-local-test-kit/install-3615469.py --install
node scripts/index-issues.mjs
ls reports/issues/3615469/variants.json
```

The installer checks that you are at the lab root. It copies a fixed list of issue files and makes backups of different existing files before replacing them. It does not touch environments, shared tooling, or the old screenreader evidence. The existing EVIDENCE.md receives a current addendum while its historical content is preserved in the packaged version; a local version is backed up if it differs. Review the backup if you added evidence locally.

## Switch away from #3207233

Download any viewer log or notes you want to keep. Stop the active old pair (replace the slug if you ran latest):

```bash
node scripts/lab-env.mjs stop 3207233-pinned
node scripts/lab-env.mjs status
```

If you do not know which pair is running, run status first. Do not use reset, delete, or retire to switch issues. Stopping keeps the code, databases, patch, and reports.

## Build and start

```bash
node scripts/doctor.mjs 3615469-pinned
node tools/compare/setup.mjs 3615469-pinned --check-patches
node tools/compare/setup.mjs 3615469-pinned
node scripts/lab-env.mjs start 3615469-pinned --browser
```

The pinned pair uses core 89973d2da24ffbae29903502e585bd66bd57ba06. Before: envs/baseline-3615469. After: envs/issue-3615469. Only After has MR !16609. If the upstream GitLab host is inaccessible, add --core-url=https://github.com/drupal/drupal.git to setup. First setup takes time; rerun it if interrupted.

The recipe is recipes/repro_3615469/recipe.yml. It intentionally adds no content, module, or configuration: the Standard install already has the form. There is no need for a workspace fixture or a maintenance-mode toggle.

## Reset the viewer conditions

In the viewer, use Reset all in the Not default strip to reset comparison conditions. Use Reset browser state (both) if you want to clear per-site localStorage and sessionStorage. These are different controls: clearing frame storage does not clear the viewer's preferences. Use Clear log in the live accessibility panel to begin a fresh comparison. Turn click mirroring off for the final keyboard checks. Begin at normal width, light mode, forced colors off, and JavaScript enabled.

Do not use lab-env reset to reset viewer options: it reinstalls site databases. Do not use browser --reset unless you intend to discard the entire saved lab browser profile.

## Compare

Open /admin/config/development/maintenance on both sites. Log in using the viewer controls if needed. Do not save the form or switch maintenance mode on.

1. Read the description of Put site into maintenance mode. The whole sentence should remain the same.
2. Inspect the login link. Before: user login. After: user login page. Its destination remains /user/login.
3. Tab through the checkbox and its description links in each frame. Check visible focus and the complete login link name.
4. Review the links list or rotor if available. Keep actual screen reader observations separate from simulated output.

A passing axe scan cannot establish that the reported speech issue is fixed. On a real iPhone or iPad, record device, OS, browser, and VoiceOver settings and compare the checkbox description on both sites. Desktop WebKit is not a substitute. Do not publish local sites or create a cloud workspace merely to run this check without deciding how access will work.

## Replay and Drupal tests

```bash
npm ci --prefix tools/playwright
(cd tools/playwright && npx playwright install chromium)
node tools/playwright/evaluate-3615469.mjs 3615469-pinned
node scripts/lint.mjs 3615469-pinned
(cd envs/issue-3615469 && ddev phpunit core/modules/system/tests/src/Functional/System/SiteMaintenanceTest.php)
(cd envs/baseline-3615469 && ddev phpunit core/modules/system/tests/src/Functional/System/SiteMaintenanceTest.php)
```

Replay output: reports/issues/3615469/playwright/<timestamp>-<configuration>/. It contains SUMMARY.md, results.json, screenshots, exact core revisions, patch hashes, site context, ARIA snapshots, Tab observations, simulated speech, and axe. The form is not submitted. Exit 0 means scripted expectations matched; exit 2 means mixed results. A runtime exception is an incomplete test, not evidence of an accessibility failure. The schema verdict reproduced-and-fixed refers only to the link-name change, not iOS speech or WCAG conformance.

Optional runs use --scheme=dark, --forced-colors, --browser=firefox, or --browser=webkit. Install the matching browsers first. Dark-mode emulation does not prove a particular theme supports dark mode. The existing single-site linktext-3615469.mjs remains available, but the new evaluate script records both sides using the standard lab run schema.

## Current core and results

Use 3615469-latest with setup and lab-env to build the same comparison on current main. Its environments are separate. Existing latest environments keep their checked-out commit; rebuilding is a separate operation. Preserve old results and consult docs/ENVIRONMENTS.md before changing installed sites.

```bash
node scripts/coverage.mjs 3615469
node scripts/index-issues.mjs
node scripts/lab-env.mjs stop 3615469-pinned
```

Add actual run links and limitations to EVIDENCE.md. Keep DRAFT until reviewed. No command here pushes code or posts to Drupal.org.
