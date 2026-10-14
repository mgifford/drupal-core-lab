#!/usr/bin/env bash
# Post-recipe setup for the #3619154 repro: make Default Admin the admin theme
# (the MR only changes that theme) and create one Article node, so the content
# edit form shows the meta sidebar and its toggle. Recipes install only; this
# runs after them.
set -euo pipefail
php "$(dirname "$0")/set-admin-theme.php"
php "$(dirname "$0")/create-content.php"
