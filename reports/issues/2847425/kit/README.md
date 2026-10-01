# Managed file `#states` test kit — Drupal core issue #2847425

A self-diagnosing reproduction form, a recipe, and before/after tooling
(screen-reader capture + screenshots) for testing and reviewing
[#2847425 — *#states not affecting visibility/requirement of managed_file*](https://www.drupal.org/project/drupal/issues/2847425)
and [MR !7305](https://git.drupalcode.org/project/drupal/-/merge_requests/7305).

> This is **Drupal core** review material. Drop the module into a Drupal
> checkout to use it.

## What's in the box

```text
file_managed_states_test/     The module: a form at /file-managed-states-test
  …/js/diagnostics.js         Auto-detects whether the fix is applied + PASS/FAIL per scenario
  …/css/diagnostics.css       Accessible status styling (text badge first, not colour-only)
recipes/managed_file_states_test/   Optional recipe that installs the module
tests/guidepup/               VoiceOver/NVDA screen-reader capture, before vs after
tools/screenshots/            Playwright before/after screenshot capture
```

## 1. Install the module

Unzip into your Drupal checkout under `modules/custom/`, then enable it:

```bash
ddev drush en file_managed_states_test -y && ddev drush cr
```

Or apply the recipe (copy `recipes/managed_file_states_test/` into your
site's `recipes/` dir first):

```bash
ddev exec php core/scripts/dr recipe recipes/managed_file_states_test && ddev drush cr
```

Then open <https://drupal-core.ddev.site/file-managed-states-test>.

The module declares `core_version_requirement: ^11.4 || ^12` and installs like
any normal module — no `extension_discovery_scan_tests` setting required. (If you
prefer it under `core/modules/file/tests/modules/`, alongside the MR's
`file_test_states`, change the `.info.yml` to `version: VERSION` + drop
`core_version_requirement`, and set `$settings['extension_discovery_scan_tests'] = TRUE;`.)

## 2. Read the verdict

The **Patch diagnostics** panel at the top of the form runs automatically. It
drives each trigger the way a user would, watches what `core/drupal.states`
does, and reports one of:

- **APPLIED and complete** — every check passes, including the fieldset case;
- **APPLIED for element-level cases, fieldset gap remains** — this is the
  expected result on the current MR !7305: the element-level cases (Scenarios
  1, 2, 4) pass, but the Scenario 3 fieldset-nesting case (#74/#75) still fails
  because hiding a managed_file inside a details/fieldset collapses the whole
  wrapper. That FAIL is the accessibility gap to raise on the issue;
- **NOT applied** — the bug is present (hidden managed_files show on load, no
  required marker).

The Scenario 3 fieldset check is scored separately, so its expected FAIL does
not drag the "applied?" verdict down. Note the layout: Scenarios 1, 2 and 4 are
flat (headings, no fieldset) so each file toggles on its own — a fieldset
wrapper would collapse the whole group, which is precisely the Scenario 3
demonstration.

The summary is a polite ARIA live region and every result is prefixed with the
word PASS/FAIL, so the verdict is not conveyed by colour alone.

## 3. Test before vs after

Your plain `main` checkout is the **before** state. To get **after**, apply the
MR in your Drupal checkout and reload:

```bash
# Option A — check out the MR branch (your custom module survives the switch):
git remote add mr2847425 https://git.drupalcode.org/issue/drupal-2847425.git
git fetch mr2847425 && git checkout 2847425-11.x && ddev drush cr
# back to before:  git checkout main && ddev drush cr

# Option B — apply/revert the diff without switching branches:
curl -L https://git.drupalcode.org/project/drupal/-/merge_requests/7305.diff -o /tmp/mr7305.diff
git apply /tmp/mr7305.diff && ddev drush cr        # after
git apply -R /tmp/mr7305.diff && ddev drush cr     # before
```

(Confirm the branch name with `git ls-remote mr2847425` if it has moved.)

## 4. Capture the accessibility evidence (Guidepup)

`tests/guidepup/` drives a real screen reader over the form and records what it
announces, so you can show the difference is a **WCAG 3.3.1** matter, not just a
visual one. See `tests/guidepup/README.md`. In short:

```bash
cd tests/guidepup && npm install && npx @guidepup/setup
SR_LABEL=before npm run test:before     # on plain core
SR_LABEL=after  npm run test:after      # with MR applied
npm run diff
```

It reports whether a hidden managed_file is wrongly announced on load, whether
"required" is announced after the trigger is set, and — the key accessibility
check — whether the Scenario 3 fieldset text stays announced after toggling.

## 5. Screenshots

`tools/screenshots/capture.mjs` grabs before/after images from your running
site (they can't be pre-baked). See that folder's README.

## Code-review notes for MR !7305

- `core/modules/file/src/Element/ManagedFile.php` (`processManagedFile()`) —
  attaches `data-drupal-states` to the AJAX wrapper; copies `#states` onto
  `$element['upload']` (no file yet → Scenarios 1–3) or `$element['fids']` with
  the label `for=""` repointed (file present → Scenario 4).
- `core/modules/file/src/Hook/FileThemeHooks.php` (`preprocessManagedFile()`) —
  `$variables['attributes'] ??= [];` instead of `= []`.
- Tests — `file_test_states` + `FileManagedStateTest` (JS) + `FormTest` count
  44 → 45. **The fieldset case (Scenario 3) has no automated coverage** — worth
  raising on the MR whether it should.

Not review blockers: `#states` `required` is cosmetic (no server validation —
"works as designed", #65/#88; follow-up #3513308), and the MR's rebase merge
churn is just long-branch maintenance.
