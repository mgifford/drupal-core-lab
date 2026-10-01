const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = process.cwd();
const REPORT = path.join(ROOT, 'reports', 'patch-apply-validation-2026-07-15.json');

function run(cmd, args, cwd) {
  try {
    const out = execFileSync(cmd, args, { cwd, stdio: 'pipe', encoding: 'utf8' });
    return { ok: true, out };
  } catch (e) {
    return { ok: false, out: (e.stdout || '') + (e.stderr || ''), code: e.status };
  }
}

function main() {
  if (!fs.existsSync(REPORT)) {
    throw new Error(`Missing report: ${REPORT}`);
  }

  const report = JSON.parse(fs.readFileSync(REPORT, 'utf8'));
  const targets = report.results.filter((r) => r.status === 'does-not-apply' || r.status === 'invalid-format');

  const tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), 'drupal-patch-reroll-'));
  const wt = path.join(tmpBase, 'wt');
  const rerollDir = path.join(tmpBase, 'rerolled');
  fs.mkdirSync(rerollDir, { recursive: true });

  const add = run('git', ['worktree', 'add', '--detach', wt, 'HEAD'], ROOT);
  if (!add.ok) {
    throw new Error(`Failed to create worktree: ${add.out}`);
  }

  const actions = [];

  try {
    for (let i = 0; i < targets.length; i++) {
      const item = targets[i];
      const relPatch = item.file;
      const absPatch = path.join(ROOT, relPatch);
      const baseName = path.basename(relPatch);

      console.error(`[${i + 1}/${targets.length}] reroll attempt ${baseName}`);

      run('git', ['reset', '--hard', 'HEAD'], wt);
      run('git', ['clean', '-fd'], wt);

      const apply3 = run('git', ['apply', '--3way', absPatch], wt);
      if (!apply3.ok) {
        const rev = run('git', ['apply', '--check', '-R', absPatch], wt);
        if (rev.ok) {
          actions.push({ file: relPatch, action: 'already-applied-no-reroll', note: 'reverse-check-ok' });
        } else {
          actions.push({ file: relPatch, action: 'manual-reroll-needed', note: apply3.out.split('\n').slice(0, 4).join(' | ') });
        }
        continue;
      }

      const diff = run('git', ['diff', '--binary'], wt);
      if (!diff.ok || !diff.out.trim()) {
        actions.push({ file: relPatch, action: 'no-diff-generated', note: '3way apply yielded no working tree diff' });
        continue;
      }

      const tmpPatch = path.join(rerollDir, baseName);
      fs.writeFileSync(tmpPatch, diff.out);

      run('git', ['reset', '--hard', 'HEAD'], wt);
      run('git', ['clean', '-fd'], wt);

      const chk = run('git', ['apply', '--check', tmpPatch], wt);
      if (!chk.ok) {
        actions.push({ file: relPatch, action: 'generated-patch-failed-check', note: chk.out.split('\n').slice(0, 4).join(' | ') });
        continue;
      }

      fs.writeFileSync(absPatch, diff.out);
      actions.push({ file: relPatch, action: 'rerolled', note: 'replaced with 3way-derived patch' });
    }
  } finally {
    run('git', ['worktree', 'remove', '--force', wt], ROOT);
    fs.rmSync(tmpBase, { recursive: true, force: true });
  }

  const outPath = path.join(ROOT, 'reports', 'patch-reroll-attempt-2026-07-15.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), actions }, null, 2));

  console.log(JSON.stringify({ outPath, actionsCount: actions.length, rerolled: actions.filter((a) => a.action === 'rerolled').length }, null, 2));
}

main();
