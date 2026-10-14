<?php

/**
 * @file
 * Prints the server side of a lab site's context as JSON. Piped into the web container on stdin
 * (`ddev exec php < site-context.php`), so nothing is written into a core checkout. Read-only.
 *
 * Reads the SQLite database directly (the lab's sites use the core-dev add-on: no Drush).
 */

$out = ['php' => PHP_VERSION];
$d = @file_get_contents('core/lib/Drupal.php');
if ($d && preg_match("/const VERSION = '([^']+)'/", $d, $m)) {
  $out['drupal'] = $m[1];
}
try {
  $db = new PDO('sqlite:sites/default/files/.sqlite', NULL, NULL, [PDO::SQLITE_ATTR_OPEN_FLAGS => PDO::SQLITE_OPEN_READONLY]);
  $cfg = function ($name) use ($db) {
    $s = $db->prepare("SELECT data FROM config WHERE collection = '' AND name = ?");
    $s->execute([$name]);
    $v = $s->fetchColumn();
    return $v === FALSE ? NULL : unserialize($v, ['allowed_classes' => FALSE]);
  };
  $ext = $cfg('core.extension');
  $theme = $cfg('system.theme');
  $site = $cfg('system.site');
  $out['profile'] = $ext['profile'] ?? NULL;
  $out['theme'] = ['default' => $theme['default'] ?? NULL, 'admin' => $theme['admin'] ?? NULL];
  $out['themes'] = array_keys($ext['theme'] ?? []);
  $out['modules'] = array_keys($ext['module'] ?? []);
  sort($out['modules']);
  $out['defaultLangcode'] = $site['default_langcode'] ?? NULL;
  $out['languages'] = array_map(fn($n) => substr($n, strlen('language.entity.')), $db->query("SELECT name FROM config WHERE collection = '' AND name LIKE 'language.entity.%'")->fetchAll(PDO::FETCH_COLUMN));
}
catch (Throwable $e) {
  $out['dbError'] = $e->getMessage();
}
echo json_encode($out), PHP_EOL;
