import { test, expect } from '@playwright/test';

const ADMIN_USER = process.env.DRUPAL_ADMIN_USER ?? 'admin';
const ADMIN_PASS = process.env.DRUPAL_ADMIN_PASS ?? 'admin';

test.describe('Drupal login', () => {
  test('login form is keyboard reachable', async ({ page }) => {
    await page.goto('/');

    const username = page.getByRole('textbox', { name: 'Username' });
    const password = page.getByRole('textbox', { name: 'Password' });
    const submit = page.getByRole('button', { name: 'Log in' });

    await expect(username).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(password).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(submit).toBeFocused();
  });

  test('can log in with the default DDEV admin credentials', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('textbox', { name: 'Username' }).fill(ADMIN_USER);
    await page.getByRole('textbox', { name: 'Password' }).fill(ADMIN_PASS);
    await page.getByRole('button', { name: 'Log in' }).press('Enter');

    await expect(page).toHaveURL(/\/user\/1(\?.*)?$/);
    await expect(
      page.getByLabel('User account menu').getByRole('link', { name: 'Log out' }),
    ).toBeVisible();
    await expect(page).toHaveTitle(/admin \| Drush Site-Install/);
  });
});
