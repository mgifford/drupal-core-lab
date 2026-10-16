#!/usr/bin/env bash
# Post-recipe setup for the #3593502 repro: fill the Main navigation menu with
# thousands of links (seed-menu.php), identically on Before and After, without
# Drush. On the patched side the same script enables menu_tree_ui after the
# patch has added it. LAB_MENU_LINKS (default 15000) and LAB_MENU_FANOUT
# (default 10) change the size and shape. Recipes install only; this runs after
# them.
set -euo pipefail
php "$(dirname "$0")/seed-menu.php"

# Record peak PHP memory for the full page and every lazy-loading request. The
# recipe is copied into the Drupal root, so this path is valid on both sides.
# Keep the include idempotent because setup may safely reapply a recipe.
settings="sites/default/settings.php"
include_line="include \$app_root . '/recipes/repro_3593502/peak-memory.php';"
if ! grep -Fq "$include_line" "$settings"; then
  chmod u+w "$settings"
  printf '\n// Drupal Core Lab #3593502 request measurement.\n%s\n' "$include_line" >> "$settings"
  chmod u-w "$settings"
  echo "Enabled request peak-memory logging in $settings."
fi
