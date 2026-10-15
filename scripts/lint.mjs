// Run Drupal core's own code checks (core/scripts/dev/commit-code-check.sh: CSpell, PHPCS, PHPStan, ESLint, Stylelint,
// twig-cs-fixer, .pcss.css versus .css, file modes) on ONLY the files a variant's patches change, and write the result to
// reports/issues/<nid>/lint/. This is the same script, with the same configuration, that core's GitLab CI runs.
//   node scripts/lint.mjs <slug>                  the After side, inside its DDEV environment (`ddev exec`)
//   node scripts/lint.mjs <slug> --side=before    the Before side (only useful if it carries before.patches)
//   node scripts/lint.mjs <slug> --contrib        the contrib patches instead: PHPCS (Drupal, DrupalPractice) on their PHP files; other types listed as NOT checked
//   node scripts/lint.mjs <slug> --host           use PHP, Composer and Yarn on this machine instead of DDEV (no Docker needed:
//                                                 build the checkout with `node tools/compare/setup.mjs <slug> --checkout-only`)
//   node scripts/lint.mjs <slug> --host --ignore-php-version   allow a host PHP older than core requires (recorded in the report)
//   node scripts/lint.mjs <slug> --no-save        print only, write no report
// How the files are chosen: the patches are applied to the checkout as uncommitted changes, so the script's own modes (working
// tree, --branch) would also pick up .ddev/, settings.php and other local files. Instead a throwaway git index
// (<env>/.lab-lint/git, removed afterwards) holds only the paths the patches touch, and the script runs with --cached against it.
// The core checkout's own git state is never changed. Lint results are about code style and static analysis, not accessibility.
// Exit code: the check script's (0 pass, 1 fail), 2 usage, 3 environment problem.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync, spawn } from 'node:child_process';
import { labRoot, variants, envDir } from '../tools/compare/lib.mjs';
import { sideState } from '../tools/compare/contrib-state.mjs';
import { contribFileList, classify, phpcsScript, verdict, PHPCS_EXT } from '../tools/compare/lint-contrib.mjs';

const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith('--'));
const side = ((args.find((a) => a.startsWith('--side=')) || '--side=after').split('=')[1]);
const CONTRIB = args.includes('--contrib'), HOST = args.includes('--host'), SAVE = !args.includes('--no-save'), IGNORE_PHP = args.includes('--ignore-php-version');
if (!slug || !['before', 'after'].includes(side)) { console.error('usage: node scripts/lint.mjs <slug> [--side=after|before] [--contrib] [--host [--ignore-php-version]] [--no-save]'); process.exit(2); }
const v = variants().find((x) => x.slug === slug);
if (!v) { console.error(`unknown variant: ${slug}. Variants: ${variants().map((x) => x.slug).join(', ')}`); process.exit(2); }
const spec = v[side], dir = envDir(spec.env);
const fail = (msg) => { console.error(msg); process.exit(3); };
if (!fs.existsSync(path.join(dir, 'core/scripts/dev/commit-code-check.sh'))) fail(`${spec.env} has no core checkout. Build it: node tools/compare/setup.mjs ${slug}   (or --checkout-only for a host lint)`);
const patches = spec.patches || [];
const contribPatches = spec.contribPatches || [];
if (!patches.length && !contribPatches.length) fail(`The ${side} side of ${slug} has no patches, so there is nothing of the issue's to check.`);
if (CONTRIB && !contribPatches.length) fail(`The ${side} side of ${slug} has no contrib patches.`);
if (patches.length && contribPatches.length && !CONTRIB) console.log('Note: this run checks the core patches only. The contrib patches are checked with: node scripts/lint.mjs ' + slug + ' --contrib');
const useDdev = !HOST;
if (useDdev && !fs.existsSync(path.join(dir, '.ddev/config.yaml'))) fail(`${spec.env} is not a DDEV project. Build it (node tools/compare/setup.mjs ${slug}) or use --host.`);

const sh = (cmd, argv, opts = {}) => spawnSync(cmd, argv, { cwd: dir, encoding: 'utf8', ...opts });
const firstLine = (r) => `${r.stdout || ''}${r.stderr || ''}`.trim().split('\n')[0] || 'unknown';
// In the web container, or on the host. The script goes to `ddev exec` as ONE argument: ddev runs it with its own `bash -c`
// (with `set -u`), and re-quotes separate arguments in double quotes, so `ddev exec bash -c '<script>'` would expand
// $GIT_DIR and the like in the outer shell, before the script's own `export` (2026-10-14: "GIT_DIR: unbound variable").
const shArgs = (script) => (useDdev ? ['ddev', ['exec', script]] : ['bash', ['-c', script]]);
const inEnv = (script, opts = {}) => sh(...shArgs(script), opts);

