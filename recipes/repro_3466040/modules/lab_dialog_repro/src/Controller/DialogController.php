<?php

declare(strict_types=1);

namespace Drupal\lab_dialog_repro\Controller;

use Drupal\Core\Controller\ControllerBase;

/**
 * Provides a fixture for the percentage-height dialog reproduction.
 */
class DialogController extends ControllerBase {

  /**
   * Builds the reproduction page.
   */
  public function page(): array {
    return [
      'open' => [
        '#type' => 'button',
        '#value' => $this->t('Open percentage-height dialog'),
        '#attributes' => [
          'data-lab-dialog-open' => TRUE,
        ],
      ],
      '#attached' => [
        'library' => ['lab_dialog_repro/dialog'],
      ],
    ];
  }

}
