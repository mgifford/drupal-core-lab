#!/usr/bin/env bash
# #3093378 post-step (recipes install only; they cannot uninstall).
#
# The Standard profile installs the core Navigation module. Its admin bar suppresses the contrib
# Toolbar module: Drupal\toolbar\Hook\ToolbarHooks::pageTop() returns early when the current user may
# 'access navigation' and the navigation module exists. Remove Navigation so the classic Toolbar under
# test is the bar that renders, identically on both sides.
set -euo pipefail
php -r '$a = require "autoload.php"; $r = Symfony\Component\HttpFoundation\Request::create("/"); $k = Drupal\Core\DrupalKernel::createFromRequest($r, $a, "prod"); $k->boot(); $k->preHandle($r); if (\Drupal::moduleHandler()->moduleExists("navigation")) { \Drupal::service("module_installer")->uninstall(["navigation"], FALSE); } echo "navigation uninstalled\n";'
