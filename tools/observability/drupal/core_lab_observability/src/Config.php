<?php

declare(strict_types=1);

namespace Drupal\core_lab_observability;

use Drupal\Core\Site\Settings;

/**
 * Reads the lab installer's settings block. Everything is off unless enabled.
 *
 * The block is written into sites/default/settings.php by
 * tools/observability/cli.mjs. Environment variables are deliberately not
 * used: DDEV's config.yaml is shared by both sides, and a per-environment
 * setting must not leak into the other environment.
 */
final class Config {

  /**
   * The raw settings.
   *
   * @var array<string, mixed>
   */
  private array $values;

  public function __construct() {
    $values = Settings::get('core_lab_observability', []);
    $this->values = is_array($values) ? $values : [];
  }

  public function enabled(): bool {
    return (bool) ($this->values['enabled'] ?? FALSE);
  }

  /**
   * Returns a setting with a default.
   */
  public function get(string $key, mixed $default = NULL): mixed {
    return $this->values[$key] ?? $default;
  }

  public function endpoint(): string {
    return trim((string) ($this->values['endpoint'] ?? ''));
  }

  public function environmentId(): string {
    return (string) ($this->values['environment'] ?? 'unknown');
  }

  public function side(): string {
    return (string) ($this->values['side'] ?? 'variant');
  }

  public function drupalCommit(): string {
    return (string) ($this->values['drupal_commit'] ?? '');
  }

  public function defaultRunId(): string {
    return (string) ($this->values['run_id'] ?? 'server');
  }

  public function sampleRatio(): float {
    $ratio = (float) ($this->values['sample_ratio'] ?? 1.0);
    return max(0.0, min(1.0, $ratio));
  }

  public function capture(string $name): bool {
    return (bool) ($this->values['capture'][$name] ?? TRUE);
  }

  public function privacy(string $name): bool {
    return (bool) ($this->values['privacy'][$name] ?? FALSE);
  }

  public function storageDir(): string {
    $dir = (string) ($this->values['storage']['directory'] ?? '');
    return $dir !== '' ? rtrim($dir, '/') : sys_get_temp_dir() . '/core-lab-observability';
  }

  /**
   * Whether the OpenTelemetry SDK is available in this checkout.
   */
  public function sdkAvailable(): bool {
    return class_exists(\OpenTelemetry\SDK\Trace\TracerProvider::class)
      && class_exists(\OpenTelemetry\Contrib\Otlp\SpanExporter::class);
  }

  /**
   * A human-readable status for the CLI and the response header.
   *
   * @return array{enabled: bool, sdk: bool, endpoint_configured: bool, endpoint: string, reason: ?string}
   */
  public function status(): array {
    $reason = NULL;
    if (!$this->sdkAvailable()) {
      $reason = 'The OpenTelemetry PHP SDK is not installed in this Drupal checkout. Drupal core dev requires it; run composer install with dev dependencies.';
    }
    elseif (!$this->enabled()) {
      $reason = 'Observability is disabled in settings.php.';
    }
    return [
      'enabled' => $this->enabled(),
      'sdk' => $this->sdkAvailable(),
      'endpoint_configured' => $this->endpoint() !== '',
      'endpoint' => $this->endpoint(),
      'reason' => $reason,
    ];
  }

}
