/**
 * Auth helper — logs in as uid 1 and stores session state.
 *
 * Run once before admin page tests via Playwright's globalSetup.
 * Saves auth cookies to reports/auth-state.json so admin tests
 * can reuse the session without re-logging in for each page.
 */
import { chromium, FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

export const AUTH_STATE_FILE = path.join(__dirname, '../reports/auth-state.json');

export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL ?? 'https://drupal-core.ddev.site';

  // Read credentials from env, falling back to DDEV defaults.
  const username = process.env.DRUPAL_ADMIN_USER ?? 'admin';
  const password = process.env.DRUPAL_ADMIN_PASS ?? 'admin';

  const browser = await chromium.launch();
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  await page.goto(`${baseURL}/user/login`);
  await page.fill('#user-login-form #edit-name', username);
  await page.fill('#user-login-form #edit-pass', password);
  await page.click('#user-login-form [type="submit"]');
  await page.waitForURL(`${baseURL}/user/**`);

  fs.mkdirSync(path.dirname(AUTH_STATE_FILE), { recursive: true });
  await context.storageState({ path: AUTH_STATE_FILE });
  await browser.close();
}
