#!/usr/bin/env bash
# Put a lab environment into a known state. Local development only.
#
#   scripts/lab-site.sh apply <env> [recipe]   apply a recipe from recipes/ (default ife_sidebar_repro)
#   scripts/lab-site.sh language <env> [code]  add a language with a /<code> URL prefix (default fa, Farsi: right to left); see scripts/add-language.php
#   scripts/lab-site.sh reset <env> [recipe]   DESTROYS the site: reinstall Standard (admin/admin), then apply
#
# <env> is a directory under envs/ (for example baseline-main). Needs the DDEV add-on
# (see AGENTS.md). Both environments of a comparison should be given the same recipe.
set -euo pipefail
lab="$(cd "$(dirname "$0")/.." && pwd)"
cmd="${1:-}"; env="${2:-}"; recipe="${3:-ife_sidebar_repro}"
[ -n "$cmd" ] && [ -n "$env" ] || { sed -n '2,8p' "$0"; exit 2; }
dir="$lab/envs/$env"
[ -d "$dir" ] || { echo "no such environment: $dir" >&2; exit 1; }
case "$cmd" in apply|reset) [ -f "$lab/recipes/$recipe/recipe.yml" ] || { echo "no such recipe: recipes/$recipe" >&2; exit 1; } ;; esac
cd "$dir"

apply() {
  mkdir -p recipes && rm -rf "recipes/$recipe" && cp -R "$lab/recipes/$recipe" "recipes/$recipe"
  ddev exec php core/scripts/dr recipe:apply "recipes/$recipe"
  # Plain files, not minified aggregates, so a changed CSS/JS file can be compared as source.
  local php='$a=require "autoload.php"; $r=Symfony\Component\HttpFoundation\Request::create("/"); $k=Drupal\Core\DrupalKernel::createFromRequest($r,$a,"prod"); $k->boot(); $k->preHandle($r); \Drupal::configFactory()->getEditable("system.performance")->set("css.preprocess",false)->set("js.preprocess",false)->save(); \Drupal::configFactory()->getEditable("system.site")->set("name","Drupal core test site")->save();'
  ddev exec "php -r '$php'"
  ddev drupal cache
}

case "$cmd" in
  apply) apply ;;
  reset)
    ddev snapshot --name "before-reset-$(date +%Y%m%d-%H%M%S)" >/dev/null 2>&1 || true
    ddev drupal uninstall || true
    rm -rf sites/default/files sites/default/settings.php
    ddev restart >/dev/null
    ddev drupal install standard --password=admin --site-name="Drupal core test site"
    apply ;;
  language)
    code="${3:-fa}"
    cp "$lab/scripts/add-language.php" .lab-add-language.php
    ddev mutagen sync >/dev/null 2>&1 || true
    for _ in $(seq 1 30); do ddev exec test -f .lab-add-language.php 2>/dev/null && break; sleep 1; done   # wait for the file to reach the container
    ddev exec php .lab-add-language.php "$code"; rm -f .lab-add-language.php
    ddev drupal cache; echo "$env: browse /$code/..."; exit 0 ;;
  *) echo "unknown command: $cmd" >&2; exit 2 ;;
esac
echo "$env ready (recipe: $recipe). Log in as admin / admin."
