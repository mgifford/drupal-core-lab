#!/usr/bin/env node
// Inspect the resource budget for a task/issue/activity. Read-only: it records nothing and starts nothing.
//   node scripts/resource-budget.mjs [--task=<id>] [--issue=<nid>] [--activity=<category>] [--json]
// Exit 3 only when mode=enforce and an enforceable limit is exceeded.
import fs from 'node:fs';
import path from 'node:path';
import { loadBudgets, evaluateBudget, formatBudget, readRunning } from '../tools/resource/budgets.mjs';
import { loadEvents } from '../tools/resource/ledger.mjs';

const args = process.argv.slice(2);
const val = (n, d = null) => {
  const a = args.find((x) => x.startsWith(`--${n}=`)); if (a) return a.slice(n.length + 3);
  const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : d;
};
const has = (n) => args.some((x) => x === `--${n}` || x.startsWith(`--${n}=`));
const load = loadBudgets(val('budget-file', undefined) ? path.resolve(val('budget-file')) : undefined);
if (load.problems.length) { console.error(`Budget configuration problems:\n  ${load.problems.join('\n  ')}`); process.exit(2); }
const mode = val('mode', load.config.mode);
if (!['observe', 'warn', 'enforce'].includes(mode)) { console.error('--mode must be observe, warn or enforce'); process.exit(2); }
const ledger = loadEvents({ includeMonitoring: false });
const result = evaluateBudget({ config: { ...load.config, mode }, events: ledger.events, task: val('task'), issue: val('issue'), activity: val('activity'), running: readRunning() });
if (has('json')) console.log(JSON.stringify({ source: load.source, ...result }, null, 2));
else console.log(formatBudget(result));
process.exit(result.action === 'refuse' ? 3 : 0);
