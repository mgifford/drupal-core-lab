# Bug summary prepared from the registered 3594809 scenario on 2026-11-23.
# The original MR is preserved at MR tip 94a48fe8 on Core 07d6e6935e.
# No live Lab run exists. Every Before and After result below is expected, not observed.
@issue-3594809 @draft
Feature: Standard checkboxes on forms that require submission
  https://www.drupal.org/project/drupal/issues/3594809

  Ordinary native checkboxes should not look like immediate-action switches
  when changing the value does not persist until the form is submitted.

  Background:
    Given I use a Standard Drupal installation
    And Default Admin is the administration theme
    And I am logged in as an administrator

  @keyboard @visual
  Scenario: A submission-based checkbox is presented as a standard checkbox
    # source: file:reports/issues/3594809/variants.json
    # Before: not run (DDEV start was blocked by Docker disk capacity)
    # After: not run (DDEV start was blocked by Docker disk capacity)
    Given I open /admin/appearance/settings
    When I inspect the Shortcut icon checkbox
    Then it is a native checkbox with its associated label
    And its presentation is an ordinary square checkbox rather than a switch
    And its checked and focus states remain distinguishable

  @keyboard @persistence
  Scenario: Leaving the form does not save a changed checkbox
    # source: file:reports/issues/3594809/variants.json
    # Before: not run (DDEV start was blocked by Docker disk capacity)
    # After: not run (DDEV start was blocked by Docker disk capacity)
    Given I know the saved value of the Shortcut icon checkbox
    When I toggle the checkbox and leave the form without saving
    Then the saved setting is unchanged when I return

  @keyboard @persistence
  Scenario: Saving the form persists a changed checkbox
    # source: file:reports/issues/3594809/variants.json
    # Before: not run (DDEV start was blocked by Docker disk capacity)
    # After: not run (DDEV start was blocked by Docker disk capacity)
    Given I know the saved value of the Shortcut icon checkbox
    When I toggle the checkbox and activate Save configuration
    Then the new setting survives a reload
