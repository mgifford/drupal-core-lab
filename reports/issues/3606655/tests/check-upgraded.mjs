// After the upgrade: the Default Admin settings form must no longer offer the
// old dark-mode control, and the profile form must default to System.
import { chromium } from 'playwright';
const BASE = process.argv[2] || 'https://repro-issue-3606655.ddev.site';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(`${BASE}/user/login`, { waitUntil: 'domcontentloaded' });
await page.fill('#edit-name', 'admin');
await page.fill('#edit-pass', 'admin');
await Promise.all([page.waitForLoadState('domcontentloaded'), page.click('#edit-submit')]);
await page.goto(`${BASE}/admin/appearance/settings/default_admin`, { waitUntil: 'domcontentloaded' });
const settingsText = await page.locator('main').innerText();
const html = await page.content();
const profile = await page.goto(`${BASE}/user/edit`, { waitUntil: 'domcontentloaded' });
const checked = await page.locator('input[name="color_scheme"]:checked').getAttribute('value').catch(() => null);
console.log(JSON.stringify({
  oldDarkModeControl: /enable_dark_mode|Dark mode|Appearance/i.test(settingsText),
  appearanceWord: (settingsText.match(/Appearance/g) || []).length,
  hasDarkModeSettingsKey: html.includes('enable_dark_mode'),
  profileDefault: checked,
  profileStatus: profile.status(),
}, null, 1));
await browser.close();
