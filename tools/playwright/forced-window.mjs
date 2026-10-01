// Test for the viewer's forced-colours window: click "Open forced-colours window", switch modes, and check that BOTH frames report the setting.
// Needs the viewer running on :8100, started with LAB_EMULATION_HEADLESS=1 so no window pops up on screen:
//   LAB_EMULATION_HEADLESS=1 node tools/compare/serve.mjs --ddev <slug>      then      node tools/playwright/forced-window.mjs
import { chromium } from '@playwright/test';
const api = async (body) => (await fetch('http://localhost:8100/api/emulation', body ? { method: 'POST', body: JSON.stringify(body) } : undefined)).json();
const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1400, height: 900 } })).newPage();
await p.goto('http://localhost:8100/'); await p.waitForTimeout(3000);
await p.click('summary:has-text("Display")');          // the forced-colours controls live in the Display section
console.log('button visible in a normal window:', await p.locator('#emulopen').isVisible(), '| mode switch hidden:', await p.locator('#emulbox').isHidden());
await p.click('#emulopen'); await p.waitForTimeout(12000);          // the controlled window loads the viewer and its frames
let ok = true; const check = async (mode, want) => {
  await api({ mode }); await p.waitForTimeout(800); const s = await api();
  const got = s.frames.length === 2 && s.frames.every((f) => f && f.forced === want.forced && f.dark === want.dark && f.more === want.more);
  console.log(`${mode.padEnd(13)} ->`, JSON.stringify(s.frames), got ? 'PASS' : 'FAIL'); if (!got) ok = false; };
const first = await api(); const inForced = first.frames.length === 2 && first.frames.every((f) => f && f.forced);
console.log('window open:', first.open, '| mode:', first.mode, '| frames:', first.frames.length, '| already in forced colours on open:', inForced); if (!first.open || first.frames.length !== 2 || first.mode !== 'forced-light' || !inForced) ok = false;
await check('forced-light', { forced: true, dark: false, more: false });
await check('forced-dark', { forced: true, dark: true, more: false });
await check('contrast', { forced: false, dark: false, more: true });
await check('normal', { forced: false, dark: false, more: false });
await api({ close: true }); await b.close();
console.log(ok ? 'PASS: both frames follow every mode' : 'FAIL'); process.exit(ok ? 0 : 1);
