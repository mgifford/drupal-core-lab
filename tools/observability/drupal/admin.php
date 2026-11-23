<?php

declare(strict_types=1);

/**
 * Boots Drupal and reports or changes the Core Lab observability module state.
 *
 * Run it through DDEV, not directly:
 *   CORE_LAB_ACTION=status ddev exec php < tools/observability/drupal/admin.php
 *
 * Output is one line prefixed with CORE_LAB_JSON: so a Drupal bootstrap warning cannot be mistaken for the result.
 */

$action = getenv('CORE_LAB_ACTION') ?: 'status';
$root = getcwd();
$out = ['action' => $action, 'ok' => FALSE];

try {
  $loader = require $root . '/vendor/autoload.php';
  $kernel = new \Drupal\Core\DrupalKernel('prod', $loader, FALSE);
  $kernel::bootEnvironment();
  $kernel->setSitePath('sites/default');
  \Drupal\Core\Site\Settings::initialize($kernel->getAppRoot(), $kernel->getSitePath(), $loader);
  $kernel->boot();
  $request = \Symfony\Component\HttpFoundation\Request::createFromGlobals();
  $kernel->getContainer()->get('request_stack')->push($request);
  $kernel->preHandle($request);

  $out['sdk'] = class_exists(\OpenTelemetry\SDK\Trace\TracerProvider::class)
    && class_exists(\OpenTelemetry\Contrib\Otlp\SpanExporter::class);
  $out['drupal_version'] = \Drupal::VERSION;
  $out['php_version'] = PHP_VERSION;

  if ($action === 'install') {
    \Drupal::service('module_installer')->install(['core_lab_observability']);
    drupal_flush_all_caches();
    $out['installed'] = TRUE;
  }
  elseif ($action === 'uninstall') {
    if (\Drupal::moduleHandler()->moduleExists('core_lab_observability')) {
      \Drupal::service('module_installer')->uninstall(['core_lab_observability']);
      drupal_flush_all_caches();
    }
    $out['uninstalled'] = TRUE;
  }

  $settings = \Drupal\Core\Site\Settings::get('core_lab_observability', []);
  $out['module'] = \Drupal::moduleHandler()->moduleExists('core_lab_observability');
  $out['modules'] = array_keys(\Drupal::moduleHandler()->getModuleList());
  $out['theme_default'] = \Drupal::config('system.theme')->get('default');
  $out['theme_admin'] = \Drupal::config('system.theme')->get('admin');
  $out['settings'] = is_array($settings) ? $settings : [];
  $out['settings_present'] = is_array($settings) && $settings !== [];
  $out['enabled'] = !empty($settings['enabled']);
  $out['ok'] = TRUE;
}
catch (\Throwable $e) {
  $out['error'] = $e->getMessage();
  $out['error_class'] = $e::class;
}

echo 'CORE_LAB_JSON:' . json_encode($out, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE) . "\n";
