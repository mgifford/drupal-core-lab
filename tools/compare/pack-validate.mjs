// Validate an "issue pack": one YAML file, written by a chat tool or a person, that describes how to reproduce a Drupal core
// issue in the lab (docs/ISSUE-PACK.md). A pack is UNTRUSTED input. This module only parses and checks it: it never runs anything
// from the pack, never touches the network, and never writes files. scripts/issue-pack.mjs does the import after this passes.
//
//   validatePack(text, { yaml })  ->  { errors: [{ at, msg }], warnings: [{ at, msg }], pack }
//
// The probe check is a read-only heuristic (it rejects network, cookie, navigation and DOM-writing calls, assignments and template
// strings), not a sandbox. A probe still runs inside the framed site, so a person must read the checks before trusting them.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { labRoot } from './lib.mjs';
import { loadCatalogue, validateSetup, expandSetup } from './pack-blocks.mjs';
import { loadChecks, expandChecks } from './pack-checks.mjs';

export const PACK_VERSION = 1;
export const MAX_PACK_BYTES = 200 * 1024;

// js-yaml is installed into tools/compare/.deps (like axe-core and Lighthouse): npm install --prefix tools/compare/.deps js-yaml@4
export function loadYaml() {
  const deps = path.join(labRoot, 'tools/compare/.deps/node_modules');
  if (!fs.existsSync(path.join(deps, 'js-yaml'))) return null;
  return createRequire(path.join(deps, 'x.js'))('js-yaml');
}

const URL_HOSTS = new Set(['www.drupal.org', 'drupal.org', 'git.drupalcode.org', 'api.drupal.org', 'project.pages.drupalcode.org']);
const TOP_KEYS = ['pack_version', 'issue', 'sources', 'summary', 'setup', 'needs', 'recipe', 'variant', 'review', 'notes'];
const VARIANT_KEYS = ['description', 'pages', 'login', 'demo', 'steps', 'expected', 'actual', 'checks', 'observe'];
const RECIPE_YML_KEYS = ['name', 'description', 'type', 'recipes', 'install', 'config', 'input'];
const PATH_RE = /^\/[A-Za-z0-9._~\/%-]*(\?[A-Za-z0-9._~=&%-]*)?$/;

