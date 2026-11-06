#!/usr/bin/env bash
# Post-recipe setup for the #867830 repro: create the nodes and comments the steps
# look at (scripts/lab-site.sh apply runs this inside the site, after the recipe).
# Recipes carry config, not content, so the fixtures are created here, identically
# on Before and After, and found again by alias if the step is run twice.
set -euo pipefail
php "$(dirname "$0")/create-content.php"
