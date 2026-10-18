// Ordered local workflow. Does not push, post, reset, or install sites silently.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { labRoot, variants } from '../tools/compare/lib.mjs';
const [id, action = 'validate', ...extra] = process.argv.slice(2);
const run = (file, args = []) => {
  const r = spawnSync(process.execPath, [path.join(labRoot, file), ...args], { cwd: labRoot, stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status || 1);
};
if (id === 'validate') {
  const manifest = JSON.parse(fs.readFileSync(path.join(labRoot, 'FORCED-COLORS-MANIFEST.json')));
  for (const [rel, hash] of Object.entries(manifest.files)) {
    const got = createHash('sha256').update(fs.readFileSync(path.join(labRoot, rel))).digest('hex');
    if (got !== hash) throw new Error(`Integrity failure: ${rel}`);
  }
  const all = variants();
  for (const nid of ['3631321', '3631337']) {
    const v = all.find(x => x.slug === `${nid}-pinned`);
    if (!v || v.core.commit !== manifest.coreBase) throw new Error(`${nid}: variant pin mismatch`);
    for (const rel of [...v.before.patches, ...v.after.patches, `recipes/${v.recipe}/recipe.yml`]) {
      if (!manifest.files[rel]) throw new Error(`Unhashed scenario input: ${rel}`);
    }
  }
  console.log(`PASS: ${Object.keys(manifest.files).length} file hashes and both registered pinned comparisons. This does not run Drupal.`);
  process.exit(0);
}
if (!['3631321', '3631337'].includes(id)) throw new Error('Usage: node scripts/forced-colors-pair.mjs validate | <3631321|3631337> <check|setup|start|evaluate|stop>');
const slug = `${id}-pinned`;
if (action === 'check') run('tools/compare/setup.mjs', [slug, '--check-patches']);
else if (action === 'setup') {
  run('scripts/doctor.mjs', [slug]);
  run('tools/compare/setup.mjs', [slug, '--check-patches']);
  run('tools/compare/setup.mjs', [slug]);
} else if (action === 'start') run('scripts/lab-env.mjs', ['start', slug, '--browser']);
else if (action === 'stop') run('scripts/lab-env.mjs', ['stop', slug]);
else if (action === 'evaluate') {
  for (const mode of [[], ['--scheme=dark'], ['--forced-colors'], ['--forced-colors', '--scheme=dark']]) {
    run(`tools/playwright/evaluate-${id}.mjs`, [slug, ...mode, ...extra]);
  }
  run('scripts/coverage.mjs', [id]);
} else throw new Error(`Unknown action: ${action}`);
