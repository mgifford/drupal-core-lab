// The test matrix of an issue: which browser, colour scheme, forced colours and width combinations count as "covered".
// scripts/new-issue.mjs writes NEW_ISSUE_MATRIX into a new issue's pinned variant as `coverage.matrix`, so each issue carries
// its own, editable list; an issue pack may give its own (variant.coverage). scripts/coverage.mjs reads it.
// Issues created before 2026-10-14 have none and keep the old 480 px matrix in coverage.mjs.
export const NEW_ISSUE_MATRIX = [
  { browser: 'chromium', scheme: 'light', forced: false, width: 1280 },
  { browser: 'chromium', scheme: 'dark', forced: false, width: 1280 },
  { browser: 'chromium', scheme: 'light', forced: true, width: 1280 },
  { browser: 'chromium', scheme: 'light', forced: false, width: 480 },
  { browser: 'firefox', scheme: 'light', forced: false, width: 1280 },
  { browser: 'webkit', scheme: 'light', forced: false, width: 1280 },
];

// Problems with a coverage block, as [where, message] pairs; empty when it is valid.
export function matrixProblems(coverage, at = 'coverage') {
  const out = [];
  const isObj = (x) => x && typeof x === 'object' && !Array.isArray(x);
  if (!isObj(coverage)) return [[at, 'must be a mapping with a matrix list']];
  for (const k of Object.keys(coverage)) if (!['matrix', 'note', 'blocked', 'manual'].includes(k)) out.push([`${at}.${k}`, 'is not a known key (allowed: matrix, note, blocked, manual)']);
  const m = coverage.matrix;
  if (!Array.isArray(m) || !m.length || m.length > 24) return [...out, [`${at}.matrix`, 'must list 1 to 24 combinations']];
  m.forEach((c, i) => {
    const a = `${at}.matrix[${i}]`;
    if (!isObj(c)) { out.push([a, 'must be a mapping of browser, scheme, forced, width']); return; }
    for (const k of Object.keys(c)) if (!['browser', 'scheme', 'forced', 'width'].includes(k)) out.push([`${a}.${k}`, 'is not a known key']);
    if (!['chromium', 'firefox', 'webkit'].includes(c.browser)) out.push([`${a}.browser`, 'must be chromium, firefox or webkit']);
    if (!['light', 'dark'].includes(c.scheme)) out.push([`${a}.scheme`, 'must be light or dark']);
    if (c.forced !== undefined && typeof c.forced !== 'boolean') out.push([`${a}.forced`, 'must be true or false']);
    if (!Number.isInteger(c.width) || c.width < 200 || c.width > 3000) out.push([`${a}.width`, 'must be a whole number of CSS pixels from 200 to 3000']);
  });
  return out;
}
