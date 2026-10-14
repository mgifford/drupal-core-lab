// Evidence for #3618230: Adopt the ajax MessageCommand for file uploads (MR !16777).
//   node tools/playwright/evaluate-3618230.mjs [slug] [--browser=chromium|firefox|webkit] [--scheme=light|dark] [--forced-colors] [--viewport=WxH] [--out=<dir>]
// Defaults: slug 3618230-latest, chromium, light, 1280x900.
// Answers comment #10 (does the problem occur in the Default Admin theme now that Olivero is gone?). For each side: opens
// /node/add/article, uploads a 2 KB .txt into the Attachment field (1 KB limit) with real file input, and records the error
// markup, where it sits, any SVG or Hide button in it, an accessibility snapshot and an axe scan. Then uploads the oversized
// file again (stale messages must not pile up) and a valid file (the error must go away).
// The context, AJAX commands and announcements are recorded by tools/playwright/lib/lab-run.mjs (see there).
// Writes reports/issues/3618230/playwright/<stamp>-<envTag>/ (results.json, SUMMARY.md, ajax-*.json, *.png) or --out.
import path from 'node:path';
import { runArgs, launch, openSide, axeScan, baseResults, writeRun, contextMarkdown, ajaxMarkdown, speechMarkdown } from './lib/lab-run.mjs';

const run = runArgs({ slug: '3618230-latest' });
const { v, out } = run;
const INPUT = 'input[name="files[field_attachment_0]"]';
const BIG = { name: 'too-big.txt', mimeType: 'text/plain', buffer: Buffer.alloc(2048, 'a') };
const SMALL = { name: 'small.txt', mimeType: 'text/plain', buffer: Buffer.from('small file\n') };

// Upload through the real file input and return the AJAX commands of the upload response.
async function upload(page, file) {
  const resp = page.waitForResponse((r) => r.request().method() === 'POST' && r.url().includes('element_parents'), { timeout: 20000 });
  await page.locator(INPUT).setInputFiles(file);
  const r = await resp;
  const commands = await r.json().catch(() => []);
  await page.waitForTimeout(1000);                       // Drupal.announce debounces; let behaviours run
  return commands.map((c) => ({
    command: c.command, method: c.method, selector: c.selector ?? null,
    messageWrapperQuerySelector: c.messageWrapperQuerySelector ?? null, clearPrevious: c.clearPrevious ?? null,
    type: c.messageOptions?.type ?? null, message: c.message ?? null,
    dataHasError: typeof c.data === 'string' && /could not be uploaded/.test(c.data),
    dataHasSvg: typeof c.data === 'string' && /<svg/i.test(c.data),
    data: c.command === 'insert' ? c.data : undefined,   // raw replaced markup, as the server sent it
  }));
}

const probe = (page) => page.evaluate((inputSel) => {
  const errs = [...document.querySelectorAll('.messages--error, [data-drupal-message-type="error"]')]
    .filter((el, i, all) => !all.some((o) => o !== el && o.contains(el)));
  const widget = document.querySelector('[data-drupal-selector="edit-field-attachment-wrapper"]');
  const live = document.getElementById('drupal-live-announce');
  const a = document.activeElement;
  return {
    errorCount: errs.length,
    errors: errs.map((el) => ({
      html: el.outerHTML.replace(/\s+/g, ' ').trim(),
      text: el.textContent.replace(/\s+/g, ' ').trim(),
      role: el.getAttribute('role'), ariaLive: el.getAttribute('aria-live'),
      inWidget: !!(widget && widget.contains(el)),
      inUploadMessages: !!el.closest('.file-upload-messages'),
      hasSvg: !!el.querySelector('svg'), hasHideButton: !!el.querySelector('button'),
      hasHeading: !!el.querySelector('h2'),
      iconCss: (() => { const h = el.querySelector('.messages__header'); if (!h) return null; const s = getComputedStyle(h, '::before'); return s.content !== 'none' ? (s.maskImage || s.webkitMaskImage || s.backgroundImage) : 'none'; })(),
    })),
    uploadMessageContainers: document.querySelectorAll('.file-upload-messages').length,
    liveRegion: live ? { text: live.textContent.trim(), ariaLive: live.getAttribute('aria-live') } : null,
    activeElement: a ? `${a.tagName.toLowerCase()}${a.id ? '#' + a.id : ''}${a.name ? '[name=' + a.name + ']' : ''}` : null,
    fileInputPresent: !!document.querySelector(inputSel),
    fileLink: !!(widget && widget.querySelector('.file a, a[type^="text/plain"], .file--mime-text-plain a')),
  };
}, INPUT);

