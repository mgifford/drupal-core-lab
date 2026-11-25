<?php

/**
 * @file
 * Post-recipe setup for the #3594809 repro.
 *
 * Enables the lab-only fixture module and creates sample articles and image
 * media, so /admin/content, /admin/content/media and the media grid show
 * bulk-selection checkboxes. Idempotent.
 *
 * Run inside the environment via the recipe's apply.sh; do not run directly.
 */

$a = require 'autoload.php';
$r = Symfony\Component\HttpFoundation\Request::create('/');
$k = Drupal\Core\DrupalKernel::createFromRequest($r, $a, 'prod');
$k->boot();
$k->preHandle($r);

use Drupal\file\Entity\File;
use Drupal\media\Entity\Media;
use Drupal\node\Entity\Node;

\Drupal::service('module_installer')->install(['lab_checkbox_fixture']);
echo "lab_checkbox_fixture enabled\n";

$nodes = \Drupal::entityTypeManager()->getStorage('node');
for ($i = 1; $i <= 6; $i++) {
  $title = "Checkbox repro article $i";
  if (!$nodes->loadByProperties(['title' => $title])) {
    Node::create([
      'type' => 'article',
      'title' => $title,
      // Two unpublished rows, so the table is not uniform.
      'status' => $i <= 4 ? 1 : 0,
      'uid' => 1,
    ])->save();
  }
}

$media = \Drupal::entityTypeManager()->getStorage('media');
$file_system = \Drupal::service('file_system');
for ($i = 1; $i <= 3; $i++) {
  $name = "Checkbox repro image $i";
  if ($media->loadByProperties(['name' => $name])) {
    continue;
  }
  $uri = "public://lab-checkbox-repro-$i.png";
  $file_system->copy('core/misc/druplicon.png', $uri);
  $file = File::create(['uri' => $uri, 'uid' => 1]);
  $file->setPermanent();
  $file->save();
  Media::create([
    'bundle' => 'image',
    'name' => $name,
    'uid' => 1,
    'status' => 1,
    'field_media_image' => ['target_id' => $file->id(), 'alt' => "Sample image $i"],
  ])->save();
}
echo "sample articles and media present\n";
