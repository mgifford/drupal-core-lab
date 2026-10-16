// Launch only an allowlisted installed browser, with a validated URL back to this viewer.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { handoffHash } from './browser-handoff.mjs';

const NAMES = { edge: 'Microsoft Edge', chrome: 'Google Chrome', firefox: 'Firefox', safari: 'Safari' };
export function installedBrowsers({ platform = process.platform, env = process.env, home = os.homedir(), exists = fs.existsSync, find = binary => { const r = spawnSync('which', [binary], { encoding: 'utf8' }); return r.status === 0 ? r.stdout.trim() : null; } } = {}) {
  if (env.CODER_AGENT_URL || env.CODESPACES || (platform === 'linux' && !env.DISPLAY && !env.WAYLAND_DISPLAY)) return [];
  const found = [];
  for (const [id, label] of Object.entries(NAMES)) {
    let candidates = [];
    if (platform === 'darwin') candidates = [`/Applications/${label}.app`, path.join(home, 'Applications', `${label}.app`), ...(id === 'safari' ? ['/System/Applications/Safari.app'] : [])];
    if (platform === 'win32' && id !== 'safari') {
      const rel = { edge: 'Microsoft/Edge/Application/msedge.exe', chrome: 'Google/Chrome/Application/chrome.exe', firefox: 'Mozilla Firefox/firefox.exe' }[id];
      candidates = [env.ProgramFiles, env['ProgramFiles(x86)'], env.LOCALAPPDATA].filter(Boolean).map(p => path.join(p, rel));
    }
    if (platform === 'linux' && id !== 'safari') candidates = ({ edge: ['microsoft-edge', 'microsoft-edge-stable'], chrome: ['google-chrome', 'google-chrome-stable'], firefox: ['firefox'] }[id]).map(find).filter(Boolean);
    const executable = candidates.find(exists);
    if (executable) found.push({ id, label, executable });
  }
  return found;
}
export function launchCommand(browser, url, platform = process.platform) {
  if (!Object.hasOwn(NAMES, browser.id)) throw Error('Unknown browser.');
  return platform === 'darwin' ? ['/usr/bin/open', ['-a', browser.executable, url]] : [browser.executable, [url]];
}
const start = (command, args) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { detached: true, stdio: 'ignore', windowsHide: true });
  child.once('error', reject);
  child.once('spawn', () => { child.unref(); resolve(); });
});
export async function openBrowser(id, snapshot, viewerOrigin, { browsers = installedBrowsers(), run = start, platform = process.platform } = {}) {
  const browser = browsers.find(b => b.id === id);
  if (!browser) throw Error('That browser is not installed on the lab computer.');
  const origin = new URL(viewerOrigin);
  if (!['http:', 'https:'].includes(origin.protocol) || origin.username || origin.password) throw Error('Invalid viewer origin.');
  const url = new URL('/', origin.origin); url.hash = handoffHash(snapshot);
  const [command, args] = launchCommand(browser, url.href, platform);
  await run(command, args, { timeout: 10000, windowsHide: true });
  return { opened: browser.id };
}
