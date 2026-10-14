<?php

/**
 * @file
 * Post-recipe setup for the #3618405 repro.
 *
 * Creates a few Article nodes so /admin/content shows the content view with its
 * exposed filter form in a realistic state. Idempotent: it only creates the
 * nodes if none of them exist yet.
 *
 * Run inside the environment via the recipe's apply.sh; do not run directly.
 */

$a = require 'autoload.php';
$r = Symfony\Component\HttpFoundation\Request::create('/');
$k = Drupal\Core\DrupalKernel::createFromRequest($r, $a, 'prod');
$k->boot();
$k->preHandle($r);

use Drupal\node\Entity\Node;

$titles = [
  'Welcome to the content list',
  'Draft article awaiting review',
  'Published announcement',
  'Older news item',
  'Accessibility notes',
];

foreach ($titles as $i => $title) {
  $existing = \Drupal::entityTypeManager()->getStorage('node')
    ->loadByProperties(['title' => $title]);
  if ($existing) {
    continue;
  }
  Node::create([
    'type' => 'article',
    'title' => $title,
    'status' => $i % 2 === 0 ? 1 : 0,
    'body' => [['value' => 'Sample body for the content list repro.', 'format' => 'basic_html']],
  ])->save();
}
