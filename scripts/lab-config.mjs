// Read the repository's settings (lab.config.yml; see tools/compare/lab-config.mjs).
//   node scripts/lab-config.mjs                 print every setting, with where it comes from
//   node scripts/lab-config.mjs auto_fix.enabled   print one value (true or false) and nothing else, for an agent to branch on
// Exit 2 when the file is invalid: a setting that cannot be read is never silently replaced by its default.
import { labRoot } from '../tools/compare/lib.mjs';
import { readLabConfig, getKey } from '../tools/compare/lab-config.mjs';

const key = process.argv.slice(2).find((a) => !a.startsWith('--')), r = readLabConfig(labRoot);
if (r.problems.length) { console.error(`lab.config.yml is not valid, so no setting can be trusted:\n${r.problems.map((p) => `  - ${p}`).join('\n')}`); process.exit(2); }
if (key) { const v = getKey(r.config, key); if (v === undefined || typeof v === 'object') { console.error(`No setting "${key}".`); process.exit(2); } console.log(String(v)); process.exit(0); }
console.log(`Settings from ${r.source}:\n${JSON.stringify(r.config, null, 2)}`);
