<?php

/**
 * Installs the Standard profile into the DDEV MariaDB database.
 *
 * Usage (from the project root): SITE_NAME="My site" ddev exec php .agents/scripts/site-install.php
 */

chdir(dirname(__DIR__, 2));
$autoloader = require 'autoload.php';
require_once 'core/includes/install.core.inc';

install_drupal($autoloader, [
  'interactive' => FALSE,
  'parameters' => ['profile' => 'standard', 'langcode' => 'en'],
  'forms' => [
    'install_settings_form' => [
      'driver' => 'mysql',
      'mysql' => ['database' => 'db', 'username' => 'db', 'password' => 'db', 'host' => 'db', 'port' => 3306],
    ],
    'install_configure_form' => [
      'site_name' => getenv('SITE_NAME') ?: 'Drupal core test site',
      'site_mail' => 'admin@example.com',
      'account' => ['name' => 'admin', 'mail' => 'admin@example.com', 'pass' => ['pass1' => 'admin', 'pass2' => 'admin']],
      'enable_update_status_module' => NULL,
      'enable_update_status_emails' => NULL,
    ],
  ],
]);
echo "installed\n";
