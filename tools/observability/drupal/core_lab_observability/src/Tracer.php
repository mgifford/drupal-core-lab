<?php

declare(strict_types=1);

namespace Drupal\core_lab_observability;

use Drupal\Core\Database\Database;
use Drupal\Core\Logger\LoggerChannelInterface;
use OpenTelemetry\API\Common\Time\Clock;
use OpenTelemetry\API\Trace\Propagation\TraceContextPropagator;
use OpenTelemetry\API\Trace\Span;
use OpenTelemetry\API\Trace\SpanInterface;
use OpenTelemetry\API\Trace\SpanKind;
use OpenTelemetry\API\Trace\StatusCode;
use OpenTelemetry\Context\Context;
use OpenTelemetry\Context\ContextInterface;
use OpenTelemetry\Contrib\Otlp\OtlpHttpTransportFactory;
use OpenTelemetry\Contrib\Otlp\SpanExporter;
use OpenTelemetry\SDK\Common\Attribute\Attributes;
use OpenTelemetry\SDK\Resource\ResourceInfo;
use OpenTelemetry\SDK\Trace\Sampler\ParentBased;
use OpenTelemetry\SDK\Trace\Sampler\TraceIdRatioBasedSampler;
use OpenTelemetry\SDK\Trace\SpanProcessor\BatchSpanProcessor;
use OpenTelemetry\SDK\Trace\TracerProvider;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Creates the server spans for one HTTP request and writes a request summary.
 *
 * The span tree is deliberately small and honest:
 * - http.server.request: route match to terminate;
 * - drupal.controller: controller arguments to view (controller + building the
 *   render array). This is not a controller-only measurement;
 * - drupal.render: view to response (rendering and response preparation).
 *
 * Database and cache activity are recorded as aggregate attributes, not as one
 * span per query. That keeps overhead bounded and avoids exporting SQL or
 * query arguments.
 */
final class Tracer {

  private ?TracerProvider $provider = NULL;

  private ?\OpenTelemetry\API\Trace\TracerInterface $tracer = NULL;

  private ?SpanInterface $root = NULL;

  private ?ContextInterface $rootContext = NULL;

  private ?SpanInterface $controllerSpan = NULL;

  private ?SpanInterface $renderSpan = NULL;

  private string $runId = 'server';

  private string $requestId = '';

  private string $startedAt = '';

  private float $started = 0.0;

  private bool $startedDbLog = FALSE;

  private bool $finished = FALSE;

  private bool $exportConfigured = FALSE;

  private ?string $exportError = NULL;

  private int $childCount = 0;

  private string $route = '';

  private string $controller = '';

  private string $path = '/';

  private string $method = 'GET';

  private int $status = 0;

  /**
   * Exception classes, with a count. Messages are never recorded.
   *
   * @var array<string, int>
   */
  private array $exceptions = [];

  public function __construct(
    private readonly Config $config,
    private readonly LoggerChannelInterface $logger,
  ) {}

  public function isEnabled(): bool {
    return $this->config->enabled() && $this->config->sdkAvailable();
  }

  public function onRequest(Request $request): void {
    if (!$this->isEnabled()) {
      return;
    }
    try {
      $this->started = microtime(TRUE);
      $this->startedAt = gmdate('Y-m-d\TH:i:s\Z');
      $this->method = $request->getMethod();
      $this->path = $this->redactPath($request->getPathInfo() ?: '/');
      $this->runId = $this->safeId($request->headers->get('x-core-lab-run') ?: $this->config->defaultRunId());
      $this->requestId = $this->safeId($request->headers->get('x-core-lab-request') ?: '');
      $this->route = (string) ($request->attributes->get('_route') ?? '');
      $this->controller = (string) ($request->attributes->get('_controller') ?? '');
      $this->provider = $this->buildProvider();
      if ($this->provider === NULL) {
        return;
      }
      $this->tracer = $this->provider->getTracer('core-lab-observability', '1.0.0');
      $parent = $this->extractParent($request);
      $span = $this->tracer->spanBuilder($this->method . ' ' . $this->path)
        ->setSpanKind(SpanKind::KIND_SERVER)
        ->setParent($parent)
        ->setAttributes($this->requestAttributes($request))
        ->startSpan();
      $this->root = $span;
      $this->rootContext = $parent->withContextValue(Span::wrap($span->getContext()));
      if ($this->config->capture('database')) {
        Database::startLog('core_lab_observability');
        $this->startedDbLog = TRUE;
      }
    }
    catch (\Throwable $e) {
      $this->exportError = 'request instrumentation failed: ' . $e->getMessage();
      $this->logger->warning('Core Lab observability could not start a request span: @message', ['@message' => $e->getMessage()]);
      $this->root = NULL;
      $this->tracer = NULL;
    }
  }

