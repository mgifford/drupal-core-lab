// #2942404: what a screen reader says about system messages, Before and After, on a page that shows every message type.
//   node tools/playwright/screenreader-2942404.mjs [slug] [--mode=virtual|voiceover|both] [--pages=front,admin] [--out=<dir>]
// Pages (added to both sites by recipes/repro_2942404): front = /lab/status-messages (front-end theme), admin = /admin/lab/status-messages (Default Admin).
// Each page has two server-rendered status messages, a warning and an error, and a button that adds one JavaScript message of each type.
//   virtual   Guidepup virtual screen reader (@guidepup/virtual-screen-reader) over a jsdom snapshot of the page, before and after pressing the button.
//             It reads names, roles and states from the DOM; it does not speak live-region changes, and jsdom has no layout, so CSS-hidden text is not hidden.
//   voiceover Guidepup (@guidepup/guidepup) driving the real macOS VoiceOver in Safari, as the signed-in administrator. VoiceOver SPEAKS ALOUD while it runs.
//             Needs `npx @guidepup/setup install` once for this project. It reads the page in VoiceOver's own order and records the phrases it spoke,
//             including what it announced after the button was activated.
// Output: reports/issues/2942404/screenreader/<stamp>/ (SUMMARY.md, results.json). Evidence, not a conformance verdict; a person's review is better.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { JSDOM } from 'jsdom';
import { virtual } from '@guidepup/virtual-screen-reader';
import { labRoot, envInfo, loginPath } from '../compare/lib.mjs';

const argv = process.argv.slice(2);
const opt = (n, d) => { const a = argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d; };
const MODE = opt('mode', 'both');
const SIDES = opt('sides', 'before,after').split(',');
const PAGES = opt('pages', 'front,admin').split(',');
const PATHS = { front: '/lab/status-messages', admin: '/admin/lab/status-messages' };
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const outDir = path.resolve(opt('out', '') || path.join(labRoot, 'reports/issues/2942404/screenreader', stamp));
fs.mkdirSync(outDir, { recursive: true });
process.argv.push(`--out=${outDir}`);   // lab-run creates its run folder here
const { runArgs, launch, openSide, gitInfo } = await import('./lib/lab-run.mjs');
const run = runArgs({ slug: '2942404-latest' });
const BUTTON = /Add messages with JavaScript/i;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- virtual screen reader on a DOM snapshot ----
async function virtualWalk(html, url, max = 400) {
  const dom = new JSDOM(html, { pretendToBeVisual: true, url });
  const doc = dom.window.document;
  doc.querySelectorAll('script, style, link, noscript').forEach((n) => n.remove());
  global.CSS = dom.window.CSS || { escape: (v) => String(v).replace(/[^a-zA-Z0-9_\u00a0-\uffff-]/g, (c) => `\\${c}`) };   // jsdom has no CSS.escape
  global.window = dom.window; global.document = doc; global.Node = dom.window.Node; global.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
  await virtual.start({ container: doc.body });
  const phrases = [];
  for (let i = 0; i < max; i++) {
    await virtual.next();
    const p = await virtual.lastSpokenPhrase();
    if (phrases.length && p === phrases[phrases.length - 1] && /end of/i.test(p)) break;
    phrases.push(p);
  }
  await virtual.stop();
  return phrases;
}
// The part of the walk that matters: from the first message group to the button, and after it.
const windowOf = (phrases) => {
  const start = phrases.findIndex((p) => /(status|warning|error) message|alert|status|region/i.test(p));
  const end = phrases.findIndex((p) => BUTTON.test(p));
  return phrases.slice(Math.max(0, start), end >= 0 ? end + 1 : undefined);
};

async function virtualPass(browser, side) {
  const { page, base, rec } = await openSide(run, side);
  const result = {};
  for (const key of PAGES) {
    await page.goto(base + PATHS[key]); await page.waitForLoadState('load');
    const server = windowOf(await virtualWalk(await page.content(), base + PATHS[key]));
    await page.click('#lab-add-js-messages'); await page.waitForTimeout(800);
    const added = windowOf(await virtualWalk(await page.content(), base + PATHS[key]));
    const live = await page.evaluate(() => ({
      announce: document.getElementById('drupal-live-announce')?.textContent.trim() || '',
      groups: [...document.querySelectorAll('[data-drupal-messages] [role], [data-drupal-messages-fallback] [role]')].map((e) => `${e.getAttribute('role')}${e.getAttribute('aria-label') ? ` "${e.getAttribute('aria-label')}"` : ''}`),
    }));
    result[key] = { url: base + PATHS[key], afterLoad: server, afterButton: added, liveAfterButton: live };
  }
  await rec.collect();
  result.announceCalls = rec.speech.announce;
  await rec.close(outDir).catch(() => {});
  return result;
}

// ---- real VoiceOver through Guidepup, in Safari ----
const osa = (script) => execFileSync('osascript', ['-e', script], { encoding: 'utf8', timeout: 60000 }).trim();
const safariOpen = (url) => execFileSync('open', ['-a', 'Safari', url], { timeout: 30000 });
const safariClose = () => { try { osa('tell application "Safari" to close every window'); } catch { /* none open */ } };

