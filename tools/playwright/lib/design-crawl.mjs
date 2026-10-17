// Coverage counts describe work done, not all pages available in a site.
export function contextIdentity(spec) {
  const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
  return JSON.stringify([spec.account, canonical(spec.context || {}), spec.scenario || null]);
}
export function resolvedIdentity(spec, pathname) { return contextIdentity(spec) + ':' + pathname; }
export function navigationOutcome({ status, error, redirected, duplicateOf }) {
  if (error) return 'failed';
  if (status === 404 || status === 410) return 'missing';
  if (status == null || status >= 400) return 'failed';
  if (redirected) return duplicateOf ? 'redirect-duplicate' : 'redirected';
  return duplicateOf ? 'duplicate' : 'captured';
}
export function designCoverage(pages) {
  const sideCounts = { before: {}, after: {} };
  for (const row of pages) for (const side of ['before', 'after']) {
    const entry = row.sides[side] || {};
    const outcome = entry.outcome || navigationOutcome(entry);
    sideCounts[side][outcome] = (sideCounts[side][outcome] || 0) + 1;
  }
  return {
    attempted: pages.length,
    compared: pages.filter(row => row.screenComparison).length,
    missing: pages.filter(row => Object.values(row.sides).some(entry => entry.status === 404 || entry.status === 410)).length,
    redirected: pages.filter(row => Object.values(row.sides).some(entry => entry.redirected)).length,
    duplicateRoutes: pages.filter(row => Object.values(row.sides).some(entry => entry.duplicateOf)).length,
    failed: pages.filter(row => Object.values(row.sides).some(entry => entry.outcome === 'failed' || entry.error || entry.status == null || (entry.status >= 400 && ![404, 410].includes(entry.status)))).length,
    partial: pages.filter(row => !!row.sides.before?.screen !== !!row.sides.after?.screen).length,
    sideCounts,
    countNote: 'Page categories can overlap; attempted counts paired route attempts. Compared requires captured screen evidence on both sides. Redirects and aliases are not new compared coverage.',
  };
}
