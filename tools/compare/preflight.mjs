// Resource preflight for operations that create, start, install or build Drupal environments.
// Read-only: it measures the host, the Docker VM and the running lab projects, then returns pass/warn/block.
// The thresholds are conservative because a pair build peaks around 5 GB and Composer/Yarn extraction can fail
// part-way when the host runs out. Callers must treat "block" as a refusal, not a warning.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

export const GiB = 1024 ** 3;

export const DEFAULTS = Object.freeze({
  disk: { warn_gb: 15, block_gb: 8 },
  memory: { warn_free_percent: 30, block_free_percent: 20, warn_swap_percent: 40, block_swap_percent: 60 },
  docker: { warn_used_percent: 70, block_used_percent: 85 },
  pairs: { warn: 2 },
});

const sh = (cmd, args, opts = {}) => spawnSync(cmd, args, { encoding: 'utf8', timeout: 20000, ...opts });
const num = (x) => (x === null || x === undefined || x === '' ? null : Number.isFinite(Number(x)) ? Number(x) : null);
const percent = (used, total) => (Number.isFinite(used) && Number.isFinite(total) && total > 0 ? Math.round((used / total) * 100) : null);

// df -kP: Filesystem 1024-blocks Used Available Capacity Mounted on
export function parseDfKb(text) {
  const line = String(text || '').trim().split('\n').filter(Boolean).pop();
  if (!line) return null;
  const f = line.split(/\s+/);
  const total = num(f[1]), free = num(f[3]);
  return total == null || free == null ? null : { totalBytes: total * 1024, freeBytes: free * 1024 };
}

// macOS: total = 7168.00M used = 5726.38M free = 1441.62M
export function parseSwapUsage(text) {
  const m = String(text || '').match(/total\s*=\s*([\d.]+)\s*([KMG])?\s+used\s*=\s*([\d.]+)\s*([KMG])?/i);
  if (!m) return null;
  const mult = { K: 1024, M: 1024 ** 2, G: 1024 ** 3 };
  const total = Number(m[1]) * (mult[(m[2] || 'M').toUpperCase()] || 1);
  const used = Number(m[3]) * (mult[(m[4] || 'M').toUpperCase()] || 1);
  return { totalBytes: total, usedBytes: used };
}

// macOS: System-wide memory free percentage: 34%
export function parseMemoryPressure(text) {
  const m = String(text || '').match(/free percentage:\s*(\d+)%/i);
  return m ? Number(m[1]) : null;
}

// Linux /proc/meminfo fallback: MemAvailable and SwapFree/SwapTotal.
export function parseMeminfo(text) {
  const get = (k) => { const m = String(text || '').match(new RegExp(`^${k}:\\s+(\\d+)\\s+kB`, 'm')); return m ? Number(m[1]) * 1024 : null; };
  const total = get('MemTotal'), available = get('MemAvailable');
  const swapTotal = get('SwapTotal'), swapFree = get('SwapFree');
  return {
    freePercent: total && available != null ? Math.round((available / total) * 100) : null,
    swapUsedBytes: swapTotal != null && swapFree != null ? swapTotal - swapFree : null,
    swapTotalBytes: swapTotal,
  };
}

// vm_stat fallback when memory_pressure is unavailable. Approximate: free + inactive + speculative pages.
export function parseVmStat(text, totalBytes, pageSize = 16384) {
  const pages = (k) => { const m = String(text || '').match(new RegExp(`^${k}:\\s+(\\d+)\\.?$`, 'm')); return m ? Number(m[1]) : null; };
  const free = pages('Pages free'), inactive = pages('Pages inactive'), speculative = pages('Pages speculative');
  if (free == null || !totalBytes) return null;
  const usable = (free + (inactive || 0) + (speculative || 0)) * pageSize;
  return Math.min(100, Math.round((usable / totalBytes) * 100));
}

