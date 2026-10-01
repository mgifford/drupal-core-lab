const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = process.cwd();
const PATCH_DIR = path.join(ROOT, 'patches');
const REPORT_DATE = new Date().toISOString().slice(0, 10);
const REPORT_JSON = path.join(ROOT, 'reports', `patch-apply-validation-${REPORT_DATE}.json`);
const REPORT_MD = path.join(ROOT, 'reports', `patch-apply-validation-${REPORT_DATE}.md`);

function run(cmd, args, cwd) {
  try {
    const out = execFileSync(cmd, args, { cwd, stdio: 'pipe', encoding: 'utf8' });
    return { ok: true, out };
  } catch (e) {
    return {
      ok: false,
      out: (e.stdout || '') + (e.stderr || ''),
      code: e.status,
    };
  }
}

function classify(filePath, cwd) {
  const forward = run('git', ['apply', '--check', filePath], cwd);
  if (forward.ok) {
    return { status: 'applies-clean', detail: '' };
  }

  const reverse = run('git', ['apply', '--check', '-R', filePath], cwd);
  if (reverse.ok) {
    return { status: 'already-applied', detail: '' };
  }

  const combined = `${forward.out}\n${reverse.out}`;
  if (combined.includes('No valid patches in input')) {
    return { status: 'invalid-format', detail: 'No valid patches in input' };
  }

  return {
    status: 'does-not-apply',
    detail: `${(forward.out || '').split('\n').slice(0, 5).join(' | ')}`.trim(),
  };
}

function copyCurrentPatchFiles(srcDir, destDir) {
  const files = fs.readdirSync(srcDir).filter((f) => f.endsWith('.patch'));
  for (const f of files) {
    fs.copyFileSync(path.join(srcDir, f), path.join(destDir, f));
  }
  return files.sort();
}

function main() {
  const tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), 'drupal-patch-validate-'));
  const wt = path.join(tmpBase, 'wt');

  const add = run('git', ['worktree', 'add', '--detach', wt, 'HEAD'], ROOT);
  if (!add.ok) {
    throw new Error(`Could not create worktree: ${add.out}`);
  }

  let results = [];
  try {
    const wtPatchDir = path.join(wt, 'patches');
    const patchFiles = copyCurrentPatchFiles(PATCH_DIR, wtPatchDir);

    results = patchFiles.map((file, index) => {
      console.error(`[${index + 1}/${patchFiles.length}] validating ${file}`);
      const abs = path.join(wtPatchDir, file);
      const res = classify(abs, wt);
      return { file: `patches/${file}`, ...res };
    });
  } finally {
    run('git', ['worktree', 'remove', '--force', wt], ROOT);
    fs.rmSync(tmpBase, { recursive: true, force: true });
  }

  const summary = results.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  fs.mkdirSync(path.join(ROOT, 'reports'), { recursive: true });
  fs.writeFileSync(
    REPORT_JSON,
    JSON.stringify({ generatedAt: new Date().toISOString(), summary, results }, null, 2),
  );

  const lines = [];
  lines.push(`# Patch Apply Validation (${REPORT_DATE})`);
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  for (const [k, v] of Object.entries(summary).sort((a, b) => a[0].localeCompare(b[0]))) {
    lines.push(`- ${k}: ${v}`);
  }
  lines.push('');
  lines.push('## Results');
  lines.push('');
  lines.push('| Patch | Status | Detail |');
  lines.push('|---|---|---|');
  for (const r of results) {
    const detail = (r.detail || '').replace(/\|/g, '\\|');
    lines.push(`| ${r.file} | ${r.status} | ${detail} |`);
  }

  fs.writeFileSync(REPORT_MD, `${lines.join('\n')}\n`);

  console.log(
    JSON.stringify(
      {
        reportJson: REPORT_JSON,
        reportMd: REPORT_MD,
        summary,
      },
      null,
      2,
    ),
  );
}

main();
