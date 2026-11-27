<?php

declare(strict_types=1);

namespace Drupal\Tests\file\FunctionalJavascript;

use Drupal\FunctionalJavascriptTests\WebDriverTestBase;
use Drupal\Tests\TestFileCreationTrait;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;

/**
 * Tests the conditional states of managed file elements.
 *
 * The fixture form (file_test_states module) has three independent triggers
 * (toggle, toggle_required, toggle_disabled) so that visibility, requirement
 * and disabled behavior can be exercised without one masking another. It
 * places managed files in details, fieldset and container elements and keeps
 * unrelated controls and managed files without states next to them.
 *
 * Elements are located by their form item class (js-form-item-<name>) and by
 * the control's name, never by an ID after an AJAX replacement: the form is
 * rebuilt for the AJAX response and element IDs get a unique suffix then.
 */
#[Group('file')]
#[RunTestsInSeparateProcesses]
class FileManagedStateTest extends WebDriverTestBase {

  use TestFileCreationTrait;

  /**
   * {@inheritdoc}
   */
  protected static $modules = ['file_test_states', 'file'];

  /**
   * {@inheritdoc}
   */
  protected $defaultTheme = 'stark';

  /**
   * Opens the fixture form.
   */
  private function openForm(): void {
    $this->drupalLogin($this->drupalCreateUser());
    $this->drupalGet('file-test-states-form');
    $this->assertSession()->waitForElementVisible('css', '#edit-toggle');
  }

  /**
   * Returns the CSS selector of a managed file element's form item.
   */
  private function item(string $name): string {
    return '.js-form-item-' . str_replace('_', '-', $name);
  }

  /**
   * Returns the CSS selector of a managed file element's file input.
   */
  private function fileInputSelector(string $name, bool $multiple = FALSE): string {
    return 'input[name="files[' . $name . ']' . ($multiple ? '[]' : '') . '"]';
  }

  /**
   * Asserts that a CSS selector matches a visible element.
   */
  private function assertVisible(string $selector, string $message = ''): void {
    $element = $this->getSession()->getPage()->find('css', $selector);
    $this->assertNotNull($element, $message ?: "No element matches $selector.");
    $this->assertTrue($element->isVisible(), $message ?: "$selector is not visible.");
  }

  /**
   * Asserts that a CSS selector matches an element that is not visible.
   */
  private function assertHidden(string $selector, string $message = ''): void {
    $element = $this->getSession()->getPage()->find('css', $selector);
    $this->assertNotNull($element, $message ?: "No element matches $selector.");
    $this->assertFalse($element->isVisible(), $message ?: "$selector is visible when it should be hidden.");
  }

  /**
   * Uploads a test file of the given type to a managed file element.
   *
   * @param string $field
   *   The field locator Mink understands, for example "files[single_required]"
   *   or "files[multi_required][]".
   * @param string $type
   *   The test file type passed to getTestFiles(), for example "text".
   */
  private function uploadFile(string $field, string $type = 'text'): void {
    $file = $this->getTestFiles($type)[0];
    $path = \Drupal::service('file_system')->realpath($file->uri);
    $this->getSession()->getPage()->attachFileToField($field, $path);
    $this->assertSession()->assertWaitOnAjaxRequest();
  }

  /**
   * Removes the last file of a managed file element.
   */
  private function removeFile(string $name): void {
    $button = $this->getSession()->getPage()->find('css', $this->item($name) . ' input[name="' . $name . '_remove_button"]');
    $this->assertNotNull($button, "The remove button of $name was not rendered.");
    $button->click();
    $this->assertSession()->assertWaitOnAjaxRequest();
  }

  /**
   * Toggles a checkbox off and on, so that states.js re-evaluates its targets.
   */
  private function retrigger(string $field): void {
    $page = $this->getSession()->getPage();
    $page->uncheckField($field);
    $page->checkField($field);
  }

  /**
   * Checks that the JS state handlers are attached to the form.
   */
  private function assertStatesAttached(): void {
    $this->assertSession()->elementExists('css', '[data-drupal-states]');
  }

