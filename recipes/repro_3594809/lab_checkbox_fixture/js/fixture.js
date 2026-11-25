/**
 * @file
 * Lab test support for #3594809: sets the indeterminate property, which has no
 * HTML attribute, on the checkbox the fixture form marks for it.
 */
((Drupal, once) => {
  Drupal.behaviors.labCheckboxFixture = {
    attach(context) {
      once('lab-indeterminate', '[data-lab-indeterminate]', context).forEach(
        (input) => {
          input.indeterminate = true;
        },
      );
    },
  };
})(Drupal, once);
