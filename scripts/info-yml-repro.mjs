// Phase 1 of the info.yml investigation: what a broken .info.yml (or a PHP parse error) does to a Drupal site, measured.
// Applies each fixture in tests/info-yml/fixtures/ to a site built from a core git checkout, one at a time, and records what
// each observation returns. No Drush: core's own commands stand in for it (see OBSERVATIONS). Results go to reports/info-yml/.
//
//   node scripts/info-yml-repro.mjs prepare [--workers=N]       build worker docroots and their database snapshots
//   node scripts/info-yml-repro.mjs run [filters] [--workers=N]  run the matrix (merges into reports/info-yml/results.json)
//   node scripts/info-yml-repro.mjs report                       rewrite reports/info-yml/RESULTS.md from results.json
// Filters (comma lists): --cases= --kinds=module,theme,profile,libraries --placements=uninstalled,installed,...
//   --parsers=symfony,pecl --observations=anon,modules,...   --rebaseline measures the baselines again
//   (--rebaseline=exin_self,... only those observations' baselines).
// Phase 3 (needs a core with the ex:validate patch, default envs/info-yml-patch):
//   lint | false-positives | planted | deploy-gate   the linter on the fixtures, on working code, on errors planted in core,
//                                                    and in the deploy-gate examples (reports/info-yml/*.md)
// Proposed patches, measured with the same fixtures, apart from the baseline:
//   variant --variant=<name> --patch=<file>          envs/info-yml-<name>: the baseline core plus the patch
//   prepare|run|report --variant=<name>              the Phase 1 matrix on it (reports/info-yml/variants/<name>/)
//   compare --variant=<name>                         every result that differs from the baseline's
// Options: --php=<php 8.5 binary> (default $LAB_PHP or php), --core=<core checkout> (default envs/info-yml-main),
//   --yaml-ext=<extension to load for the PECL runs> (default yaml), --port=<first port> (default 8890).
//
// How one observation runs: restore the snapshot's sites/default (settings.php and the SQLite file), write the valid
// extension files the snapshot expects, apply the fixture, then do exactly one thing (one request or one command) and read
// what happened: HTTP status and the messages on the page, the exit code and output of a command, and the exception class
// and message from the dblog rows and the PHP error log written during it. Every observation starts from the same snapshot,
// so none inherits state from another.
// Baseline: the same observation with the VALID extension in the same place (uninstalled, installed, ...). A verdict says
// how the fixture changed the result compared with that baseline, so whatever the environment adds to both (for example
// Update's "There was a problem checking available updates", since release data is never fetched here) cancels out.
// "pecl" runs load the PECL YAML extension, which core main uses for .info.yml files when it is loaded (#3616275);
// "symfony" runs do not.
//
// The PHP server and commands run with -n (no php.ini) plus explicit settings: errors hidden from the page and logged,
// zend.assertions=-1 (as in production), and OPcache off so a rewritten .module file is never served from a stale cache.
// This is a private local test site: the admin password is random and never printed; logins use one-time links.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { loadYaml } from '../tools/compare/pack-validate.mjs';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const labRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const cmd = args.find((a) => !a.startsWith('--'));
const opt = (name, dflt) => { const a = args.find((x) => x.startsWith(`--${name}=`)); return a ? a.slice(name.length + 3) : dflt; };
const list = (name) => { const v = opt(name); return v ? v.split(',').filter(Boolean) : null; };

const PHP = opt('php', process.env.LAB_PHP || 'php');
// --variant=<name>: a run on a patched core, kept apart from the baseline: its own core checkout (envs/info-yml-<name>, made
// by the variant command), worker sites (envs/info-yml-work-<name>) and reports (reports/info-yml/variants/<name>/).
const VARIANT = opt('variant', null);
const RESERVED = ['main', 'patch', 'work', 'contrib', 'site', 'planted'];
if (VARIANT !== null && (!/^[a-z0-9][a-z0-9-]*$/.test(VARIANT) || RESERVED.includes(VARIANT) || VARIANT.startsWith('work-'))) {
  console.error(`--variant= takes lower-case letters, digits and hyphens, and not: ${RESERVED.join(', ')}, work-*.`);
  process.exit(2);
}
const CORE = path.resolve(labRoot, opt('core', VARIANT ? `envs/info-yml-${VARIANT}` : 'envs/info-yml-main'));
const WORK = path.join(labRoot, VARIANT ? `envs/info-yml-work-${VARIANT}` : 'envs/info-yml-work');
const FIX = path.join(labRoot, 'tests/info-yml/fixtures');
const RECIPES = path.join(labRoot, 'tests/info-yml/recipes');
const LIB = path.join(labRoot, 'tests/info-yml/lib');
// The baseline's reports; a variant writes to its own folder, and the linter checks always compare with the baseline's Phase 1.
const BASE_OUT = path.join(labRoot, 'reports/info-yml');
const OUT = VARIANT ? path.join(BASE_OUT, 'variants', VARIANT) : BASE_OUT;
// The core with the linter, for lint, planted, false-positives and deploy-gate: --core=, else the variant's, else the patch's.
// Links in a report, relative to the folder it is written to.
const link = (rel) => path.relative(OUT, path.join(labRoot, rel));
const LINTER_CORE = path.resolve(labRoot, opt('core', VARIANT ? `envs/info-yml-${VARIANT}` : 'envs/info-yml-patch'));
const YAML_EXT = opt('yaml-ext', 'yaml');
// A PECL run must really load the extension: PHP only warns when it cannot, and the run would silently use Symfony YAML.
function requireYaml() {
  const r = spawnSync(PHP, ['-n', '-d', `extension=${YAML_EXT}`, '-r', 'exit(extension_loaded("yaml") ? 0 : 1);'], { encoding: 'utf8' });
  if (r.status !== 0) { console.error(`PECL YAML does not load with ${PHP} -n -d extension=${YAML_EXT}:\n${r.stderr || r.stdout}`); process.exit(3); }
}
const PORT0 = Number(opt('port', '8890'));
const WORKERS = Math.max(1, Number(opt('workers', '1')));

const PARENT = { module: 'modules/custom', theme: 'themes/custom', profile: 'profiles/custom', libraries: 'modules/contrib' };
const EXT = { module: 'infofix', theme: 'infofix_theme', profile: 'infofix_profile', libraries: 'libfix' };
// Where a fixture sits, and the snapshot it starts from.
const PLACEMENTS = {
  module: { uninstalled: 'standard', 'uninstalled-no-update': 'bare', installed: 'module-installed' },
  theme: { uninstalled: 'standard', 'uninstalled-no-update': 'bare', installed: 'theme-installed' },
  profile: { uninstalled: 'standard', installed: 'profile-installed' },
  libraries: { contrib: 'standard', 'contrib-scan-tests': 'standard', updated: 'libfix-installed', 'updated-scan-tests': 'libfix-installed' },
};
const PLACEMENT_NOTES = {
  'module/uninstalled': 'modules/custom/infofix, not installed (Standard site; the installer installs Update by default)',
  'module/uninstalled-no-update': 'as uninstalled, on the same site after uninstalling the Update module',
  'module/installed': 'modules/custom/infofix, installed before the file was broken',
  'theme/uninstalled': 'themes/custom/infofix_theme, not installed (Standard site; the installer installs Update by default)',
  'theme/uninstalled-no-update': 'as uninstalled, on the same site after uninstalling the Update module',
  'theme/installed': 'themes/custom/infofix_theme, installed and set as the default theme before the file was broken',
  'profile/uninstalled': 'profiles/custom/infofix_profile on a Standard site (a profile that is not the site\'s profile)',
  'profile/installed': 'profiles/custom/infofix_profile, the profile the site was installed with (it installs node, block, dblog and update, and no page cache)',
  'libraries/contrib': 'libfix v2 (with tests/ fixtures that have no type) copied into modules/contrib, not installed',
  'libraries/contrib-scan-tests': 'as contrib, with $settings[\'extension_discovery_scan_tests\'] = TRUE',
  'libraries/updated': 'libfix v1 installed, then its files replaced by v2 (what an update does to the code base)',
  'libraries/updated-scan-tests': 'as updated, with $settings[\'extension_discovery_scan_tests\'] = TRUE',
};
// The observations, and the Drush command each one stands in for where there is one.
const OBSERVATIONS = {
  anon: { label: 'GET /user/login as an anonymous visitor, with no cache rebuild and warm caches (the configured front page, /admin/welcome, needs a login)' },
  anon_cold: { label: 'empty every cache table (as a deploy or a cache backend restart does, without running Drupal\'s rebuild), then GET /user/login as an anonymous visitor' },
  modules: { label: 'GET /admin/modules' },
  appearance: { label: 'GET /admin/appearance' },
  updates: { label: 'GET /admin/reports/updates' },
  status: { label: 'GET /admin/reports/status' },
  updatephp: { label: 'GET /update.php/selection (stands in for drush updb: it lists pending updates; no update is run)' },
  cr: { label: 'core/scripts/dr cache:rebuild (stands in for drush cr), then GET /user/login' },
  en_self: { label: 'install the fixture extension itself from the UI: tick it on /admin/modules and submit, or follow the theme\'s Install link on /admin/appearance (stands in for drush en; the recipe command cannot see an extension added since the last cache rebuild)' },
  en_other: { label: 'core/scripts/dr recipe tests/info-yml/recipes/install_syslog: install an unrelated core module with a recipe' },
  exin_self: { label: 'core/scripts/dr ex:install <the fixture extension> -y: core\'s own install command (aliases exin, pm:install, pm:enable, enable, en; it resets the extension lists first), the closest equivalent of drush en; then one anonymous request to /user/login, then cache:rebuild and the request again' },
  exin_other: { label: 'core/scripts/dr ex:install syslog -y: install an unrelated core module with core\'s install command; then one anonymous request to /user/login, then cache:rebuild and the request again' },
  recovery: { label: 'break the site (cache:rebuild), remove the fixture (delete it, or put the valid files back if it was installed), then GET /user/login without and with cache:rebuild' },
};
const SETTINGS = `
// info-yml lab (scripts/info-yml-repro.mjs): private local test site.
$config['automated_cron.settings']['interval'] = 0;
$config['update.settings']['fetch']['url'] = 'http://127.0.0.1:9/release-history';
$config['system.logging']['error_level'] = 'hide';
$settings['skip_permissions_hardening'] = TRUE;
`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rm = (p) => fs.rmSync(p, { recursive: true, force: true });
const copyDir = (from, to) => fs.cpSync(from, to, { recursive: true });
const phpFlags = (parser, log) => [
  '-n', '-d', 'memory_limit=1G', '-d', 'max_execution_time=300', '-d', 'date.timezone=UTC', '-d', 'error_reporting=E_ALL',
  '-d', 'display_errors=0', '-d', 'display_startup_errors=0', '-d', 'log_errors=1', '-d', `error_log=${log}`,
  '-d', 'zend.assertions=-1', '-d', 'opcache.enable=0', '-d', 'opcache.enable_cli=0',
  ...(parser === 'pecl' ? ['-d', `extension=${YAML_EXT}`] : []),
];

function worker(i) {
  const base = path.join(WORK, `w${i}`);
  return { i, base, root: path.join(base, 'docroot'), snaps: path.join(base, 'snapshots'), log: path.join(base, 'php-error.log'), port: PORT0 + i, server: null, parser: null };
}
// Results must not depend on which worker measured them: remove the worker's docroot from every string.
const scrub = (v) => JSON.parse(JSON.stringify(v).replace(new RegExp(`${WORK.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/w\\d+/docroot/?`, 'g'), ''));

// A worker's docroot: hard links to the core checkout's files (fast, no extra disk), real directories, and its own sites/.
function linkTree(from, to, skip) {
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const s = path.join(from, e.name), d = path.join(to, e.name);
    if (skip(s)) continue;
    if (e.isDirectory()) linkTree(s, d, skip);
    else if (e.isSymbolicLink()) fs.symlinkSync(fs.readlinkSync(s), d);
    else { try { fs.linkSync(s, d); } catch { fs.copyFileSync(s, d); } }
  }
}
function buildDocroot(w) {
  rm(w.root);
  const skip = (p) => p === path.join(CORE, '.git') || p.startsWith(path.join(CORE, 'sites')) || ['modules/custom', 'modules/contrib', 'themes/custom', 'profiles/custom'].some((d) => p === path.join(CORE, d));
  linkTree(CORE, w.root, skip);
  copyDir(path.join(CORE, 'sites'), path.join(w.root, 'sites'));
  for (const d of Object.values(PARENT)) fs.mkdirSync(path.join(w.root, d), { recursive: true });
}

function run(w, parser, argv, timeout = 600000) {
  const r = spawnSync(PHP, [...phpFlags(parser, w.log), ...argv], { cwd: w.root, encoding: 'utf8', timeout, env: { ...process.env, COLUMNS: '400', no_proxy: '127.0.0.1,localhost', NO_PROXY: '127.0.0.1,localhost' } });
  return { exit: r.status ?? (r.signal ? `signal ${r.signal}` : 'error'), out: `${r.stdout || ''}${r.stderr || ''}` };
}
// core/scripts/dr: core/scripts/drupal is deprecated in drupal:11.4.0 (https://www.drupal.org/node/3584928).
const drupal = (w, parser, ...a) => run(w, parser, ['core/scripts/dr', ...a, '-v', '--no-interaction']);

// Every server this process starts is stopped when it exits, also on an error: an orphaned server would keep the port and
// answer the next run's requests from a stale state.
const servers = new Set();
process.on('exit', () => { for (const p of servers) p.kill('SIGTERM'); });
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => process.exit(130));
async function startServer(w, parser) {
  if (w.server && w.parser === parser) return;
  await stopServer(w);
  const inUse = await fetch(`http://127.0.0.1:${w.port}/robots.txt`, { signal: AbortSignal.timeout(1000) }).then(() => true, () => false);
  if (inUse) throw new Error(`port ${w.port} is already in use (an orphaned php -S from an earlier run?); stop it, or use --port=`);
  const p = spawn(PHP, [...phpFlags(parser, w.log), '-S', `127.0.0.1:${w.port}`, '-t', w.root, path.join(w.root, '.ht.router.php')], { cwd: w.root, stdio: ['ignore', 'ignore', 'ignore'], env: { ...process.env, PHP_CLI_SERVER_WORKERS: '1' } });
  w.server = p; w.parser = parser; servers.add(p);
  p.once('exit', () => servers.delete(p));
  // A static file: a PHP page here (core/install.php was the first choice) parses info files and logs into the observation.
  for (let t = 0; t < 100; t++) { try { await fetch(`http://127.0.0.1:${w.port}/robots.txt`, { redirect: 'manual', signal: AbortSignal.timeout(2000) }); return; } catch { await sleep(100); } }
  throw new Error(`PHP server on port ${w.port} did not start`);
}
async function stopServer(w) {
  if (!w.server) return;
  const p = w.server; w.server = null; w.parser = null;
  p.kill('SIGTERM');
  await new Promise((r) => { p.once('exit', r); setTimeout(r, 3000); });
}

