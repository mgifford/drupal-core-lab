// A hermetic environment for the static self-test: the unit tests must give the same answer on every machine, whatever DDEV, Docker,
// git configuration or network that machine has, and must never touch them. scripts/selftest.mjs runs the unit tests (and its other
// static checks) with:
//   - stand-ins for the live tools (ddev, docker, mutagen, gh) first on PATH. Each records its call and exits 97, so a test that
//     forgot its own stand-in fails the same way everywhere, and nothing real is started, stopped or unlisted. A test that needs a
//     tool writes its own stand-in (standIn below) and puts it first on PATH;
//   - hermetic-preload.mjs in NODE_OPTIONS: Node refuses (and records) any connection that is not to this machine's loopback;
//   - GIT_ALLOW_PROTOCOL=file: git may clone and fetch local folders, never a remote;
//   - git configuration from an empty file, not the person's, plus safe.bareRepository=explicit (what agent shells set), so lab code
//     is tested under the strictest setting rather than whatever this machine happens to have.
// Every refused call is appended to the log; the self-test fails when the log is not empty.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const LIVE_TOOLS = ['ddev', 'docker', 'mutagen', 'gh'];
export const REFUSED = 97;
const PRELOAD = path.join(path.dirname(fileURLToPath(import.meta.url)), 'hermetic-preload.mjs');
const q = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`;

// A stand-in executable. `script` is the POSIX sh body after the call is logged; the default refuses.
export function standIn(dir, name, { stdout = '', stderr = '', status = 0, script = '', log = '' } = {}) {
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, name), lines = ['#!/bin/sh'];
  if (log) lines.push(`printf '%s %s\\n' ${q(name)} "$*" >> ${q(log)}`);
  if (script) lines.push(script);
  else {
    if (stdout) lines.push(`cat <<'LAB_STAND_IN_EOF'\n${stdout}\nLAB_STAND_IN_EOF`);
    if (stderr) lines.push(`cat >&2 <<'LAB_STAND_IN_EOF'\n${stderr}\nLAB_STAND_IN_EOF`);
    lines.push(`exit ${status}`);
  }
  fs.writeFileSync(file, `${lines.join('\n')}\n`, { mode: 0o755 });
  return file;
}

// The guard stand-ins: they log to $LAB_HERMETIC_LOG (set by hermeticEnv) and refuse.
export function writeGuards(dir) {
  for (const tool of LIVE_TOOLS) {
    standIn(dir, tool, { script: [
      `[ -n "$LAB_HERMETIC_LOG" ] && printf '%s %s\\n' ${q(tool)} "$*" >> "$LAB_HERMETIC_LOG"`,
      `echo "HERMETIC: the static self-test does not run ${tool} (called: ${tool} $*). Give the test its own stand-in (tools/compare/hermetic.mjs standIn)." >&2`,
      `exit ${REFUSED}`,
    ].join('\n') });
  }
}

// The environment for hermetic children, and a cleanup. `base` is the environment to start from (default: this process's).
export function hermeticEnv({ base = process.env, root = fs.mkdtempSync(path.join(os.tmpdir(), 'lab-hermetic-')) } = {}) {
  const bin = path.join(root, 'bin'), log = path.join(root, 'calls.log'), gitconfig = path.join(root, 'gitconfig');
  writeGuards(bin); fs.writeFileSync(log, ''); fs.writeFileSync(gitconfig, '');
  const env = Object.fromEntries(Object.entries(base).filter(([k]) => !/^(GIT_CONFIG_(PARAMETERS|COUNT|KEY_\d+|VALUE_\d+)|CODER_|DDEV_)/.test(k)));
  const preload = `--import=${pathToFileURL(PRELOAD).href}`;
  Object.assign(env, {
    PATH: `${bin}${path.delimiter}${base.PATH || ''}`,
    LAB_HERMETIC: '1', LAB_HERMETIC_LOG: log,
    NODE_OPTIONS: [base.NODE_OPTIONS, preload].filter(Boolean).join(' '),
    GIT_ALLOW_PROTOCOL: 'file', GIT_TERMINAL_PROMPT: '0',
    GIT_CONFIG_GLOBAL: gitconfig, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_PARAMETERS: "'safe.bareRepository=explicit'",
  });
  return { env, bin, log, root, calls: () => readCalls(log), cleanup: () => fs.rmSync(root, { recursive: true, force: true }) };
}

// The refused calls, one per distinct line, most frequent first: [{ call, count }].
export function readCalls(log) {
  let text = ''; try { text = fs.readFileSync(log, 'utf8'); } catch { return []; }
  const counts = new Map();
  for (const line of text.split('\n').filter(Boolean)) counts.set(line, (counts.get(line) || 0) + 1);
  return [...counts].map(([call, count]) => ({ call, count })).sort((a, b) => b.count - a.count);
}
