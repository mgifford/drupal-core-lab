<?php

/**
 * @file
 * Post-recipe setup for the #3415961 repro.
 *
 * Standard's Full HTML format has no Insert Media (drupalMedia) button on this
 * core, so the button is added here. A single Image media item is created so the
 * media library dialog has something to insert without a file chooser.
 *
 * Run inside the environment via the recipe's apply.sh; do not run directly.
 */

$a = require 'autoload.php';
$r = Symfony\Component\HttpFoundation\Request::create('/');
$k = Drupal\Core\DrupalKernel::createFromRequest($r, $a, 'prod');
$k->boot();
$k->preHandle($r);

use Drupal\editor\Entity\Editor;
use Drupal\field\Entity\FieldConfig;
use Drupal\file\Entity\File;
use Drupal\filter\Entity\FilterFormat;
use Drupal\media\Entity\Media;

$format = FilterFormat::load('full_html');
$filters = $format->get('filters');
$filters['media_embed'] = [
  'id' => 'media_embed',
  'provider' => 'media',
  'status' => TRUE,
  'weight' => 0,
  'settings' => ['allowed_view_modes' => [], 'allowed_media_types' => []],
];
$format->set('filters', $filters)->save();

$plugin = \Drupal::service('plugin.manager.editor')->createInstance('ckeditor5');
$settings = $plugin->getDefaultSettings($format);
if (!in_array('drupalMedia', $settings['toolbar']['items'], TRUE)) {
  $settings['toolbar']['items'][] = 'drupalMedia';
}
Editor::load('full_html')->setEditor('ckeditor5')->setSettings($settings)->save();

// The Article Body field opens in Basic HTML by default, which has no Insert
// Media button. Make Full HTML the field's default so the button is on the
// node form, as in the issue reporter's setup.
$field = FieldConfig::load('node.article.body');
if ($field) {
  $field->setDefaultValue([['value' => '', 'format' => 'full_html', 'summary' => '']]);
  // allowed_formats is a field setting (field.field_settings.text_with_summary),
  // not a third-party setting. The widget reads it via getFieldSetting(); with it
  // empty the widget defaults to Basic HTML, which has no Insert Media button.
  $field->setSetting('allowed_formats', ['full_html']);
  $field->save();
}

// Build the image with GD so it is guaranteed readable by the image toolkit.
// A hand-written base64 PNG made imagecreatefrompng() return false, which 500'd
// every image-style derivative ("GDToolkit::setImage(): ... false given").
$im = imagecreatetruecolor(64, 64);
$bg = imagecolorallocate($im, 240, 240, 240);
$fg = imagecolorallocate($im, 200, 60, 60);
imagefilledrectangle($im, 0, 0, 63, 63, $bg);
imagefilledellipse($im, 32, 32, 40, 40, $fg);
$tmp = \Drupal::service('file_system')->getTempDirectory() . '/lab-3415961.png';
imagepng($im, $tmp);
imagedestroy($im);
$uri = 'public://lab-3415961.png';
\Drupal::service('file_system')->saveData(file_get_contents($tmp), $uri, \Drupal\Core\File\FileExists::Replace);
@unlink($tmp);

// Drop derivatives built from any earlier unreadable file.
foreach (\Drupal::entityTypeManager()->getStorage('image_style')->loadMultiple() as $style) {
  $style->flush();
}

$files = \Drupal::entityTypeManager()->getStorage('file')->loadByProperties(['uri' => $uri]);
$file = $files ? reset($files) : File::create(['uri' => $uri, 'status' => 1]);
$file->setPermanent();
$file->save();

$existing = \Drupal::entityTypeManager()->getStorage('media')->loadByProperties(['name' => 'Lab image']);
if (!$existing) {
  Media::create([
    'bundle' => 'image',
    'name' => 'Lab image',
    'field_media_image' => [['target_id' => $file->id(), 'alt' => 'Lab image']],
  ])->save();
}

echo "full_html has drupalMedia; Lab image media ready.\n";
