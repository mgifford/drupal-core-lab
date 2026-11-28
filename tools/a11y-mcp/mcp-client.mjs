// A minimal MCP client over stdio, for the lab's own tools and tests. It starts the repository's Playwright MCP server
// exactly as .mcp.json configures it and speaks JSON-RPC to it. No MCP SDK dependency.
//
// Host-sandbox options are added only when this process is inside one (DSH_* environment): Chromium cannot nest sandboxes,
// its profile cache and browser-registry marker live outside the workspace, and headed windows cannot open. Production
// .mcp.json keeps the sandbox and the persistent profile; a test or verification tool must still run.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

export function mcpConfig(labRoot) {
  const file = path.join(labRoot, '.mcp.json');
  const config = JSON.parse(fs.readFileSync(file, 'utf8'));
  const spec = config.mcpServers?.playwright;
  if (!spec) throw new Error(`.mcp.json has no "playwright" server: ${file}`);
  const cli = (spec.args || []).find((a) => /cli\.js$/.test(a));
  return { spec, cli: cli ? path.join(labRoot, cli) : null, args: (spec.args || []).filter((a) => !/cli\.js$/.test(a)) };
}

export function startMcpClient({ labRoot, headless = true, extraArgs = [], log = () => {} } = {}) {
  const { spec, cli, args } = mcpConfig(labRoot);
  if (!cli || !fs.existsSync(cli)) throw new Error('@playwright/mcp is not installed: PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm ci --prefix tools/playwright');
  const sandboxed = !!(process.env.DSH_SHELL || process.env.DSH_PROFILE);
  const argv = [...args];
  const env = { ...process.env };
  if (headless) argv.unshift('--headless');
  if (sandboxed) {
    argv.unshift('--no-sandbox', '--isolated');
    env.PWTEST_SERVER_REGISTRY = path.join(labRoot, '.lab-cache', 'a11y-mcp', 'pw-server-registry');
  }
  if (process.env.LAB_PW_BROWSERS) env.PLAYWRIGHT_BROWSERS_PATH = process.env.LAB_PW_BROWSERS;
  const child = spawn(process.execPath, [cli, ...argv, ...extraArgs], { cwd: labRoot, stdio: ['pipe', 'pipe', 'pipe'], env });
  let buffer = '', nextId = 1;
  const pending = new Map();
  const stderr = [];
  child.stderr.on('data', (d) => { stderr.push(String(d)); if (stderr.length > 300) stderr.shift(); });
  child.stdout.on('data', (chunk) => {
    buffer += chunk;
    let at;
    while ((at = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, at).trim(); buffer = buffer.slice(at + 1);
      if (!line) continue;
      let message; try { message = JSON.parse(line); } catch { continue; }
      if (message.id && pending.has(message.id)) { pending.get(message.id)(message); pending.delete(message.id); }
    }
  });
  const request = (method, params = {}, timeout = 180000) => new Promise((resolve, reject) => {
    const id = nextId++;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`MCP ${method} timed out after ${timeout}ms${stderr.length ? `: ${stderr.slice(-3).join('').slice(0, 500)}` : ''}`)); }, timeout);
    pending.set(id, (m) => { clearTimeout(timer); resolve(m); });
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
  });
  const notify = (method, params = {}) => child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method, params }) + '\n');
  const textOf = (result) => (result?.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('\n');
  const call = async (name, args = {}) => {
    const r = await request('tools/call', { name, arguments: args });
    return { isError: !!r.result?.isError, text: textOf(r.result), stderr: stderr.slice(-4).join('') };
  };
  const evaluate = async (fn) => {
    const r = await call('browser_evaluate', { function: fn });
    if (r.isError) throw new Error(`browser_evaluate failed: ${r.text.slice(0, 800)}`);
    const hit = /### Result\n([\s\S]*?)(?:\n### Ran Playwright code|\n### Page|$)/.exec(r.text);
    if (!hit) return null;
    const body = hit[1].trim();
    try { return JSON.parse(body); } catch { return body; }
  };
  return {
    spec, child, stderr, request, notify, call, evaluate,
    async init() {
      const init = await request('initialize', { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'drupal-core-lab', version: '1' } });
      notify('notifications/initialized');
      log(`MCP ${init.result?.serverInfo?.name} ${init.result?.serverInfo?.version} ready`);
      return init;
    },
    async close() {
      try { await call('browser_close', {}); } catch { /* already gone */ }
      try { child.kill('SIGTERM'); } catch { /* already gone */ }
    },
  };
}