const sitesDefault = (w) => path.join(w.root, 'sites/default');
function resetSite(w) {
  const sd = sitesDefault(w);
  fs.chmodSync(sd, 0o755);
  for (const f of ['settings.php', 'files', 'services.yml']) { try { fs.chmodSync(path.join(sd, f), 0o755); } catch {} rm(path.join(sd, f)); }
}
// SQLite runs in WAL mode here, and the PHP server closes its connection (checkpointing the WAL into the main file) after it
// has sent the response. Copying or replacing the database while that happens tears it (seen: "database disk image is
// malformed" in two of three snapshots). So the server is stopped before any snapshot or restore, the WAL is checkpointed
// before a copy, and every snapshot is checked.
const SQLITE_PHP = '$p = new Pdo\\Sqlite("sqlite:" . $argv[1]); $p->createCollation("NOCASE_UTF8", fn ($a, $b) => strcmp(mb_strtolower($a), mb_strtolower($b)));';
function sqlite(file, sql) {
  const r = spawnSync(PHP, ['-n', '-r', `${SQLITE_PHP} echo $p->query($argv[2])->fetchColumn();`, file, sql], { encoding: 'utf8' });
  return `${r.stdout}${r.stderr}`.trim();
}
async function snapshot(w, name, cookie) {
  await stopServer(w);
  const db = path.join(sitesDefault(w), 'files/.sqlite');
  sqlite(db, 'PRAGMA wal_checkpoint(TRUNCATE)');
  const d = path.join(w.snaps, name);
  rm(d); fs.mkdirSync(d, { recursive: true });
  copyDir(path.join(sitesDefault(w), 'files'), path.join(d, 'files'));
  const check = sqlite(path.join(d, 'files/.sqlite'), 'PRAGMA integrity_check');
  if (check !== 'ok') throw new Error(`snapshot ${name} failed its integrity check: ${check.slice(0, 300)}`);
  fs.copyFileSync(path.join(sitesDefault(w), 'settings.php'), path.join(d, 'settings.php'));
  fs.writeFileSync(path.join(d, 'cookie.txt'), cookie);
  const max = spawnSync(PHP, ['-n', path.join(LIB, 'watchdog.php'), path.join(d, 'files/.sqlite'), 'max'], { encoding: 'utf8' });
  fs.writeFileSync(path.join(d, 'maxwid.txt'), max.stdout.trim());
}
function restore(w, name) {
  const d = path.join(w.snaps, name);
  resetSite(w);
  copyDir(path.join(d, 'files'), path.join(sitesDefault(w), 'files'));
  fs.copyFileSync(path.join(d, 'settings.php'), path.join(sitesDefault(w), 'settings.php'));
  fs.chmodSync(path.join(sitesDefault(w), 'settings.php'), 0o644);
  return { cookie: fs.readFileSync(path.join(d, 'cookie.txt'), 'utf8'), maxwid: Number(fs.readFileSync(path.join(d, 'maxwid.txt'), 'utf8') || 0) };
}
const restoreInfo = (w, sc) => ({ maxwid: Number(fs.readFileSync(path.join(w.snaps, PLACEMENTS[sc.kind][sc.placement], 'maxwid.txt'), 'utf8') || 0) });
function cleanExtensions(w) {
  for (const d of Object.values(PARENT)) { rm(path.join(w.root, d)); fs.mkdirSync(path.join(w.root, d), { recursive: true }); }
}
function placeValid(w, kind) {
  if (kind === 'libraries') { copyDir(path.join(FIX, 'libraries-tarball/v1'), path.join(w.root, PARENT.libraries)); return; }
  copyDir(path.join(FIX, '_valid', kind), path.join(w.root, PARENT[kind]));
}

const text = (s) => s.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ').replace(/&#0?39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
// Status messages by type, from the messages--<type> class that every core theme's status-messages template uses.
function messages(body) {
  const out = { error: [], warning: [] };
  const re = /class="[^"]*\bmessages--(error|warning|status)\b[^"]*"/g;
  const hits = [...body.matchAll(re)];
  hits.forEach((m, i) => {
    if (m[1] === 'status') return;
    const chunk = body.slice(m.index, hits[i + 1] ? hits[i + 1].index : m.index + 4000);
    const end = chunk.search(/<\/ul>|<\/div>\s*<\/div>\s*<\/div>/);
    const t = text((end > 0 ? chunk.slice(0, end) : chunk).replace(/^[^>]*>/, '')).replace(/^(Error|Warning) message\s*/, '').replace(/\s*Hide$/, '');
    if (t) out[m[1]].push(t.slice(0, 500));
  });
  return out;
}
async function http(w, p, cookie, method = 'GET', keepBody = false) {
  const started = Date.now();
  try {
    const res = await fetch(`http://127.0.0.1:${w.port}${p}`, { method, redirect: 'manual', headers: cookie ? { cookie } : {}, signal: AbortSignal.timeout(180000) });
    const body = await res.text();
    const title = (body.match(/<title>([\s\S]*?)<\/title>/) || [])[1];
    const m = messages(body);
    return { status: res.status, location: res.headers.get('location') || undefined, title: title ? text(title) : undefined, error_messages: m.error.slice(0, 4), warning_messages: m.warning.slice(0, 4),
      body_excerpt: res.status >= 500 ? text(body).slice(0, 300) : undefined, ms: Date.now() - started, cookie: res.headers.getSetCookie?.(), ...(keepBody ? { body } : {}) };
  } catch (e) {
    return { status: 0, error: String(e.message || e), ms: Date.now() - started };
  }
}
const httpClean = async (...a) => { const r = await http(...a); delete r.cookie; return r; };
// A command's output: the start (where Symfony Console prints the exception) and the end (the last frames).
const headTail = (t, head = 1200, tail = 400) => { t = t.trim(); return t.length <= head + tail ? t : `${t.slice(0, head)}\n[...]\n${t.slice(-tail)}`; };

// What was logged while one observation ran: new dblog rows (warning and worse), and new lines in the PHP error log.
// LOG_LIMIT lines are kept per source; the trace command raises it to keep whole backtraces.
let LOG_LIMIT = 6;
function logged(w, since) {
  const db = path.join(sitesDefault(w), 'files/.sqlite');
  let rows = [];
  if (fs.existsSync(db)) {
    const r = spawnSync(PHP, ['-n', path.join(LIB, 'watchdog.php'), db, String(since.maxwid)], { encoding: 'utf8' });
    try { rows = JSON.parse(r.stdout); } catch { rows = [{ error: r.stdout.slice(0, 300) }]; }
    if (!Array.isArray(rows)) rows = [rows];
  }
  const size = fs.existsSync(w.log) ? fs.statSync(w.log).size : 0;
  let lines = [];
  if (size > since.logsize) {
    const fd = fs.openSync(w.log, 'r'); const buf = Buffer.alloc(size - since.logsize);
    fs.readSync(fd, buf, 0, buf.length, since.logsize); fs.closeSync(fd);
    lines = buf.toString('utf8').split('\n').filter((l) => l.trim() && !/PHP (Deprecated|Notice):/.test(l)).map((l) => l.replace(/^\[[^\]]+\] /, '').slice(0, 600));
  }
  return { dblog: rows.filter((r) => r.error || r.severity <= 4).slice(0, LOG_LIMIT), php_log: lines.slice(0, LOG_LIMIT) };
}
const sinceNow = (w, maxwid) => ({ maxwid, logsize: fs.existsSync(w.log) ? fs.statSync(w.log).size : 0 });
// The first exception that was logged (dblog error rows, then the PHP error log, then a command's -v output).
function exceptionOf(...sources) {
  for (const s of sources) {
    if (!s) continue;
    // GuzzleHttp exceptions are this lab's blocked requests to drupal.org (security advisories, announcements); they are in
    // the baselines too and never the cause of a result here.
    for (const r of s.dblog || []) if (r.class && r.severity <= 3 && !r.class.startsWith('GuzzleHttp\\')) return { class: r.class, message: r.exception_message, from: 'dblog' };
    for (const l of s.php_log || []) {
      const m = l.match(/(?:PHP Fatal error:\s+)?(?:Uncaught )?([A-Z][\w\\]*(?:Exception|Error))(?::| thrown)? (.+?)(?: in \/| in [A-Z][\w\\]*->| in [a-z_]+\(\)|$)/);
      if (m) return { class: m[1], message: m[2].trim(), from: 'php error log' };
    }
    if (s.out) {
      const m = s.out.match(/\[([\w\\]+(?:Exception|Error))\]\s*\n\s*([\s\S]+?)\n\s*\n/);
      if (m) return { class: m[1], message: m[2].replace(/\s+/g, ' ').trim(), from: 'command output' };
    }
  }
  return undefined;
}

// Put the fixture (or, for a baseline, the valid extension) in place for one scenario.
function applyFixture(w, sc, baseline) {
  const parent = path.join(w.root, PARENT[sc.kind]);
  if (sc.kind === 'libraries') {
    if (baseline) { if (PLACEMENTS.libraries[sc.placement] === 'standard') placeValid(w, 'libraries'); }
    else { rm(path.join(parent, 'libfix')); copyDir(path.join(FIX, 'libraries-tarball/v2'), parent); }
    if (sc.placement.endsWith('scan-tests')) fs.appendFileSync(path.join(sitesDefault(w), 'settings.php'), "\n$settings['extension_discovery_scan_tests'] = TRUE;\n");
    return;
  }
  if (sc.placement.startsWith('uninstalled')) placeValid(w, sc.kind);
  if (baseline) return;
  const meta = JSON.parse(fs.readFileSync(path.join(FIX, sc.case, 'case.json'), 'utf8'));
  for (const rel of meta.remove[sc.kind] || []) rm(path.join(parent, rel));
  copyDir(path.join(FIX, sc.case, sc.kind), parent);
}
// Take the fixture away again: an extension that was not installed is deleted; an installed one gets its valid files back.
function removeFixture(w, sc) {
  const parent = path.join(w.root, PARENT[sc.kind]);
  for (const e of fs.readdirSync(parent)) rm(path.join(parent, e));
  if (!['standard', 'bare'].includes(PLACEMENTS[sc.kind][sc.placement])) placeValid(w, sc.kind);
}

// Install the fixture extension the way a site builder would without Drush: tick it on /admin/modules and submit, or follow
// the theme's Install link on /admin/appearance. Both go through ModuleInstaller/ThemeInstaller, which reset the extension list.
function installedNow(w, name) {
  const r = spawnSync(PHP, ['-n', '-r', 'echo json_encode(unserialize((new PDO("sqlite:" . $argv[1]))->query("SELECT data FROM config WHERE collection = \'\' AND name = \'core.extension\'")->fetchColumn(), ["allowed_classes" => FALSE]));', path.join(sitesDefault(w), 'files/.sqlite')], { encoding: 'utf8' });
  try { const d = JSON.parse(r.stdout); return (d.module || {})[name] !== undefined || (d.theme || {})[name] !== undefined; } catch { return null; }
}
async function installFromUi(w, sc, cookie) {
  const name = EXT[sc.kind];
  const base = `http://127.0.0.1:${w.port}`;
  if (sc.kind === 'theme') {
    const page = await http(w, '/admin/appearance', cookie, 'GET', true);
    const link = (page.body?.match(new RegExp(`href="([^"]*admin/appearance/install\\?[^"]*theme=${name}[^"]*)"`)) || [])[1];
    if (!link) return { status: page.status, offered: false, note: 'no Install link for the theme on /admin/appearance', error_messages: page.error_messages, installed: installedNow(w, name) };
    const r = await httpClean(w, link.replace(/&amp;/g, '&'), cookie);
    const next = r.location ? await httpClean(w, new URL(r.location, base).pathname, cookie) : undefined;
    return { status: r.status, offered: true, then: next && { status: next.status, error_messages: next.error_messages, warning_messages: next.warning_messages }, installed: installedNow(w, name) };
  }
  const page = await http(w, '/admin/modules', cookie, 'GET', true);
  const field = (n) => (page.body?.match(new RegExp(`name="${n}" value="([^"]*)"`)) || [])[1];
  const box = page.body?.match(new RegExp(`<input[^>]*name="modules\\[${name}\\]\\[enable\\]"[^>]*>`));
  if (!box) return { status: page.status, offered: false, note: `no checkbox for ${name} on /admin/modules`, error_messages: page.error_messages, installed: installedNow(w, name) };
  if (/disabled/.test(box[0])) return { status: page.status, offered: false, note: `the ${name} checkbox is disabled`, error_messages: page.error_messages, installed: installedNow(w, name) };
  const form = new URLSearchParams({ form_build_id: field('form_build_id') || '', form_token: field('form_token') || '', form_id: 'system_modules', [`modules[${name}][enable]`]: '1', op: 'Install' });
  let r;
  try {
    const res = await fetch(`${base}/admin/modules`, { method: 'POST', redirect: 'manual', headers: { cookie, 'content-type': 'application/x-www-form-urlencoded' }, body: form, signal: AbortSignal.timeout(180000) });
    const body = await res.text();
    r = { status: res.status, location: res.headers.get('location') || undefined, ...(res.status === 200 ? messages(body) : {}) };
  } catch (e) { r = { status: 0, error: String(e.message || e) }; }
  const next = r.location ? await httpClean(w, new URL(r.location, base).pathname, cookie) : undefined;
  return { status: r.status, offered: true, then: next && { status: next.status, error_messages: next.error_messages, warning_messages: next.warning_messages }, installed: installedNow(w, name) };
}

