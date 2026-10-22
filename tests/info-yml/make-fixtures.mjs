// Generates tests/info-yml/fixtures/: one directory per case, each holding the files to copy over a valid extension.
//   node tests/info-yml/make-fixtures.mjs           write the fixtures (removes and rewrites tests/info-yml/fixtures/)
//   node tests/info-yml/make-fixtures.mjs --check   exit 1 if the committed fixtures differ from what this script writes
// Bytes that matter (tabs, BOM, CRLF, no-break spaces, Latin-1, a missing final newline) are written from escapes in this file,
// so a reviewer can see them here even where an editor hides them in the generated file.
//
// Layout of each case: fixtures/<id>/case.json, and fixtures/<id>/<kind>/<extension dir>/... for each kind it applies to
// (module, theme, profile). "remove" in case.json lists files of the valid extension to delete before copying (renamed files).
// The valid extensions are fixtures/_valid/<kind>/. The extension names are infofix, infofix_theme and infofix_profile.
// "expected" is what reading core's source predicts (main, 12.0-dev); the measured result is in reports/info-yml/, not here.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, 'fixtures');

const KINDS = {
  module: { dir: 'infofix', name: 'infofix', ext: 'module', label: "'Info fixture'", list: ['dependencies:', '  - drupal:node'] },
  theme: { dir: 'infofix_theme', name: 'infofix_theme', ext: 'theme', label: "'Info fixture theme'", list: ['base theme: false', 'regions:', '  header: Header', '  content: Content'] },
  profile: { dir: 'infofix_profile', name: 'infofix_profile', ext: 'profile', label: "'Info fixture profile'", list: ['install:', '  - node', '  - block', '  - dblog', '  - update', 'themes:', '  - stark'] },
};
const ALL = Object.keys(KINDS);

// The valid info file, as an ordered list of lines. Cases change single lines so the rest stays valid.
function lines(kind, o = {}) {
  const k = KINDS[kind];
  // A key given as null removes that line, so `in` is used here, not ??.
  const pick = (key, dflt) => (key in o ? o[key] : dflt);
  const head = [
    pick('name', `name: ${k.label}`),
    pick('type', `type: ${kind}`),
    pick('description', "description: 'Lab fixture for info.yml parsing tests.'"),
    pick('package', 'package: Lab'),
    pick('cvr', 'core_version_requirement: ^12'),
  ];
  return [...head, ...pick('list', k.list), ...pick('extra', [])].filter((l) => l !== null);
}
const yml = (ls, eol = '\n') => ls.join(eol) + eol;
const info = (kind, o, eol) => ({ [`${KINDS[kind].dir}/${KINDS[kind].name}.info.yml`]: yml(lines(kind, o), eol) });
const PHP_VALID = (kind) => `<?php\n\n/**\n * @file\n * Lab fixture for info.yml parsing tests. Intentionally empty.\n */\n\ndeclare(strict_types=1);\n`;
const PACKAGER = "# Information added by Drupal.org packaging script on 2026-10-01\nversion: '1.0.0'\nproject: 'infofix'\ndatestamp: 1790812800\n";

