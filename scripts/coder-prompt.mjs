// Generate a Coder handoff from one shared template and a resolved Lab variant.
// No network, Docker or DDEV required. Default: stdout; --write: canonical issue file; --check: compare only.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { labRoot, variants } from '../tools/compare/lib.mjs';
import { PROJECT_NAMES, PROXY_PROJECTS } from '../tools/compare/cloud/config.mjs';

export function renderPrompt(v, root = labRoot) {
  if (!/^\d{5,8}$/.test(String(v.issue)) || !/^[a-zA-Z0-9_-]+$/.test(v.slug || '')) throw new Error('Variant needs a valid issue and slug.');
  if (!v.before?.env || !v.after?.env || !v.steps?.length || !v.expected || !v.actual) throw new Error(`${v.slug}: missing environments, scenario steps or expected/actual outcomes.`);
  if (!v.after.patches?.length) throw new Error(`${v.slug}: no After patch stack; capture and register the change first.`);
  const file = (relative) => {
    const absolute = path.resolve(root, relative);
    if (!absolute.startsWith(path.resolve(root) + path.sep) || !fs.statSync(absolute).isFile()) throw new Error(`Missing or invalid source file: ${relative}`);
    return fs.readFileSync(absolute);
  };
  const patches = ['before', 'after'].map((side) => {
    const stack = v[side].patches || [];
    return `**${side === 'before' ? 'Before' : 'After'} (application order):**\n\n` + (stack.length ? stack.map((p, i) =>
      `${i + 1}. \`${p}\`\n   SHA-256: \`${createHash('sha256').update(file(p)).digest('hex')}\``).join('\n') : 'None: pristine upstream code.');
  }).join('\n\n');
  if (v.recipe) file(`recipes/${v.recipe}/recipe.yml`);
  const scenario = [
    v.description || '',
    `Start page: \`${v.demo?.start || v.pages?.[0] || '/'}\`.`,
    ...v.steps.map((s, i) => `${i + 1}. **${s.how || 'each'}:** ${s.text}${s.lookFor ? `\n   Observe: ${s.lookFor}` : ''}`),
    `**Expected:** ${v.expected}`,
    `**Reported Before behaviour (verify on this run):** ${v.actual}`,
    '### Viewer checks\n\n' + ((v.checks || []).map((c) => `- **${c.kind}:** ${c.label}`).join('\n') || 'No scripted checks declared. Record manual observations.'),
    '### Manual observations\n\n' + ((v.observe || []).map((o) => `- ${o.label}\n  Before: ${JSON.stringify(o.expectBefore)}; After: ${JSON.stringify(o.expectAfter)}.`).join('\n') || 'No manual questions declared. Complete the scenario before treating this handoff as ready for testing.'),
  ].filter(Boolean).join('\n\n');
  const fields = {
    ISSUE: v.issue, SLUG: v.slug, LABEL: v.label || '', PROJECT_NAMES,
    VIEWER_PROJECT: PROXY_PROJECTS.find((p) => p.role === 'viewer').name,
    BEFORE_ENV: v.before.env, AFTER_ENV: v.after.env,
    CORE: v.core?.commit ? `pinned commit \`${v.core.commit}\`` : `moving ref \`${v.core?.ref || 'main'}\`; record the resolved commit at build time`,
    RECIPE: v.recipe ? `\`recipes/${v.recipe}/recipe.yml\` on both sides; the Lab also runs its optional \`apply.sh\`.` : 'plain Standard installation; no issue-specific recipe. Verify every scenario precondition on both sides.',
    PATCHES: patches, SCENARIO: scenario,
  };
  return file('prompts/coder-prompt.md').toString().replace(/\{\{([A-Z_]+)\}\}/g, (_, key) => {
    if (!(key in fields)) throw new Error(`Unknown template field: ${key}`);
    return String(fields[key]);
  });
}

export function main(args) {
  const [slug, mode] = args;
  if (!slug || args.length > 2 || (mode && !['--write', '--check'].includes(mode))) throw new Error('Usage: node scripts/coder-prompt.mjs <slug> [--write|--check]');
  const v = variants().find((x) => x.slug === slug);
  if (!v) throw new Error(`Unknown variant: ${slug}. Register it before generating a Coder prompt.`);
  const content = renderPrompt(v);
  const output = path.join(labRoot, 'reports/issues', String(v.issue), 'CODER-PROMPT.md');
  if (mode === '--check') {
    if (!fs.existsSync(output) || fs.readFileSync(output, 'utf8') !== content) throw new Error(`Missing or stale prompt. Run: node scripts/coder-prompt.mjs ${slug} --write`);
    console.log(`${path.relative(labRoot, output)} is current.`);
  } else if (mode === '--write') {
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, content);
    console.log(`Wrote ${path.relative(labRoot, output)} for ${slug}.`);
  } else process.stdout.write(content);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { main(process.argv.slice(2)); } catch (e) { console.error(e.message); process.exitCode = 1; }
}
