// Presentation of captured evidence only. No theme inference or rule verdicts.
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const cell = value => String(value ?? 'unknown').replace(/\|/g, '\\|').replace(/[\r\n]/g, ' ');
const count = value => Array.isArray(value) ? value.length : 'not checked';
const assets = observation => observation?.context.themeAssets || [];
const modes = observation => observation ? JSON.stringify(Object.fromEntries(['prefersContrast', 'forcedColors', 'reducedMotion', 'reducedTransparency', 'reducedData', 'darkPreference', 'themeModeMarkers'].map(key => [key, observation.context[key]]))) : 'not observed';
const restyled = entry => entry?.printDelta?.restyledInPrint || entry?.printDelta?.changes.filter(row => row.different && ['style', 'before', 'after'].some(key => row.different[key])).map(row => row.key);
export function designArtifactNames(slug, when) {
  const stamp = new Date(when).toISOString().replace(/[:.]/g, '-');
  const safeSlug = String(slug).replace(/[^a-zA-Z0-9_-]/g, '_');
  const runId = `${safeSlug}-${stamp}`;
  return { runId, observations: `observations-${runId}.json`, summary: `SUMMARY-${runId}.md`, html: `report-${runId}.html` };
}
export function renderDesignReport(report) {
  const headers = ['#', 'Page', 'Account', 'Actual theme Before', 'Actual theme After', 'Screen differences'];
  const rows = report.pages.map(row => [row.id, row.spec.path, row.spec.account, row.sides.before.screen?.context.theme || 'unknown', row.sides.after.screen?.context.theme || 'unknown', row.screenComparison?.changes.length ?? 'not compared']);
  const notes = report.pages.flatMap(row => ['before', 'after'].flatMap(side => {
    const entry = row.sides[side];
    return [entry.error || entry.notCompared ? `${row.id} ${side}: ${entry.error || entry.notCompared}` : null,
      entry.screen?.truncated || entry.print?.truncated ? `${row.id} ${side}: element inventory truncated` : null,
      entry.print?.sheets.some(sheet => !sheet.readable) ? `${row.id} ${side}: unreadable stylesheets` : null].filter(Boolean);
  }));
  for (const [side, site] of Object.entries(report.sites || {})) if (site.configuration?.error) notes.push(`${side}: configuration evidence unavailable: ${site.configuration.error}`);
  const sections = report.pages.map(row => {
    const detail = ['Before', 'After'].map(label => {
      const side = label.toLowerCase(), entry = row.sides[side], context = entry.screen?.context;
      const config = report.sites[side]?.configuration?.theme || {};
      return `${label}: actual theme ${context?.theme || 'unknown'}; source ${context?.source || 'unavailable'}. Configured default ${config.default || 'unknown'}; configured admin ${config.admin || 'unknown'}. ` +
        `Stylesheet candidates: ${assets(entry.screen).map(asset => asset.name).join(', ') || 'none captured'} (supporting only). Observed preferences: ${modes(entry.screen)}`;
    });
    const printHeaders = ['Side', 'Hidden', 'Revealed', 'Restyled elements'];
    const printRows = ['before', 'after'].map(side => [side, count(row.sides[side].printDelta?.hiddenInPrint), count(row.sides[side].printDelta?.revealedInPrint), count(restyled(row.sides[side]))]);
    const idNote = `Identifier-only relationship changes: ${row.screenComparison?.referenceIdChanges?.length ?? 'not classified by this collector version'} on screen; ${row.printComparison?.referenceIdChanges?.length ?? 'not classified'} in print. Kept separately from structural/style differences.`;
    const printPair = `Before/after print differences: ${row.printComparison?.changes.length ?? 'not compared'}. Counts can overlap and include descendants and inherited styles; they are not unique defects.`;
    const changes = (row.screenComparison?.changes || []).slice(0, 20).map(change => `${change.key}: ${change.kind}; fields ${Object.keys(change.different || {}).join(', ') || 'unmatched'}`);
    const themeStatus = row.screenComparison?.themeChanged ? 'THEME CHANGE between Before and After' : row.screenComparison?.themeComparable ? 'Same reported theme on both sides' : 'Actual themes not comparable';
    const stateHeaders = ['State', 'Screen differences', 'Print differences', 'Restyled Before', 'Restyled After'];
    const stateRows = (row.stateComparisons || []).map(state => {
      const b = row.sides.before.states?.find(value => value.name === state.name);
      const a = row.sides.after.states?.find(value => value.name === state.name);
      return [state.name, state.screenComparison?.changes.length ?? 'not compared', state.printComparison?.changes.length ?? 'not compared', count(restyled(b)), count(restyled(a))];
    });
    const reviewHeaders = ['Side/state/preference', 'Editor UI/content elements', 'Print navigation/overlaps', 'Running animations', 'Declared transitions'];
    const reviewRows = [], preferenceRows = [];
    for (const side of ['before', 'after']) {
      const entry = row.sides[side];
      for (const [state, measurement] of [['initial', entry], ...(entry.states || []).map(value => [value.name, value])]) {
        for (const [preference, value] of [['requested', measurement], ...(measurement.reducedMotion ? [['reduce', measurement.reducedMotion]] : [])]) {
          if (!value.screen) continue;
          const motion = value.screen.motion, layout = value.print?.printLayout;
          reviewRows.push([`${side}/${state}/${preference}`, value.screen.editor ? `${value.screen.editor.uiElements}/${value.screen.editor.contentElements}` : 'not recorded', layout ? `${layout.navigation.length}/${layout.overlapCount}` : 'not recorded', count(motion?.running), count(motion?.declaredTransitions)]);
          if (value.readiness?.sampledStable === false || value.printReadiness?.sampledStable === false) notes.push(`${row.id} ${side} ${state} ${preference}: bounded readiness sample did not settle`);
          if (value.readiness?.editorExpected && !value.readiness.editorReady) notes.push(`${row.id} ${side} ${state} ${preference}: expected CKEditor editable surface missing; raw page still captured`);
          if (layout?.overlapCount) notes.push(`${row.id} ${side} ${state} ${preference}: ${layout.overlapCount} print navigation rectangle intersections; confirm in PDFs`);
        }
        if (measurement.preferenceComparisons) preferenceRows.push([side, state, measurement.preferenceComparisons.screen?.changes.length ?? 'not compared', measurement.preferenceComparisons.print?.changes.length ?? 'not compared']);
      }
    }
    const reviewNote = 'Print overlap candidates use viewport rectangles, not occlusion or pagination proof. Motion counts describe visible captured elements; declared transitions may never run. These are existing-page observations, independent of patch regressions. Editor UI and content styles are counted separately; content is not edited or saved.';
    const prefHeaders = ['Side', 'State', 'Default-to-reduced screen changes', 'Default-to-reduced print changes'];
    const reducedPair = row.reducedMotionComparisons ? `Reduced-motion Before/After differences: ${row.reducedMotionComparisons.screen?.changes.length ?? 'not compared'} screen; ${row.reducedMotionComparisons.print?.changes.length ?? 'not compared'} print.` : '';
    const geometryNote = `Before/after geometry changes (matched visible elements, >1 CSS pixel): ${row.screenLayoutComparison?.length ?? 'not recorded'} screen; ${row.printLayoutComparison?.length ?? 'not recorded'} print. Environment-specific text can change wrapping; values are not collected.`;
    const reviewMd = '\n\n' + table(reviewHeaders, reviewRows) + '\n\n' + reviewNote + '\n\n' + geometryNote + (preferenceRows.length ? '\n\n' + table(prefHeaders, preferenceRows) + '\n\n' + reducedPair : '');
    const reviewHtml = htmlTable('Editor, print layout and motion evidence', reviewHeaders, reviewRows) + `<p>${esc(reviewNote)}</p><p>${esc(geometryNote)}</p>` + (preferenceRows.length ? htmlTable('Within-page motion preference comparison', prefHeaders, preferenceRows) + `<p>${esc(reducedPair)}</p>` : '');
    const statesMd = stateRows.length ? '\n\nCurated interaction states:\n\n' + table(stateHeaders, stateRows) : '';
    const statesHtml = stateRows.length ? htmlTable('Curated interaction states', stateHeaders, stateRows) : '';
    const md = `## Page ${row.id}: ${row.spec.path}\n\n${themeStatus}. Account: ${row.spec.account}.\n\n` + detail.join('\n\n') + '\n\n' + table(printHeaders, printRows) + `\n\n${printPair}\n\n${idNote}\n\n` +
      (changes.length ? 'Captured screen differences (first 20):\n\n' + changes.map(value => '- ' + value).join('\n') : 'No captured screen differences.') + statesMd + reviewMd + '\n';
    const html = `<section><h2>Page ${esc(row.id)}: ${esc(row.spec.path)}</h2><p>${esc(themeStatus)}. Account: ${esc(row.spec.account)}.</p>` + detail.map(value => '<p>' + esc(value) + '</p>').join('') + htmlTable('Screen-to-print changes', printHeaders, printRows) + `<p>${esc(printPair)}</p><p>${esc(idNote)}</p>` +
      (changes.length ? '<p>Captured screen differences (first 20):</p><ul>' + changes.map(value => '<li>' + esc(value) + '</li>').join('') + '</ul>' : '<p>No captured screen differences.</p>') + statesHtml + reviewHtml + '</section>';
    return { md, html };
  });
  const transitions = report.themeTransitions.map(event => `${event.side} (${event.account}): ${event.from.theme} ${event.from.path} -> ${event.to.theme} ${event.to.path}`);
  const requested = `Variant: ${report.slug}. Capture started (UTC): ${report.when || 'not recorded'}. Requested preferences: ${JSON.stringify(report.requested)}. JSON evidence: ${report.artifacts?.observations || 'observations.json'}.`;
  const caveat = 'DRAFT. Differences are review candidates, not violations. Theme configuration and stylesheet candidates do not prove the active request theme. ARIA target signatures are not a full accessible-name computation; text hashes can still reveal guessable labels. Use test data.';
  const markdown = '# Design, theme and print observations\n\n' + caveat + '\n\n' + requested + '\n\n' + table(headers, rows) + '\n\n' + sections.map(value => value.md).join('\n') +
    '\n## Theme transitions\n\n' + (transitions.join('\n\n') || 'None observed; unknown theme observations leave gaps.') + '\n\n## Gaps and errors\n\n' + (notes.join('\n\n') || 'No page-level errors recorded.') + '\n\n## Coverage\n\n' + JSON.stringify(report.coverage) + '\n\n## Limitations\n\n' + report.limitations.join('\n\n') + '\n';
  const style = 'body{font:1rem/1.5 system-ui;max-width:100rem;margin:2rem}table{border-collapse:collapse;width:100%;table-layout:fixed}th,td{padding:.4rem;border:1px solid #555;text-align:left;overflow-wrap:anywhere}p,li,pre{overflow-wrap:anywhere}pre{white-space:pre-wrap}@media print{body{margin:0;color:#000;background:#fff;font-size:10pt}thead{display:table-header-group}tr{break-inside:avoid}h2{break-after:avoid}th,td{padding:3pt}@page{margin:12mm}}';
  const html = '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Design, theme and print observations</title><style>' + style + '</style><body><main><h1>Design, theme and print observations</h1><p>' + esc(caveat) + '</p><p>' + esc(requested) + '</p>' + htmlTable('Paired page observations', headers, rows) + sections.map(value => value.html).join('') + '<h2>Theme transitions</h2><pre>' + esc(transitions.join('\n') || 'None observed; unknown theme observations leave gaps.') + '</pre><h2>Gaps and errors</h2><pre>' + esc(notes.join('\n') || 'No page-level errors recorded.') + '</pre><h2>Coverage</h2><pre>' + esc(JSON.stringify(report.coverage, null, 2)) + '</pre><h2>Limitations</h2><ul>' + report.limitations.map(value => '<li>' + esc(value) + '</li>').join('') + '</ul><p>Full per-element evidence and stylesheet paths are in ' + esc(report.artifacts?.observations || 'observations.json') + '.</p></main></body></html>';
  return { markdown, html };
}
function table(headers, rows) { return '| ' + headers.join(' | ') + ' |\n|' + headers.map(() => '---').join('|') + '|\n' + rows.map(row => '| ' + row.map(cell).join(' | ') + ' |').join('\n'); }
function htmlTable(caption, headers, rows) { return '<table><caption>' + esc(caption) + '</caption><thead><tr>' + headers.map(value => '<th scope="col">' + esc(value) + '</th>').join('') + '</tr></thead><tbody>' + rows.map(row => '<tr>' + row.map(value => '<td>' + esc(value) + '</td>').join('') + '</tr>').join('') + '</tbody></table>'; }
