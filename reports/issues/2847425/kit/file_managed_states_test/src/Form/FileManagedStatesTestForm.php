<?php

declare(strict_types=1);

namespace Drupal\file_managed_states_test\Form;

use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;

/**
 * Self-diagnosing reproduction harness for issue #2847425.
 *
 * "#states not affecting visibility/requirement of managed_file"
 * https://www.drupal.org/project/drupal/issues/2847425
 *
 * IMPORTANT layout note: Scenarios 1, 2 and 4 are deliberately NOT wrapped in a
 * fieldset. states.js toggles the closest .js-form-item / .js-form-wrapper, and
 * a fieldset IS a .js-form-wrapper — so a managed_file placed directly inside a
 * fieldset collapses the WHOLE fieldset when hidden (comments #74/#75). To show
 * the per-element behaviour cleanly, those scenarios sit flat under headings,
 * exactly like core's file_test_states test form. Scenario 3 is the one that
 * deliberately nests a managed_file inside a details element, to demonstrate
 * the fieldset-collapse case that MR !7305 does NOT fix.
 *
 * Note on "required": #states "required" only paints the marker; it does NOT
 * enforce server-side validation ("works as designed", #65/#88; follow-up
 * #3513308).
 */
class FileManagedStatesTestForm extends FormBase {

  /**
   * {@inheritdoc}
   */
  public function getFormId(): string {
    return 'file_managed_states_test_form';
  }

  /**
   * Builds an <h2> scenario heading.
   */
  private function heading(string|\Stringable $text): array {
    return [
      '#type' => 'html_tag',
      '#tag' => 'h2',
      '#value' => $text,
      '#attributes' => ['class' => ['scenario-heading']],
    ];
  }

