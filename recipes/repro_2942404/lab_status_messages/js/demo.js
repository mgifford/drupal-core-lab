/**
 * @file
 * Lab test support: adds one message of each type with Drupal.Message.
 */
((Drupal, once) => {
  Drupal.behaviors.labStatusMessages = {
    attach(context) {
      once('lab-status-messages', '#lab-add-js-messages', context).forEach((button) => {
        button.addEventListener('click', () => {
          const messages = new Drupal.Message();
          messages.add('JavaScript status: the item was saved.', { type: 'status' });
          messages.add('JavaScript warning: the connection is slow.', { type: 'warning' });
          messages.add('JavaScript error: the upload failed.', { type: 'error' });
        });
      });
    },
  };
})(Drupal, once);
