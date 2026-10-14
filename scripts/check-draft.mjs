// Check a drupal.org comment draft against Drupal core's rules for LLM-assisted prose (core's AGENTS.md, "Operator Rules for
// LLM Tools", read 2026-10-14) and this owner's style rules. It checks form only; whether each sentence is true is checked
// against EVIDENCE.md by a person.
//   node scripts/check-draft.mjs <nid | path to a draft>
// HTML comments (<!-- -->) are notes to the reviewer and are not counted. Exit 1 when a rule is broken.
import fs from 'node:fs';
import path from 'node:path';
import { labRoot } from '../tools/compare/lib.mjs';

const arg = process.argv[2];
if (!arg) { console.error('usage: node scripts/check-draft.mjs <nid | draft.md>'); process.exit(2); }
const file = /^\d{5,8}$/.test(arg) ? path.join(labRoot, 'reports/issues', arg, 'ISSUE-COMMENT-DRAFT.md') : path.resolve(arg);
if (!fs.existsSync(file)) { console.error(`No such draft: ${file}`); process.exit(2); }
const DISCLOSURE = 'Generated with the help of an LLM.';
const text = fs.readFileSync(file, 'utf8').replace(/<!--[\s\S]*?-->/g, '').trim();
const body = text.replace(DISCLOSURE, '').trim();
const plain = body.replace(/https?:\/\/\S+/g, 'URL').replace(/`[^`]*`/g, 'CODE');
const words = (s) => (s.match(/[\p{L}\p{N}][\p{L}\p{N}'’_.:/-]*/gu) || []).length;
const problems = [];
const lines = text.split('\n').filter((l) => l.trim());
if (lines[lines.length - 1].trim() !== DISCLOSURE) problems.push(`the last line must be exactly "${DISCLOSURE}"`);
const n = words(plain);
if (n > 180) problems.push(`${n} words; the limit is 180`);
if (/^\s{0,3}#{1,6}\s/m.test(body)) problems.push('has a Markdown header; comments under 180 words have none');
for (const s of plain.split(/(?<=[.!?])\s+|\n+/).map((x) => x.trim()).filter(Boolean)) if (words(s) > 25) problems.push(`sentence of ${words(s)} words (limit 25): "${s.slice(0, 80)}…"`);
const FLOURISH = ['robust', 'seamless', 'seamlessly', 'comprehensive', 'leverage', 'leverages', 'underscore', 'underscores', 'streamline', 'streamlines', 'foster', 'fosters', 'harness', 'harnesses'];
for (const w of FLOURISH) if (new RegExp(`\\b${w}\\b`, 'i').test(plain)) problems.push(`uses "${w}" (listed as an editorial flourish)`);
for (const [re, what] of [[/\bwhether\b[^.]*\bor\b/i, '"whether X or Y"'], [/\brather than\b/i, '"X rather than Y"'], [/\bI believe\b/i, '"I believe"'], [/\bnot only\b[^.]*\bbut also\b/i, '"not only X but also Y"']]) if (re.test(plain)) problems.push(`uses the formula phrasing ${what}`);
for (const re of [/\b(Claude|Anthropic|ChatGPT|OpenAI|GPT-?\d|Gemini|Copilot|Opus|Sonnet|Haiku)\b/]) { const m = plain.match(re); if (m) problems.push(`names a tool or model ("${m[1]}"); the disclosure line is the only mention allowed`); }
if (/[—]/.test(body)) problems.push('has an em dash');
if (/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(body)) problems.push('has an emoji');
if (/<[A-Z][A-Z _-]*>|<[a-z][a-z ,]*>/.test(body.replace(/`[^`]*`/g, ''))) problems.push('still has a <placeholder> from the template');
console.log(`${path.relative(labRoot, file)}: ${n} words, ${problems.length ? `${problems.length} problem(s)` : 'follows the rules'}`);
for (const p of problems) console.log(`  - ${p}`);
if (!problems.length) console.log('  Form only: check every sentence against EVIDENCE.md, and rewrite it in your own words before posting.');
process.exit(problems.length ? 1 : 0);
