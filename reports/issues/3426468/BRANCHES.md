# Branch patches for #3426468

Extracted 2026-10-14 from https://git.drupalcode.org/issue/drupal-3426468.git with `git diff <merge-base> <branch tip>`: only the branch's own changes.
Not rebased onto current `main`. The MR on drupal.org is the source of truth.

| Patch | Source | Tip | Base | Base date and subject | Files |
|---|---|---|---|---|---|
| [`branches/3426468-make-the-active.patch`](branches/3426468-make-the-active.patch) | https://git.drupalcode.org/issue/drupal-3426468.git `3426468-make-the-active` | da53770681 | b064d94449d7 | 2024-06-17 Issue #3445847 by Alexander Allen, mstrelan, catch, xjm, longwave, mark_fullmer: PHPUnit 10 behaves differently when invoked outside web root | 6 |
| [`branches/3426468-active-indicator.patch`](branches/3426468-active-indicator.patch) | written in the lab, NOT from the issue fork (the fork's only issue branch is `3426468-make-the-active`): the `3426468-latest` fix per comment #28, for the current navigation CSS in `components/toolbar-button/`; added with the scaffold (`f1a2cfb`), listed in `3426468-latest` on 2026-10-15 at the owner's request; sha256 887f9d9f | - | applies to `main` `ad11ba71c0f0` (checked 2026-10-15) | - | 2 |
