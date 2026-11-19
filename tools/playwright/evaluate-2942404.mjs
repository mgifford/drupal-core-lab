// #2942404: system messages. Compares how a message is exposed on current main (Before) and on a lab-authored option that gives each message type a
// region landmark with an inner alert or status live region (After): the markup, the landmarks, the live-region roles, axe-core results and what the
// lab's recorder saw announced. It is a comparison of options, not a test of a defect: the original problem (role="contentinfo") is not present on main.
//   node tools/playwright/evaluate-2942404.mjs [slug] [--browser=chromium] [--scheme=light|dark] [--forced-colors] [--viewport=1280x900] [--out=<dir>]
// Runs on lib/lab-run.mjs. Scenarios: a server-rendered status message after "Clear all caches" (full-page redirect, admin theme), a server-rendered error on a settings form
// (admin theme), a server-rendered error after a wrong password while logged out (front-end theme), and a warning and a status message added through Drupal.Message.
// Not covered: a real screen reader (the recorder lists live-region changes, it does not hear them), AJAX responses that carry a server-rendered message,
// BigPipe placeholders, a person's keyboard pass. A message added by JavaScript is rendered by Drupal.theme.message(), which this option does not change.
import path from 'node:path';
import { runArgs, launch, openSide, axeScan, baseResults, writeRun, contextMarkdown } from './lib/lab-run.mjs';

const run = runArgs({ slug: '2942404-latest' });

// Serialised into the page.
const measure = () => {
  const name = (el) => (el.getAttribute('aria-label') || (el.getAttribute('aria-labelledby') ? [...el.getAttribute('aria-labelledby').split(' ')].map((i) => document.getElementById(i)?.textContent.trim()).join(' ') : '') || '').trim();
  const roots = [...document.querySelectorAll('[data-drupal-messages]')];
  const blocks = roots.flatMap((r) => [...r.children]).filter((e) => e.matches('[role], div, drupal-umami-messages'));
  const describe = (b) => ({
    tag: b.tagName.toLowerCase(), role: b.getAttribute('role'), name: name(b),
    inner: [...b.querySelectorAll('[role]')].map((x) => `${x.getAttribute('role')}${name(x) ? ` "${name(x)}"` : ''}`),
    heading: b.querySelector('h2')?.textContent.trim().replace(/\s+/g, ' ') || null,
    text: b.textContent.trim().replace(/\s+/g, ' ').slice(0, 80),
  });
  const landmarks = [...document.querySelectorAll('[role=region],[role=contentinfo],[role=alert],[role=status],footer,main,nav,aside,header,[role=banner],[role=complementary]')].filter((e) => !e.closest('[hidden]')).map((e) => ({ role: e.getAttribute('role') || e.tagName.toLowerCase(), name: name(e), inMessages: !!e.closest('[data-drupal-messages]') }));
  return {
    path: location.pathname, blocks: blocks.map(describe), landmarks,
    contentinfoInMessages: !!document.querySelector('[data-drupal-messages] [role=contentinfo], [data-drupal-messages][role=contentinfo]'),
    contentinfoCount: document.querySelectorAll('[role=contentinfo], body > footer, footer').length,
    html: roots.map((r) => r.outerHTML.replace(/\s+/g, ' ')).join('\n').slice(0, 1600),
  };
};

const labelled = async (page, side, name) => {
  const text = `${side === 'before' ? 'BEFORE' : 'AFTER'} · ${run.v.slug} · ${name} · ${run.envTag}`;
  await page.evaluate((t) => { const d = document.createElement('div'); d.id = '__lab-label'; d.textContent = t; d.style.cssText = 'position:fixed;inset:auto auto 4px 4px;z-index:2147483647;background:#fff;color:#000;border:1px solid #000;font:12px/1.2 monospace;padding:2px 4px'; document.body.append(d); }, text);
  const file = `${side}-${name}.png`;
  await page.screenshot({ path: path.join(run.out, file) });
  await page.evaluate(() => document.getElementById('__lab-label')?.remove());
  return file;
};

