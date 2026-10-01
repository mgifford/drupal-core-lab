/**
 * Simplified drush helpers for the Guidepup virtual SR tests.
 *
 * This provides the subset of crawl-finalize.ts functionality needed
 * by the virtual SR tests without depending on core's internal modules.
 */
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

/** Root-level reports/ dir (repo root is three levels up from lib/). */
export const OUT_DIR = path.resolve(__dirname, '../../../reports');
/** Temp dir where each scan group writes its partial result shard. */
export const TEMP_DIR = path.join(OUT_DIR, '.tmp-crawl');

export function drush(cmd: string): string {
  return execSync(`ddev drush ${cmd}`).toString();
}

/**
 * Capture the site's original settings once. Called from the outer
 * beforeAll of every crawl worker; only the first write wins.
 */
export function captureOriginalSettingsOnce(): void {
  const stateFile = path.join(TEMP_DIR, '.original-settings.json');
  if (fs.existsSync(stateFile)) {
    return;
  }

  const defaultTheme = drush('config:get system.theme default --format=string').trim();
  const adminTheme = drush('config:get system.theme admin --format=string').trim() || 'claro';

  const original = {
    defaultTheme,
    adminTheme,
  };

  fs.mkdirSync(TEMP_DIR, { recursive: true });
  fs.writeFileSync(stateFile, JSON.stringify(original, null, 2));
}
