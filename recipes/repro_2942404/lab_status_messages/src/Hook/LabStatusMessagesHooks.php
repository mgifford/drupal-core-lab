<?php

declare(strict_types=1);

namespace Drupal\lab_status_messages\Hook;

use Drupal\Core\Hook\Attribute\Hook;

/**
 * Lab test support for #2942404: exposes the active theme to the evaluator.
 */
class LabStatusMessagesHooks {

  /**
   * Implements hook_page_attachments().
   */
  #[Hook('page_attachments')]
  public function pageAttachments(array &$attachments): void {
    $attachments['#attached']['drupalSettings']['labActiveTheme'] = \Drupal::theme()->getActiveTheme()->getName();
  }

}
