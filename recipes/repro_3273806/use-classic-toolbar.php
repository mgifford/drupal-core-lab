<?php

/**
 * @file
 * Post-recipe setup for the #3273806 repro.
 *
 * Core main uses the Navigation module for admin navigation, which replaces the
 * classic admin toolbar. Uninstall Navigation (and its top bar) so the Toolbar
 * module renders its top bar, where the orientation toggle under test lives.
 *
 * Run inside the environment via the recipe's apply.sh; do not run directly.
 */

$a = require 'autoload.php';
$r = Symfony\Component\HttpFoundation\Request::create('/');
$k = Drupal\Core\DrupalKernel::createFromRequest($r, $a, 'prod');
$k->boot();
$k->preHandle($r);

$installer = \Drupal::service('module_installer');
$handler = \Drupal::moduleHandler();
// Uninstall dependents first, then Navigation itself.
foreach (['navigation_top_bar', 'navigation'] as $module) {
  if ($handler->moduleExists($module)) {
    $installer->uninstall([$module]);
  }
}
