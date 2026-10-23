<?php

/**
 * @file
 * Compares three ways to check PHP files for errors without running them.
 *
 * - php -l: a separate process (needs proc_open or exec); parses and compiles.
 * - token_get_all($code, TOKEN_PARSE): in the current process; parses only.
 * - opcache_compile_file(): in the current process; parses and compiles, but
 *   needs OPcache enabled, reports a compile error as a fatal error (the
 *   process exit status becomes 255) and stores the script in OPcache memory.
 *
 * Usage:
 *   php -d opcache.enable_cli=1 php-check-methods.php
 * Prints JSON. Each method runs against the version of PHP running this file.
 */

declare(strict_types=1);

$samples = [
  'valid' => "<?php\nfunction infofix_ok() { return 1; }\n",
  'parse error (missing parameter)' => "<?php\nfunction infofix_help( {\n  return '';\n}\n",
  'parse error (unclosed brace)' => "<?php\nfunction infofix_help() {\n  return '';\n",
  'compile error: duplicate parameter' => "<?php\nfunction infofix_f(\$a, \$a) {}\n",
  'compile error: redeclared method' => "<?php\nclass InfofixA {\n  function f() {}\n  function f() {}\n}\n",
  'compile error: break outside a loop' => "<?php\nbreak;\n",
  'compile error: re-assign $this' => "<?php\nfunction infofix_g() { \$this = 1; }\n",
  'compile error: duplicate use alias' => "<?php\nuse Foo\\Bar;\nuse Baz\\Bar;\n",
  'runtime error only: undefined function' => "<?php\ninfofix_does_not_exist();\n",
];

$dir = sys_get_temp_dir() . '/php-check-methods-' . getmypid();
mkdir($dir);
$out = ['php' => PHP_VERSION, 'opcache_enabled' => function_exists('opcache_compile_file') && ini_get('opcache.enable_cli'), 'results' => []];
foreach ($samples as $label => $code) {
  $file = $dir . '/' . md5($label) . '.php';
  file_put_contents($file, $code);
  $row = ['sample' => $label];

  $process = proc_open([PHP_BINARY, '-n', '-l', $file], [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes);
  $output = stream_get_contents($pipes[1]) . stream_get_contents($pipes[2]);
  $exit = proc_close($process);
  $row['php -l'] = $exit === 0 ? 'no error' : 'error: ' . trim(preg_replace('/\s+/', ' ', str_replace($file, '<file>', strtok($output, "\n") ?: $output)));

  try {
    token_get_all($code, TOKEN_PARSE);
    $row['token_get_all'] = 'no error';
  }
  catch (\ParseError $e) {
    $row['token_get_all'] = 'error: ParseError line ' . $e->getLine() . ': ' . $e->getMessage();
  }

  if ($out['opcache_enabled']) {
    // A parse error is thrown as ParseError; a compile error is reported as a fatal error, compilation stops and this
    // script continues, but the process exit status becomes 255.
    ob_start();
    try {
      $ok = @opcache_compile_file($file);
      $error = error_get_last();
      $row['opcache_compile_file'] = $ok ? 'no error' : 'error: ' . str_replace($file, '<file>', $error['message'] ?? 'compile failed');
    }
    catch (\ParseError $e) {
      $row['opcache_compile_file'] = 'error: ParseError line ' . $e->getLine() . ': ' . $e->getMessage();
    }
    finally {
      ob_end_clean();
      error_clear_last();
    }
  }
  else {
    $row['opcache_compile_file'] = 'not run (OPcache disabled)';
  }
  $out['results'][] = $row;
  unlink($file);
}
rmdir($dir);
echo json_encode($out, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES), "\n";
