# Branch patches for #3618405

Extracted 2026-10-14 from https://git.drupalcode.org/issue/drupal-3618405.git with `git diff <merge-base> <branch tip>`: only the branch's own changes.
Not rebased onto current `main`. The MR on drupal.org is the source of truth.

| Patch | Source | Tip | Base | Base date and subject | Files |
|---|---|---|---|---|---|
| `branches/3618405-purpose-of-filters.patch` | https://git.drupalcode.org/issue/drupal-3618405.git `3618405-purpose-of-filters` | c95dbac4 | 263b7b802ce7 | 2026-09-15 fix: #3621244 Navigation mobile sidebar close button in dark mode has low color contrast | 4 |

## Lab-derived variant (not from the issue fork)

`branches/3618405-with-role-search.patch` is the MR above **plus** `role="search"` on the exposed form, exploring simohell's #21 suggestion combined with the MR's visible `<h2>` (see comment #22). The kernel test gains an assertion for the role. Built in the lab, verified on `issue-3618405` (/admin/content) and `ddev phpunit` (1 test, 3 assertions). Base `263b7b802ce7`, 4 files. Not posted upstream.

