<?php

namespace Drupal\lab_checkbox_fixture\Form;

use Drupal\Component\Serialization\Json;
use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\State\StateInterface;
use Drupal\Core\Url;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Lab test support: Form API checkboxes in each state and context.
 *
 * Every control is a real Form API element rendered by the active theme. The
 * form needs "Save configuration" to keep a value, which is the case #3594809
 * is about.
 */
class CheckboxFixtureForm extends FormBase {

  /**
   * The state key the saved values are kept under.
   */
  const STATE_KEY = 'lab_checkbox_fixture.values';

  public function __construct(protected StateInterface $state) {}

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container): static {
    return new static($container->get('state'));
  }

  /**
   * {@inheritdoc}
   */
  public function getFormId(): string {
    return 'lab_checkbox_fixture_form';
  }

  /**
   * The standalone checkboxes whose value "Save configuration" keeps.
   */
  protected static function savedDefaults(): array {
    return [
      'default_unchecked' => 0,
      'default_checked' => 1,
      'required_checkbox' => 1,
      'with_description' => 0,
      'long_label' => 0,
      'states_controller' => 0,
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state): array {
    $saved = $this->state->get(self::STATE_KEY, []) + self::savedDefaults();
    $form['#attached']['library'][] = 'lab_checkbox_fixture/fixture';
    $form['#attached']['library'][] = 'core/drupal.dialog.ajax';

    $form['intro'] = [
      '#markup' => '<p>' . $this->t('Lab fixture for #3594809. Nothing here takes effect until Save configuration is used.') . '</p>',
    ];

    $form['standalone'] = [
      '#type' => 'fieldset',
      '#title' => $this->t('Standalone checkboxes'),
    ];
    $form['standalone']['default_unchecked'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Default, unchecked'),
      '#default_value' => $saved['default_unchecked'],
    ];
    $form['standalone']['default_checked'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Default, checked'),
      '#default_value' => $saved['default_checked'],
    ];
    $form['standalone']['disabled_unchecked'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Disabled, unchecked'),
      '#default_value' => 0,
      '#disabled' => TRUE,
    ];
    $form['standalone']['disabled_checked'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Disabled, checked'),
      '#default_value' => 1,
      '#disabled' => TRUE,
    ];
    $form['standalone']['required_checkbox'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Required'),
      '#default_value' => $saved['required_checkbox'],
      '#required' => TRUE,
    ];
    $form['standalone']['with_description'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('With a description'),
      '#description' => $this->t('The description belongs to this checkbox and is referenced by aria-describedby.'),
      '#default_value' => $saved['with_description'],
    ];
    $form['standalone']['long_label'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('A long label that has to wrap onto several lines at ordinary widths, so that the alignment of the control with the first line of its label and the indent of the following lines can be compared between the two environments at desktop, tablet and mobile sizes and at 200% and 400% zoom'),
      '#description' => $this->t('A long label with a description under it.'),
      '#default_value' => $saved['long_label'],
    ];
    $form['standalone']['indeterminate'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Indeterminate'),
      '#default_value' => 0,
      '#attributes' => ['data-lab-indeterminate' => 'true'],
    ];

    $form['errors'] = [
      '#type' => 'fieldset',
      '#title' => $this->t('Validation errors'),
      '#description' => $this->t('Show validation errors marks both of these as invalid without saving anything.'),
    ];
    $form['errors']['error_unchecked'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Validation error, unchecked'),
      '#default_value' => 0,
    ];
    $form['errors']['error_checked'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Validation error, checked'),
      '#default_value' => 1,
    ];

    $form['group'] = [
      '#type' => 'checkboxes',
      '#title' => $this->t('Checkbox group'),
      '#description' => $this->t('A checkboxes element. These were not styled as switches before the change.'),
      '#options' => [
        'one' => $this->t('First option'),
        'two' => $this->t('Second option, checked'),
        'three' => $this->t('Third option, disabled'),
      ],
      '#default_value' => ['two'],
    ];
    $form['group']['three']['#disabled'] = TRUE;

    $form['radio_group'] = [
      '#type' => 'radios',
      '#title' => $this->t('Radio group'),
      '#description' => $this->t('Radios share a stylesheet with checkboxes; they must not change.'),
      '#options' => [
        'a' => $this->t('First choice'),
        'b' => $this->t('Second choice, selected'),
      ],
      '#default_value' => 'b',
    ];

    $form['table'] = [
      '#type' => 'tableselect',
      '#caption' => $this->t('Checkboxes in a table, with select all'),
      '#header' => ['title' => $this->t('Name'), 'kind' => $this->t('Kind')],
      // The 'title' cell's #title gives each row's checkbox its label.
      '#options' => [
        'r1' => ['title' => ['data' => ['#title' => $this->t('Row one'), '#markup' => $this->t('Row one')]], 'kind' => $this->t('Sample')],
        'r2' => ['title' => ['data' => ['#title' => $this->t('Row two'), '#markup' => $this->t('Row two')]], 'kind' => $this->t('Sample')],
        'r3' => ['title' => ['data' => ['#title' => $this->t('Row three'), '#markup' => $this->t('Row three')]], 'kind' => $this->t('Sample')],
      ],
      '#default_value' => ['r2' => 'r2'],
    ];

    $form['states'] = [
      '#type' => 'fieldset',
      '#title' => $this->t('Form API #states'),
    ];
    $form['states']['states_controller'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Controlling checkbox'),
      '#default_value' => $saved['states_controller'],
    ];
    $controller_checked = [':input[name="states_controller"]' => ['checked' => TRUE]];
    $form['states']['states_visible'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Visible only while the controlling checkbox is checked'),
      '#states' => ['visible' => $controller_checked],
    ];
    $form['states']['states_enabled'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Enabled only while the controlling checkbox is checked'),
      '#states' => ['enabled' => $controller_checked],
    ];
    $form['states']['states_checked'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Checked while the controlling checkbox is checked'),
      '#states' => ['checked' => $controller_checked],
    ];

    $form['ajax'] = [
      '#type' => 'fieldset',
      '#title' => $this->t('AJAX replacement'),
    ];
    $form['ajax']['ajax_replace'] = [
      '#type' => 'submit',
      '#value' => $this->t('Replace checkbox with AJAX'),
      '#name' => 'ajax_replace',
      '#submit' => ['::ajaxSubmit'],
      '#limit_validation_errors' => [],
      '#ajax' => [
        'callback' => '::ajaxCallback',
        'wrapper' => 'lab-checkbox-ajax-wrapper',
      ],
    ];
    $count = (int) $form_state->get('ajax_count');
    $form['ajax']['ajax_wrapper'] = [
      '#type' => 'container',
      '#attributes' => ['id' => 'lab-checkbox-ajax-wrapper'],
    ];
    $form['ajax']['ajax_wrapper']['ajax_checkbox'] = [
      '#type' => 'checkbox',
      '#title' => $this->formatPlural($count, 'Checkbox replaced by AJAX 1 time', 'Checkbox replaced by AJAX @count times'),
      '#default_value' => 1,
    ];

    $form['dialog_link'] = [
      '#type' => 'link',
      '#title' => $this->t('Open checkboxes in a dialog'),
      '#url' => Url::fromRoute('lab_checkbox_fixture.dialog'),
      '#attributes' => [
        'class' => ['use-ajax', 'button'],
        'data-dialog-type' => 'modal',
        'data-dialog-options' => Json::encode(['width' => 600]),
        'id' => 'lab-checkbox-dialog-link',
      ],
    ];

    $form['actions'] = ['#type' => 'actions'];
    $form['actions']['submit'] = [
      '#type' => 'submit',
      '#value' => $this->t('Save configuration'),
      '#button_type' => 'primary',
    ];
    $form['actions']['show_errors'] = [
      '#type' => 'submit',
      '#value' => $this->t('Show validation errors'),
      '#name' => 'show_errors',
    ];
    $form['actions']['reset'] = [
      '#type' => 'submit',
      '#value' => $this->t('Reset saved values'),
      '#name' => 'reset',
      '#submit' => ['::resetSubmit'],
      '#limit_validation_errors' => [],
    ];
    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function validateForm(array &$form, FormStateInterface $form_state): void {
    if (($form_state->getTriggeringElement()['#name'] ?? '') === 'show_errors') {
      $form_state->setErrorByName('error_unchecked', $this->t('Validation error, unchecked: this example is marked invalid.'));
      $form_state->setErrorByName('error_checked', $this->t('Validation error, checked: this example is marked invalid.'));
    }
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state): void {
    $values = [];
    foreach (array_keys(self::savedDefaults()) as $key) {
      $values[$key] = (int) $form_state->getValue($key);
    }
    $this->state->set(self::STATE_KEY, $values);
    $this->messenger()->addStatus($this->t('The configuration options have been saved.'));
  }

  /**
   * Submit handler: forgets the saved values.
   */
  public function resetSubmit(array &$form, FormStateInterface $form_state): void {
    $this->state->delete(self::STATE_KEY);
    $this->messenger()->addStatus($this->t('The saved values have been reset.'));
  }

  /**
   * Submit handler for the AJAX button: counts the replacement.
   */
  public function ajaxSubmit(array &$form, FormStateInterface $form_state): void {
    $form_state->set('ajax_count', (int) $form_state->get('ajax_count') + 1);
    $form_state->setRebuild();
  }

  /**
   * AJAX callback: returns the wrapper that holds the replaced checkbox.
   */
  public function ajaxCallback(array &$form, FormStateInterface $form_state): array {
    return $form['ajax']['ajax_wrapper'];
  }

}
