// Separate proposal: node tools/playwright/evaluate-867830-ribbon.mjs 867830-ribbon-pinned
// Shared run flags plus --themes=default_admin,claro,olivero, --lang=ar and --stress.
import path from 'node:path';
import { runArgs, launch, openSide, axeScan, baseResults, writeRun, contextMarkdown } from './lib/lab-run.mjs';
import { setDefaultTheme, resetHistory } from './lib/unpublished-fixture.mjs';
import { checkPageSpeech } from './lib/unpublished-speech.mjs';
import { ribbonSnapshot, ribbonProblems } from './lib/unpublished-ribbon.mjs';

const run = runArgs({ slug: '867830-ribbon-pinned' });
const opt = (key, fallback) => process.argv.find((arg) => arg.startsWith(`--${key}=`))?.slice(key.length + 3) ?? fallback;
const themes = opt('themes', 'default_admin').split(',');
const lang = opt('lang', 'en');
const stress = process.argv.includes('--stress');
if (lang !== 'en' && !(run.v.languages || []).includes(lang)) throw new Error(`Language ${lang} is not registered for ${run.v.slug}`);
const pages = [
  { path: '/lab/unpublished-article', key: 'draftArticle', unpublished: true, comments: { live: 'A live comment', held: 'A comment awaiting approval' } },
  { path: '/lab/unpublished-page', key: 'draftPage', unpublished: true },
  { path: '/lab/published-article', key: 'liveArticle', unpublished: false, comments: { live: 'A live comment' } },
];
const { browser, environment } = await launch(run);
run.browser = browser;
const results = baseResults(run, environment);
results.language = lang;
results.stress = stress;
results.themes = {};
results.checks = [];
const check = (theme, key, label, good, detail) => results.checks.push({ theme, page: key, label, good, detail });
try {
  for (const theme of themes) {
    for (const side of ['before', 'after']) {
      setDefaultTheme(run.v[side].env, theme);
      resetHistory(run.v[side].env);
    }
    results.themes[theme] = {};
    for (const side of ['before', 'after']) {
      const { page, base, rec } = await openSide(run, side);
      rec.ribbonPages = {};
      try {
        for (const spec of pages) {
          const response = await page.goto(base + spec.path, { waitUntil: 'networkidle' });
          if (response.status() !== 200) throw new Error(`${side} ${spec.path}: HTTP ${response.status()}`);
          if (lang !== 'en') {
            const canonical = await page.evaluate(() => window.drupalSettings.path.currentPath);
            if (!/^node\/\d+$/.test(canonical)) throw new Error(`Unexpected canonical path ${canonical}`);
            const translated = await page.goto(`${base}/${lang}/${canonical}`, { waitUntil: 'networkidle' });
            if (translated.status() !== 200) throw new Error(`${side} ${lang}/${canonical}: HTTP ${translated.status()}`);
          }
          const renderedTheme = await page.evaluate(() => window.drupalSettings.ajaxPageState.theme);
          if (renderedTheme !== theme) throw new Error(`${side}: ${renderedTheme} rendered instead of ${theme}`);
          const snapshot = await ribbonSnapshot(page);
          if (snapshot.lang !== lang || (lang === 'ar' && snapshot.dir !== 'rtl')) throw new Error(`Language/direction precondition failed: ${snapshot.lang}, ${snapshot.dir}`);
          const speech = await checkPageSpeech(page, spec, side);
          const axe = await axeScan(page);
          const aria = (await page.locator('article.node').ariaSnapshot()).replace(/([?&]token=)[^&\s"'<>]+/g, '$1[redacted]');
          const screenshot = `${theme}-${side}-${spec.key}-${lang}.png`;
          await page.screenshot({ path: path.join(run.out, screenshot), fullPage: true });
          const problems = ribbonProblems(snapshot);
          rec.ribbonPages[spec.key] = { path: new URL(page.url()).pathname, snapshot, speech, axe, aria, screenshot, problems };
          check(theme, spec.key, `${side}: contextual status and published controls`, speech.every((s) => s.good), speech.map((s) => ({ kind: s.kind, good: s.good })));
          if (side === 'after') check(theme, spec.key, 'After: ribbon geometry, colours and nested independence', problems.length === 0, problems);
          if (stress && spec.unpublished) {
            await page.evaluate(() => {
              document.documentElement.style.fontSize = '200%';
              for (const marker of document.querySelectorAll('.unpublished-status')) {
                const text = document.createTreeWalker(marker, NodeFilter.SHOW_TEXT);
                for (let t = text.nextNode(); t; t = text.nextNode()) {
                  if (t.textContent.trim() && !t.parentElement.closest('.visually-hidden')) t.textContent = 'Unpublished content awaiting independent editorial and accessibility review '.repeat(3);
                }
              }
              for (const heading of document.querySelectorAll('h1, article.node h2, article.js-comment h3')) heading.textContent = 'A long editorial title that must wrap without covering the status ribbon '.repeat(3);
              for (const body of document.querySelectorAll('article.js-comment .field--name-comment-body')) body.textContent = 'Short.';
            });
            const measured = await ribbonSnapshot(page);
            const stressProblems = ribbonProblems(measured);
            const stressScreenshot = `${theme}-${side}-${spec.key}-${lang}-synthetic-wrapping.png`;
            await page.screenshot({ path: path.join(run.out, stressScreenshot), fullPage: true });
            rec.ribbonPages[spec.key].stress = {
              method: 'Synthetic 200% root text size, long labels/titles and short comment bodies; not browser zoom or translation verification.',
              snapshot: measured, problems: stressProblems, screenshot: stressScreenshot,
            };
            if (side === 'after') check(theme, spec.key, 'After: synthetic text-resize and label-wrapping layout stress', stressProblems.length === 0, stressProblems);
          }
          console.log(`${theme}/${side}/${spec.key}/${lang}: ${problems.length} ribbon differences, ${axe.total} axe instances`);
        }
      } finally {
        await rec.close(run.out);
      }
      results.themes[theme][side] = rec;
    }
    for (const spec of pages) {
      const b = results.themes[theme].before.ribbonPages[spec.key];
      const a = results.themes[theme].after.ribbonPages[spec.key];
      const fingerprint = (axe) => axe.violations.flatMap((v) => v.nodes.map((n) => `${v.id}:${n.target}`));
      const previous = new Set(fingerprint(b.axe));
      const added = fingerprint(a.axe).filter((key) => !previous.has(key));
      check(theme, spec.key, 'No new axe rule/target pairs (not just count parity)', added.length === 0, added);
      if (spec.unpublished) check(theme, spec.key, 'Baseline lacks local status; After adds it', b.snapshot.entities[0].markerCount === 0 && a.snapshot.entities[0].markerCount === 1);
    }
  }
} finally {
  await browser.close();
  for (const side of ['before', 'after']) setDefaultTheme(run.v[side].env, 'olivero');
}
const last = themes.at(-1);
results.sides = { before: results.themes[last].before, after: results.themes[last].after };
results.unexpected = results.checks.filter((c) => !c.good).length;
results.verdict = results.unexpected ? 'mixed' : 'reproduced-and-fixed';
let md = `# Ribbon alternative: #867830\n\nDRAFT automated evidence, ${results.when}.\n\nVariant: ${run.v.slug}. Core: ${results.commits.before} / ${results.commits.after}.\nBrowser: ${environment.browser} ${environment.browserVersion}; ${environment.os}; ${run.scheme}; forced colours ${run.forced}; ${run.viewport.width}x${run.viewport.height}; language ${lang}.\n\n`;
md += '| Theme | Page | Check | Result | Detail |\n|---|---|---|---|---|\n';
for (const c of results.checks) md += `| ${c.theme} | ${c.page} | ${c.label} | ${c.good ? 'PASS' : 'FAIL'} | ${JSON.stringify(c.detail ?? '').replaceAll('|', '\\|')} |\n`;
md += '\n## Screenshots\n\n';
for (const theme of themes) for (const side of ['before', 'after']) for (const [key, p] of Object.entries(results.themes[theme][side].ribbonPages)) {
  md += `- [${theme} ${side} ${key}, ${lang}](${p.screenshot})\n`;
  if (p.stress) md += `- [${theme} ${side} ${key}, synthetic wrapping and text resize](${p.stress.screenshot})\n`;
}
md += '\n## Verification boundary\n\nThe scripted verdict covers the listed predicates only, not RTBC or WCAG conformance. Guidepup reads captured status markup, not the live operating-system accessibility stack. Forced colours are browser emulation, not real Windows Contrast Themes. Arabic routes test natural directionality; the interface remains English unless translations are imported. Optional stress captures replace labels and double root font size; they are synthetic layout diagnostics, not translation or browser-zoom verification. No person-led keyboard, screen-reader, zoom or visual acceptance was performed. The Navigation Top Bar is unchanged and remains a separate review question. Full node ARIA snapshots and rule/target-level axe results are in results.json.\n\n';
md += contextMarkdown(results);
console.log(`${results.unexpected} unexpected checks: ${writeRun(run, results, md)}`);
process.exitCode = results.unexpected ? 2 : 0;
