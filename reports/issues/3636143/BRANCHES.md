# Branch patches for #3636143

Extracted 2026-11-19 from https://git.drupalcode.org/issue/drupal-3636143.git with `git diff <merge-base> <branch tip>`: only the branch's own changes.
Not rebased onto current `main`. The MR on drupal.org is the source of truth.

| Patch | Source | Tip | Base | Base date and subject | Files |
|---|---|---|---|---|---|
| [`branches/3636143-regression-the-toggle.patch`](branches/3636143-regression-the-toggle.patch) | https://git.drupalcode.org/issue/drupal-3636143.git `3636143-regression-the-toggle` | 5e5521e4 | fea1e49ac3e5 | 2026-11-09 docs: #3422895 (follow-up) Document when ConfigurableLanguageManagerInterface::getLanguageConfigOverride() and LanguageConfigFactoryOverrideInterface::getOverride() return an empty object | 2 |

## Separate integration with the skip-link proposal

Registered as `3636143-with-skip-focus`, fixed to core `92e5c3a30476e248e82679cb63fa44c51bc667d0`.
Plain Standard installs; no recipe. Both patch stacks applied cleanly to that core on 2026-11-19.

| Side | Environment | Patches, in order |
|---|---|---|
| Before | `issue-3636143-latest` | Toggle-border MR only |
| After | `issue-3636143-with-skip-focus` | Toggle-border MR, then the separate complete skip-link proposal |

| Artifact | SHA-256 |
|---|---|
| [Toggle-border MR](branches/3636143-regression-the-toggle.patch) | `08a86e98945acd6afd7039d7674ad5069133d7cf721b2961947cae6aebd32d4f` |
| [Complete skip-link proposal](../3637339/branches/3637339-focus-clearance-full.patch) | `a5310458f845c4660dd1d4f6cee34c86904d17dc96e6bc2c2673271f10c0486d` |

No artifact bytes changed. The skip-link proposal retains its original source base and attribution in
[3637339/BRANCHES.md](../3637339/BRANCHES.md); clean applicability to this newer core is verified separately.
This stack is not a new patch revision of MR !17738. Do not add the skip-link interdiff on top of its complete patch.
The existing [MR-tip interdiff](../3637339/branches/3637339-focus-clearance.patch) is for MR !17818, not the navigation MR.
| [`branches/3636143-toggle-hover-focus.patch`](branches/3636143-toggle-hover-focus.patch) | authored in the lab (no merge request), captured from `issue-3636143-latest` on 2026-11-19 with `scripts/capture-patch.mjs`; sha256 be3e8db3 | - | 92e5c3a30476 | - | 2 |