async function side(name) {
  const { page, rec, base } = await openSide(run, name);
  rec.scenarios = []; rec.checks = {};
  const seen = { announce: 0, live: 0 };
  const scenario = async (id, what) => {
    await page.waitForTimeout(700);
    await rec.collect();
    const m = await page.evaluate(measure);
    const heard = { announce: rec.speech.announce.length - seen.announce, live: rec.speech.live.length - seen.live };
    seen.announce = rec.speech.announce.length; seen.live = rec.speech.live.length;
    const axe = await axeScan(page);
    const image = await labelled(page, name, id);
    const s = { id, what, ...m, heard, axe: { total: axe.total, rules: axe.rules }, image };
    rec.scenarios.push(s); return s;
  };

  // 1. Server-rendered status after a full-page redirect (admin theme).
  await page.goto(`${base}/admin/config/development/performance`); await page.waitForLoadState('load');
  await Promise.all([page.waitForLoadState('load'), page.locator('#edit-clear').click()]);
  await page.waitForSelector('[data-drupal-messages] [role]', { timeout: 15000 }).catch(() => {});
  const status = await scenario('server-status-admin', 'Status message after "Clear all caches" (server-rendered, full-page redirect, admin theme)');

  // 2. Server-rendered error (admin theme).
  await page.goto(`${base}/admin/config/system/site-information`); await page.waitForLoadState('load');
  await page.locator('#edit-site-frontpage').click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.type('/no-such-page-for-the-lab');
  await Promise.all([page.waitForLoadState('load'), page.locator('#edit-submit').click()]);
  await page.waitForSelector('[data-drupal-messages] [role]', { timeout: 15000 }).catch(() => {});
  const error = await scenario('server-error-admin', 'Error message on a form (server-rendered, admin theme; nothing is saved)');

  // 3. Messages added by JavaScript.
  await page.goto(`${base}/admin/content`); await page.waitForLoadState('load');
  await page.evaluate(() => { const m = new Drupal.Message(); m.add('A JavaScript warning.', { type: 'warning' }); m.add('A JavaScript status message.', { type: 'status' }); });
  const js = await scenario('js-warning-and-status', 'Warning and status added by Drupal.Message (client-rendered; not changed by the option)');

  // 4. Server-rendered error in the front-end theme (Stark, the system template): a wrong password while logged out.
  await page.context().clearCookies();
  await page.goto(`${base}/user/login`); await page.waitForLoadState('load');
  await page.locator('#edit-name').click(); await page.keyboard.type('nobody');
  await page.locator('#edit-pass').click(); await page.keyboard.type('wrong-password');
  await Promise.all([page.waitForLoadState('load'), page.locator('#edit-submit').click()]);
  await page.waitForSelector('[data-drupal-messages] [role]', { timeout: 15000 }).catch(() => {});
  const front = await scenario('server-error-frontend', 'Error message after a wrong password (server-rendered, front-end theme, system template)');

  const live = (b) => !!b && (['alert', 'status'].includes(b.role) || b.inner.some((i) => /^(alert|status)/.test(i)));
  rec.checks.noContentinfoInMessages = [status, error, front, js].every((s) => !s.contentinfoInMessages);
  rec.checks.everyBlockIsOrContainsALiveRegion = [status, error, front].every((s) => s.blocks.length > 0 && s.blocks.every(live));
  rec.checks.everyBlockIsNamed = [status, error, front].every((s) => s.blocks.every((b) => b.name || b.heading));
  rec.checks.errorIsAlert = [error, front].every((s) => s.blocks.some((b) => b.role === 'alert' || b.inner.some((i) => /^alert/.test(i))));
  rec.checks.noMessageBlockHasTwoLiveRegions = [status, error, front].every((s) => s.blocks.every((b) => (b.role && ['alert', 'status'].includes(b.role) ? 1 : 0) + b.inner.filter((i) => /^(alert|status)/.test(i)).length <= 1));
  rec.design = {
    messageLandmarks: [status, error, front].map((s) => s.landmarks.filter((l) => l.role === 'region' && l.inMessages).length),
    jsWarningRole: js.blocks.map((b) => b.role || b.inner[0]).join(', '),
    serverWarningRole: 'not exercised (no server-rendered warning on a stock page); main uses alert, the option uses status',
  };
  return rec;
}

