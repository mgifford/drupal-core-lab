# AGENTS.md

## What this repository is

A **workspace for evaluating Drupal core changes**. Drupal core is not part of
this repository. Core checkouts live in `envs/` (gitignored) and are
disposable. What is kept over time is the evidence in `reports/`, the tooling,
and the accessibility skills in `.agents/` and `.claude/`.

The job: reproduce a problem on pristine upstream, apply an issue fork's branch
or a patch, compare the two under the same conditions, and write the result up
so a human can post it to drupal.org.

We follow the model of
[justafish/ddev-drupal-core-dev](https://github.com/justafish/ddev-drupal-core-dev),
a DDEV add-on for core development (`ddev drupal install`, `ddev phpunit`,
`ddev nightwatch`, lint commands, no Drush). This repository adds what the
add-on does not: several core checkouts side by side, baseline-versus-patched
comparison, and kept reports. **Status:** trialled on Drupal 12 `main` on 2026-10-01 and working; see below.

Instruction precedence: `ACCESSIBILITY.md`, then this file, then `STYLES.md`,
then `.agents/DRUPAL_AGENTS.md`. When they conflict, choose the safer, more
accessible option.

## Environments: baseline and patched, side by side

Never switch one checkout between "before" and "after". Use one worktree per
variant, each its own DDEV project:

    envs/core.git/                one shared clone of upstream core
    envs/baseline-main/           worktree at upstream/main. NEVER EDITED.
    envs/issue-<nid>-<variant>/   issue branch or patch under test

Both run the same PHP, database engine, theme and modules, so the only
difference is the code under test. Keep two or three DDEV projects running at
most; `ddev stop` the rest (each uses real memory).

### Verified procedure (manual, proven on 2026-10-01)

Verified on DDEV 1.25, PHP 8.5, Drupal 12 `main`, with core's own CLI and no
Drush. Adjust paths for `envs/`.

    git clone --bare https://git.drupalcode.org/project/drupal.git envs/core.git
    git -C envs/core.git config remote.origin.fetch '+refs/heads/main:refs/remotes/origin/main'
    git -C envs/core.git fetch origin main
    git -C envs/core.git worktree add --detach ../baseline-main origin/main
    cd envs/baseline-main
    mkdir -p .ddev        # copy a DDEV config.yaml here, set a unique `name:`
    ddev start && ddev composer install --no-interaction
    # Install the Standard profile: see "Installing a site" below
    ddev exec php core/scripts/dr cache:rebuild
    cp -n core/phpunit.xml.dist core/phpunit.xml

Put a change under test in a second worktree:

    git -C envs/core.git remote add issue-<nid> \
      https://git.drupalcode.org/issue/drupal-<nid>.git
    git -C envs/core.git fetch issue-<nid> <branch>
    git -C envs/core.git worktree add -b test-<nid> ../issue-<nid>-mr issue-<nid>/<branch>
    git -C envs/issue-<nid>-mr rebase origin/main   # so only the issue's changes differ

For a patch file: worktree at `origin/main`, then `git apply path/to.patch`.
Never commit `composer.lock` changes to a core checkout; run `composer install`.

### Installing a site

`core/scripts/dr install` only supports SQLite. For DDEV MariaDB use
`scripts/site-install.php` (Drupal's installer API; creates `admin`/`admin`).
Copy it into the environment, then run it inside DDEV:

    mkdir -p envs/<name>/.agents/scripts && cp scripts/site-install.php envs/<name>/.agents/scripts/
    cd envs/<name> && SITE_NAME="<label>" ddev exec php .agents/scripts/site-install.php

To reset a site: snapshot, drop and recreate the `db` database, remove
`sites/default/files` and `sites/default/settings.php`, `ddev restart`, then
install again. This sequence was run successfully on 2026-10-01.

### Preferred: the DDEV add-on (verified 2026-10-01)

[`justafish/ddev-drupal-core-dev`](https://github.com/justafish/ddev-drupal-core-dev)
(Apache-2.0) is the standard way to install and test inside each environment.
Trial notes and gotchas: `docs/ADDON-TRIAL-2026-10-01.md`.

    cd envs/<name>
    ddev config --omit-containers=db --disable-settings-management
    ddev start && ddev composer install --no-interaction
    ddev add-on get justafish/ddev-drupal-core-dev && ddev restart
    ddev drupal install standard              # SQLite, ~2 s
    ddev drupal module:install inline_form_errors
    ddev drupal login                         # one-time link
    ddev phpunit <path-to-test>               # JS tests use the add-on's Chrome

`ddev drupal list` shows everything it offers (lint, cache, uninstall, ...).
Note: SQLite, not MariaDB. A known-flaky upstream test is recorded in the trial
notes. The manual MariaDB procedure above remains the fallback.

### Current environments and URLs (local development; admin / admin)

| Environment | URL |
|---|---|
| `envs/baseline-main` (upstream `main`) | https://drupal-core.ddev.site |
| `envs/issue-3619127-vanilla` (MR + patches 0 and 1) | https://drupal-patch.ddev.site |
| Side-by-side viewer (`tools/compare`) | http://localhost:8100 |

Set with `ddev config --additional-hostnames=<name>`. The viewer and the diff
report are documented in `tools/compare/README.md`.

### Common commands (per environment)

    ddev exec php core/scripts/dr cache:rebuild
    ddev exec php core/scripts/dr user:login --name admin
    ddev exec 'cd /var/www/html && BROWSERTEST_OUTPUT_DIRECTORY=/tmp \
      vendor/bin/phpunit -c core <path-to-test>'

JavaScript tests need headless Chrome:
`ddev add-on get ddev/ddev-selenium-standalone-chrome && ddev restart`.
Host ports change after a restart; run `ddev describe`. If a browser cannot
load CSS/JS from `*.ddev.site`, use the `127.0.0.1:<port>` HTTP port.

## Where results go

One directory per issue: `reports/issues/<nid>/`.

- `EVIDENCE.md` from `reports/_templates/`, with exact commits for both envs.
- `*.patch` files, numbered so they stack.
- `VALIDATION.md`: before/after steps another person can repeat.
- `STATUS-<date>.md`: related issues and unresolved review threads, dated.
- `ISSUE-COMMENT-DRAFT.md`: a draft for the human to post.

Reports are Markdown plus small artifacts. Do not commit large raw scan output
(multi-MB JSON); summarise it and say where the raw data lives.

## Rules for agents

1. **Do not edit the baseline.** If `git status` there shows tracked changes,
   stop and say so.
2. **Record the commit** (`git rev-parse --short HEAD`) of every environment
   behind every result, and the tool/AT/browser/OS versions for manual tests.
3. **Snapshot before anything destructive** on a site database
   (`ddev snapshot --name <label>`).
4. **Never post to drupal.org, push to any remote, or comment on an issue**
   without the user's explicit approval. Draft for review.
5. **Never put tokens or passwords in this repository**, in chat, or in
   commands. Use an environment variable or a `chmod 600` file outside the repo.
   Credentials are gitignored by pattern, but do not rely on that.
6. **Do not add Drush or other dependencies** to a core checkout's
   `composer.json`. Use `core/scripts/dr`.
7. **Testing tools and scope:** see `docs/TESTING-TOOLS.md`. A synthetic Guidepup virtual screen reader is the agreed standard for comparing a change; real VoiceOver/NVDA passes are out of scope unless the user asks.
8. **Say what was not verified.** Automated results do not replace a keyboard
   and screen-reader pass for accessibility changes. Evidence stays DRAFT until
   the manual rows are filled and a human has reviewed.
9. **AI-assisted disclosure** on commits and drafted comments.
10. Do not copy code from external projects without a compatible licence and
   attribution.

## Teardown

    cd envs/<name> && ddev delete --omit-snapshot --yes
    git -C envs/core.git worktree remove ../<name> --force