// What a read-only probe may not do. Checked outside string and regular-expression literals.
//  ALWAYS: network, dynamic code, timers, storage writes, HTML injection and prototype tricks, wherever the word appears.
//  CALLS: methods that change the page or move focus; reading a property of the same name (details.open, rect.top) is fine.
//  GLOBALS: the window-level objects that navigate, reach other windows or fingerprint the browser (window.top, location, history ...).
const ALWAYS = /\b(fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|importScripts|eval|Function|setTimeout|setInterval|requestAnimationFrame|import|require|postMessage|indexedDB|caches|serviceWorker|alert|confirm|prompt|dispatchEvent|innerHTML|outerHTML|insertAdjacentHTML|cookie|setItem|removeItem|constructor|prototype|__proto__)\b/;
const CALLS = /\b(click|submit|focus|blur|remove|removeChild|append|appendChild|prepend|insertBefore|replaceWith|write|writeln|setAttribute|removeAttribute|play|pause|scrollTo|scrollBy|scrollIntoView|reload|assign|open|close|clear)\s*\(/;
const GLOBALS = /(^|[^.\w$])(top|parent|opener|frames|location|history|navigator)\b|\b(window|self|globalThis|document)\s*\.\s*(top|parent|opener|frames|location|history|navigator)\b/;

// The only window.__ values that exist: the ones the viewer's injected script defines (tools/compare/serve.mjs). A test keeps this list equal to the script.
export const VIEWER_GLOBALS = ['__cmpDragged', '__cmpErrors', '__cmpFocused', '__cmpTrustedFragmentClick'];

// A probe that never names one of these cannot be reading the page.
const PAGE_ROOTS = /\b(document|window|Drupal|drupalSettings|jQuery|localStorage|sessionStorage|self|globalThis|performance|screen|matchMedia|getComputedStyle)\b/;

const SECRET_RES = [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, /\bghp_[A-Za-z0-9]{20,}/, /\bgithub_pat_[A-Za-z0-9_]{20,}/, /\bAKIA[0-9A-Z]{16}\b/,
  /\bxox[abprs]-[A-Za-z0-9-]{10,}/, /\b(?:api[_-]?key|secret|token|passw(?:or)?d)\s*[:=]\s*["']?[A-Za-z0-9+\/_-]{12,}/i];

const isObj = (x) => x && typeof x === 'object' && !Array.isArray(x);
const str = (x) => typeof x === 'string';

function stripLiterals(code) {
  // Replace string literals and regular-expression literals with empty ones so words inside them (selectors, patterns) are not flagged.
  return code
    .replace(/'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"/g, '""')
    .replace(/(^|[(,=:!&|?{;])\s*\/(?:\\.|[^\/\n\\])+\/[gimsuy]*/g, '$1 0');
}

export function checkProbe(probe) {
  const problems = [];
  if (!str(probe) || !probe.trim()) return ['is empty'];
  if (probe.length > 400) problems.push('is longer than 400 characters');
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(probe)) problems.push('contains control characters');
  if (probe.includes('`')) problems.push('uses a template string (backticks); use quotes');
  const code = stripLiterals(probe);
  const bad = code.match(ALWAYS) || code.match(CALLS) || code.match(GLOBALS);
  if (bad) problems.push(`uses "${bad[0].replace(/\s*\($/, '').trim()}", which a read-only probe may not use`);
  if (/\+\+|--/.test(code)) problems.push('uses ++ or --');
  if (/=/.test(code.replace(/===|!==|==|!=|<=|>=|=>/g, ''))) problems.push('contains an assignment (a probe only reads)');
  if (/;/.test(code)) problems.push('contains a semicolon; a probe is one expression');
  try { new Function(`return (${probe})`); } catch (e) { problems.push(`is not a valid JavaScript expression (${String(e.message).slice(0, 80)})`); }
  return problems;
}

export function validatePack(text, { yaml, catalogue, checkCatalogue } = {}) {
  const errors = [], warnings = [];
  const err = (at, msg) => errors.push({ at, msg }), warn = (at, msg) => warnings.push({ at, msg });
  if (!yaml) { err('pack', 'js-yaml is not installed: npm install --prefix tools/compare/.deps js-yaml@4'); return { errors, warnings, pack: null }; }
  if (!str(text) || Buffer.byteLength(text) > MAX_PACK_BYTES) { err('pack', `is empty or larger than ${MAX_PACK_BYTES / 1024} KB`); return { errors, warnings, pack: null }; }
  let pack;
  try { pack = yaml.load(text, { schema: yaml.CORE_SCHEMA }); }
  catch (e) { err('pack', `is not valid YAML: ${String(e.message).split('\n')[0]}`); return { errors, warnings, pack: null }; }
  if (!isObj(pack)) { err('pack', 'must be a YAML mapping at the top level'); return { errors, warnings, pack: null }; }

  // Aliases would let a small file expand into a huge one; shared objects after parsing mean an alias was used.
  const seen = new Set(); let nodes = 0, shared = false;
  (function walk(x, depth) {
    if (++nodes > 20000 || depth > 12) { shared = true; return; }
    if (x && typeof x === 'object') { if (seen.has(x)) { shared = true; return; } seen.add(x); for (const v of Object.values(x)) walk(v, depth + 1); }
  })(pack, 0);
  if (shared) { err('pack', 'uses YAML anchors/aliases, is nested too deeply, or has too many nodes; write every value out in full'); return { errors, warnings, pack: null }; }

  for (const k of Object.keys(pack)) if (!TOP_KEYS.includes(k)) err(k, `is not a known top-level key (allowed: ${TOP_KEYS.join(', ')})`);
  if (pack.pack_version !== PACK_VERSION) err('pack_version', `must be ${PACK_VERSION}`);

  const plain = (at, v, min, max, { required = true } = {}) => {
    if (v === undefined || v === null) { if (required) err(at, 'is required'); return false; }
    if (!str(v)) { err(at, 'must be text'); return false; }
    if (v.trim().length < min || v.length > max) { err(at, `must be ${min} to ${max} characters`); return false; }
    if (/<[A-Za-z\/!?]/.test(v)) { err(at, 'may not contain HTML-like tags (plain text only; write < as "less than" or leave a space after it)'); return false; }
    if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v)) { err(at, 'contains control characters'); return false; }
    return true;
  };
  const urlOk = (at, u, level) => {
    let url; try { url = new URL(u); } catch { (level === 'error' ? err : warn)(at, `"${u}" is not a valid URL`); return false; }
    if (url.protocol !== 'https:' || !URL_HOSTS.has(url.hostname)) { (level === 'error' ? err : warn)(at, `${u} is not an https drupal.org, git.drupalcode.org or api.drupal.org URL`); return false; }
    return true;
  };

  // issue
  const issue = pack.issue; let nid = '';
  if (!isObj(issue)) err('issue', 'is required');
  else {
    nid = String(issue.nid ?? '');
    if (!/^\d{5,8}$/.test(nid)) err('issue.nid', 'must be the 5 to 8 digit Drupal.org issue number');
    plain('issue.title', issue.title, 5, 200);
    if (issue.url !== `https://www.drupal.org/project/drupal/issues/${nid}`) err('issue.url', `must be exactly https://www.drupal.org/project/drupal/issues/${nid}`);
    if (!str(issue.fork_branch) || !/^[A-Za-z0-9][A-Za-z0-9._\/-]{0,120}$/.test(issue.fork_branch)) err('issue.fork_branch', 'must be the issue fork branch name (letters, digits, . _ / -)');
    else if (nid && !issue.fork_branch.startsWith(`${nid}-`)) warn('issue.fork_branch', `does not start with "${nid}-"; check it against the merge request's source branch`);
    if (issue.merge_request !== undefined && !/^!\d+$/.test(String(issue.merge_request))) err('issue.merge_request', 'must look like !12345');
    for (const k of Object.keys(issue)) if (!['nid', 'title', 'url', 'fork_branch', 'merge_request'].includes(k)) err(`issue.${k}`, 'is not a known key');
  }

  // sources and summary
  if (!Array.isArray(pack.sources) || pack.sources.length < 1 || pack.sources.length > 30) err('sources', 'must list 1 to 30 sources you used (issue page, merge request, change records)');
  else pack.sources.forEach((s, i) => {
    if (!isObj(s)) return err(`sources[${i}]`, 'must have url and note');
    urlOk(`sources[${i}].url`, s.url, 'warn'); plain(`sources[${i}].note`, s.note, 3, 300);
    if (s.date !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(String(s.date))) err(`sources[${i}].date`, 'must be YYYY-MM-DD');
  });
  plain('summary', pack.summary, 50, 6000);
  plain('notes', pack.notes, 0, 4000, { required: false });

  // review: a pack is always a draft until a person has confirmed it
  const rv = pack.review;
  if (!isObj(rv)) err('review', 'is required');
  else {
    if (rv.status !== 'draft') err('review.status', 'must be "draft": steps and checks written without running the lab are unconfirmed; a person changes it later');
    plain('review.generated_by', rv.generated_by, 3, 200);
    if (!Array.isArray(rv.unverified) || rv.unverified.length < 1) err('review.unverified', 'must list at least one thing you could not verify (for example whether a probe selector exists)');
    else rv.unverified.forEach((u, i) => plain(`review.unverified[${i}]`, u, 3, 300));
  }

  // setup (building blocks from the catalogue, preferred) or recipe (hand-written files, for people who know the configuration)
  const hasSetup = pack.setup !== undefined;
  let setupUsed = null;
  if (hasSetup && pack.recipe !== undefined) err('setup', 'use either setup (building blocks) or recipe (hand-written files), not both');
  else if (hasSetup) {
    const cat = catalogue || loadCatalogue(yaml);
    if (cat.problems.length) err('setup', `the building-block catalogue in this repository is broken: ${cat.problems[0]}`);
    else {
      const sv = validateSetup(pack.setup, cat);
      for (const e of sv.errors) errors.push(e);
      if (!sv.errors.length) {
        try {
          const ex = expandSetup(sv.entries, cat, { nid: nid || 'unknown', title: str(pack.issue && pack.issue.title) ? pack.issue.title : 'issue' }, yaml);
          pack.recipe = { name: `repro_${nid}`, files: ex.files }; setupUsed = ex.used;
        } catch (e) { err('setup', e.message); }
      }
    }
  }
  if (pack.needs !== undefined) {
    if (!Array.isArray(pack.needs) || pack.needs.length > 10) err('needs', 'must be a list of at most 10 entries, each with block and why');
    else pack.needs.forEach((n, i) => {
      const at = `needs[${i}]`;
      if (!isObj(n) || Object.keys(n).some((k) => !['block', 'why'].includes(k))) return err(at, 'must have block and why, and nothing else');
      if (!str(n.block) || !/^[a-z][a-z0-9_]{0,40}$/.test(n.block)) err(`${at}.block`, 'must be a lowercase name for the building block you wish existed');
      plain(`${at}.why`, n.why, 3, 300);
      if (str(n.block) && (catalogue || loadCatalogue(yaml)).blocks.has(n.block)) warn(at, `${n.block} already exists in the catalogue: use it under setup instead of listing it as a need`);
      else if (str(n.block)) warn(at, `needs a building block that does not exist yet: ${n.block}. The setup is built without it, so the step that relies on it must say the person sets it up by hand; a maintainer can add the block to tools/compare/blocks/`);
    });
  }

  // recipe
  const rc = pack.recipe;
  if (!isObj(rc)) { if (!hasSetup) err('setup', 'is required: list the building blocks the steps need under setup (or, if you know the Drupal configuration, give recipe files)'); }
  else {
    if (nid && rc.name !== `repro_${nid}`) err('recipe.name', `must be repro_${nid}`);
    if (!isObj(rc.files) || !Object.keys(rc.files).length) err('recipe.files', 'is required and must map file names to their contents');
    else {
      const names = Object.keys(rc.files);
      if (names.length > 20) err('recipe.files', 'has more than 20 files');
      if (!names.includes('recipe.yml')) err('recipe.files', 'must include recipe.yml');
      for (const f of names) {
        const at = `recipe.files.${f}`;
        if (!/^(recipe\.yml|config\/[A-Za-z0-9_.-]+\.yml)$/.test(f)) { err(at, 'file names must be recipe.yml or config/<name>.yml'); continue; }
        const body = rc.files[f];
        if (!str(body) || !body.trim() || body.length > 20000) { err(at, 'must be text of 1 to 20000 characters'); continue; }
        let doc; try { doc = yaml.load(body, { schema: yaml.CORE_SCHEMA }); } catch (e) { err(at, `is not valid YAML: ${String(e.message).split('\n')[0]}`); continue; }
        if (!isObj(doc)) { err(at, 'must be a YAML mapping'); continue; }
        if (f === 'recipe.yml') {
          for (const k of Object.keys(doc)) if (!RECIPE_YML_KEYS.includes(k)) err(`${at}.${k}`, `is not a known recipe key (allowed: ${RECIPE_YML_KEYS.join(', ')})`);
          if (!str(doc.name)) err(`${at}.name`, 'is required');
          for (const r of doc.recipes ?? []) if (!(str(r) && (/^[a-z][a-z0-9_]*$/.test(r) || /^core\/(tests\/fixtures\/)?recipes\/[a-z0-9_]+$/.test(r)))) err(`${at}.recipes`, `"${r}" must be a recipe name in this repo or a core/recipes/... or core/tests/fixtures/recipes/... path`);
          for (const m of doc.install ?? []) if (!(str(m) && /^[a-z][a-z0-9_]*$/.test(m))) err(`${at}.install`, `"${m}" must be a module or theme machine name`);
        }
      }
    }
  }

  // variant
  const v = pack.variant;
  if (!isObj(v)) err('variant', 'is required');
  else {
    for (const k of Object.keys(v)) if (!VARIANT_KEYS.includes(k)) err(`variant.${k}`, `is not a known key (allowed: ${VARIANT_KEYS.join(', ')}); the importer sets slug, core, environments and patches itself`);
    plain('variant.description', v.description, 20, 1500); plain('variant.expected', v.expected, 10, 600); plain('variant.actual', v.actual, 10, 600);
    if (!Array.isArray(v.pages) || v.pages.length < 1 || v.pages.length > 10 || !v.pages.every((p) => str(p) && PATH_RE.test(p) && !p.startsWith('//'))) err('variant.pages', 'must list 1 to 10 site paths such as /node/add/article (no host)');
    if (v.login !== undefined && typeof v.login !== 'boolean') err('variant.login', 'must be true or false');
    if (v.demo !== undefined) {
      if (!isObj(v.demo) || Object.keys(v.demo).some((k) => !['start', 'viewport'].includes(k))) err('variant.demo', 'may only have start and viewport');
      else { if (v.demo.start !== undefined && !(str(v.demo.start) && PATH_RE.test(v.demo.start))) err('variant.demo.start', 'must be a site path'); if (v.demo.viewport !== undefined && v.demo.viewport !== 'narrow') err('variant.demo.viewport', 'may only be "narrow"'); }
    }
    if (!Array.isArray(v.steps) || v.steps.length < 1 || v.steps.length > 30) err('variant.steps', 'must have 1 to 30 steps');
    else {
      v.steps.forEach((s, i) => {
        const at = `variant.steps[${i}]`;
        if (!isObj(s)) return err(at, 'must have text and how');
        plain(`${at}.text`, s.text, 5, 600);
        if (!['recipe', 'mirror', 'each'].includes(s.how)) err(`${at}.how`, 'must be recipe, mirror or each');
        plain(`${at}.lookFor`, s.lookFor, 3, 600, { required: false });
        for (const k of Object.keys(s)) if (!['text', 'how', 'lookFor'].includes(k)) err(`${at}.${k}`, 'is not a known key');
      });
      if (!v.steps.some((s) => s && s.how === 'each')) warn('variant.steps', 'no step has how: each; the step that is the thing being tested should be done by hand in each frame');
    }
    if (Array.isArray(v.checks) && v.checks.length <= 20 && v.checks.some((c) => isObj(c) && c.use !== undefined)) {
      const cc = checkCatalogue || loadChecks(yaml);
      if (cc.problems.length) err('variant.checks', `the check-template catalogue in this repository is broken: ${cc.problems[0]}`);
      else { const ex = expandChecks(v.checks, cc); for (const e of ex.errors) errors.push(e); v.checks = ex.checks; }
    }
    if (!Array.isArray(v.checks) || v.checks.length > 20) err('variant.checks', 'must be a list of at most 20 checks (it may be empty)');
    else {
      v.checks.forEach((c, i) => {
        const at = `variant.checks[${i}]`;
        if (!isObj(c)) return err(at, 'must have label, probe, expect and kind');
        plain(`${at}.label`, c.label, 3, 200);
        for (const p of checkProbe(c.probe)) err(`${at}.probe`, p);
        if (str(c.probe)) {
          const phantom = [...new Set((stripLiterals(c.probe).match(/\b__[A-Za-z0-9_]+/g) || []).filter((g) => !VIEWER_GLOBALS.includes(g)))];
          if (phantom.length) warn(`${at}.probe`, `reads ${phantom.map((g) => `window.${g}`).join(', ')}, which neither Drupal nor the viewer defines, so the probe gives undefined and cannot hold on either side. A probe sees only the page (the DOM) and these viewer values: ${VIEWER_GLOBALS.map((g) => `window.${g}`).join(', ')}. It cannot see network or AJAX responses: check the DOM that the response produces instead (for example an element the change adds)`);
        }
        if (str(c.probe) && c.probe.trim() && !PAGE_ROOTS.test(stripLiterals(c.probe))) warn(`${at}.probe`, 'does not read anything from the page (for example "true"), so it gives the same answer on Before and After and shows nothing. Write a probe that looks at the page, or leave the check out and say why in review.unverified');
        if (!(typeof c.expect === 'boolean' || typeof c.expect === 'number' || (str(c.expect) && c.expect.length <= 100 && !/<[A-Za-z\/!?]/.test(c.expect)))) err(`${at}.expect`, 'must be true, false, a number, short text, or "same"');
        if (!['precondition', 'fix', 'regression'].includes(c.kind)) err(`${at}.kind`, 'must be precondition, fix or regression');
        for (const k of Object.keys(c)) if (!['label', 'probe', 'expect', 'kind'].includes(k)) err(`${at}.${k}`, 'is not a known key');
      });
      if (!v.checks.some((c) => c && c.kind === 'precondition')) warn('variant.checks', 'no precondition check, so a passing result cannot show the setup was reached');
      if (!v.checks.some((c) => c && c.kind === 'fix')) warn('variant.checks', 'no fix check; the result will rest on the manual questions alone');
    }
    {
      const hasFix = Array.isArray(v.checks) && v.checks.some((c) => c && c.kind === 'fix');
      const differs = Array.isArray(v.observe) && v.observe.some((o) => o && typeof o.expectBefore === 'boolean' && o.expectBefore !== o.expectAfter);
      if (Array.isArray(v.checks) && Array.isArray(v.observe) && !hasFix && !differs) warn('variant', 'nothing in this pack can tell Before from After: there is no fix check, and every manual question expects the same answer on both sides. Add a fix check, or a question whose expected answer differs between Before and After, based only on what the issue reports');
    }
    if (!Array.isArray(v.observe) || v.observe.length > 12) err('variant.observe', 'must be a list of at most 12 manual questions');
    else v.observe.forEach((o, i) => {
      const at = `variant.observe[${i}]`;
      if (!isObj(o)) return err(at, 'must have label, expectBefore and expectAfter');
      plain(`${at}.label`, o.label, 3, 200);
      if (typeof o.expectBefore !== 'boolean' || typeof o.expectAfter !== 'boolean') err(at, 'expectBefore and expectAfter must be true or false');
      for (const k of Object.keys(o)) if (!['label', 'expectBefore', 'expectAfter'].includes(k)) err(`${at}.${k}`, 'is not a known key');
    });
  }

  // The steps must not rely on state the recipe never creates. A common failure: a step says "a file over the configured limit" while the recipe
  // only applies stock recipes, so nothing sets a limit and a tester cannot follow the step. Heuristic, so a warning; any config in the recipe,
  // or an unverified item that mentions the recipe or the setting, silences it.
  if (isObj(pack.variant) && isObj(pack.recipe) && isObj(pack.recipe.files) && Array.isArray(pack.variant.steps)) {
    const recipeDoc = (() => { try { const d = yaml.load(pack.recipe.files['recipe.yml'] || '', { schema: yaml.CORE_SCHEMA }); return isObj(d) ? d : {}; } catch { return {}; } })();
    const setsConfig = recipeDoc.config !== undefined || Object.keys(pack.recipe.files).some((f) => f.startsWith('config/'));
    const acknowledged = Array.isArray(pack.review && pack.review.unverified) && pack.review.unverified.some((u) => /recipe|limit|setting|config/i.test(String(u)));
    if (!setsConfig && !acknowledged) {
      const STATE = /\b(configured|configuration|limit|maximum|threshold|setting|settings)\b/i;
      const texts = [...pack.variant.steps.flatMap((x, i) => (isObj(x) ? [[`variant.steps[${i}].text`, x.text], [`variant.steps[${i}].lookFor`, x.lookFor]] : [])), ['variant.description', pack.variant.description]];
      for (const [at, t] of texts) {
        const m = str(t) && t.match(STATE);
        if (m) { warn(at, `mentions "${m[1]}", but the recipe sets no configuration (it only applies stock recipes). Add the configuration to the recipe, or say in review.unverified that the person must set it up by hand`); break; }
      }
    }
  }

  // The lab's Standard install of current core does not create the Article content type (both 3415961 and 3618230 failed to apply a recipe until
  // core/tests/fixtures/recipes/article_content_type was added), so a pack that visits /node/add/article must create it.
  if (isObj(pack.variant) && isObj(pack.recipe) && isObj(pack.recipe.files)) {
    const v2 = pack.variant, doc2 = (() => { try { const d = yaml.load(pack.recipe.files['recipe.yml'] || '', { schema: yaml.CORE_SCHEMA }); return isObj(d) ? d : {}; } catch { return {}; } })();
    const mentions = [...(Array.isArray(v2.pages) ? v2.pages : []), v2.demo && v2.demo.start, ...(Array.isArray(v2.steps) ? v2.steps.map((x) => x && x.text) : [])].some((t) => str(t) && /\/node\/add\/article\b/.test(t));
    const creates = (Array.isArray(doc2.recipes) ? doc2.recipes : []).some((r) => /article_content_type/.test(String(r))) || Object.keys(pack.recipe.files).some((f) => /node\.type\.article\.yml$/.test(f));
    if (mentions && !creates) warn('recipe.files.recipe.yml', 'the pack uses /node/add/article but the recipe does not create the Article content type, which the lab\'s Standard install of current core does not have: add core/tests/fixtures/recipes/article_content_type under recipes:');
  }

  // Secrets anywhere, and URLs in the parts the lab acts on (recipe and variant; summary and notes only warn).
  (function scan(x, at) {
    if (str(x)) {
      if (SECRET_RES.some((re) => re.test(x))) err(at, 'looks like it contains a secret, key or token; remove it');
      const inActive = at.startsWith('recipe') || at.startsWith('variant');
      for (const u of x.match(/https?:\/\/[^\s)"'>\]]+/g) || []) urlOk(at, u, inActive ? 'error' : 'warn');
    } else if (Array.isArray(x)) x.forEach((val, i) => scan(val, `${at}[${i}]`));
    else if (x && typeof x === 'object') for (const [k, val] of Object.entries(x)) scan(val, at ? `${at}.${k}` : k);
  })(pack, '');

  return { errors, warnings, pack, setupUsed };
}

// ---- a message to paste back into the chat: what to fix, in the validator's own words, with what to do about each ----
const HINTS = [
  [/not a building block in the catalogue/, 'Use only blocks from the SETUP CATALOGUE in the prompt, with their exact names. If the scenario needs something else, list it under needs and write the step as "set X by hand".'],
  [/is not a parameter of|is not valid: /, 'Use only the parameters the catalogue lists for that block, with values in the shown form.'],
  [/not both/, 'Remove the recipe section and describe the setup under setup, using catalogue blocks.'],
  [/recipe sets no configuration/, 'Either (a) add the configuration to the recipe so the setup really exists (only if you know the correct Drupal config: do not invent config keys), or (b) change the step to say the person sets it up by hand, and name it in review.unverified.'],
  [/does not create the Article content type/, 'Add core/tests/fixtures/recipes/article_content_type to the recipes: list in recipe.yml (or tell the person to supply the recipe).'],
  [/which neither Drupal nor the viewer defines/, 'Replace the probe with one that reads the DOM, for example whether an element the change adds exists after the action (document.querySelector(...) !== null). Do not read network responses or any window.__ name except the four the viewer provides.'],
  [/does not read anything from the page/, 'Replace it with a probe that looks at the page (it must name document, window or Drupal), or remove the check and say why in review.unverified.'],
  [/nothing in this pack can tell Before from After/, 'Add a fix check that compares something the change adds or alters, or a manual question whose expected answer differs between Before and After and comes only from what the issue reports.'],
  [/no fix check/, 'Add one fix check that compares something the change adds or alters (an element, an attribute or an announcement) and is false on Before and true on After; if you cannot know one, say why in review.unverified.'],
  [/no precondition check/, 'Add a precondition check that must hold on both sides, so a passing result means the setup was reached.'],
  [/HTML-like tags/, 'Rewrite it in plain words. Do not write angle brackets around tag names, not even inside backticks (for example write "a div with the class x").'],
  [/anchors\/aliases/, 'Write every value out in full: no YAML anchors or aliases.'],
  [/not valid YAML/, 'Fix the YAML syntax. Put every one-line text value in double quotes and use | for multi-line text.'],
  [/review\.unverified/, 'List at least one thing you could not verify.'],
];

export function repairMessage({ errors = [], warnings = [] }, { recipeFiles = null } = {}) {
  const items = [...errors.map((e) => ({ kind: 'error', ...e })), ...warnings.map((w) => ({ kind: 'warning', ...w }))];
  if (!items.length) return '';
  const lines = [`${errors.length ? 'Your issue pack did not pass the validator.' : 'Your issue pack passed the validator, with warnings.'} Fix ONLY these problems, keep everything else exactly as it was, and send the complete corrected file again:`, ''];
  items.forEach((it, i) => {
    lines.push(`${i + 1}. [${it.kind}] ${it.at}: ${it.msg}`);
    const hint = HINTS.find(([re]) => re.test(it.msg));
    if (hint) lines.push(`   What to do: ${hint[1]}`);
  });
  if (recipeFiles && Object.keys(recipeFiles).length) {
    lines.push('', 'Use exactly these recipe files in recipe.files (replace the current ones). The person supplies these files and says they build on current Drupal core; you have not checked them. Copy them exactly, then make the recipe description and the first step say what they add, and add to review.unverified that the recipe config was supplied by the person:');
    for (const [name, body] of Object.entries(recipeFiles)) lines.push('', `--- ${name}`, body.trimEnd());
    lines.push('', '--- end of recipe files');
  }
  return lines.join('\n');
}

// Read a recipe folder the person supplies: recipe.yml and config/*.yml only, small files only.
export function readRecipeDir(dir) {
  const files = {}; const rd = (rel) => { const p = path.join(dir, rel); const t = fs.readFileSync(p, 'utf8'); if (t.length > 20000) throw new Error(`${rel} is larger than 20000 characters`); files[rel] = t; };
  if (!fs.existsSync(path.join(dir, 'recipe.yml'))) throw new Error(`${dir} has no recipe.yml`);
  rd('recipe.yml');
  const cfg = path.join(dir, 'config');
  if (fs.existsSync(cfg)) for (const f of fs.readdirSync(cfg).sort()) if (/^[A-Za-z0-9_.-]+\.yml$/.test(f)) rd(`config/${f}`);
  return files;
}

// Replace the pack's recipe files with a folder the person trusts, and record that in review.unverified. Used by --recipe on validate and import:
// a chat assistant cannot know Drupal configuration, so the person supplies the recipe and the assistant keeps the narrative, steps and checks.
// Returns the new pack text, or the original text unchanged if it is not YAML the validator can read (the validator will then report that).
export function graftRecipe(text, yaml, files, dirLabel) {
  let doc; try { doc = yaml.load(text, { schema: yaml.CORE_SCHEMA }); } catch { return text; }
  if (!isObj(doc)) return text;
  const nid = isObj(doc.issue) && doc.issue.nid !== undefined ? String(doc.issue.nid) : '';
  delete doc.setup;
  doc.recipe = { name: (isObj(doc.recipe) && doc.recipe.name) || `repro_${nid}`, files };
  if (!isObj(doc.review)) doc.review = { status: 'draft', generated_by: 'unknown', unverified: [] };
  if (!Array.isArray(doc.review.unverified)) doc.review.unverified = [];
  doc.review.unverified.push(`The recipe files were supplied by the person (from ${dirLabel}) and replace the assistant's own; the assistant did not write or check them, and the steps may describe them imperfectly`);
  return `# The recipe in this pack was replaced by issue-pack.mjs --recipe ${dirLabel}\n${yaml.dump(doc, { lineWidth: -1, noRefs: true })}`;
}

