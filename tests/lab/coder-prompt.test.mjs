import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { labRoot, variants } from '../../tools/compare/lib.mjs';
import { renderPrompt } from '../../scripts/coder-prompt.mjs';
import { PROJECT_NAMES, PROXY_PROJECTS } from '../../tools/compare/cloud/config.mjs';

test('Coder proxy identities match DDEV and nginx routing declarations', () => {
  for (const { role, name, dir } of PROXY_PROJECTS) {
    const config = fs.readFileSync(path.join(labRoot, dir, '.ddev/config.yaml'), 'utf8');
    assert.equal(config.match(/^name: (.+)$/m)?.[1], name);
    const conf = role === 'viewer' ? 'compare-cloud.conf' : `compare-${role}.conf`;
    const nginx = fs.readFileSync(path.join(labRoot, dir, '.ddev/nginx_full', conf), 'utf8');
    assert.ok(nginx.includes(`server_name ~^${name}--;`));
  }
  const cli = spawnSync(process.execPath, ['tools/compare/cloud/config.mjs', '--project-names'], { cwd: labRoot, encoding: 'utf8' });
  assert.equal(cli.status, 0);
  assert.equal(cli.stdout.trim(), PROJECT_NAMES);
  const shell = spawnSync('bash', ['-c', 'PROJECT_NAMES=$(node tools/compare/cloud/config.mjs --project-names); IFS=, read -r viewer before after <<< "$PROJECT_NAMES"; printf "%s\\n" "$viewer" "$before" "$after"'], { cwd: labRoot, encoding: 'utf8' });
  assert.equal(shell.status, 0);
  assert.deepEqual(shell.stdout.trim().split('\n'), PROXY_PROJECTS.map((p) => p.name));
});

test('Inherited variants retain the recipe and ordered patch hashes in the handoff', () => {
  const v = variants().find((x) => x.slug === '3619127-latest');
  const rendered = renderPrompt(v);
  assert.ok(rendered.includes(PROJECT_NAMES));
  assert.ok(rendered.includes('recipes/ife_sidebar_repro/recipe.yml'));
  let previous = -1;
  for (const patch of v.after.patches) {
    const at = rendered.indexOf(patch);
    assert.ok(at > previous);
    previous = at;
  }
  assert.match(rendered, /SHA-256: `[a-f0-9]{64}`/);
  assert.ok(rendered.includes('moving ref `main`'));
  assert.ok(rendered.includes('switch it off for the action under test'));
  assert.ok(!/\{\{[A-Z_]+\}\}/.test(rendered));
  assert.throws(() => renderPrompt({ ...v, after: { ...v.after, patches: ['missing.patch'] } }), /ENOENT|Missing/);
  assert.throws(() => renderPrompt({ ...v, after: { ...v.after, patches: [] } }), /no After patch stack/);
});

test('Plain Standard is explicit and template edits invalidate generated prompts', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'coder-prompt-'));
  try {
    fs.mkdirSync(path.join(root, 'prompts'));
    fs.copyFileSync(path.join(labRoot, 'prompts/coder-prompt.md'), path.join(root, 'prompts/coder-prompt.md'));
    fs.writeFileSync(path.join(root, 'change.patch'), 'a sample patch');
    const v = { issue: '1234567', slug: 'example', before: { env: 'before' }, after: { env: 'after', patches: ['change.patch'] }, steps: [{ text: 'Open the form.', how: 'each' }], expected: 'Clear link text.', actual: 'Ambiguous link text.' };
    const first = renderPrompt(v, root);
    assert.match(first, /plain Standard installation/);
    fs.appendFileSync(path.join(root, 'prompts/coder-prompt.md'), '\nNew common instruction.\n');
    assert.notEqual(renderPrompt(v, root), first);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('Committed generated Coder prompts remain current', () => {
  for (const v of variants()) {
    const file = path.join(labRoot, 'reports/issues', String(v.issue), 'CODER-PROMPT.md');
    if (!fs.existsSync(file)) continue;
    const text = fs.readFileSync(file, 'utf8');
    if (!text.includes(`<!-- coder-prompt: ${v.slug} -->`)) continue;
    assert.equal(text, renderPrompt(v), `Regenerate: node scripts/coder-prompt.mjs ${v.slug} --write`);
  }
});
