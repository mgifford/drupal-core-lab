---
name: drupal-contrib-mgmt
description: Managing Drupal contributed modules via Composer, including updates, patches, version compatibility, and Drupal 11 upgrades. Use when updating modules, resolving dependency issues, applying patches, or contributing back to drupal.org.
---

# Drupal Contrib Module Management

## Core Update Workflow

```bash
# Update a single module
composer require drupal/module_name --with-all-dependencies

# Update to specific version
composer require drupal/module_name:^3.0 --with-all-dependencies

# After any update, ALWAYS run database updates and clear cache
drush updb -y && drush cr
```

For major version upgrades: check `.info.yml` for `core_version_requirement`, search the issue queue, apply patches, run `upgrade_status`.

## Checking Drupal 11 Compatibility

**Fastest method — check `.info.yml`:**

```bash
cat docroot/modules/contrib/MODULE_NAME/MODULE_NAME.info.yml | grep core_version_requirement
```

- `^9 || ^10 || ^11` = compatible
- `^9 || ^10` = not yet

**Scan all modules:**

```bash
drush upgrade_status:analyze --all
drush upgrade_status:analyze --all --format=json > d11-report.json
```

**Common D11 replacements:**

| Old | New |
|-----|-----|
| `REQUEST_TIME` | `\Drupal::time()->getRequestTime()` |
| `user_roles()` | `\Drupal\user\Entity\Role::loadMultiple()` |
| `file_validate_extensions()` | `file.validator` service |
| `_drupal_flush_css_js()` | `AssetQueryStringInterface::reset()` |

See `references/d11-common-deprecations.md` for full list.

## Drupal Lenient Plugin

Allows installing modules that haven't updated their version requirements:

```json
{
  "require": { "mglaman/composer-drupal-lenient": "^1.0" },
  "config": { "allow-plugins": { "mglaman/composer-drupal-lenient": true } },
  "extra": { "drupal-lenient": { "allowed-list": ["drupal/module_name"] } }
}
```

## Patch Management

**Use `cweagans/composer-patches` v2.x** (uses `git apply`, more reliable than v1):

```json
{
  "require": { "cweagans/composer-patches": "^2.0" },
  "extra": {
    "composer-exit-on-patch-failure": true,
    "patches": {
      "drupal/module_name": {
        "Description — Issue #NODEID": "https://www.drupal.org/files/issues/patch.patch"
      }
    }
  }
}
```

**ALWAYS search for existing patches before creating your own:**

1. Extract exact error string
2. Search: `https://www.drupal.org/project/drupal/issues?text=YOUR+ERROR`
3. Use WebFetch to get patch details from the issue
4. Apply the official patch

```bash
# Re-patch a single module
composer reinstall drupal/module_name

# If patch is missing after update
./scripts/verify-patches.sh --fix
```

See `references/drupal-patches-workflow.md` for finding, creating, and debugging patches.

## Contributing Back to drupal.org

```bash
# Clone module, add issue fork remote
git clone git@git.drupal.org:project/module_name.git
git remote add module-XXXXXXX git@git.drupal.org:issue/module_name-XXXXXXX.git
git checkout -b 'XXXXXXX-description' --track module-XXXXXXX/'XXXXXXX-description'

# Commit with standard format
git commit -m "Issue #XXXXXXX: Short description"
git push module-XXXXXXX XXXXXXX-description
```

Commit message format: `Issue #XXXXXXX: Short description (50 chars max)`

Issue description must use HTML sections: `<h3>`, `<p>`, `<ul>/<ol>`, `<code>`.

See `references/drupal-patches-workflow.md` for complete issue fork workflow.

## Local Development (Symlink Workflow)

```bash
# Remove composer install, symlink dev copy
rm -rf docroot/modules/contrib/module_name
ln -s /tmp/module_name docroot/modules/contrib/module_name

# After contrib work, clean up
rm docroot/modules/contrib/module_name
composer install
```

## Production Deployment

```bash
composer install --no-dev -o
```

Always use `--no-dev` (excludes testing tools) and `-o` (optimizes autoloader).

## Update Checklist

- [ ] Check current version: `composer show drupal/module_name`
- [ ] Search issue queue for known issues
- [ ] Check D11 compatibility via `.info.yml`
- [ ] Apply required patches
- [ ] `composer require drupal/module_name:^X.0 --with-all-dependencies`
- [ ] `drush updb -y && drush cr`
- [ ] `drush upgrade_status:analyze module_name`
- [ ] Test functionality, check logs
- [ ] Commit with descriptive message

## Troubleshooting

| Error | Fix |
|-------|-----|
| `Cannot apply patch` | Module version changed; find updated patch at drupal.org/node/NODEID |
| `requires drupal/core ^9` | Add to drupal-lenient allowed-list |
| `patch already applied` | Maintainer merged it; remove from composer.json |
| DB update fails | `drush pm:uninstall module && composer require && drush pm:enable && drush updb` |

## References

- `references/drupal-patches-workflow.md` — Complete patch finding, creating, and debugging guide
- `references/d11-common-deprecations.md` — Full D11 deprecation list with replacements
- `references/issue-queue-rss-feeds.md` — Monitoring issue queues
- [Composer Patches](https://github.com/cweagans/composer-patches)
- [Drupal Lenient](https://github.com/mglaman/composer-drupal-lenient)
- [Upgrade Status Module](https://www.drupal.org/project/upgrade_status)
- [Creating Issue Forks](https://www.drupal.org/docs/develop/git/using-gitlab-to-contribute-to-drupal/creating-issue-forks)
