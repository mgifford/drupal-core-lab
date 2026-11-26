# Branches and patches

## Branch

- Local branch: `3603162-svg-revision`
- Previous local branch: `3603162-complete` (preserved at `0d00037e`, the previous revision)
- Tip: `d4728a2aa3fc34e45e428d78ac111bd0c5e228ad`
- Parent history: the 11 original MR commits, rebased onto upstream `main` at `0387fb948f786bc344a5cc54aa0d98b8f552e378`.
- Issue fork branch: [https://git.drupalcode.org/issue/drupal-3603162/-/tree/3603162-svg-revision](https://git.drupalcode.org/issue/drupal-3603162/-/tree/3603162-svg-revision) at the same tip.
- Merge request: [MR !17967](https://git.drupalcode.org/project/drupal/-/merge_requests/17967).
- Worktree: `~/svg-review-lab/work/mr16166`
- Shared object store: `~/svg-review-lab/drupal.git`

The original MR branch and issue fork were not modified.

## Patches

| File | Base | SHA-256 |
|---|---|---|
| `3603162-complete-svg-consolidation.patch` | upstream `main` `0387fb94` | `71f3eb100e1467e1f56d93ff08ebc5fa9eca668c77ab4d95749293c139d596b7` |
| `3603162-mr16166-comprehensive-interdiff.patch` | MR head `fe4adb4f` | `c07d72e2e2bb64b2c989efc5dfd47f257bd858077f8887e8bdbc099ec4c796d7` |

Apply:

```sh
git checkout -b 3603162-review 0387fb948f786bc344a5cc54aa0d98b8f552e378
git apply --check 3603162-complete-svg-consolidation.patch
git apply 3603162-complete-svg-consolidation.patch
```

For the interdiff:

```sh
git checkout --detach fe4adb4f942385912bb3244b570afa475cadf3bd
git apply --check 3603162-mr16166-comprehensive-interdiff.patch
git apply 3603162-mr16166-comprehensive-interdiff.patch
```

The interdiff is scoped to `core/themes/default_admin` and excludes `js/tableselect.js`, whose only difference is upstream drift between the MR base and current `main`.

## Verification performed

- Both patches passed `git apply --check`.
- The complete patch reproduced the branch theme exactly (`diff -rq` empty).
- The interdiff reproduced the branch theme except the excluded upstream `tableselect.js` change.

## Publish commands (not run)

```sh
# Push the issue fork branch. Review the remote and refspec first.
git push git@git.drupal.org:issue/drupal-3603162.git 3603162-svg-revision:3603162-svg-revision

# Then open or update the MR in the GitLab UI.
```

MR !17967 was created. No Drupal.org issue comment was posted.
