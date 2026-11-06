// Skill eval files: the deterministic checks that keep every case grounded in its skill, and the parsing a model run depends on.
//   node --test tests/lab/skill-evals.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { validateEvals, skillWarnings, frontmatter, parseJudge, parseTrigger, caseMessages, MIN_CASES } from '../../tools/skill-evals/lib.mjs';

const SKILL = `---\nname: demo-skill\ndescription: Use when demoing things.\n---\n# Demo\nAlways run the preflight before building anything.\nNever push to main without approval.\n`;
function fixture(evals) {
  const dir = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'evals-')), 'demo-skill');
  fs.mkdirSync(path.join(dir, 'evals'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'SKILL.md'), SKILL);
  if (evals) fs.writeFileSync(path.join(dir, 'evals/evals.json'), JSON.stringify(evals));
  return dir;
}
const good = () => ({
  skill: 'demo-skill', version: 1,
  trigger: { should: ['demo a thing for me', 'show a demo please', 'run the demo'], should_not: ['write a poem', 'fix my css', 'add two numbers'] },
  cases: Array.from({ length: MIN_CASES }, (_, i) => ({ id: `case-${i}`, prompt: 'Please build the thing for me right now', expected: ['runs the preflight first', 'does not push'], grounded_in: ['Always run the preflight before building anything.'] })),
});

test('a complete, grounded evals file passes', () => {
  assert.deepEqual(validateEvals(fixture(good()), good()), []);
});

test('a grounded_in string that is not in the skill is caught, whitespace aside', () => {
  const d = good(); d.cases[0].grounded_in = ['Never   push to main\nwithout approval.']; assert.deepEqual(validateEvals(fixture(d), d), []);
  d.cases[1].grounded_in = ['Always deploy on Fridays for fun.']; assert.match(validateEvals(fixture(d), d).join('|'), /case-1: grounded_in not found/);
});

test('too few cases, too few trigger prompts, wrong skill name, duplicate ids and overlapping trigger lists are caught', () => {
  const d = good(); d.cases = d.cases.slice(0, 2); d.trigger.should = ['one']; d.skill = 'other'; d.trigger.should_not.push('one');
  const p = validateEvals(fixture(d), d).join('|');
  for (const re of [/needs at least \d+ cases/, /trigger.should needs/, /expected "demo-skill"/, /in both trigger lists/]) assert.match(p, re);
  const e = good(); e.cases[1].id = 'case-0'; assert.match(validateEvals(fixture(e), e).join('|'), /duplicate id/);
});

test('a case needs assertions and grounding', () => {
  const d = good(); delete d.cases[0].grounded_in; d.cases[1].expected = ['only one']; d.cases[2].id = 'Bad_ID';
  const p = validateEvals(fixture(d), d).join('|');
  assert.match(p, /case-0: needs "grounded_in"/); assert.match(p, /case-1: needs at least 2/); assert.match(p, /"id" must be kebab-case/);
});

test('frontmatter is read, and a mismatched name or missing description is warned about', () => {
  assert.deepEqual(frontmatter(SKILL), { name: 'demo-skill', description: 'Use when demoing things.' });
  const dir = fixture(); assert.deepEqual(skillWarnings(dir), []);
  fs.writeFileSync(path.join(dir, 'SKILL.md'), SKILL.replace('demo-skill', 'other')); assert.match(skillWarnings(dir)[0], /does not match the folder/);
});

test('judge and trigger answers are parsed, and garbage is not mistaken for a verdict', () => {
  assert.deepEqual(parseJudge('Sure. {"met": true, "evidence": "ran preflight"} done'), { met: true, evidence: 'ran preflight' });
  assert.equal(parseJudge('no json here').met, null);
  assert.equal(parseJudge('{"met": "yes"}').met, null);
  assert.deepEqual(parseTrigger('{"skills": ["a", "b"]}'), ['a', 'b']);
  assert.equal(parseTrigger('nothing'), null);
});

test('without the skill there is no system message, with it the skill text is the instructions', () => {
  assert.equal(caseMessages('SKILL TEXT', 'hi', false).length, 1);
  assert.match(caseMessages('SKILL TEXT', 'hi', true)[0].content, /SKILL TEXT/);
});

// The run command against a stub Ollama-style server: the request shape, the judge loop, the trigger check and the results file.
test('run talks to an /api/chat server, marks assertions, and writes a result file', async () => {
  const { createServer } = await import('node:http');
  const { execFile } = await import('node:child_process');
  const seen = [];
  const srv = createServer((req, res) => {
    let b = ''; req.on('data', (c) => { b += c; }); req.on('end', () => {
      const j = JSON.parse(b); seen.push({ url: req.url, j });
      const last = j.messages.at(-1).content;
      const reply = last.startsWith('You grade') ? '{"met": true, "evidence": "stub"}' : last.startsWith('These skills') ? '{"skills": ["drupal-core-lab"]}' : 'stub answer';
      res.setHeader('content-type', 'application/json'); res.end(JSON.stringify({ message: { content: reply } }));
    });
  });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'evals-out-'));
  const out = await new Promise((resolve) => execFile('node', ['scripts/skill-evals.mjs', 'run', 'drupal-core-lab', '--model', 'stub', '--out', outDir, '--endpoint', `http://127.0.0.1:${srv.address().port}`, '--only', 'asks-before-building'], { cwd: path.resolve(import.meta.dirname, '../..') }, (e, so, se) => resolve({ e, so, se })));
  srv.close();
  assert.equal(out.e, null, out.se);
  assert.match(out.so, /asks-before-building: 3\/4/);   // 3 expectations met; the one must_not is judged "met" = violated, so not counted
  assert.ok(seen.every((s) => s.url === '/api/chat' && s.j.stream === false && s.j.model === 'stub'));
  assert.match(seen[0].j.messages[0].content, /Using Drupal Core Lab/);
  const files = fs.readdirSync(outDir);
  assert.equal(files.length, 1);
  assert.equal(JSON.parse(fs.readFileSync(path.join(outDir, files[0]), 'utf8')).cases[0].pass, 3);
  fs.rmSync(outDir, { recursive: true });
});
