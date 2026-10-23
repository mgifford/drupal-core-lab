<?php

/**
 * @file
 * Prints the path of a one-time login link for user 1 (what drush uli gives).
 *
 * For the lab's private local test site only. Usage:
 *   php login-path.php <drupal-root>
 */

declare(strict_types=1);

use Drupal\Core\DrupalKernel;
use Drupal\user\Entity\User;
use Symfony\Component\HttpFoundation\Request;

$root = $argv[1] ?? NULL;
if (!$root || !is_file($root . '/autoload.php')) {
  fwrite(STDERR, "usage: php login-path.php <drupal-root>\n");
  exit(2);
}
chdir($root);
$autoloader = require $root . '/autoload.php';
$request = Request::create('/', 'GET', [], [], [], ['SCRIPT_NAME' => '/index.php', 'SCRIPT_FILENAME' => $root . '/index.php']);
$kernel = DrupalKernel::createFromRequest($request, $autoloader, 'prod');
$kernel->boot();
$kernel->preHandle($request);
$account = User::load(1);
$timestamp = \Drupal::time()->getRequestTime();
echo '/user/reset/1/' . $timestamp . '/' . user_pass_rehash($account, $timestamp) . "/login\n";
