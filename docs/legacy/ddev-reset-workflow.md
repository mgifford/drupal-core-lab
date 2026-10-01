# DDEV Reset Workflow for Drupal Core

## Full Reset (Recommended)

Use this when you need a completely fresh Drupal environment while keeping your codebase:

```bash
# 1. Remove project data (database, containers) but keep code
ddev delete --omit-snapshot --yes

# 2. Start fresh project
ddev start

# 3. Install dependencies and Drupal
ddev composer install
ddev drush si standard --account-name=admin --account-pass=admin --site-name="Drupal Core"
```

## Alternative: Just Rebuild

Use this if containers are running but something is messed up:

```bash
# Rebuild all services and restart
ddev utility rebuild -a

# Or restart only the web service
ddev utility rebuild -s web
```

## Database-Only Reset

If you want to keep existing configuration but reset the database:

```bash
# Truncate all caches and session data
ddev exec -- bash -c "
  drush cr
  drush sql-query \"TRUNCATE {cache}; TRUNCATE {history}; TRUNCATE {search_index}; TRUNCATE {locale}; TRUNCATE {filter_form}; TRUNCATE {menu_link}; TRUNCATE {node_revision};\"
"
```

## Common ddev Commands Reference

| Command | Description |
|---------|-------------|
| `ddev start` | Start the project |
| `ddev stop` | Stop containers (preserves data) |
| `ddev delete` | Remove project data |
| `ddev utility rebuild -a` | Rebuild all Docker services |
| `dexec` (or `ddev exec`) | Run command in web container |
| `drs` (or `drush`) | Run Drush commands |
| `ddev composer` | Run Composer commands |

## Workflow After Reset

After running `ddev delete --omit-snapshot --yes` + `ddev start`:

1. Run `ddev composer install` to install dependencies
2. Run `ddev drush si standard` to install Drupal
3. Configure your site settings
4. Re-enable any custom modules/themes
5. Run `ddev drush cache:rebuild` to clear caches