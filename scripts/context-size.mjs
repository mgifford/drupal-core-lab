// What does a session start with, as the client itself counts it? Runs Claude Code's local `/context` command in print mode (it
// answers from the client's own accounting; no model is called) and prints the categories and the memory files compactly.
//   node scripts/context-size.mjs [--json <file>]
// Measures the command-line client in this checkout. A desktop-app session starts with more (the app's own tool and server
// instructions are not in this number), so use it for before/after comparisons of what the repository and the owner's config add,
// not as the first-call size of a desktop session (that is `firstCtx` in `node scripts/session-usage.mjs`).
// The tool-schema categories marked "(deferred)" are not part of the starting total the client reports.
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { labRoot } from '../tools/compare/lib.mjs';

const jsonOut = process.argv.includes('--json') ? process.argv[process.argv.indexOf('--json') + 1] : null;
const r = spawnSync('claude', ['-p', '/context', '--no-session-persistence', '--output-format', 'text'], { cwd: labRoot, encoding: 'utf8', timeout: 120000 });
if (r.error || r.status !== 0 || !/Estimated usage by category/.test(r.stdout || '')) { console.error(`Could not read /context from the claude command${r.error ? `: ${r.error.message}` : ''}. ${String(r.stderr || r.stdout || '').trim().split('\n')[0]}`); process.exit(3); }
const tok = (s) => (/k$/.test(s) ? Math.round(parseFloat(s) * 1000) : Number(s));
const text = r.stdout, section = (name) => { const i = text.indexOf(`### ${name}`); if (i < 0) return ''; const j = text.indexOf('\n### ', i + 5); return text.slice(i, j < 0 ? undefined : j); };
const rows = (s) => [...s.matchAll(/^\| (.+?) \| ([\d.]+k?) \|(?: [\d.]+% \|)?$/gm)].map((m) => [m[1].trim(), tok(m[2])]);
const categories = rows(section('Estimated usage by category')).filter(([n]) => !/^Category$/.test(n));
const memory = [...section('Memory Files').matchAll(/^\| (\w+) \| (.+?) \| ([\d.]+k?) \|$/gm)].map((m) => ({ type: m[1], path: m[2].replace(labRoot, '.').replace(process.env.HOME || '~', '~'), tokens: tok(m[3]) }));
const model = (text.match(/\*\*Model:\*\* (\S+)/) || [])[1], total = tok((text.match(/\*\*Tokens:\*\* ([\d.]+k?)/) || [])[1] || '0');
console.log(`Starting context (client's own count, command-line client, model ${model}): ${total} tokens`);
for (const [n, t] of categories) if (!/Free space|Autocompact/.test(n)) console.log(`${String(t).padStart(7)}  ${n}`);
console.log('Memory files:'); for (const m of memory) console.log(`${String(m.tokens).padStart(7)}  ${m.path}`);
if (jsonOut) { fs.writeFileSync(jsonOut, `${JSON.stringify({ measured: new Date().toISOString().slice(0, 10), client: 'claude (print mode, /context)', model, total, categories: Object.fromEntries(categories), memory }, null, 1)}\n`); console.log(`Wrote ${jsonOut}`); }
