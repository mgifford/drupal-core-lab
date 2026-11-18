# Branch patches for #3604037

Extracted 2026-10-01 from https://git.drupalcode.org/issue/drupal-3604037.git with `git diff <merge-base> <branch tip>`: only the branch's own changes.
Not rebased onto current `main`. The MR on drupal.org is the source of truth.

| Patch | Source | Tip | Base | Base date and subject | Files |
|---|---|---|---|---|---|
| [`original-patches/3604037-grouping-elements-child-errors-default-admin.763628f8.patch`](original-patches/3604037-grouping-elements-child-errors-default-admin.763628f8.patch) (historical pinned comparison) | https://git.drupalcode.org/issue/drupal-3604037.git `3604037-grouping-elements-child-errors-default-admin` | e8b2e166be8 | c321043bb82d | 2026-09-28 task: #3557481 Convert hook_schema() implementations to SchemaDefinition - regular modules | 18 |
| [`branches/3604037-grouping-elements-child-errors-default-admin.patch`](branches/3604037-grouping-elements-child-errors-default-admin.patch) | https://git.drupalcode.org/issue/drupal-3604037.git `3604037-grouping-elements-child-errors-default-admin` | c3c52b00 | bc8a8b482ee2 | 2026-11-03 fix: #3619744 Removing an item from a multiple value field widget discards the weight order | 18 |

## Lab port addressing Comment #61

[`branches/3604037-comment61-current-main.patch`](branches/3604037-comment61-current-main.patch) is a lab-authored port of MR !17078 at `c3c52b00` onto core `29b0a0b2256e` (2026-11-17). It includes the fixes requested in mherchel's Comment #61, renders the hidden indicator in both Default Admin details templates, and passes `child_error_count` through Default Admin's `preprocess_details` hook. It omits the stale generated Umami performance snapshot and includes regression coverage for untitled details and multiple error tabs. SHA-256: `e82af47b33b4ec4b3ff8346f9984b9179c00a11a859ac63c0f745ed4de11ad02`.

[`branches/support-fixture-multiple-vertical-tab-errors.patch`](branches/support-fixture-multiple-vertical-tab-errors.patch) is test support, not code under test. It makes both fields on the vertical-tabs test form able to produce an error; the `3604037-latest` variant applies it to both Before and After. The existing `support-fixture-two-required-fields.patch` remains the other Before-side test-support change.
