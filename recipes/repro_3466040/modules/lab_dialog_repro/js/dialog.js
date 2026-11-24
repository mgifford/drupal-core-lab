((Drupal, once) => {
  Drupal.behaviors.labDialogRepro = {
    attach(context) {
      once('lab-dialog-open', '[data-lab-dialog-open]', context).forEach((button) => {
        button.addEventListener('click', () => {
          const content = document.createElement('div');
          content.id = 'lab-dialog-content';
          const expand = document.createElement('button');
          expand.type = 'button';
          expand.textContent = Drupal.t('Expand content');
          const spacer = document.createElement('div');
          spacer.hidden = true;
          spacer.style.height = '2000px';
          content.append(expand, spacer);
          document.body.append(content);

          Drupal.dialog(content, {
            title: Drupal.t('Percentage-height dialog'),
            modal: true,
            height: '50%',
            width: '50%',
            buttons: [{ text: Drupal.t('Save') }],
          }).showModal();
          expand.addEventListener('click', () => {
            spacer.hidden = false;
          });
        });
      });
    },
  };
})(Drupal, once);
