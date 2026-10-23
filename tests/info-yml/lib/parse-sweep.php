<?php

/**
 * @file
 * Parses every fixture info file with core's own InfoParserDynamic.
 *
 * No site and no bootstrap: this checks that each fixture holds the defect
 * its name says, and records what the parser alone does with it. Usage:
 *   php parse-sweep.php <drupal-root> <fixtures-dir>
 * Run it with and without -d extension=yaml to cover both parsers that core
 * main uses (#3616275). Prints JSON.
 */

declare(strict_types=1);

use Drupal\Core\Extension\InfoParserDynamic;

[, $root, $fixtures] = $argv + [NULL, NULL, NULL];
if (!$root || !$fixtures) {
  fwrite(STDERR, "usage: php parse-sweep.php <drupal-root> <fixtures-dir>\n");
  exit(2);
}
require $root . '/autoload.php';
$parser = new InfoParserDynamic($root);
$out = ['parser' => extension_loaded('yaml') ? 'pecl' : 'symfony', 'drupal' => \Drupal::VERSION, 'results' => []];
$iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($fixtures, FilesystemIterator::SKIP_DOTS));
$files = [];
foreach ($iterator as $file) {
  if (str_ends_with($file->getFilename(), '.info.yml') && !str_contains($file->getPathname(), '/_valid/')) {
    $files[] = $file->getPathname();
  }
}
sort($files);
foreach ($files as $path) {
  $relative = substr($path, strlen(rtrim($fixtures, '/')) + 1);
  $row = ['file' => $relative];
  // Collect deprecations too: the parser reports some problems only that way.
  $notices = [];
  set_error_handler(function (int $level, string $message) use (&$notices) {
    $notices[] = $message;
    return TRUE;
  });
  try {
    $info = $parser->parse($path);
    $row['result'] = 'parsed';
    $row['type'] = $info['type'] ?? NULL;
    $row['name'] = $info['name'] ?? NULL;
    $row['core_incompatible'] = $info['core_incompatible'] ?? NULL;
  }
  catch (\Throwable $e) {
    $row['result'] = 'exception';
    $row['class'] = get_class($e);
    $row['message'] = str_replace($fixtures . '/', '', $e->getMessage());
  }
  finally {
    restore_error_handler();
  }
  if ($notices) {
    $row['notices'] = array_map(fn ($n) => str_replace($fixtures . '/', '', $n), $notices);
  }
  $out['results'][] = $row;
}
echo json_encode($out, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES), "\n";
