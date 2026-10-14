#!/usr/bin/env bash
# Post-recipe setup for the #3618405 repro: make Default Admin the admin theme
# (the MR under test only changes that theme) and create a few Article nodes so
# /admin/content lists rows and the content view's exposed filter form is shown
# in context. Recipes install only; this runs after them.
set -euo pipefail
php "$(dirname "$0")/set-admin-theme.php"
php "$(dirname "$0")/create-content.php"
