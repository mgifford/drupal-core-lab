#!/usr/bin/env bash
# Post-recipe setup for the #2942404 repro: install the lab-only /lab/status-messages page, identically on Before and After.
# Recipes cannot ship module code, so copy the module into the site and enable it. Safe to run more than once.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
mkdir -p modules/custom
rm -rf modules/custom/lab_status_messages
cp -R "$here/lab_status_messages" modules/custom/lab_status_messages
php -r '$a=require "autoload.php"; $r=Symfony\Component\HttpFoundation\Request::create("/"); $k=Drupal\Core\DrupalKernel::createFromRequest($r,$a,"prod"); $k->boot(); $k->preHandle($r); \Drupal::service("module_installer")->install(["lab_status_messages"]); echo "lab_status_messages enabled\n";'
