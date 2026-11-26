# Evidence: issue 3606655 (Allow user-configurable UI settings — starting with dark mode)

Status: DRAFT until a person has reviewed it. Every result below is tied to the revisions in the first
two tables. Historical evidence from 2026-10-15 is kept unchanged; see the last section.

Date: 2026-11-26. Author/agent: lab review run (AI-assisted; a person must review before anything is posted).

## Revisions

| Item | Value |
|---|---|
| Issue | [#3606655](https://www.drupal.org/project/drupal/issues/3606655), Needs review, **Unassigned** at fetch time (so the seven-day assignment rule does not restrict this work) |
| MR | [!16432](https://git.drupalcode.org/project/drupal/-/merge_requests/16432), branch `3606655-make-dark-mode` into `main` |
| MR head | `170be9e30054dc7e7477465e1bc9b9bdd648ef66`, last updated 2026-11-05T09:33Z |
| Core base | `ced1e2636622be0c1197a7cadeba13a7c9bbc8a8`, 2026-11-04, `12.0-dev` |
| Lab patch | `branches/3606655-mr16432-170be9e3.patch`, sha256 `04507c78e85e52c19ae1877a9da717f45d71ed0c6c2c903810954ac5885f5f04` |
| Pipeline | #1032080 (2026-11-05, merge ref `f9076ada`): **success**; `PHP Static Analysis (phpstan)` **success**. Two PHP 8.6 unit jobs failed with `allow_failure=true`; their logs answer HTTP 401 anonymously and are **not** attributed to the MR |
| Applies to current main? | Yes, to `a48087f2` (2026-11-26), `git apply --cached --check`. Not built or run there |

## Environments

| Env | Directory | Commit | Notes |
|---|---|---|---|
| Before | `envs/baseline-3606655` | `ced1e263662` | unpatched; Standard install + recipe `repro_3606655`; admin/admin |
| After | `envs/issue-3606655` | `ced1e263662` + patch above | same recipe; admin/admin |

Test-support changes, identical on both sides: `sites/default/services.yml` turns on
`http.response.debug_cacheability_headers`; `settings.php` has the matching setting. After also had
`$settings['update_free_access'] = TRUE` for the upgrade run. None of this is part of the patch under test,
and no tracked file in either core checkout was modified.

## Automated results

| Run | Command | Result |
|---|---|---|
| HTTP/cookie/cache matrix | `NODE_TLS_REJECT_UNAUTHORIZED=0 node tests/probe-http.mjs --base=<site> --side=<before\|after> --envdir=<env>` | `tests/http-before.json`, `tests/http-after.json` (8 steps each) |
| Accessibility | `node tests/probe-a11y.mjs --base=<site> --side=<before\|after> --outdir=playwright` | `playwright/a11y-after.json`, `playwright/a11y-before.json`; 6 screenshots |
| Invalid stored value | `node tests/probe-invalid-value.mjs <after-url>` | `tests/invalid-value.json` |
| Upgrade path | unpatched DB streamed into the patched checkout, `/update.php` → `/update.php/selection` → `/update.php/run` | 3 pending updates ran, no failure, second visit: "No pending updates" |
| Upgraded-site checks | `node tests/check-upgraded.mjs` | old Default Admin control gone; profile default `auto` |
| Reflow comparison | `node tests/reflow.mjs` | 320px: scrollWidth 387 on **both** sides |
| MR functional test | `ddev phpunit core/modules/user/tests/src/Functional/UserColorSchemeFormTest.php` | **OK (12 tests, 151 assertions)** |
| MR cookie/cache test | `ddev phpunit core/tests/Drupal/FunctionalTests/EventSubscriber/ColorSchemeCookieTest.php` | **OK (5 tests, 58 assertions)** |
| Core code checks | `node scripts/lint.mjs 3606655-pinned` | **PASS** (exit 0, 67 s): PHPCS, PHPStan "No errors", CSpell, ESLint; report in `lint/2026-11-26-3606655-pinned-after.md` |

Neither checkout has uncommitted changes outside the applied patch and the site-level test-support files. The baseline's tracked files are unmodified (`git -C envs/baseline-3606655 status` shows only untracked `recipes/` and `sites/default/services.yml`); the patched checkout's 36 entries are exactly the MR's 33 changed files plus `.lab-patches-applied`, the new test themes and the new test files.

## What the live site actually sends

`data-color-scheme` is the only server-rendered signal, and it is `auto` in every case below. The stored
preference never reaches the HTML.

| Case | `<html data-color-scheme>` | `DrupalColorScheme` cookie | Cache contexts (excerpt) |
|---|---|---|---|
| Before, any case | absent | absent | no color scheme context |
| After, anonymous | `auto` | none | no `user.color_scheme` |
| After, admin on `auto` | `auto` | none | no `user.color_scheme` |
| After, admin on `dark` | `auto` | `dark` (Secure, SameSite=Lax, 1 year) | no `user.color_scheme` |
| After, admin on `light` | `auto` | `light` | no `user.color_scheme` |
| After, second account on `dark` | `auto` | `dark` | no `user.color_scheme` |
| After, two accounts on `light` | `auto` | `light` each | identical contexts |
| After, front theme `stark` (no declaration) | `auto` | unchanged | unchanged |
| After, front theme `default_admin` (declares support) | `auto` | unchanged | unchanged |

The account form is the only place the theme capability changes anything: with a non-supporting front end it
reads "Administrative pages follow this setting, the rest of the site does not."; with a supporting one,
"Applies wherever your site's theme supports it." The attribute and the cacheability are identical either way.

## Accessibility (scripted, real input; not a person's pass)

| Check | Result |
|---|---|
| Group name | `fieldset` + `legend` "Color scheme" |
| Description | `aria-describedby` on the fieldset resolves to the descriptive text |
| Selected state | `System` checked by default; each stored value re-checks the right radio |
| Keyboard | ArrowDown/ArrowRight move focus **and** selection; Space selects; one tab stop for the group |
| Focus | solid 4px `rgb(0, 125, 250)` outline on the focused radio |
| axe (light, dark, forced colours) | **0 violations** each; 13 `color-contrast` nodes are "incomplete" in forced colours (axe cannot evaluate it there) |
| Forced colours | control keeps native form appearance; screenshot captured |
| 320px viewport | horizontal overflow 387px, **identical Before and After** — pre-existing Default Admin layout, not this MR |

Screenshots: `playwright/after-profile-color-scheme-{light,dark,forced-colours,320px}.png` and
`playwright/before-profile-no-color-scheme-{light,dark}.png`.

## Findings

**F1 (blocker, process).** The MR and the issue summary describe different designs. The summary still asks for
a `data-color-scheme` attribute carrying the stored value, a `color_scheme` Twig variable, and a capability
declaration that gates both the attribute and a cache context; it calls step 4 "the outstanding work". The MR
instead renders `data-color-scheme="auto"` for everyone, carries the preference in a `DrupalColorScheme`
cookie, and overrides the attribute with an inline script. That decision is recorded only in the MR
description, in diff version 32 (2026-09-02); no issue comment records it. Reviewers cannot tell which design
is agreed. Evidence: `http-after.json`, source diff, issue summary.

**F2 (blocker, review state).** 17 resolvable review threads are unresolved: amateescu (2026-08-04),
goba (2026-08-22, the update-hook number), longwave ×14 (2026-09-02, including cookie consent and the script
on every page) and poker10 (2026-09-03). The MR reports `blocking_discussions_resolved: true` at the same
time. The four threads whose subject matter is still visible in the code are the ones listed under F3–F5.
Evidence: the discussions feed, captured in `intake/mr-16432-notes.txt`.

**F3 (minor, standards).** `user_update_11401()` is numbered for 11.4, but `main` is `12.0-dev` (checked at
the MR base, at the 2026-11-04 base and at current main). Other modules already use `12000`, `12001`, `12002`
and `12100`. The hook runs, but it is numbered for a branch this change is not on. goba's unresolved thread
asks exactly this.

**F4 (minor, upgrade data).** After upgrading an unpatched database, existing rows get `color_scheme = NULL`,
not `'auto'`; `User::getColorScheme()` masks it, but `$user->get('color_scheme')->value` is empty, and JSON:API
output for upgraded accounts differs from a fresh install. The field's default is applied on save, not to
existing rows.

**F5 (minor, documentation).** `ColorSchemeCookieSubscriber` refers twice to
`Drupal\Tests\Core\EventSubscriber\ColorSchemeCookieSubscriberTest`, which is not in the checkout.

**F6 (scope, for maintainers).** No-JS clients never get a customized preference: the server always sends
`auto`, and only the head script changes it. That is the direct consequence of moving the value out of the
markup, and it is the trade-off the summary's design avoided. Not measured as a defect beyond the observation;
it needs a maintainer decision, not a patch.

**What works.** The cookie design is internally consistent and well tested. Saving a preference writes the
cookie and makes that response uncacheable; the next request, whose cookie agrees, is cacheable again; the
page cache never stored a `Set-Cookie`; each account's cookie is its own; anonymous pages stay cacheable; the
control is accessible; the old Default Admin setting is gone; PHPStan and the shipped tests pass (17 tests, 209 assertions across the two suites that were run).

## Resources

| Item | Value |
|---|---|
| Build | Two environments from the shared clone, 2026-11-26 09:44–09:58 local (≈14 min), resumable; ~630 MB each |
| Browser work | Chrome 147 (Playwright `channel: chrome`), macOS; probes ≈2 min |
| PHPUnit | 1.5 min (form suite) and 1 min (cookie suite) |
| Code checks | `lint.mjs`: 67 s |
| CPU, memory, tokens | Not measured. Commands ran outside `lab-run`, so the lab's resource ledger has no rows for them; no CPU-time or token figure is claimed |

`node scripts/coverage.mjs 3606655` reports "0 of 6 automated environments tested" because the probes here
are custom scripts that do not record runs in the labour framework's run format. The authoritative
machine-readable record for this review is `tests/results.json` together with the JSON files beside it, not
`COVERAGE.md`.

## Not verified

- **No person has done a keyboard or screen-reader pass.** The keyboard and axe results above are scripted
  with real browser input; they are not a substitute for a person's review. No VoiceOver or NVDA session was run.
- **No real resource measurement.** Cache correctness was tested; request time, memory and cache-entry counts
  were not measured, and no performance claim is made. The lab host ran 13+ DDEV projects at the time, so any
  timing would have been meaningless.
- **No `-latest` environment.** The patch applies to `a48087f2`, but only `ced1e263` was built and run.
- **The PHP 8.6 failures** were not diagnosed: the logs need authentication (HTTP 401 anonymously).
- **The legacy dark-mode migration** (`default_admin_post_update_migrate_dark_mode_to_color_scheme`) could not
  be exercised: the test database had no per-user `users_data` rows for `default_admin`.
- **`ColorSchemeScriptTest`** (JavaScript) was not run; the script was verified in the browser via the
  attribute/aria probes and the MR's own functional coverage.

## Historical evidence, preserved

`branches/3606655-make-dark-mode.patch` (tip `08a4cb4c`, base `073a7d381984`, sha256 `bbbe599e…`) and
`STATUS-2026-10-15.md`, `STATUS-2026-11-09.md` and `compare/3606655-pinned/` are untouched. That combination
can still be rebuilt by setting `core.commit` back to `073a7d381984` and the patch back to the old file. The
2026-10-15 patch already contained the cookie design; the 2026-11-04 rebase changed only the `AccountForm`
constructor (PHPStan level 3), so the older evidence describes the same behaviour.