export function measureHost({ root = process.cwd() } = {}) {
  const df = sh('df', ['-kP', root]);
  const disk = df.status === 0 ? parseDfKb(df.stdout) : null;
  let freePercent = null, swapUsedBytes = null, swapTotalBytes = null, method = null;
  if (process.platform === 'darwin') {
    const mp = sh('memory_pressure', ['-Q']);
    if (mp.status === 0) { freePercent = parseMemoryPressure(mp.stdout); if (freePercent != null) method = 'memory_pressure'; }
    if (freePercent == null) {
      const total = num((sh('sysctl', ['-n', 'hw.memsize']).stdout || '').trim());
      const vs = sh('vm_stat');
      if (vs.status === 0) { freePercent = parseVmStat(vs.stdout, total); if (freePercent != null) method = 'vm_stat'; }
    }
    const sw = sh('sysctl', ['-n', 'vm.swapusage']);
    if (sw.status === 0) { const s = parseSwapUsage(sw.stdout); if (s) { swapUsedBytes = s.usedBytes; swapTotalBytes = s.totalBytes; } }
  } else {
    const text = fs.existsSync('/proc/meminfo') ? fs.readFileSync('/proc/meminfo', 'utf8') : '';
    const m = parseMeminfo(text);
    freePercent = m.freePercent; swapUsedBytes = m.swapUsedBytes; swapTotalBytes = m.swapTotalBytes;
    if (freePercent != null) method = 'meminfo';
  }
  return { disk, memory: { freePercent, swapUsedBytes, swapTotalBytes, method }, platform: process.platform };
}

// docker ps labels: name, site. The viewer has a site label but is not a pair.
export function parseDockerPs(text) {
  const rows = String(text || '').split('\n').filter(Boolean).map((l) => l.split('\t'));
  const lab = rows.filter(([, site]) => site && (site.startsWith('repro-') || site === 'drupal-compare'));
  const web = lab.filter(([name, site]) => /-web$/.test(name) && site !== 'drupal-compare');
  return {
    labContainers: lab.length,
    projects: new Set(lab.map(([, site]) => site)).size,
    pairs: Math.floor(web.length / 2),
  };
}

