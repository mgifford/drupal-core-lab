#!/usr/bin/env node
// Read-only resource preflight: host disk and memory, Docker VM memory, running lab pairs.
//   node scripts/preflight.mjs [--json] [--root=<dir>]
// Exit 3 when a build/start should not begin; 0 otherwise. Nothing is started, stopped or deleted.
import path from 'node:path';
import { labRoot } from '../tools/compare/lib.mjs';
import { measure, assessResources, formatPreflight } from '../tools/compare/preflight.mjs';

const args = process.argv.slice(2);
const rootArg = (args.find((a) => a.startsWith('--root=')) || '').slice('--root='.length);
const snapshot = measure({ root: rootArg ? path.resolve(rootArg) : labRoot });
const result = assessResources(snapshot);
if (args.includes('--json')) console.log(JSON.stringify({ ...result, snapshot }, null, 2));
else console.log(formatPreflight(result));
process.exit(result.level === 'block' ? 3 : 0);