// One entry per case. info(kind) returns the files for that kind; "kinds" defaults to all three.
const CASES = [
  // YAML syntax.
  { id: 'yaml-unquoted-colon', category: 'yaml-syntax', title: 'Unquoted colon followed by a space inside a value',
    expected: 'InfoParserException (YAML parse error)', files: (k) => info(k, { description: 'description: Lab fixture: parsing tests.' }) },
  { id: 'yaml-leading-at', category: 'yaml-syntax', title: 'Unquoted value that starts with @ (a reserved indicator)',
    expected: 'InfoParserException (YAML parse error)', files: (k) => info(k, { description: 'description: @todo write a description' }) },
  { id: 'yaml-leading-asterisk', category: 'yaml-syntax', title: 'Unquoted value that starts with * (read as an alias)',
    expected: 'InfoParserException (YAML parse error)', files: (k) => info(k, { description: 'description: *Experimental* parsing fixture' }) },
  { id: 'yaml-tab-indent', category: 'yaml-syntax', title: 'Tab used for indentation in a nested block',
    expected: 'InfoParserException (YAML parse error)',
    files: (k) => info(k, { list: KINDS[k].list.map((l, i) => (i === KINDS[k].list.findIndex((x) => x.startsWith('  ')) ? '\t' + l.trimStart() : l)) }) },
  { id: 'yaml-unterminated-quote', category: 'yaml-syntax', title: 'Single-quoted value with no closing quote',
    expected: 'InfoParserException (YAML parse error)', files: (k) => info(k, { name: `name: ${KINDS[k].label.slice(0, -1)}` }) },
  { id: 'yaml-duplicate-key', category: 'yaml-syntax', title: 'The same top-level key twice (name)',
    expected: 'InfoParserException with Symfony YAML; PECL YAML may accept it (to measure)',
    files: (k) => info(k, { extra: ["name: 'Info fixture duplicate'"] }) },
  { id: 'yaml-bom', category: 'yaml-syntax', title: 'UTF-8 byte order mark before the first key',
    expected: 'unknown (to measure)', files: (k) => { const f = info(k); const p = Object.keys(f)[0]; f[p] = '﻿' + f[p]; return f; } },
  { id: 'yaml-crlf', category: 'control', title: 'Windows (CRLF) line endings',
    expected: 'no error (control)', files: (k) => info(k, {}, '\r\n') },
  { id: 'yaml-non-utf8', category: 'yaml-syntax', title: 'Latin-1 (not UTF-8) byte in a value',
    expected: 'InfoParserException (invalid UTF-8)', binary: true,
    files: (k) => info(k, { description: "description: 'Lab fixture café'" }) },
  { id: 'yaml-empty-file', category: 'yaml-syntax', title: 'Empty info file (0 bytes)',
    expected: 'TypeError from array_keys(NULL), not InfoParserException (to measure)',
    files: (k) => ({ [`${KINDS[k].dir}/${KINDS[k].name}.info.yml`]: '' }) },
  { id: 'yaml-scalar-only', category: 'yaml-syntax', title: 'Info file that is a single plain string',
    expected: 'TypeError from array_keys(string), not InfoParserException (to measure)',
    files: (k) => ({ [`${KINDS[k].dir}/${KINDS[k].name}.info.yml`]: 'Info fixture\n' }) },
  { id: 'yaml-top-level-list', category: 'yaml-syntax', title: 'Top level is a sequence, not a mapping',
    expected: 'InfoParserException (missing required keys)',
    files: (k) => ({ [`${KINDS[k].dir}/${KINDS[k].name}.info.yml`]: yml(lines(k).map((l) => (l.startsWith(' ') ? '  ' + l : '- ' + l))) }) },

  // Spacing.
  { id: 'spacing-no-space-after-colon', category: 'spacing', title: 'No space after the colon (type:module)',
    expected: 'InfoParserException (YAML parse error)', files: (k) => info(k, { type: `type:${k}` }) },
  { id: 'spacing-key-indented', category: 'spacing', title: 'A top-level key indented by one space',
    expected: 'InfoParserException (YAML parse error)', files: (k) => info(k, { type: ` type: ${k}` }) },
  { id: 'spacing-list-over-indented', category: 'spacing', title: 'Second nested item indented one space more than the first',
    expected: 'unknown: may fold into the first value (to measure)',
    files: (k) => { const l = [...KINDS[k].list]; const i = l.findIndex((x) => x.startsWith('  ')); l.splice(i + 1, 0, ' ' + (k === 'theme' ? '  footer: Footer' : '  - drupal:user'.replace('drupal:', k === 'profile' ? '' : 'drupal:'))); return info(k, { list: l }); } },
  { id: 'spacing-list-under-indented', category: 'spacing', title: 'Second nested item indented one space less than the first',
    expected: 'InfoParserException (YAML parse error)',
    files: (k) => { const l = KINDS[k].list.map((x) => (x.startsWith('  ') ? '  ' + x : x)); const i = l.findIndex((x) => x.startsWith('    ')); l.splice(i + 1, 0, '   ' + (k === 'theme' ? 'footer: Footer' : k === 'profile' ? '- user' : '- drupal:user')); return info(k, { list: l }); } },
  { id: 'spacing-list-no-space', category: 'spacing', title: 'List item with no space after the dash (-drupal:node)',
    expected: 'parses as a string instead of a list; failure later, if any (to measure)',
    files: (k) => info(k, { list: KINDS[k].list.map((x) => (x.startsWith('  - ') ? '  -' + x.slice(4) : x.startsWith('  ') && k === 'theme' ? x.replace(': ', ':') : x)) }) },
  { id: 'spacing-nbsp-after-colon', category: 'spacing', title: 'No-break space (U+00A0) instead of a space after the colon',
    expected: 'InfoParserException (YAML parse error or missing type)', files: (k) => info(k, { type: `type: ${k}` }) },
  { id: 'spacing-tab-after-colon', category: 'spacing', title: 'Tab instead of a space after the colon',
    expected: 'unknown (to measure)', files: (k) => info(k, { type: `type:\t${k}` }) },
  { id: 'spacing-trailing-whitespace', category: 'control', title: 'Trailing spaces and a trailing tab after values',
    expected: 'no error (control)', files: (k) => info(k, { type: `type: ${k}   `, package: 'package: Lab\t' }) },
  { id: 'spacing-compact-list', category: 'control', title: 'List items at the same indentation as their key (valid YAML)',
    expected: 'no error (control)', files: (k) => info(k, { list: KINDS[k].list.map((x) => (x.startsWith('  - ') ? x.slice(2) : x)) }) },

  // Keys and values that InfoParserDynamic or the extension lists check.
  { id: 'missing-name', category: 'required-keys', title: 'No name key',
    expected: 'InfoParserException: Missing required keys (name)', files: (k) => info(k, { name: null }) },
  { id: 'missing-type', category: 'required-keys', title: 'No type key',
    expected: 'InfoParserException: Missing required keys (type)', files: (k) => info(k, { type: null }) },
  { id: 'type-typo', category: 'required-keys', title: 'Misspelt type (modul, theem, profil)',
    expected: 'no exception; the extension is filed under an unknown type and disappears (to measure)',
    files: (k) => info(k, { type: `type: ${{ module: 'modul', theme: 'theem', profile: 'profil' }[k]}` }) },
  { id: 'missing-cvr', category: 'core-compat', title: 'No core_version_requirement',
    expected: "InfoParserException: The 'core_version_requirement' key must be present", files: (k) => info(k, { cvr: null }) },
  { id: 'missing-cvr-core-8x', category: 'core-compat', title: 'core: 8.x and no core_version_requirement (the #3123537 case)',
    expected: "InfoParserException: the 'core' key is no longer read on 10.0 and later", files: (k) => info(k, { cvr: 'core: 8.x' }) },
  { id: 'core-and-cvr', category: 'control', title: 'core: 8.x together with core_version_requirement',
    expected: 'no error on 10.0 and later (control; this was an exception on 9.x)', files: (k) => info(k, { extra: ['core: 8.x'] }) },
  { id: 'cvr-unparseable', category: 'core-compat', title: 'core_version_requirement that is not a Composer constraint',
    expected: "InfoParserException: The 'core_version_requirement' constraint (...) is not a valid value",
    files: (k) => info(k, { cvr: 'core_version_requirement: ^12 ||| banana' }) },
  { id: 'cvr-incompatible', category: 'control', title: 'Valid constraint that excludes this core (^10)',
    expected: 'no exception; marked incompatible (control)', files: (k) => info(k, { cvr: 'core_version_requirement: ^10' }) },
  { id: 'lifecycle-invalid', category: 'values', title: 'lifecycle with a value that is not allowed',
    expected: "InfoParserException: 'lifecycle: beta' is not valid", files: (k) => info(k, { extra: ['lifecycle: beta'] }) },
  { id: 'lifecycle-deprecated-no-link', category: 'values', title: 'lifecycle: deprecated without lifecycle_link',
    expected: "InfoParserException: missing a 'lifecycle_link' entry", files: (k) => info(k, { extra: ['lifecycle: deprecated'] }) },
  { id: 'version-non-scalar', category: 'values', title: 'version as a list',
    expected: "InfoParserException: The 'version' value must be a scalar", files: (k) => info(k, { extra: ['version: [1, 0]'] }) },
  { id: 'version-numeric', category: 'values', title: 'version as an unquoted number (1.0)',
    expected: 'deprecation notice only (deprecated in 11.4.0, error in 13.0.0)', files: (k) => info(k, { extra: ['version: 1.0'] }) },
  { id: 'name-not-string', category: 'values', title: 'name as a list',
    expected: 'unknown: not checked by the parser (to measure)', files: (k) => info(k, { name: 'name: [Info, fixture]' }) },
  { id: 'description-null', category: 'control', title: 'description: with no value (NULL; #2730807)',
    expected: 'no error since #2730807 (control)', files: (k) => info(k, { description: 'description:' }) },
  { id: 'dependencies-string', category: 'values', title: 'The nested list written as a single string',
    expected: 'unknown: not checked by the parser (to measure)',
    files: (k) => info(k, { list: { module: ['dependencies: drupal:node'], theme: ['base theme: false', 'regions: Header'], profile: ['install: node', 'themes: stark'] }[k] }) },
  { id: 'dependency-missing', category: 'values', title: 'Depends on an extension that does not exist',
    expected: 'no exception; the extension cannot be installed (to measure)',
    files: (k) => info(k, { list: { module: ['dependencies:', '  - drupal:does_not_exist'], theme: ['base theme: false', 'dependencies:', '  - drupal:does_not_exist'], profile: ['install:', '  - does_not_exist', 'themes:', '  - stark'] }[k] }) },
  { id: 'theme-missing-base-theme', category: 'theme', title: 'Theme with no base theme key', kinds: ['theme'],
    expected: 'InfoParserException: Missing required key ("base theme")', files: (k) => info(k, { list: KINDS.theme.list.filter((l) => !l.startsWith('base theme')) }) },
  { id: 'theme-base-theme-missing-target', category: 'theme', title: 'Theme whose base theme does not exist', kinds: ['theme'],
    expected: 'unknown (to measure)', files: (k) => info(k, { list: KINDS.theme.list.map((l) => (l.startsWith('base theme') ? 'base theme: does_not_exist' : l)) }) },
  { id: 'theme-libraries-empty', category: 'control', title: 'Theme with an empty libraries: key (#2594937)', kinds: ['theme'],
    expected: 'no error expected (control; #2594937 status not verified)', files: (k) => info(k, { extra: ['libraries:'] }) },

  // File names (discovery only accepts <name>.info.yml where <name> is a valid PHP function name).
  { id: 'filename-info-yaml', category: 'filename', title: 'Info file named .info.yaml instead of .info.yml',
    expected: 'ignored by discovery: the extension disappears (to measure)',
    remove: (k) => [`${KINDS[k].dir}/${KINDS[k].name}.info.yml`],
    files: (k) => ({ [`${KINDS[k].dir}/${KINDS[k].name}.info.yaml`]: yml(lines(k)) }) },
  { id: 'filename-d7-info', category: 'filename', title: 'Drupal 7 style .info file (INI syntax) instead of .info.yml',
    expected: 'ignored by discovery: the extension disappears (to measure)',
    remove: (k) => [`${KINDS[k].dir}/${KINDS[k].name}.info.yml`],
    files: (k) => ({ [`${KINDS[k].dir}/${KINDS[k].name}.info`]: `name = Info fixture\ndescription = Lab fixture\ncore = 7.x\n` }) },
  { id: 'filename-hyphen', category: 'filename', title: 'Hyphen in the file name (info-fix.info.yml): not a valid machine name',
    expected: 'ignored by discovery: the extension disappears (to measure)',
    remove: (k) => [`${KINDS[k].dir}/${KINDS[k].name}.info.yml`],
    files: (k) => ({ [`${KINDS[k].dir}/${KINDS[k].name.replace('infofix', 'info-fix')}.info.yml`]: yml(lines(k)) }) },
  { id: 'filename-uppercase', category: 'filename', title: 'Upper-case first letter in the file name (Infofix.info.yml)',
    expected: 'discovered under a different machine name (to measure)',
    remove: (k) => [`${KINDS[k].dir}/${KINDS[k].name}.info.yml`],
    files: (k) => ({ [`${KINDS[k].dir}/I${KINDS[k].name.slice(1)}.info.yml`]: yml(lines(k)) }) },
  { id: 'filename-backup-copy', category: 'control', title: 'Broken leftover copy named .info.yml.orig beside a valid file',
    expected: 'ignored by discovery (control)',
    files: (k) => ({ [`${KINDS[k].dir}/${KINDS[k].name}.info.yml.orig`]: yml(lines(k, { type: null, description: 'description: broken: copy' })) }) },

  // PHP.
  { id: 'php-syntax-error', category: 'php', title: 'PHP parse error in the .module, .theme or .profile file',
    expected: 'ParseError on every request once the extension is installed; no effect while uninstalled (to measure)',
    files: (k) => ({ [`${KINDS[k].dir}/${KINDS[k].name}.${KINDS[k].ext}`]: `<?php\n\n/**\n * @file\n * Lab fixture with a PHP parse error.\n */\n\nfunction ${KINDS[k].name}_help( {\n  return '';\n}\n` }) },
  { id: 'php-syntax-error-install', category: 'php', title: 'PHP parse error in the .install file', kinds: ['module'],
    expected: 'ParseError where .install files are loaded (update.php, install) (to measure)',
    files: () => ({ 'infofix/infofix.install': `<?php\n\n/**\n * @file\n * Lab fixture with a PHP parse error.\n */\n\nfunction infofix_update_12001( {\n}\n` }) },

  // drupal.org packaging script (simulated: the format is copied from released contrib tarballs, not from the packager source).
  { id: 'packager-duplicate-version', category: 'packaging', title: 'Packager block appended to a file that already has version:',
    expected: 'Duplicate key with Symfony YAML; PECL YAML may accept it (to measure; simulation of #1606606, unverified)',
    files: (k) => ({ [`${KINDS[k].dir}/${KINDS[k].name}.info.yml`]: yml(lines(k, { extra: ["version: '1.x-dev'"] })) + '\n' + PACKAGER }) },
  { id: 'packager-no-final-newline', category: 'packaging', title: 'Packager block appended to a file with no final newline',
    expected: "the last line and the packager comment merge; here core_version_requirement becomes '^12# Information...' (to measure)",
    files: (k) => { const ls = lines(k); const cvr = ls.splice(ls.findIndex((l) => l.startsWith('core_version_requirement')), 1); return { [`${KINDS[k].dir}/${KINDS[k].name}.info.yml`]: [...ls, ...cvr].join('\n') + PACKAGER }; } },
];

