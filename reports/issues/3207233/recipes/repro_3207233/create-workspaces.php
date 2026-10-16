<?php

/**
 * @file
 * Creates sample workspaces for issue #3207233 in a disposable lab site.
 */

use Drupal\Core\DrupalKernel;
use Drupal\workspaces\Entity\Workspace;
use Symfony\Component\HttpFoundation\Request;

$autoloader = require 'autoload.php';
$request = Request::create('/');
$kernel = DrupalKernel::createFromRequest($request, $autoloader, 'prod');
$kernel->boot();
$kernel->preHandle($request);

$fixtures = [
  'lab3207233_stage' => ['label' => 'Lab stage', 'parent' => NULL],
  'lab3207233_summer' => ['label' => 'Lab summer event', 'parent' => NULL],
  'lab3207233_child' => ['label' => 'Lab nested campaign', 'parent' => 'lab3207233_stage'],
  'lab3207233_literal' => ['label' => 'Lab <em>literal</em> & review', 'parent' => NULL],
];

foreach ($fixtures as $id => $fixture) {
  $workspace = Workspace::load($id);
  if ($workspace) {
    if ($workspace->label() !== $fixture['label'] || $workspace->get('parent')->target_id !== $fixture['parent']) {
      throw new RuntimeException("Fixture $id exists with different values. Use a clean lab site.");
    }
    continue;
  }
  Workspace::create([
    'id' => $id,
    'label' => $fixture['label'],
    'uid' => 1,
    'parent' => $fixture['parent'],
  ])->save();
}
fwrite(STDOUT, "Issue #3207233: four sample workspaces are ready.\n");
