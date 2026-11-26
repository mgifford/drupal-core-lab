# Branches and patches

## Branch

- Local branch: `3603162-svg-revision`
- Previous local branch: `3603162-complete` (preserved at the same commit)
- Tip: `0d00037ed57a46cb6d2d2b14af7db065b12ccc24`
- Parent history: the 11 original MR commits, rebased onto upstream `main` at `0387fb948f786bc344a5cc54aa0d98b8f552e378`.
- Issue fork branch: [https://git.drupalcode.org/issue/drupal-3603162/-/tree/3603162-svg-revision](https://git.drupalcode.org/issue/drupal-3603162/-/tree/3603162-svg-revision) at the same tip.
- Merge request: not created yet.
- Worktree: `~/svg-review-lab/work/mr16166`
- Shared object store: `~/svg-review-lab/drupal.git`

The original MR branch and issue fork were not modified.

## Patches

| File | Base | SHA-256 |
|---|---|---|
| `3603162-complete-svg-consolidation.patch` | upstream `main` `0387fb94` | `53bfcb5a9c570541713fd6074dbb8151d834f97240a84150699f712ba58061e4` |
| `3603162-mr16166-comprehensive-interdiff.patch` | MR head `fe4adb4f` | `3c3b5318cd43dcbab26d7b1b9eb067b9332154185f4fcdd134821efc58869807` |

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

No push, MR update or drupal.org comment was made.
