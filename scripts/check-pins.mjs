// Are the build pins still good? Read-only: it changes nothing in the lab and starts no DDEV project.
//   node scripts/check-pins.mjs [--cached] [--image <name>]
// Checks, in about 30 seconds and a 20 MB download:
//   1. the add-on release setup.mjs installs still exists (and whether a newer one is out: a note, not a failure);
//   2. the chromium and library versions pinned in that release's web-build/Dockerfile.chromium can still be installed from its dated
//      Debian snapshot, on the DDEV web image your DDEV uses (a throwaway container, `apt-get install -s`: nothing is installed);
//   3. which Debian release that image is, against the one the pins come from (a note).
// --cached: skip the container run when it passed in the last 24 hours for the same add-on release and image (setup.mjs uses this).
// Exit 0: pins good (notes may follow). Exit 1: a pin no longer resolves. Exit 2: the check could not run (no network, Docker or image).
// Exit 3: snapshot.debian.org is returning errors right now. Not a pin problem, but a build now would cache an empty `apt-get update`
//         layer and fail every later build until that layer is rebuilt (docs/PITFALLS.md): try again later.
// A weekly run in CI (.github/workflows/pins-check.yml) tells you when the pins need adjusting.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { labRoot } from '../tools/compare/lib.mjs';
import { ADDON, ADDON_VERSION, DDEV_TESTED } from '../tools/compare/ddev-build-failure.mjs';
import { parseChromiumDockerfile, latestTag } from '../tools/compare/pins.mjs';

const args = process.argv.slice(2);
const flag = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : null; };
const sh = (cmd, a, o = {}) => spawnSync(cmd, a, { encoding: 'utf8', timeout: 120000, maxBuffer: 16 * 1024 * 1024, ...o });
const say = (level, what, detail = '') => console.log(`${level.padEnd(5)} ${what}${detail ? `: ${detail}` : ''}`);
const end = (code) => process.exit(code);

const ddev = sh('ddev', ['--version']);
const ddevVer = ((ddev.stdout || '').match(/v?(\d+\.\d+\.\d+)/) || [])[1];
const image = flag('image') || `ddev/ddev-webserver:v${ddevVer || DDEV_TESTED.replace(/^v/, '')}`;
const cacheFile = path.join(labRoot, '.lab-cache/pins-ok.json');
if (args.includes('--cached') && fs.existsSync(cacheFile)) {
  try { const c = JSON.parse(fs.readFileSync(cacheFile, 'utf8')); if (c.addon === ADDON_VERSION && c.image === image && Date.now() - c.at < 24 * 3600 * 1000) { say('PASS', 'build pins', `checked ${new Date(c.at).toISOString().slice(0, 16)}Z (cached, same add-on release and image)`); end(0); } } catch { /* run the check */ }
}

// 1. The add-on release.
const tags = sh('git', ['ls-remote', '--tags', '--refs', `https://github.com/${ADDON}.git`]);
if (tags.status !== 0) { say('WARN', 'add-on tags', 'git could not list the add-on tags (github.com not reachable, or git is not installed); the check could not run'); end(2); }
const names = tags.stdout.split('\n').map((l) => l.split('refs/tags/')[1]).filter(Boolean);
if (!names.includes(ADDON_VERSION)) { say('FAIL', 'add-on release', `${ADDON} ${ADDON_VERSION} no longer exists. Pick one of: ${names.slice(-5).join(', ')} in tools/compare/ddev-build-failure.mjs`); end(1); }
say('PASS', 'add-on release', `${ADDON} ${ADDON_VERSION} exists`);
const newest = latestTag(names);
if (newest && newest !== ADDON_VERSION) say('NOTE', 'newer add-on release', `${newest} is out (pinned ${ADDON_VERSION}). Read its changes, then bump ADDON_VERSION in tools/compare/ddev-build-failure.mjs and run this again`);

// 2. The pins it carries.
let text;
try {
  const r = await fetch(`https://raw.githubusercontent.com/${ADDON}/${ADDON_VERSION}/web-build/Dockerfile.chromium`, { signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  text = await r.text();
} catch (e) { say('WARN', 'Dockerfile.chromium', `could not be fetched (${e.message}); the check could not run`); end(2); }
let pins;
try { pins = parseChromiumDockerfile(text); } catch (e) { say('FAIL', 'Dockerfile.chromium', e.message); end(1); }
say('PASS', 'pins read', `${pins.packages.filter((p) => p.includes('=')).length} exact versions, ${pins.sources.length} dated snapshot sources`);

if (sh('docker', ['image', 'inspect', image]).status !== 0) { say('WARN', 'web image', `${image} is not on this machine (start any lab site once, or pass --image); the install check could not run`); end(2); }
// The fetched text is data: sources and package names were validated against strict patterns, and are passed as arguments, never spliced into the script.
const script = 'set -e; n=$1; shift; : > /etc/apt/sources.list; for ((i=0;i<n;i++)); do echo "$1" >> /etc/apt/sources.list; shift; done; . /etc/os-release; echo "BASE=$PRETTY_NAME"; apt-get -o Acquire::Check-Valid-Until=false -o Acquire::Retries=1 -o Acquire::http::Timeout=20 update >/tmp/update.log 2>&1 || true; grep -E "^(Err|W: Failed)" /tmp/update.log | head -5 || true; apt-get install -s --no-install-recommends "$@" >/tmp/install.log 2>&1 && echo RESOLVES || { echo UNRESOLVED; grep -E "^E:" /tmp/install.log | head -6; }';
const run = sh('docker', ['run', '--rm', '--user', 'root', '--entrypoint', 'bash', image, '-c', script, '_', String(pins.sources.length), ...pins.sources, ...pins.packages], { timeout: 300000 });
const out = `${run.stdout}${run.stderr}`;
const base = (out.match(/^BASE=(.*)$/m) || [])[1];
if (!/RESOLVES|UNRESOLVED/.test(out)) { say('WARN', 'install check', `the container did not run to the end: ${out.trim().split('\n').slice(-3).join(' | ')}`); end(2); }
if (/UNRESOLVED/.test(out) && /^(Err:|W: Failed to fetch).*snapshot\.debian\.org/m.test(out)) {
  const why = (out.match(/W: Failed to fetch[^\n]*?([A-Za-z]+ \d{3})\s\s/) || [])[1] || 'fetch errors';
  say('WARN', 'snapshot.debian.org is unhealthy', `${why.trim().slice(0, 80)}. The pins could not be checked, and a build now would cache an empty apt layer. Try again later`);
  end(3);
}
if (/UNRESOLVED/.test(out)) {
  say('FAIL', 'pins do not resolve', `on ${image}`);
  for (const l of out.split('\n').filter((x) => /^(E:|Err|W: Failed)/.test(x))) console.log(`      ${l}`);
  console.log('      Fix: a newer add-on release may carry newer pins (see NOTE above); otherwise report it to the add-on. A build would fail at its chromium install.');
  end(1);
}
say('PASS', 'pins resolve', `${pins.packages.find((p) => p.startsWith('chromium='))} and ${pins.packages.length - 1} libraries install on ${image}`);
const suite = (pins.sources[0].match(/ ([a-z-]+) main$/) || [])[1];
if (base && suite && !base.toLowerCase().includes(suite)) say('NOTE', 'mixed Debian releases', `the image is ${base}; the pins come from ${suite}. It works today; watch for the library names (for example libdav1d6) changing`);
fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
fs.writeFileSync(cacheFile, `${JSON.stringify({ at: Date.now(), addon: ADDON_VERSION, image }, null, 1)}\n`);
end(0);