// A Libraries-style project (libraries #3190825): a valid module that ships test fixtures whose info files have no "type".
// v1 is the release a site would have installed; v2 adds the tests/ fixtures and is also written as libfix-1.1.0.tar.gz, the
// archive an updater would extract. The exact file names inside the real Libraries project were not verified (drupal.org was
// unreachable); both shapes are here: a machine-name basename, and a dotted *.libraries.info.yml library definition.
const LIBFIX_INFO = (version) => yml(["name: 'Libraries-style fixture'", 'type: module', "description: 'Lab fixture shaped like the Libraries API project.'", 'package: Lab', 'core_version_requirement: ^12', `version: '${version}'`]);
const LIBFIX = {
  v1: { 'libfix/libfix.info.yml': LIBFIX_INFO('1.0.0'), 'libfix/libfix.module': PHP_VALID('module') },
  v2: {
    'libfix/libfix.info.yml': LIBFIX_INFO('1.1.0'),
    'libfix/libfix.module': PHP_VALID('module'),
    'libfix/tests/example/example.info.yml': yml(["name: 'Example library'", 'machine name: example', 'version: 1']),
    'libfix/tests/libraries/example/example_info_file.libraries.info.yml': yml(["name: 'Example info file'", 'machine name: example_info_file', 'version: 1']),
  },
};

