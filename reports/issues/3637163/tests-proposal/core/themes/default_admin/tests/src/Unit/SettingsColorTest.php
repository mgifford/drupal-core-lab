<?php

declare(strict_types=1);

namespace Drupal\Tests\default_admin\Unit;

use Drupal\default_admin\Settings;
use Drupal\Tests\UnitTestCase;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;

/**
 * Tests the custom color check of the Default Admin settings.
 */
#[Group('default_admin')]
class SettingsColorTest extends UnitTestCase {

  /**
   * Tests Settings::isValidColor().
   */
  #[DataProvider('providerColors')]
  public function testIsValidColor(mixed $value, bool $expected): void {
    $this->assertSame($expected, Settings::isValidColor($value));
  }

  /**
   * Data provider for testIsValidColor().
   */
  public static function providerColors(): array {
    return [
      'lowercase' => ['#336699', TRUE],
      'uppercase' => ['#AABBCC', TRUE],
      'mixed case' => ['#aAbBcC', TRUE],
      'missing hash' => ['336699', FALSE],
      'three digits' => ['#369', FALSE],
      'five digits' => ['#12345', FALSE],
      'seven digits' => ['#1234567', FALSE],
      'not hexadecimal' => ['#zzzzzz', FALSE],
      'named color' => ['red', FALSE],
      'injected declaration' => ['#ff0000; color: transparent', FALSE],
      'trailing newline' => ["#336699\n", FALSE],
      'leading space' => [' #336699', FALSE],
      'empty' => ['', FALSE],
      'null' => [NULL, FALSE],
      'array' => [['#336699'], FALSE],
    ];
  }

}