async function runSide(side) {
  const { page, rec } = await openSide(run, side);
  await page.goto(page.url().replace(/^(https?:\/\/[^/]+).*/, '$1') + '/node/add/article');
  await page.locator(INPUT).waitFor({ state: 'attached', timeout: 15000 });
  const formTheme = await page.evaluate(() => window.drupalSettings?.ajaxPageState?.theme ?? null);

  await rec.collect();                                    // speech before this point belongs to page load
  const loadSpeech = { announce: rec.speech.announce.splice(0), live: rec.speech.live.splice(0) };
  const commands1 = await upload(page, BIG);
  const after1 = await probe(page);
  after1.speech = JSON.parse(JSON.stringify((await rec.collect()).speech));
  const field = page.locator('[data-drupal-selector="edit-field-attachment-wrapper"]');
  await field.screenshot({ path: path.join(out, `${side}-1-error.png`) }).catch(() => page.screenshot({ path: path.join(out, `${side}-1-error.png`) }));
  let aria = '';
  try { aria = (await field.ariaSnapshot()).trim(); } catch (e) { aria = `(unavailable: ${e.message})`; }
  const axe = await axeScan(page);

  const commands2 = await upload(page, BIG);
  const after2 = await probe(page);
  const commands3 = await upload(page, SMALL);
  const after3 = await probe(page);
  await field.screenshot({ path: path.join(out, `${side}-2-valid.png`) }).catch(() => {});
  await rec.close(out);
  rec.speech.announce.unshift(...loadSpeech.announce); rec.speech.live.unshift(...loadSpeech.live);
  return Object.assign(rec, { formTheme, commands1, after1, aria, axe, commands2, after2, commands3, after3 });
}

const { browser, environment } = await launch(run);
run.browser = browser;
const results = baseResults(run, environment);
try {
  for (const side of ['before', 'after']) { console.log(`running ${side} (${v[side].env}) ...`); results.sides[side] = await runSide(side); }
} finally { await browser.close(); }