// One observation of one scenario (or of its baseline): raw facts only; judge() compares them with the baseline.
async function observe(w, sc, obs, baseline = false) {
  await stopServer(w);
  cleanExtensions(w);
  const snap = PLACEMENTS[sc.kind][sc.placement];
  const s = restore(w, snap);
  if (!['standard', 'bare'].includes(snap)) placeValid(w, sc.kind);
  applyFixture(w, sc, baseline);
  await startServer(w, sc.parser);
  const since = sinceNow(w, s.maxwid);
  if (obs === 'anon_cold') {
    await stopServer(w);
    const tables = sqlite(path.join(sitesDefault(w), 'files/.sqlite'), "SELECT group_concat(name, ' ') FROM sqlite_master WHERE type = 'table' AND name LIKE 'cache%' AND name <> 'cachetags'");
    for (const t of tables.split(' ').filter(Boolean)) sqlite(path.join(sitesDefault(w), 'files/.sqlite'), `DELETE FROM "${t}"`);
    await startServer(w, sc.parser);
    const r = await httpClean(w, '/user/login', '');
    const log = logged(w, since);
    return { ...r, emptied: tables.split(' ').filter(Boolean).length, exception: exceptionOf(log), logged: log };
  }
  const paths = { anon: '/user/login', modules: '/admin/modules', appearance: '/admin/appearance', updates: '/admin/reports/updates', status: '/admin/reports/status', updatephp: '/update.php/selection' };
  if (paths[obs]) {
    const r = await httpClean(w, paths[obs], obs === 'anon' ? '' : s.cookie);
    const log = logged(w, since);
    return { ...r, exception: exceptionOf(log), logged: log };
  }
  if (obs === 'cr') {
    const c = drupal(w, sc.parser, 'cache:rebuild');
    const log1 = logged(w, since);
    const since2 = sinceNow(w, s.maxwid);
    const f = await httpClean(w, '/user/login', '');
    const log2 = logged(w, since2);
    return { exit: c.exit, output: headTail(c.out), exception: exceptionOf({ ...log1, out: c.out }), logged: log1,
      after: { ...f, exception: exceptionOf(log2), logged: log2 } };
  }
  if (obs === 'en_self') {
    const r = await installFromUi(w, sc, s.cookie);
    const log = logged(w, since);
    return { ...r, exception: exceptionOf(log), logged: log };
  }
  if (obs === 'exin_self' || obs === 'exin_other') {
    const name = obs === 'exin_other' ? 'syslog' : EXT[sc.kind];
    const c = drupal(w, sc.parser, 'ex:install', name, '-y');
    const log = logged(w, since);
    // Then one anonymous page, then cache:rebuild and the page again: a failed install can leave the extension recorded as
    // installed, which the next page may not show (the container was not rebuilt) but the next cache rebuild does.
    const installed = installedNow(w, name);
    const since2 = sinceNow(w, s.maxwid);
    const f = await httpClean(w, '/user/login', '');
    const log2 = logged(w, since2);
    const since3 = sinceNow(w, s.maxwid);
    const c3 = drupal(w, sc.parser, 'cache:rebuild');
    const f3 = await httpClean(w, '/user/login', '');
    const log3 = logged(w, since3);
    return { command: `ex:install ${name} -y`, exit: c.exit, output: headTail(c.out), installed, exception: exceptionOf({ ...log, out: c.out }), logged: log,
      after: { ...f, exception: exceptionOf(log2), logged: log2 },
      after_rebuild: { cache_rebuild_exit: c3.exit, ...f3, exception: exceptionOf({ ...log3, out: c3.out }), logged: log3 } };
  }
  if (obs === 'en_other') {
    const c = drupal(w, sc.parser, 'recipe', path.join(RECIPES, 'install_syslog'));
    const log = logged(w, since);
    return { recipe: 'install_syslog', exit: c.exit, output: headTail(c.out), exception: exceptionOf({ ...log, out: c.out }), logged: log };
  }
  if (obs === 'recovery') {
    const c1 = drupal(w, sc.parser, 'cache:rebuild');
    const broken = await httpClean(w, '/user/login', '');
    removeFixture(w, sc);
    const before = await httpClean(w, '/user/login', '');
    const c2 = drupal(w, sc.parser, 'cache:rebuild');
    const after = await httpClean(w, '/user/login', '');
    const log = logged(w, since);
    return { broken_state: { cache_rebuild_exit: c1.exit, anon_status: broken.status }, after_removal_anon_status: before.status,
      after_removal_cache_rebuild: { exit: c2.exit, output: c2.out.trim().slice(-500) }, after_rebuild_anon_status: after.status,
      exception: exceptionOf({ ...log, out: c1.out }), logged: log };
  }
  throw new Error(`unknown observation ${obs}`);
}

// Compare one observation with its baseline. "ok" means: no difference from the valid file in the same place.
const errs = (r) => new Set([...(r.error_messages || []), ...(r.then?.error_messages || []), ...((r.logged?.dblog || []).filter((x) => x.severity <= 3).map((x) => `${x.class || x.type}: ${x.exception_message || x.text}`)), ...((r.logged?.php_log || []).filter((l) => /Fatal|Uncaught|Warning/.test(l)))]);
// Numbers are masked before comparing ("after 0 ms" and "after 1 ms" are the same error).
const norm = (set) => new Set([...set].map((e) => e.replace(/\d+/g, 'N')));
const newErrs = (r, b) => { const be = norm(errs(b || {})); return [...norm(errs(r))].filter((e) => !be.has(e)); };
function judgeHttp(r, b) {
  if (r.status === 0 || (r.status >= 500 && !(b?.status >= 500))) return 'error';
  if (b && r.status !== b.status) return `http ${r.status} (valid file: ${b.status})`;
  return newErrs(r, b).length ? 'degraded' : 'ok';
}
function judge(obs, r, b) {
  if (obs === 'cr') {
    const v = r.exit !== 0 && b?.exit === 0 ? 'error' : newErrs({ logged: r.logged }, b && { logged: b.logged }).length ? 'degraded' : 'ok';
    return { verdict: v, after_verdict: judgeHttp(r.after, b?.after) };
  }
  if (obs === 'en_other') return { verdict: r.exit !== 0 && b?.exit === 0 ? 'error' : newErrs(r, b).length ? 'degraded' : 'ok' };
  if (obs === 'exin_self' || obs === 'exin_other') {
    const after_verdict = r.after ? judgeHttp(r.after, b?.after) : undefined;
    const rebuilt = r.after_rebuild;
    if (rebuilt) rebuilt.verdict = rebuilt.cache_rebuild_exit !== 0 && b?.after_rebuild?.cache_rebuild_exit === 0 ? 'error' : judgeHttp(rebuilt, b?.after_rebuild);
    // "refused": the command stopped with its own message (exit 1, no exception, nothing installed), as the UI does when it
    // does not offer the extension. "error": an exception or a fatal error (exit 255) ended the command.
    if (r.exit !== 0 && b?.exit === 0) return { verdict: r.exit === 1 && !r.exception && !r.installed ? 'refused' : 'error', after_verdict };
    if (b?.installed && !r.installed) return { verdict: 'not installed', after_verdict };
    return { verdict: newErrs(r, b).length ? 'degraded' : 'ok', after_verdict };
  }
  if (obs === 'en_self') {
    if (r.status === 0 || r.status >= 500 || r.then?.status >= 500) return { verdict: 'error' };
    if (b?.installed && !r.offered) return { verdict: 'not offered' };
    if (b?.installed && !r.installed) return { verdict: 'not installed' };
    if (!b?.installed && r.installed) return { verdict: 'installed (valid file: not installed)' };
    return { verdict: newErrs(r, b).length ? 'degraded' : 'ok' };
  }
  if (obs === 'recovery') {
    const recovered = r.after_removal_cache_rebuild.exit === 0 && r.after_rebuild_anon_status === (b?.after_rebuild_anon_status ?? 200);
    const brokeIt = r.broken_state.cache_rebuild_exit !== 0 || r.broken_state.anon_status >= 500;
    return { verdict: !brokeIt ? 'not broken' : !recovered ? 'does not recover' : r.after_removal_anon_status === 200 ? 'recovers without rebuild' : 'recovers after cache:rebuild' };
  }
  return { verdict: judgeHttp(r, b) };
}

function scenarios() {
  const cases = JSON.parse(fs.readFileSync(path.join(FIX, 'index.json'), 'utf8'));
  const out = [];
  for (const parser of list('parsers') || ['symfony', 'pecl']) {
    for (const c of cases) for (const kind of c.kinds) for (const placement of Object.keys(PLACEMENTS[kind])) out.push({ case: c.id, kind, placement, parser });
    for (const placement of Object.keys(PLACEMENTS.libraries)) out.push({ case: 'libraries-tarball', kind: 'libraries', placement, parser });
  }
  const f = { cases: list('cases'), kinds: list('kinds'), placements: list('placements') };
  return out.filter((s) => (!f.cases || f.cases.includes(s.case)) && (!f.kinds || f.kinds.includes(s.kind)) && (!f.placements || f.placements.includes(s.placement)));
}
function observationsFor(sc) {
  const all = list('observations') || Object.keys(OBSERVATIONS);
  return all.filter((o) => !['en_self', 'exin_self'].includes(o) || (['uninstalled', 'uninstalled-no-update', 'contrib', 'contrib-scan-tests'].includes(sc.placement) && sc.kind !== 'profile'));
}

async function prepare(w) {
  const t0 = Date.now();
  fs.mkdirSync(w.base, { recursive: true });
  buildDocroot(w);
  rm(w.snaps); fs.mkdirSync(w.snaps, { recursive: true });
  const say = (m) => console.log(`[w${w.i}] ${m} (${Math.round((Date.now() - t0) / 1000)}s)`);
  const must = (r, what) => { if (r.exit !== 0) throw new Error(`${what} failed (exit ${r.exit}):\n${r.out.slice(-1500)}`); return r; };
  const install = (profile) => {
    resetSite(w);
    // The install command prints the password; it never reaches a log or an error message from here.
    const password = crypto.randomBytes(18).toString('hex');
    const r = drupal(w, 'symfony', 'install', profile, '--site-name', 'info-yml lab', '--password', password);
    must({ ...r, out: r.out.split(password).join('[redacted]') }, `install ${profile}`);
    fs.chmodSync(sitesDefault(w), 0o755); fs.chmodSync(path.join(sitesDefault(w), 'settings.php'), 0o644);
    fs.appendFileSync(path.join(sitesDefault(w), 'settings.php'), SETTINGS);
  };
  const login = async () => {
    await startServer(w, 'symfony');
    const p = spawnSync(PHP, [...phpFlags('symfony', w.log), path.join(LIB, 'login-path.php'), w.root], { cwd: w.root, encoding: 'utf8' });
    if (p.status !== 0) throw new Error(`login-path.php failed: ${p.stdout}${p.stderr}`);
    const r = await http(w, p.stdout.trim(), '');
    const cookie = (r.cookie || []).map((c) => c.split(';')[0]).find((c) => /^S?SESS/.test(c));
    if (!cookie) throw new Error(`one-time login did not set a session cookie (status ${r.status})`);
    const check = await http(w, '/admin/modules', cookie);
    if (check.status !== 200) throw new Error(`logged-in GET /admin/modules returned ${check.status}`);
    return cookie;
  };
  // Not /admin/reports/updates or /admin/reports/status: visiting those makes Update try to fetch release data. /user/login
  // is requested anonymously: with the session cookie it only redirects, and its page and block caches stay empty.
  // snapshot() stops the server, so start it here, and fail on anything but 200: an unanswered warm-up leaves cold caches.
  const warm = async (cookie) => {
    await startServer(w, 'symfony');
    for (const [p, c] of [['/user/login', ''], ['/admin/modules', cookie], ['/admin/appearance', cookie]]) {
      const r = await http(w, p, c);
      if (r.status !== 200) throw new Error(`warm-up GET ${p} returned ${r.status}${r.error ? ` (${r.error})` : ''}`);
    }
  };

  // The installer installs Update by default (InstallCommand: enable_update_status_module), so 'standard' has it and
  // 'bare' is the same site with Update uninstalled.
  cleanExtensions(w);
  install('standard');
  must(drupal(w, 'symfony', 'cache:rebuild'), 'cache:rebuild');
  const cookie = await login();
  await warm(cookie);
  await snapshot(w, 'standard', cookie); say('standard');
  must(run(w, 'symfony', [path.join(LIB, 'uninstall-module.php'), w.root, 'update']), 'uninstall update');
  must(drupal(w, 'symfony', 'cache:rebuild'), 'cache:rebuild');
  await warm(cookie);
  await snapshot(w, 'bare', cookie); say('bare (Update uninstalled)');

  for (const [name, kind, recipe] of [['module-installed', 'module', 'install_infofix'], ['theme-installed', 'theme', 'install_infofix_theme'], ['libfix-installed', 'libraries', 'install_libfix']]) {
    await stopServer(w); cleanExtensions(w); restore(w, 'standard'); placeValid(w, kind);
    // The recipe command only sees extensions known to the cached extension list, so rebuild first.
    must(drupal(w, 'symfony', 'cache:rebuild'), 'cache:rebuild');
    must(drupal(w, 'symfony', 'recipe', path.join(RECIPES, recipe)), `recipe ${recipe}`);
    must(drupal(w, 'symfony', 'cache:rebuild'), 'cache:rebuild');
    await warm(cookie);
    await snapshot(w, name, cookie); say(name);
  }

  await stopServer(w);
  cleanExtensions(w); placeValid(w, 'profile');
  install('infofix_profile');
  must(drupal(w, 'symfony', 'cache:rebuild'), 'cache:rebuild');
  const pcookie = await login();
  await warm(pcookie);
  await snapshot(w, 'profile-installed', pcookie); say('profile-installed');
  await stopServer(w);
  cleanExtensions(w); resetSite(w);
}

