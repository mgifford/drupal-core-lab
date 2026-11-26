// #3155130, persistent summary disclosure in contributed text_with_summary 2.0.x.
// Real keyboard input on both sides of the registered comparison, axe scans, ARIA snapshots,
// focus transitions and screenshots for the collapsed and expanded states.
//
//   node tools/playwright/evaluate-3155130-contrib.mjs 3155130-contrib
//   node tools/playwright/evaluate-3155130-contrib.mjs 3155130-contrib --scheme=dark
//   node tools/playwright/evaluate-3155130-contrib.mjs 3155130-contrib --forced-colors
//   node tools/playwright/evaluate-3155130-contrib.mjs 3155130-contrib --viewport=480x900
//   node tools/playwright/evaluate-3155130-contrib.mjs 3155130-contrib --theme=claro
//   node tools/playwright/evaluate-3155130-contrib.mjs 3155130-contrib --rtl
//   node tools/playwright/evaluate-3155130-contrib.mjs 3155130-contrib --zoom=200
//
// DRAFT evidence: Chromium/Firefox/WebKit as asked, not a person, not a real screen reader.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { chromium, firefox, webkit } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { labRoot, resolveVariant, envInfo, loginPath, reportsDir, envDir } from '../compare/lib.mjs';

const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const slug = argv.find((a) => !a.startsWith('-')) || '3155130-contrib';
const browserName = opt('browser', 'chromium');
const scheme = opt('scheme', 'light');
const forced = argv.includes('--forced-colors');
const rtl = argv.includes('--rtl');
const zoom = Number(opt('zoom', '0'));
const theme = opt('theme', 'default_admin');
const [width, height] = opt('viewport', '1280x900').split('x').map(Number);
const BROWSERS = { chromium, firefox, webkit };
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const r = resolveVariant(slug);
if (r.error) {
  console.error(r.error);
  process.exit(2);
}
const v = r.v;
const startedAt = new Date();
const stamp = startedAt.toISOString().replace(/[:.]/g, '-');
const variantTag = `${browserName}-${scheme}${forced ? '-forced' : ''}-${theme}${rtl ? '-rtl' : ''}${zoom ? `-zoom${zoom}` : ''}-${width}x${height}`;
const out = path.resolve(opt('out', '') || path.join(labRoot, reportsDir(v), 'playwright', `${stamp}-${variantTag}`));
fs.mkdirSync(out, { recursive: true });

const runPhp = (env, code) => spawnSync('ddev', ['exec', 'php'], {
  cwd: envDir(env),
  input: code,
  encoding: 'utf8',
  timeout: 120000,
});

const setAdminTheme = (env, name) => {
  const php = `<?php
$a = require "autoload.php";
$r = \\Symfony\\Component\\HttpFoundation\\Request::create("/");
$k = \\Drupal\\Core\\DrupalKernel::createFromRequest($r, $a, "prod");
$k->boot();
$k->preHandle($r);
$themes = \\Drupal::service("theme_handler")->listInfo();
if (!isset($themes["${name}"])) { echo "MISSING"; exit(0); }
\\Drupal::configFactory()->getEditable("system.theme")->set("admin", "${name}")->save();
drupal_flush_all_caches();
echo "OK";
`;
  const result = runPhp(env, php);
  const last = (result.stdout || '').trim().split('\n').pop();
  if (last !== 'OK') {
    throw new Error(`could not set admin theme ${name} in ${env}: ${last || (result.stderr || '').trim().split('\n')[0]}`);
  }
};

