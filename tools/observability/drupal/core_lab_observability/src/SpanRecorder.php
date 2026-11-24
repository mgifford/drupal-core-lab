<?php

declare(strict_types=1);

namespace Drupal\core_lab_observability;

use OpenTelemetry\Context\ContextInterface;
use OpenTelemetry\SDK\Common\Future\CancellationInterface;
use OpenTelemetry\SDK\Trace\ReadableSpanInterface;
use OpenTelemetry\SDK\Trace\ReadWriteSpanInterface;
use OpenTelemetry\SDK\Trace\SpanProcessorInterface;

/**
 * Writes finished spans to a local NDJSON file, independently of any collector.
 *
 * This is the lab's durable evidence path: a diagnostic run still has real
 * OpenTelemetry spans when no collector is running, and the OTLP export can be
 * checked against this file. The file lives in the container's temporary
 * directory, is not web-accessible, and is copied to the report only after the
 * allow-list sanitisation below.
 */
final class SpanRecorder implements SpanProcessorInterface {

  /**
   * Attributes that may be written to the evidence file.
   *
   * A list, not a deny-list: new instrumentation attributes are dropped until
   * someone deliberately adds them here.
   *
   * @var list<string>
   */
  private const SAFE_ATTRIBUTES = [
    'http.request.method',
    'http.response.status_code',
    'url.path',
    'url.scheme',
    'url.query.parameter_count',
    'http.route',
    'drupal.route',
    'drupal.controller',
    'drupal.version',
    'drupal.site_path',
    'drupal.run.id',
    'drupal.side',
    'drupal.environment.id',
    'drupal.action.id',
    'drupal.request.id',
    'drupal.user.authenticated',
    'drupal.db.query_count',
    'drupal.db.query_duration_ms',
    'drupal.db.cache_query_count',
    'drupal.db.cache_write_count',
    'drupal.span.count',
    'core_lab.run.id',
    'core_lab.side',
    'core_lab.environment.id',
    'core_lab.action.id',
    'core_lab.request.id',
    'service.name',
    'deployment.environment.name',
  ];

  private const SAFE_RESOURCE_ATTRIBUTES = [
    'service.name',
    'service.namespace',
    'deployment.environment.name',
    'drupal.version',
    'drupal.core.commit',
    'core_lab.environment.id',
    'core_lab.side',
  ];

  public function __construct(
    private readonly Config $config,
    private readonly string $runId,
  ) {}

  public function onStart(ReadWriteSpanInterface $span, ContextInterface $parentContext): void {}

  public function onEnd(ReadableSpanInterface $span): void {
    if (!$this->config->enabled()) {
      return;
    }
    $data = $span->toSpanData();
    $start = $data->getStartEpochNanos();
    $end = $data->getEndEpochNanos();
    $record = [
      'trace_id' => $data->getTraceId(),
      'span_id' => $data->getSpanId(),
      'parent_span_id' => $data->getParentSpanId(),
      'name' => $data->getName(),
      'kind' => $data->getKind(),
      'start_time_unix_nano' => $start,
      'end_time_unix_nano' => $end,
      'duration_ms' => round(max(0, $end - $start) / 1_000_000, 3),
      'attributes' => $this->safeAttributes($data->getAttributes()->toArray()),
      'status' => [
        'code' => $data->getStatus()->getCode(),
        'description' => $data->getStatus()->getDescription(),
      ],
      'events_count' => count($data->getEvents()),
      'links_count' => count($data->getLinks()),
      'resource' => $this->safeAttributes($data->getResource()->getAttributes()->toArray(), self::SAFE_RESOURCE_ATTRIBUTES),
      'scope' => [
        'name' => $data->getInstrumentationScope()->getName(),
        'version' => $data->getInstrumentationScope()->getVersion(),
      ],
    ];
    $json = json_encode($record, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    if ($json === FALSE) {
      return;
    }
    $dir = $this->config->storageDir();
    if (!is_dir($dir) && !@mkdir($dir, 0700, TRUE) && !is_dir($dir)) {
      return;
    }
    $file = $dir . '/spans-' . $this->runId . '.jsonl';
    $new = !file_exists($file);
    if (@file_put_contents($file, $json . "\n", FILE_APPEND | LOCK_EX) !== FALSE && $new) {
      @chmod($file, 0600);
    }
  }

  public function forceFlush(?CancellationInterface $cancellation = NULL): bool {
    return TRUE;
  }

  public function shutdown(?CancellationInterface $cancellation = NULL): bool {
    return TRUE;
  }

  /**
   * Keeps scalar values and arrays of scalars for allowed keys only.
   *
   * @param array<string, mixed> $attributes
   * @param list<string>|null $allow
   *
   * @return array<string, mixed>
   */
  private function safeAttributes(array $attributes, ?array $allow = NULL): array {
    $allow ??= self::SAFE_ATTRIBUTES;
    $out = [];
    foreach ($attributes as $key => $value) {
      if (!is_string($key) || !in_array($key, $allow, TRUE)) {
        continue;
      }
      if (is_bool($value) || is_int($value) || is_float($value)) {
        $out[$key] = $value;
      }
      elseif (is_string($value)) {
        $out[$key] = mb_substr($value, 0, 300);
      }
      elseif (is_array($value)) {
        $scalars = array_values(array_filter($value, static fn ($v): bool => is_bool($v) || is_int($v) || is_float($v) || is_string($v)));
        $out[$key] = array_map(static fn ($v) => is_string($v) ? mb_substr($v, 0, 120) : $v, array_slice($scalars, 0, 50));
      }
    }
    return $out;
  }

}