async function voiceOverPass(side) {
  const { voiceOver } = await import('@guidepup/guidepup');
  const env = run.v[side].env, host = envInfo(env).hosts.slice().sort((a, b) => a.length - b.length)[0], base = `https://${host}`;
  const result = {};
  const startVO = async () => {
    for (let attempt = 0; attempt < 3; attempt++) {
      try { await voiceOver.stop(); } catch { /* not running */ }
      await sleep(4000);
      await voiceOver.start(); await sleep(2500);
      const said = (await voiceOver.spokenPhraseLog()).join(' ');
      if (!/Recovery mode/i.test(said)) return;   // VoiceOver can start with default preferences; start again
    }
    throw new Error('VoiceOver kept starting in Recovery mode');
  };
  try {
    await startVO();
    safariOpen(base + loginPath(env)); await sleep(6000);   // the one-time link signs the administrator in
    for (const key of PAGES) {
      safariClose(); await sleep(1000); safariOpen(base + PATHS[key]); await sleep(6000);
      await voiceOver.interact().catch(() => {});
      // Jump to the page's h1 by heading navigation (skips the sidebar and skip link), then read on in VoiceOver's own order.
      const phrases = [];
      let atTitle = false;
      for (let i = 0; i < 40 && !atTitle; i++) { await voiceOver.perform(voiceOver.keyboardCommands.findNextHeading); const p = await voiceOver.lastSpokenPhrase(); phrases.push(p); atTitle = /heading level 1/i.test(p) && /Status messages/i.test(p); }
      let found = false;
      for (let i = 0; i < 80 && !found && atTitle; i++) { await voiceOver.next(); const p = await voiceOver.lastSpokenPhrase(); phrases.push(p); found = BUTTON.test(p); }
      const before = (await voiceOver.spokenPhraseLog()).length;
      if (found) {
        await voiceOver.act(); await sleep(4000);
        const announced = (await voiceOver.spokenPhraseLog()).slice(before);   // what VoiceOver said by itself after the activation
        const followed = [];
        for (let i = 0; i < 12; i++) { await voiceOver.next(); followed.push(await voiceOver.lastSpokenPhrase()); }
        result[key] = { url: base + PATHS[key], reachedTitle: atTitle, reachedButton: true, order: phrases, announcedAfterActivation: announced, readAfterActivation: followed };
      } else result[key] = { url: base + PATHS[key], reachedTitle: atTitle, reachedButton: false, order: phrases, announcedAfterActivation: [], readAfterActivation: [] };
    }
  } catch (e) {
    let c = e; const chain = []; while (c) { chain.push(String(c.message).split('\n')[0]); c = c.cause; }
    result.error = chain.join(' <- ');
  } finally {
    safariClose();
    try { await voiceOver.stop(); } catch { /* not running */ }
    await sleep(3000);
  }
  return result;
}

// ---- run ----
const { browser, environment } = await launch(run);
run.browser = browser;
const results = { issue: '2942404', variant: run.v.slug, when: new Date().toISOString(), mode: MODE, environment, commits: { before: gitInfo(run.v.before.env), after: gitInfo(run.v.after.env) }, patches: run.v.after.patches || [], virtual: {}, voiceover: {} };
try {
  if (MODE !== 'voiceover') for (const side of ['before', 'after']) results.virtual[side] = await virtualPass(browser, side);
} finally { await browser.close(); }
if (MODE !== 'virtual') for (const side of SIDES) results.voiceover[side] = await voiceOverPass(side);
fs.writeFileSync(path.join(outDir, 'results.json'), JSON.stringify(results, null, 2));

const list = (a) => (a && a.length ? a.map((p) => `    - ${p}`).join('\n') : '    - (nothing)');
let md = `# #2942404 screen reader evidence (${run.v.slug})\n\nDRAFT, AI-assisted; a person has not reviewed it. Before: core \`${results.commits.before}\`. After: core \`${results.commits.after}\` plus \`${results.patches.map((p) => path.basename(p)).join(', ')}\` (a lab option, not an upstream MR). Pages: \`${PAGES.map((k) => PATHS[k]).join('`, `')}\`, each with two server-rendered status messages, a warning, an error and a button that adds one JavaScript message of each type.\n\n`;
const sections = [['virtual', 'Guidepup virtual screen reader (jsdom snapshot)'], ['voiceover', 'Guidepup with real VoiceOver (macOS, Safari)']];
for (const [mode, title] of sections) {
  if (!Object.keys(results[mode]).length) { md += `## ${title}\n\nNot run in this invocation.\n\n`; continue; }
  md += `## ${title}\n\n`;
  for (const side of ['before', 'after']) {
    const r = results[mode][side];
    if (!r) {
      md += `### ${side}\n\nNot run in this invocation.\n\n`;
      continue;
    }
    if (r.error) { md += `### ${side}\n\n**Not completed:** ${r.error}\n\n`; continue; }
    md += `### ${side}\n\n`;
    for (const key of PAGES) {
      const p = r[key]; if (!p) continue;
      if (mode === 'virtual') md += `**${key}** (${p.url}) after load:\n\n${list(p.afterLoad)}\n\nAfter the button (virtual reader; live-region changes are not spoken by it). Groups: ${p.liveAfterButton.groups.join('; ') || 'none'}. \`#drupal-live-announce\` text: "${p.liveAfterButton.announce}".\n\n${list(p.afterButton)}\n\n`;
      else md += `**${key}** (${p.url}): reached the button: ${p.reachedButton}.\n\nRead in order:\n\n${list(p.order)}\n\nSpoken by itself after activating the button:\n\n${list(p.announcedAfterActivation)}\n\nRead afterwards:\n\n${list(p.readAfterActivation)}\n\n`;
    }
  }
}
md += `## Limits\n\n- The virtual reader works on a DOM snapshot with no CSS or layout, so visually hidden or display:none text is not distinguished, and it does not speak live-region changes.\n- VoiceOver output depends on the macOS version, Safari, VoiceOver settings and verbosity; one run on one machine. NVDA, JAWS, TalkBack and other browsers were not used.\n- Phrases are what the tool recorded; read them against the markup in the other evidence before drawing conclusions.\n`;
fs.writeFileSync(path.join(outDir, 'SUMMARY.md'), md);
console.log(path.relative(labRoot, outDir));