const gitInfo = (dir) => {
  try {
    return execFileSync('git', ['-C', dir, 'log', '-1', '--format=%h %cs'], { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
};
const moduleCommit = () => (v.contrib || []).find((x) => x.name === 'text_with_summary')?.commit || 'unknown';

const siteContext = (env) => {
  const php = `<?php
$a = require "autoload.php";
$r = \\Symfony\\Component\\HttpFoundation\\Request::create("/");
$k = \\Drupal\\Core\\DrupalKernel::createFromRequest($r, $a, "prod");
$k->boot();
$k->preHandle($r);
echo json_encode([
  "drupal" => \\Drupal::VERSION,
  "profile" => \\Drupal::installProfile(),
  "defaultTheme" => \\Drupal::config("system.theme")->get("default"),
  "adminTheme" => \\Drupal::config("system.theme")->get("admin"),
  "modules" => array_values(array_intersect(["text_with_summary", "text_summary_test", "ckeditor5", "filter"], array_keys(\\Drupal::moduleHandler()->getModuleList()))),
  "languages" => array_keys(\\Drupal::languageManager()->getLanguages()),
]), PHP_EOL;
`;
  const result = runPhp(env, php);
  const line = (result.stdout || '').trim().split('\n').pop();
  try {
    return JSON.parse(line);
  } catch {
    return { error: (result.stderr || result.stdout || 'no output').trim().split('\n')[0] };
  }
};

const summaryState = () => {
  const wrappers = [...document.querySelectorAll('.js-text-summary-wrapper')];
  return {
    details: [...document.querySelectorAll('details')].length,
    buttons: [...document.querySelectorAll('button.link-edit-summary')].map((button) => {
      const link = button.closest('.field-edit-link');
      const wrapper = wrappers.find((candidate) => button.getAttribute('aria-controls') === candidate.id);
      const summary = wrapper ? wrapper.querySelector('textarea') : null;
      return {
        text: button.textContent.trim().replace(/\s+/g, ' '),
        expanded: button.getAttribute('aria-expanded'),
        controls: button.getAttribute('aria-controls'),
        insideLabel: button.closest('label') !== null,
        immediatelyBefore: link !== null && link.nextElementSibling === wrapper,
        summaryName: summary ? summary.name : null,
        summaryLabel: summary && summary.labels.length ? summary.labels[0].textContent.trim().replace(/\s+/g, ' ') : null,
        summaryVisible: summary !== null && summary.getClientRects().length > 0,
        wrapperVisible: !!wrapper && wrapper.getClientRects().length > 0,
      };
    }),
    summaries: [...document.querySelectorAll('textarea[name$="[summary]"]')].map((summary) => ({
      name: summary.name,
      visible: summary.getClientRects().length > 0,
      hiddenAncestor: summary.closest('[hidden]') !== null,
      label: summary.labels.length ? summary.labels[0].textContent.trim().replace(/\s+/g, ' ') : null,
      value: summary.value,
      required: summary.required,
      invalid: summary.getAttribute('aria-invalid'),
      className: summary.className,
    })),
    togglesInsideLabels: document.querySelectorAll('label button').length,
    togglesInsideLabelsAll: document.querySelectorAll('label button, label .field-edit-link').length,
    summaryBeforeValue: (() => {
      const s = document.querySelector('textarea[name$="[value]"]');
      const sum = document.querySelector('textarea[name$="[summary]"]');
      return s && sum ? !!(sum.compareDocumentPosition(s) & Node.DOCUMENT_POSITION_FOLLOWING) : null;
    })(),
    buttonIds: [...document.querySelectorAll('button.link-edit-summary')].map((b) => b.getAttribute('aria-controls')),
    active: document.activeElement ? {
      tag: document.activeElement.tagName,
      text: (document.activeElement.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 100),
      id: document.activeElement.id,
      name: document.activeElement.getAttribute('name'),
    } : null,
  };
};

const axe = async (page) => {
  try {
    const results = await new AxeBuilder({ page }).include('form').withTags(TAGS).analyze();
    return {
      violations: results.violations.map((x) => ({
        id: x.id,
        impact: x.impact,
        help: x.help,
        nodes: x.nodes.map((n) => ({ target: n.target, html: n.html.slice(0, 300), failureSummary: n.failureSummary })),
      })),
      passes: results.passes.length,
      incomplete: results.incomplete.map((x) => ({ id: x.id, impact: x.impact, help: x.help })),
    };
  } catch (e) {
    return { error: String(e.message).split('\n')[0] };
  }
};

const activeElement = (page) => page.evaluate(() => {
  const a = document.activeElement;
  if (!a) return null;
  return {
    tag: a.tagName,
    id: a.id,
    name: a.getAttribute('name'),
    text: (a.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 100),
    ariaExpanded: a.getAttribute('aria-expanded'),
    ariaControls: a.getAttribute('aria-controls'),
    isToggle: a.classList.contains('link-edit-summary'),
  };
});

const aria = async (page, file) => {
  const form = page.locator('form').filter({ has: page.locator('textarea[name$="[summary]"]') }).first();
  const snapshot = await form.ariaSnapshot();
  fs.writeFileSync(file, snapshot);
  return snapshot;
};

const screenshot = async (page, file, fullPage = false) => {
  await page.screenshot({ path: file, fullPage });
};

const browser = await BROWSERS[browserName].launch();
const browserVersion = browser.version();
const results = {
  issue: '3155130',
  slug,
  when: startedAt.toISOString(),
  environment: {
    browser: browserName,
    browserVersion,
    colorScheme: scheme,
    forcedColors: forced,
    viewport: { width, height },
    theme,
    rtl,
    zoom,
    os: `${process.platform} ${process.arch}`,
  },
  core: {},
  module: moduleCommit(),
  sides: {},
};

for (const side of ['before', 'after']) {
  const env = v[side].env;
  const info = envInfo(env);
  const host = info.hosts.slice().sort((a, b) => a.length - b.length)[0];
  const base = `https://${host}${info.routerHttpsPort && info.routerHttpsPort !== 443 ? `:${info.routerHttpsPort}` : ''}`;
  const dir = path.join(out, side);
  fs.mkdirSync(dir, { recursive: true });

  setAdminTheme(env, theme);
  results.core[side] = gitInfo(envDir(env));

  const context = await browser.newContext({
    viewport: { width, height },
    colorScheme: scheme,
    forcedColors: forced ? 'active' : 'none',
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  const sideResult = {
    env,
    site: siteContext(env),
    pages: [],
    keyboard: {},
    states: {},
    axe: {},
    persistence: {},
    ajax: {},
    jsErrors: [],
  };
  page.on('pageerror', (e) => {
    if (!/ResizeObserver loop/.test(e.message)) sideResult.jsErrors.push(e.message);
  });

  await page.goto(base + loginPath(env), { waitUntil: 'load' });
  await page.goto(`${base}/node/add/page`, { waitUntil: 'load' });
  sideResult.pages.push(page.url());
  await page.waitForSelector('textarea[name$="[summary]"]', { state: 'attached', timeout: 15000 });
  await page.waitForTimeout(300);
  if (rtl) {
    await page.evaluate(() => {
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'he';
    });
  }
  if (zoom) {
    await page.evaluate((value) => {
      document.documentElement.style.fontSize = `${value}%`;
    }, zoom);
    await page.waitForTimeout(300);
  }

  // As loaded.
  sideResult.states.collapsed = await page.evaluate(summaryState);
  await screenshot(page, path.join(dir, 'collapsed.png'));
  await screenshot(page, path.join(dir, 'collapsed-full.png'), true);
  sideResult.axe.collapsed = await axe(page);
  await aria(page, path.join(dir, 'aria-collapsed.txt'));

  // Keyboard from the title to the summary control. Record every step.
  await page.locator('#edit-title-0-value').click();
  const steps = [];
  for (let i = 0; i < 10; i += 1) {
    await page.keyboard.press('Tab');
    const active = await activeElement(page);
    steps.push(active);
    if (active && active.tag === 'BUTTON' && /summary/i.test(active.text)) break;
    if (active && active.tag === 'TEXTAREA' && /\[summary\]$/.test(active.name || '')) break;
  }
  sideResult.keyboard.tabFromTitle = steps;
  const toggleReached = steps.some((s) => s && s.tag === 'BUTTON' && /summary/i.test(s.text));
  sideResult.keyboard.toggleReachedByTab = toggleReached;

  if (toggleReached) {
    const focusBefore = await activeElement(page);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(250);
    const afterEnter = await activeElement(page);
    sideResult.keyboard.enter = {
      focusBefore,
      focusAfter: afterEnter,
      focusRetained: afterEnter?.isToggle === true && afterEnter?.ariaControls === focusBefore?.ariaControls,
      state: await page.evaluate(summaryState),
    };
    if (afterEnter && afterEnter.tag === 'BUTTON') {
      await page.keyboard.press('Space');
      await page.waitForTimeout(250);
      const afterSpace = await activeElement(page);
      sideResult.keyboard.space = {
        focusBefore: afterEnter,
        focusAfter: afterSpace,
        focusRetained: afterSpace?.isToggle === true && afterSpace?.ariaControls === afterEnter?.ariaControls,
        state: await page.evaluate(summaryState),
      };
      await page.keyboard.press('Enter');
      await page.waitForTimeout(250);
    }
    // Expanded state.
    sideResult.states.expanded = await page.evaluate(summaryState);
    await screenshot(page, path.join(dir, 'expanded.png'));
    await screenshot(page, path.join(dir, 'expanded-full.png'), true);
    sideResult.axe.expanded = await axe(page);
    await aria(page, path.join(dir, 'aria-expanded.txt'));

    // Tab order while expanded, starting from the disclosure.
    await page.evaluate(() => document.querySelector('button.link-edit-summary')?.focus());
    const order = [];
    for (let i = 0; i < 4; i += 1) {
      await page.keyboard.press('Tab');
      order.push(await activeElement(page));
    }
    sideResult.keyboard.tabFromExpandedToggle = order;
  }

  // Multi-value: add another item and record names and controls.
  await page.goto(`${base}/node/add/page`, { waitUntil: 'load' });
  await page.waitForSelector('textarea[name$="[summary]"]', { state: 'attached' });
  const addAnother = page.getByRole('button', { name: 'Add another item' });
  if (await addAnother.count()) {
    await addAnother.first().click();
    await page.waitForTimeout(800);
    await addAnother.first().click();
    await page.waitForTimeout(800);
  }
  sideResult.ajax.multiValue = await page.evaluate(summaryState);
  await screenshot(page, path.join(dir, 'multi-value.png'));
  sideResult.axe.multiValue = await axe(page);

  // Persistence: save a known summary, reopen, then save while collapsed.
  const summary = 'Summary typed by the evaluator: 3155130.';
  await page.goto(`${base}/node/add/page`, { waitUntil: 'load' });
  await page.waitForSelector('textarea[name$="[summary]"]', { state: 'attached' });
  await page.fill('#edit-title-0-value', `Evaluator ${side} 3155130`);
  // The first optional summary is the Body field. Before, the toggle is
  // inside the Body label and has no aria-expanded; after, it is a disclosure
  // with aria-expanded. Open the summary so a value can be typed.
  const open = page.locator('button.link-edit-summary').first();
  if (await open.count()) {
    const expanded = await open.getAttribute('aria-expanded');
    if (expanded === 'false' || expanded === null) {
      await open.click();
    }
  }
  const summaryField = page.locator('textarea[name="field_body[0][summary]"]');
  if (await summaryField.count()) {
    await summaryField.fill(summary);
    // The fixture also has a required summary; fill it so the node can save.
    const requiredSummary = page.locator('textarea[name="field_required_summary[0][summary]"]');
    if (await requiredSummary.count()) {
      await requiredSummary.fill('Required summary for the persistence check.');
    }
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await page.waitForURL(/\/node\/\d+($|\?)/, { timeout: 15000 }).catch(() => {});
    const nid = (page.url().match(/\/node\/(\d+)/) || [])[1];
    if (nid) {
      await page.goto(`${base}/node/${nid}/edit`, { waitUntil: 'load' });
      await page.waitForSelector('textarea[name="field_body[0][summary]"]', { state: 'attached' });
      const saved = await summaryField.inputValue();
      // Collapse and save again.
      const toggle = page.locator('button.link-edit-summary').first();
      if (await toggle.count()) {
        const expanded = await toggle.getAttribute('aria-expanded');
        // Before has no aria-expanded; its "Hide summary" button collapses too.
        if (expanded === 'true' || expanded === null) {
          await toggle.click();
        }
      }
      const visibleBeforeSave = await summaryField.isVisible();
      await page.getByRole('button', { name: 'Save', exact: true }).click();
      await page.waitForURL(/\/node\/\d+($|\?)/, { timeout: 15000 }).catch(() => {});
      await page.goto(`${base}/node/${nid}/edit`, { waitUntil: 'load' });
      await page.waitForSelector('textarea[name="field_body[0][summary]"]', { state: 'attached' });
      const reopened = await summaryField.inputValue();
      sideResult.persistence = {
        nid,
        typed: summary,
        saved,
        collapsedBeforeSecondSave: !visibleBeforeSave,
        reopened,
        keptAfterSave: saved === summary,
        keptAfterCollapseAndSave: reopened === summary,
        submittedName: await summaryField.getAttribute('name'),
      };
    } else {
      sideResult.persistence = {
        error: `no node id after save (${page.url()})`,
        errors: await page.locator('.messages--error, .form-item--error-message').allTextContents(),
      };
    }
  }

  // Required summary: no disclosure and its error stays visible.
  await page.goto(`${base}/node/add/page`, { waitUntil: 'load' });
  await page.waitForSelector('textarea[name$="[summary]"]', { state: 'attached' });
  sideResult.required = await page.evaluate(() => {
    const summary = document.querySelector('textarea[name="field_required_summary[0][summary]"]');
    if (!summary) return null;
    const wrapper = summary.closest('.js-text-summary-wrapper');
    return {
      visible: summary.getClientRects().length > 0,
      buttons: wrapper ? wrapper.querySelectorAll('button.link-edit-summary').length : -1,
      label: summary.labels.length ? summary.labels[0].textContent.trim().replace(/\s+/g, ' ') : null,
      required: summary.required,
    };
  });
  await page.fill('#edit-title-0-value', 'Required summary evaluator');
  await page.evaluate(() => { document.querySelector('form').noValidate = true; });
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.waitForTimeout(800);
  sideResult.required.error = await page.evaluate(() => {
    const summary = document.querySelector('textarea[name="field_required_summary[0][summary]"]');
    const error = [...document.querySelectorAll('.messages--error, .form-item--error-message')].map((x) => x.textContent.trim().replace(/\s+/g, ' ')).filter(Boolean);
    return {
      visible: summary ? summary.getClientRects().length > 0 : null,
      invalid: summary ? summary.getAttribute('aria-invalid') : null,
      errors: error,
    };
  });
  await screenshot(page, path.join(dir, 'required-error.png'));

  // Theme override compatibility: enable the module's test module, reload.
  runPhp(env, `<?php
$a = require "autoload.php";
$r = \\Symfony\\Component\\HttpFoundation\\Request::create("/");
$k = \\Drupal\\Core\\DrupalKernel::createFromRequest($r, $a, "prod");
$k->boot();
$k->preHandle($r);
if (!\\Drupal::moduleHandler()->moduleExists("text_summary_test")) {
  \\Drupal::service("module_installer")->install(["text_summary_test"]);
}
drupal_flush_all_caches();
echo "OK";
`);
  await page.goto(`${base}/node/add/page`, { waitUntil: 'load' });
  await page.waitForSelector('textarea[name$="[summary]"]', { state: 'attached' });
  sideResult.themeOverride = await page.evaluate(() => {
    const link = document.querySelector('.field-edit-link');
    const button = document.querySelector('button.link-edit-summary');
    return {
      overrideClass: !!document.querySelector('.field-edit-link.text-test-edit-link'),
      text: button ? button.textContent.trim().replace(/\s+/g, ' ') : null,
      insideLabel: button ? button.closest('label') !== null : null,
    };
  });
  await screenshot(page, path.join(dir, 'theme-override.png'));

  // Leave the site as it was for the next run.
  runPhp(env, `<?php
$a = require "autoload.php";
$r = \\Symfony\\Component\\HttpFoundation\\Request::create("/");
$k = \\Drupal\\Core\\DrupalKernel::createFromRequest($r, $a, "prod");
$k->boot();
$k->preHandle($r);
if (\\Drupal::moduleHandler()->moduleExists("text_summary_test")) {
  \\Drupal::service("module_installer")->uninstall(["text_summary_test"]);
}
drupal_flush_all_caches();
echo "OK";
`);

  results.sides[side] = sideResult;
  await context.close();
}

await browser.close();
results.durationMs = Date.now() - startedAt.getTime();

// Before/after ARIA differences for the collapsed and expanded states.
for (const state of ['collapsed', 'expanded']) {
  const a = path.join(out, 'before', `aria-${state}.txt`);
  const b = path.join(out, 'after', `aria-${state}.txt`);
  if (fs.existsSync(a) && fs.existsSync(b)) {
    const diff = spawnSync('diff', ['-u', '--label', `before/${state}`, '--label', `after/${state}`, a, b], { encoding: 'utf8' });
    fs.writeFileSync(path.join(out, `aria-${state}.diff`), diff.stdout || '');
  }
}

fs.writeFileSync(path.join(out, 'results.json'), `${JSON.stringify(results, null, 2)}\n`);

const stateRow = (label, pick) => {
  const b = pick(results.sides.before?.states?.collapsed || {}, results.sides.before?.states || {});
  const a = pick(results.sides.after?.states?.collapsed || {}, results.sides.after?.states || {});
  return `| ${label} | ${b ?? 'n/a'} | ${a ?? 'n/a'} |`;
};
const md = `# #3155130 browser evaluation: ${slug}\n\nDRAFT. ${browserName} ${browserVersion}, ${scheme}${forced ? ', forced colours' : ''}, ${theme}${rtl ? ', simulated RTL' : ''}${zoom ? `, root font ${zoom}%` : ''}, ${width}x${height}. Core ${JSON.stringify(results.core)}. Module ${results.module.slice(0, 12)}. Real keyboard input; no screen reader.\n\n| Check | Before | After |\n|---|---|---|\n${[
  stateRow('Toggles inside a label', (c) => c.togglesInsideLabels),
  stateRow('Disclosure buttons', (c) => (c.buttons || []).length),
  stateRow('Summary before the Body value', (c) => c.summaryBeforeValue),
  stateRow('Collapsed summary visible', (c) => (c.summaries || []).filter((s) => s.name.includes('field_body')).map((s) => s.visible).join(',')),
  stateRow('aria-expanded on the Body control', (c) => (c.buttons || []).map((b) => b.expanded).join(',')),
  stateRow('aria-controls on the Body control', (c) => (c.buttons || []).map((b) => b.controls).join(',')),
  stateRow('Body summary label', (c) => (c.buttons || [])[0]?.summaryLabel || (c.summaries || [])[0]?.label),
  stateRow('Required summary label (visible field)', (c) => (c.summaries || []).find((s) => s.name.includes('field_required_summary'))?.label ?? 'n/a'),
  stateRow('Body toggle immediately before its content', (c) => (c.buttons || [])[0]?.immediatelyBefore ?? 'n/a'),
  `| Toggle reached by Tab from Title | ${results.sides.before?.keyboard?.toggleReachedByTab ?? 'n/a'} | ${results.sides.after?.keyboard?.toggleReachedByTab ?? 'n/a'} |`,
  `| Focus kept after Enter | ${results.sides.before?.keyboard?.enter?.focusRetained ?? 'n/a'} | ${results.sides.after?.keyboard?.enter?.focusRetained ?? 'n/a'} |`,
  `| Focus kept after Space | ${results.sides.before?.keyboard?.space?.focusRetained ?? 'n/a'} | ${results.sides.after?.keyboard?.space?.focusRetained ?? 'n/a'} |`,
  `| Summary kept after Save and Edit | ${results.sides.before?.persistence?.keptAfterSave ?? 'n/a'} | ${results.sides.after?.persistence?.keptAfterSave ?? 'n/a'} |`,
  `| Summary kept after collapse and Save | ${results.sides.before?.persistence?.keptAfterCollapseAndSave ?? 'n/a'} | ${results.sides.after?.persistence?.keptAfterCollapseAndSave ?? 'n/a'} |`,
  `| Submitted summary name | ${results.sides.before?.persistence?.submittedName ?? 'n/a'} | ${results.sides.after?.persistence?.submittedName ?? 'n/a'} |`,
  `| Required summary has a disclosure | ${results.sides.before?.required?.buttons ?? 'n/a'} | ${results.sides.after?.required?.buttons ?? 'n/a'} |`,
  `| Required summary error visible | ${results.sides.before?.required?.error?.visible ?? 'n/a'} | ${results.sides.after?.required?.error?.visible ?? 'n/a'} |`,
  `| axe violations, collapsed | ${results.sides.before?.axe?.collapsed?.violations?.length ?? 'n/a'} | ${results.sides.after?.axe?.collapsed?.violations?.length ?? 'n/a'} |`,
  `| axe violations, expanded | ${results.sides.before?.axe?.expanded?.violations?.length ?? 'n/a'} | ${results.sides.after?.axe?.expanded?.violations?.length ?? 'n/a'} |`,
  `| Theme override class | ${results.sides.before?.themeOverride?.overrideClass ?? 'n/a'} | ${results.sides.after?.themeOverride?.overrideClass ?? 'n/a'} |`,
  `| Theme override button text | ${results.sides.before?.themeOverride?.text ?? 'n/a'} | ${results.sides.after?.themeOverride?.text ?? 'n/a'} |`,
].join('\n')}\n\nScreenshots, ARIA snapshots and \`results.json\` are in this folder. Page errors: ${JSON.stringify({ before: results.sides.before?.jsErrors, after: results.sides.after?.jsErrors })}.\n`;
fs.writeFileSync(path.join(out, 'results.md'), md);
console.log(md);
console.log(`Wrote ${path.relative(labRoot, out)}/`);
