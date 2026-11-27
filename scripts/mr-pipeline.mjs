// The GitLab CI pipeline of a Drupal core merge request, read and classified (tools/compare/gitlab-ci.mjs). Read-only.
//   node scripts/mr-pipeline.mjs <nid> [--mr <iid>] [--pipeline <id>] [--all-failures] [--no-logs] [--json]
//   node scripts/mr-pipeline.mjs --mr <iid> [--pipeline <id>] ...      without an issue number
//   node scripts/mr-pipeline.mjs --pipeline <id> ...                   the merge request is taken from the pipeline's ref
// Default: the merge request's head pipeline (the merge request found from the issue fork's branches, or --mr). Each job is PASS,
// BLOCKING_FAILURE, ALLOWED_FAILURE, RUNNING, PENDING, INFRASTRUCTURE_ERROR, AUTHORIZATION_BLOCKED or UNKNOWN, and so is the pipeline.
// For each blocking or infrastructure failure: failed tests with file and line, a log excerpt, links to the job and its artifacts
// (links only; nothing is downloaded but the log and the failed test cases). --all-failures does the same for allowed failures.
// Facts and likely causes are printed apart; retry advice is text for a person. Nothing is retried, posted or pushed, and no token is
// read: git.drupalcode.org is read anonymously (https GET), and a 401 or 403 is reported as AUTHORIZATION_BLOCKED.
// Logs and failed test cases of finished jobs are cached in .lab-cache/gitlab/jobs/<job>/ (git-ignored), redacted, and not downloaded again.
// Exit: 0 PASS, 1 BLOCKING_FAILURE or INFRASTRUCTURE_ERROR, 2 usage, 3 RUNNING or PENDING, 4 AUTHORIZATION_BLOCKED or UNKNOWN.
import fs from 'node:fs';
import path from 'node:path';
import { labRoot } from '../tools/compare/lib.mjs';
import { inspect, renderText, exitCodeOf } from '../tools/compare/gitlab-ci.mjs';

const args = process.argv.slice(2), val = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : null; };
const usage = () => { console.error(fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(1, 4).map((l) => l.replace(/^\/\/ ?/, '')).join('\n')); process.exit(2); };
const known = new Set(['--mr', '--pipeline', '--all-failures', '--no-logs', '--json']);
const values = new Set([val('mr'), val('pipeline')].filter(Boolean));
const nid = args.find((a) => /^\d{5,8}$/.test(a) && !values.has(a)) || null, mr = val('mr'), pipeline = val('pipeline');
for (const a of args) if (a.startsWith('--') ? !known.has(a) : !(a === nid || values.has(a))) usage();
if ((args.includes('--mr') && !/^\d{1,7}$/.test(mr || '')) || (args.includes('--pipeline') && !/^\d{1,10}$/.test(pipeline || '')) || (!nid && !mr && !pipeline)) usage();

const r = await inspect({ nid, mr, pipeline, cacheRoot: path.join(labRoot, '.lab-cache/gitlab/jobs'), allFailures: args.includes('--all-failures'), logs: !args.includes('--no-logs') });
if (args.includes('--json')) process.stdout.write(`${JSON.stringify(r, null, 1)}\n`);
else process.stdout.write(renderText(r, { root: process.cwd() }));
process.exit(exitCodeOf(r.class));
