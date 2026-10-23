# Sources for the info.yml investigation

drupal.org, git.drupalcode.org and api.drupal.org were not reachable from the lab container on 2026-10-22 (refused by the
environment's network policy). Issue facts below come from two places, and each row says which:

- **Pasted**: the issue page as pasted into the session by the owner (Mike Gifford) on 2026-10-22. Only the facts used in this
  investigation are kept here, not the full thread.
- **Core git**: commit messages in the GitHub read-only mirror of Drupal core (https://github.com/drupal/drupal, branch `main`,
  commits since 2019-01-01), which mirrors https://git.drupalcode.org/project/drupal.

Source files were read at these branch tips of the same mirror (all committed 2026-10-21): 10.6.x `9d3b07a` (10.6.21-dev),
11.4.x `32e03f0` (11.4.12-dev), main `89df3a0` (12.0-dev). Branches 9.5.x, 10.0.x, 10.1.x, 11.0.x to 11.3.x, 11.5.x, 12.0.x and 11.x
were compared file by file through raw.githubusercontent.com.

## Issues

| Issue | Status | Source | Facts used |
|---|---|---|---|
| [#3190825](https://www.drupal.org/project/libraries/issues/3190825) (Libraries) | not read | none | The Update Manager path it describes exists only on 10.x (see below). |
| [#1606606](https://www.drupal.org/project/drupalorg/issues/1606606) (drupalorg) | not read | none | Packager behaviour not verified. |
| [#2429221](https://www.drupal.org/project/drupal/issues/2429221) | not read | Core git: no commit | Owner reports: closed (won't fix), 9 Dec 2024. |
| [#2558645](https://www.drupal.org/project/drupal/issues/2558645) | not read | Pasted (title only, from #2730807 comment 22) | Title: "Malformed module.info.yml prevents install with a confusing error". |
| [#2057259](https://www.drupal.org/project/drupal/issues/2057259) | not read | Core git: no commit | |
| [#3078001](https://www.drupal.org/project/drupal/issues/3078001) | fixed | Core git `1f820f8c`, `190f0270` (2019-09-03) | "Don't catch exception for invalid 'core_version_requirement' in info.yml files". |
| [#2730807](https://www.drupal.org/project/drupal/issues/2730807) | Closed (fixed) | Pasted; core git `b1d57de4` (11.x), `d7e7f3ac` (10.1.x) | WSOD on /admin/modules when `description:` is NULL. Fix: NULL values fall back to the extension type's defaults (comments 23, 45, 48), not a required key. Related: #2594937 (empty `libraries:` in a theme), #3213079 (empty theme description). |
| [#3451701](https://www.drupal.org/project/drupal/issues/3451701) | Closed (fixed), Critical | Pasted; core git `d3b2a6a5` (11.x), backported to 10.2.x | Invalid `core_version_requirement` in the release-history feed crashed Update; fix catches the `Semver::satisfies()` exception in `ProjectCoreCompatibility::isCoreCompatible()`. Reported privately, made public by the Security Team. |
| [#3123537](https://www.drupal.org/project/drupal/issues/3123537) | Closed (fixed), Major | Pasted; core git `1b4c423` (9.1.x), `39a083c` (9.0.x) | A missing `core_version_requirement` broke every page after a cache clear, installed or not (comments 12, 13, 24); `drush cr` failed. Fix relaxed the exception when `core: 8.x` was present and added warnings on /admin/modules and /admin/appearance. xjm (comment 15): developers need the specific exception; site owners should not have the site fail for an uninstalled module; installed incompatible modules should still fail hard. Not backported to 8.9.x (comment 46). |
| [#3616275](https://www.drupal.org/project/drupal/issues/3616275) | Closed (fixed) | Pasted; core git `55c151b4` (main), `41436279` (11.x) | Info files are parsed with PECL YAML when the extension is loaded, for speed; info files cannot use the persistent YAML cache because the installer and container builds need them. Partly reverses #3205480 (PECL YAML dropped for consistency). |
| [#3490347](https://www.drupal.org/project/drupal/issues/3490347) | Closed (fixed), Performance | Pasted; core git `cdf43f51` (11.x, 2025-01-23) | ExtensionDiscovery uses InfoParser (from 11.2.x) to share its FileCache instead of a regex read. alexpott in an MR thread: "We never read these fake .info.yml files with InfoParser till this change." The pasted thread does not discuss the error-handling consequence for malformed uninstalled extensions. nicxvan (comment 8): the regex scan saw more files than InfoParser (themes inside uninstalled profiles). Follow-ups: #3493423 (deprecate `$use_info_parser`), #3490493 (test profiles in a tests directory). |
