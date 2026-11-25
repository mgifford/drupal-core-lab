// Detect browser tests and name the add-on's Chrome container. Kept pure so scripts/try-tests.mjs can fail clearly before it
// runs a test, and so the detection has a regression test independent of Docker.
import { ddevName } from './lib.mjs';

export const chromeContainerName = (env) => `ddev-${ddevName(env)}-chrome`;

export function needsChrome({ paths = [], contents = [] } = {}) {
  return paths.some((p) => /FunctionalJavascript|WebDriverTestBase/i.test(String(p || '')))
    || contents.some((c) => /FunctionalJavascriptTestBase|WebDriverTestBase/.test(String(c || '')));
}
