# Branch patches for #2574721

Issue: [#2574721](https://www.drupal.org/project/drupal/issues/2574721)

Merge request: [!17049](https://git.drupalcode.org/project/drupal/-/merge_requests/17049)

Issue fork: https://git.drupalcode.org/issue/drupal-2574721.git

Last reviewed: 2026-11-25.

## Historical patch artifacts

The original MR patch was extracted on October 20, 2026, using `git diff <merge-base> <branch-tip>`.

The Lab proposal and its variants were prepared on November 23, 2026.

| Patch | Source | Tip or starting revision | Core base | Files |
|---|---|---|---|---:|
| [drupal-2574721.patch](branches/drupal-2574721.patch) | Original MR branch | `ed3917f4` | `9e8373659f26` | 3 |
| [2574721-2574721-lab-proposal.patch](branches/2574721-2574721-lab-proposal.patch) | Lab interdiff | `ed3917f4` | `9e8373659f26` | 10 |
| [2574721-full-proposal-9e837365.patch](branches/2574721-full-proposal-9e837365.patch) | Full replacement proposal | Pristine core | `9e8373659f26` | 10 |
| [2574721-current-main-proposal.patch](branches/2574721-current-main-proposal.patch) | Tested current-main proposal | Pristine core | `97c6ff8b253` | 7 |

## Artifact integrity

| Patch | SHA-256 prefix |
|---|---|
| Original MR patch | `bc22c415` |
| Lab interdiff | `c6646ab6` |
| Full replacement proposal | `6362593d` |
| Current-main proposal | `e2ce2f3b` |

These historical artifacts must be retained unchanged to preserve reproducibility.

## November 25 integration

The existing MR branch was updated locally using the Lab interdiff and subsequently merged with core main.

| Property | Value |
|---|---|
| Upstream source branch | `drupal-2574721` |
| Local integration branch | `review/2574721-improvements` |
| Original MR revision | `ed3917f4b36` |
| Merge commit | `23d1fa878c4` |
| Latest demonstrated local revision | `e7a89e764ce` |
| Initial commits behind main | 299 |
| Commits behind main after merge | 0 |
| Files changed | 7 |
| Insertions | 42 |
| Deletions | 14 |
| Git whitespace check | PASS |
| Reverse patch compatibility | PASS, all seven files |

Three obsolete Claro files were removed from the resulting diff by accepting upstream deletions during the merge.

A missing closing div in the system modules Twig template was restored in commit `e7a89e764ce`.

The resulting seven-file implementation passed reverse application checks against the previously tested current-main proposal.

## Current implementation scope

| File | Purpose |
|---|---|
| `core/modules/system/css/system.admin.css` | Operations column styling |
| `core/modules/system/src/Form/ModulesListForm.php` | Native dropbutton render element |
| `core/modules/system/templates/system-modules-details.html.twig` | Dedicated operations column |
| `core/modules/system/tests/src/Functional/Form/ModulesListFormWebTest.php` | Functional regression coverage |
| `core/themes/default_admin/css/components/system-admin--modules.css` | Generated CSS |
| `core/themes/default_admin/css/components/system-admin--modules.pcss.css` | Source CSS |
| `core/themes/default_admin/templates/admin/system-modules-details.html.twig` | Default Admin operations column |

## Upstream source of truth

The historical Lab artifacts describe specific, reproducible revisions. They should not be treated as continuously updated copies of the upstream MR.

- [Current merge request](https://git.drupalcode.org/project/drupal/-/merge_requests/17049)
- [Current MR diff](https://git.drupalcode.org/project/drupal/-/merge_requests/17049.diff)
- [GitLab CI pipelines](https://git.drupalcode.org/project/drupal/-/merge_requests/17049/pipelines)
- [Drupal.org issue discussion](https://www.drupal.org/project/drupal/issues/2574721)

The latest demonstrated local commit is recorded above. Its publication to the upstream MR and the corresponding CI results require independent verification.

## Reproduction guidance

Use `2574721-current-main-proposal.patch` against its pinned core revision to reproduce the November 23 evaluation.

Use the current upstream MR diff to evaluate the latest proposed contribution.

Do not apply the full replacement proposal and interdiff together.

Do not apply historical patches against arbitrary newer core revisions without first checking compatibility.

See [SUMMARY.md](SUMMARY.md), [EVIDENCE.md](EVIDENCE.md) and [REPRODUCE.md](REPRODUCE.md) for evaluation details.
