# Branch patches for #3619154

The MR on drupal.org is the source of truth. Earlier versions of a patch are in `original-patches/`, with who changed it and why in
`PATCH-CHANGES.md`.

| Patch | Source | Tip | Base | Base date and subject | Files |
|---|---|---|---|---|---|
| [`branches/sidebar-toggle-fixes.patch`](branches/sidebar-toggle-fixes.patch) | MR !16911, https://git.drupalcode.org/issue/drupal-3619154.git `sidebar-toggle-fixes` | 175e6f17 | f2abd4143f87 | 2026-10-17 fix: #3622469 Fix field.settings:purge_batch_size config name and key | 23 |

**How the 175e6f17 patch was obtained (2026-10-18).** git.drupalcode.org was not reachable from the session that recorded it. The
owner pasted the MR's plain diff (GitLab `merge_requests/16911.diff`) into the session. Its "before" hashes match core main
`f2abd4143f87`. The patched files were rebuilt on that commit: the lab's earlier patch, the pasted Umami numbers, and the new
forced-colours block in both edit-sidebar stylesheets. All 22 resulting files match the pasted diff's `index` hashes, and the three
removed or renamed files are gone, as the diff says. The file here was then written with `git diff --full-index -M`, so its text may
differ from GitLab's rendering while its content is identical. The tip is the head shown on the issue page, not read from git.
To extract it the usual way: `node scripts/new-issue.mjs 3619154 --branch sidebar-toggle-fixes --refresh`.

Earlier: `6f7766cb` on base `6868135abe8e` (2026-10-11 task: #3613347 Re-use container in kernel tests), extracted 2026-10-14 with
`git diff <merge-base> <branch tip>`; kept as `original-patches/sidebar-toggle-fixes.d4c7c754.patch`.

## Lab-derived test (not from the issue fork)

[`branches/3619154-proposed-test.patch`](branches/3619154-proposed-test.patch) (readable source in
[`tests-proposal/SidebarToggleTest.php`](tests-proposal/SidebarToggleTest.php)) adds a FunctionalJavascript `SidebarToggleTest` for
the behaviours MR !16911 leaves untested. Written on 2026-10-14 against `6f7766cb` and verified there with `ddev phpunit`: **5 tests
fail on Before, pass on After (51 assertions)**. On 2026-10-18 it still applies on top of `175e6f17` on core `f2abd41` (it adds one
new file); it has not been re-run on that revision. Not posted upstream.
