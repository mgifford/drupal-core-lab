// What `scripts/lint.mjs --contrib` checks in the contrib patches of a variant (AI-usage Phase 5).
// Core's commit-code-check.sh and its configuration are for core files, so contrib files get the Drupal coding standard (PHPCS with
// Drupal and DrupalPractice, from the coder package core already installs). Other file types (CSS, JavaScript, YAML, Twig) are listed as
// NOT checked: they need the module's own ESLint and Stylelint configuration, which the lab does not run. Nothing here says a file is clean
// unless a tool ran on it.
import fs from 'node:fs';
import path from 'node:path';

export const PHPCS_EXT = ['php', 'module', 'inc', 'install', 'theme', 'profile', 'test', 'engine'];
const SUB = 'modules/contrib';
const q = (s) => `'${s.replace(/'/g, `'\\''`)}'`;

// The files the contrib patches add or change, as paths in the checkout. Deleted files have nothing to check.
// contribPatches: [{ module, patch }]. Returns [{ module, file, ext, exists }] (file is relative to the checkout).
export function contribFileList(contribPatches, labRoot, dir) {
  const seen = new Set(), out = [];
  for (const { module, patch } of contribPatches) {
    const text = fs.readFileSync(path.join(labRoot, patch), 'utf8');
    for (const m of text.matchAll(/^\+\+\+ b\/(.+?)\t?$/gm)) {
      const rel = m[1].trim(), file = `${SUB}/${module}/${rel}`; if (seen.has(file)) continue; seen.add(file);
      out.push({ module, file, ext: (path.extname(rel).slice(1) || '(none)').toLowerCase(), exists: fs.existsSync(path.join(dir, file)) });
    }
  }
  return out;
}

// php: files PHPCS will check; other: { ext: [files] } listed as not checked; missing: patch names a file the checkout does not have.
export function classify(list) {
  const php = [], other = {}, missing = [];
  for (const f of list) { if (!f.exists) { missing.push(f.file); continue; } if (PHPCS_EXT.includes(f.ext)) php.push(f.file); else (other[f.ext] ||= []).push(f.file); }
  return { php, other, missing };
}

export const phpcsScript = (files) => `vendor/bin/phpcs --standard=Drupal,DrupalPractice --extensions=${PHPCS_EXT.join(',')} -- ${files.map(q).join(' ')}`;

// PHPCS exits 0 clean, 1 or 2 when it found violations, 3 on a usage or runtime error.
export function verdict(phpCount, exit) {
  if (!phpCount) return 'NOTHING CHECKED';
  if (exit === 0) return 'PASS';
  return exit === 1 || exit === 2 ? 'FAIL' : 'ERROR';
}
