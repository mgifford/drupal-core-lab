# Branch patches for #3619154

Extracted 2026-10-14 from https://git.drupalcode.org/issue/drupal-3619154.git with `git diff <merge-base> <branch tip>`: only the branch's own changes.
Not rebased onto current `main`. The MR on drupal.org is the source of truth.

| Patch | Source | Tip | Base | Base date and subject | Files |
|---|---|---|---|---|---|
| [`branches/sidebar-toggle-fixes.patch`](branches/sidebar-toggle-fixes.patch) | https://git.drupalcode.org/issue/drupal-3619154.git `sidebar-toggle-fixes` | 6f7766cb | 6868135abe8e | 2026-10-11 task: #3613347 Re-use container in kernel tests | 23 |

## Lab-derived test (not from the issue fork)

[`branches/3619154-proposed-test.patch`](branches/3619154-proposed-test.patch) (readable source in [`tests-proposal/SidebarToggleTest.php`](tests-proposal/SidebarToggleTest.php)) adds a FunctionalJavascript `SidebarToggleTest` for the behaviours MR !16911 leaves untested. Applies on top of the MR. Verified in the lab: **5 tests fail on Before, pass on After (51 assertions)** with `ddev phpunit`. Not posted upstream.

