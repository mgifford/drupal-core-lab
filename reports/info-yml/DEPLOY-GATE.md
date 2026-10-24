# Phase 3: deploy-gate examples, tested

Generated 2026-10-24T01:28:30.741Z by `node scripts/info-yml-repro.mjs deploy-gate`, with the patched core at `envs/info-yml-patch`. Machine-readable: [deploy-gate.json](deploy-gate.json). **DRAFT until a person has reviewed it.**

The examples are [tests/info-yml/deploy-gate/extension-files.yml](../../tests/info-yml/deploy-gate/extension-files.yml) (GitHub Actions) and [composer-scripts.json](../../tests/info-yml/deploy-gate/composer-scripts.json) (Composer scripts). They ran in a scratch site with the Composer project layout: git and composer.json at the top, the Drupal root in `web/`, custom code committed, contributed code git-ignored. The workflow's two `ex:validate` steps ran as written, with `BASE=main`; its checkout, setup-php and composer install steps did not run, and nothing ran on GitHub. This lab runs as root, so Composer ran with `COMPOSER_ALLOW_SUPERUSER=1`; without it, Composer refuses to run scripts as root non-interactively.

| site state | command | expected exit | exit | files reported | result |
|---|---|---|---|---|---|
| clean site | `php web/core/scripts/dr ex:validate` | 0 | 0 | none | pass |
| clean site | `php web/core/scripts/dr ex:validate --changed="origin/$BASE"` | 0 | 0 | none | pass |
| clean site | `composer lint:extensions` | 0 | 0 | none | pass |
| a branch adds a broken custom module and breaks a committed .module file | `php web/core/scripts/dr ex:validate --changed="origin/$BASE"` | 1 | 1 | `modules/custom/site_broken/site_broken.info.yml`, `modules/custom/site_custom/site_custom.module` | pass |
| same | `php web/core/scripts/dr ex:validate` | 1 | 1 | `modules/custom/site_broken/site_broken.info.yml`, `modules/custom/site_custom/site_custom.module` | pass |
| same | `composer lint:extensions` | 1 | 1 | `modules/custom/site_broken/site_broken.info.yml`, `modules/custom/site_custom/site_custom.module` | pass |
| same | `composer run-script post-install-cmd` | 1 | 1 | `modules/custom/site_broken/site_broken.info.yml`, `modules/custom/site_custom/site_custom.module` | pass |
| same | `composer install --no-progress` | 1 | 1 | `modules/custom/site_broken/site_broken.info.yml`, `modules/custom/site_custom/site_custom.module` | pass |
| custom code restored; a contributed module (git-ignored) loses its type line, as from a broken release | `php web/core/scripts/dr ex:validate` | 1 | 1 | `modules/contrib/site_contrib/site_contrib.info.yml` | pass |
| same | `php web/core/scripts/dr ex:validate --changed="origin/$BASE"` | 0 | 0 | none | pass (expected: git does not track contributed code, so --changed cannot see it) |

What the rows show:

- `--changed` reported a new, untracked module and a changed committed file. Git's top is above the Drupal root here, which is the layout the `--changed` fix in the patch covers.
- With the `post-install-cmd` hook, `composer install` itself exits 1 when an extension file has an error, which stops a deployment script that checks exit codes. It does not undo the install: the files are already on disk. (The scratch site requires no packages and commits its composer.lock, so this install downloaded nothing and fired `post-install-cmd`.)
- Only the full check sees a broken contributed release. Use it before every deployment; `--changed` is a fast check for pull requests.

