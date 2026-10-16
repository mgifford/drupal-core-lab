# Branch patches for #3618230

Extracted 2026-10-08 from https://git.drupalcode.org/issue/drupal-3618230.git with `git diff <merge-base> <branch tip>`: only the branch's own changes.
Not rebased onto current `main`. The MR on drupal.org is the source of truth.
The second row is a tests-only patch written in the lab for the MR. The owner pushed it to the issue fork on 2026-10-16 as commit `01e19a6f`,
which is now the MR's head: the same test file as in `tests-proposal/`, on top of `2d600f40`. Both patch files are kept as extracted, at the
earlier tip; an MR checkout at `01e19a6f` already contains the second one.

| Patch | Source | Tip | Base | Base date and subject | Files |
|---|---|---|---|---|---|
| [`branches/3618230-adopt-the-ajax.patch`](branches/3618230-adopt-the-ajax.patch) | https://git.drupalcode.org/issue/drupal-3618230.git `3618230-adopt-the-ajax` | 2d600f40 | f5e265802542 | 2026-08-20 task: #3586835 Fix outdated exclude-pattern in phpcs config | 2 |
| [`branches/3618230-tests-messagecommand.patch`](branches/3618230-tests-messagecommand.patch) | written in the lab 2026-10-14, then pushed by the owner to the issue fork on 2026-10-16 as `01e19a6f`: tests proposed for the MR (source in [`tests-proposal/`](tests-proposal/); results in [EVIDENCE.md](EVIDENCE.md#tests-proposed-for-the-mr-2026-10-14)) | applies to 2d600f40; the MR head is now 01e19a6f | | | 1 |
