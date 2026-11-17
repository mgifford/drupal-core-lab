<?php

/**
 * @file
 * Creates published and unpublished content for the #867830 current-Core proposal.
 *
 * Run inside the environment via the recipe's apply.sh; do not run directly.
 */

use Drupal\comment\Entity\Comment;
use Drupal\comment\Entity\CommentType;
use Drupal\Core\DrupalKernel;
use Drupal\Core\Entity\Entity\EntityViewDisplay;
use Drupal\field\Entity\FieldConfig;
use Drupal\field\Entity\FieldStorageConfig;
use Drupal\node\Entity\Node;
use Drupal\node\Entity\NodeType;
use Drupal\node\NodeInterface;
use Symfony\Component\HttpFoundation\Request;

$autoloader = require 'autoload.php';
$request = Request::create('/');
$kernel = DrupalKernel::createFromRequest($request, $autoloader, 'prod');
$kernel->boot();
$kernel->preHandle($request);

// Current Standard installs do not create Article, Basic page or their fields.
if (!FieldStorageConfig::loadByName('node', 'body')) {
  FieldStorageConfig::create(['entity_type' => 'node', 'field_name' => 'body', 'type' => 'text_long'])->save();
}
foreach (['article' => 'Article', 'page' => 'Basic page'] as $bundle => $name) {
  if (!NodeType::load($bundle)) {
    NodeType::create(['type' => $bundle, 'name' => $name, 'display_submitted' => $bundle === 'article'])->save();
  }
  if (!FieldConfig::loadByName('node', $bundle, 'body')) {
    FieldConfig::create(['entity_type' => 'node', 'bundle' => $bundle, 'field_name' => 'body', 'label' => 'Body'])->save();
  }
  $display = EntityViewDisplay::load("node.$bundle.default") ?? EntityViewDisplay::create(['targetEntityType' => 'node', 'bundle' => $bundle, 'mode' => 'default', 'status' => TRUE]);
  $display->setComponent('body', ['type' => 'text_default', 'label' => 'hidden'])->save();
}
if (!CommentType::load('comment')) {
  CommentType::create(['id' => 'comment', 'label' => 'Comments', 'target_entity_type_id' => 'node'])->save();
}
if (!FieldStorageConfig::loadByName('comment', 'comment_body')) {
  FieldStorageConfig::create(['entity_type' => 'comment', 'field_name' => 'comment_body', 'type' => 'text_long'])->save();
}
if (!FieldConfig::loadByName('comment', 'comment', 'comment_body')) {
  FieldConfig::create(['entity_type' => 'comment', 'bundle' => 'comment', 'field_name' => 'comment_body', 'label' => 'Comment'])->save();
}
$display = EntityViewDisplay::load('comment.comment.default') ?? EntityViewDisplay::create(['targetEntityType' => 'comment', 'bundle' => 'comment', 'mode' => 'default', 'status' => TRUE]);
$display->setComponent('comment_body', ['type' => 'text_default', 'label' => 'hidden'])->save();
if (!FieldStorageConfig::loadByName('node', 'comment')) {
  FieldStorageConfig::create(['entity_type' => 'node', 'field_name' => 'comment', 'type' => 'comment'])->save();
}
if (!FieldConfig::loadByName('node', 'article', 'comment')) {
  FieldConfig::create(['entity_type' => 'node', 'bundle' => 'article', 'field_name' => 'comment', 'label' => 'Comments', 'settings' => ['comment_type' => 'comment']])->save();
}
EntityViewDisplay::load('node.article.default')->setComponent('comment', ['type' => 'comment_default', 'label' => 'hidden', 'weight' => 10])->save();

\Drupal::service('theme_installer')->install(['olivero', 'claro', 'default_admin']);
\Drupal::configFactory()->getEditable('system.theme')->set('default', 'olivero')->set('admin', 'default_admin')->save();

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
  if ($fixture['type'] === 'article') {
    $node->set('comment', ['status' => 2]);
  }
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
fwrite(STDOUT, "Issue #867830 current-Core proposal: fixtures are ready. Front-end theme olivero, admin theme default_admin.\n");
