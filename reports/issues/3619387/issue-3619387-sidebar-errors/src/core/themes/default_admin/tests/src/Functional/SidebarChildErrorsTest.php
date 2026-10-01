<?php

declare(strict_types=1);

namespace Drupal\Tests\default_admin\Functional;

use Drupal\Tests\BrowserTestBase;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;

/**
 * Tests that the forms sidebar indicates child element errors.
 *
 * @see https://www.drupal.org/project/drupal/issues/3619387
 */
#[Group('default_admin')]
#[RunTestsInSeparateProcesses]
class SidebarChildErrorsTest extends BrowserTestBase {

  /**
   * {@inheritdoc}
   */
  protected static $modules = [
    'node',
    'path',
    'toolbar',
  ];

  /**
   * {@inheritdoc}
   */
  protected $defaultTheme = 'stark';

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();

    $this->container->get('theme_installer')->install(['default_admin']);
    $this->config('system.theme')
      ->set('default', 'default_admin')
      ->set('admin', 'default_admin')
      ->save();

    $this->drupalCreateContentType(['type' => 'article', 'name' => 'Article']);

    $admin_user = $this->drupalCreateUser([
      'access administration pages',
      'access toolbar',
      'administer content types',
      'create article content',
      'edit own article content',
      'administer url aliases',
    ]);
    $this->drupalLogin($admin_user);
  }

  /**
   * Tests the sidebar toggle indicates a child error after a failed submit.
   */
  public function testSidebarIndicatesChildErrors(): void {
    $this->drupalGet('node/add/article');
    $this->submitForm([
      'title[0][value]' => 'Test article',
      'path[0][alias]' => 'about',
    ], 'Save');

    // The invalid alias must produce a validation error.
    $this->assertSession()->pageTextContains('The alias path has to start with a slash');

    // The closed sidebar toggle must indicate there are child errors.
    $this->assertSession()->elementExists('css', 'a.meta-sidebar__trigger.has-error');
  }

}
