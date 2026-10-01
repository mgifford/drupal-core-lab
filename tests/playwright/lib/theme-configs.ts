/**
 * Theme configurations for the multi-theme accessibility crawl.
 *
 * Each entry describes one Drupal theme combination to test.
 * The crawl switches the live site's theme settings via drush before each
 * group of tests so that axe results accurately reflect that theme's markup.
 *
 * Machine names must match `ddev drush config:get system.theme`.
 */

export interface ThemeConfig {
  /** Short machine-name identifier used in result records and report keys. */
  id: string;
  /** Human-readable label shown in test output and reports. */
  label: string;
  /** Public/anonymous pages theme machine name. */
  defaultTheme: string;
  /** Admin pages theme machine name. */
  adminTheme: string;
  /** Whether to crawl anonymous (public) pages for this config. */
  testAnonymous: boolean;
  /** Whether to crawl admin pages for this config. */
  testAdmin: boolean;
  /**
   * Browser color scheme preference passed to Playwright.
   * Themes that support prefers-color-scheme will render their dark variant.
   */
  colorScheme: 'light' | 'dark';
}

export const THEME_CONFIGS: ThemeConfig[] = [
  // ── Olivero ───────────────────────────────────────────────────────────────
  // No dark variant: Olivero does not implement prefers-color-scheme, so a
  // dark scan would duplicate the light results.
  {
    id: 'olivero',
    label: 'Olivero',
    defaultTheme: 'olivero',
    adminTheme: 'claro',
    testAnonymous: true,
    testAdmin: false,
    colorScheme: 'light',
  },
  // ── Claro ─────────────────────────────────────────────────────────────────
  // No dark variant: Claro has no dark mode.
  {
    id: 'claro',
    label: 'Claro',
    defaultTheme: 'claro',
    adminTheme: 'claro',
    testAnonymous: true,
    testAdmin: true,
    colorScheme: 'light',
  },
  // ── Default admin (experimental) ──────────────────────────────────────────
  // The only core theme with real dark-mode support (Gin-based). The crawl
  // sets `default_admin.settings enable_dark_mode: auto` so the dark variant
  // renders via Playwright's prefers-color-scheme emulation.
  {
    id: 'admin',
    label: 'Admin (experimental/Gin)',
    defaultTheme: 'default_admin',
    adminTheme: 'default_admin',
    testAnonymous: true,
    testAdmin: true,
    colorScheme: 'light',
  },
  {
    id: 'admin-dark',
    label: 'Admin (experimental/Gin) (dark)',
    defaultTheme: 'default_admin',
    adminTheme: 'default_admin',
    testAnonymous: true,
    testAdmin: true,
    colorScheme: 'dark',
  },
];
