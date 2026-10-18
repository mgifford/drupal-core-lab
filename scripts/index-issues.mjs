// Regenerate reports/issues/README.md: every issue folder, grouped by what it needs next (docs/ISSUE-LIFECYCLE.md). Offline: it
// reads each issue's status.json, BRANCHES.md and ARCHIVED.md (tools/compare/issue-tracking.mjs buildIndex).
//   node scripts/index-issues.mjs
import fs from 'node:fs';
import path from 'node:path';
import { labRoot } from '../tools/compare/lib.mjs';
import { buildIndex } from '../tools/compare/issue-tracking.mjs';

const { md, counts } = buildIndex(labRoot);
fs.writeFileSync(path.join(labRoot, 'reports/issues/README.md'), md);
console.log(`${Object.values(counts).reduce((a, b) => a + b, 0)} issues indexed -> reports/issues/README.md (needs attention ${counts.attention}, waiting ${counts.waiting}, not checked yet ${counts.unchecked}, archived ${counts.archived})`);
