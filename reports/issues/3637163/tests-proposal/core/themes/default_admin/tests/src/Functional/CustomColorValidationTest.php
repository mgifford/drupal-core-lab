<?php

declare(strict_types=1);

namespace Drupal\Tests\default_admin\Functional;

use Drupal\Tests\BrowserTestBase;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;

/**
 * Tests the validation of the custom accent and focus colors.
 */
#[Group('default_admin')]
#[RunTestsInSeparateProcesses]
class CustomColorValidationTest extends BrowserTestBase {

  /**
   * {@inheritdoc}
   */
  protected $defaultTheme = 'default_admin';

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();

    $this->config('system.theme')
      ->set('default', 'default_admin')
      ->set('admin', 'default_admin')
      ->save();
    $this->drupalLogin($this->drupalCreateUser([
      'access administration pages',
      'administer themes',
    ]));
  }

  /**
   * Tests that invalid custom colors are rejected and valid ones are saved.
   */
  public function testCustomColorsAreValidated(): void {
    $path = '/admin/appearance/settings/default_admin';

    foreach (['777777', '#zzzzzz', '#12345', 'red'] as $invalid) {
      $this->drupalGet($path);
      $this->submitForm([
        'preset_accent_color' => 'custom',
        'accent_color' => $invalid,
      ], 'Save configuration');
      $this->assertSession()->pageTextContains('The custom accent color is not a valid hex color. Use six digits, for example #336699.');
      $this->assertNotSame($invalid, $this->config('default_admin.settings')->get('accent_color'));

      $this->drupalGet($path);
      $this->submitForm([
        'preset_focus_color' => 'custom',
        'focus_color' => $invalid,
      ], 'Save configuration');
      $this->assertSession()->pageTextContains('The custom focus color is not a valid hex color. Use six digits, for example #336699.');
      $this->assertNotSame($invalid, $this->config('default_admin.settings')->get('focus_color'));
    }

    // Longer values are stopped by the field's own maximum length.
    foreach (['#1234567', '#ff0000; color: transparent'] as $invalid) {
      $this->drupalGet($path);
      $this->submitForm([
        'preset_accent_color' => 'custom',
        'accent_color' => $invalid,
      ], 'Save configuration');
      $this->assertSession()->pageTextContains('cannot be longer than 7 characters');
      $this->assertNotSame($invalid, $this->config('default_admin.settings')->get('accent_color'));
    }

    $this->drupalGet($path);
    $this->submitForm([
      'preset_accent_color' => 'custom',
      'accent_color' => '#336699',
      'preset_focus_color' => 'custom',
      'focus_color' => '#AA5500',
    ], 'Save configuration');
    $this->assertSession()->pageTextContains('The configuration options have been saved.');
    $this->assertSame('#336699', $this->config('default_admin.settings')->get('accent_color'));
    $this->assertSame('#AA5500', $this->config('default_admin.settings')->get('focus_color'));
    $this->assertSession()->elementAttributeContains('css', 'html', 'style', '--accent-base: #336699;');
    $this->assertSession()->elementAttributeContains('css', 'html', 'data-admin-focus', 'custom');
  }

  /**
   * Tests that the field describes the accepted format and links the error.
   */
  public function testFieldDescribesFormat(): void {
    $this->drupalGet('/admin/appearance/settings/default_admin');
    $this->assertSession()->pageTextContains('Six-digit hex, for example #336699. Then check its color contrast.');
    $this->assertSession()->pageTextNotContains('Use with caution');
    $field = $this->assertSession()->fieldExists('accent_color');
    $this->assertSame('^#[a-fA-F0-9]{6}$', $field->getAttribute('pattern'));
  }

  /**
   * Tests that stored invalid values are never rendered into the page.
   */
  public function testStoredInvalidColorsFailSafely(): void {
    $this->config('default_admin.settings')
      ->set('preset_accent_color', 'custom')
      ->set('accent_color', '#ff0000; color: transparent')
      ->set('preset_focus_color', 'custom')
      ->set('focus_color', 'zzz')
      ->save();

    $response = $this->drupalGet('/admin/appearance/settings/default_admin');
    $this->assertSession()->statusCodeEquals(200);
    $this->assertStringNotContainsString('transparent', (string) $this->getSession()->getPage()->find('css', 'html')->getAttribute('style'));
    $this->assertSession()->elementAttributeContains('css', 'html', 'data-accent', 'blue');
    $this->assertSession()->elementAttributeContains('css', 'html', 'style', '--accent-base: #015efe;');
    $this->assertSession()->elementAttributeContains('css', 'html', 'data-admin-focus', 'default');
    $this->assertStringContainsString('"preset_focus_color":"default"', $response);
    $this->assertStringContainsString('"accent_color":""', $response);
  }

}
