// Re-render either compressed current evidence or older raw JSON; no browser/DDEV.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readDesignEvidence } from './lib/design-artifacts.mjs';
import { renderDesignReport, designArtifactNames } from './lib/design-report.mjs';
export function renderEvidenceFile(file, directory = path.dirname(file)) {
  const report = readDesignEvidence(file);
  const fallback = designArtifactNames(report.slug, report.when);
  const rendered = renderDesignReport(report);
  fs.mkdirSync(directory, { recursive: true });
  const names = [path.basename(report.artifacts?.summary || fallback.summary), path.basename(report.artifacts?.html || fallback.html)];
  fs.writeFileSync(path.join(directory, names[0]), rendered.markdown);
  fs.writeFileSync(path.join(directory, names[1]), rendered.html);
  return names.map(name => path.join(directory, name));
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [file, ...extra] = process.argv.slice(2);
  if (!file || extra.some(value => !value.startsWith('--out='))) throw new Error('Usage: node tools/playwright/render-design.mjs <observations.json[.gz]> [--out=directory]');
  for (const output of renderEvidenceFile(file, extra.find(value => value.startsWith('--out='))?.slice(6))) console.log(output);
}
