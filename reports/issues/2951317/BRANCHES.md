# Branch patches for #2951317

Extracted 2026-10-17 from https://git.drupalcode.org/issue/drupal-2951317.git with `git diff <merge-base> <branch tip>`: only the branch's own changes.
Not rebased onto current `main`. The MR on drupal.org is the source of truth.

| Patch | Source | Tip | Base | Base date and subject | Files |
|---|---|---|---|---|---|
| [`branches/2951317-radios-element-missing-required-attr.patch`](branches/2951317-radios-element-missing-required-attr.patch) | https://git.drupalcode.org/issue/drupal-2951317.git `2951317-radios-element-missing-required-attr` | ab7ab046 | ad11ba71c0f0 | 2026-10-15 fix: #3628096 Default Admin attaches a library it doesn't define | 11 |

Shared lab fixture: `branches/2951317-shared-fixture.patch` is locally authored test support, applied first on both sides. It changes no production core implementation. The second After patch is the MR unchanged.
