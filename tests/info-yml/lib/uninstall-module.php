<?php

/**
 * @file
 * Uninstalls one module on the lab site (core has no command for this).
 *
 * Usage:
 *   php uninstall-module.php <drupal-root> <module>
 */

declare(strict_types=1);

use Drupal\Core\DrupalKernel;
use Symfony\Component\HttpFoundation\Request;

[, $root, $module] = $argv + [NULL, NULL, NULL];
if (!$root || !$module || !is_file($root . '/autoload.php')) {
  fwrite(STDERR, "usage: php uninstall-module.php <drupal-root> <module>\n");
  exit(2);
}
chdir($root);
$autoloader = require $root . '/autoload.php';
$request = Request::create('/', 'GET', [], [], [], ['SCRIPT_NAME' => '/index.php', 'SCRIPT_FILENAME' => $root . '/index.php']);
$kernel = DrupalKernel::createFromRequest($request, $autoloader, 'prod');
$kernel->boot();
$kernel->preHandle($request);
$result = \Drupal::service('module_installer')->uninstall([$module]);
echo $result ? "uninstalled $module\n" : "could not uninstall $module\n";
exit($result ? 0 : 1);
