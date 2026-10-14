// The shape of a lab run's results.json (schema 2), without any dependency, so tests and scripts/selftest.mjs can check it.
export const SCHEMA = 2;
export const VERDICTS = ['reproduced-and-fixed', 'reproduced-not-fixed', 'not-reproduced', 'mixed'];

// Problems with a results object, as short strings; empty when it is complete.
export function runProblems(r) {
  const p = [];
  if (!r || typeof r !== 'object') return ['not an object'];
  for (const k of ['variant', 'issue', 'when', 'environment', 'commits', 'sides']) if (r[k] == null) p.push(`${k} missing`);
  if (!VERDICTS.includes(r.verdict)) p.push(`verdict must be one of ${VERDICTS.join(', ')}`);
  if (typeof r.unexpected !== 'number') p.push('unexpected must be a number');
  for (const s of ['before', 'after']) {
    const x = r.sides && r.sides[s];
    if (!x) { p.push(`sides.${s} missing`); continue; }
    for (const k of ['site', 'pages', 'ajax', 'speech']) if (x[k] == null) p.push(`sides.${s}.${k} missing`);
    if (x.site && !x.site.php && !x.site.error) p.push(`sides.${s}.site has no php version and no error`);
    if (Array.isArray(x.pages) && !x.pages.some((pg) => pg.theme)) p.push(`sides.${s}.pages records no theme`);
  }
  return p;
}
