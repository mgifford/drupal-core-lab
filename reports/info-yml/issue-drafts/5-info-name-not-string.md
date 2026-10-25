# Draft issue: An info file whose name is not a string makes the Extend page fail

Not posted. drupal.org was unreachable from the lab, so it was not searched for an existing issue. Evidence: the steps below,
run as written ([verification.txt](verification.txt), draft 5), and the `name-not-string` rows in [RESULTS.md](../RESULTS.md),
which record the TypeError. Core `main` at `89df3a065deb`, PHP 8.5.12. The proposed fix, with a unit test, is the variant
[name-not-string](../variants/name-not-string/README.md): of 4468 lab results, only this case's rows change.

---

### Problem/Motivation

`InfoParserDynamic` checks that `name` exists (lines 66-69, 139-141). It does not check that it is a string. `ExtensionList::sortByName()` passes it to `strcasecmp()` (`ExtensionList.php:626-628`). With a list, `/admin/modules` returns 500 with a TypeError, installed or not. `core/scripts/dr ex:install` installs such a module. It prints "Array (example)" and logs "Array to string conversion".

### Steps to reproduce

1. Install the Standard profile.
2. Add `modules/custom/example/example.info.yml` with `name: [Example, module]`, `type: module` and `core_version_requirement: ^12`.
3. Visit `/admin/modules` as an administrator. It returns 500.
4. Run `php core/scripts/dr ex:install example -y`. It exits 0 and prints "Array (example)".

### Proposed resolution

In `ExtensionList::createExtensionInfo()`, use the machine name when `name` is not a scalar, and raise a warning that names the file. About a dozen places print `name`, so a fix in `sortByName()` alone moves the failure. A parse-time exception would stop extension discovery for the whole site. With this change, step 3 returns 200 and lists the module as "example".

Generated with the help of an LLM.
