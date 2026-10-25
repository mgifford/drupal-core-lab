# Draft issue: ThemeInstaller installs a theme that is incompatible with the running core

Not posted. drupal.org was unreachable from the lab, so it was not searched for an existing issue. Evidence: the steps below,
run as written ([verification.txt](verification.txt), draft 1), the `cvr-incompatible/theme` rows in
[RESULTS.md](../RESULTS.md), and the variant [theme-incompatible](../variants/theme-incompatible/COMPARE.md). Core `main` at
`89df3a065deb`, PHP 8.5.12.

---

### Problem/Motivation

`ThemeInstaller::getThemesToInstall()` does not check `core_incompatible`. `ModuleInstaller::getModulesToInstall()` does (`ModuleInstaller.php:119-121`). The Appearance page hides the Install link for such a theme (`SystemController.php:315`). `ThemeInstaller::install()` calls `getThemesToInstall()` (line 143), so its other callers skip the check too. On 12.x, `core/scripts/dr ex:install` installs the theme.

### Steps to reproduce

1. Install the Standard profile.
2. Add `themes/custom/example/example.info.yml` with `name: Example`, `type: theme`, `core_version_requirement: ^10` and `base theme: false`.
3. Run `php core/scripts/dr ex:install example -y`. It exits 0, and the theme is installed.

### Proposed resolution

In `getThemesToInstall()`, throw a `MissingDependencyException` for a theme with `core_incompatible`, as `ModuleInstaller` does. With that change, step 3 exits 1: "Unable to install theme: 'example' is incompatible with this version of Drupal core." Of 624 measured theme results, only this one changed.

### Remaining tasks

Add a kernel test.

Generated with the help of an LLM.