const B = results.sides.before, A = results.sides.after;
const yn = (b) => (b ? 'yes' : 'no');
const cmds = (c) => c.map((x) => x.command + (x.command === 'message' ? `(${x.type})` : '')).join(', ');
const e1 = (s) => s.after1.errors[0] || {};
const ins = (s) => (s.commands1.find((x) => x.command === 'insert') || {}).data || '';
const errAnn = (s) => s.after1.speech.announce.filter((x) => /exceed|maximum|size/i.test(x.text));
const errLive = (s) => s.after1.speech.live.filter((x) => /exceed|maximum|size/i.test(x.text));
const checks = [
  ['context', 'Theme of the node form (drupalSettings)', B.formTheme, A.formTheme, B.formTheme === A.formTheme],
  ['fix', 'AJAX commands for the failed upload', cmds(B.commands1), cmds(A.commands1), !B.commands1.some((x) => x.command === 'message') && A.commands1.some((x) => x.command === 'message')],
  ['fix', 'Error text inside the replaced markup (insert command)', yn(B.commands1.some((x) => x.dataHasError)), yn(A.commands1.some((x) => x.dataHasError)), B.commands1.some((x) => x.dataHasError) && !A.commands1.some((x) => x.dataHasError)],
  ['fix', 'Error rendered inside .file-upload-messages', yn(e1(B).inUploadMessages), yn(e1(A).inUploadMessages), !e1(B).inUploadMessages && e1(A).inUploadMessages],
  ['same', 'Error shown, inside the Attachment widget', `${B.after1.errorCount}, ${yn(e1(B).inWidget)}`, `${A.after1.errorCount}, ${yn(e1(A).inWidget)}`, B.after1.errorCount === 1 && A.after1.errorCount === 1 && e1(B).inWidget && e1(A).inWidget],
  ['observe', 'SVG markup in the error (Olivero symptom)', yn(e1(B).hasSvg), yn(e1(A).hasSvg), true],
  ['observe', 'Error carries role', e1(B).role, e1(A).role, true],
  ['observe', 'Visually hidden heading in the error', yn(e1(B).hasHeading), yn(e1(A).hasHeading), true],
  ['observe', '"Hide" <button> in the server-sent insert markup', yn(/<button[^>]*js-message-button-hide/.test(ins(B))), yn(/<button[^>]*js-message-button-hide/.test(ins(A))), true],
  ['observe', '"Hide" dismiss button in the error (page)', yn(e1(B).hasHideButton), yn(e1(A).hasHideButton), true],
  ['observe', 'Drupal.announce() calls with the error text', errAnn(B).map((x) => x.priority).join(', ') || 'none', errAnn(A).map((x) => x.priority).join(', ') || 'none', true],
  ['observe', 'Live regions whose text changed to the error', errLive(B).map((x) => x.role || x.ariaLive).join(', ') || 'none', errLive(A).map((x) => x.role || x.ariaLive).join(', ') || 'none', true],
  ['regression', 'Errors after a second oversized upload (no pile-up)', B.after2.errorCount, A.after2.errorCount, B.after2.errorCount === 1 && A.after2.errorCount === 1],
  ['regression', 'Errors after a valid upload', B.after3.errorCount, A.after3.errorCount, B.after3.errorCount === 0 && A.after3.errorCount === 0],
  ['regression', 'Valid file accepted (file input gone)', yn(!B.after3.fileInputPresent), yn(!A.after3.fileInputPresent), !B.after3.fileInputPresent && !A.after3.fileInputPresent],
  ['regression', 'Focus after the failed upload', B.after1.activeElement, A.after1.activeElement, true],
  ['regression', 'axe violations (elements), page with the error', B.axe.total, A.axe.total, B.axe.total === A.axe.total],
  ['regression', 'JavaScript errors', B.jsErrors.length, A.jsErrors.length, B.jsErrors.length === 0 && A.jsErrors.length === 0],
];
let unexpected = 0;
let md = `# Playwright evidence: #${v.issue} (${v.slug})\n\nRun ${results.when}. Core Before \`${results.commits.before}\`, After \`${results.commits.after}\` plus \`${(results.patches[0] || 'none').split('/').pop()}\`. ${environment.browser} ${environment.browserVersion}, ${environment.colorScheme}${environment.forcedColors ? ', forced colours' : ''}, ${run.viewport.width}x${run.viewport.height}, ${environment.os}. Real file input (Playwright setInputFiles), axe-core WCAG 2.0 to 2.2 A/AA. Recorders: tools/playwright/lib/lab-run.mjs.\n\nRule: **fix** rows differ as the MR intends; **same** and **regression** rows match on both sides; **observe** and **context** rows are recorded, not judged.\n\n| Type | Check | Before | After | Verdict |\n|---|---|---|---|---|\n`;
for (const [t, label, b, a, good] of checks) { const judged = t === 'fix' || t === 'same' || (t === 'regression' && !/Focus/.test(label)); if (judged && !good) unexpected++; md += `| ${t} | ${label} | ${b} | ${a} | ${judged ? (good ? 'as expected' : '**NOT as expected**') : 'recorded'} |\n`; }
md += `\n## Error markup after the failed upload\n\nBefore:\n\n\`\`\`html\n${e1(B).html || '(none)'}\n\`\`\`\n\nAfter:\n\n\`\`\`html\n${e1(A).html || '(none)'}\n\`\`\`\n\n`;
md += `Icon (computed ::before mask or background of .messages__header): Before \`${e1(B).iconCss}\`, After \`${e1(A).iconCss}\`.\n\n`;
md += `## Accessibility snapshot of the Attachment field after the failed upload\n\nBefore:\n\n\`\`\`yaml\n${B.aria}\n\`\`\`\n\nAfter:\n\n\`\`\`yaml\n${A.aria}\n\`\`\`\n\n`;
md += contextMarkdown(results) + ajaxMarkdown(results) + speechMarkdown(results);
md += `axe rules: Before ${JSON.stringify(B.axe.rules)}, After ${JSON.stringify(A.axe.rules)}. JavaScript errors: Before ${JSON.stringify(B.jsErrors)}, After ${JSON.stringify(A.jsErrors)}.\n\nScreenshots: \`before-1-error.png\`, \`after-1-error.png\`, \`before-2-valid.png\`, \`after-2-valid.png\`.\n\n`;
md += unexpected === 0 ? `**Behaves as the MR intends** on the judged rows. Read the observe rows for the theme question.\n` : `**${unexpected} judged row(s) not as expected**: read the table before drawing a conclusion.\n`;
md += `\n---\nAutomated evidence is a DRAFT: DOM, AJAX and axe checks do not replace a keyboard and screen-reader pass by a person.\n`;
results.verdict = unexpected === 0 ? 'reproduced-and-fixed' : 'mixed';
results.unexpected = unexpected;
for (const side of ['before', 'after']) for (const k of ['commands1', 'commands2', 'commands3']) for (const c of results.sides[side][k]) delete c.data;   // raw markup is in ajax-<side>.json
const where = writeRun(run, results, md);
console.log(`\n${unexpected === 0 ? 'OK' : 'UNEXPECTED'}: ${where}/SUMMARY.md`);
process.exit(unexpected === 0 ? 0 : 2);