  /**
   * Tests conditional visibility on load and after each transition.
   */
  public function testConditionalVisibility(): void {
    $this->openForm();
    $this->assertStatesAttached();
    $page = $this->getSession()->getPage();

    // On load: the element whose visible state is false is hidden, and its
    // label, description and wrapper with it.
    $this->assertVisible($this->item('managed_file_initially_visible'));
    $this->assertHidden($this->item('managed_file_initially_hidden'));

    // A managed file with no states is untouched.
    $this->assertVisible($this->item('no_states_file'));
    $this->assertTrue($page->find('css', $this->fileInputSelector('no_states_file'))->isVisible());

    // Toggle on: the states swap.
    $page->checkField('toggle');
    $this->assertHidden($this->item('managed_file_initially_visible'));
    $this->assertVisible($this->item('managed_file_initially_hidden'));
    $this->assertVisible($this->item('multi_visible'));

    // Toggle off again, then on, to test repeated transitions.
    $page->uncheckField('toggle');
    $this->assertVisible($this->item('managed_file_initially_visible'));
    $this->assertHidden($this->item('managed_file_initially_hidden'));
    $page->checkField('toggle');
    $this->assertHidden($this->item('managed_file_initially_visible'));
    $this->assertVisible($this->item('managed_file_initially_hidden'));
  }

  /**
   * Tests conditional requirement and the inverse optional state.
   */
  public function testConditionalRequirement(): void {
    $this->openForm();
    $page = $this->getSession()->getPage();
    $item = $this->item('single_required');

    // On load the requirement trigger is unchecked, so no marker is rendered.
    $this->assertSession()->elementNotExists('css', $item . ' label.form-required');
    $this->assertFalse($page->find('css', $this->fileInputSelector('single_required'))->hasAttribute('required'));

    // The inverse state: "optional" is applied on load, so no marker either.
    $this->assertSession()->elementNotExists('css', $this->item('single_optional_inverse') . ' label.form-required');

    $page->checkField('toggle_required');

    // A marker on the label of the upload control, and the required attribute
    // on the control itself.
    foreach (['single_required', 'multi_required', 'combined'] as $name) {
      $this->assertSession()->elementExists('css', $this->item($name) . ' label.form-required');
      $this->assertTrue($page->find('css', $this->fileInputSelector($name, $name === 'multi_required'))->hasAttribute('required'));
    }
    $this->assertSession()->elementExists('css', '.js-form-item-managed-file-in-fieldset label.form-required');

    // The inverse optional state is now negated, so the element is required.
    $this->assertSession()->elementExists('css', $this->item('single_optional_inverse') . ' label.form-required');

    // A managed file without states is not made required.
    $this->assertSession()->elementNotExists('css', $this->item('no_states_file') . ' label.form-required');
    $this->assertFalse($page->find('css', $this->fileInputSelector('no_states_file'))->hasAttribute('required'));

    $page->uncheckField('toggle_required');
    $this->assertSession()->elementNotExists('css', $item . ' label.form-required');
    $this->assertFalse($page->find('css', $this->fileInputSelector('single_required'))->hasAttribute('required'));
  }

  /**
   * Tests conditional disabled behavior on the interactive controls.
   */
  public function testConditionalDisabled(): void {
    $this->openForm();
    $page = $this->getSession()->getPage();

    $this->assertFalse($page->find('css', $this->fileInputSelector('single_disabled'))->hasAttribute('disabled'));
    $this->assertFalse($page->find('css', $this->fileInputSelector('multi_disabled', TRUE))->hasAttribute('disabled'));

    $page->checkField('toggle_disabled');

    // The file inputs are disabled, not just their wrapper.
    $this->assertTrue($page->find('css', $this->fileInputSelector('single_disabled'))->hasAttribute('disabled'));
    $this->assertTrue($page->find('css', $this->fileInputSelector('multi_disabled', TRUE))->hasAttribute('disabled'));
    $this->assertTrue($page->find('css', $this->item('single_disabled') . ' input[name="single_disabled_upload_button"]')->hasAttribute('disabled'));

    // A managed file without states stays enabled.
    $this->assertFalse($page->find('css', $this->fileInputSelector('no_states_file'))->hasAttribute('disabled'));

    $page->uncheckField('toggle_disabled');
    $this->assertFalse($page->find('css', $this->fileInputSelector('single_disabled'))->hasAttribute('disabled'));
  }