  public function onControllerArguments(): void {
    if (!$this->tracer || !$this->rootContext) {
      return;
    }
    try {
      $this->controllerSpan = $this->tracer->spanBuilder('drupal.controller')
        ->setParent($this->rootContext)
        ->setSpanKind(SpanKind::KIND_INTERNAL)
        ->setAttributes(array_filter([
          'drupal.route' => $this->route,
          'drupal.controller' => $this->controller,
        ], static fn ($v): bool => $v !== ''))
        ->startSpan();
      $this->childCount++;
    }
    catch (\Throwable $e) {
      $this->logger->warning('Core Lab observability could not start the controller span: @message', ['@message' => $e->getMessage()]);
    }
  }

  public function onView(): void {
    $this->endControllerSpan();
    if (!$this->tracer || !$this->rootContext) {
      return;
    }
    try {
      $this->renderSpan = $this->tracer->spanBuilder('drupal.render')
        ->setParent($this->rootContext)
        ->setSpanKind(SpanKind::KIND_INTERNAL)
        ->setAttributes(['drupal.route' => $this->route])
        ->startSpan();
      $this->childCount++;
    }
    catch (\Throwable $e) {
      $this->logger->warning('Core Lab observability could not start the render span: @message', ['@message' => $e->getMessage()]);
    }
  }

  public function onResponse(Response $response): void {
    if (!$this->isEnabled()) {
      $response->headers->set('X-Core-Lab-Observability', 'disabled');
      return;
    }
    $this->endControllerSpan();
    $this->endRenderSpan();
    $this->status = $response->getStatusCode();
    if (!$this->root) {
      $response->headers->set('X-Core-Lab-Observability', 'unavailable');
      return;
    }
    try {
      $this->root->setAttribute('http.response.status_code', $this->status);
      $this->root->setAttribute('drupal.span.count', 1 + $this->childCount);
      $context = $this->root->getContext();
      $response->headers->set('X-Core-Lab-Trace-Id', $context->getTraceId());
      $response->headers->set('X-Core-Lab-Root-Span-Id', $context->getSpanId());
      $response->headers->set('X-Core-Lab-Request-Id', $this->requestId);
      $response->headers->set('X-Core-Lab-Observability', 'enabled');
      $response->headers->set('X-Core-Lab-Export', $this->exportConfigured ? 'configured' : 'local-only');
      $response->headers->set('X-Core-Lab-Span-Count', (string) (1 + $this->childCount));
    }
    catch (\Throwable $e) {
      $this->logger->warning('Core Lab observability could not annotate the response: @message', ['@message' => $e->getMessage()]);
    }
  }

  /**
   * Called from Symfony's terminate event, after the response has been sent.
   */
  public function onTerminate(): void {
    if ($this->finished) {
      return;
    }
    $this->finished = TRUE;
    $db = $this->summariseDatabase();
    $export = [
      'status' => $this->exportConfigured ? 'unknown' : 'disabled',
      'endpoint_configured' => $this->exportConfigured,
      'error' => $this->exportError,
    ];
    try {
      if ($this->root) {
        $this->root->setAttributes([
          'drupal.db.query_count' => $db['query_count'],
          'drupal.db.query_duration_ms' => $db['total_ms'],
          'drupal.db.cache_query_count' => $db['cache_query_count'],
          'drupal.db.cache_write_count' => $db['cache_write_count'],
          'drupal.span.count' => 1 + $this->childCount,
        ]);
        if ($this->exceptions) {
          $this->root->setStatus(StatusCode::STATUS_ERROR, 'exception recorded; see the request summary');
        }
        $this->root->end();
      }
      if ($this->provider) {
        $flushed = $this->provider->forceFlush();
        if ($this->exportConfigured) {
          $export['status'] = $flushed ? 'exported' : 'failed';
        }
        $this->provider->shutdown();
      }
    }
    catch (\Throwable $e) {
      $this->exportError = $e->getMessage();
      $export['status'] = $this->exportConfigured ? 'failed' : $export['status'];
      $this->logger->warning('Core Lab observability could not finish the trace: @message', ['@message' => $e->getMessage()]);
    }
    $this->writeSummary($db, $export);
  }

  public function onException(\Throwable $exception): void {
    if (!$this->isEnabled()) {
      return;
    }
    $class = $exception::class;
    $this->exceptions[$class] = ($this->exceptions[$class] ?? 0) + 1;
    try {
      $this->root?->setStatus(StatusCode::STATUS_ERROR, 'exception recorded');
    }
    catch (\Throwable $e) {
      // Never let tracing turn an application error into a different error.
    }
  }

