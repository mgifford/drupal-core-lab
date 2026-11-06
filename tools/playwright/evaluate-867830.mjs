// Evidence for #867830: "Unpublished" style of rendered entities is not accessible (fork branch 867830-unpublished-style-of, the #306 re-roll; no MR).
//   node tools/playwright/evaluate-867830.mjs [slug] [--browser=chromium|firefox|webkit] [--scheme=light|dark] [--forced-colors] [--viewport=WxH] [--themes=olivero,claro,stark] [--out=<dir>]
// Defaults: slug 867830-pinned, chromium, light, 1280x900, all three themes.
// For each front-end theme (set as the default theme on both sites, identically, then put back to Olivero), and for each side, it opens the
// three lab nodes (/lab/unpublished-article with a live and a held comment, /lab/unpublished-page, /lab/published-article as control) and
// records: whether any text says the node or comment is unpublished and what markup carries it, the node's background colour and its
// contrast with the page, the node--unpublished class, the marker's own text contrast, the accessibility snapshot of the node's footer and of
// the held comment, axe, JavaScript errors, and a screenshot. No input is needed on these pages: this is a rendering question.
// The context, AJAX commands and announcements are recorded by tools/playwright/lib/lab-run.mjs (see there).
// Writes reports/issues/867830/playwright/<stamp>-<envTag>/ (results.json, SUMMARY.md, ajax-*.json, *.png) or --out.
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { envDir } from '../compare/lib.mjs';
import { runArgs, launch, openSide, axeScan, baseResults, writeRun, contextMarkdown, ajaxMarkdown, speechMarkdown } from './lib/lab-run.mjs';

const run = runArgs({ slug: '867830-pinned' });
const { v, out } = run;
const themesArg = process.argv.slice(2).find((a) => a.startsWith('--themes='));
const THEMES = (themesArg ? themesArg.slice(9) : 'olivero,claro,stark').split(',').map((s) => s.trim()).filter(Boolean);
const PAGES = [
  { path: '/lab/unpublished-article', key: 'draftArticle', unpublished: true, comments: { live: 'A live comment', held: 'A comment awaiting approval' } },
  { path: '/lab/unpublished-page', key: 'draftPage', unpublished: true },
  { path: '/lab/published-article', key: 'liveArticle', unpublished: false, comments: { live: 'A live comment' } },
];

// The same config change on both sites, so only the code under test differs. Restored to Olivero at the end.
function setDefaultTheme(env, theme) {
  if (!/^[a-z0-9_]+$/.test(theme)) throw new Error(`theme name ${theme} is not a machine name`);
  // Piped through stdin: ddev exec goes through bash, which would expand the $variables of an inline script.
  const php = `<?php\n$a = require "autoload.php"; $r = Symfony\\Component\\HttpFoundation\\Request::create("/"); $k = Drupal\\Core\\DrupalKernel::createFromRequest($r, $a, "prod"); $k->boot(); $k->preHandle($r);\n\\Drupal::service("theme_installer")->install(["${theme}"]); \\Drupal::configFactory()->getEditable("system.theme")->set("default", "${theme}")->save(); drupal_flush_all_caches();\necho \\Drupal::config("system.theme")->get("default"), "\\n";\n`;
  const r = spawnSync('ddev', ['exec', 'php'], { cwd: envDir(env), input: php, encoding: 'utf8', timeout: 180000 });
  const got = (r.stdout || '').trim().split('\n').pop();
  if (r.status !== 0 || got !== theme) throw new Error(`could not set the default theme of ${env} to ${theme}: ${(r.stderr || r.stdout || '').trim().slice(0, 300)}`);
}

// The admin's read history is cleared on both sides so the "new" comment indicator (history module, AJAX after load) starts from the
// same state on each run; otherwise which side shows "new" depends on which run came first. Lab sites only.
function resetHistory(env) {
  const php = `<?php\n$a = require "autoload.php"; $r = Symfony\\Component\\HttpFoundation\\Request::create("/"); $k = Drupal\\Core\\DrupalKernel::createFromRequest($r, $a, "prod"); $k->boot(); $k->preHandle($r);\nif (\\Drupal::moduleHandler()->moduleExists("history")) { \\Drupal::database()->delete("history")->condition("uid", 1)->execute(); }\necho "ok\\n";\n`;
  const r = spawnSync('ddev', ['exec', 'php'], { cwd: envDir(env), input: php, encoding: 'utf8', timeout: 120000 });
  if (r.status !== 0) console.warn(`history of ${env} not reset: ${(r.stderr || r.stdout || '').trim().slice(0, 200)}`);
}

