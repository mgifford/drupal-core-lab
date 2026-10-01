// Regression test for Mirror with CKEditor 5: typing in the Body editor in Before must appear in After, and the other way round.
// Needs the viewer running on :8100 (node scripts/lab-env.mjs start <slug>). Run: node tools/playwright/mirror-ckeditor.mjs
import { chromium } from '@playwright/test';
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1600, height: 1000 }, ignoreHTTPSErrors: true });
const p = await ctx.newPage();
await p.goto('http://localhost:8100/');
await p.click('#login'); await p.waitForTimeout(8000);
await p.fill('#goto', 'node/add/article'); await p.click('#go'); await p.waitForTimeout(9000);
const ed = (side) => p.frameLocator(side).locator('.ck-editor__editable').first();
const text = (side) => ed(side).innerText();
await ed('#fb').click(); await p.keyboard.type('Typed in Before', { delay: 30 }); await p.waitForTimeout(1500);
const a = { before: (await text('#fb')).trim(), after: (await text('#fa')).trim() };
console.log('Before -> After:', JSON.stringify(a));
await ed('#fa').click(); await p.keyboard.press('End'); await p.keyboard.type(' and typed in After', { delay: 30 }); await p.waitForTimeout(1500);
const c = { before: (await text('#fb')).trim(), after: (await text('#fa')).trim() };
console.log('After -> Before:', JSON.stringify(c));
await b.close();
const ok = a.before === a.after && a.after.includes('Typed in Before') && c.before === c.after && c.before.includes('typed in After');
console.log(ok ? 'PASS: CKEditor typing is mirrored both ways' : 'FAIL: editors differ');
process.exit(ok ? 0 : 1);
