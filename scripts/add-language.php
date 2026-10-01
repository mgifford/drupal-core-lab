<?php

/**
 * @file
 * Adds a language to a lab site, with a URL prefix, so pages can be tested with a real lang and dir.
 *
 * Run inside an environment (see scripts/lab-site.sh language): php .lab-add-language.php fa
 * Installs the Language module if needed, makes sure its default (locked) languages exist, creates the language
 * from Drupal's standard list (fa = Persian, right to left) and sets the /<code> URL prefix.
 * The interface stays in English unless translations are imported (Locale module and network).
 */

use Drupal\Core\DrupalKernel;
use Drupal\language\Entity\ConfigurableLanguage;
use Symfony\Component\HttpFoundation\Request;

$code = $argv[1] ?? 'fa';
$autoloader = require 'autoload.php';
$request = Request::create('/');
$kernel = DrupalKernel::createFromRequest($request, $autoloader, 'prod');
$kernel->boot();
$kernel->preHandle($request);

if (!\Drupal::moduleHandler()->moduleExists('language')) {
  \Drupal::service('module_installer')->install(['language']);
  $kernel->rebuildContainer();
}
// A recipe's module install can leave the default languages (und, zxx, en) uncreated; create any that are missing.
foreach (['en' => 'English', 'und' => 'Not specified', 'zxx' => 'Not applicable'] as $id => $label) {
  if (!ConfigurableLanguage::load($id)) {
    $locked = $id !== 'en';
    ConfigurableLanguage::create(['id' => $id, 'label' => $label, 'weight' => $locked ? 2 : 0, 'locked' => $locked])->save();
  }
}
$language = ConfigurableLanguage::load($code) ?? ConfigurableLanguage::createFromLangcode($code);
$language->save();

$config = \Drupal::configFactory()->getEditable('language.negotiation');
$url = $config->get('url');
$url['source'] = 'path_prefix';
$url['prefixes']['en'] = '';
$url['prefixes'][$code] = $code;
$config->set('url', $url)->save();
// Caches are cleared by the caller (ddev drupal cache): rebuilding routes inside this CLI bootstrap fails.
printf("%s ready: %s, direction %s, URL prefix /%s\n", $code, $language->label(), $language->getDirection(), $code);
