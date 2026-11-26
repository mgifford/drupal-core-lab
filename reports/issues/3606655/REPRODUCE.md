# Reproduce #3606655: Allow user-configurable UI settings — starting with dark mode

Issue: https://www.drupal.org/project/drupal/issues/3606655
Pinned core: `ced1e2636622be0c1197a7cadeba13a7c9bbc8a8` (2026-11-04, `12.0-dev`) with MR !16432 at
`170be9e30054dc7e7477465e1bc9b9bdd648ef66` (`branches/3606655-mr16432-170be9e3.patch`).
Last verified: 2026-11-26. Historical pair: core `073a7d381984` + `branches/3606655-make-dark-mode.patch`
(tip `08a4cb4c`), kept unchanged.

## What the change does (as reviewed)

Adds a `color_scheme` base field to the user entity (`light`, `dark`, `auto`, default `auto`), three radios
(Light / Dark / System) in a "User settings" fieldset on the profile form, a `supports color scheme` theme
declaration, and removal of the old Default Admin dark-mode setting. The page always renders
`<html data-color-scheme="auto">`; a customized value travels in a `DrupalColorScheme` cookie and an inline
head script overrides the attribute. The issue summary describes a different mechanism (attribute from the
stored value, `color_scheme` Twig variable, capability-gated cache context); see `EVIDENCE.md` F1.

## Build and start

    node scripts/doctor.mjs 3606655-pinned
    node tools/compare/setup.mjs 3606655-pinned      # Before and After, ~12 min, resumable
    node scripts/lab-env.mjs start 3606655-pinned    # https://repro-baseline-3606655.ddev.site / -issue-

Both sites: Standard install, recipe `repro_3606655`, **admin / admin**.

Test-support settings, identical on both sides and not part of the patch:

- `sites/default/services.yml`: `parameters: http.response.debug_cacheability_headers: true`
- `sites/default/settings.php`: the matching `$settings` key (and, only for the upgrade run,
  `$settings['update_free_access'] = TRUE`)

## Re-run the checks

    NODE_TLS_REJECT_UNAUTHORIZED=0 node reports/issues/3606655/tests/probe-http.mjs \
      --base=https://repro-issue-3606655.ddev.site --side=after --envdir=envs/issue-3606655 \
      --out=reports/issues/3606655/tests/http-after.json
    NODE_TLS_REJECT_UNAUTHORIZED=0 node reports/issues/3606655/tests/probe-http.mjs \
      --base=https://repro-baseline-3606655.ddev.site --side=before --envdir=envs/baseline-3606655 \
      --out=reports/issues/3606655/tests/http-before.json

    NODE_TLS_REJECT_UNAUTHORIZED=0 node reports/issues/3606655/tests/probe-a11y.mjs \
      --base=https://repro-issue-3606655.ddev.site --side=after \
      --outdir=reports/issues/3606655/playwright
    NODE_TLS_REJECT_UNAUTHORIZED=0 node reports/issues/3606655/tests/reflow.mjs
    NODE_TLS_REJECT_UNAUTHORIZED=0 node reports/issues/3606655/tests/check-upgraded.mjs

    cd envs/issue-3606655
    ddev phpunit core/modules/user/tests/src/Functional/UserColorSchemeFormTest.php
    ddev phpunit core/tests/Drupal/FunctionalTests/EventSubscriber/ColorSchemeCookieTest.php

    node scripts/lint.mjs 3606655-pinned

The accessibility probe needs a Playwright Chromium, or the installed Chrome (`channel: 'chrome'`, which is
what it uses). The two PHPUnit runs took about 1.5 min and 1 min.

## Upgrade path, exactly as run

1. Export the unpatched database: `ddev exec sqlite3 …/.sqlite "PRAGMA wal_checkpoint(TRUNCATE);"`, then
   `ddev exec cat …/.sqlite > /tmp/before.sqlite` (the `.sqlite` file, not `.ht.sqlite`).
2. Stream it into the patched checkout's `sites/default/files/.sqlite`, delete `-wal`/`-shm` and
   `sites/default/files/php`, then wait for Mutagen to sync.
3. Set `$settings['update_free_access'] = TRUE` in the patched site, and clear caches.
4. With a cookie jar: `GET /update.php`, `GET /update.php/selection`, `GET /update.php/run`, then follow the
   `meta refresh` URLs (`/update.php/start?id=…&op=do_nojs`) until `op=finished`.
5. Expect: 3 pending updates (user 11401, two `default_admin` post updates), no failure, then
   "No pending updates"; `users_field_data` has `color_scheme`; existing rows are `NULL`;
   `/admin/appearance/settings/default_admin` has no dark-mode control; `/user/edit` defaults to System.

## Pitfalls found while doing this

- **Mutagen latency:** a settings.php edit is not visible to the container for a few seconds; `update.php`
  returned the "update_free_access" denial until the file synced.
- **The sqlite CLI in the container lacks `NOCASE_UTF8`:** queries that use the `name` index fail with
  "no such collation sequence". Query or update by `uid`, or read all rows.
- **The database is `sites/default/files/.sqlite`** (the project omits the `db` container); `.ht.sqlite` is empty.
- **`ddev drupal admin:login` failed** here (exit 1); the probes log in through the form with admin/admin.

## What is in this folder

| Path | What |
|---|---|
| `branches/*.patch`, `BRANCHES.md` | Both patch revisions with source, tip, base, date and hashes |
| `STATUS-*.md`, `status.json` | Dated status snapshots; re-check drupal.org before relying on them |
| `intake/` | Issue brief, comment index, MR review notes captured on 2026-11-26 |
| `EVIDENCE.md` | Results, findings, and what was not verified |
| `SUMMARY.md` | The review's entry point and verdict |
| `CACHE-CONTEXT.md` | Cache matrix with observed headers and limits |
| `tests/` | Probes and their machine-readable output (`results.json`, `http-*.json`, `invalid-value.json`) |
| `playwright/` | Screenshots and the accessibility JSON for both sides |
| `lint/` | Core code-check report for the patched files |
| `ISSUE-COMMENT-DRAFT.md` | A draft for a person to review and rewrite; nothing is posted |
