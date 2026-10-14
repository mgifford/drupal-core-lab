#!/usr/bin/env bash
# Post-recipe setup for the #3273806 repro: core main installs the Navigation
# module, which replaces the classic admin toolbar. Uninstall it so the Toolbar
# module's top bar (with the orientation toggle under test) renders.
set -euo pipefail
php "$(dirname "$0")/use-classic-toolbar.php"