  /**
   * Builds the TracerProvider, or returns NULL with an explanation.
   */
  private function buildProvider(): ?TracerProvider {
    try {
      $resource = ResourceInfo::create(Attributes::create(array_filter([
        'service.name' => 'drupal-core-lab',
        'service.namespace' => 'drupal-core-lab',
        'deployment.environment.name' => $this->config->environmentId(),
        'drupal.version' => \Drupal::VERSION,
        'drupal.core.commit' => $this->config->drupalCommit(),
        'core_lab.environment.id' => $this->config->environmentId(),
        'core_lab.side' => $this->config->side(),
      ], static fn ($v): bool => $v !== '' && $v !== NULL)));
      $processors = [new SpanRecorder($this->config, $this->runId)];
      $endpoint = rtrim($this->config->endpoint(), '/');
      // Accept both "http://host:4318" (the OTLP default) and the full signal URL.
      if ($endpoint !== '' && (parse_url($endpoint, PHP_URL_PATH) ?: '') === '') {
        $endpoint .= '/v1/traces';
      }
      if ($endpoint !== '') {
        $transport = (new OtlpHttpTransportFactory())->create($endpoint, 'application/x-protobuf', [], NULL, 1.0, 100, 0);
        $processors[] = new BatchSpanProcessor(new SpanExporter($transport), Clock::getDefault(), 2048, 500, 1500, 512, FALSE);
        $this->exportConfigured = TRUE;
      }
      return new TracerProvider(
        $processors,
        new ParentBased(new TraceIdRatioBasedSampler($this->config->sampleRatio())),
        $resource,
      );
    }
    catch (\Throwable $e) {
      $this->exportError = 'could not create the OpenTelemetry provider: ' . $e->getMessage();
      $this->logger->warning('Core Lab observability is enabled but cannot export: @message', ['@message' => $e->getMessage()]);
      return NULL;
    }
  }

  /**
   * Extracts the W3C trace context sent by the browser, if any.
   */
  private function extractParent(Request $request): ContextInterface {
    $carrier = [];
    foreach (['traceparent', 'tracestate'] as $header) {
      $value = $request->headers->get($header);
      if ($value !== NULL && $value !== '') {
        $carrier[$header] = $value;
      }
    }
    if (!$carrier) {
      return Context::getCurrent();
    }
    try {
      return TraceContextPropagator::getInstance()->extract($carrier);
    }
    catch (\Throwable $e) {
      // A malformed header starts a new trace instead of failing the request.
      return Context::getCurrent();
    }
  }

  /**
   * Attributes safe to export. No headers, cookies, cookies' values or bodies.
   *
   * @return array<string, mixed>
   */
  private function requestAttributes(Request $request): array {
    $attributes = [
      'http.request.method' => $this->method,
      'url.path' => $this->path,
      'url.scheme' => $request->getScheme(),
      'url.query.parameter_count' => $request->query->count(),
      'drupal.version' => \Drupal::VERSION,
      'drupal.run.id' => $this->runId,
      'drupal.side' => $this->config->side(),
      'drupal.environment.id' => $this->config->environmentId(),
      'drupal.user.authenticated' => \Drupal::currentUser()->isAuthenticated(),
    ];
    if ($this->requestId !== '') {
      $attributes['drupal.request.id'] = $this->requestId;
    }
    $action = $request->headers->get('x-core-lab-action');
    if ($action) {
      $attributes['drupal.action.id'] = $this->safeId($action);
    }
    if ($this->route !== '') {
      $attributes['drupal.route'] = $this->route;
      $attributes['http.route'] = $this->route;
    }
    if ($this->controller !== '') {
      $attributes['drupal.controller'] = $this->controller;
    }
    return $attributes;
  }

  private function endControllerSpan(): void {
    if (!$this->controllerSpan) {
      return;
    }
    try {
      $this->controllerSpan->end();
    }
    catch (\Throwable $e) {
      // Ignore: an ended span must not break the request.
    }
    $this->controllerSpan = NULL;
  }

  private function endRenderSpan(): void {
    if (!$this->renderSpan) {
      return;
    }
    try {
      $this->renderSpan->end();
    }
    catch (\Throwable $e) {
      // Ignore.
    }
    $this->renderSpan = NULL;
  }

