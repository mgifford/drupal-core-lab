// #2942404: system messages. Compares current main (Before) with Variant C (After): ONE consolidated region landmark named
// "System messages" on each default [data-drupal-messages] container, while the existing per-type groups keep role=alert for
// errors and warnings and role=status for other types. It is a comparison of options, not a test of the original defect:
// role="contentinfo" is not present on current main.
//   node tools/playwright/evaluate-2942404.mjs [slug] [--browser=chromium] [--scheme=light|dark] [--forced-colors] [--viewport=1280x900] [--out=<dir>]
// Runs on lib/lab-run.mjs. The lifecycle assertions use Drupal.Message directly (construct, add, repeated add, remove, clear,
// restore, custom wrappers, author-provided roles and names). The page scenarios use server-rendered messages and
// Drupal.Message on real pages. Themes are read from drupalSettings.labActiveTheme, which the repro module attaches.
// Not covered here: real screen readers, AJAX responses that carry a server-rendered message, BigPipe placeholders (core's
// BigPipeMessagesTest covers those), a person's keyboard pass.
import path from 'node:path';
import { runArgs, launch, openSide, axeScan, baseResults, writeRun, contextMarkdown } from './lib/lab-run.mjs';

const run = runArgs({ slug: '2942404-consolidated' });

// Serialised into the page.
const measure = () => {
  const name = (el) => (el.getAttribute('aria-label') || (el.getAttribute('aria-labelledby') ? [...el.getAttribute('aria-labelledby').split(' ')].map((i) => document.getElementById(i)?.textContent.trim()).join(' ') : '') || '').trim();
  const cls = (el) => (typeof el.className === 'string' ? el.className : el.getAttribute('class') || '');
  const roots = [...document.querySelectorAll('[data-drupal-messages]')];
  const blocks = roots.flatMap((r) => [...r.children]).filter((e) => e.matches('[role], div, drupal-umami-messages'));
  const describe = (b) => ({
    tag: b.tagName.toLowerCase(), role: b.getAttribute('role'), name: name(b),
    inner: [...b.querySelectorAll('[role]')].map((x) => `${x.getAttribute('role')}${name(x) ? ` "${name(x)}"` : ''}`),
    heading: b.querySelector('h2')?.textContent.trim().replace(/\s+/g, ' ') || null,
    text: b.textContent.trim().replace(/\s+/g, ' ').slice(0, 80),
  });
  const landmarks = [...document.querySelectorAll('[role=region],[role=contentinfo],[role=alert],[role=status],footer,main,nav,aside,header,[role=banner],[role=complementary]')].filter((e) => !e.closest('[hidden]')).map((e) => ({ role: e.getAttribute('role') || e.tagName.toLowerCase(), name: name(e), inMessages: !!e.closest('[data-drupal-messages]') }));
  const duplicates = (() => {
    const seen = new Map();
    for (const el of document.querySelectorAll('[id]')) {
      const list = seen.get(el.id) || [];
      list.push({ tag: el.tagName.toLowerCase(), class: cls(el), path: el.closest('[data-drupal-messages]') ? 'messages' : 'page', text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40) });
      seen.set(el.id, list);
    }
    return [...seen.entries()].filter(([, list]) => list.length > 1).map(([value, elements]) => ({ value, count: elements.length, elements }));
  })();
  const jsMessages = [...document.querySelectorAll('[data-drupal-messages] [data-drupal-message-id]')].map((el) => ({
    id: el.getAttribute('data-drupal-message-id'), type: el.getAttribute('data-drupal-message-type'),
    role: el.getAttribute('role'),
    nestedInAnotherLiveRegion: !!el.parentElement?.closest('[role=alert],[role=status],[aria-live]'),
    containerRole: el.closest('[data-drupal-messages]')?.getAttribute('role') || null,
  }));
  return {
    path: location.pathname, title: document.title, theme: window.drupalSettings?.labActiveTheme || null,
    blocks: blocks.map(describe), landmarks,
    rootCount: roots.length,
    containers: roots.map((r) => ({
      role: r.getAttribute('role'), name: name(r), labelledby: r.getAttribute('aria-labelledby'),
      landmark: r.getAttribute('role') === 'region' && !!name(r),
      messageCount: r.querySelectorAll('[data-drupal-message-id]').length,
      groupCount: r.querySelectorAll('.messages, [role="alert"], [role="status"]').length,
      hasInternalWrapper: !!r.querySelector(':scope > .messages__wrapper'),
      managedBy: r.hasAttribute('data-drupal-message-landmark') ? 'Drupal.Message' : (r.getAttribute('role') ? 'template/author' : null),
      outerHTML: r.outerHTML.replace(/\s+/g, ' ').slice(0, 300),
    })),
    customWrappers: ['lab-custom-wrapper', 'lab-contextual-inside'].map((id) => {
      const el = document.getElementById(id);
      return el ? { id, role: el.getAttribute('role'), name: name(el), landmark: el.getAttribute('role') === 'region' && !!name(el), messageCount: el.querySelectorAll('[data-drupal-message-id]').length } : { id, absent: true };
    }),
    liveRegions: [...document.querySelectorAll('[data-drupal-messages] [role=alert], [data-drupal-messages] [role=status], [data-drupal-messages][role=alert], [data-drupal-messages][role=status]')].map((e) => ({ role: e.getAttribute('role'), name: name(e), nestedInLive: !!e.parentElement?.closest('[role=alert],[role=status],[aria-live]') })),
    headings: [...document.querySelectorAll('[data-drupal-messages] :is(h1,h2,h3,h4,h5,h6)')].map((h) => `${h.tagName.toLowerCase()} ${h.textContent.trim().replace(/\s+/g, ' ')}`),
    duplicates,
    jsMessages,
    active: (() => { const a = document.activeElement; return a && a !== document.body ? `${a.tagName.toLowerCase()}${a.id ? '#' + a.id : ''}` : 'body'; })(),
    contentinfoInMessages: !!document.querySelector('[data-drupal-messages] [role=contentinfo], [data-drupal-messages][role=contentinfo]'),
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

const regionLandmarks = (s) => (s.containers || []).filter((c) => c.landmark && c.name === 'System messages').length;

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

  // 1. Server-rendered status after saving an Article: a full-page redirect. The theme is recorded, not assumed.
  await page.goto(`${base}/node/add/article`); await page.waitForLoadState('load');
  await page.locator('#edit-title-0-value').click();
  await page.keyboard.type(`Message test ${Date.now()}`);
  await Promise.all([page.waitForURL((u) => !/node\/add/.test(u.pathname)), page.locator('#edit-submit').click()]);
  await page.waitForLoadState('load');
  await page.waitForSelector('[data-drupal-messages] [role]', { timeout: 15000 }).catch(() => {});
  const status = await scenario('article-saved', 'Status message after saving an Article (server-rendered, full-page redirect)');

  // 2. Server-rendered error on the Article form. The browser's own validation is switched off (script-assisted).
  await page.goto(`${base}/node/add/article`); await page.waitForLoadState('load');
  await page.evaluate(() => { document.querySelector('#edit-title-0-value').form.noValidate = true; });
  await Promise.all([page.waitForLoadState('load'), page.locator('#edit-submit').click()]);
  await page.waitForSelector('[data-drupal-messages] [role]', { timeout: 15000 }).catch(() => {});
  const error = await scenario('article-form-error', 'Error message on the Article form with an empty title (server-rendered)');

  // 2b. Server-rendered status in the administration theme.
  await page.goto(`${base}/admin/config/development/performance`); await page.waitForLoadState('load');
  await Promise.all([page.waitForLoadState('load'), page.locator('#edit-clear').click()]);
  await page.waitForSelector('[data-drupal-messages] [role]', { timeout: 15000 }).catch(() => {});
  const statusAdmin = await scenario('status-admin-cache-cleared', 'Status message after "Clear all caches" (server-rendered, full-page redirect)');

  // 3. Messages added by JavaScript only.
  await page.goto(`${base}/admin/content`); await page.waitForLoadState('load');
  await page.evaluate(() => { const m = new Drupal.Message(); window.__labJs = m; m.add('A JavaScript warning.', { type: 'warning' }); m.add('A JavaScript status message.', { type: 'status' }); });
  const js = await scenario('js-warning-and-status', 'Warning and status added by Drupal.Message on a page with no server messages (JavaScript only)');

  // 3b. All three message types at once from core's own fixture (system_test): the only page with a server-rendered warning.
  await page.goto(`${base}/system-test/status-messages-for-assertions`); await page.waitForLoadState('load');
  await page.waitForSelector('[data-drupal-messages] [role]', { timeout: 15000 }).catch(() => {});
  const fixture = await scenario('all-types-fixture', 'Status, warning and error together, with quotes, an ampersand and escaped markup (core system_test fixture; server-rendered warning)');

  // 3c. A JavaScript message added next to the server-rendered messages: containment, not just landmark count.
  await page.locator('body').click({ position: { x: 5, y: 5 } }).catch(() => {});
  const focusBefore = await page.evaluate(() => { const a = document.activeElement; return a && a !== document.body ? `${a.tagName.toLowerCase()}${a.id ? '#' + a.id : ''}` : 'body'; });
  await page.evaluate(() => { const m = new Drupal.Message(); m.add('A JavaScript status after the server messages.', { type: 'status' }); });
  const jsNext = await scenario('js-next-to-server-messages', 'A JavaScript message added to a page that already shows server-rendered messages (containment)');
  rec.focusMoved = jsNext.active !== focusBefore;

  // 4. A page with no messages: no message container may enter landmark navigation.
  await page.goto(`${base}/admin/content`); await page.waitForLoadState('load'); await page.waitForTimeout(800);
  const empty = await scenario('empty-state', 'A page with no messages');

  // 5. Server-rendered error while logged out.
  await page.context().clearCookies();
  await page.goto(`${base}/user/login`); await page.waitForLoadState('load');
  await page.locator('#edit-name').click(); await page.keyboard.type('nobody');
  await page.locator('#edit-pass').click(); await page.keyboard.type('wrong-password');
  await Promise.all([page.waitForLoadState('load'), page.locator('#edit-submit').click()]);
  await page.waitForSelector('[data-drupal-messages] [role]', { timeout: 15000 }).catch(() => {});
  const front = await scenario('logged-out-error', 'Error message after a wrong password while logged out (server-rendered)');

  // 6. Lifecycle assertions against the API itself, on a page with no server messages.
  await page.goto(`${base}/admin/content`); await page.waitForLoadState('load'); await page.waitForTimeout(500);
  const steps = [];
  const step = async (id, fn) => { if (fn) await page.evaluate(fn); await page.waitForTimeout(120); steps.push({ id, ...(await page.evaluate(measure)) }); };
  await step('empty-message-container', null);
  await step('construct-only', () => { window.__labMessage = new Drupal.Message(); });
  await step('first-add', () => { window.__labMessage.add('Lifecycle status message.', { type: 'status', announce: '' }); });
  await step('second-add', () => { window.__labMessage.add('Lifecycle warning message.', { type: 'warning', announce: '' }); });
  await step('remove-one', () => { const id = window.__labMessage.add('Temporary status.', { type: 'status', announce: '' }); window.__labMessage.remove(id); });
  await step('clear-all', () => { window.__labMessage.clear(); });
  await step('add-after-clear', () => { window.__labMessage.add('Restored status message.', { type: 'status', announce: '' }); });
  await step('contextual-outside', () => {
    window.__labMessage.clear();
    const wrapper = document.createElement('div');
    wrapper.id = 'lab-custom-wrapper';
    document.body.append(wrapper);
    window.__labCustomMessage = new Drupal.Message(wrapper);
    window.__labCustomMessage.add('Contextual message outside the system container.', { type: 'status', announce: '' });
  });
  await step('contextual-inside', () => {
    const outer = document.querySelector('[data-drupal-messages]');
    const inner = document.createElement('div');
    inner.id = 'lab-contextual-inside';
    outer.append(inner);
    window.__labInsideMessage = new Drupal.Message(inner);
    window.__labInsideMessage.add('Contextual message inside the system container.', { type: 'status', announce: '' });
  });
  await step('author-semantics', () => {
    window.__labInsideMessage.clear();
    document.getElementById('lab-contextual-inside')?.remove();
    const outer = document.querySelector('[data-drupal-messages]');
    outer.setAttribute('role', 'region');
    outer.setAttribute('aria-label', 'Author-defined messages');
    window.__labMessage.add('Message after author-defined semantics.', { type: 'status', announce: '' });
  });
  const lifecycle = Object.fromEntries(steps.map((s) => [s.id, s]));
  const regionOf = (s) => s.containers.filter((c) => c.landmark && c.name === 'System messages');
  const focusSteps = new Set(steps.map((s) => s.active));

  rec.checks.noContentinfoInMessages = [status, error, statusAdmin, front, js].every((s) => !s.contentinfoInMessages);
  rec.checks.everyBlockIsOrContainsALiveRegion = [status, error, statusAdmin, front].every((s) => s.blocks.length > 0 && s.blocks.every((b) => ['alert', 'status'].includes(b.role) || b.inner.some((i) => /^(alert|status)/.test(i))));
  rec.checks.everyBlockIsNamed = [status, error, statusAdmin, front].every((s) => s.blocks.every((b) => b.name || b.heading));
  rec.checks.errorIsAlert = [error, front].every((s) => s.blocks.some((b) => b.role === 'alert' || b.inner.some((i) => /^alert/.test(i))));
  rec.checks.noMessageBlockHasTwoLiveRegions = [status, error, statusAdmin, front].every((s) => s.blocks.every((b) => (b.role && ['alert', 'status'].includes(b.role) ? 1 : 0) + b.inner.filter((i) => /^(alert|status)/.test(i)).length <= 1));
  const all = [status, error, statusAdmin, fixture, jsNext, front, js];
  rec.checks.noNestedLiveRegions = all.every((s) => s.liveRegions.every((l) => !l.nestedInLive));
  rec.checks.emptyStateHasNoMessageLandmark = empty.rootCount === 0 || regionLandmarks(empty) === 0;
  rec.checks.javascriptMessagesDoNotMoveFocus = !rec.focusMoved;
  rec.checks.allThreeTypesHaveTheirOwnGroup = ['Status message', 'Warning message', 'Error message'].every((h) => fixture.liveRegions.some((l) => l.name === h)) && fixture.liveRegions.filter((l) => l.role === 'alert').length >= 2 && fixture.liveRegions.some((l) => l.role === 'status');
  rec.checks.groupsKeepTheirHeadings = fixture.headings.length >= 3;
  rec.checks.serverWarningKeepsAlert = fixture.liveRegions.some((l) => l.role === 'alert' && l.name === 'Warning message');
  rec.checks.javascriptOnlyMessagesHaveLandmark = regionLandmarks(js) === 1;
  rec.checks.mixedMessagesHaveOneLandmark = regionLandmarks(jsNext) === 1;
  rec.checks.javascriptMessageNotNestedInAnotherLiveRegion = jsNext.jsMessages.every((m) => !m.nestedInAnotherLiveRegion);
  rec.checks.oneConsolidatedLandmarkOnServerPages = [status, error, statusAdmin, front, fixture].every((s) => regionLandmarks(s) === 1);
  rec.checks.constructedWithoutMessagesHasNoLandmark = regionOf(lifecycle['construct-only']).length === 0 && lifecycle['construct-only'].containers.every((c) => c.role !== 'region');
  rec.checks.firstAddCreatesLandmark = regionOf(lifecycle['first-add']).length === 1;
  rec.checks.repeatedAddsKeepOneLandmark = regionOf(lifecycle['second-add']).length === 1;
  rec.checks.removeOneKeepsLandmark = regionOf(lifecycle['remove-one']).length === 1;
  rec.checks.clearRemovesLandmark = regionOf(lifecycle['clear-all']).length === 0;
  rec.checks.addAfterClearRestoresLandmark = regionOf(lifecycle['add-after-clear']).length === 1;
  rec.checks.customWrapperUnchanged = lifecycle['contextual-outside'].customWrappers.find((w) => w.id === 'lab-custom-wrapper')?.landmark === false && regionOf(lifecycle['contextual-outside']).length === 0;
  rec.checks.contextualWrapperInsideContainerUnchanged = lifecycle['contextual-inside'].customWrappers.find((w) => w.id === 'lab-contextual-inside')?.landmark === false && regionOf(lifecycle['contextual-inside']).length === 0;
  rec.checks.authorSemanticsPreserved = lifecycle['author-semantics'].containers.some((c) => c.role === 'region' && c.name === 'Author-defined messages');
  rec.checks.messageAddsDoNotMoveFocus = focusSteps.size === 1;
  rec.checks.themeRecorded = [status, error, statusAdmin, fixture, front].every((s) => !!s.theme);

  rec.design = {
    fixtureLandmarks: fixture.landmarks.filter((l) => l.inMessages && l.role === 'region').map((l) => l.name || '(unnamed)'),
    fixtureHeadings: fixture.headings,
    fixtureRoots: fixture.containers.map((c) => ({ role: c.role, name: c.name })),
    jsJoinedServerContainer: jsNext.rootCount === fixture.rootCount,
    jsOnlyRoots: js.containers.map((c) => ({ role: c.role, name: c.name })),
    jsWarningRole: js.blocks.map((b) => b.role || b.inner[0]).join(', '),
    serverWarningRole: fixture.liveRegions.filter((l) => l.name === 'Warning message').map((l) => l.role).join(', ') || 'not exercised',
    messageLandmarks: [status, error, statusAdmin, front].map((s) => regionLandmarks(s)),
    themes: [...new Set(all.map((s) => `${s.path} → ${s.theme || 'unknown'}`))],
  };
  rec.lifecycle = steps;
  return rec;
}

