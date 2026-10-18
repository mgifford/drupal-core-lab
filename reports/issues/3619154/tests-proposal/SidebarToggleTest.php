<?php

declare(strict_types=1);

namespace Drupal\Tests\default_admin\FunctionalJavascript;

use Drupal\FunctionalJavascriptTests\WebDriverTestBase;
use Drupal\Tests\node\Traits\NodeCreationTrait;
use Drupal\Tests\node\Traits\ContentTypeCreationTrait;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;

/**
 * Tests the accessibility of the node edit form sidebar toggle (#3619154).
 *
 * Covers the behaviours MR !16911 adds that are not otherwise tested: the
 * toggle and close controls are <button> elements, the toggle's aria-expanded
 * tracks the state, the state and width persist across reloads, and below the
 * large breakpoint the covered content is inert, focus moves to the close
 * button and Escape closes the sidebar and returns focus to the toggle.
 */
#[Group('default_admin')]
#[RunTestsInSeparateProcesses]
final class SidebarToggleTest extends WebDriverTestBase {

  use ContentTypeCreationTrait;
  use NodeCreationTrait;

  /**
   * {@inheritdoc}
   */
  protected static $modules = ['node'];

  /**
   * {@inheritdoc}
   */
  protected $defaultTheme = 'default_admin';

  /**
   * The edit-form path of the node whose sidebar is tested.
   */
  protected string $editPath;

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();
    $this->createContentType(['type' => 'article', 'name' => 'Article']);
    $node = $this->createNode(['type' => 'article', 'title' => 'Sidebar toggle test']);
    $this->editPath = '/node/' . $node->id() . '/edit';
    $this->drupalLogin($this->drupalCreateUser([
      'access content',
      'edit any article content',
      'administer nodes',
    ]));
  }

  /**
   * The toggle and close controls are buttons; the toggle exposes its state.
   */
  public function testControlsAreButtons(): void {
    $this->getSession()->resizeWindow(1200, 900);
    $this->drupalGet($this->editPath);
    $assert = $this->assertSession();

    $toggle = $assert->waitForElementVisible('css', '.meta-sidebar__trigger');
    $this->assertNotNull($toggle, 'The sidebar toggle is present.');
    $this->assertSame('button', $toggle->getTagName(), 'The toggle is a <button>.');
    $this->assertTrue($toggle->hasAttribute('aria-expanded'), 'The toggle exposes aria-expanded.');

    $close = $this->getSession()->getPage()->find('css', '.meta-sidebar__close');
    $this->assertNotNull($close, 'The close control is present.');
    $this->assertSame('button', $close->getTagName(), 'The close control is a <button>.');
  }

  /**
   * Clicking the toggle flips aria-expanded and the state attribute.
   */
  public function testClickTogglesState(): void {
    $this->getSession()->resizeWindow(1200, 900);
    $this->drupalGet($this->editPath);
    $this->assertSession()->waitForElementVisible('css', '.meta-sidebar__trigger');

    // Default on a large viewport is open.
    $this->assertJsCondition("document.querySelector('.meta-sidebar__trigger').getAttribute('aria-expanded') === 'true'");
    $this->assertJsCondition("document.documentElement.getAttribute('data-meta-sidebar') === 'open'");

    // Collapse it.
    $this->click('.meta-sidebar__trigger');
    $this->assertJsCondition("document.querySelector('.meta-sidebar__trigger').getAttribute('aria-expanded') === 'false'");
    $this->assertJsCondition("document.documentElement.getAttribute('data-meta-sidebar') === 'closed'");
    $this->assertJsCondition("localStorage.getItem('Drupal.defaultAdmin.sidebarExpanded.desktop') === 'false'");

    // Open it again.
    $this->click('.meta-sidebar__trigger');
    $this->assertJsCondition("document.querySelector('.meta-sidebar__trigger').getAttribute('aria-expanded') === 'true'");
  }

  /**
   * The open/closed state and the width persist across a reload.
   */
  public function testStateAndWidthPersistAcrossReload(): void {
    $this->getSession()->resizeWindow(1200, 900);
    $this->drupalGet($this->editPath);
    $this->assertSession()->waitForElementVisible('css', '.meta-sidebar__trigger');

    // Collapse, then reload: it stays closed.
    $this->click('.meta-sidebar__trigger');
    $this->assertJsCondition("document.documentElement.getAttribute('data-meta-sidebar') === 'closed'");
    $this->getSession()->reload();
    $this->assertSession()->waitForElementVisible('css', '.meta-sidebar__trigger');
    $this->assertJsCondition("document.documentElement.getAttribute('data-meta-sidebar') === 'closed'");
    $this->assertJsCondition("document.querySelector('.meta-sidebar__trigger').getAttribute('aria-expanded') === 'false'");

    // Seed a stored width; after reload it is applied before paint.
    $this->getSession()->executeScript("localStorage.setItem('Drupal.defaultAdmin.sidebarWidth', '320px');");
    $this->getSession()->reload();
    $this->assertSession()->waitForElementVisible('css', '.meta-sidebar__trigger');
    $this->assertJsCondition("document.documentElement.style.getPropertyValue('--admin-theme-sidebar-width') === '320px'");
  }

  /**
   * Below the large breakpoint the sidebar is modal: inert, focus, Escape.
   */
  public function testOverlayInertFocusAndEscape(): void {
    // A small viewport, where the sidebar overlays the page.
    $this->getSession()->resizeWindow(900, 900);
    $this->drupalGet($this->editPath);
    $assert = $this->assertSession();
    $assert->waitForElementVisible('css', '.meta-sidebar__trigger');

    // Small viewports start closed; open the sidebar.
    $this->click('.meta-sidebar__trigger');
    $this->assertJsCondition("document.documentElement.getAttribute('data-meta-sidebar') === 'open'");

    // Content under the overlay is made inert, and focus moves to the close button.
    $this->assertJsCondition("document.querySelectorAll('[inert]').length > 0");
    $this->assertJsCondition("document.activeElement && document.activeElement.classList.contains('meta-sidebar__close')");

    // Escape closes the sidebar and returns focus to the toggle.
    $this->getSession()->executeScript("document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true, cancelable: true}));");
    $this->assertJsCondition("document.documentElement.getAttribute('data-meta-sidebar') === 'closed'");
    $this->assertJsCondition("document.activeElement && document.activeElement.classList.contains('meta-sidebar__trigger')");
  }

  /**
   * The close button is the first focusable element in the sidebar.
   */
  public function testCloseButtonIsFirstInSidebar(): void {
    $this->getSession()->resizeWindow(1200, 900);
    $this->drupalGet($this->editPath);
    $this->assertSession()->waitForElementVisible('css', '.meta-sidebar__trigger');

    $this->assertJsCondition(<<<'JS'
      (function () {
        var sb = document.getElementById('default_admin_sidebar');
        if (!sb) { return false; }
        var f = sb.querySelector('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
        return !!f && f.classList.contains('meta-sidebar__close');
      })()
      JS);
  }

}
