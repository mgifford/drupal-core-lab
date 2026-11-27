/**
 * Build the standalone comparison fixture for drupal.org #3534229.
 *
 * It extracts the CKEditor 5 configuration-UI CSS and icon SVGs from the pinned
 * Drupal core commit, and (optionally) a patched copy of that CSS by applying the
 * proposed patch to the extracted files. Four variants are then comparable in one
 * page: A = current core, B = Kent's whole-element mask experiment, C = the
 * dedicated-mask proposal, D = an un-opted contributed plugin icon (control).
 *
 * Run:
 *   node reports/issues/3534229/fixture/build-fixture.mjs
 *   node reports/issues/3534229/fixture/build-fixture.mjs --patch reports/issues/3534229/branches/3534229-<name>.patch
 *
 * Reads only envs/core.git (bare) and the patch file. Writes under this folder.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const labRoot = path.resolve(here, '../../../..');
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d; };

const variantsFile = path.join(labRoot, 'tools/compare/variants.json');
const pinned = JSON.parse(fs.readFileSync(variantsFile, 'utf8')).find((v) => v.slug === '3534229-pinned');
const commit = arg('pin', pinned?.core?.commit);
if (!commit) throw new Error('No pinned core commit: pass --pin <sha>');
const patchFile = arg('patch', null);
const gitDir = path.join(labRoot, 'envs/core.git');
const git = (...a) => execFileSync('git', ['--git-dir', gitDir, ...a], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });

const assets = path.join(here, 'assets');
const base = path.join(assets, 'base');
fs.rmSync(base, { recursive: true, force: true });
fs.mkdirSync(base, { recursive: true });
fs.rmSync(path.join(assets, 'css'), { recursive: true, force: true });
fs.rmSync(path.join(assets, 'css-patched'), { recursive: true, force: true });
fs.rmSync(path.join(assets, 'icons'), { recursive: true, force: true });
fs.mkdirSync(path.join(assets, 'icons'), { recursive: true });

// 1. Extract the pinned sources. `git archive` keeps the exact bytes.
const archive = execFileSync('git', ['--git-dir', gitDir, 'archive', '--format=tar', commit, 'core/modules/ckeditor5/css', 'core/modules/ckeditor5/icons']);
const tarFile = path.join(os.tmpdir(), `3534229-fixture-${process.pid}.tar`);
fs.writeFileSync(tarFile, archive);
execFileSync('tar', ['-x', '-f', tarFile, '-C', base], { encoding: 'utf8' });
fs.rmSync(tarFile, { force: true });

// 2. Assets the HTML can load directly.
const cssDir = path.join(base, 'core/modules/ckeditor5/css');
const iconDir = path.join(base, 'core/modules/ckeditor5/icons');
fs.mkdirSync(path.join(assets, 'css'), { recursive: true });
for (const f of fs.readdirSync(cssDir).filter((f) => f.endsWith('.css'))) {
  fs.copyFileSync(path.join(cssDir, f), path.join(assets, 'css', f));
}
for (const f of fs.readdirSync(iconDir).filter((f) => f.endsWith('.svg'))) {
  fs.copyFileSync(path.join(iconDir, f), path.join(assets, 'icons', f));
}

// 3. Patched copy, by applying the proposal to the extracted tree with git apply.
const manifest = { generated: new Date().toISOString(), pin: commit, patch: null, files: {} };
if (patchFile) {
  const patchedRoot = path.join(assets, '.work');
  fs.rmSync(patchedRoot, { recursive: true, force: true });
  fs.mkdirSync(patchedRoot, { recursive: true });
  fs.cpSync(path.join(base, 'core'), path.join(patchedRoot, 'core'), { recursive: true });
  execFileSync('git', ['init', '-q'], { cwd: patchedRoot });
  execFileSync('git', ['add', '-A'], { cwd: patchedRoot });
  execFileSync('git', ['-c', 'user.email=lab@example.invalid', '-c', 'user.name=lab', 'commit', '-q', '-m', 'base'], { cwd: patchedRoot });
  const absPatch = path.resolve(labRoot, patchFile);
  execFileSync('git', ['apply', '-p1', '--whitespace=nowarn', absPatch], { cwd: patchedRoot });
  const patchedCss = path.join(patchedRoot, 'core/modules/ckeditor5/css');
  fs.mkdirSync(path.join(assets, 'css-patched'), { recursive: true });
  for (const f of fs.readdirSync(patchedCss).filter((f) => f.endsWith('.css'))) {
    fs.copyFileSync(path.join(patchedCss, f), path.join(assets, 'css-patched', f));
  }
  fs.rmSync(patchedRoot, { recursive: true, force: true });
  manifest.patch = { file: patchFile, sha256: createHash('sha256').update(fs.readFileSync(absPatch)).digest('hex') };
  // The patch must only touch the files the fixture consumes.
  const touched = execFileSync('git', ['apply', '-p1', '--numstat', absPatch], { encoding: 'utf8' }).trim().split('\n');
  manifest.patch.files = touched.map((l) => l.split('\t').at(-1));
}

// 4. Hashes so a screenshot can be tied to exact inputs.
for (const [dir, label] of [[path.join(assets, 'css'), 'core'], [path.join(assets, 'css-patched'), 'patched']]) {
  if (!fs.existsSync(dir)) continue;
  manifest.files[label] = {};
  for (const f of fs.readdirSync(dir).sort()) {
    manifest.files[label][f] = createHash('sha256').update(fs.readFileSync(path.join(dir, f))).digest('hex');
  }
}
manifest.files.icons = {};
for (const f of fs.readdirSync(path.join(assets, 'icons')).sort()) {
  manifest.files.icons[f] = createHash('sha256').update(fs.readFileSync(path.join(assets, 'icons', f))).digest('hex');
}
fs.writeFileSync(path.join(here, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`fixture: pin ${commit.slice(0, 12)}, patch ${manifest.patch ? manifest.patch.sha256.slice(0, 12) : 'none'}, ${Object.keys(manifest.files.core).length} core CSS files, ${Object.keys(manifest.files.icons).length} icons`);
