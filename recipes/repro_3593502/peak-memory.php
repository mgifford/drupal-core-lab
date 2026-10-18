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
 *   2026-10-16T12:00:00+00:00 GET 200 peak_mb=812.4 allocated_peak_mb=816.0 duration_ms=3012.4 cpu_user_ms=2900.2 cpu_system_ms=71.4 limit=256M /admin/structure/menu/manage/main
 *   2026-10-16T12:00:05+00:00 GET 500 peak_mb=256.0 allocated_peak_mb=258.0 duration_ms=3250.1 cpu_user_ms=3100.0 cpu_system_ms=82.5 limit=256M /admin/structure/menu/manage/main FATAL: Allowed memory size ...
 * The log is lab-peak-memory.log in the system temporary folder (/tmp in a DDEV
 * web container: `ddev exec cat /tmp/lab-peak-memory.log`), outside the web
 * root. One-time login paths are redacted. Command-line runs are not logged.
 */

if (PHP_SAPI !== 'cli') {
  $lab_request_started = microtime(TRUE);
  $lab_request_usage = getrusage();
  register_shutdown_function(static function () use ($lab_request_started, $lab_request_usage): void {
    $e = error_get_last();
    $fatal = $e && in_array($e['type'], [E_ERROR, E_CORE_ERROR, E_COMPILE_ERROR], TRUE);
    $usage = getrusage();
    $user_ms = (($usage['ru_utime.tv_sec'] - $lab_request_usage['ru_utime.tv_sec']) * 1000)
      + (($usage['ru_utime.tv_usec'] - $lab_request_usage['ru_utime.tv_usec']) / 1000);
    $system_ms = (($usage['ru_stime.tv_sec'] - $lab_request_usage['ru_stime.tv_sec']) * 1000)
      + (($usage['ru_stime.tv_usec'] - $lab_request_usage['ru_stime.tv_usec']) / 1000);
    @file_put_contents(
      sys_get_temp_dir() . '/lab-peak-memory.log',
      sprintf("%s %s %d peak_mb=%.1f allocated_peak_mb=%.1f duration_ms=%.1f cpu_user_ms=%.1f cpu_system_ms=%.1f limit=%s %s%s\n",
        date('c'), $_SERVER['REQUEST_METHOD'] ?? '?', $fatal ? 500 : http_response_code(),
        memory_get_peak_usage() / 1048576, memory_get_peak_usage(TRUE) / 1048576,
        (microtime(TRUE) - $lab_request_started) * 1000, $user_ms, $system_ms,
        ini_get('memory_limit'),
        preg_replace('#^/user/reset/.*#', '/user/reset/[redacted]', (string) strtok($_SERVER['REQUEST_URI'] ?? '', '?')),
        $fatal ? ' FATAL: ' . substr($e['message'], 0, 90) : ''),
      FILE_APPEND
    );
  });
}
