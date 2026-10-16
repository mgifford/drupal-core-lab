<?php

/**
 * @file
 * Measures what the menu edit form costs to build: peak memory, time, links.
 *
 * Builds the edit form of one menu (default: main) as user 1, the way
 * /admin/structure/menu/manage/<menu> does, and prints one line:
 *   menu=main links=15000 form_rows=15000 peak_mb=812.4 seconds=41.2 php=8.5.0
 * Run it the same way on Before and After so the numbers compare. The PHP
 * memory limit is lifted here so the cost can be measured; a web request has
 * the site's real limit and fails with a white screen instead.
 *
 * Usage, inside the environment from the Drupal root:
 *   php recipes/repro_3593502/measure-menu-form.php [menu]
 */

use Drupal\system\Entity\Menu;

ini_set('memory_limit', '-1');
$a = require 'autoload.php';
$r = Symfony\Component\HttpFoundation\Request::create('/');
$k = Drupal\Core\DrupalKernel::createFromRequest($r, $a, 'prod');
$k->boot();
$k->preHandle($r);

$menu_name = $argv[1] ?? 'main';
$menu = Menu::load($menu_name);
if (!$menu) {
  fwrite(STDERR, "No menu named $menu_name.\n");
  exit(1);
}
\Drupal::service('account_switcher')->switchTo(\Drupal\user\Entity\User::load(1));
$links = (int) \Drupal::entityTypeManager()->getStorage('menu_link_content')->getQuery()
  ->accessCheck(FALSE)->condition('menu_name', $menu_name)->count()->execute();

gc_collect_cycles();
$base = memory_get_usage();
$start = microtime(TRUE);
$form = \Drupal::service('entity.form_builder')->getForm($menu, 'edit');
$seconds = microtime(TRUE) - $start;
$rows = 0;
foreach ($form['links']['links'] ?? [] as $key => $element) {
  if (is_string($key) && str_starts_with($key, 'menu_plugin_id:')) {
    $rows++;
  }
}
printf("menu=%s links=%d form_rows=%d peak_mb=%.1f above_boot_mb=%.1f seconds=%.1f php=%s\n",
  $menu_name, $links, $rows, memory_get_peak_usage() / 1048576, (memory_get_peak_usage() - $base) / 1048576, $seconds, PHP_VERSION);
