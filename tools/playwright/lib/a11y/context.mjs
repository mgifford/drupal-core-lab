// Where a checkpoint came from: which Lab environment, variant and side the page in the browser belongs to, at which
// commit and with which patches. The agent supplies none of this: it is read from the page's own URL and the Lab's
// registered environments, so a finding cannot claim a provenance the run did not have.
//
// Security boundary (docs/DYNAMIC-A11Y-CHECKPOINTS.md):
//   - only hosts of environments under envs/ (DDEV) and loopback fixture origins are accepted;
//   - anything else is refused, and the refusal is recorded;
//   - production sites are never scanned, and there is no allow-any-host setting.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { labRoot, variants as resolveAllVariants, envDir } from '../../../compare/lib.mjs';
import { sideState } from '../../../compare/contrib-state.mjs';
import { sanitisePath } from '../../../observability/sanitize.mjs';

const LOOPBACK = new Set(['127.0.0.1', 'localhost', '::1', '[::1]']);

// Hostnames of the Lab's built environments, read from each envs/<name>/.ddev/config.yaml. Cheap and side-effect free:
// no `ddev describe` call per checkpoint (that takes seconds and needs Docker running).
export function loadEnvHosts(root = labRoot) {
  const dir = path.join(root, 'envs');
  const map = new Map();   // host -> env name
  if (!fs.existsSync(dir)) return map;
  for (const name of fs.readdirSync(dir).sort()) {
    const cfg = path.join(dir, name, '.ddev', 'config.yaml');
    if (!fs.existsSync(cfg)) continue;
    let project = null;
    const extra = [];
    for (const line of fs.readFileSync(cfg, 'utf8').split('\n')) {
      const nameHit = /^name:\s*(\S+)\s*$/.exec(line);
      if (nameHit) project = nameHit[1].replace(/^["']|["']$/g, '');
      const item = /^\s*-\s*([a-z0-9.-]+\.ddev\.site)\s*$/i.exec(line);
      if (item) extra.push(item[1]);
    }
    const hosts = new Set();
    if (project) hosts.add(`${project}.ddev.site`);
    for (const h of extra) hosts.add(h);
    for (const h of hosts) if (!map.has(h.toLowerCase())) map.set(h.toLowerCase(), name);
  }
  return map;
}

const gitHead = (env) => {
  try { return execFileSync('git', ['-C', envDir(env), 'log', '-1', '--format=%h %cs'], { encoding: 'utf8' }).trim(); } catch { return 'unknown'; }
};

// Patch content state per environment, cached: hashing a core checkout on every checkpoint is wasteful and the files do
// not change during a session. A failure is recorded, never guessed.
const sideStateCache = new Map();
function sideStateFor(env, variant, side) {
  const key = `${env}\t${side}`;
  if (sideStateCache.has(key)) return sideStateCache.get(key);
  let value;
  try {
    const spec = variant?.[side] || {};
    value = sideState(envDir(env), labRoot, spec.patches || [], { modules: variant?.contrib || [], patches: spec.contribPatches || [] });
  } catch (error) {
    value = { state: 'unknown', recorded: null, current: [], reasons: [String(error.message).split('\n')[0].slice(0, 200)], outside: [] };
  }
  sideStateCache.set(key, value);
  return value;
}

export function resetContextCache() { sideStateCache.clear(); }

// The registered variant(s) a page's host belongs to, and on which side.
export function variantsForEnv(env, allVariants = resolveAllVariants()) {
  const hits = [];
  for (const v of allVariants) {
    if (v.before?.env === env) hits.push({ variant: v, side: 'before' });
    if (v.after?.env === env) hits.push({ variant: v, side: 'after' });
  }
  return hits;
}

function pagePathOf(url) {
  const parsed = typeof url === 'string' ? new URL(url) : url;
  return { origin: parsed.origin, host: parsed.hostname.toLowerCase(), path: sanitisePath(parsed.pathname), queryNames: [...new Set(parsed.searchParams.keys())].sort(), hash: parsed.hash ? '[present]' : null };
}

// Resolve a page URL to a run context. hint = { variant, scenario } from the session manifest or the checkpoint request.
// Returns { allowed, reason, kind, env, side, variant, page, core, patches, candidates }.
export function resolvePageContext(url, { hint = {}, allVariants, envHosts } = {}) {
  let parsed;
  try { parsed = new URL(String(url)); } catch { return { allowed: false, reason: 'not a URL', kind: 'invalid' }; }
  if (!/^https?:$/.test(parsed.protocol)) return { allowed: false, reason: `unsupported protocol ${parsed.protocol}`, kind: 'invalid' };
  const page = pagePathOf(parsed);
  if (LOOPBACK.has(page.host)) {
    return {
      allowed: true,
      kind: 'local-fixture',
      reason: 'loopback fixture origin: local test page, no Lab environment',
      env: null, side: null, variant: null, issue: null, page,
      core: { commit: null, patches: [] },
      origin: page.origin,
    };
  }
  const hosts = envHosts || loadEnvHosts();
  const env = hosts.get(page.host);
  if (!env) {
    return {
      allowed: false,
      kind: 'not-a-lab-environment',
      reason: `${page.host} is not a registered Lab environment hostname or a loopback fixture. This integration only scans Lab environments under envs/ and local fixtures; it never scans other sites.`,
      page,
    };
  }
  const hits = variantsForEnv(env, allVariants || resolveAllVariants());
  if (!hits.length) {
    return { allowed: true, kind: 'environment-without-variant', reason: `${env} has no registered variant; provenance is the environment and commit only`, env, side: null, variant: null, issue: null, page, core: { commit: gitHead(env), patches: [] } };
  }
  let chosen = hits[0];
  if (hint.variant) {
    const match = hits.find((h) => h.variant.slug === hint.variant);
    if (match) chosen = match;
    else return { allowed: false, kind: 'variant-mismatch', reason: `the session names variant ${hint.variant}, but ${page.host} is ${env} and belongs to ${hits.map((h) => `${h.variant.slug} (${h.side})`).join(', ')}`, page };
  } else if (hits.length > 1 && hits.some((h) => h.variant.slug !== hits[0].variant.slug)) {
    // More than one registered variant shares this environment (for example a pinned and a latest pair built from one checkout).
    // Without a hint the provenance would be a guess, so the checkpoint says which candidates exist instead of picking one.
    const distinct = [...new Set(hits.map((h) => h.variant.slug))];
    if (distinct.length > 1) {
      return {
        allowed: false,
        kind: 'ambiguous-variant',
        reason: `${env} is used by several variants (${hits.map((h) => `${h.variant.slug} ${h.side}`).join(', ')}). Start the session with one, or pass it in the checkpoint request: node tools/a11y-mcp/cli.mjs session --variant <slug>.`,
        candidates: hits.map((h) => ({ slug: h.variant.slug, side: h.side, issue: h.variant.issue })),
        env, page, core: { commit: gitHead(env), patches: [] },
      };
    }
  }
  const { variant, side } = chosen;
  const patches = sideStateFor(env, variant, side);
  return {
    allowed: true,
    kind: 'lab-variant',
    reason: `${env} is the ${side} side of ${variant.slug}`,
    env, side, variant: variant.slug, issue: String(variant.issue ?? '') || null,
    page,
    core: {
      commit: gitHead(env),
      base: variant.core?.commit || null,
      patches: (variant[side]?.patches || []).map((p) => ({ path: p })),
    },
    patchState: { state: patches.state, reasons: patches.reasons, outside: patches.outside, current: patches.current },
    candidates: hits.map((h) => ({ slug: h.variant.slug, side: h.side, issue: h.variant.issue })),
    variantSpec: { slug: variant.slug, issue: variant.issue, label: variant.label, reports: variant.reports || null, coverage: variant.coverage || null },
  };
}

// The browser facts a checkpoint records, read from the page itself rather than assumed from configuration. The page
// reports the preferences it actually matches; that is evidence, not the intent of whoever launched the browser.
export async function readEnvironment(page) {
  const browser = page.context().browser();
  const media = await page.evaluate(() => {
    const m = (q) => { try { return matchMedia(q).matches; } catch { return null; } };
    return {
      colorScheme: m('(prefers-color-scheme: dark)') ? 'dark' : m('(prefers-color-scheme: light)') ? 'light' : 'no-preference',
      forcedColors: m('(forced-colors: active)') ? 'active' : 'none',
      reducedMotion: m('(prefers-reduced-motion: reduce)') ? 'reduce' : 'no-preference',
      contrast: m('(prefers-contrast: more)') ? 'more' : m('(prefers-contrast: less)') ? 'less' : 'no-preference',
      theme: window.drupalSettings?.labActiveTheme ?? window.drupalSettings?.ajaxPageState?.theme ?? null,
      lang: document.documentElement.lang || null,
      dir: document.documentElement.dir || null,
      title: document.title,
    };
  }).catch((error) => ({ error: String(error.message).slice(0, 200) }));
  return {
    browser: browser?.browserType?.().name?.() || 'unknown',
    browserVersion: browser?.version?.() || null,
    os: `${process.platform} ${process.arch}`,
    viewport: page.viewportSize() || null,
    ...media,
    contextId: contextIdFor(page),
  };
}

// A stable identity for the browser context within a session: the same context must look the same at every checkpoint.
const contextIds = new WeakMap();
let nextContextId = 0;
function contextIdFor(page) {
  const ctx = page.context();
  if (!contextIds.has(ctx)) contextIds.set(ctx, `ctx-${++nextContextId}`);
  return contextIds.get(ctx);
}

export { pagePathOf, sanitisePath };