const summarize = (results) => {
  const rows = [];
  for (const n of ['before', 'after']) for (const s of results.sides[n].scenarios || []) rows.push(`| ${n} | ${s.id} | ${s.theme || 'unknown'} | ${s.containers.map((c) => `${c.role || 'no role'}${c.name ? ` "${c.name}"` : ''}`).join('<br>') || 'no container'} | ${regionLandmarks(s)} | ${s.heard.live} live / ${s.heard.announce} announce | ${s.axe.total} | [${s.image}](${s.image}) |`);
  let md = `# #2942404 system messages: Variant C (${results.variant}, ${results.environment.colorScheme}${results.environment.forcedColors ? ', forced colors' : ''}, ${results.environment.viewport.width}x${results.environment.viewport.height})\n\n`;
  md += `DRAFT, AI-assisted; a person has not reviewed it. Variant C puts ONE region landmark named "System messages" on each default \`[data-drupal-messages]\` container. The per-type groups keep \`role="alert"\` for errors and warnings and \`role="status"\` for other types. Server-rendered warnings are exercised by the all-types fixture (core system_test). The original defect (role="contentinfo") does not reproduce on Before: verdict ${results.verdict}; ${results.unexpected} After check(s) not met.\n\n`;
  md += `The theme in each row is the theme that rendered the page, read from \`drupalSettings.labActiveTheme\`, not assumed from the URL. The "live / announce" column is what the lab's recorder saw change in live regions or call Drupal.announce() since the previous scenario. It is not what a screen reader says. Not covered: real screen readers, AJAX responses that carry a server-rendered message, BigPipe placeholders (see core's BigPipeMessagesTest), a person's keyboard pass. For the Article form error the browser's own form validation is switched off (script-assisted).\n\n`;
  md += `| Side | Scenario | Rendered theme | Message container (role "name") | "System messages" regions | Recorder | axe violations | Image |\n|---|---|---|---|---|---|---|---|\n${rows.join('\n')}\n\n## Acceptance checks\n\n`;
  for (const n of ['before', 'after']) md += `- **${n}**: ${Object.entries(results.sides[n].checks).map(([k, v]) => `${k}: ${v}`).join('; ')}\n`;
  md += `\n## Drupal.Message lifecycle\n\n| Step | Container role | Accessible name | System messages regions | Focus |\n|---|---|---|---|---|\n`;
  for (const s of results.sides.after.lifecycle || []) {
    const c = s.containers.find((x) => x.role || x.messageCount || x.groupCount) || s.containers[0] || {};
    md += `| ${s.id} | ${c.role || 'none'} | ${c.name || ''} | ${regionLandmarks(s)} | ${s.active} |\n`;
  }
  md += `\n## Duplicate IDs\n\n`;
  const idsOf = (s) => new Set((s.duplicates || []).map((d) => d.value));
  const diff = (a, b) => [...a].filter((v) => !b.has(v));
  const beforeAll = new Set(), afterAll = new Set();
  for (const s of results.sides.before.scenarios) for (const d of s.duplicates || []) beforeAll.add(d.value);
  for (const s of results.sides.after.scenarios) for (const d of s.duplicates || []) afterAll.add(d.value);
  for (const s of results.sides.after.scenarios || []) {
    const b = results.sides.before.scenarios.find((x) => x.id === s.id);
    const bs = idsOf(b), as = idsOf(s);
    md += `- **${s.id}**: Before ${bs.size}, After ${as.size}`;
    if (diff(bs, as).length) md += `; only Before: ${diff(bs, as).join(', ')}`;
    if (diff(as, bs).length) md += `; only After: ${diff(as, bs).join(', ')}`;
    if (!diff(bs, as).length && !diff(as, bs).length) md += '; identical set';
    md += '\n';
    for (const d of s.duplicates || []) md += `  - \`${d.value}\` ×${d.count}: ${d.elements.map((e) => `<${e.tag} class="${e.class}">`).join(', ')}\n`;
  }
  if (!beforeAll.size && !afterAll.size) md += `No duplicate IDs were found on either side in this run.\n`;
  md += `\n## Design facts\n\n`;
  for (const n of ['before', 'after']) { const d = results.sides[n].design; md += `- **${n}**: message region landmarks per scenario ${d.messageLandmarks ? d.messageLandmarks.join(' / ') : ''}; JavaScript message roles: ${d.jsWarningRole}; server warning: ${d.serverWarningRole}; themes: ${d.themes.join('; ')}\n`; }
  md += `\n## axe-core (WCAG 2.2 A/AA tags; violation counts per scenario, Before → After)\n\n`;
  for (const id of results.sides.before.scenarios.map((x) => x.id)) { const b = results.sides.before.scenarios.find((s) => s.id === id), a = results.sides.after.scenarios.find((s) => s.id === id); md += `- ${id}: ${b?.axe.total} → ${a?.axe.total}${Object.keys(a?.axe.rules || {}).length ? ` (After rules: ${Object.entries(a.axe.rules).map(([k, v]) => `${k} ${v}`).join(', ')})` : ''}\n`; }
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
