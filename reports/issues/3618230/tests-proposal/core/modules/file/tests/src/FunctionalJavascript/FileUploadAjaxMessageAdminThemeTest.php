<?php

declare(strict_types=1);

namespace Drupal\Tests\file\FunctionalJavascript;

use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;

/**
 * Tests the messages of a file widget's AJAX upload in the admin theme.
 */
#[Group('file')]
#[RunTestsInSeparateProcesses]
class FileUploadAjaxMessageAdminThemeTest extends FileUploadAjaxMessageTest {

  /**
   * {@inheritdoc}
   */
  protected $defaultTheme = 'default_admin';

  /**
   * Tests that the theme's message markup is not filtered out.
   *
   * The theme renders a dismiss button in each message. Messages placed in
   * the replaced markup lose it to the admin XSS filter.
   */
  public function testErrorKeepsThemeMarkup(): void {
    $this->drupalGet('node/add/article');
    $this->uploadTestFile(TRUE);
    $this->assertSame(1, $this->waitForErrorCount(1));
    $error = $this->getSession()->getPage()->find('css', '.messages--error');
    $this->assertNotNull($error);
    $this->assertNotNull($error->find('css', 'button.js-message-button-hide'), 'The error keeps its dismiss button.');
  }

}
