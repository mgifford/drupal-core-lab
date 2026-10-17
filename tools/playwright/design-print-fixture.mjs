// Real Chromium fixture, no Drupal or DDEV. Synthetic editor, not actual CKEditor.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { capturePaperLayouts, comparePaperFindings } from './lib/design-print.mjs';
import { observeDesign } from './lib/design-observations.mjs';
import { settleDesign } from './lib/design-review.mjs';
import { writeDesignEvidence, readDesignEvidence } from './lib/design-artifacts.mjs';
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lab-print-'));
let browser;
try {
  browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.route('http://localhost/fixture', route => route.fulfill({ contentType: 'text/html', body: `<!doctype html><html lang="en"><meta charset="utf-8"><title>Print control</title>
    <style>body{margin:0}#panel{display:none}h1{margin:0;height:50px}
    @media print and (max-width:900px){body.overlap #panel{display:block;position:fixed;top:0;left:0;width:200px;height:100px}}
    @page{margin:12mm}
    </style><body><aside id="panel">Persistent panel</aside><h1 id="heading">Print control</h1>
    <div class="ck ck-editor"><div class="ck-content ck-editor__editable" contenteditable="true" role="textbox" aria-label="Synthetic editor"><p>Fixture content</p></div></div>
    <script>window.drupalSettings={ajaxPageState:{theme:'default_admin'}};</script></body></html>` }));
  await page.goto('http://localhost/fixture');
  await settleDesign(page, { editor: true });
  const [clean] = await capturePaperLayouts(page, { editor: true });
  assert.equal(clean.format, 'Letter');
  assert.equal(clean.snapshot.printLayout.overlapCount, 0);
  assert.ok(clean.snapshot.printRules.some(rule => rule.type === 'page' && Object.entries(rule.declarations).some(([key, value]) => key.startsWith('margin') && value === '12mm')));
  await page.evaluate(() => document.body.classList.add('overlap'));
  await page.emulateMedia({ media: 'print' });
  assert.equal((await observeDesign(page)).printLayout.overlapCount, 0, 'original desktop viewport misses this width-dependent problem');
  const [overlap] = await capturePaperLayouts(page, { editor: true, pdfFile: format => ({ path: path.join(directory, format + '.pdf'), name: format + '.pdf' }) });
  assert.ok(overlap.snapshot.printLayout.overlaps.some(item => item.navigation === '#panel' && item.content === '#heading'));
  assert.equal(comparePaperFindings(clean, overlap).findings[0].classification, 'introduced');
  assert.equal(comparePaperFindings(overlap, overlap).findings[0].classification, 'persistent');
  assert.equal(comparePaperFindings(overlap, clean).findings[0].classification, 'resolved');
  const [a4] = await capturePaperLayouts(page, { editor: true, formats: ['A4'] });
  assert.equal(a4.snapshot.viewport.width, 794);
  assert.ok(a4.snapshot.printLayout.overlapCount > 0);
  assert.deepEqual(page.viewportSize(), { width: 1280, height: 900 });
  const file = path.join(directory, 'observations.json.gz');
  writeDesignEvidence(file, { schema: 'lab-design-observations-3', pages: [], control: clean, deliberateProblem: overlap });
  assert.equal(readDesignEvidence(file).deliberateProblem.format, 'Letter');
  assert.ok(fs.statSync(path.join(directory, 'Letter.pdf')).size > 0);
  console.log('PASS: clean control, width-dependent overlap, draft identity comparisons, optional A4, PDF and gzip evidence');
  await context.close();
} finally {
  await browser?.close();
  fs.rmSync(directory, { recursive: true, force: true });
}
