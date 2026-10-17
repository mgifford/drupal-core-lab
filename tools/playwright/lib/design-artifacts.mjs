// Compressed local evidence with atomic replacement. Readers accept older JSON.
import fs from 'node:fs';
import path from 'node:path';
import { gzipSync, gunzipSync } from 'node:zlib';
export function writeDesignEvidence(file, report) {
  if (!file.endsWith('.json.gz')) throw new Error('Design evidence must use .json.gz');
  const bytes = gzipSync(JSON.stringify(report), { level: 6 });
  const temporary = file + '.tmp-' + process.pid;
  try { fs.writeFileSync(temporary, bytes); fs.renameSync(temporary, file); }
  finally { fs.rmSync(temporary, { force: true }); }
  return bytes.length;
}
export function readDesignEvidence(file) {
  const bytes = fs.readFileSync(file);
  const compressed = bytes[0] === 0x1f && bytes[1] === 0x8b;
  const report = JSON.parse((compressed ? gunzipSync(bytes) : bytes).toString('utf8'));
  if (!/^lab-design-observations-[23]$/.test(report.schema || '') || !Array.isArray(report.pages)) throw new Error('Not a supported design observation report');
  return { ...report, artifacts: { ...report.artifacts, observations: path.basename(file) } };
}
