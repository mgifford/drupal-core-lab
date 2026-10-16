<?php

/**
 * @file
 * Measurement for the #3593502 repro: logs each request's peak PHP memory.
 *
 * Include it from sites/default/settings.php on BOTH sides (site configuration,
 * not code under test):
 *   include $app_root . '/recipes/repro_3593502/peak-memory.php';
 * Each web request then adds one line to the log, including the background
 * (AJAX) requests a lazy-loading interface makes and requests that die of a
 * fatal error such as "Allowed memory size exhausted":
 *   2026-10-16T12:00:00+00:00 GET 200 peak_mb=812.4 limit=256M /admin/structure/menu/manage/main
 *   2026-10-16T12:00:05+00:00 GET 500 peak_mb=256.0 limit=256M /admin/structure/menu/manage/main FATAL: Allowed memory size ...
 * The log is lab-peak-memory.log in the system temporary folder (/tmp in a DDEV
 * web container: `ddev exec cat /tmp/lab-peak-memory.log`), outside the web
 * root. One-time login paths are redacted. Command-line runs are not logged.
 */

if (PHP_SAPI !== 'cli') {
  register_shutdown_function(static function (): void {
    $e = error_get_last();
    $fatal = $e && in_array($e['type'], [E_ERROR, E_CORE_ERROR, E_COMPILE_ERROR], TRUE);
    @file_put_contents(
      sys_get_temp_dir() . '/lab-peak-memory.log',
      sprintf("%s %s %d peak_mb=%.1f limit=%s %s%s\n",
        date('c'), $_SERVER['REQUEST_METHOD'] ?? '?', $fatal ? 500 : http_response_code(),
        memory_get_peak_usage() / 1048576, ini_get('memory_limit'),
        preg_replace('#^/user/reset/.*#', '/user/reset/[redacted]', (string) strtok($_SERVER['REQUEST_URI'] ?? '', '?')),
        $fatal ? ' FATAL: ' . substr($e['message'], 0, 90) : ''),
      FILE_APPEND
    );
  });
}
