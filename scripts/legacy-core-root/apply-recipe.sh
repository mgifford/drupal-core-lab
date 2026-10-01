#!/usr/bin/env bash
# apply-recipe.sh — discover and apply Drupal *Core* recipes via the Core Recipe API.
#
# Wraps scripts/recipe-cli.php (Drupal\Core\Recipe\Recipe / RecipeRunner) so a dev or
# LLM can list and apply core recipes without knowing Drush internals. This exposes
# core functionality for testing; it does NOT install Drupal CMS recipes.
#
# Usage:
#   bash scripts/apply-recipe.sh list                              # list core recipes
#   bash scripts/apply-recipe.sh apply core/recipes/standard       # apply by path
#   bash scripts/apply-recipe.sh apply comment_base                 # apply by name
#   bash scripts/apply-recipe.sh apply recipes/replicate_core_testing
#
# Note: applying a recipe changes the current site. Run `ddev reset-site` afterwards to
# return to the clean baseline (the working tree / patches are never touched).
set -euo pipefail
cd "$(dirname "$0")/.."
DRUSH="ddev exec drush"

usage() { sed -n '2,13p' "$0" | sed 's/^# \{0,1\}//'; }

case "${1:-help}" in
  list)
    $DRUSH php:script scripts/recipe-cli.php -- list
    ;;
  apply)
    shift
    if [ "$#" -eq 0 ]; then echo "Missing recipe name/path" >&2; usage; exit 2; fi
    $DRUSH php:script scripts/recipe-cli.php -- apply "$@"
    ;;
  -h|--help|help)
    usage
    ;;
  *)
    echo "Unknown command: $1" >&2
    usage
    exit 2
    ;;
esac
