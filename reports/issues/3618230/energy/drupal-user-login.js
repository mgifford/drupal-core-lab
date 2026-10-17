/**
 * drupal-user-login
 *
 * Anonymous load of /user/login. Written for a drupal-core-lab proof of concept
 * (#3618230, Before vs After). The route is absolute, so --a and --b must be
 * the two site origins.
 */
import { defineJourney } from '../dist/core/journey.js';

export default defineJourney({
  name: 'drupal-user-login',
  description: 'Load /user/login anonymously and let it settle.',

  async run({ page, measure, url }) {
    await measure('user-login', async () => {
      await page.goto(url('/user/login'), { waitUntil: 'load' });
    });
  },
});
