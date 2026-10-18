# Prepare the main-targeted branch

The bundle does not retarget or push the published MR. Use a clean Drupal checkout with current main available. Replace the bundle path below with your extracted folder. These commands create a local branch and apply the full main port, including tests.

```sh
git fetch https://git.drupalcode.org/project/drupal.git dbfce851242d5b082adb8ed14634b4bc9cce374b
git switch -c 3630425-actions-header-main dbfce851242d5b082adb8ed14634b4bc9cce374b
git apply --check /absolute/path/to/bundle/reports/issues/3630425/branches/3630425-main-mr17421.patch
git apply /absolute/path/to/bundle/reports/issues/3630425/branches/3630425-main-mr17421.patch
```

Alternatively, after applying the original MR to this same main commit, apply only 3630425-main-interdiff.patch. Do not apply both the full patch and its interdiff.

Run the class's new testActionsColumnHeader data sets against both pristine main and the fixed tree, and run core's code checks. In the Lab, use scripts/lint.mjs 3630425-pinned and the live evaluator. Keep test claims provisional until they run.

Have the issue-fork owner rebase/retarget !17421 to main, or open a separate main-targeted MR if required by project policy, cross-linking !17421 and crediting chamilsanjeewa. Posting, committing and pushing are intentionally left to the contributor with access. Include the AI-assisted test contribution disclosure.
