// Verify this focused issue bundle after copying it into an existing Lab.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { labRoot, variants } from '../tools/compare/lib.mjs';
const manifest = JSON.parse(fs.readFileSync(path.join(labRoot, 'reports/issues/3630425/MANIFEST.json')));
for (const [file, expected] of Object.entries(manifest.files)) {
  const actual = createHash('sha256').update(fs.readFileSync(path.join(labRoot, file))).digest('hex');
  if (actual !== expected) throw new Error(`Hash mismatch: ${file}`);
}
const v = variants().find(v => v.slug === '3630425-pinned');
if (!v || v.core.commit !== manifest.coreBase || v.recipe !== 'repro_3630425' || v.before.patches.length || v.after.patches.length !== 1 || v.after.patches[0] !== manifest.mainPatch) throw new Error('The registered pinned comparison differs from this bundle');
console.log(`PASS: ${Object.keys(manifest.files).length} files and registered main-based Before/After comparison. Live Drupal testing is separate.`);
