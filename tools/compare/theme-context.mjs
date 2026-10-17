// Read-only browser metadata. Safe to serialize into the existing proxy script.
// This is browser-reported evidence, not a server-side theme-negotiation trace.
export function browserThemeContext() {
  let settings = window.drupalSettings;
  let evidence = 'drupalSettings';
  if (!settings?.ajaxPageState?.theme) {
    try {
      settings = JSON.parse(document.querySelector('script[data-drupal-selector="drupal-settings-json"]')?.textContent || '{}');
      evidence = 'settings-json';
    } catch { settings = {}; }
  }
  const theme = settings?.ajaxPageState?.theme;
  return {
    theme: typeof theme === 'string' ? theme.slice(0, 120) : null,
    source: theme ? evidence : 'unavailable',
    path: /\/user\/reset(?:\/|$)/.test(location.pathname) ? '/[one-time-login]' : location.pathname,
    language: document.documentElement.lang || null,
    direction: document.documentElement.dir || getComputedStyle(document.documentElement).direction,
    forcedColors: matchMedia('(forced-colors: active)').matches,
    prefersContrast: ['more', 'less', 'custom', 'no-preference'].find(value => matchMedia('(prefers-contrast: ' + value + ')').matches) || null,
    reducedMotion: ['reduce', 'no-preference'].find(value => matchMedia('(prefers-reduced-motion: ' + value + ')').matches) || null,
    reducedTransparency: ['reduce', 'no-preference'].find(value => matchMedia('(prefers-reduced-transparency: ' + value + ')').matches) || null,
    reducedData: ['reduce', 'no-preference'].find(value => matchMedia('(prefers-reduced-data: ' + value + ')').matches) || null,
    darkPreference: matchMedia('(prefers-color-scheme: dark)').matches,
    themeModeMarkers: [...document.documentElement.classList].filter(value => /contrast|dark-mode/i.test(value)),
  };
}
