// Fixed proxy identities shared by cloud tools and the Coder prompt generator.
// DDEV/nginx declarations are checked against these by tests/lab/coder-prompt.test.mjs.
import { pathToFileURL } from 'node:url';

export const PROXY_PROJECTS = Object.freeze([
  Object.freeze({ role: 'viewer', name: 'drupal-compare', dir: 'tools/compare/site' }),
  Object.freeze({ role: 'before', name: 'drupal-compare-before', dir: 'tools/compare/cloud/before' }),
  Object.freeze({ role: 'after', name: 'drupal-compare-after', dir: 'tools/compare/cloud/after' }),
]);
export const PROJECT_NAMES = PROXY_PROJECTS.map(({ name }) => name).join(',');

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.slice(2).join(' ') !== '--project-names') {
    console.error('Usage: node tools/compare/cloud/config.mjs --project-names');
    process.exitCode = 2;
  } else console.log(PROJECT_NAMES);
}
