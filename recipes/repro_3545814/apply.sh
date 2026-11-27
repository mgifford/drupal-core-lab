#!/usr/bin/env bash
# Seed the content the exposed filters in views.view.repro_3545814 need.
# Runs inside the environment after the recipe is applied (see scripts/lab-site.sh apply).
set -euo pipefail
php recipes/repro_3545814/seed.php