  /**
   * Tests managed files inside details, fieldset and container elements.
   */
  public function testGroupingElementsAreNotHidden(): void {
    $this->openForm();
    $page = $this->getSession()->getPage();

    // The managed file inside details starts hidden, but that must not hide
    // the details element or its other children.
    $this->assertHidden($this->item('managed_file_in_details'));
    $this->assertVisible('#edit-textfield-in-details');
    $this->assertVisible($this->item('unrelated_in_details'));
    $this->assertVisible('#edit-details');

    $page->checkField('toggle');

    $this->assertVisible($this->item('managed_file_in_details'));
    $this->assertVisible('#edit-textfield-in-details');
    $this->assertVisible($this->item('unrelated_in_details'));
    $this->assertVisible('#edit-details');

    // Hiding it again must leave the group alone.
    $page->uncheckField('toggle');
    $this->assertHidden($this->item('managed_file_in_details'));
    $this->assertVisible('#edit-textfield-in-details');
    $this->assertVisible('#edit-details');

    // The container behaves the same way.
    $this->assertHidden($this->item('managed_file_in_container'));
    $page->checkField('toggle');
    $this->assertVisible($this->item('managed_file_in_container'));
    $this->assertVisible('#edit-textfield-in-container');
    $page->uncheckField('toggle');
    $this->assertHidden($this->item('managed_file_in_container'));
    $this->assertVisible('#edit-textfield-in-container');

    // The fieldset keeps its other children when the managed file's
    // requirement changes.
    $page->checkField('toggle_required');
    $this->assertSession()->elementExists('css', '.js-form-item-managed-file-in-fieldset label.form-required');
    $this->assertVisible('#edit-textfield-in-fieldset');
    $this->assertVisible('#edit-fieldset-group');
  }

  /**
   * Tests that the upload control keeps its label and description.
   */
  public function testLabelAndDescriptionAssociations(): void {
    $this->openForm();
    $page = $this->getSession()->getPage();

    foreach (['single_required', 'multi_required', 'combined', 'validated_file'] as $name) {
      $item = $this->item($name);
      $input = $page->find('css', $this->fileInputSelector($name, $name === 'multi_required'));
      $this->assertNotNull($input, "The file input of $name exists.");
      $label = $page->find('css', $item . ' label');
      $this->assertNotNull($label, "The label of $name exists.");
      $this->assertSame($input->getAttribute('id'), $label->getAttribute('for'), "The label of $name points at its file input.");

      $describedby = preg_split('/\s+/', trim((string) $input->getAttribute('aria-describedby')));
      $this->assertNotEmpty($describedby[0], "The file input of $name has an aria-describedby reference.");
      foreach ($describedby as $ref) {
        $description = $page->find('css', '#' . $ref);
        $this->assertNotNull($description, "aria-describedby $ref of $name resolves.");
        $text = trim($description->getText());
        if ($text === '') {
          $text = trim(strip_tags($description->getHtml()));
        }
        $this->assertNotSame('', $text, "The description of $name has text.");
      }
    }
  }

  /**
   * Tests an AJAX upload with conditional visibility and requirement.
   */
  public function testAjaxUpload(): void {
    $this->openForm();
    $page = $this->getSession()->getPage();
    $item = $this->item('combined');

    $page->checkField('toggle');
    $page->checkField('toggle_required');
    $this->assertVisible($item);
    $this->assertSession()->elementExists('css', $item . ' label.form-required');

    $this->uploadFile('files[combined]');

    // Reacquire after the AJAX replacement: the old element references and
    // IDs are stale.
    $this->assertSession()->waitForElementVisible('css', $item . ' .file a');
    $this->assertNull($page->find('css', $this->fileInputSelector('combined')), 'The upload control is not rendered when a file is present.');
    $this->assertVisible($item);
    $this->assertVisible($item . ' .file a');
    $this->assertSession()->elementExists('css', $item . ' label');

    // The trigger still controls the replaced element.
    $page->uncheckField('toggle');
    $this->assertHidden($item);
    $page->checkField('toggle');
    $this->assertVisible($item);

    // Required semantics are not put on the hidden file IDs input: a required
    // attribute there is invalid and no label can reference it.
    $this->retrigger('toggle_required');
    $this->assertCount(0, $page->findAll('css', $item . ' input[type="hidden"][required]'));
  }

