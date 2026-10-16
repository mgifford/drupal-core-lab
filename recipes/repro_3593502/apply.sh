#!/usr/bin/env bash
# Post-recipe setup for the #3593502 repro: fill the Main navigation menu with
# thousands of links (seed-menu.php), identically on Before and After, without
# Drush. LAB_MENU_LINKS (default 15000) and LAB_MENU_FANOUT (default 10) change
# the size and shape. Recipes install only; this runs after them.
set -euo pipefail
php "$(dirname "$0")/seed-menu.php"
