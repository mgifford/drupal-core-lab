// Browser theme evidence is separate from configured themes and stylesheet paths.
import { browserThemeContext } from '../../compare/theme-context.mjs';
export function assessRenderedTheme(context, expected) {
  return { expected, status: context.theme ? (context.theme === expected ? 'confirmed' : 'mismatch') : 'unverified',
    actual: context.theme || null, source: context.source, path: context.path, themeAssets: context.themeAssets || [] };
}
export async function checkRenderedTheme(page, expected) {
  let context = await page.evaluate(browserThemeContext);
  if (!context.theme) {
    // Allow deferred Drupal scripts to expose the hint, without waiting forever
    // on pages that legitimately never publish ajaxPageState.theme.
    await page.waitForFunction(() => !!window.drupalSettings?.ajaxPageState?.theme, undefined, { timeout: 2000 }).catch(error => {
      if (error.name !== 'TimeoutError') throw error;
    });
    context = await page.evaluate(browserThemeContext);
  }
  const result = assessRenderedTheme(context, expected);
  if (result.status === 'mismatch') throw new Error(`Expected ${expected}, got ${result.actual} (${result.source})`);
  return result;
}