  /**
   * Tests removing the last file restores the upload control and its states.
   */
  public function testAjaxRemoval(): void {
    $this->openForm();
    $page = $this->getSession()->getPage();
    $item = $this->item('single_required');
    $page->checkField('toggle_required');

    $this->uploadFile('files[single_required]');
    $this->assertSession()->waitForElementVisible('css', $item . ' .file a');
    $this->assertNull($page->find('css', $this->fileInputSelector('single_required')));

    $this->removeFile('single_required');

    // The upload control comes back.
    $this->assertSession()->waitForElementVisible('css', $this->fileInputSelector('single_required'));
    $this->assertNotNull($page->find('css', $this->fileInputSelector('single_required')));

    // Once the trigger changes again, the required state reaches the control.
    $this->retrigger('toggle_required');
    $this->assertSession()->elementExists('css', $item . ' label.form-required');
    $this->assertTrue($page->find('css', $this->fileInputSelector('single_required'))->hasAttribute('required'));

    // A second cycle, to prove the states are reattached each time.
    $this->uploadFile('files[single_required]');
    $this->assertSession()->waitForElementVisible('css', $item . ' .file a');
    $this->removeFile('single_required');
    $this->assertSession()->waitForElementVisible('css', $this->fileInputSelector('single_required'));
    $this->retrigger('toggle_required');
    $this->assertSession()->elementExists('css', $item . ' label.form-required');
  }

  /**
   * Tests recovery after an upload that fails validation.
   */
  public function testInvalidUploadRecovery(): void {
    $this->openForm();
    $page = $this->getSession()->getPage();
    $item = $this->item('validated_file');

    // The element accepts .txt files up to 1 KB. file.js rejects a file with
    // another extension before it is sent, and the element stays usable.
    $image = $this->getTestFiles('image')[0];
    $image_path = \Drupal::service('file_system')->realpath($image->uri);
    $page->attachFileToField('files[validated_file]', $image_path);
    $this->assertSession()->waitForElementVisible('css', '.file-upload-js-error');
    $error = $page->find('css', '.file-upload-js-error');
    $this->assertStringContainsString('Only files with the following extensions are allowed: txt.', $error->getText());

    // A valid file uploads afterwards.
    $small = dirname($image_path) . '/small-' . $this->randomMachineName(8) . '.txt';
    file_put_contents($small, 'small file');
    try {
      $page->attachFileToField('files[validated_file]', $small);
      $this->assertSession()->assertWaitOnAjaxRequest();
    }
    finally {
      unlink($small);
    }
    $this->assertSession()->waitForElementVisible('css', $item . ' .file a');
    $this->assertSession()->elementNotExists('css', '.messages--error');
  }

  /**
   * Tests repeated upload and removal cycles, reacquiring after every AJAX.
   */
  public function testRepeatedUploadRemovalCycles(): void {
    $this->openForm();
    $page = $this->getSession()->getPage();
    $item = $this->item('multi_required');
    $page->checkField('toggle');
    $page->checkField('toggle_required');

    for ($i = 1; $i <= 3; $i++) {
      $this->uploadFile('files[multi_required][]');
      $this->assertSession()->waitForElementVisible('css', $item . ' .file a');
      $this->assertVisible($item);

      $this->removeFile('multi_required');
      $this->assertSession()->waitForElementVisible('css', $this->fileInputSelector('multi_required', TRUE));
      $this->retrigger('toggle_required');
      $this->assertSession()->elementExists('css', $item . ' label.form-required');
    }
  }

}
