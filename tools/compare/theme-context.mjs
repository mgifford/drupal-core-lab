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
  // Assets can include base themes and component libraries. They support an inference,
  // but do not identify the active request theme or its negotiation reason.
  const assetMap = new Map();
  for (const link of document.querySelectorAll?.('link[rel~="stylesheet"][href]') || []) {
    try {
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin) continue;
      const match = url.pathname.match(/^\/(?:core\/themes|themes(?:\/(?:custom|contrib))?|sites\/[^/]+\/themes(?:\/(?:custom|contrib))?)\/([^/]+)\//);
      if (!match || !/^[a-zA-Z0-9_]+$/.test(match[1])) continue;
      if (!assetMap.has(match[1])) assetMap.set(match[1], []);
      const paths = assetMap.get(match[1]);
      if (paths.length < 5 && !paths.includes(url.pathname)) paths.push(url.pathname);
      if (assetMap.size >= 20) break;
    } catch { /* Invalid stylesheet URL gives no evidence. */ }
  }
  const themeAssets = [...assetMap].map(([name, paths]) => ({ name, paths, source: 'stylesheet-path', confidence: 'supporting-only' }));
  return {
    theme: typeof theme === 'string' ? theme.slice(0, 120) : null,
    source: theme ? evidence : 'unavailable',
    themeAssets,
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
