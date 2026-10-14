<?php

/**
 * @file
 * Post-recipe setup for the #3619154 repro: make Default Admin the admin theme.
 *
 * MR !16911 only changes the default_admin theme, so that theme must be the
 * active admin theme. At the pinned core commit the Standard install still uses
 * Claro as the admin theme, so set it explicitly.
 *
 * Run inside the environment via the recipe's apply.sh; do not run directly.
 */

$a = require 'autoload.php';
$r = Symfony\Component\HttpFoundation\Request::create('/');
$k = Drupal\Core\DrupalKernel::createFromRequest($r, $a, 'prod');
$k->boot();
$k->preHandle($r);

\Drupal::service('theme_installer')->install(['default_admin']);
\Drupal::configFactory()->getEditable('system.theme')
  ->set('admin', 'default_admin')
  ->save();
