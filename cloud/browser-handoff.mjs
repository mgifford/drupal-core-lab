// Portable viewer settings only. Cookies, form contents and login URLs are never transferred.
export const RADIOS = { width: ['half', '375px', '768px'], view: ['side', 'onion', 'diff'], theme: ['auto', 'light', 'dark'], dir: ['auto', 'ltr', 'rtl'] };
export const CHECKS = ['syncscroll', 'syncnav', 'mirror', 'mirrorhover', 'darkos', 'nojs', 'axeon', 'axebest', 'lhon', 'lhperf'];
export function cleanHandoff(value) {
  if (!value || value.version !== 1 || !/^[a-zA-Z0-9_-]{1,100}$/.test(value.slug || '')) throw Error('Invalid comparison link.');
  const out = { version: 1, slug: value.slug, paths: {}, scroll: {}, controls: {}, forcedColors: !!value.forcedColors };
  for (const side of ['before', 'after']) {
    const p = value.paths?.[side] || '/';
    if (typeof p !== 'string' || p.length > 2048 || !/^\/(?!\/)/.test(p) || /[\x00-\x20\\]|\/user\/reset|pass-reset-token/i.test(p)) throw Error('Comparison links cannot contain login links or external URLs.');
    out.paths[side] = p;
    out.scroll[side] = Object.fromEntries(['x', 'y'].map(k => [k, Math.max(0, Math.min(1000000, Number.isFinite(value.scroll?.[side]?.[k]) ? value.scroll[side][k] : 0))]));
  }
  for (const [key, allowed] of Object.entries(RADIOS)) if (allowed.includes(value.controls?.[key])) out.controls[key] = value.controls[key];
  for (const key of CHECKS) if (typeof value.controls?.[key] === 'boolean') out.controls[key] = value.controls[key];
  for (const [key, min, max] of [['opacity', 0, 100], ['amplify', 1, 12]]) if (Number.isFinite(Number(value.controls?.[key]))) out.controls[key] = Math.max(min, Math.min(max, Number(value.controls[key])));
  if (value.dock && ['steps', 'checks', 'manual', 'axe', 'lh', 'env'].includes(value.dock.tab)) out.dock = { tab: value.dock.tab, collapsed: !!value.dock.collapsed, large: !!value.dock.large };
  return out;
}
export const handoffHash = value => '#compare=' + encodeURIComponent(JSON.stringify(cleanHandoff(value)));
export function readHandoff(hash) {
  if (!hash.startsWith('#compare=')) return null;
  if (hash.length > 16000) throw Error('Comparison link is too long.');
  return cleanHandoff(JSON.parse(decodeURIComponent(hash.slice(9))));
}
export function currentBrowser(ua = '') {
  if (/Edg(?:e|A|iOS)?\//.test(ua)) return 'edge';
  if (/Firefox\/|FxiOS\//.test(ua)) return 'firefox';
  if (/Chrome\/|CriOS\//.test(ua)) return 'chrome';
  if (/Safari\//.test(ua)) return 'safari';
  return null;
}
