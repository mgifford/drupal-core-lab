<?php

/**
 * @file
 * Post-recipe setup for the #3593502 repro: a Main navigation menu with thousands of links.
 *
 * The menu edit form (/admin/structure/menu/manage/main) builds one form row per
 * link, so on unchanged core a large menu runs out of memory. The same links are
 * created on Before and After, so both sides are compared on the same tree.
 *
 * Shape: LAB_MENU_LINKS links in total (default 15000), LAB_MENU_FANOUT children
 * per link (default 10), filled breadth first: 10, 100, 1000, 10000, then the
 * rest on the fifth level. Every link points to /node. Titles start with
 * "Lab seed", followed by the link's position in the tree, such as "1.4.2".
 *
 * Idempotent: when the menu already holds that many seeded links it does
 * nothing; a partly seeded menu (an interrupted run) stops with a message
 * instead of adding duplicates. Run inside the environment via apply.sh.
 */

use Drupal\menu_link_content\Entity\MenuLinkContent;

ini_set('memory_limit', '-1');
$a = require 'autoload.php';
$r = Symfony\Component\HttpFoundation\Request::create('/');
$k = Drupal\Core\DrupalKernel::createFromRequest($r, $a, 'prod');
$k->boot();
$k->preHandle($r);

// The recipe is shared by Before and After. Enable the experimental UI only
// where the MR patch has added it; unchanged core must remain unchanged.
if (is_dir(DRUPAL_ROOT . '/core/modules/menu_tree_ui')) {
  if (!\Drupal::moduleHandler()->moduleExists('menu_tree_ui')) {
    \Drupal::service('module_installer')->install(['menu_tree_ui']);
    echo "Enabled menu_tree_ui on the patched site.\n";
  }
}

$total = max(1, (int) (getenv('LAB_MENU_LINKS') ?: 15000));
$fanout = max(2, (int) (getenv('LAB_MENU_FANOUT') ?: 10));
$prefix = 'Lab seed';
$storage = \Drupal::entityTypeManager()->getStorage('menu_link_content');
$existing = (int) $storage->getQuery()->accessCheck(FALSE)
  ->condition('menu_name', 'main')
  ->condition('title', $prefix . ' ', 'STARTS_WITH')
  ->count()->execute();
if ($existing >= $total) {
  echo "The Main navigation menu already has $existing seeded links; nothing to do.\n";
  return;
}
if ($existing > 0) {
  fwrite(STDERR, "The Main navigation menu has $existing of $total seeded links (an interrupted run?). Reset the site and apply the recipe again.\n");
  exit(1);
}

// Each batch of links is one database transaction: one write to disk per batch
// instead of one per link, which matters on SQLite.
$db = \Drupal::database();
$commit = static function ($txn): void {
  if (method_exists($txn, 'commitOrRelease')) {
    $txn->commitOrRelease();
  }
};
$start = microtime(TRUE);
$queue = [[NULL, '']];
$next = 0;
$made = 0;
$txn = $db->startTransaction();
while ($made < $total && $next < count($queue)) {
  [$parent, $path] = $queue[$next++];
  for ($i = 1; $i <= $fanout && $made < $total; $i++) {
    $position = $path === '' ? (string) $i : "$path.$i";
    $link = MenuLinkContent::create([
      'title' => "$prefix $position",
      'link' => ['uri' => 'internal:/node'],
      'menu_name' => 'main',
      'parent' => $parent ?? '',
      'weight' => $i,
      'expanded' => FALSE,
    ]);
    $link->save();
    $made++;
    $queue[] = [$link->getPluginId(), $position];
    if ($made % 500 === 0) {
      $commit($txn);
      unset($txn);
      $storage->resetCache();
      printf("%d of %d links (%.0f s)\n", $made, $total, microtime(TRUE) - $start);
      $txn = $db->startTransaction();
    }
  }
}
$commit($txn);
unset($txn);
\Drupal::state()->set('lab.menu_seed', ['links' => $made, 'fanout' => $fanout]);
printf("Seeded %d links in the Main navigation menu (fan-out %d) in %.0f s.\n", $made, $fanout, microtime(TRUE) - $start);
