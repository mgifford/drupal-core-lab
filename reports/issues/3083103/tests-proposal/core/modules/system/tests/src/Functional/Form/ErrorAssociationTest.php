<?php

declare(strict_types=1);

namespace Drupal\Tests\system\Functional\Form;

use Behat\Mink\Element\NodeElement;
use Drupal\Tests\BrowserTestBase;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;

/**
 * Acceptance test for #3083103: a form error is associated with its control.
 *
 * Runs in default_admin, the default theme of a Standard install, because
 * that theme overrides the form templates. A pass here means:
 * - an invalid control, or its group, carries aria-invalid and an
 *   aria-errormessage (or aria-describedby) reference;
 * - every reference resolves to exactly one element in the rendered page;
 * - help text and author-supplied descriptions are preserved;
 * - a suppressed error creates no reference;
 * - the state is cleared when the field is corrected.
 *
 * This test fails on current core (no association at all) and on both
 * proposals recorded in reports/issues/3083103 (association to a container
 * the default theme does not render). It is the gate for a fix.
 *
 * @see https://www.drupal.org/project/drupal/issues/3083103
 */
#[Group('form')]
#[RunTestsInSeparateProcesses]
class ErrorAssociationTest extends BrowserTestBase {

  /**
   * {@inheritdoc}
   */
  protected $defaultTheme = 'default_admin';

  /**
   * {@inheritdoc}
   */
  protected static $modules = ['form_test', 'inline_form_errors'];

  /**
   * The page under test.
   */
  protected function submitEmpty(string $path = '/form-test/error-association'): void {
    $this->drupalGet($path);
    $this->assertSession()->statusCodeEquals(200);
    $this->submitForm([], 'Submit');
    $this->assertSession()->pageTextContains('field is required');
  }

  /**
   * Returns the element whose #id is the given one.
   *
   * @return \Behat\Mink\Element\NodeElement|null
   *   The element, or NULL when the ID matches zero or more than one element.
   */
  protected function byId(string $id): ?NodeElement {
    $found = $this->getSession()->getPage()->findAll('css', '#' . $id);
    return count($found) === 1 ? $found[0] : NULL;
  }

  /**
   * Splits an IDREF list into tokens.
   *
   * @return string[]
   *   The non-empty IDREF tokens.
   */
  protected function tokens(?string $value): array {
    return preg_split('/\s+/', trim((string) $value), -1, PREG_SPLIT_NO_EMPTY);
  }

  /**
   * An invalid control references an error message that exists.
   */
  public function testInvalidControlReferencesExistingError(): void {
    $this->submitEmpty();
    $field = $this->getSession()->getPage()->find('css', 'input[name="name"]');
    $this->assertNotNull($field, 'The Name field is rendered.');
    $this->assertSame('true', $field->getAttribute('aria-invalid'), 'The invalid Name field has aria-invalid="true".');

    $reference = $field->getAttribute('aria-errormessage');
    $this->assertNotEmpty($reference, 'The invalid Name field has an aria-errormessage reference.');
    $this->assertCount(1, $this->getSession()->getPage()->findAll('css', '#' . $reference), sprintf('The aria-errormessage target "%s" exists exactly once in the rendered page.', $reference));
  }

  /**
   * Every reference on the page resolves to exactly one element.
   */
  public function testEveryReferenceResolves(): void {
    $this->submitEmpty();
    $page = $this->getSession()->getPage();
    $dangling = [];
    foreach ($page->findAll('css', '[aria-errormessage], [aria-describedby]') as $element) {
      foreach (['aria-errormessage', 'aria-describedby'] as $attribute) {
        foreach ($this->tokens($element->getAttribute($attribute)) as $token) {
          $count = count($page->findAll('css', '#' . $token));
          if ($count !== 1) {
            $dangling[] = sprintf('%s on <%s id="%s"> -> %s (%d elements)', $attribute, $element->getTagName(), $element->getAttribute('id'), $token, $count);
          }
        }
      }
    }
    $this->assertSame([], $dangling, "Every IDREF resolves to exactly one element:\n" . implode("\n", $dangling));
  }

