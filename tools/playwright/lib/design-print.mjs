import fs from 'node:fs';
import { observeDesign } from './design-observations.mjs';
import { settleDesign } from './design-review.mjs';
export const PAPER_FORMATS = Object.freeze([
  Object.freeze({ format: 'A4', widthInches: 210 / 25.4, heightInches: 297 / 25.4, viewport: Object.freeze({ width: 794, height: 1123 }) }),
  Object.freeze({ format: 'Letter', widthInches: 8.5, heightInches: 11, viewport: Object.freeze({ width: 816, height: 1056 }) }),
]);
const ruleData = JSON.parse(fs.readFileSync(new URL('../../../docs/design/contracts.json', import.meta.url), 'utf8'));
const rules = Object.fromEntries(['PRN-01', 'PRN-02', 'PRN-03'].map(id => {
  const r = ruleData.rules.find(rule => rule.id === id);
  if (!r || r.accepted !== false || r.status !== 'proposal') throw new Error('Print review requires the expected draft contract: ' + id);
  return [id, { id, title: r.title, status: r.status, accepted: false, source: 'docs/design/contracts.json', documentVersion: ruleData.document_version }];
}));
export async function capturePaperLayouts(page, { limit = 4000, editor = false, contrast = 'no-preference', reducedMotion = 'no-preference', formats = ['Letter'], pdfFile } = {}, { observe = observeDesign, settle = settleDesign } = {}) {
  if (!Array.isArray(formats) || !formats.length || formats.some(format => !PAPER_FORMATS.some(profile => profile.format === format))) throw new Error('Unknown or empty paper format selection');
  const profiles = PAPER_FORMATS.filter(profile => formats.includes(profile.format));
  const viewport = page.viewportSize();
  if (!viewport) throw new Error('An explicit viewport is required for restorable paper measurements');
  const scroll = await page.evaluate(() => ({ x: scrollX, y: scrollY }));
  const papers = [];
  try {
    for (const profile of profiles) {
      const paper = { ...profile, method: 'paper-width-emulation', caveat: '96 CSS pixels per inch, rounded viewport. CSS @page margins, page size, print fragmentation and native printing are not resolved by this geometry. The PDF is separate evidence.' };
      try {
        await page.setViewportSize(profile.viewport);
        await page.emulateMedia({ media: 'print', contrast, reducedMotion });
        await page.evaluate(() => scrollTo({ left: 0, top: 0, behavior: 'instant' }));
        paper.readiness = await settle(page, { editor });
        paper.snapshot = await observe(page, { limit, geometryOnly: true });
        if (pdfFile) {
          const file = pdfFile(profile.format);
          try {
            await page.pdf({ path: file.path, format: profile.format, printBackground: false, preferCSSPageSize: false });
            paper.pdf = file.name;
          } catch (error) { paper.pdfError = String(error.message).split('\n')[0].replace(/https?:\/\/\S+/g, '[URL]').slice(0, 300); }
        }
      } catch (error) { paper.error = String(error.message).split('\n')[0].replace(/https?:\/\/\S+/g, '[URL]').slice(0, 300); }
      papers.push(paper);
    }
  } finally {
    await page.setViewportSize(viewport);
    await page.evaluate(value => scrollTo({ left: value.x, top: value.y, behavior: 'instant' }), scroll);
  }
  return papers;
}
function candidates(paper) {
  const layout = paper?.snapshot?.printLayout;
  if (!layout) return [];
  return [
    ...layout.overlaps.map(item => ({ id: JSON.stringify(['PRN-02', 'intersection', item.navigation, item.content]), ruleId: 'PRN-02', kind: 'rectangle-intersection', evidence: item })),
    ...(layout.horizontalOverflow || []).map(key => ({ id: JSON.stringify(['PRN-02', 'horizontal-overflow', key]), ruleId: 'PRN-02', kind: 'horizontal-overflow', evidence: { content: key } })),
  ];
}
function gaps(paper) {
  if (!paper?.snapshot || paper.error) return [paper?.error || 'Paper-width snapshot unavailable'];
  const result = [];
  if (paper.method !== 'paper-width-emulation') result.push('Paper measurement method unavailable');
  if (paper.snapshot.media?.print !== true) result.push('Print media not confirmed');
  if (paper.snapshot.viewport?.width !== paper.viewport?.width || paper.snapshot.viewport?.height !== paper.viewport?.height) result.push('Measured viewport differs from the paper profile');
  if (paper.snapshot.truncated || paper.snapshot.printLayout?.capped) result.push('Element or intersection evidence truncated');
  if (paper.readiness?.sampledStable !== true) result.push('Readiness sample unavailable or unstable');
  if (paper.readiness?.editorExpected && !paper.readiness.editorReady) result.push('Expected editor missing');
  const keys = paper.snapshot.nodes.map(node => node.key);
  if (new Set(keys).size !== keys.length) result.push('Duplicate structural keys');
  if (!paper.snapshot.context?.theme) result.push('Actual request theme unknown');
  return result;
}
export function comparePaperFindings(before, after) {
  const reasons = [...gaps(before).map(value => 'Before: ' + value), ...gaps(after).map(value => 'After: ' + value)];
  if (before?.snapshot && after?.snapshot) {
    if (before.format !== after.format || JSON.stringify(before.viewport) !== JSON.stringify(after.viewport)) reasons.push('Paper profiles differ');
    for (const key of ['theme', 'language', 'direction', 'forcedColors', 'prefersContrast', 'reducedMotion', 'darkPreference']) {
      if (before.snapshot.context?.[key] !== after.snapshot.context?.[key]) reasons.push('Context differs: ' + key);
    }
    if (JSON.stringify([...(before.snapshot.context?.themeModeMarkers || [])].sort()) !== JSON.stringify([...(after.snapshot.context?.themeModeMarkers || [])].sort())) reasons.push('Theme mode markers differ');
  }
  const b = new Map(candidates(before).map(item => [item.id, item]));
  const a = new Map(candidates(after).map(item => [item.id, item]));
  const findings = [...new Set([...b.keys(), ...a.keys()])].map(id => ({
    id, rule: rules['PRN-02'], candidate: true,
    classification: reasons.length ? 'inconclusive' : b.has(id) && a.has(id) ? 'persistent' : b.has(id) ? 'resolved' : 'introduced',
    before: b.get(id) || null, after: a.get(id) || null, reasons,
  }));
  if (reasons.length && !findings.length) findings.push({ id: 'paper-coverage', rule: rules['PRN-02'], candidate: true, classification: 'inconclusive', before: null, after: null, reasons });
  return { comparable: !reasons.length, findings,
    manualReviews: [
      { rule: rules['PRN-01'], classification: 'inconclusive', reason: 'Page-specific content inclusion and removal intent has not been reviewed.' },
      { rule: rules['PRN-03'], classification: 'inconclusive', reason: 'PDF pagination, nearly empty sheets, monochrome appearance and PDF accessibility require review.' },
    ], note: 'Draft review candidates by structural identity, not violations or proof of patch causation. No candidates does not establish acceptable print output.' };
}
export function printReviewsForPage(row) {
  const result = [];
  const b = row.sides.before, a = row.sides.after;
  const states = new Set(['initial', ...[...(b.states || []), ...(a.states || [])].map(state => state.name)]);
  for (const state of states) {
    const before = state === 'initial' ? b : b.states?.find(value => value.name === state);
    const after = state === 'initial' ? a : a.states?.find(value => value.name === state);
    const preferences = before?.reducedMotion || after?.reducedMotion ? ['requested', 'reduce'] : ['requested'];
    const selected = row.paperFormats || [...new Set([...(before?.papers || []), ...(after?.papers || []), ...(before?.reducedMotion?.papers || []), ...(after?.reducedMotion?.papers || [])].map(paper => paper.format))];
    const formats = selected.length ? selected : ['Letter'];
    for (const preference of preferences) for (const format of formats) {
      const left = (preference === 'reduce' ? before?.reducedMotion : before)?.papers?.find(paper => paper.format === format);
      const right = (preference === 'reduce' ? after?.reducedMotion : after)?.papers?.find(paper => paper.format === format);
      result.push({ state, preference, format, ...comparePaperFindings(left, right) });
    }
  }
  return result;
}
