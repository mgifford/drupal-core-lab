#!/usr/bin/env bash
# Post-recipe setup for the #3594809 repro, identical on Before and After:
# install the lab-only fixture form (/admin/lab/checkboxes) and create sample
# articles and media so the bulk-selection tables and the media grid have rows.
# Recipes cannot ship module code, so copy the module into the site and enable
# it. Safe to run more than once.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
mkdir -p modules/custom
rm -rf modules/custom/lab_checkbox_fixture
cp -R "$here/lab_checkbox_fixture" modules/custom/lab_checkbox_fixture
php "$here/create-content.php"
