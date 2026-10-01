# Config Management Troubleshooting

## Config files deleted from working directory

If files are marked as deleted in `git status`:
```bash
git checkout HEAD -- config/default/*.yml
```

This can happen if a drush command runs unexpectedly.

## Split not activating

Check split status:
```bash
ddev drush config-split:status
```

Manually activate:
```bash
ddev drush config-split:activate {split-name}
ddev drush cex  # Export to save activation state
```

## Config deleted from config/default on export

**COMMON ISSUE**: Config (like `search_api.server.main`) gets removed from `config/default/` when you run `drush cex`.

**Root cause (99% of cases)**: Config is in `complete_list` instead of `partial_list`!

**Complete split** = Config is REMOVED from `config/default/` and moved to split directory entirely
**Partial split** = Config STAYS in `config/default/`, only differences are patched

**Diagnosis**:
```bash
# Check if config is in complete_list (will be deleted from config/default)
grep -A10 "complete_list:" config/default/config_split.config_split.local.yml

# Check if config is in partial_list (will stay in config/default)
grep -A10 "partial_list:" config/default/config_split.config_split.local.yml
```

**Solution**: Move from `complete_list` to `partial_list`

```bash
# Edit the split definition
# Move: search_api.server.main
# FROM: complete_list
# TO: partial_list

ddev drush cex  # Re-export
# Check that config/default/search_api.server.main.yml exists
# Check that config/local/config_split.patch.search_api.server.main.yml exists
```

See [config-split-deep-dive.md](config-split-deep-dive.md) for complete technical explanation.

## Config won't import

Common issues:
- **Dependencies missing**: Install required modules first
- **UUID mismatch**: Use `--partial` flag
- **Locked config**: Some config (like system.site) has immutable values

```bash
# Skip specific config during import
ddev drush config:import --skip-config=system.site
```
