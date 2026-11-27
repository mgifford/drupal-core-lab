<?php

/**
 * @file
 * Seeds terms and articles for the #3545814 reproduction, identically on both sites.
 *
 * Run inside an environment: php recipes/repro_3545814/seed.php
 * Four articles are created so the numeric, bundle and taxonomy exposed filters
 * have something to return, and so Between/Empty filter submissions can be checked.
 */

use Drupal\Core\DrupalKernel;
use Drupal\node\Entity\Node;
use Drupal\taxonomy\Entity\Term;
use Symfony\Component\HttpFoundation\Request;

$autoloader = require 'autoload.php';
$request = Request::create('/');
$kernel = DrupalKernel::createFromRequest($request, $autoloader, 'prod');
$kernel->boot();
$kernel->preHandle($request);

$term_storage = \Drupal::entityTypeManager()->getStorage('taxonomy_term');
$terms = [];
foreach (['News', 'Tutorial'] as $name) {
  $existing = $term_storage->loadByProperties(['name' => $name, 'vid' => 'tags']);
  $term = $existing ? reset($existing) : Term::create(['name' => $name, 'vid' => 'tags']);
  if (!$term->id()) {
    $term->save();
  }
  $terms[$name] = $term;
}

$nodes = [
  ['Alpha', ['News']],
  ['Beta', ['News', 'Tutorial']],
  ['Gamma', ['Tutorial']],
  ['Delta', []],
];
$node_storage = \Drupal::entityTypeManager()->getStorage('node');
foreach ($nodes as [$title, $tags]) {
  $existing = $node_storage->loadByProperties(['title' => $title, 'type' => 'article']);
  if ($existing) {
    continue;
  }
  Node::create([
    'type' => 'article',
    'title' => $title,
    'body' => [
      'value' => 'Body for ' . $title,
      'format' => 'basic_html',
    ],
    'field_tags' => array_map(static fn($name) => $terms[$name]->id(), $tags),
    'status' => 1,
  ])->save();
}

printf("Seeded %d terms and %d articles.\n", count($terms), count($nodes));
