import { spawnSync } from 'node:child_process';
import { envDir } from '../../compare/lib.mjs';

// Keep both sites in the same rendering state; callers restore the default theme.
export function setDefaultTheme(env, theme) {
  if (!/^[a-z0-9_]+$/.test(theme)) throw new Error(`theme name ${theme} is not a machine name`);
  // Use stdin so DDEV's shell does not expand PHP variables in the bootstrap.
  const php = `<?php\n$a = require "autoload.php"; $r = Symfony\\Component\\HttpFoundation\\Request::create("/"); $k = Drupal\\Core\\DrupalKernel::createFromRequest($r, $a, "prod"); $k->boot(); $k->preHandle($r);\n\\Drupal::service("theme_installer")->install(["${theme}"]); \\Drupal::configFactory()->getEditable("system.theme")->set("default", "${theme}")->save(); drupal_flush_all_caches();\necho \\Drupal::config("system.theme")->get("default"), "\\n";\n`;
  const r = spawnSync('ddev', ['exec', 'php'], { cwd: envDir(env), input: php, encoding: 'utf8', timeout: 180000 });
  const got = (r.stdout || '').trim().split('\n').pop();
  if (r.status !== 0 || got !== theme) throw new Error(`could not set the default theme of ${env} to ${theme}: ${(r.stderr || r.stdout || '').trim().slice(0, 300)}`);
}

export function resetHistory(env) {
  const php = `<?php\n$a = require "autoload.php"; $r = Symfony\\Component\\HttpFoundation\\Request::create("/"); $k = Drupal\\Core\\DrupalKernel::createFromRequest($r, $a, "prod"); $k->boot(); $k->preHandle($r);\nif (\\Drupal::moduleHandler()->moduleExists("history")) { \\Drupal::database()->delete("history")->condition("uid", 1)->execute(); }\necho "ok\\n";\n`;
  const r = spawnSync('ddev', ['exec', 'php'], { cwd: envDir(env), input: php, encoding: 'utf8', timeout: 120000 });
  if (r.status !== 0) console.warn(`history of ${env} not reset: ${(r.stderr || r.stdout || '').trim().slice(0, 200)}`);
}
