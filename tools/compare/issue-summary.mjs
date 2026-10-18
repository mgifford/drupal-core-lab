// One maintained summary layout for issue scaffolding and issue-pack imports.
import fs from 'node:fs';
import path from 'node:path';
import { labRoot } from './lib.mjs';

export function renderIssueSummary({ nid, title, metadata = '', summary, sources = [], setup = [], unverified = [], notes = '', generatedBy = 'the Lab scaffold' }, root = labRoot) {
  const fields = {
    NID: nid, TITLE: title, METADATA: metadata,
    STATUS: `Prepared by ${generatedBy}. Reproduction, checks and user-facing outcomes have not been verified by this generation step.`,
    SUMMARY: summary || 'Describe the task, barrier, reported result and desired user-facing behaviour. Separate observations from explanations and proposed changes.',
    SOURCES: sources.length ? sources.map((s) => `- ${s.url}${s.date ? ` (${s.date})` : ''}: ${s.note}`).join('\n') : 'Sources and dated issue/MR discussion references have not yet been recorded.',
    SETUP: setup.length ? `## Setup blocks\n\n${setup.join('\n')}` : '',
    UNVERIFIED: unverified.length ? unverified.map((s) => `- ${s}`).join('\n') : '- Reproduction steps, setup and checks have not yet been verified.',
    NOTES: notes ? `## Notes\n\n${notes.trim()}` : '',
  };
  return fs.readFileSync(path.join(root, 'reports/_templates/SUMMARY.md'), 'utf8').replace(/\{\{([A-Z_]+)\}\}/g, (_, key) => {
    if (!(key in fields)) throw new Error(`Unknown SUMMARY template field: ${key}`);
    return String(fields[key]);
  });
}