  /**
   * Help text and author-supplied descriptions are preserved.
   */
  public function testDescriptionsPreserved(): void {
    $this->submitEmpty();
    $page = $this->getSession()->getPage();

    $name = $page->find('css', 'input[name="name"]');
    $name_tokens = $this->tokens($name?->getAttribute('aria-describedby'));
    $this->assertContains('edit-name--description', $name_tokens, 'The Name field keeps its help-text reference.');
    $this->assertNotNull($this->byId('edit-name--description'), 'The help-text element exists.');

    $custom = $page->find('css', '#lab-custom-id');
    $this->assertNotNull($custom, 'The element with an explicit #id is rendered.');
    $author_tokens = array_values(array_filter($this->tokens($custom->getAttribute('aria-describedby')), fn(string $t): bool => str_starts_with($t, 'lab-existing-help')));
    $this->assertNotEmpty($author_tokens, 'An author-supplied aria-describedby token is preserved.');
    $this->assertNotNull($this->byId($author_tokens[0]), 'The author-supplied description exists.');
  }

  /**
   * An error suppressed with #error_no_message creates no dangling reference.
   */
  public function testSuppressedErrorHasNoDanglingReference(): void {
    $this->submitEmpty();
    $page = $this->getSession()->getPage();
    $suppressed = $page->find('css', 'input[name="suppressed"]');
    $this->assertNotNull($suppressed, 'The suppressed element is rendered.');
    foreach (['aria-errormessage', 'aria-describedby'] as $attribute) {
      foreach ($this->tokens($suppressed->getAttribute($attribute)) as $token) {
        $this->assertNotNull($this->byId($token), sprintf('Suppressed element %s reference "%s" resolves.', $attribute, $token));
      }
    }
  }

  /**
   * Group-level and child associations for radios and checkboxes are valid.
   */
  public function testCompositeElements(): void {
    $this->submitEmpty();
    $page = $this->getSession()->getPage();

    $group = $page->find('css', '#edit-colour--wrapper');
    $this->assertNotNull($group, 'The radio group fieldset is rendered.');
    $this->assertSame('true', $group->getAttribute('aria-invalid'), 'The radio group carries aria-invalid.');
    $reference = $group->getAttribute('aria-errormessage');
    $this->assertNotEmpty($reference, 'The radio group has an aria-errormessage reference.');
    $this->assertNotNull($this->byId($reference), sprintf('The radio group reference "%s" resolves.', $reference));

    foreach ($page->findAll('css', 'input[name="colour"], input[name^="features"]') as $child) {
      $child_reference = $child->getAttribute('aria-errormessage');
      if ($child_reference) {
        $this->assertNotNull($this->byId($child_reference), sprintf('Child %s reference "%s" resolves.', $child->getAttribute('name'), $child_reference));
      }
    }
  }

  /**
   * Two instances of the same form keep unique, resolving error targets.
   */
  public function testTwoInstances(): void {
    $this->drupalGet('/form-test/error-association/two');
    $this->assertSession()->statusCodeEquals(200);
    $page = $this->getSession()->getPage();
    $forms = $page->findAll('xpath', '//form[.//input[@name="name"]]');
    $this->assertCount(2, $forms, 'Two instances of the form are rendered.');
    $forms[0]->pressButton('Submit');
    $this->assertSession()->pageTextContains('field is required');

    $references = [];
    foreach ($page->findAll('css', '[aria-errormessage]') as $element) {
      $reference = $element->getAttribute('aria-errormessage');
      // An author-set #id is not made unique by core (Html::getUniqueId() only
      // applies when #id is absent), so two instances of a form that hard-codes
      // one duplicate it. That is an author error, out of scope here; the
      // fixture's explicit-id element is checked in the single-instance test.
      if (str_starts_with($reference, 'lab-custom-id')) {
        continue;
      }
      $references[] = $reference;
      $this->assertCount(1, $page->findAll('css', '#' . $reference), sprintf('Reference "%s" resolves to exactly one element.', $reference));
    }
    $this->assertSame($references, array_values(array_unique($references)), 'No error target is referenced twice.');
  }

  /**
   * A corrected field no longer reports an invalid state.
   */
  public function testCorrectedFieldDropsInvalidState(): void {
    $this->submitEmpty();
    $this->submitForm(['name' => 'Ada', 'message' => 'Hello'], 'Submit');
    $page = $this->getSession()->getPage();
    $name = $page->find('css', 'input[name="name"]');
    $this->assertNotSame('true', $name->getAttribute('aria-invalid'), 'The corrected Name field is not invalid.');
    $this->assertEmpty($name->getAttribute('aria-errormessage'), 'The corrected Name field has no error reference.');
  }

}