// Minimal deterministic ustar writer (regular files and their directories, mode 0644/0755, owner 0, mtime 0), then gzip.
function tarGz(files) {
  const blocks = [];
  const header = (name, size, type) => {
    const h = Buffer.alloc(512, 0);
    h.write(name, 0, 100, 'utf8');
    h.write((type === '5' ? '0000755' : '0000644') + '\0', 100, 8, 'ascii');
    h.write('0000000\0', 108, 8, 'ascii');
    h.write('0000000\0', 116, 8, 'ascii');
    h.write(size.toString(8).padStart(11, '0') + '\0', 124, 12, 'ascii');
    h.write('00000000000\0', 136, 12, 'ascii');
    h.write('        ', 148, 8, 'ascii');
    h.write(type, 156, 1, 'ascii');
    h.write('ustar\0', 257, 6, 'ascii');
    h.write('00', 263, 2, 'ascii');
    let sum = 0;
    for (const b of h) sum += b;
    h.write(sum.toString(8).padStart(6, '0') + '\0 ', 148, 8, 'ascii');
    return h;
  };
  const dirs = new Set();
  for (const name of Object.keys(files).sort()) {
    const parts = name.split('/');
    for (let i = 1; i < parts.length; i++) {
      const d = parts.slice(0, i).join('/') + '/';
      if (!dirs.has(d)) { dirs.add(d); blocks.push(header(d, 0, '5')); }
    }
    const data = Buffer.from(files[name]);
    blocks.push(header(name, data.length, '0'), data, Buffer.alloc((512 - (data.length % 512)) % 512, 0));
  }
  blocks.push(Buffer.alloc(1024, 0));
  const gz = zlib.gzipSync(Buffer.concat(blocks), { level: 9 });
  // The gzip header's OS byte depends on the platform zlib was built for; fix it to 3 (Unix) so --check passes on macOS too.
  gz[9] = 3;
  return gz;
}

