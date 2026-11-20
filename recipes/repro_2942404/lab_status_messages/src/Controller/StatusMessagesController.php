<?php

namespace Drupal\lab_status_messages\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Url;

/**
 * Lab test support: shows every message type once, and more than one at once.
 */
class StatusMessagesController extends ControllerBase {

  /**
   * Adds server-side messages of each type and a button for JavaScript ones.
   */
  public function page(): array {
    $messenger = $this->messenger();
    $messenger->addStatus($this->t('The configuration options have been saved.'));
    $messenger->addStatus($this->t('Your changes are published. <a href=":url">Review the configuration</a>.', [':url' => Url::fromRoute('<front>')->toString()]));
    $messenger->addWarning($this->t('Cron has not run recently.'));
    $messenger->addError($this->t('The Username field is required.'));
    return [
      '#markup' => '<p>' . $this->t('The messages above were added by the server. The button adds one of each type with Drupal.Message, as AJAX and JavaScript code does.') . '</p><p><button type="button" id="lab-add-js-messages" class="button">' . $this->t('Add messages with JavaScript') . '</button></p>',
      '#attached' => ['library' => ['lab_status_messages/demo']],
    ];
  }

}
