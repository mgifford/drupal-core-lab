<?php

/**
 * @file
 * Post-recipe setup for the #3619154 repro.
 *
 * Creates one Article node so /node/1/edit shows the content edit form with its
 * meta sidebar and the show/hide toggle the MR reworks. Idempotent.
 *
 * Run inside the environment via the recipe's apply.sh; do not run directly.
 */

$a = require 'autoload.php';
$r = Symfony\Component\HttpFoundation\Request::create('/');
$k = Drupal\Core\DrupalKernel::createFromRequest($r, $a, 'prod');
$k->boot();
$k->preHandle($r);

use Drupal\node\Entity\Node;

$title = 'Sidebar toggle repro article';
$existing = \Drupal::entityTypeManager()->getStorage('node')
  ->loadByProperties(['title' => $title]);
if (!$existing) {
  Node::create([
    'type' => 'article',
    'title' => $title,
    'status' => 1,
    'body' => [['value' => 'Edit this node to see the meta sidebar and its toggle.', 'format' => 'basic_html']],
  ])->save();
}
