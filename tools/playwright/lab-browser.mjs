// Test: the lab browser keeps localStorage between launches (the viewer's remembered choices, step ticks and notes), and opens in the requested mode.
//   node tools/playwright/lab-browser.mjs        (viewer must be running on :8100; uses a throw-away profile, not your real one)
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
process.env.LAB_BROWSER_PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), 'lab-browser-test-'));
process.env.LAB_EMULATION_HEADLESS = '1';
const em = await import('../compare/emulation.mjs');
const url = 'http://localhost:8100/?controlled=1';
let ok = true; const check = (label, pass) => { console.log(`${pass ? 'PASS' : 'FAIL'}  ${label}`); if (!pass) ok = false; };
await em.open(url, 'normal');
check('opens in Normal mode', (await em.status()).mode === 'normal');
await em.windowPage().evaluate(() => localStorage.setItem('compare.prefs', JSON.stringify({ axeon: true, marker: 'saved-in-first-launch' })));
await em.close();
check('window closed', em.windowPage() === null);
await em.open(url, 'forced-light');
const saved = await em.windowPage().evaluate(() => localStorage.getItem('compare.prefs'));
check('localStorage survives a relaunch', !!saved && saved.includes('saved-in-first-launch'));
check('second launch opens in the requested mode (forced-light)', (await em.status()).mode === 'forced-light');
await em.close(); fs.rmSync(process.env.LAB_BROWSER_PROFILE, { recursive: true, force: true });
console.log(ok ? 'PASS: lab browser profile persists' : 'FAIL'); process.exit(ok ? 0 : 1);
