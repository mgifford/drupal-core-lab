# Draft issue: Installing a theme whose regions is not a mapping leaves it installed, and cache rebuilds fail

Not posted. drupal.org was unreachable from the lab, so it was not searched for an existing issue. Evidence: the steps below,
run as written ([verification.txt](verification.txt), draft 2), and the `dependencies-string/theme` and
`spacing-list-no-space/theme` rows in [RESULTS.md](../RESULTS.md). Core `main` at `89df3a065deb`, PHP 8.5.12.

---

### Problem/Motivation

Core does not check that a theme's `regions` is a mapping. `ThemeInstaller::install()` saves the theme in `core.extension` (lines 181-183). Then it invokes `hook_themes_installed` (line 207). Block's implementation reaches `Theme::listAllRegions()` through `listVisibleRegions()`. It passes `regions` to `array_map()` (`Theme.php:48-53`). A string makes it throw a TypeError. The theme stays installed, and the next cache rebuild fails too. The Appearance page does not offer such a theme: it requires a `content` region (`SystemController.php:277`). `core/scripts/dr ex:install` installs it.

### Steps to reproduce

1. Install the Standard profile.
2. Add `themes/custom/example/example.info.yml` with `name: Example`, `type: theme`, `core_version_requirement: ^12`, `base theme: false` and `regions: Header`.
3. Run `php core/scripts/dr ex:install example -y`. It exits 255 with "array_map(): Argument #2 ($array) must be of type array". The theme is recorded as installed.
4. Run `php core/scripts/dr cache:rebuild`. It exits 255.

### Proposed resolution

In `ThemeInstaller::getThemesToInstall()`, refuse a theme without a `content` region, as the Appearance page does. A parse-time exception would stop extension discovery for the whole site.

Generated with the help of an LLM.