// Everything the page says about the node and its comments, read from the DOM. Runs inside the page.
const probe = (page, spec) => page.evaluate((spec) => {
  const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
  const comments = [...document.querySelectorAll('article.js-comment')];
  const node = [...document.querySelectorAll('article')].find((a) => !a.classList.contains('js-comment') && !a.closest('.js-comment')) || null;
  const rgb = (c) => { const m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/.exec(c || ''); return m ? { r: +m[1], g: +m[2], b: +m[3], a: m[4] == null ? 1 : +m[4] } : null; };
  // The first opaque background behind an element, so a transparent element reports what is actually behind it.
  const bgBehind = (el) => { for (let e = el; e; e = e.parentElement) { const c = rgb(getComputedStyle(e).backgroundColor); if (c && c.a > 0) return c; } return { r: 255, g: 255, b: 255, a: 1 }; };
  const lum = ({ r, g, b }) => { const f = (x) => { x /= 255; return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => { const [h, l] = [lum(a), lum(b)].sort((x, y) => y - x); return Math.round(((h + 0.05) / (l + 0.05)) * 100) / 100; };
  const hex = (c) => (c ? '#' + [c.r, c.g, c.b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join('') : null);
  // Text that says "unpublished", excluding the comments when looking at the node and vice versa. Direct text nodes count too: core's
  // mark.html.twig on this core prints the status with no wrapper, so in Stark the marker is a bare text node inside the comment.
  const markerTexts = (root, excludeSel) => {
    if (!root) return [];
    const found = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let t = walker.nextNode(); t; t = walker.nextNode()) {
      if (!/unpublished/i.test(t.textContent)) continue;
      const el = t.parentElement; if (!el || (excludeSel && el.closest(excludeSel) && el.closest(excludeSel) !== root)) continue;
      const hidden = !!el.closest('.visually-hidden, [hidden], .hidden'); const cs = getComputedStyle(el);
      const fg = rgb(cs.color), bg = bgBehind(el);
      found.push({ text: clean(t.textContent), element: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : ''), outerHTML: clean(el.outerHTML).slice(0, 300), visuallyHidden: hidden, color: hex(fg), background: hex(bg), contrast: fg ? ratio(fg, bg) : null, fontSizePx: parseFloat(cs.fontSize) });
    }
    return found;
  };
  const nodeBg = node ? bgBehind(node) : null;
  const pageBg = bgBehind(document.body);
  const nodeInfo = node ? {
    classes: clean(node.className), hasUnpublishedClass: node.classList.contains('node--unpublished'),
    background: hex(nodeBg), pageBackground: hex(pageBg), backgroundContrastWithPage: ratio(nodeBg, pageBg),
    markers: markerTexts(node, '.js-comment'),
    footerHTML: clean((node.querySelector('footer') || { outerHTML: '' }).outerHTML).slice(0, 600),
  } : null;
  const commentInfo = comments.map((c) => {
    const bg = bgBehind(c);
    return { heading: clean((c.querySelector('h3, h2, .comment__title, [class*="title"]') || {}).textContent).slice(0, 60), classes: clean(c.className), background: hex(bg), backgroundContrastWithPage: ratio(bg, pageBg), markers: markerTexts(c, null) };
  });
  const held = spec.comments && spec.comments.held ? commentInfo.find((c) => c.heading.includes(spec.comments.held)) || null : null;
  const live = spec.comments && spec.comments.live ? commentInfo.find((c) => c.heading.includes(spec.comments.live)) || null : null;
  return {
    title: clean((document.querySelector('h1') || {}).textContent), theme: window.drupalSettings?.ajaxPageState?.theme ?? null,
    serverError: /The website encountered an unexpected error|Twig\\Error|Undefined constant|TypeError/.test(document.body.innerText),
    node: nodeInfo, commentCount: comments.length, comments: commentInfo, heldComment: held, liveComment: live,
    anyUnpublishedTextOnPage: /unpublished/i.test(document.body.innerText),
  };
}, spec);

async function runSide(side, theme) {
  const { page, base, rec } = await openSide(run, side);
  const pages = {};
  for (const spec of PAGES) {
    await page.goto(base + spec.path, { waitUntil: 'load' });
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    const p = await probe(page, spec);
    const nodeEl = page.locator('article:not(.js-comment)').first();
    p.nodeAria = await nodeEl.locator('footer').first().ariaSnapshot().catch(() => '');
    if (spec.comments && spec.comments.held) p.heldCommentAria = await page.locator('article.js-comment', { hasText: spec.comments.held }).first().ariaSnapshot().catch(() => '');
    p.axe = await axeScan(page);
    await page.screenshot({ path: path.join(out, `${theme}-${side}-${spec.key}.png`), fullPage: true }).catch(() => {});
    pages[spec.key] = p;
  }
  await rec.close(out);
  return Object.assign(rec, { theme, pagesByKey: pages });
}

const { browser, environment } = await launch(run);
run.browser = browser;
const results = baseResults(run, environment);
results.themes = {};
const envs = { before: v.before.env, after: v.after.env };
try {
  for (const theme of THEMES) {
    console.log(`\n== theme ${theme}: setting it as the default on both sites ...`);
    for (const side of ['before', 'after']) { setDefaultTheme(envs[side], theme); resetHistory(envs[side]); }
    results.themes[theme] = {};
    for (const side of ['before', 'after']) { console.log(`running ${side} (${envs[side]}) in ${theme} ...`); results.themes[theme][side] = await runSide(side, theme); }
  }
} finally {
  await browser.close();
  console.log('\nputting Olivero back as the default theme on both sites ...');
  for (const side of ['before', 'after']) { try { setDefaultTheme(envs[side], 'olivero'); } catch (e) { console.warn(e.message); } }
}
// results.sides is what the shared Markdown sections and the schema read: the last theme's run, with every theme's pages recorded under results.themes.
const last = THEMES[THEMES.length - 1];
results.sides = { before: results.themes[last].before, after: results.themes[last].after };
for (const t of THEMES) for (const s of ['before', 'after']) { const r = results.themes[t][s]; results.sides[s].pages.push(...(r === results.sides[s] ? [] : r.pages)); results.sides[s].jsErrors.push(...(r === results.sides[s] ? [] : r.jsErrors)); }

const yn = (b) => (b ? 'yes' : 'no');
const mk = (ms) => (ms && ms.length ? ms.map((m) => `"${m.text}" in \`${m.element}\`${m.visuallyHidden ? ' (visually hidden)' : ''}`).join('; ') : 'none');
const contrastOf = (ms) => (ms && ms.length ? ms.filter((m) => !m.visuallyHidden).map((m) => `${m.contrast}:1 (${m.color} on ${m.background}, ${m.fontSizePx}px)`).join('; ') || 'hidden only' : '-');
let unexpected = 0;
let md = `# Playwright evidence: #${v.issue} (${v.slug})\n\nRun ${results.when}. Core Before \`${results.commits.before}\`, After \`${results.commits.after}\` plus \`${(results.patches[0] || 'none').split('/').pop()}\`. ${environment.browser} ${environment.browserVersion}, ${environment.colorScheme}${environment.forcedColors ? ', forced colours' : ''}, ${run.viewport.width}x${run.viewport.height}, ${environment.os}. Themes: ${THEMES.join(', ')} (each set as the default theme on both sites, then Olivero restored). axe-core WCAG 2.0 to 2.2 A/AA on every page. Recorders: tools/playwright/lib/lab-run.mjs.\n\n`;
md += `The change under test is the #306 re-roll as it is on the fork branch, not a merge request. Rule: **fix** rows should differ as the issue asks (Before no, After yes); **regression** rows should match on both sides; **observe** and **context** rows are recorded, not judged. A fix row that stays "no" on After is the finding, not a run error.\n\n`;
const judged = [];
for (const theme of THEMES) {
  const B = results.themes[theme].before.pagesByKey, A = results.themes[theme].after.pagesByKey;
  const dB = B.draftArticle, dA = A.draftArticle, pB = B.draftPage, pA = A.draftPage, lB = B.liveArticle, lA = A.liveArticle;
  const hasText = (p) => !!(p.node && p.node.markers.length);
  const heldHas = (p) => !!(p.heldComment && p.heldComment.markers.length);
  const liveHas = (p) => !!(p.liveComment && p.liveComment.markers.length);
  const ctx = (p) => !!(p.node && p.node.markers.some((m) => m.visuallyHidden && /this (node|comment|content) is/i.test(m.text)));
  const rows = [
    ['context', 'Theme that rendered the pages', dB.theme, dA.theme, dB.theme === theme && dA.theme === theme],
    ['regression', 'No PHP or Twig error on any of the three pages', yn(!(dB.serverError || pB.serverError || lB.serverError)), yn(!(dA.serverError || pA.serverError || lA.serverError)), !(dB.serverError || pB.serverError || lB.serverError || dA.serverError || pA.serverError || lA.serverError)],
    ['regression', 'Draft article: both comments rendered (admin sees the held one)', dB.commentCount, dA.commentCount, dB.commentCount === 2 && dA.commentCount === 2],
    ['fix', 'Draft article: text says the node is unpublished', mk(dB.node && dB.node.markers), mk(dA.node && dA.node.markers), !hasText(dB) && hasText(dA)],
    ['fix', 'Draft page: text says the node is unpublished', mk(pB.node && pB.node.markers), mk(pA.node && pA.node.markers), !hasText(pB) && hasText(pA)],
    ['fix', 'Held comment: text says it is unpublished', mk(dB.heldComment && dB.heldComment.markers), mk(dA.heldComment && dA.heldComment.markers), !heldHas(dB) && heldHas(dA)],
    ['fix', 'Marker has screen-reader context ("This node is ...", visually hidden), as the issue summary asks', yn(ctx(dB)), yn(ctx(dA)), !ctx(dB) && ctx(dA)],
    ['observe', 'Marker text contrast (visible marker only; WCAG 1.4.3 needs 4.5:1)', contrastOf(dB.node && dB.node.markers), contrastOf(dA.node && dA.node.markers), true],
    ['observe', 'Draft article background, and its contrast with the page (the only Before cue; 1.4.11 asks 3:1 for a non-text cue)', dB.node ? `${dB.node.background}, ${dB.node.backgroundContrastWithPage}:1` : '-', dA.node ? `${dA.node.background}, ${dA.node.backgroundContrastWithPage}:1` : '-', true],
    ['observe', 'Held comment background, contrast with the page', dB.heldComment ? `${dB.heldComment.background}, ${dB.heldComment.backgroundContrastWithPage}:1` : '-', dA.heldComment ? `${dA.heldComment.background}, ${dA.heldComment.backgroundContrastWithPage}:1` : '-', true],
    ['observe', 'Draft article has the node--unpublished class (the change removes it from Claro\'s template)', yn(dB.node && dB.node.hasUnpublishedClass), yn(dA.node && dA.node.hasUnpublishedClass), true],
    ['observe', 'Held comment classes', dB.heldComment ? dB.heldComment.classes : '-', dA.heldComment ? dA.heldComment.classes : '-', true],
    ['regression', 'Live comment classes (a published comment must not get an empty status class such as "comment--")', dB.liveComment ? dB.liveComment.classes : '-', dA.liveComment ? dA.liveComment.classes : '-', !!dB.liveComment && !!dA.liveComment && !/(^|\s)(comment--|unpublished)(\s|$)/.test(dB.liveComment.classes) && !/(^|\s)(comment--|unpublished)(\s|$)/.test(dA.liveComment.classes)],
    ['regression', 'Live article: no unpublished text (no false positive)', yn(hasText(lB)), yn(hasText(lA)), !hasText(lB) && !hasText(lA)],
    ['regression', 'Live comments: no unpublished text', yn(liveHas(dB) || liveHas(lB)), yn(liveHas(dA) || liveHas(lA)), !(liveHas(dB) || liveHas(lB) || liveHas(dA) || liveHas(lA))],
    ['regression', 'axe violations (elements): draft article / draft page / live article', `${dB.axe.total} / ${pB.axe.total} / ${lB.axe.total}`, `${dA.axe.total} / ${pA.axe.total} / ${lA.axe.total}`, dB.axe.total === dA.axe.total && pB.axe.total === pA.axe.total && lB.axe.total === lA.axe.total],
    ['regression', 'JavaScript errors', results.themes[theme].before.jsErrors.length, results.themes[theme].after.jsErrors.length, results.themes[theme].before.jsErrors.length === 0 && results.themes[theme].after.jsErrors.length === 0],
  ];
  md += `## Theme: ${theme}\n\n| Type | Check | Before | After | Verdict |\n|---|---|---|---|---|\n`;
  for (const [t, label, b, a, good] of rows) {
    const isJudged = t === 'fix' || t === 'regression';
    if (isJudged && !good) unexpected++;
    judged.push({ theme, type: t, label, good });
    md += `| ${t} | ${label} | ${b} | ${a} | ${isJudged ? (good ? 'as expected' : '**NOT as expected**') : 'recorded'} |\n`;
  }
  md += `\nDraft article footer, accessibility snapshot. Before:\n\n\`\`\`yaml\n${(dB.nodeAria || '(none)').trim()}\n\`\`\`\n\nAfter:\n\n\`\`\`yaml\n${(dA.nodeAria || '(none)').trim()}\n\`\`\`\n\n`;
  md += `Held comment, accessibility snapshot. Before:\n\n\`\`\`yaml\n${(dB.heldCommentAria || '(none)').trim()}\n\`\`\`\n\nAfter:\n\n\`\`\`yaml\n${(dA.heldCommentAria || '(none)').trim()}\n\`\`\`\n\n`;
  const html = (p) => (p.node && p.node.markers.length ? p.node.markers.map((m) => m.outerHTML).join('\n') : '(no marker)');
  md += `Marker markup on the draft article: Before \`${html(dB)}\`; After \`${html(dA)}\`. Held comment: Before \`${dB.heldComment && dB.heldComment.markers.length ? dB.heldComment.markers.map((m) => m.outerHTML).join(' ') : '(no marker)'}\`; After \`${dA.heldComment && dA.heldComment.markers.length ? dA.heldComment.markers.map((m) => m.outerHTML).join(' ') : '(no marker)'}\`.\n\n`;
  md += `axe rules, draft article: Before ${JSON.stringify(dB.axe.rules)}, After ${JSON.stringify(dA.axe.rules)}. Screenshots: \`${theme}-before-draftArticle.png\`, \`${theme}-after-draftArticle.png\`, and the same for \`draftPage\` and \`liveArticle\`.\n\n`;
}
md += contextMarkdown(results) + ajaxMarkdown(results) + speechMarkdown(results);
const fixRows = judged.filter((j) => j.type === 'fix'), fixedCount = fixRows.filter((j) => j.good).length;
const regBad = judged.filter((j) => j.type === 'regression' && !j.good).length;
md += `## Reading\n\n${fixedCount} of ${fixRows.length} fix rows differ as the issue asks across ${THEMES.length} theme(s); ${regBad} regression row(s) differ. `;
md += `Before shows the problem wherever a fix row says "none" or "no" on the Before side. The After side says, per theme, where the #306 re-roll prints a marker and where it does not.\n\n`;
md += `---\nAutomated evidence is a DRAFT: DOM, colour and axe checks do not replace a keyboard and screen-reader pass by a person. No real VoiceOver or NVDA pass was made by this script.\n`;
results.verdict = fixedCount === 0 ? 'reproduced-not-fixed' : (fixedCount === fixRows.length && regBad === 0 ? 'reproduced-and-fixed' : 'mixed');
results.unexpected = unexpected;
const where = writeRun(run, results, md);
console.log(`\n${results.verdict} (${unexpected} judged row(s) not as expected): ${where}/SUMMARY.md`);
process.exit(unexpected === 0 ? 0 : 2);