  /**
   * Aggregates the database query log. SQL text and arguments are not kept.
   *
   * @return array<string, mixed>
   */
  private function summariseDatabase(): array {
    $queries = [];
    if ($this->startedDbLog) {
      try {
        $queries = Database::getLog('core_lab_observability');
      }
      catch (\Throwable $e) {
        $queries = [];
      }
      $this->startedDbLog = FALSE;
    }
    $count = count($queries);
    $total = 0.0;
    $slowest = 0.0;
    $targets = [];
    $tables = [];
    $cacheQueries = 0;
    $cacheWrites = 0;
    foreach ($queries as $query) {
      $ms = ((float) ($query['time'] ?? 0)) * 1000;
      $total += $ms;
      $slowest = max($slowest, $ms);
      $target = (string) ($query['target'] ?? 'default');
      $targets[$target] = ($targets[$target] ?? 0) + 1;
      $sql = (string) ($query['query'] ?? '');
      $names = $this->tablesOf($sql);
      foreach ($names as $table) {
        $tables[$table] = TRUE;
      }
      foreach ($names as $table) {
        if ($this->isCacheTable($table)) {
          $cacheQueries++;
          if (preg_match('/^\s*(INSERT|UPDATE|DELETE|REPLACE|TRUNCATE|CREATE|DROP|ALTER)\b/i', $sql)) {
            $cacheWrites++;
          }
          break;
        }
      }
    }
    ksort($tables);
    return [
      'query_count' => $count,
      'total_ms' => round($total, 3),
      'slowest_ms' => $count ? round($slowest, 3) : NULL,
      'targets' => $targets,
      'tables' => array_keys($tables),
      'cache_query_count' => $cacheQueries,
      'cache_write_count' => $cacheWrites,
    ];
  }

  /**
   * Writes one JSON line for this request, read by tools/observability/cli.mjs.
   *
   * @param array<string, mixed> $db
   * @param array<string, mixed> $export
   */
  private function writeSummary(array $db, array $export): void {
    $dir = $this->config->storageDir();
    if (!is_dir($dir) && !@mkdir($dir, 0700, TRUE) && !is_dir($dir)) {
      return;
    }
    $summary = [
      'request_id' => $this->requestId,
      'trace_id' => $this->root?->getContext()->getTraceId(),
      'root_span_id' => $this->root?->getContext()->getSpanId(),
      'name' => $this->method . ' ' . $this->path,
      'method' => $this->method,
      'path' => $this->path,
      'route' => $this->route,
      'controller' => $this->controller,
      'status' => $this->status,
      'started_at' => $this->startedAt,
      'duration_ms' => round(max(0, microtime(TRUE) - $this->started) * 1000, 3),
      'span_count' => $this->root ? 1 + $this->childCount : 0,
      'db' => $db,
      'exceptions' => array_map(
        static fn (string $class, int $count): array => ['class' => $class, 'code' => NULL, 'count' => $count],
        array_keys($this->exceptions),
        array_values($this->exceptions),
      ),
      'export' => $export,
      'run_id' => $this->runId,
      'side' => $this->config->side(),
      'environment' => $this->config->environmentId(),
    ];
    $json = json_encode($summary, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    if ($json === FALSE) {
      return;
    }
    $file = $dir . '/requests-' . $this->runId . '.jsonl';
    $new = !file_exists($file);
    if (@file_put_contents($file, $json . "\n", FILE_APPEND | LOCK_EX) !== FALSE && $new) {
      @chmod($file, 0600);
    }
  }

  /**
   * @return list<string>
   */
  private function tablesOf(string $sql): array {
    $names = [];
    if (preg_match_all('/\b(?:FROM|JOIN|INTO|UPDATE)\s+[{`"\[\]]?([A-Za-z0-9_]+)[}`"\[\]]?/i', $sql, $matches)) {
      foreach ($matches[1] as $name) {
        if (!preg_match('/^(SELECT|WHERE|SET|VALUES|ON|AS)$/i', $name)) {
          $names[$name] = TRUE;
        }
      }
    }
    return array_keys($names);
  }

  private function isCacheTable(string $table): bool {
    return (bool) preg_match('/^cache(_|$)/', $table) || in_array($table, ['cachetags', 'semaphore', 'key_value'], TRUE);
  }

  /**
   * Removes a one-time login token from the path before it reaches any file.
   */
  private function redactPath(string $path): string {
    return (string) preg_replace('#^/user/reset/\d+/\d+/[^/]+/login$#', '/user/reset/[uid]/[timestamp]/[token]/login', $path);
  }

  private function safeId(string $value): string {
    $value = trim((string) preg_replace('/[^A-Za-z0-9._-]/', '-', $value));
    $value = trim((string) preg_replace('/-+/', '-', $value), '-');
    return $value === '' ? 'server' : substr($value, 0, 120);
  }

}
