// Regression test for Mirror: drag a block row in Before and check After reorders too; hover marker appears; Page field follows navigation.
// Needs the viewer running on :8100 (node scripts/lab-env.mjs start <slug>). Run: node tools/playwright/mirror-drag.mjs
import { chromium } from '@playwright/test';
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1600, height: 1000 }, ignoreHTTPSErrors: true });
const p = await ctx.newPage();
await p.goto('http://localhost:8100/');
await p.click('#login'); await p.waitForTimeout(8000);
await p.fill('#goto', 'admin/structure/block'); await p.click('#go'); await p.waitForTimeout(9000);
console.log('page field:', await p.inputValue('#goto'));
const fb = p.frameLocator('#fb'), fa = p.frameLocator('#fa');
const rows = async (f) => (await f.locator('table#blocks tbody tr.draggable').evaluateAll((r) => r.map((x) => x.querySelector('td')?.textContent.trim().slice(0, 25)))).slice(0, 8);
console.log('before rows:', await rows(fb)); console.log('after rows:', await rows(fa));
// hover marker
await p.click('summary:has-text("Input")'); await p.check('#mirrorhover'); await p.keyboard.press('Escape');   // the Input popover would cover the frame
const handle = fb.locator('table#blocks tbody tr.draggable .tabledrag-handle').first();
await handle.scrollIntoViewIfNeeded(); const box = await handle.boundingBox();
await p.mouse.move(box.x + 5, box.y + 5); await p.waitForTimeout(500);
console.log('ghost in After:', await fa.locator('html > div[aria-hidden]').count());
// drag first handle down by ~3 rows
await p.mouse.down(); await p.mouse.move(box.x + 5, box.y + 60, { steps: 8 }); await p.mouse.move(box.x + 5, box.y + 110, { steps: 8 }); await p.mouse.up(); await p.waitForTimeout(800);
console.log('before rows after drag:', await rows(fb)); console.log('after rows after drag:', await rows(fa));
await b.close();