function write(root) {
  fs.rmSync(root, { recursive: true, force: true });
  const put = (file, content, binary) => {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, binary ? Buffer.from(content, 'latin1') : content);
  };
  const lib = path.join(root, 'libraries-tarball');
  for (const [v, files] of Object.entries(LIBFIX)) for (const [rel, content] of Object.entries(files)) put(path.join(lib, v, rel), content);
  put(path.join(lib, 'libfix-1.1.0.tar.gz'), tarGz(LIBFIX.v2));
  put(path.join(lib, 'case.json'), JSON.stringify({
    id: 'libraries-tarball', title: 'Libraries-style project whose tests/ fixtures have no type key (libraries #3190825)', category: 'archive',
    expected: 'tests/ is skipped by discovery unless extension_discovery_scan_tests is TRUE; the 10.x Update Manager parsed every *.info.yml in the archive (update_verify_update_archive)',
    v1: Object.keys(LIBFIX.v1), v2: Object.keys(LIBFIX.v2), archive: 'libfix-1.1.0.tar.gz (contents of v2)',
  }, null, 2) + '\n');
  for (const kind of ALL) {
    const k = KINDS[kind];
    put(path.join(root, '_valid', kind, k.dir, `${k.name}.info.yml`), yml(lines(kind)));
    put(path.join(root, '_valid', kind, k.dir, `${k.name}.${k.ext}`), PHP_VALID(kind));
  }
  for (const c of CASES) {
    const kinds = c.kinds || ALL;
    const meta = { id: c.id, title: c.title, category: c.category, kinds, expected: c.expected, remove: {}, files: {} };
    for (const kind of kinds) {
      const files = c.files(kind);
      meta.files[kind] = Object.keys(files);
      meta.remove[kind] = c.remove ? c.remove(kind) : [];
      // yaml-non-utf8 is the only case with a byte that is not UTF-8: write it as Latin-1.
      for (const [rel, content] of Object.entries(files)) put(path.join(root, c.id, kind, rel), content, c.binary);
    }
    put(path.join(root, c.id, 'case.json'), JSON.stringify(meta, null, 2) + '\n');
  }
  put(path.join(root, 'index.json'), JSON.stringify(CASES.map((c) => ({ id: c.id, category: c.category, kinds: c.kinds || ALL, title: c.title })), null, 2) + '\n');
}

if (process.argv.includes('--check')) {
  const tmp = fs.mkdtempSync(path.join(fs.realpathSync(process.env.TMPDIR || '/tmp'), 'infofix-'));
  write(tmp);
  const list = (d) => fs.readdirSync(d, { recursive: true }).filter((f) => fs.statSync(path.join(d, f)).isFile()).sort();
  const a = list(tmp), b = fs.existsSync(out) ? list(out) : [];
  const diff = [...new Set([...a, ...b])].filter((f) => !a.includes(f) || !b.includes(f) || !fs.readFileSync(path.join(tmp, f)).equals(fs.readFileSync(path.join(out, f))));
  fs.rmSync(tmp, { recursive: true, force: true });
  if (diff.length) { console.error(`Fixtures out of date (${diff.length} file(s)), e.g. ${diff.slice(0, 5).join(', ')}. Run: node tests/info-yml/make-fixtures.mjs`); process.exit(1); }
  console.log(`Fixtures up to date: ${CASES.length} cases.`);
} else {
  write(out);
  console.log(`Wrote ${CASES.length} cases to ${path.relative(process.cwd(), out) || out}.`);
}
