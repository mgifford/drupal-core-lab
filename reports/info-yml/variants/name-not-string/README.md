# Variant: the Extend page survives an info file whose name is not a string

The fix proposed in [issue draft 5](../../issue-drafts/5-info-name-not-string.md), which has no drupal.org issue yet.
[tests/info-yml/patches/info-name-not-string.patch](../../../../tests/info-yml/patches/info-name-not-string.patch) changes
`ExtensionList::createExtensionInfo()`: when an extension's `name` is a list, a mapping or NULL, it uses the machine name and
raises a warning that names the file. Numbers are left as they are. With a unit test, `ExtensionListTest::testNameNotString()`.
Core `main` at `89df3a065deb`. **DRAFT until a person has reviewed it.**

Why there and not in `ExtensionList::sortByName()`, where the TypeError is thrown: about a dozen places print `name` (for
example `ModulesListForm`), so a fix in the sort alone moves the failure to the next one. Why not an exception when the file is
parsed: Phase 1 showed that a file the info parser rejects stops cache rebuilds for the whole site, installed or not.

## Test it in the lab viewer (DDEV)

The variant `info-yml-name-not-string` in [tools/compare/variants.json](../../../../tools/compare/variants.json). The recipe
[recipes/info_yml_name_not_string](../../../../recipes/info_yml_name_not_string/) writes the test module `example`, with
`name: [Example, module]`, uninstalled, into both sites. From the lab folder:

    node tools/compare/setup.mjs info-yml-name-not-string
    node scripts/lab-env.mjs start info-yml-name-not-string

Then open the viewer. On `/admin/modules`, Before shows "The website encountered an unexpected error. Try again later." and
After shows the Extend page with the module listed as `example`. On `/admin/reports/dblog`, Before has the TypeError and After
has the warning. **Run checks** tests two things in each frame: the module list form is on the page, and the module is listed as
`example` (both false on Before, true on After).

What was verified without DDEV (the lab container has none): `setup.mjs --check-patches` and `--checkout-only`; the recipe
with its `apply.sh` on a Standard site of the same core, then `/admin/modules` as the administrator: 500 Before (the
`strcasecmp()` TypeError at `ExtensionList.php` line 627), 200 After with the module labelled `example`
([verification.txt](../../issue-drafts/verification.txt), draft 5); and the checks' probes on both saved pages. The first full
`setup.mjs` run with DDEV has not happened yet.

## Measured with the info.yml runner

All 49 cases, module, theme and profile placements, Symfony YAML: 4468 results measured on both cores
([COMPARE.md](COMPARE.md)). 33 differ, all in the `name-not-string` rows:

- 11 are now the same as with a valid file: `/admin/modules` and `/admin/appearance` no longer return 500, and installing from
  the UI no longer fails.
- 22 now differ from a valid file because the warning is logged (cache rebuilds, command-line installs, and the pages after
  them). Every new log line is the warning; there is no other new error.

No other case changed. The patch, its hash and base commit are in [variant.json](variant.json); the results in
[RESULTS.md](RESULTS.md).
