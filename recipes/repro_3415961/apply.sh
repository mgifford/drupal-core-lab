#!/usr/bin/env bash
# Post-recipe setup for the #3415961 repro: add the Insert Media button to Full
# HTML and create one Image media item. Recipes only install; they cannot edit
# an existing text format, so this runs as the recipe's apply step.
set -euo pipefail
php "$(dirname "$0")/configure-editor.php"