const summarize = (results) => {
  const rows = [];
  for (const n of ['before', 'after']) for (const s of results.sides[n].scenarios || []) rows.push(`| ${n} | ${s.id} | ${s.blocks.map((b) => `${b.role || b.tag}${b.name ? ` "${b.name}"` : ''}${b.inner.length ? ` > ${b.inner.join(', ')}` : ''}`).join('<br>')} | ${s.landmarks.filter((l) => l.inMessages && l.role === 'region').length} | ${s.heard.live} live / ${s.heard.announce} announce | ${s.axe.total} | [${s.image}](${s.image}) |`);
  let md = `# #2942404 system messages: options on main (${results.variant}, ${results.environment.colorScheme}${results.environment.forcedColors ? ', forced colors' : ''}, ${results.environment.viewport.width}x${results.environment.viewport.height})\n\n`;
  md += `DRAFT, AI-assisted; a person has not reviewed it. This compares two designs; it is not a defect test. The original problem (role="contentinfo") does not reproduce on Before (current main): verdict ${results.verdict}; ${results.unexpected} After check(s) not met.\n\n`;
  md += `Before: each message block is itself the live region (error and warning: alert; other types: status), no landmark. After: a region landmark per message type with an inner alert (error) or status (status and warning). The "live / announce" column is what the lab's recorder saw change in live regions or call Drupal.announce() since the previous scenario. It is not what a screen reader says. Not covered: real screen readers, AJAX-delivered server messages, BigPipe placeholders, a person's keyboard pass. The form error is triggered by typing an invalid path; no validation is bypassed.\n\n`;
  md += `| Side | Scenario | Message blocks (role "name" > inner live regions) | Region landmarks in messages | Recorder | axe violations | Image |\n|---|---|---|---|---|---|---|\n${rows.join('\n')}\n\n## Checks\n\n`;
  for (const n of ['before', 'after']) md += `- **${n}**: ${Object.entries(results.sides[n].checks).map(([k, v]) => `${k}: ${v}`).join('; ')}\n`;
  md += `\n## Design facts\n\n`;
  for (const n of ['before', 'after']) { const d = results.sides[n].design; md += `- **${n}**: message region landmarks per scenario ${d.messageLandmarks.join(' / ')}; JavaScript message roles: ${d.jsWarningRole}; server warning: ${d.serverWarningRole}\n`; }
  md += `\n## axe-core (WCAG 2.2 A/AA tags; violation counts per scenario, Before → After)\n\n`;
  for (const id of ['server-status-admin', 'server-error-admin', 'server-error-frontend', 'js-warning-and-status']) { const b = results.sides.before.scenarios.find((s) => s.id === id), a = results.sides.after.scenarios.find((s) => s.id === id); md += `- ${id}: ${b?.axe.total} → ${a?.axe.total}${Object.keys(a?.axe.rules || {}).length ? ` (After rules: ${Object.entries(a.axe.rules).map(([k, v]) => `${k} ${v}`).join(', ')})` : ''}\n`; }
  return md + '\n' + contextMarkdown(results);
};

const { browser, environment } = await launch(run);
run.browser = browser;
const results = baseResults(run, { ...environment, direction: 'native' });
try {
  for (const name of ['before', 'after']) { const rec = await side(name); results.sides[name] = await rec.close(run.out); }
} finally { await browser.close(); }

const A = results.sides.after, B = results.sides.before;
const fails = Object.entries(A.checks).filter(([, v]) => !v).map(([k]) => `after: ${k}`);
results.axeRegressions = [];
for (const s of A.scenarios) { const b = B.scenarios.find((x) => x.id === s.id); for (const [rule, n] of Object.entries(s.axe.rules)) if (n > (b?.axe.rules[rule] || 0)) results.axeRegressions.push({ stage: s.id, rule, before: b?.axe.rules[rule] || 0, after: n }); }
results.unexpected = fails.length + results.axeRegressions.length; results.failures = fails;
const reproduced = !B.checks.noContentinfoInMessages;
results.verdict = results.unexpected ? (reproduced ? 'reproduced-not-fixed' : 'mixed') : reproduced ? 'reproduced-and-fixed' : 'not-reproduced';
console.log(writeRun(run, results, summarize(results)));
process.exitCode = results.unexpected ? 1 : 0;