// docker stats MemUsage: "453MiB / 7.748GiB"
export function parseDockerMemUsage(text) {
  const mult = { B: 1, KiB: 1024, MiB: 1024 ** 2, GiB: 1024 ** 3 };
  let total = 0, seen = false;
  for (const line of String(text || '').split('\n').filter(Boolean)) {
    const m = line.match(/^\s*([\d.]+)\s*(B|KiB|MiB|GiB)\s*\//);
    if (!m) continue;
    total += Number(m[1]) * (mult[m[2]] || 1);
    seen = true;
  }
  return seen ? total : null;
}

export function measureDocker() {
  const info = sh('docker', ['info', '--format', '{{.MemTotal}}']);
  const memTotalBytes = info.status === 0 ? num((info.stdout || '').trim()) : null;
  const ps = sh('docker', ['ps', '--format', '{{.Names}}\t{{.Label "com.ddev.site-name"}}']);
  const counts = ps.status === 0 ? parseDockerPs(ps.stdout) : { labContainers: null, projects: null, pairs: null };
  let labUsedBytes = null;
  if (ps.status === 0 && counts.labContainers) {
    const names = ps.stdout.split('\n').filter(Boolean).map((l) => l.split('\t')[0]).filter(Boolean);
    const st = sh('docker', ['stats', '--no-stream', '--format', '{{.MemUsage}}', ...names], { timeout: 30000 });
    if (st.status === 0) labUsedBytes = parseDockerMemUsage(st.stdout);
  }
  return { memTotalBytes, labUsedBytes, ...counts };
}

export function measure({ root } = {}) {
  return { measured_at: new Date().toISOString(), host: measureHost({ root }), docker: measureDocker() };
}

const check = (key, label, status, value, detail) => ({ key, label, status, value, detail });

export function assessResources(snapshot, limits = DEFAULTS) {
  const out = [];
  const disk = snapshot?.host?.disk;
  if (!disk) out.push(check('disk', 'Host free disk', 'unknown', 'not measured', 'df failed; check df -h manually'));
  else {
    const gb = disk.freeBytes / GiB;
    const status = gb >= limits.disk.warn_gb ? 'pass' : gb >= limits.disk.block_gb ? 'warn' : 'block';
    out.push(check('disk', 'Host free disk', status, `${gb.toFixed(1)} GB free`, `warn below ${limits.disk.warn_gb} GB, block below ${limits.disk.block_gb} GB`));
  }
  const mem = snapshot?.host?.memory;
  if (mem?.freePercent == null) out.push(check('memory', 'Host memory free', 'unknown', 'not measured', 'memory_pressure/vm_stat failed'));
  else {
    const status = mem.freePercent >= limits.memory.warn_free_percent ? 'pass' : mem.freePercent >= limits.memory.block_free_percent ? 'warn' : 'block';
    out.push(check('memory', 'Host memory free', status, `${mem.freePercent}% free`, `warn below ${limits.memory.warn_free_percent}%, block below ${limits.memory.block_free_percent}%`));
  }
  if (mem?.swapTotalBytes) {
    const used = percent(mem.swapUsedBytes, mem.swapTotalBytes);
    if (used == null) out.push(check('swap', 'Host swap used', 'unknown', 'not measured', 'swap usage unavailable'));
    else {
      const status = used <= limits.memory.warn_swap_percent ? 'pass' : used <= limits.memory.block_swap_percent ? 'warn' : 'block';
      out.push(check('swap', 'Host swap used', status, `${used}% of ${(mem.swapTotalBytes / GiB).toFixed(1)} GB`, `warn above ${limits.memory.warn_swap_percent}%, block above ${limits.memory.block_swap_percent}%`));
    }
  } else out.push(check('swap', 'Host swap used', 'unknown', 'no swap file', 'no swap configured; memory pressure is the free-percentage check'));
  const d = snapshot?.docker;
  if (d?.memTotalBytes && d?.labUsedBytes != null) {
    const used = percent(d.labUsedBytes, d.memTotalBytes);
    const status = used <= limits.docker.warn_used_percent ? 'pass' : used <= limits.docker.block_used_percent ? 'warn' : 'block';
    out.push(check('docker', 'Docker lab memory', status, `${used}% of ${(d.memTotalBytes / GiB).toFixed(1)} GB`, `warn above ${limits.docker.warn_used_percent}%, block above ${limits.docker.block_used_percent}%`));
  } else out.push(check('docker', 'Docker lab memory', 'unknown', 'not measured', 'docker stats unavailable'));
  if (d?.pairs == null) out.push(check('pairs', 'Running pairs', 'unknown', 'not measured', 'docker ps unavailable'));
  else out.push(check('pairs', 'Running pairs', d.pairs <= limits.pairs.warn ? 'pass' : 'warn', String(d.pairs), `more than ${limits.pairs.warn} pairs needs an explicit reason; stopped environments are cheap`));
  const level = out.some((c) => c.status === 'block') ? 'block' : out.some((c) => c.status !== 'pass') ? 'warn' : 'pass';
  return { level, checks: out, measured_at: snapshot?.measured_at };
}

export function formatPreflight(result) {
  const lines = [`Resource preflight: ${String(result.level).toUpperCase()}`];
  for (const c of result.checks) lines.push(`  ${String(c.status).toUpperCase().padEnd(5)} ${c.label}: ${c.value} (${c.detail})`);
  return lines.join('\n');
}

// The watchdog only needs the host: Docker stats is too slow and too noisy for a 30-second check.
export function criticalReason(host, limits = DEFAULTS) {
  const disk = host?.disk;
  if (disk && disk.freeBytes / GiB < limits.disk.block_gb) return `host free disk ${(disk.freeBytes / GiB).toFixed(1)} GB (floor ${limits.disk.block_gb} GB)`;
  const mem = host?.memory;
  if (mem?.freePercent != null && mem.freePercent < limits.memory.block_free_percent) return `host memory ${mem.freePercent}% free (floor ${limits.memory.block_free_percent}%)`;
  if (mem?.swapTotalBytes) {
    const used = percent(mem.swapUsedBytes, mem.swapTotalBytes);
    if (used != null && used > limits.memory.block_swap_percent) return `swap ${used}% used (floor ${limits.memory.block_swap_percent}%)`;
  }
  return '';
}