// Contrib patches (AI-usage Phase 5): the Drupal coding standard on the PHP files; the other file types are listed as not checked.
if (CONTRIB || !patches.length) {
  const st = sideState(dir, labRoot, patches, { modules: v.contrib || [], patches: contribPatches });
  if (['mismatch', 'fresh'].includes(st.state)) fail(`${spec.env} does not hold its contrib patches (${st.state}: ${st.reasons.join('; ') || 'not applied'}). Run: node tools/compare/setup.mjs ${slug}`);
  const { php, other, missing } = classify(contribFileList(contribPatches, labRoot, dir));
  if (missing.length) fail(`The contrib patches name files the checkout does not have: ${missing.slice(0, 6).join(', ')}. Are they applied? (node tools/compare/setup.mjs ${slug})`);
  if (php.length && !fs.existsSync(path.join(dir, 'vendor/bin/phpcs'))) fail(`vendor/bin/phpcs is missing in ${spec.env}; build it (node tools/compare/setup.mjs ${slug}) or run composer install there.`);
  const started = new Date(); let log = '', exit = 0;
  if (php.length) { const r = inEnv(phpcsScript(php)); log = `${r.stdout || ''}${r.stderr || ''}`; exit = r.status ?? 3; }
  const result = verdict(php.length, exit), notChecked = Object.entries(other);
  console.log(`\n${slug} ${side} (${spec.env}) contrib: ${php.length} file(s) checked with PHPCS (Drupal, DrupalPractice); ${notChecked.reduce((n, [, f]) => n + f.length, 0)} file(s) of other types NOT checked${notChecked.length ? ` (${notChecked.map(([e, f]) => `${e}: ${f.length}`).join(', ')})` : ''}.`);
  if (log.trim()) console.log(log.trim());
  console.log(`\nResult: ${result}${result === 'NOTHING CHECKED' ? ' (no PHP-family file in the contrib patches, so no tool ran; that is not a pass)' : ` (exit ${exit})`}`);
  if (SAVE) {
    const nid = String(v.issue || slug.split('-')[0]), outDir = path.join(labRoot, 'reports/issues', nid, 'lint'); fs.mkdirSync(outDir, { recursive: true });
    const file = path.join(outDir, `${started.toISOString().slice(0, 10)}-${slug}-${side}-contrib.md`), clean = log.replace(/\x1b\[[0-9;?]*[A-Za-z]|\x1b\(B/g, '').replace(/\r/g, '').replace(/[ \t]+$/gm, '').trim();
    fs.writeFileSync(file, `# Lint (contrib): ${slug}, ${side} side (${started.toISOString().slice(0, 10)})

DRAFT until a person has reviewed it. Generated by \`node scripts/lint.mjs ${args.join(' ')}\`.

**Result: ${result}**

PHPCS with the Drupal and DrupalPractice coding standards on the PHP-family files the contrib patches change. It is about code style: **it is not accessibility evidence.**

| Environment | \`${spec.env}\` (${useDdev ? 'DDEV web container' : 'host'}) |
|---|---|
| Contrib patches | ${contribPatches.map((c) => `\`${c.patch}\` (${c.module})`).join('<br>')} |

## Checked with PHPCS (${php.length})
${php.length ? php.map((f) => `- \`${f}\``).join('\n') : 'None: no PHP-family file (' + PHPCS_EXT.join(', ') + ') in the contrib patches.'}

## NOT checked (${notChecked.reduce((n, [, f]) => n + f.length, 0)})
${notChecked.length ? notChecked.map(([e, f]) => `- ${e} (${f.length}): ${f.map((x) => `\`${x}\``).join(', ')}`).join('\n') : 'None.'}

These types need the module's own ESLint, Stylelint and CSpell configuration, which the lab does not run. A file listed here has had no code check at all.
${clean ? `\n## Output\n\`\`\`text\n${clean.split('\n').slice(0, 300).join('\n')}\n\`\`\`\n` : ''}`);
    console.log(`Report: ${path.relative(labRoot, file)}`);
  }
  process.exit(result === 'PASS' ? 0 : result === 'FAIL' ? 1 : 3);
}

// 1. Which files: every path a patch adds or changes (deleted files have nothing to check).
const files = [...new Set(patches.flatMap((p) => {
  const f = path.join(labRoot, p); if (!fs.existsSync(f)) fail(`patch missing: ${p}`);
  return [...fs.readFileSync(f, 'utf8').matchAll(/^\+\+\+ b\/(.+?)\t?$/gm)].map((m) => m[1].trim());
}))].filter((f) => fs.existsSync(path.join(dir, f)));
if (!files.length) fail('The patches touch no files that exist in the checkout. Are they applied? (node tools/compare/setup.mjs ' + slug + ')');
// The patches must actually be applied, or we would be linting upstream core.
const applied = files.filter((f) => sh('git', ['status', '--porcelain', '--', f]).stdout.trim() !== '');
if (applied.length !== files.length) fail(`Some patched files are unchanged from core (patches not applied?): ${files.filter((f) => !applied.includes(f)).join(', ')}`);

// 2. Tools: PHP version against core's requirement, Composer dependencies (the script stops without vendor/bin/phpcs).
const phpVer = firstLine(inEnv('php -r "echo PHP_VERSION;"'));
const need = (JSON.parse(fs.readFileSync(path.join(dir, 'core/composer.json'), 'utf8')).require || {}).php || '';
const cmp = (a, b) => { const x = a.split('.').map(Number), y = b.split('.').map(Number); for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0); return 0; };
const minPhp = (need.match(/(\d+\.\d+(?:\.\d+)?)/) || [])[1];
const phpTooOld = minPhp && /^\d/.test(phpVer) && cmp(phpVer, minPhp) < 0;
if (phpTooOld && !IGNORE_PHP) fail(`PHP ${phpVer} is older than core requires (${need}). Use the DDEV environment, or pass --ignore-php-version to lint anyway (recorded in the report).`);
if (!fs.existsSync(path.join(dir, 'vendor/bin/phpcs'))) {
  console.log('Installing Composer dependencies (vendor/ is missing; composer.lock is not changed)...');
  const r = inEnv(`composer install --no-interaction --no-progress${phpTooOld ? ' --ignore-platform-req=php' : ''}`, { stdio: 'inherit' });
  if (r.status !== 0 || !fs.existsSync(path.join(dir, 'vendor/bin/phpcs'))) fail('composer install failed; see above.');
}
// Yarn: core pins a version in package.json (`packageManager`). A different global Yarn refuses to run, and the check
// script hides that (it would then report every JS and CSS check as failed). Use Corepack's Yarn through a shim in
// .lab-lint/bin when the global one is wrong, and install core's JS tools here, where an error is visible.
fs.rmSync(path.join(dir, '.lab-lint'), { recursive: true, force: true });
const yarnWant = ((JSON.parse(fs.readFileSync(path.join(dir, 'core/package.json'), 'utf8')).packageManager || '').match(/^yarn@([\d.]+)/) || [])[1];
let pathPrefix = '';
if (yarnWant && firstLine(inEnv('cd core && yarn --version 2>/dev/null')) !== yarnWant) {
  if (inEnv('corepack --version').status !== 0) fail(`core needs Yarn ${yarnWant} and this ${useDdev ? 'container' : 'machine'} has neither it nor Corepack. Install Node with Corepack, or run: corepack enable`);
  fs.mkdirSync(path.join(dir, '.lab-lint/bin'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.lab-lint/bin/yarn'), '#!/bin/sh\nexec corepack yarn "$@"\n', { mode: 0o755 });
  pathPrefix = 'PATH="$PWD/.lab-lint/bin:$PATH" COREPACK_ENABLE_DOWNLOAD_PROMPT=0 ';
}
const base = `export ${pathPrefix}GIT_DIR="$PWD/.lab-lint/git" GIT_WORK_TREE="$PWD" GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=safe.directory GIT_CONFIG_VALUE_0='*' TERM=xterm;`;
if (!fs.existsSync(path.join(dir, 'core/node_modules/eslint/bin/eslint.js'))) {
  console.log('Installing core\'s JavaScript tools (core/node_modules is missing, about 400 MB; `lab-env.mjs trim --deep` removes it again)...');
  const r = inEnv(`${base} cd core && yarn install --immutable`, { stdio: 'inherit' });
  if (r.status !== 0 || !fs.existsSync(path.join(dir, 'core/node_modules/eslint/bin/eslint.js'))) fail('yarn install in core failed; see above.');
}
const tools = { php: phpVer, node: firstLine(inEnv('node --version')), yarn: firstLine(inEnv(`${base} cd core && yarn --version`)), git: firstLine(inEnv('git --version')) };

// 3. The throwaway index: a separate git directory whose index lists only the patched files (no commit, so --cached
// compares them with the empty tree and checks every one). GIT_CONFIG_* marks the tree safe inside the container.
const q = (s) => `'${s.replace(/'/g, `'\\''`)}'`;
const prep = inEnv(`${base} mkdir -p "$GIT_DIR" && git init -q && git add -f -- ${files.map(q).join(' ')}`);
if (prep.status !== 0) fail(`Could not prepare the file list: ${firstLine(prep)}`);

// 4. Run core's script, showing the output as it comes and keeping a copy.
const coreCommit = sh('git', ['rev-parse', '--short=11', 'HEAD']).stdout.trim();
console.log(`\n${slug} ${side} (${spec.env}) at core ${coreCommit} plus ${patches.length} patch(es); ${files.length} file(s); ${useDdev ? 'DDEV web container' : 'host'}; PHP ${phpVer}\n`);
const started = new Date();
// --memory-unlimited (core's own option, where the script has it): PHPStan's default limit crashes it on the host.
const memFlag = /--memory-unlimited/.test(fs.readFileSync(path.join(dir, 'core/scripts/dev/commit-code-check.sh'), 'utf8')) ? ' --memory-unlimited' : '';
const cmdline = `${base} bash core/scripts/dev/commit-code-check.sh --cached${memFlag}`;
const child = spawn(...shArgs(cmdline), { cwd: dir });
let log = '';
for (const s of [child.stdout, child.stderr]) s.on('data', (c) => { process.stdout.write(c); log += c; });
const status = await new Promise((res) => child.on('close', (code) => res(code ?? 1)));
fs.rmSync(path.join(dir, '.lab-lint'), { recursive: true, force: true });
const secs = Math.round((Date.now() - started) / 1000);
// The script exits 0 on "There are no files to check" too; treat that as an error here, since we always pass files.
// A tool that did not start makes the script fail every check after it; that is not a result about the patch.
const toolError = (log.match(/Cannot find module[^\n]*|defines "packageManager"[^\n]*|command not found[^\n]*|PHP Fatal error[^\n]*|PHPStan process crashed[^\n]*|Allowed memory size[^\n]*/) || [])[0];
const ran = !/There are no files to check/.test(log) && !toolError;
const result = /There are no files to check/.test(log) ? 'ERROR (no files reached the script)' : toolError ? `ERROR (a tool did not run: ${toolError.trim().slice(0, 120)}). Not a result about the patch` : status === 0 ? 'PASS' : 'FAIL';
console.log(`\nResult: ${result} (exit ${status}, ${secs} s)`);

// 5. Report.
if (SAVE) {
  const nid = String(v.issue || slug.split('-')[0]);
  const outDir = path.join(labRoot, 'reports/issues', nid, 'lint');
  fs.mkdirSync(outDir, { recursive: true });
  const day = started.toISOString().slice(0, 10);
  const file = path.join(outDir, `${day}-${slug}-${side}.md`);
  const clean = log.replace(/\x1b\[[0-9;?]*[A-Za-z]|\x1b\(B/g, '').replace(/\r/g, '').replace(/[ \t]+$/gm, '').split(dir + '/').join('').split('/var/www/html/').join('').trim();   // paths relative to the checkout
  const lines = clean.split('\n');
  const perCheck = [...clean.matchAll(/^([A-Za-z][\w .-]{1,30}): (passed|failed)$/gm)].map((m) => `| ${m[1]} | ${m[2]} |`);
  const shown = lines.length > 400 ? [...lines.slice(0, 400), `... ${lines.length - 400} more lines not kept (re-run to see them)`] : lines;
  const md = `# Lint: ${slug}, ${side} side (${day})

DRAFT until a person has reviewed it. Generated by \`node scripts/lint.mjs ${args.join(' ')}\`.

**Result: ${result}** (exit ${status}, ${secs} s)

This runs core's own \`core/scripts/dev/commit-code-check.sh --cached\` (the checks core's GitLab CI runs, with core's configuration)
on only the files the patches change. It is about code style and static analysis: **it is not accessibility evidence.**

| | |
|---|---|
| Environment | \`${spec.env}\` (${useDdev ? 'DDEV web container' : `host, ${os.type()} ${os.release()}`}) |
| Core | \`${coreCommit}\` (${v.core && v.core.commit ? 'pinned' : `${(v.core && v.core.ref) || 'main'}, latest when built`}) |
| Patches | ${patches.map((p) => `\`${p}\``).join('<br>')} |
| Tools | PHP ${tools.php}${phpTooOld ? ` (**older than core requires, ${need}; linted with --ignore-php-version, so PHPStan and PHPCS results may differ from CI**)` : ''}, Node ${tools.node}, Yarn ${tools.yarn}, ${tools.git} |
| Started | ${started.toISOString()} |

${perCheck.length ? `| Check (as the script reports it) | Result |\n|---|---|\n${perCheck.join('\n')}\n\nChecks the script skips when no file of that type changed, or reports without a \`passed\`/\`failed\` line (file modes, .pcss.css versus .css), appear only in the output below.\n\n` : ''}## Files checked (${files.length})
${files.map((f) => `- \`${f}\``).join('\n')}

## Output
\`\`\`text
${shown.join('\n')}
\`\`\`

## Not covered
- Accessibility: none of these tools test it. See the walkthrough, axe and manual results for that.
- PHPUnit, Nightwatch and the full-codebase jobs core CI also runs (this checks only the changed files).
${(spec.contribPatches || []).length ? '- Contrib patches (not core files).\n' : ''}`;
  fs.writeFileSync(file, md);
  console.log(`Report: ${path.relative(labRoot, file)}`);
}
process.exit(ran ? status : 3);