function environment() {
  const v = (a) => spawnSync(PHP, a, { encoding: 'utf8' }).stdout.trim();
  const git = (...a) => spawnSync('git', ['-C', CORE, ...a], { encoding: 'utf8' }).stdout.trim();
  const drupalVersion = (fs.readFileSync(path.join(CORE, 'core/lib/Drupal.php'), 'utf8').match(/const VERSION = '([^']+)'/) || [])[1];
  return {
    drupal: { version: drupalVersion, commit: git('rev-parse', 'HEAD'), commit_date: git('log', '-1', '--format=%cI'), subject: git('log', '-1', '--format=%s'),
      source: git('remote', 'get-url', 'origin'), note: 'GitHub read-only mirror of git.drupalcode.org/project/drupal (drupal.org unreachable from the lab container)' },
    php: { version: v(['-n', '-r', 'echo PHP_VERSION;']), binary: PHP, pecl_yaml: v(['-n', '-d', `extension=${YAML_EXT}`, '-r', 'echo phpversion("yaml") ?: "not available";']),
      symfony_yaml: (JSON.parse(fs.readFileSync(path.join(CORE, 'vendor/composer/installed.json'), 'utf8')).packages.find((p) => p.name === 'symfony/yaml') || {}).version },
    drush: 'not used (owner: git checkout of core, no Drush); core/scripts/dr and the UI stand in, see observations',
    server: 'PHP built-in web server (php -S) with core/.ht.router.php, SQLite database, one worker process',
    os: `${os.type()} ${os.release()} ${os.arch()}`, node: process.version,
    lab_commit: spawnSync('git', ['-C', labRoot, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).stdout.trim(),
  };
}

async function runMatrix() {
  const all = scenarios();
  const resultsFile = path.join(OUT, 'results.json');
  const prior = fs.existsSync(resultsFile) ? JSON.parse(fs.readFileSync(resultsFile, 'utf8')) : {};
  const byId = new Map((prior.scenarios || []).map((s) => [s.id, s]));
  // --rebaseline measures every baseline again; --rebaseline=exin_self,exin_other only those observations' baselines.
  const rebase = list('rebaseline');
  const baselines = args.includes('--rebaseline') ? {} : Object.fromEntries(Object.entries(prior.baselines || {}).filter(([k]) => !rebase?.includes(k.split('/').pop())));
  const workers = Array.from({ length: WORKERS }, (_, i) => worker(i));
  for (const w of workers) if (!fs.existsSync(path.join(w.snaps, 'profile-installed/cookie.txt'))) { console.error(`Worker ${w.i} is not prepared. Run: node scripts/info-yml-repro.mjs prepare --workers=${WORKERS}`); process.exit(3); }
  const t0 = Date.now();
  const save = () => {
    fs.mkdirSync(OUT, { recursive: true });
    const scenariosOut = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
    writeResults(resultsFile, { generated: new Date().toISOString(), environment: environment(), observations: OBSERVATIONS, placements: PLACEMENT_NOTES, baselines, scenarios: scenariosOut });
  };
  const pool = async (items, fn) => { const q = [...items]; await Promise.all(workers.map(async (w) => { while (q.length) await fn(w, q.shift()); })); };

  // 1. Baselines: each observation with the valid extension in each place, per parser.
  const keyOf = (sc, o) => `${sc.kind}/${sc.placement}/${sc.parser}/${o}`;
  const needed = new Map();
  for (const sc of all) for (const o of observationsFor(sc)) if (!baselines[keyOf(sc, o)]) needed.set(keyOf(sc, o), { sc: { ...sc, case: '(valid)' }, o });
  await pool([...needed.entries()], async (w, [k, { sc, o }]) => {
    try { baselines[k] = scrub(await observe(w, sc, o, true)); } catch (e) { baselines[k] = { error: String(e.stack || e).slice(0, 800) }; }
  });
  if (needed.size) { console.log(`Baselines measured: ${needed.size} (${Math.round((Date.now() - t0) / 1000)}s)`); save(); }

  // 2. The fixtures.
  let done = 0;
  await pool(all, async (w, sc) => {
    const id = `${sc.case}/${sc.kind}/${sc.placement}/${sc.parser}`;
    const results = {};
    for (const o of observationsFor(sc)) {
      try { const r = scrub(await observe(w, sc, o)); results[o] = { ...judge(o, r, baselines[keyOf(sc, o)]), ...r }; }
      catch (e) { results[o] = { verdict: 'runner error', error: String(e.stack || e).slice(0, 800) }; }
    }
    // Merge per observation, so a run limited with --observations keeps the other observations already recorded.
    const before = byId.get(id);
    byId.set(id, { id, ...sc, measured: new Date().toISOString(), results: { ...(before?.results || {}), ...results } });
    done++;
    console.log(`[w${w.i}] ${done}/${all.length} ${id}: ${Object.entries(results).map(([k, r]) => `${k}=${r.verdict}${r.after_verdict && r.after_verdict !== 'ok' ? `>${r.after_verdict}` : ''}`).join(' ')} (${Math.round((Date.now() - t0) / 1000)}s)`);
    if (done % 10 === 0) save();
  });
  for (const w of workers) { await stopServer(w); cleanExtensions(w); resetSite(w); }
  save();
  writeReport();
}

// results.json is written compactly: one scenario or baseline per line (diffable), without timings, empty lists, or dblog
// text that only repeats the exception class and message. It is still several megabytes: 752 scenarios of up to 11
// observations each, plus 252 baselines.
function lean(v) {
  if (Array.isArray(v)) return v.map(lean);
  if (!v || typeof v !== 'object') return v;
  const out = {};
  for (const [k, x] of Object.entries(v)) {
    if (k === 'ms' || x === undefined || x === null || (Array.isArray(x) && !x.length)) continue;
    if (k === 'logged') {
      const dblog = (x.dblog || []).map((r) => { const { text, backtrace, ...rest } = r; return r.class ? rest : { ...rest, text: (text || '').slice(0, 400) }; });
      const php_log = (x.php_log || []).map((l) => l.slice(0, 300));
      if (dblog.length || php_log.length) out.logged = { ...(dblog.length ? { dblog } : {}), ...(php_log.length ? { php_log } : {}) };
      continue;
    }
    out[k] = lean(x);
  }
  return out;
}
function writeResults(file, data) {
  const { scenarios = [], baselines = {}, ...head } = data;
  const lines = [JSON.stringify(head).slice(0, -1) + ',"baselines":{'];
  lines.push(Object.entries(baselines).map(([k, b]) => `${JSON.stringify(k)}:${JSON.stringify(lean(b))}`).join(',\n'));
  lines.push('},"scenarios":[');
  lines.push(scenarios.map((x) => JSON.stringify(lean(x))).join(',\n'));
  lines.push(']}');
  fs.writeFileSync(file, lines.join('\n') + '\n');
}

// RESULTS.md: one table per kind and placement, one row per case, one column per observation (Symfony YAML runs), and the
// cells where the PECL YAML runs differ.
const short = (e) => (e ? ` ${e.class.split('\\').pop()}` : '');
function cell(o, r) {
  if (!r) return '';
  if (r.verdict === 'runner error') return 'runner error';
  if (o === 'cr') return r.verdict === 'ok' && r.after_verdict === 'ok' ? 'ok' : `${r.verdict === 'ok' ? 'ok' : `${r.verdict} (exit ${r.exit})${short(r.exception)}`}; then ${r.after_verdict === 'ok' ? 'ok' : `${r.after.status}${short(r.after.exception)}`}`;
  if (o === 'recovery') return r.verdict;
  if (o === 'exin_self' || o === 'exin_other') {
    const first = r.verdict === 'ok' ? 'ok' : `${r.verdict} (exit ${r.exit})${short(r.exception)}`;
    const then = !r.after_verdict || r.after_verdict === 'ok' ? '' : `; then ${r.after.status}${short(r.after.exception)}`;
    const ar = r.after_rebuild;
    const rebuilt = !ar || ar.verdict === 'ok' ? '' : `; after cr: ${ar.cache_rebuild_exit !== 0 ? `cr exit ${ar.cache_rebuild_exit}, ` : ''}${ar.status}${short(ar.exception)}`;
    return first + then + rebuilt;
  }
  if (o === 'en_other') return r.verdict === 'ok' ? 'ok' : `${r.verdict} (exit ${r.exit})${short(r.exception)}`;
  if (o === 'en_self') return r.verdict === 'ok' ? 'ok' : `${r.verdict}${short(r.exception)}`;
  return r.verdict === 'ok' ? 'ok' : r.verdict === 'error' ? `${r.status}${short(r.exception)}` : `${r.verdict}${short(r.exception)}`;
}
function writeReport() {
  const data = JSON.parse(fs.readFileSync(path.join(OUT, 'results.json'), 'utf8'));
  const env = data.environment;
  const obsKeys = Object.keys(data.observations);
  const sc = data.scenarios;
  const L = [];
  L.push('# info.yml Phase 1 results: what a broken info file does to a Drupal 12 site', '');
  L.push(`Generated ${data.generated} by \`node scripts/info-yml-repro.mjs\`. Machine-readable: [results.json](results.json). Fixtures: [tests/info-yml/fixtures/](${link('tests/info-yml/fixtures')}/). **DRAFT until a person has reviewed it.**`, '');
  L.push('| | |', '|---|---|');
  L.push(`| Drupal | ${env.drupal.version} at \`${env.drupal.commit.slice(0, 12)}\` (${env.drupal.commit_date}), "${env.drupal.subject}", from ${env.drupal.source} |`);
  L.push(`| PHP | ${env.php.version} (${env.php.binary}); PECL yaml ${env.php.pecl_yaml}; symfony/yaml ${env.php.symfony_yaml} |`);
  L.push(`| Drush | ${env.drush} |`, `| Server | ${env.server} |`, `| OS, Node | ${env.os}; Node ${env.node} |`, `| Lab commit | ${env.lab_commit} |`, '');
  L.push('## How to read the tables', '');
  L.push('Each observation starts from a restored database snapshot with the fixture freshly applied; none depends on another. Each is compared with a baseline: the same observation with the valid extension in the same place.', '');
  L.push('- `ok`: no difference from the valid file.', '- `degraded`: the page or command completed, but an error was shown or logged that the valid file does not produce.', '- `NNN Class`: HTTP status NNN (500 and above where the valid file gave 200) and the short name of the exception that was logged.', '- `error (exit N)`: a command failed where it succeeds with the valid file.', '- `cr`: the cache rebuild, then `; then` the anonymous request that follows it.', '- `recovery`: `not broken` means the cache rebuild and the following request both still worked with the fixture in place, so there was nothing to recover from.', '');
  L.push('Observations:', '');
  for (const k of obsKeys) L.push(`- \`${k}\`: ${data.observations[k].label}`);
  L.push('', 'Placements:', '');
  for (const [k, v] of Object.entries(data.placements || {})) L.push(`- \`${k}\`: ${v}`);
  L.push('');
  const groups = [...new Set(sc.map((s) => `${s.kind}/${s.placement}`))].sort((a, b) => Object.keys(data.placements).indexOf(a) - Object.keys(data.placements).indexOf(b));
  // Summary: per case and placement, how many observations differ from the valid file, and whether the cache rebuild fails.
  const summaryCell = (r) => {
    if (!r) return '';
    const obs = Object.entries(r.results);
    const bad = obs.filter(([k, x]) => k !== 'recovery' && (x.verdict !== 'ok' || (x.after_verdict && x.after_verdict !== 'ok')));
    if (!bad.length) return 'no effect';
    const cr = r.results.cr && r.results.cr.verdict === 'error' ? '; cr fails' : '';
    const cold = r.results.anon_cold && r.results.anon_cold.verdict !== 'ok' ? '; cold: visitors 500' : '';
    const anon = r.results.anon && r.results.anon.verdict !== 'ok' ? '; warm: visitors 500' : '';
    const rec = r.results.recovery && r.results.recovery.verdict === 'does not recover' ? '; does not recover' : '';
    return `${bad.length} of ${obs.length - (r.results.recovery ? 1 : 0)} differ${cr}${cold}${anon}${rec}`;
  };
  const cases = [...new Set(sc.map((s) => s.case))];
  L.push('## Summary (Symfony YAML)', '', 'Per case and placement: how many observations (recovery not counted) differ from the valid file in the same place. `cr fails`: core/scripts/dr cache:rebuild fails. `cold: visitors 500`: an anonymous visitor gets an error after the cache tables are emptied. `warm: visitors 500`: the same with warm caches. `does not recover`: the site still fails after the fixture is removed and caches are rebuilt. Details per observation follow.', '');
  L.push(`| case | ${groups.join(' | ')} |`, `|---|${groups.map(() => '---').join('|')}|`);
  for (const c of cases) L.push(`| ${c} | ${groups.map((g) => summaryCell(sc.find((s) => s.case === c && `${s.kind}/${s.placement}` === g && s.parser === 'symfony'))).join(' | ')} |`);
  L.push('');
  for (const g of groups) {
    const rows = sc.filter((s) => `${s.kind}/${s.placement}` === g && s.parser === 'symfony');
    if (!rows.length) continue;
    const cols = obsKeys.filter((k) => rows.some((r) => r.results[k]));
    L.push(`## ${g} (Symfony YAML)`, '', `| case | ${cols.join(' | ')} |`, `|---|${cols.map(() => '---').join('|')}|`);
    for (const r of rows) L.push(`| ${r.case} | ${cols.map((k) => cell(k, r.results[k])).join(' | ')} |`);
    L.push('');
  }
  const diffs = [];
  for (const s of sc.filter((x) => x.parser === 'pecl')) {
    const twin = sc.find((x) => x.parser === 'symfony' && x.case === s.case && x.kind === s.kind && x.placement === s.placement);
    if (!twin) continue;
    for (const k of Object.keys(s.results)) {
      const a = cell(k, twin.results[k]), b = cell(k, s.results[k]);
      const ea = twin.results[k].exception?.message, eb = s.results[k].exception?.message;
      if (a !== b) diffs.push(`| ${s.case} | ${s.kind}/${s.placement} | ${k} | ${a} | ${b} |`);
      else if (ea && eb && ea !== eb && k === 'modules') diffs.push(`| ${s.case} | ${s.kind}/${s.placement} | ${k} (message only) | ${ea.slice(0, 120).replace(/\|/g, '\\|')} | ${eb.slice(0, 120).replace(/\|/g, '\\|')} |`);
    }
  }
  L.push('## Where PECL YAML differs from Symfony YAML', '');
  if (diffs.length) {
    const byCase = new Map();
    for (const row of diffs) {
      const c = row.split(' | ')[0].slice(2), wording = row.includes('(message only)');
      const e = byCase.get(c) || { outcome: 0, wording: 0 };
      e[wording ? 'wording' : 'outcome']++;
      byCase.set(c, e);
    }
    L.push('One row per case. "Outcome" counts observations whose verdict differs; "wording" counts /admin/modules results where both parsers fail but the exception message differs. The summary cells are for the module placements. Every differing cell is in results.json.', '');
    L.push('| case | outcome | wording | module/uninstalled, Symfony | module/uninstalled, PECL | module/installed, Symfony | module/installed, PECL |', '|---|---|---|---|---|---|---|');
    const pick = (c, pl, parser) => summaryCell(sc.find((s) => s.case === c && s.kind === 'module' && s.placement === pl && s.parser === parser));
    for (const [c, n] of byCase) L.push(`| ${c} | ${n.outcome} | ${n.wording} | ${pick(c, 'uninstalled', 'symfony')} | ${pick(c, 'uninstalled', 'pecl')} | ${pick(c, 'installed', 'symfony')} | ${pick(c, 'installed', 'pecl')} |`);
  }
  else L.push(sc.some((x) => x.parser === 'pecl') ? 'No differences.' : 'No PECL YAML runs recorded.');
  L.push('', '## Exceptions by case', '', 'The first exception logged in any observation of the case, per parser.', '', '| case | parser | exception class | message |', '|---|---|---|---|');
  const seen = new Set();
  for (const s of sc) {
    for (const r of Object.values(s.results)) {
      for (const e of [r.exception, r.after?.exception]) {
        if (!e) continue;
        const key = `${s.case}|${s.parser}|${e.class}|${e.message}`;
        if (seen.has(key)) continue;
        seen.add(key);
        L.push(`| ${s.case} | ${s.parser} | \`${e.class}\` | ${String(e.message).replace(/\|/g, '\\|').slice(0, 240)} |`);
      }
    }
  }
  fs.writeFileSync(path.join(OUT, 'RESULTS.md'), L.join('\n') + '\n');
  console.log(`Wrote ${path.relative(labRoot, path.join(OUT, 'RESULTS.md'))}`);
}

if (VARIANT && cmd !== 'variant' && !fs.existsSync(CORE)) { console.error(`${CORE} does not exist. Set the variant up first: node scripts/info-yml-repro.mjs variant --variant=${VARIANT} --patch=<file>`); process.exit(3); }
if (VARIANT) fs.mkdirSync(OUT, { recursive: true });
if (cmd === 'prepare') {
  if (!fs.existsSync(path.join(CORE, 'vendor/autoload.php'))) { console.error(`${CORE} has no vendor/. Run composer install there first.`); process.exit(3); }
  const only = opt('only');
  const ws = only !== undefined ? [worker(Number(only))] : Array.from({ length: WORKERS }, (_, i) => worker(i));
  await Promise.all(ws.map((w) => prepare(w).catch(async (e) => { await stopServer(w); console.error(`[w${w.i}] ${String(e.stack || e)}`); process.exitCode = 1; })));
} else if (cmd === 'run') {
  await runMatrix();
} else if (cmd === 'trace') {
  // One observation of one scenario, printing every logged row with its backtrace: for finding where an exception is thrown.
  const w = worker(Number(opt('only', '0'))), sc = scenarios()[0], o = (list('observations') || ['modules'])[0];
  if (!sc) { console.error('trace: the filters match no scenario'); process.exit(2); }
  LOG_LIMIT = 400;
  const r = await observe(w, sc, o);
  const full = spawnSync(PHP, ['-n', path.join(LIB, 'watchdog.php'), path.join(sitesDefault(w), 'files/.sqlite'), String(restoreInfo(w, sc).maxwid), 'full'], { encoding: 'utf8' });
  console.log(JSON.stringify(scrub({ scenario: sc, observation: o, status: r.status ?? r.exit, exception: r.exception, php_log: r.logged?.php_log }), null, 1));
  if (r.output) console.log(scrub(`\n--- command output (start and end)\n${r.output}`));
  for (const row of JSON.parse(full.stdout || '[]')) if (row.backtrace) console.log(scrub(`\n--- dblog ${row.wid}: ${row.class}: ${row.exception_message}\n${row.backtrace}`));
  await stopServer(w); cleanExtensions(w); resetSite(w);
} else if (cmd === 'profile-recovery') {
  // Why the installed-profile cases do not recover once the file is back: step by step, reading the stored extension path
  // names in state (ExtensionList::getPathNames() stores them under system.<type>.files; only reset() deletes them).
  // Breaks the profile's info file by renaming it (the filename-hyphen case), restores it, then tries one repair.
  const w = worker(Number(opt('only', '3')));
  const db = () => path.join(sitesDefault(w), 'files/.sqlite');
  const stateKeys = () => sqlite(db(), "SELECT value FROM key_value WHERE collection = 'state' AND name = 'system.profile.files'");
  const profiles = () => { const v = stateKeys(); if (!v) return '(not stored)'; const m = [...v.matchAll(/s:\d+:"([a-z_]+)";s:\d+:"[^"]+\.info\.yml"/g)].map((x) => x[1]); return m.length ? m.join(', ') : v.slice(0, 120); };
  const info = path.join(w.root, 'profiles/custom/infofix_profile/infofix_profile.info.yml');
  const renamed = path.join(w.root, 'profiles/custom/infofix_profile/info-fix_profile.info.yml');
  const steps = [];
  const step = async (label, fn) => { const r = await fn(); const anon = await httpClean(w, '/user/login', ''); steps.push({ step: label, ...r, anon_status: anon.status, profiles_in_state: profiles() }); console.log(`${label}: ${JSON.stringify(r)}; GET /user/login ${anon.status}; system.profile.files lists: ${profiles()}`); };
  await stopServer(w); cleanExtensions(w); restore(w, 'profile-installed'); placeValid(w, 'profile');
  await startServer(w, 'symfony');
  await step('1. snapshot, valid profile', async () => ({}));
  fs.renameSync(info, renamed);
  await step('2. info file renamed (not yet rebuilt)', async () => ({}));
  await step('3. cache:rebuild with the file renamed', async () => ({ cache_rebuild_exit: drupal(w, 'symfony', 'cache:rebuild').exit }));
  fs.renameSync(renamed, info);
  await step('4. info file restored', async () => ({}));
  await step('5. cache:rebuild with the file restored', async () => ({ cache_rebuild_exit: drupal(w, 'symfony', 'cache:rebuild').exit }));
  await stopServer(w);
  sqlite(db(), "DELETE FROM key_value WHERE collection = 'state' AND name = 'system.profile.files'");
  await startServer(w, 'symfony');
  await step('6. state system.profile.files deleted by hand', async () => ({}));
  await step('7. cache:rebuild after that', async () => ({ cache_rebuild_exit: drupal(w, 'symfony', 'cache:rebuild').exit }));
  await stopServer(w); cleanExtensions(w); resetSite(w);
  fs.writeFileSync(path.join(OUT, 'profile-recovery.json'), JSON.stringify({ generated: new Date().toISOString(), environment: environment(), steps }, null, 1) + '\n');
  console.log(`Wrote ${path.relative(labRoot, path.join(OUT, 'profile-recovery.json'))}`);
} else if (cmd === 'lint') {
  requireYaml();
  // Phase 3: every fixture through a patched core's ex:validate (reports/info-yml/patches/ex-validate.patch), with each
  // parser, compared with what the fixture did to a site in Phase 1 (results.json). --core= is the patched checkout.
  const core = LINTER_CORE;
  if (!fs.existsSync(path.join(core, 'core/lib/Drupal/Core/Extension/Command/ExtensionValidateCommand.php'))) {
    console.error(`${core} does not have the ex:validate command. Apply reports/info-yml/patches/ex-validate.patch to a core checkout and pass --core=.`);
    process.exit(3);
  }
  const phase1 = JSON.parse(fs.readFileSync(path.join(BASE_OUT, 'results.json'), 'utf8')).scenarios;
  // What a fixture did to a site, over every placement of its kind (Symfony YAML, which a host without PECL YAML uses).
  // A file that breaks the site only where the extension is installed is reported as a warning: without a site the linter
  // cannot know what is installed (--strict makes warnings fail).
  const effectIn = (rs) => {
    const bad = (k) => rs.some(([o, r]) => o === k && r.verdict !== 'ok' && r.verdict !== 'not broken');
    if (bad('cr') || bad('anon_cold') || rs.some(([o, r]) => o === 'cr' && r.after_verdict && r.after_verdict !== 'ok')) return 'site breaks';
    if (rs.some(([o, r]) => !['en_self', 'exin_self', 'recovery'].includes(o) && r.verdict !== 'ok')) return 'pages fail';
    if (bad('en_self') || bad('exin_self')) return 'cannot be installed';
    return 'no effect';
  };
  const effect = (c, kind) => {
    const of = (installed) => effectIn(phase1.filter((s) => s.case === c && s.kind === kind && s.parser === 'symfony' && (s.placement === 'installed') === installed).flatMap((s) => Object.entries(s.results)));
    const uninstalled = of(false), installed = of(true);
    return uninstalled !== 'site breaks' && installed === 'site breaks' ? 'site breaks if installed' : uninstalled !== 'no effect' ? uninstalled : installed;
  };
  // Effects the linter cannot see without a site: whether a dependency exists.
  const KNOWN_MISSES = { 'dependency-missing': 'whether a dependency exists needs the list of available extensions, which needs a site' };
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'info-yml-lint-'));
  const validate = (dir, parser, extra = []) => {
    const r = spawnSync(PHP, ['-n', '-d', 'memory_limit=1G', ...(parser === 'pecl' ? ['-d', `extension=${YAML_EXT}`] : []), 'core/scripts/dr', 'ex:validate', dir, '--format=json', ...extra], { cwd: core, encoding: 'utf8' });
    try { return { exit: r.status, ...JSON.parse(r.stdout) }; } catch { return { exit: r.status, error: `${r.stdout}${r.stderr}`.slice(0, 500) }; }
  };
  const rows = [];
  const cases = JSON.parse(fs.readFileSync(path.join(FIX, 'index.json'), 'utf8'));
  for (const c of cases) {
    const meta = JSON.parse(fs.readFileSync(path.join(FIX, c.id, 'case.json'), 'utf8'));
    for (const kind of c.kinds) {
      const dir = path.join(tmp, c.id, kind), parent = path.join(dir, PARENT[kind]);
      fs.mkdirSync(parent, { recursive: true });
      copyDir(path.join(FIX, '_valid', kind), parent);
      for (const rel of meta.remove[kind] || []) rm(path.join(parent, rel));
      copyDir(path.join(FIX, c.id, kind), parent);
      const files = meta.files[kind].map((f) => `${PARENT[kind]}/${f}`);
      const before = effect(c.id, kind);
      for (const parser of ['symfony', 'pecl']) {
        const r = validate(dir, parser);
        const findings = (r.violations || []).map((v) => ({ ...v, file: path.relative(dir, v.file.startsWith('/') ? v.file : path.join(core, v.file)) }));
        const onFile = findings.filter((v) => files.includes(v.file) || meta.remove[kind]?.length);
        const errors = onFile.filter((v) => v.severity === 'error').length, warnings = onFile.length - errors;
        let pass, why;
        if (before === 'site breaks') { pass = errors > 0; why = 'needs an error on the fixture file'; }
        else if (before === 'site breaks if installed') { pass = onFile.length > 0; why = 'needs a finding; an error only where the linter can know the extension is installed'; }
        else if (before === 'no effect') { pass = findings.every((v) => v.severity !== 'error'); why = 'no errors allowed'; }
        else { pass = onFile.length > 0 || Boolean(KNOWN_MISSES[c.id]); why = KNOWN_MISSES[c.id] ? `known limit: ${KNOWN_MISSES[c.id]}` : 'needs a finding on the fixture file'; }
        rows.push({ case: c.id, kind, parser, before, exit: r.exit, errors, warnings, rules: [...new Set(findings.map((v) => `${v.rule}${v.line ? ':' + v.line : ''}`))], findings, pass, why, error: r.error });
      }
    }
  }
  // The Libraries-style project (#3190825): tests/ fixtures are skipped by default, as by extension discovery.
  const libDir = path.join(tmp, 'libraries-tarball');
  copyDir(path.join(FIX, 'libraries-tarball/v2'), path.join(libDir, 'modules/contrib'));
  for (const [placement, extra] of [['contrib', []], ['contrib-scan-tests', ['--include-tests']]]) {
    const before = phase1.filter((s) => s.case === 'libraries-tarball' && s.placement === placement && s.parser === 'symfony').flatMap((s) => Object.values(s.results)).some((r) => r.verdict === 'error') ? 'site breaks' : 'no effect';
    for (const parser of ['symfony', 'pecl']) {
      const r = validate(libDir, parser, extra);
      const findings = (r.violations || []).map((v) => ({ ...v, file: path.relative(libDir, v.file) }));
      const errors = findings.filter((v) => v.severity === 'error').length;
      rows.push({ case: 'libraries-tarball', kind: placement, parser, before, exit: r.exit, errors, warnings: findings.length - errors, rules: [...new Set(findings.map((v) => `${v.rule} ${v.file.replace('modules/contrib/', '')}`))], findings, pass: before === 'site breaks' ? errors > 0 : errors === 0, why: extra.length ? 'with --include-tests, as a site with extension_discovery_scan_tests' : 'tests/ skipped, as by extension discovery' });
    }
  }
  rm(tmp);
  const git = (...a) => spawnSync('git', ['-C', core, ...a], { encoding: 'utf8' }).stdout.trim();
  const out = { generated: new Date().toISOString(), core: { path: path.relative(labRoot, core), commit: git('rev-parse', 'HEAD'), base: git('rev-parse', 'HEAD~1'), subject: git('log', '-1', '--format=%s') }, php: spawnSync(PHP, ['-n', '-r', 'echo PHP_VERSION;'], { encoding: 'utf8' }).stdout, rows };
  fs.writeFileSync(path.join(OUT, 'lint-results.json'), JSON.stringify(out, null, 1) + '\n');
  const failed = rows.filter((r) => !r.pass);
  const L = ['# Phase 3: the linter on every fixture, compared with Phase 1', ''];
  L.push(`Generated ${out.generated} by \`node scripts/info-yml-repro.mjs lint\`, with \`core/scripts/dr ex:validate --format=json\` from ${out.core.path} at \`${out.core.commit.slice(0, 12)}\` ("${out.core.subject}", on \`${out.core.base.slice(0, 12)}\`), PHP ${out.php}. Machine-readable: [lint-results.json](lint-results.json). **DRAFT until a person has reviewed it.**`, '');
  L.push('"Before" is what the fixture did to a Drupal 12 site in Phase 1 (Symfony YAML, every placement of the kind; see RESULTS.md): `site breaks` (cache rebuild or cold-cache visitors fail, installed or not), `site breaks if installed` (only where the extension was installed), `pages fail`, `cannot be installed`, or `no effect`. "After" is what the linter reports for the same files, with each parser.', '');
  L.push('A row passes when a file that breaks the site has an error; a file that breaks the site only when installed, or has a narrower effect, has a finding; and a file with no effect has no error (warnings there are advisory). Without a site the linter cannot know what is installed, so a file that breaks only an installed extension (a renamed profile info file, a missing base theme) is a warning; `--strict` makes warnings fail the command.', '');
  L.push(`Result: ${rows.length - failed.length} of ${rows.length} rows pass.${failed.length ? ` Failing: ${failed.map((r) => `${r.case}/${r.kind}/${r.parser}`).join(', ')}.` : ''}`, '');
  L.push('| case | kind | before (site) | after: Symfony YAML host | after: PECL YAML host | pass |', '|---|---|---|---|---|---|');
  const cellOf = (r) => (r.errors || r.warnings ? `${r.errors} error(s), ${r.warnings} warning(s): ${r.rules.join(', ')}` : 'clean') + (r.exit !== (r.errors ? 1 : 0) ? ` (exit ${r.exit})` : '');
  for (const r of rows.filter((x) => x.parser === 'symfony')) {
    const p = rows.find((x) => x.case === r.case && x.kind === r.kind && x.parser === 'pecl');
    const known = r.pass && p.pass && !r.errors && !r.warnings && KNOWN_MISSES[r.case] && r.before !== 'no effect';
    L.push(`| ${r.case} | ${r.kind} | ${r.before} | ${cellOf(r)} | ${cellOf(p)} | ${r.pass && p.pass ? (known ? `yes, as a known limit: ${KNOWN_MISSES[r.case]}` : 'yes') : `NO (${r.why})`} |`);
  }
  fs.writeFileSync(path.join(OUT, 'LINT.md'), L.join('\n') + '\n');
  console.log(`${rows.length - failed.length} of ${rows.length} rows pass. Wrote ${path.relative(labRoot, path.join(OUT, 'LINT.md'))}`);
  for (const r of failed) console.log(`  FAIL ${r.case}/${r.kind}/${r.parser}: before ${r.before}; ${cellOf(r)}; ${r.why}${r.error ? `; ${r.error}` : ''}`);
  process.exitCode = failed.length ? 1 : 0;
} else if (cmd === 'false-positives') {
  requireYaml();
  // Phase 3: the linter on code that works, which should give no errors: core itself, and contributed projects developed on
  // GitHub (packages.drupal.org was unreachable from the lab container). --repos=owner/name,... (shallow clones in
  // envs/info-yml-contrib/, not executed: the linter only reads and tokenizes files).
  const core = LINTER_CORE;
  const repos = list('repos') || ['farmOS/farmOS', 'goalgorilla/open_social', 'localgovdrupal/localgov', 'drupal-graphql/graphql', 'Gizra/og', 'thunder/thunder-distribution'];
  const dir = path.join(labRoot, 'envs/info-yml-contrib');
  fs.mkdirSync(dir, { recursive: true });
  // Files in core/ that git does not track (a PHPStan cache in core/phpstan-tmp/ once added 493 PHP files to the count).
  const untracked = spawnSync('git', ['-C', core, 'status', '--porcelain', '--ignored', '--', 'core'], { encoding: 'utf8' }).stdout.trim().split('\n').filter(Boolean);
  if (untracked.length) console.warn(`Not tracked by git in ${core}/core, and checked too:\n${untracked.join('\n')}`);
  const targets = [{ name: 'drupal core (the patched checkout)', path: path.join(core, 'core'), url: 'https://github.com/drupal/drupal', commit: spawnSync('git', ['-C', core, 'rev-parse', 'HEAD~1'], { encoding: 'utf8' }).stdout.trim(), untracked }];
  for (const repo of repos) {
    const target = path.join(dir, repo.replace('/', '__'));
    if (!fs.existsSync(target)) spawnSync('git', ['clone', '-q', '--depth', '1', `https://github.com/${repo}`, target], { stdio: 'inherit', env: { ...process.env, GIT_LFS_SKIP_SMUDGE: '1' } });
    const commit = spawnSync('git', ['-C', target, 'log', '-1', '--format=%H %cs'], { encoding: 'utf8' }).stdout.trim();
    targets.push({ name: repo, path: target, url: `https://github.com/${repo}`, commit });
  }
  const rows = [];
  for (const t of targets) {
    for (const parser of ['symfony', 'pecl']) {
      const r = spawnSync(PHP, ['-n', '-d', 'memory_limit=2G', ...(parser === 'pecl' ? ['-d', `extension=${YAML_EXT}`] : []), 'core/scripts/dr', 'ex:validate', t.path, '--format=json'], { cwd: core, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
      let data;
      try { data = JSON.parse(r.stdout); } catch { data = { error: `${r.stdout}${r.stderr}`.slice(0, 500), violations: [] }; }
      const violations = data.violations.map((v) => ({ ...v, file: v.file.replace(`${t.path}/`, '') }));
      const byRule = {};
      for (const v of violations) byRule[`${v.severity} ${v.rule}`] = (byRule[`${v.severity} ${v.rule}`] || 0) + 1;
      rows.push({ target: t.name, url: t.url, commit: t.commit, untracked: t.untracked, parser, exit: r.status, checked: data.checked, errors: data.errors, warnings: data.warnings, by_rule: byRule, violations, error: data.error });
    }
  }
  fs.writeFileSync(path.join(OUT, 'false-positives.json'), JSON.stringify({ generated: new Date().toISOString(), core: path.relative(labRoot, core), rows }, null, 1) + '\n');
  const L = ['# Phase 3: false-positive check', '', `Generated ${new Date().toISOString()} by \`node scripts/info-yml-repro.mjs false-positives\`, with the patched core's \`core/scripts/dr ex:validate\` (default exclusions: tests/ skipped, as by extension discovery). Machine-readable: [false-positives.json](false-positives.json). **DRAFT until a person has reviewed it.**`, ''];
  L.push('Contributed projects come from their GitHub repositories at the commit shown (development branches, not drupal.org release packages, which were unreachable). Every finding is listed, so each can be judged.', '');
  L.push(untracked.length ? `Core's counts include files git does not track: ${untracked.map((u) => `\`${u}\``).join(', ')}.` : 'Core\'s counts are of tracked files only: `git status --ignored` listed nothing under core/ (the core commit shown is the parent of the patch commit).', '');
  L.push('| project | commit | parser | info files | PHP files | errors | warnings | findings by rule |', '|---|---|---|---|---|---|---|---|');
  for (const r of rows) L.push(`| [${r.target}](${r.url}) | ${r.commit.split(' ')[0].slice(0, 10)} | ${r.parser} | ${r.checked?.info ?? '?'} | ${r.checked?.php ?? '?'} | ${r.errors ?? '?'} | ${r.warnings ?? '?'} | ${Object.entries(r.by_rule).map(([k, n]) => `${k}: ${n}`).join(', ') || 'none'}${r.error ? ` (failed: ${r.error})` : ''} |`);
  L.push('', '## Every finding (Symfony YAML)', '');
  for (const r of rows.filter((x) => x.parser === 'symfony' && x.violations.length)) {
    L.push(`### ${r.target}`, '');
    for (const v of r.violations) L.push(`- \`${v.file}${v.line ? ':' + v.line : ''}\` ${v.severity} [${v.rule}] ${v.message.replace(/\|/g, '\\|')}`);
    L.push('');
  }
  fs.writeFileSync(path.join(OUT, 'FALSE-POSITIVES.md'), L.join('\n') + '\n');
  for (const r of rows) console.log(`${r.target} (${r.parser}): ${r.checked?.info} info, ${r.checked?.php} PHP; ${r.errors} error(s), ${r.warnings} warning(s) ${JSON.stringify(r.by_rule)}`);
} else if (cmd === 'planted') {
  requireYaml();
  // Phase 3: errors planted in real core files, in a copy of the patched checkout (a git worktree of its HEAD, with vendor/
  // hard-linked from it), then checked in full and with --changed. Each run should report what the same run reported before
  // planting (nothing for core itself; core's deliberately invalid test fixtures with --include-tests), plus each planted
  // problem, and nothing else. The copy is removed afterwards.
  const core = LINTER_CORE;
  const copy = path.join(labRoot, 'envs/info-yml-planted');
  const git = (...a) => spawnSync('git', ['-C', core, ...a], { encoding: 'utf8' });
  const removeCopy = () => { git('worktree', 'remove', '--force', copy); rm(copy); git('worktree', 'prune'); };
  removeCopy();
  if (git('worktree', 'add', '-q', '--detach', copy, 'HEAD').status !== 0) { console.error(`Could not add a worktree of ${core}.`); process.exit(3); }
  spawnSync('cp', ['-al', path.join(core, 'vendor'), path.join(copy, 'vendor')]);
  const lineOf = (text, re) => text.split('\n').findIndex((l) => re.test(l)) + 1;
  // Each plant: the file, what is done to it, and the finding expected: [rule, line, severity], and in which runs.
  const plants = [
    { file: 'core/modules/node/node.info.yml', how: 'an unquoted colon in the description',
      edit: (t) => t.replace(/^description: .*$/m, 'description: Manages content: the main site content.'), expect: (t) => ['info.yaml', lineOf(t, /^description:/), 'error'] },
    { file: 'core/themes/default_admin/default_admin.info.yml', how: 'a tab instead of two spaces before a list item',
      edit: (t) => t.replace(/^ {2}- /m, '\t- '), expect: (t) => ['info.tab', lineOf(t, /^\t/), 'error'] },
    { file: 'core/modules/views/views.info.yml', how: 'type: modul (a typo)',
      edit: (t) => t.replace(/^type: module$/m, 'type: modul'), expect: (t) => ['info.type', lineOf(t, /^type:/), 'error'] },
    { file: 'core/profiles/standard/standard.info.yml', how: 'the type line deleted',
      edit: (t) => t.replace(/^type: profile\n/m, ''), expect: () => ['info.parser', null, 'error'] },
    { file: 'core/modules/field_ui/field_ui.info.yml', how: 'a dependency indented one space too far, so YAML joins it to the item above',
      edit: (t) => t.replace(/^( {2}- drupal:field)$/m, '$1\n   - drupal:text'), expect: (t) => ['info.dependency', lineOf(t, /^ {2}- drupal:field$/), 'warning'] },
    // Not below core/: InfoParserDynamic gives core's extensions a default core_version_requirement (InfoParserDynamic.php:70).
    { file: 'modules/custom/planted_new/planted_new.info.yml', how: 'a new, untracked custom module without core_version_requirement', create: true,
      edit: () => 'name: Planted\ntype: module\n', expect: () => ['info.parser', null, 'error'] },
    { file: 'core/modules/user/user.module', how: 'a function with a missing parenthesis, appended',
      edit: (t) => `${t}\nfunction user_planted( {\n}\n`, expect: (t) => ['php.syntax', lineOf(t, /^function user_planted\(/), 'error'] },
    { file: 'core/modules/system/tests/modules/common_test/common_test.info.yml', how: 'an unquoted colon, in a test module', only: 'include-tests',
      edit: (t) => t.replace(/^description: .*$/m, 'description: Support: common tests.'), expect: (t) => ['info.yaml', lineOf(t, /^description:/), 'error'] },
    { file: 'core/modules/text/text.module', how: 'a parameter declared twice (a compile-time error, not a parse error)', only: 'php-lint',
      edit: (t) => `${t}\nfunction text_planted($a, $a) {\n}\n`, expect: (t) => ['php.lint', lineOf(t, /^function text_planted\(/), 'error'] },
  ];
  const runs = [
    { name: 'full', args: ['core', 'modules'] },
    { name: 'full --include-tests', args: ['core', 'modules', '--include-tests'], with: 'include-tests' },
    { name: 'full --php-lint', args: ['core', 'modules', '--php-lint'], with: 'php-lint' },
    { name: '--changed', args: ['core', 'modules', '--changed'] },
  ];
  const validate = (parser, extra) => {
    const r = spawnSync(PHP, ['-n', '-d', 'memory_limit=2G', ...(parser === 'pecl' ? ['-d', `extension=${YAML_EXT}`] : []), 'core/scripts/dr', 'ex:validate', ...extra, '--format=json'], { cwd: copy, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    try { return { exit: r.status, ...JSON.parse(r.stdout) }; } catch { return { exit: r.status, error: `${r.stdout}${r.stderr}`.slice(0, 500), violations: [] }; }
  };
  const key = (v) => `${v.file}|${v.rule}|${v.line ?? ''}|${v.severity}`;
  const out = { generated: new Date().toISOString(), core: path.relative(labRoot, core), commit: git('rev-parse', 'HEAD').stdout.trim(), plants: [], runs: [] };
  const before = {};
  try {
    for (const run of runs) for (const parser of ['symfony', 'pecl']) before[`${run.name}/${parser}`] = validate(parser, run.args);
    for (const p of plants) {
      const file = path.join(copy, p.file);
      const text = p.edit(p.create ? '' : fs.readFileSync(file, 'utf8'));
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, text);
      const [rule, line, severity] = p.expect(text);
      out.plants.push({ file: p.file, how: p.how, only: p.only, expected: { file: p.file, rule, line, severity } });
    }
    for (const run of runs) for (const parser of ['symfony', 'pecl']) {
      const r = validate(parser, run.args);
      const b = before[`${run.name}/${parser}`];
      const expected = out.plants.filter((p) => !p.only || p.only === run.with).map((p) => p.expected);
      const found = new Set(r.violations.map(key));
      const want = new Set([...expected, ...b.violations].map(key));
      out.runs.push({ run: run.name, parser, before: { exit: b.exit, checked: b.checked, errors: b.errors, warnings: b.warnings, findings: b.violations.map((v) => `${v.file}:${v.line ?? ''} ${v.severity} [${v.rule}]`), error: b.error },
        exit: r.exit, checked: r.checked, errors: r.errors, warnings: r.warnings, error: r.error, missed: expected.filter((v) => !found.has(key(v))), unexpected: r.violations.filter((v) => !want.has(key(v))),
        pass: !r.error && !b.error && r.exit === 1 && [...want].every((k) => found.has(k)) && r.violations.every((v) => want.has(key(v))) });
    }
  } finally { removeCopy(); }
  fs.writeFileSync(path.join(OUT, 'planted.json'), JSON.stringify(out, null, 1) + '\n');
  const L = ['# Phase 3: errors planted in core', '', `Generated ${out.generated} by \`node scripts/info-yml-repro.mjs planted\`, with the patched core's \`core/scripts/dr ex:validate\` at \`${out.commit.slice(0, 12)}\`. Machine-readable: [planted.json](planted.json). **DRAFT until a person has reviewed it.**`, ''];
  L.push('Method: a git worktree of the patched checkout (a copy of the repository: tracked files only), each run once as is, then again after the changes below. A run passes when it exits 1 and reports exactly what it reported before, plus each planted problem at its file, rule, line and severity, and nothing else. The copy is deleted afterwards.', '');
  L.push('| planted in | change | expected finding | expected in runs |', '|---|---|---|---|');
  for (const p of out.plants) L.push(`| \`${p.file}\` | ${p.how} | ${p.expected.severity} [${p.expected.rule}]${p.expected.line ? ` line ${p.expected.line}` : ''} | ${p.only ? `only with --${p.only}` : 'all'} |`);
  const counts = (x) => `exit ${x.exit}; ${x.checked?.info ?? '?'} info, ${x.checked?.php ?? '?'} PHP; ${x.errors ?? '?'} errors, ${x.warnings ?? '?'} warnings`;
  L.push('', '| run | parser | before planting | after planting | missed | unexpected | result |', '|---|---|---|---|---|---|---|');
  for (const r of out.runs) L.push(`| \`ex:validate ${runs.find((x) => x.name === r.run).args.join(' ')}\` | ${r.parser} | ${counts(r.before)} | ${counts(r)} | ${r.missed.map((v) => `${v.file} [${v.rule}]`).join(', ') || 'none'} | ${r.unexpected.map((v) => `${v.file}:${v.line ?? ''} [${v.rule}]`).join(', ') || 'none'} | ${r.pass ? 'pass' : `**fail**${r.error || r.before.error ? ` (${r.error || r.before.error})` : ''}`} |`);
  const pre = out.runs.find((r) => r.run === 'full --include-tests' && r.parser === 'symfony')?.before.findings || [];
  if (pre.length) L.push('', `Before planting, \`--include-tests\` reports core's test fixtures that are invalid on purpose (each is a true finding): ${pre.map((f) => `\`${f}\``).join(', ')}.`);
  L.push('', 'Not covered by the default run, by design: test modules (extension discovery skips tests/ unless `extension_discovery_scan_tests` is set) and compile-time PHP errors (the built-in check tokenizes only; `--php-lint` runs `php -l`).', '');
  fs.writeFileSync(path.join(OUT, 'PLANTED.md'), L.join('\n') + '\n');
  for (const r of out.runs) console.log(`${r.run} (${r.parser}): exit ${r.exit}, ${r.errors} error(s), ${r.warnings} warning(s), missed ${r.missed.length}, unexpected ${r.unexpected.length}: ${r.pass ? 'pass' : 'FAIL'}`);
  if (out.runs.some((r) => !r.pass)) process.exitCode = 1;
} else if (cmd === 'deploy-gate') {
  // Phase 3: the deploy-gate examples in tests/info-yml/deploy-gate/, run in a scratch site with the Composer project layout
  // (git and composer.json at the top, the Drupal root in web/). web/ is an export of the patched checkout's tracked files,
  // with its vendor/ hard-linked. Custom code is committed; contributed code is git-ignored, as Composer installs it. The
  // example workflow's two ex:validate steps run as written; its checkout, setup-php and composer install steps do not.
  const yaml = loadYaml();
  if (!yaml) { console.error('js-yaml is not installed. Run: npm install --prefix tools/compare/.deps js-yaml@4'); process.exit(2); }
  const core = LINTER_CORE;
  const gate = path.join(labRoot, 'tests/info-yml/deploy-gate');
  const site = path.join(labRoot, 'envs/info-yml-site');
  const web = path.join(site, 'web');
  const workflow = yaml.load(fs.readFileSync(path.join(gate, 'extension-files.yml'), 'utf8'));
  const steps = workflow.jobs['ex-validate'].steps.filter((st) => st.run?.includes('ex:validate'));
  const scripts = JSON.parse(fs.readFileSync(path.join(gate, 'composer-scripts.json'), 'utf8')).scripts;
  // Commands run with this lab's PHP first in PATH, so "php" in the workflow and Composer's "@php" are PHP 8.5.
  // As root (this lab's container), Composer refuses to run scripts unless COMPOSER_ALLOW_SUPERUSER=1; the site has no plugins.
  const asRoot = process.getuid?.() === 0;
  const env = { ...process.env, PATH: PHP.includes('/') ? `${path.dirname(path.resolve(PHP))}:${process.env.PATH}` : process.env.PATH, COMPOSER_NO_INTERACTION: '1', ...(asRoot ? { COMPOSER_ALLOW_SUPERUSER: '1' } : {}) };
  const sh = (command, extra = {}) => spawnSync('bash', ['-e', '-c', command], { cwd: site, encoding: 'utf8', env: { ...env, ...extra }, maxBuffer: 64 * 1024 * 1024 });
  const write = (rel, text) => { fs.mkdirSync(path.dirname(path.join(site, rel)), { recursive: true }); fs.writeFileSync(path.join(site, rel), text); };
  const info = (name, type) => `name: ${name}\ntype: ${type}\ncore_version_requirement: ^12\n${type === 'theme' ? 'base theme: false\n' : ''}`;
  const git = (...a) => spawnSync('git', ['-C', site, '-c', 'user.name=Lab', '-c', 'user.email=lab@example.com', ...a], { encoding: 'utf8' });
  rm(site);
  fs.mkdirSync(web, { recursive: true });
  if (spawnSync('sh', ['-c', 'git -C "$0" archive HEAD | tar -x -C "$1"', core, web]).status !== 0) { console.error(`Could not export ${core}.`); process.exit(3); }
  spawnSync('cp', ['-al', path.join(core, 'vendor'), path.join(web, 'vendor')]);
  write('composer.json', JSON.stringify({ name: 'lab/info-yml-site', description: 'Scratch site for the deploy-gate examples', type: 'project', require: {}, scripts }, null, 2) + '\n');
  write('.gitignore', '/vendor/\n/web/core/\n/web/vendor/\n/web/modules/contrib/\n/web/themes/contrib/\n');
  write('web/modules/custom/site_custom/site_custom.info.yml', info('Site custom', 'module'));
  write('web/modules/custom/site_custom/site_custom.module', '<?php\n\n/**\n * @file\n * Site custom.\n */\n');
  write('web/themes/custom/site_theme/site_theme.info.yml', info('Site theme', 'theme'));
  write('web/modules/contrib/site_contrib/site_contrib.info.yml', info('Site contrib', 'module'));
  // A site commits composer.lock; without one, "composer install" runs as an update and fires post-update-cmd instead.
  sh('composer update --no-scripts --no-progress');
  git('init', '-q', '-b', 'main'); git('add', '.'); git('commit', '-q', '-m', 'Site');
  git('update-ref', 'refs/remotes/origin/main', 'HEAD');
  const stepCommand = (name) => steps.find((st) => st.name === name);
  const runStep = (name) => { const st = stepCommand(name); const extra = Object.fromEntries(Object.entries(st.env || {}).map(([k, v]) => [k, String(v).replace('${{ github.base_ref }}', 'main')])); return { command: st.run, env: extra, ...sh(st.run, extra) }; };
  const checks = [
    { state: 'clean site', run: () => runStep('Check all extension files'), expect: 0 },
    { state: 'clean site', run: () => runStep('Check changed extension files'), expect: 0 },
    { state: 'clean site', run: () => ({ command: 'composer lint:extensions', ...sh('composer lint:extensions') }), expect: 0, files: [] },
    { state: 'a branch adds a broken custom module and breaks a committed .module file', setup: () => {
      write('web/modules/custom/site_broken/site_broken.info.yml', 'name: Site broken\ntype: module\ncore_version_requirement: ^12\ndescription: Broken: yes\n');
      fs.appendFileSync(path.join(site, 'web/modules/custom/site_custom/site_custom.module'), '\nfunction site_custom_help( {\n}\n');
    }, run: () => runStep('Check changed extension files'), expect: 1, files: ['modules/custom/site_broken/site_broken.info.yml', 'modules/custom/site_custom/site_custom.module'] },
    { state: 'same', run: () => runStep('Check all extension files'), expect: 1, files: ['modules/custom/site_broken/site_broken.info.yml', 'modules/custom/site_custom/site_custom.module'] },
    { state: 'same', run: () => ({ command: 'composer lint:extensions', ...sh('composer lint:extensions') }), expect: 1, files: ['modules/custom/site_broken/site_broken.info.yml', 'modules/custom/site_custom/site_custom.module'] },
    { state: 'same', run: () => ({ command: 'composer run-script post-install-cmd', ...sh('composer run-script post-install-cmd') }), expect: 1, files: ['modules/custom/site_broken/site_broken.info.yml', 'modules/custom/site_custom/site_custom.module'] },
    { state: 'same', run: () => ({ command: 'composer install --no-progress', ...sh('composer install --no-progress') }), expect: 1, files: ['modules/custom/site_broken/site_broken.info.yml', 'modules/custom/site_custom/site_custom.module'] },
    { state: 'custom code restored; a contributed module (git-ignored) loses its type line, as from a broken release', setup: () => {
      rm(path.join(site, 'web/modules/custom/site_broken')); git('checkout', '-q', '--', 'web/modules/custom/site_custom/site_custom.module');
      write('web/modules/contrib/site_contrib/site_contrib.info.yml', 'name: Site contrib\ncore_version_requirement: ^12\n');
    }, run: () => runStep('Check all extension files'), expect: 1, files: ['modules/contrib/site_contrib/site_contrib.info.yml'] },
    { state: 'same', run: () => runStep('Check changed extension files'), expect: 0, note: 'expected: git does not track contributed code, so --changed cannot see it' },
  ];
  const rows = [];
  try {
    for (const c of checks) {
      c.setup?.();
      const r = c.run();
      const files = [...new Set([...`${r.stdout}`.matchAll(/^(\S+?):(?:\d+:)? (?:error|warning) \[/gm)].map((m) => m[1]))].sort();
      const pass = r.status === c.expect && (!c.files || JSON.stringify(files) === JSON.stringify([...c.files].sort()));
      rows.push({ state: c.state, command: r.command, env: r.env, expect: c.expect, exit: r.status, files, expected_files: c.files, note: c.note, output: `${r.stdout}${r.stderr}`.trim().split('\n').slice(-8).join('\n'), pass });
    }
  } finally { rm(site); }
  fs.writeFileSync(path.join(OUT, 'deploy-gate.json'), JSON.stringify({ generated: new Date().toISOString(), core: path.relative(labRoot, core), commit: spawnSync('git', ['-C', core, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim(), rows }, null, 1) + '\n');
  const L = ['# Phase 3: deploy-gate examples, tested', '', `Generated ${new Date().toISOString()} by \`node scripts/info-yml-repro.mjs deploy-gate\`, with the patched core at \`${path.relative(labRoot, core)}\`. Machine-readable: [deploy-gate.json](deploy-gate.json). **DRAFT until a person has reviewed it.**`, ''];
  L.push('The examples are [tests/info-yml/deploy-gate/extension-files.yml](' + link('tests/info-yml/deploy-gate/extension-files.yml') + ') (GitHub Actions) and [composer-scripts.json](' + link('tests/info-yml/deploy-gate/composer-scripts.json') + ') (Composer scripts). They ran in a scratch site with the Composer project layout: git and composer.json at the top, the Drupal root in `web/`, custom code committed, contributed code git-ignored. The workflow\'s two `ex:validate` steps ran as written, with `BASE=main`; its checkout, setup-php and composer install steps did not run, and nothing ran on GitHub.' + (asRoot ? ' This lab runs as root, so Composer ran with `COMPOSER_ALLOW_SUPERUSER=1`; without it, Composer refuses to run scripts as root non-interactively.' : ''), '');
  L.push('| site state | command | expected exit | exit | files reported | result |', '|---|---|---|---|---|---|');
  for (const r of rows) L.push(`| ${r.state} | \`${r.command}\` | ${r.expect} | ${r.exit} | ${r.files.map((f) => `\`${f}\``).join(', ') || 'none'} | ${r.pass ? 'pass' : '**fail**'}${r.note ? ` (${r.note})` : ''} |`);
  L.push('', 'What the rows show:', '');
  L.push('- `--changed` reported a new, untracked module and a changed committed file. Git\'s top is above the Drupal root here, which is the layout the `--changed` fix in the patch covers.');
  L.push('- With the `post-install-cmd` hook, `composer install` itself exits 1 when an extension file has an error, which stops a deployment script that checks exit codes. It does not undo the install: the files are already on disk. (The scratch site requires no packages and commits its composer.lock, so this install downloaded nothing and fired `post-install-cmd`.)');
  L.push('- Only the full check sees a broken contributed release. Use it before every deployment; `--changed` is a fast check for pull requests.', '');
  fs.writeFileSync(path.join(OUT, 'DEPLOY-GATE.md'), L.join('\n') + '\n');
  for (const r of rows) console.log(`${r.pass ? 'pass' : 'FAIL'} exit ${r.exit} (expected ${r.expect}) ${r.command} [${r.files.join(', ')}]`);
  if (rows.some((r) => !r.pass)) process.exitCode = 1;
} else if (cmd === 'variant') {
  // A variant: a git worktree of the baseline core checkout at its HEAD, with one proposed patch committed on top and
  // vendor/ hard-linked, so the same fixtures can measure the patch. --patch=<file>: a git diff or git format-patch file
  // (download a drupal.org patch or merge request diff first). Then: prepare, run, report and compare with --variant=.
  if (!VARIANT) { console.error('usage: node scripts/info-yml-repro.mjs variant --variant=<name> --patch=<file> [--base=envs/info-yml-main]'); process.exit(2); }
  const patch = opt('patch') && path.resolve(opt('patch'));
  if (!patch || !fs.existsSync(patch)) { console.error('--patch=<file> is required and must exist.'); process.exit(2); }
  const base = path.resolve(labRoot, opt('base', 'envs/info-yml-main'));
  if (fs.existsSync(CORE)) { console.error(`${CORE} exists already. Remove it first: git -C ${base} worktree remove --force ${CORE}`); process.exit(3); }
  const git = (dir, ...a) => spawnSync('git', ['-C', dir, '-c', 'user.name=Lab', '-c', 'user.email=lab@example.com', ...a], { encoding: 'utf8' });
  const added = git(base, 'worktree', 'add', '-q', '--detach', CORE, 'HEAD');
  if (added.status !== 0) { console.error(added.stderr); process.exit(3); }
  const applied = git(CORE, 'apply', '--index', patch);
  if (applied.status !== 0) { console.error(`The patch does not apply to ${base} at ${git(base, 'rev-parse', '--short', 'HEAD').stdout.trim()}:\n${applied.stderr}`); git(base, 'worktree', 'remove', '--force', CORE); process.exit(1); }
  const touched = git(CORE, 'diff', '--cached', '--name-only').stdout.trim().split('\n');
  git(CORE, 'commit', '-q', '-m', `Variant ${VARIANT}: ${path.basename(patch)}`);
  spawnSync('cp', ['-al', path.join(base, 'vendor'), path.join(CORE, 'vendor')]);
  fs.copyFileSync(patch, path.join(OUT, path.basename(patch)));
  const record = { name: VARIANT, patch: path.basename(patch), sha256: crypto.createHash('sha256').update(fs.readFileSync(patch)).digest('hex'), base: path.relative(labRoot, base), base_commit: git(CORE, 'rev-parse', 'HEAD~1').stdout.trim(), commit: git(CORE, 'rev-parse', 'HEAD').stdout.trim(), files: touched, created: new Date().toISOString() };
  fs.writeFileSync(path.join(OUT, 'variant.json'), JSON.stringify(record, null, 1) + '\n');
  if (touched.some((f) => /(^|\/)composer\.(json|lock)$/.test(f))) console.warn('The patch changes composer.json or composer.lock: vendor/ is the baseline\'s. Run composer install in the variant if the change matters.');
  console.log(`Variant ${VARIANT}: ${path.relative(labRoot, CORE)} at ${record.commit.slice(0, 12)} (${touched.length} file(s) changed). Next:`);
  for (const step of [`prepare --variant=${VARIANT} --workers=N`, `run --variant=${VARIANT} --workers=N [filters]`, `compare --variant=${VARIANT}`]) console.log(`  node scripts/info-yml-repro.mjs ${step}`);
} else if (cmd === 'compare') {
  // Every result of a variant that differs from the baseline (reports/info-yml/results.json) for the same scenario and
  // observation. Verdicts compare each with its own baseline (the valid file on the same core), so a change here is the
  // patch's effect on how a broken file behaves.
  if (!VARIANT) { console.error('usage: node scripts/info-yml-repro.mjs compare --variant=<name>'); process.exit(2); }
  const before = JSON.parse(fs.readFileSync(path.join(BASE_OUT, 'results.json'), 'utf8'));
  const after = JSON.parse(fs.readFileSync(path.join(OUT, 'results.json'), 'utf8'));
  const record = fs.existsSync(path.join(OUT, 'variant.json')) ? JSON.parse(fs.readFileSync(path.join(OUT, 'variant.json'), 'utf8')) : {};
  const byId = new Map(before.scenarios.map((x) => [x.id, x]));
  const clean = (r) => !r || ((r.verdict === 'ok' || r.verdict === 'not broken') && (!r.after_verdict || r.after_verdict === 'ok') && (!r.after_rebuild || r.after_rebuild.verdict === 'ok'));
  const rows = [];
  let compared = 0;
  for (const sc of after.scenarios) {
    const b = byId.get(sc.id);
    if (!b) continue;
    for (const [o, r] of Object.entries(sc.results)) {
      const p = b.results[o];
      if (!p) continue;
      compared++;
      const was = cell(o, p), now = cell(o, r);
      if (was !== now) rows.push({ id: sc.id, observation: o, before: was, after: now, change: clean(r) && !clean(p) ? 'now as with a valid file' : !clean(r) && clean(p) ? 'now differs from a valid file' : 'differs in another way' });
    }
  }
  const count = (k) => rows.filter((r) => r.change === k).length;
  fs.writeFileSync(path.join(OUT, 'compare.json'), JSON.stringify({ generated: new Date().toISOString(), variant: record, compared, rows }, null, 1) + '\n');
  const L = [`# Variant ${VARIANT} compared with the baseline`, ''];
  L.push(`Generated ${new Date().toISOString()} by \`node scripts/info-yml-repro.mjs compare --variant=${VARIANT}\`. Patch: [${record.patch}](${record.patch}) (sha256 \`${(record.sha256 || '').slice(0, 16)}\`), committed on \`${(record.base_commit || '').slice(0, 12)}\`. Variant results: [RESULTS.md](RESULTS.md); baseline: [RESULTS.md](${link('reports/info-yml/RESULTS.md')}). Machine-readable: [compare.json](compare.json). **DRAFT until a person has reviewed it.**`, '');
  L.push(`${compared} results were measured on both; ${rows.length} ${rows.length === 1 ? 'differs' : 'differ'}: ${count('now as with a valid file')} now as with a valid file, ${count('now differs from a valid file')} now differ from a valid file, ${count('differs in another way')} differ in another way. Each verdict compares the broken file with a valid file on the same core, so a difference can be the intended effect (for example, refusing to install an incompatible extension).`, '');
  if (rows.length) {
    L.push('| scenario | observation | baseline | variant | change |', '|---|---|---|---|---|');
    for (const r of rows) L.push(`| ${r.id} | ${r.observation} | ${r.before} | ${r.after} | ${r.change} |`);
  }
  fs.writeFileSync(path.join(OUT, 'COMPARE.md'), L.join('\n') + '\n');
  console.log(`${compared} compared, ${rows.length} differ (${count('now as with a valid file')} now as with a valid file, ${count('now differs from a valid file')} now differ from one, ${count('differs in another way')} other). Wrote ${path.relative(labRoot, path.join(OUT, 'COMPARE.md'))}`);
} else if (cmd === 'sweep') {
  // Parser level only: every fixture info file through core's InfoParserDynamic, with each parser (tests/info-yml/lib/parse-sweep.php).
  const out = {};
  for (const parser of ['symfony', 'pecl']) {
    const r = spawnSync(PHP, ['-n', ...(parser === 'pecl' ? ['-d', `extension=${YAML_EXT}`] : []), path.join(LIB, 'parse-sweep.php'), CORE, FIX], { encoding: 'utf8' });
    out[parser] = JSON.parse(r.stdout);
  }
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'parser-sweep.json'), JSON.stringify({ generated: new Date().toISOString(), environment: environment(), ...out }, null, 1) + '\n');
  console.log(`Wrote ${path.relative(labRoot, path.join(OUT, 'parser-sweep.json'))}: ${out.symfony.results.length} files`);
} else if (cmd === 'feed-control') {
  // Control for #3451701 (remote data, not a local file): a release-history feed whose libfix release has an invalid
  // core_compatibility, fetched by cron, then the update report and the status report. Baseline: the same with ^12.
  // Runs on its own worker (--only=N, default 3, prepared with: prepare --only=3), served by a local feed server. The core feed
  // lists 12.0-dev, the version a git checkout reports: ProjectCoreCompatibility checks nothing unless the installed core
  // version is in the feed (getPossibleCoreUpdateVersions()).
  const w = worker(Number(opt('only', '3')));
  const feedPort = Number(opt('feed-port', '8899'));
  const feeds = (constraint) => ({
    drupal: `<?xml version="1.0" encoding="utf-8"?>\n<project xmlns:dc="http://purl.org/dc/elements/1.1/">\n <title>Drupal</title>\n <short_name>drupal</short_name>\n <dc:creator>Drupal</dc:creator>\n <supported_branches>12.0.</supported_branches>\n <project_status>published</project_status>\n <link>https://example.com/project/drupal</link>\n <terms><term><name>Projects</name><value>Drupal project</value></term></terms>\n <releases>\n  <release>\n   <name>Drupal 12.0.0</name>\n   <version>12.0.0</version>\n   <status>published</status>\n   <release_link>https://example.com/drupal-12-0-0-release</release_link>\n   <download_link>https://example.com/drupal-12-0-0.tar.gz</download_link>\n   <date>1790000000</date>\n   <terms><term><name>Release type</name><value>New features</value></term></terms>\n  </release>\n  <release>\n   <name>Drupal 12.0-dev</name>\n   <version>12.0-dev</version>\n   <status>published</status>\n   <release_link>https://example.com/drupal-12-0-dev-release</release_link>\n   <download_link>https://example.com/drupal-12-0-dev.tar.gz</download_link>\n   <date>1789000000</date>\n   <terms><term><name>Release type</name><value>New features</value></term></terms>\n  </release>\n </releases>\n</project>\n`,
    libfix: `<?xml version="1.0" encoding="utf-8"?>\n<project xmlns:dc="http://purl.org/dc/elements/1.1/">\n <title>Libraries-style fixture</title>\n <short_name>libfix</short_name>\n <dc:creator>Lab</dc:creator>\n <supported_branches>1.</supported_branches>\n <project_status>published</project_status>\n <link>https://example.com/project/libfix</link>\n <terms><term><name>Projects</name><value>Modules</value></term></terms>\n <releases>\n  <release>\n   <name>libfix 1.1.0</name>\n   <version>1.1.0</version>\n   <core_compatibility>${constraint}</core_compatibility>\n   <status>published</status>\n   <release_link>https://example.com/libfix-1-1-0-release</release_link>\n   <download_link>https://example.com/libfix-1.1.0.tar.gz</download_link>\n   <date>1790000000</date>\n   <terms><term><name>Release type</name><value>Bug fixes</value></term></terms>\n  </release>\n  <release>\n   <name>libfix 1.0.0</name>\n   <version>1.0.0</version>\n   <core_compatibility>^12</core_compatibility>\n   <status>published</status>\n   <release_link>https://example.com/libfix-1-0-0-release</release_link>\n   <download_link>https://example.com/libfix-1.0.0.tar.gz</download_link>\n   <date>1780000000</date>\n   <terms><term><name>Release type</name><value>New features</value></term></terms>\n  </release>\n </releases>\n</project>\n`,
  });
  const http_ = await import('node:http');
  let current = feeds('^12'); const hits = [];
  const server = http_.createServer((req, res) => {
    hits.push(req.url);
    const m = req.url.match(/^\/release-history\/(\w+)\/current/);
    if (m && current[m[1]]) { res.writeHead(200, { 'content-type': 'application/xml' }); res.end(current[m[1]]); } else { res.writeHead(404); res.end(); }
  });
  await new Promise((r) => server.listen(feedPort, '127.0.0.1', r));
  const out = { generated: new Date().toISOString(), issue: 'https://www.drupal.org/project/drupal/issues/3451701', variants: {} };
  for (const [label, constraint] of [['valid', '^12'], ['invalid', '^12 ||| banana']]) {
    current = feeds(constraint); hits.length = 0;
    await stopServer(w); cleanExtensions(w);
    const s = restore(w, 'libfix-installed');
    placeValid(w, 'libraries');
    fs.appendFileSync(path.join(w.root, 'modules/contrib/libfix/libfix.info.yml'), "project: 'libfix'\n");
    fs.appendFileSync(path.join(sitesDefault(w), 'settings.php'), `\n$config['update.settings']['fetch']['url'] = 'http://127.0.0.1:${feedPort}/release-history';\n`);
    await startServer(w, 'symfony');
    const since = sinceNow(w, s.maxwid);
    const key = spawnSync(PHP, ['-n', '-r', 'echo unserialize((new PDO("sqlite:" . $argv[1]))->query("SELECT value FROM key_value WHERE collection = \'state\' AND name = \'system.cron_key\'")->fetchColumn(), ["allowed_classes" => FALSE]);', path.join(sitesDefault(w), 'files/.sqlite')], { encoding: 'utf8' }).stdout.trim();
    const cron = await httpClean(w, `/cron/${key}`, '');
    const updatesFull = await http(w, '/admin/reports/updates', s.cookie, 'GET', true);
    const libfixText = text((updatesFull.body || '').slice(Math.max(0, (updatesFull.body || '').indexOf('Libraries-style fixture') - 200), (updatesFull.body || '').indexOf('Libraries-style fixture') + 1500));
    const compat = [...new Set((text(updatesFull.body || '').match(/[^.]{0,80}ompatib[^.]{0,120}/g) || []))];
    const updates = { ...updatesFull, body: undefined, cookie: undefined, libfix_row: libfixText.slice(0, 600), compatibility_text: compat };
    const status = await httpClean(w, '/admin/reports/status', s.cookie);
    const modules = await httpClean(w, '/admin/modules', s.cookie);
    out.variants[label] = scrub({ core_compatibility: constraint, feed_requests: [...hits], cron: { status: cron.status }, updates, status, modules, exception: exceptionOf(logged(w, since)), logged: logged(w, since) });
    console.log(`${label} (${constraint}): compatibility text: ${JSON.stringify(updates.compatibility_text)}`);
    console.log(`${label} (${constraint}): feed requests ${hits.length}, cron ${cron.status}, /admin/reports/updates ${updates.status}, /admin/reports/status ${status.status}, /admin/modules ${modules.status}${out.variants[label].exception ? ', ' + out.variants[label].exception.class : ''}`);
  }
  await stopServer(w); cleanExtensions(w); resetSite(w);
  server.close();
  fs.writeFileSync(path.join(OUT, 'feed-control-3451701.json'), JSON.stringify(out, null, 1) + '\n');
  console.log(`Wrote ${path.relative(labRoot, path.join(OUT, 'feed-control-3451701.json'))}`);
} else if (cmd === 'rejudge') {
  // Recompute every verdict and exception label from the stored observations and baselines (after a change to judge() or
  // exceptionOf()), without measuring again.
  const file = path.join(OUT, 'results.json');
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const keyOf = (sc, o) => `${sc.kind}/${sc.placement}/${sc.parser}/${o}`;
  let changed = 0;
  for (const sc of data.scenarios) {
    for (const [o, r] of Object.entries(sc.results)) {
      if (r.verdict === 'runner error') continue;
      const before = JSON.stringify([r.verdict, r.after_verdict, r.exception, r.after?.exception]);
      r.exception = exceptionOf({ ...(r.logged || {}), out: r.output }) || r.exception;
      if (r.after) r.after.exception = exceptionOf(r.after.logged) || r.after.exception;
      Object.assign(r, judge(o, r, data.baselines[keyOf(sc, o)]));
      if (JSON.stringify([r.verdict, r.after_verdict, r.exception, r.after?.exception]) !== before) changed++;
    }
  }
  data.rejudged = new Date().toISOString();
  writeResults(file, data);
  console.log(`Rejudged: ${changed} observation(s) changed.`);
  writeReport();
} else if (cmd === 'report') {
  writeReport();
} else {
  console.error('usage: node scripts/info-yml-repro.mjs prepare|run|report|rejudge|trace|sweep|feed-control|profile-recovery|lint|false-positives|planted|deploy-gate|variant|compare [--variant=<name>] [--workers=N] [--cases=] [--kinds=] [--placements=] [--parsers=] [--observations=] [--rebaseline[=obs,...]] [--php=] [--core=]');
  process.exit(2);
}
