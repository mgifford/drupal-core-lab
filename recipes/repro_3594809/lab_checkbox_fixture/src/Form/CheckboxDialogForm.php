<?php

namespace Drupal\lab_checkbox_fixture\Form;

use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;

/**
 * Lab test support: checkboxes rendered inside a modal dialog.
 */
class CheckboxDialogForm extends FormBase {

  /**
   * {@inheritdoc}
   */
  public function getFormId(): string {
    return 'lab_checkbox_fixture_dialog_form';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state): array {
    $form['dialog_unchecked'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Dialog checkbox, unchecked'),
    ];
    $form['dialog_checked'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Dialog checkbox, checked'),
      '#default_value' => 1,
    ];
    $form['dialog_group'] = [
      '#type' => 'checkboxes',
      '#title' => $this->t('Dialog checkbox group'),
      '#options' => [
        'one' => $this->t('First dialog option'),
        'two' => $this->t('Second dialog option'),
      ],
      '#default_value' => ['one'],
    ];
    $form['actions'] = ['#type' => 'actions'];
    $form['actions']['submit'] = [
      '#type' => 'submit',
      '#value' => $this->t('Save'),
      '#button_type' => 'primary',
    ];
    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state): void {
    $this->messenger()->addStatus($this->t('The dialog form was submitted.'));
    $form_state->setRedirect('lab_checkbox_fixture.form');
  }

}
