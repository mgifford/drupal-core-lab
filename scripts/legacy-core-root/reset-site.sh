#!/usr/bin/env bash
# reset-site.sh — Reset the local Drupal dev site to a clean, reproducible baseline.
#
# Goal: give a fast, repeatable "start the next patch from a clean slate" step that
# preserves the project (Composer / Drush / recipes / theme code) and never touches
# your working tree (patches). It resets the SITE (database = config + content) only.
#
# Default behavior (no args):
#   Restore the saved ddev database snapshot (complete reset). If no snapshot exists,
#   rebuild the baseline from scratch via `drush site:install standard` + the issue
#   recipe, then save a snapshot for next time.
#
# Usage:
#   ddev reset-site            # restore baseline snapshot (rebuild if missing)
#   ddev reset-site --capture  # rebuild baseline now and (re)save the snapshot
#   ddev reset-site --recipe   # force rebuild from the recipe, ignoring the snapshot
#   ddev reset-site --help     # this help
#
# After reset, log in with: ddev drush uli
#
# Notes:
#   - Code (git working tree / patches) is NEVER modified, stashed, or deleted.
#   - The portable baseline is the recipe in recipes/replicate-sidebar-errors; the
#     snapshot is a fast local convenience (not committed to git, machine-specific).
set -euo pipefail

cd "$(dirname "$0")/.."
SNAPSHOT="drupal-core-baseline"
RECIPE="core/recipes/replicate_core_testing"
DRUSH="ddev exec drush"

usage() { sed -n '2,16p' "$0" | sed 's/^# \{0,1\}//'; }

CAPTURE=0
FORCE_RECIPE=0
for arg in "$@"; do
  case "$arg" in
    --capture) CAPTURE=1 ;;
    --recipe)  FORCE_RECIPE=1 ;;
    --help|-h) usage; exit 0 ;;
    *) echo "Unknown argument: $arg" >&2; usage; exit 2 ;;
  esac
done

snapshot_exists() {
  ddev snapshot --list 2>/dev/null | grep -qE "(^| )${SNAPSHOT}( |$)"
}

rebuild() {
  echo "==> Ensuring ddev is running"
  ddev start >/dev/null
  echo "==> Rebuilding baseline: drush site:install standard"
  $DRUSH site:install standard -y --account-mail=admin@example.com
  echo "==> Applying recipe: $RECIPE"
  $DRUSH recipe "$RECIPE"
  echo "==> Saving snapshot: $SNAPSHOT"
  ddev snapshot --cleanup --name "$SNAPSHOT" -y >/dev/null 2>&1 || true
  ddev snapshot --name "$SNAPSHOT"
}

if [ "$CAPTURE" -eq 1 ]; then
  rebuild
elif [ "$FORCE_RECIPE" -eq 1 ]; then
  rebuild
elif snapshot_exists; then
  echo "==> Restoring snapshot: $SNAPSHOT"
  ddev snapshot restore "$SNAPSHOT"
else
  echo "==> No snapshot found; rebuilding baseline from recipe."
  rebuild
fi

echo
echo "==> Reset complete. Log in with: ddev drush uli"
