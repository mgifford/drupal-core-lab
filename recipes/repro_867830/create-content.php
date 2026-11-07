<?php

/**
 * @file
 * Creates the content the #867830 steps look at, in a disposable lab site.
 *
 * Three nodes and three comments, each found again by its path alias so the
 * script can run more than once. Titles and bodies avoid the word
 * "unpublished" on purpose: the viewer's checks look for that word as the
 * status marker, and must not find it in ordinary content.
 *
 * Run inside the environment via the recipe's apply.sh; do not run directly.
 */

use Drupal\comment\Entity\Comment;
use Drupal\Core\DrupalKernel;
use Drupal\node\Entity\Node;
use Drupal\node\NodeInterface;
use Symfony\Component\HttpFoundation\Request;

$autoloader = require 'autoload.php';
$request = Request::create('/');
$kernel = DrupalKernel::createFromRequest($request, $autoloader, 'prod');
$kernel->boot();
$kernel->preHandle($request);

$bundles = \Drupal::entityTypeManager()->getStorage('node_type')->loadMultiple();
foreach (['article', 'page'] as $bundle) {
  if (!isset($bundles[$bundle])) {
    throw new RuntimeException("The '$bundle' content type is missing: the site is not a Standard install.");
  }
}
$article_fields = \Drupal::service('entity_field.manager')->getFieldDefinitions('node', 'article');
if (!isset($article_fields['comment'])) {
  throw new RuntimeException("The article content type has no 'comment' field: the site is not a Standard install.");
}

$theme_installer = \Drupal::service('theme_installer');
$theme_installer->install(['olivero', 'claro', 'stark']);
\Drupal::configFactory()->getEditable('system.theme')->set('default', 'olivero')->set('admin', 'claro')->save();

$fixtures = [
  '/lab/published-article' => [
    'type' => 'article',
    'title' => 'Live article (control)',
    'status' => NodeInterface::PUBLISHED,
    'body' => 'A published article for comparison. Its comment below is live.',
    'comments' => [
      ['subject' => 'A live comment', 'body' => 'This comment is approved and visible to everyone.', 'status' => 1],
    ],
  ],
  '/lab/unpublished-article' => [
    'type' => 'article',
    'title' => 'Draft article, not yet live',
    'status' => NodeInterface::NOT_PUBLISHED,
    'body' => 'An article whose status is "not published". Only people with the right permission can see it. Below are one live comment and one comment held for review.',
    'comments' => [
      ['subject' => 'A live comment', 'body' => 'This comment is approved.', 'status' => 1],
      ['subject' => 'A comment awaiting approval', 'body' => 'This comment is held for review and is not shown to visitors.', 'status' => 0],
    ],
  ],
  '/lab/unpublished-page' => [
    'type' => 'page',
    'title' => 'Draft page, not yet live',
    'status' => NodeInterface::NOT_PUBLISHED,
    'body' => 'A basic page whose status is "not published".',
    'comments' => [],
  ],
];

$alias_repository = \Drupal::service('path_alias.repository');
foreach ($fixtures as $alias => $fixture) {
  $existing = $alias_repository->lookupByAlias($alias, 'en');
  if ($existing && preg_match('#^/node/(\d+)$#', $existing['path'], $m)) {
    $node = Node::load($m[1]);
    if ($node) {
      fwrite(STDOUT, "$alias exists as node/{$node->id()}; left as is.\n");
      continue;
    }
  }
  $node = Node::create([
    'type' => $fixture['type'],
    'title' => $fixture['title'],
    'status' => $fixture['status'],
    'uid' => 1,
    'body' => ['value' => '<p>' . $fixture['body'] . '</p>', 'format' => 'basic_html'],
    'path' => ['alias' => $alias],
  ]);
  $node->save();
  foreach ($fixture['comments'] as $comment) {
    Comment::create([
      'entity_type' => 'node',
      'entity_id' => $node->id(),
      'field_name' => 'comment',
      'comment_type' => 'comment',
      'uid' => 1,
      'subject' => $comment['subject'],
      'comment_body' => ['value' => '<p>' . $comment['body'] . '</p>', 'format' => 'basic_html'],
      'status' => $comment['status'],
    ])->save();
  }
  fwrite(STDOUT, "$alias created as node/{$node->id()} ({$fixture['type']}, status {$fixture['status']}, " . count($fixture['comments']) . " comments).\n");
}
fwrite(STDOUT, "Issue #867830: fixtures are ready. Default theme olivero, admin theme claro, stark installed.\n");