  /**
   * Builds a scenario description paragraph.
   */
  private function note(string|\Stringable $text): array {
    return [
      '#type' => 'html_tag',
      '#tag' => 'p',
      '#value' => $text,
      '#attributes' => ['class' => ['scenario-note']],
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state): array {
    $upload_location = 'public://file-managed-states-test';

    $form['#attached']['library'][] = 'file_managed_states_test/diagnostics';

    $form['intro'] = [
      '#type' => 'html_tag',
      '#tag' => 'p',
      '#value' => $this->t('Reproduction harness for <a href="@url">issue #2847425 — #states not affecting visibility/requirement of managed_file</a>. The diagnostics panel below runs automatically and tells you whether the fix (MR !7305) appears to be applied.', [
        '@url' => 'https://www.drupal.org/project/drupal/issues/2847425',
      ]),
    ];

    // ------------------------------------------------------------------
    // Diagnostics panel (populated by js/diagnostics.js).
    // ------------------------------------------------------------------
    $form['diagnostics'] = [
      '#type' => 'container',
      '#attributes' => [
        'id' => 'state-diagnostics',
        'class' => ['state-diagnostics'],
        'role' => 'region',
        'aria-labelledby' => 'diag-heading',
      ],
    ];
    $form['diagnostics']['heading'] = [
      '#type' => 'html_tag',
      '#tag' => 'h2',
      '#value' => $this->t('Patch diagnostics'),
      '#attributes' => ['id' => 'diag-heading'],
    ];
    $form['diagnostics']['summary'] = [
      '#type' => 'html_tag',
      '#tag' => 'p',
      '#value' => $this->t('JavaScript is required for the automatic checks. Enable it and reload to see whether the patch is applied.'),
      '#attributes' => [
        'id' => 'diag-summary',
        'class' => ['diag-summary'],
        'role' => 'status',
        'aria-live' => 'polite',
      ],
    ];
    $form['diagnostics']['run'] = [
      '#type' => 'html_tag',
      '#tag' => 'button',
      '#value' => $this->t('Re-run diagnostics'),
      '#attributes' => ['type' => 'button', 'id' => 'diag-run', 'class' => ['button']],
    ];
    $form['diagnostics']['results'] = [
      '#type' => 'html_tag',
      '#tag' => 'ul',
      '#attributes' => ['id' => 'diag-results', 'class' => ['diag-results']],
    ];

    // ------------------------------------------------------------------
    // Guided walkthrough.
    // ------------------------------------------------------------------
    $form['walkthrough'] = [
      '#theme' => 'item_list',
      '#list_type' => 'ol',
      '#title' => $this->t('How to test, by hand'),
      '#items' => [
        $this->t('Read the diagnostics verdict above. On plain core it reports the bug; with MR !7305 applied it should report everything passing EXCEPT the Scenario 3 fieldset check, which the MR does not fix.'),
        $this->t('Scenario 1: choose "Audio". The managed_file should appear only then and gain a required marker. The plain file control beside it already behaves.'),
        $this->t('Scenario 2: tick "Toggle fields" and watch the three managed_file elements show / hide / become required — each on its own, with nothing else disturbed.'),
        $this->t('Scenario 3 (accessibility): tick the box. The attachment lives inside a details element, so hiding it collapses the WHOLE details — taking the "always visible" field with it. That is the #74/#75 fieldset bug the MR leaves unfixed (WCAG 3.3.1).'),
        $this->t('Scenario 4: upload a file, then toggle — this exercises the "fids" branch and the label for="" repointing.'),
        $this->t('Apply MR !7305 (or check out its branch), reload, and compare. See the bundled README for exact commands and the Guidepup screen-reader capture.'),
      ],
    ];

    // ------------------------------------------------------------------
    // Scenario 1 — canonical example (flat: no fieldset wrapper).
    // ------------------------------------------------------------------
    $form['s1_heading'] = $this->heading($this->t('Scenario 1 — canonical example (select → managed_file)'));
    $form['type'] = [
      '#type' => 'select',
      '#title' => $this->t('Content type'),
      '#options' => [
        'video' => $this->t('Video'),
        'audio' => $this->t('Audio'),
        'post' => $this->t('Text'),
      ],
      '#empty_option' => $this->t('- Select -'),
    ];
    $form['audio'] = [
      '#type' => 'managed_file',
      '#title' => $this->t('Audio file (managed_file — the buggy element)'),
      '#description' => $this->t('Expected: hidden until "Audio" is selected, then shown and marked required. Buggy behaviour: always visible, never marked required.'),
      '#upload_location' => $upload_location,
      '#states' => [
        'visible' => [':input[name="type"]' => ['value' => 'audio']],
        'required' => [':input[name="type"]' => ['value' => 'audio']],
      ],
    ];
    $form['audio_control'] = [
      '#type' => 'file',
      '#title' => $this->t('Audio file (plain file — the control)'),
      '#description' => $this->t('Identical #states on a plain #type => file element. This one already works, which is the contrast the issue summary describes.'),
      '#states' => [
        'visible' => [':input[name="type"]' => ['value' => 'audio']],
        'required' => [':input[name="type"]' => ['value' => 'audio']],
      ],
    ];

    // ------------------------------------------------------------------
    // Scenario 2 — mirrors core's file_test_states module (flat).
    // ------------------------------------------------------------------
    $form['s2_heading'] = $this->heading($this->t('Scenario 2 — checkbox toggle (mirror of core JS test)'));
    $form['toggle'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Toggle fields'),
    ];
    $form['managed_file_initially_visible'] = [
      '#type' => 'managed_file',
      '#title' => $this->t('Managed file — initially visible'),
      '#description' => $this->t('Visible while the checkbox is unchecked; should hide when checked.'),
      '#upload_location' => $upload_location,
      '#states' => [
        'visible' => [':input[name="toggle"]' => ['checked' => FALSE]],
      ],
    ];
    $form['managed_file_initially_hidden'] = [
      '#type' => 'managed_file',
      '#title' => $this->t('Managed file — initially hidden'),
      '#description' => $this->t('Hidden until the checkbox is checked.'),
      '#upload_location' => $upload_location,
      '#states' => [
        'visible' => [':input[name="toggle"]' => ['checked' => TRUE]],
      ],
    ];
    $form['managed_file_initially_optional'] = [
      '#type' => 'managed_file',
      '#title' => $this->t('Managed file — initially optional'),
      '#description' => $this->t('Gains the required marker when the checkbox is checked (cosmetic only — no server-side enforcement, per #3513308).'),
      '#upload_location' => $upload_location,
      '#states' => [
        'required' => [':input[name="toggle"]' => ['checked' => TRUE]],
      ],
    ];

    // ------------------------------------------------------------------
    // Scenario 3 — the fieldset regression (#74/#75). This is the ONLY
    // scenario that nests a managed_file inside a details element, on purpose.
    // ------------------------------------------------------------------
    $form['s3_heading'] = $this->heading($this->t('Scenario 3 — managed_file inside a details element (fieldset regression)'));
    $form['s3_note'] = $this->note($this->t('On the patched build the details below collapses whenever the attachment is hidden, taking the "always visible" field with it — display:none removes it from the accessibility tree (WCAG 3.3.1). MR !7305 does not fix this.'));
    $form['show_details'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Show the attachment inside the details element below'),
    ];
    $form['s3_details'] = [
      '#type' => 'details',
      '#title' => $this->t('Attachment details'),
      '#open' => TRUE,
    ];
    $form['s3_details']['always_here'] = [
      '#type' => 'textfield',
      '#title' => $this->t('This field should always stay visible'),
      '#description' => $this->t('If this field disappears when you toggle the checkbox, the whole fieldset was hidden — the bug in #74.'),
    ];
    $form['s3_details']['attachment'] = [
      '#type' => 'managed_file',
      '#title' => $this->t('Attachment (managed_file with #states, inside details)'),
      '#upload_location' => $upload_location,
      '#states' => [
        'visible' => [':input[name="show_details"]' => ['checked' => TRUE]],
      ],
    ];

    // ------------------------------------------------------------------
    // Scenario 4 — the "file already uploaded" branch (flat).
    // ------------------------------------------------------------------
    $form['s4_heading'] = $this->heading($this->t('Scenario 4 — states after a file is already uploaded'));
    $form['s4_note'] = $this->note($this->t('Upload a file first, then toggle the checkbox. This exercises the code path where #states is attached to the "fids" element and the label\'s for="" is repointed (#39/#96). Confirm the label still associates correctly (inspect the for/id pair) and that the required marker toggles.'));
    $form['toggle_uploaded'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Require / show the uploaded file'),
      '#default_value' => TRUE,
    ];
    $form['uploaded'] = [
      '#type' => 'managed_file',
      '#title' => $this->t('File (upload one, then toggle)'),
      '#upload_location' => $upload_location,
      '#states' => [
        'visible' => [':input[name="toggle_uploaded"]' => ['checked' => TRUE]],
        'required' => [':input[name="toggle_uploaded"]' => ['checked' => TRUE]],
      ],
    ];

    $form['actions'] = [
      '#type' => 'actions',
    ];
    $form['actions']['submit'] = [
      '#type' => 'submit',
      '#value' => $this->t('Submit'),
    ];

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state): void {
    $this->messenger()->addStatus($this->t('Form submitted. Note: any file left empty despite a #states "required" marker still passed submission — #states "required" is cosmetic and does not enforce server-side validation (see follow-up #3513308).'));
  }

}
