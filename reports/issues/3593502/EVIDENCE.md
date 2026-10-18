# #3593502: evidence

**DRAFT.** Baseline measured by the lab on 2026-10-16. Not reviewed by a person yet.

## Before only: what the current menu edit form costs (unchanged core)

The merge request has not been run here. These numbers are the baseline it has
to beat, on the same large menu that `recipes/repro_3593502` creates on both
sides. The MR source and comments were reviewed separately on 2026-10-16.

Environment: Drupal core `11.x` at `4a3b0586` (2026-10-16), from the GitHub mirror; PHP 8.3.6 CLI and PHP's built-in web server
(`php -S` with `.ht.router.php`); SQLite; Standard install; no DDEV (a Claude Code cloud container with no Docker). `main` needs
PHP 8.5, which that container did not have, so `11.x` stood in for it. The code that builds this page is byte for byte the same in
`main` at `d29add7e` (2026-09-30): `menu_ui/src/MenuForm.php`, `menu_ui/src/Hook/MenuUiHooks.php`,
`menu_link_content/src/Form/MenuLinkContentForm.php`, `Core/Menu/MenuTreeStorage.php` and `Core/Menu/MenuLinkTree.php` (compared
with `diff`). PHP version and rendering can still differ: re-measure on `main` in DDEV.

Menu shape: `seed-menu.php` default, fan-out 10, breadth first (10, 100, 1000, 10000, then the fifth level). Every link points to
`/node`.

### Building the form (`measure-menu-form.php main`, as user 1, memory limit lifted)

| Links | Form rows | Peak memory | Above boot | Time to build | Seeding time |
|---:|---:|---:|---:|---:|---:|
| 1,000 | 1,001 | 91.7 MB | 76.9 MB | 0.8 s | 3 s |
| 5,000 | 5,001 | 358.1 MB | 343.4 MB | 6.6 s | 15 s |
| 15,000 | 15,001 | 1,024.4 MB | 1,009.6 MB | 33.5 s | 49 s |

Memory grows linearly, at about 70 KB per link; time grows faster than linearly. One extra row is Standard's static "Home" link.
This is building the form only, not rendering it.

### A real page request (`peak-memory.php` log), 15,000 links, logged in as user 1

| PHP limits | Result | Time | Peak memory | Log |
|---|---|---:|---:|---|
| `memory_limit=256M`, 30 s | HTTP 500 | 3.3 s | 228.8 MB | `FATAL: Allowed memory size of 268435456 bytes exhausted (tried to allocate 12288 bytes)` |
| no memory limit, 30 s | HTTP 500 | 30.7 s | 1,132.8 MB | `FATAL: Maximum execution time of 30 seconds exceeded` |

So the page fails on a common 256M host, and still fails with unlimited memory because of PHP's default 30-second time limit.
At about 70 KB per link, a 256M limit is reached at roughly 3,500 links, and 128M at roughly 1,500 (estimates from the line above,
not measured).

### Commands

    git fetch --depth 1 https://github.com/drupal/drupal.git refs/heads/11.x; composer install --no-dev
    php core/scripts/dr install standard --password=admin --site-name="Lab test"
    cp -R recipes/repro_3593502 <site>/recipes/; php core/scripts/dr recipe:apply recipes/repro_3593502
    LAB_MENU_LINKS=<n> bash recipes/repro_3593502/apply.sh
    php recipes/repro_3593502/measure-menu-form.php main
    # settings.php: include $app_root . '/recipes/repro_3593502/peak-memory.php';
    php -d memory_limit=<limit> -S 127.0.0.1:8890 .ht.router.php
    php core/scripts/dr user:login --uid=1 --url=http://127.0.0.1:8890   # then curl with a cookie jar, as in CODER-PROMPT.md

Also checked: `apply.sh` run twice does nothing the second time; with a larger `LAB_MENU_LINKS` on a partly seeded menu it stops
with a message and exit 1 instead of adding duplicates; the memory log redacts one-time login paths.

## After

Not tested. The proposed follow-up patch passed static patch and JavaScript
syntax checks only. See `FOLLOW-UP-PATCH.md` for the unrun PHPUnit commands and
the remaining manual checks.

The local DDEV pack is now defined in `variants.json`: patch 1 is the downloaded
MR !15975 diff and patch 2 is the proposed interdiff. `REPRODUCE.md` gives the
build, browser evaluation, PHPUnit, lint, and manual-test sequence. No DDEV run
has yet been recorded in this file.

## Local Lighthouse observation still requiring confirmation

A single local Lighthouse comparison of **MR !15975** against **MR !15975 +
review interdiff** reported `forced-reflow-insight` only on the latter side,
with two diagnostic items. That result is not yet enough to attribute a new
forced reflow to the interdiff. The interdiff changes forced-colours CSS,
asynchronous CSRF-token handling, checkbox state, and tests; it does not add an
obvious layout read. Lighthouse performance insights are timing-sensitive, and
the earlier viewer discarded the diagnostic call stacks.

The lab viewer now preserves bounded Lighthouse diagnostic evidence and labels
the columns with the actual patch-stack names. Repeat the audit at least three
times on an otherwise idle machine and inspect the expandable evidence before
reporting this as a regression. Save a downloaded log if the same call site is
consistently new.

## Resource evidence

No repeatable DDEV resource result has been recorded yet. Run the selected pair
with:

```shell
node scripts/measure-resources.mjs 3593502-interdiff --runs=10 --warmups=2
```

This defaults to the two environments in the selected comparison. Add
`--group` only when a three-environment Core, MR, and MR-plus-interdiff trial is
wanted. Commit the generated JSON and Markdown from
`reports/issues/3593502/resources/` as the evidence for the machine and run.
