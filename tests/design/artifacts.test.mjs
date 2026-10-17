import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { writeDesignEvidence, readDesignEvidence } from '../../tools/playwright/lib/design-artifacts.mjs';
import { renderEvidenceFile } from '../../tools/playwright/render-design.mjs';
test('compressed evidence is readable directly, atomically replaced, and renders without writing raw JSON', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lab-design-artifact-'));
  try {
    const report = { schema: 'lab-design-observations-3', slug: 'fixture', when: '2026-10-17T00:00:00Z', artifacts: { observations: 'observations.json.gz', summary: 'SUMMARY.md', html: 'report.html' }, requested: {}, pages: [], sites: {}, coverage: {}, limitations: [], themeTransitions: [] };
    const file = path.join(dir, 'observations.json.gz');
    assert.ok(writeDesignEvidence(file, report) > 0); assert.equal(fs.readFileSync(file)[0], 0x1f);
    report.coverage.attempted = 2; writeDesignEvidence(file, report);
    assert.equal(readDesignEvidence(file).coverage.attempted, 2);
    assert.equal(fs.existsSync(path.join(dir, 'observations.json')), false);
    const outputs = renderEvidenceFile(file);
    assert.equal(outputs.length, 2); assert.match(fs.readFileSync(outputs[1], 'utf8'), /gzip-compressed JSON/);
    assert.ok(!fs.readdirSync(dir).some(name => name.includes('.tmp-')));
    const legacy = path.join(dir, 'old.json'); fs.writeFileSync(legacy, JSON.stringify({ ...report, schema: 'lab-design-observations-2' }));
    assert.equal(readDesignEvidence(legacy).artifacts.observations, 'old.json');
    renderEvidenceFile(legacy, path.join(dir, 'legacy'));
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
