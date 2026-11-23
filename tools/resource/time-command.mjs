// Run one command under the host's /usr/bin/time and parse user/system CPU, wall time, peak RSS and block I/O.
// Platform-specific formats are parsed separately. If /usr/bin/time is not available, only wall time and exit status
// are measured, and the event says so; no CPU number is invented.
import fs from 'node:fs';
import { spawn } from 'node:child_process';

const TIME = '/usr/bin/time';

export function parseTimeOutput(text, platform = process.platform) {
  const out = { wall_ms: null, user_seconds: null, system_seconds: null, max_rss_bytes: null, read_ops: null, write_ops: null, format: platform === 'darwin' ? 'bsd' : 'gnu' };
  if (platform === 'darwin') {
    const real = String(text).match(/^\s*([\d.]+)\s+real\s+([\d.]+)\s+user\s+([\d.]+)\s+sys\s*$/m);
    if (real) { out.wall_ms = Number(real[1]) * 1000; out.user_seconds = Number(real[2]); out.system_seconds = Number(real[3]); }
    const rss = String(text).match(/^\s*(\d+)\s+maximum resident set size\s*$/m);
    if (rss) out.max_rss_bytes = Number(rss[1]);
    const inOps = String(text).match(/^\s*(\d+)\s+block input operations\s*$/m);
    const outOps = String(text).match(/^\s*(\d+)\s+block output operations\s*$/m);
    if (inOps) out.read_ops = Number(inOps[1]);
    if (outOps) out.write_ops = Number(outOps[1]);
  }
  else {
    const user = String(text).match(/^\s*User time \(seconds\):\s*([\d.]+)/m);
    const sys = String(text).match(/^\s*System time \(seconds\):\s*([\d.]+)/m);
    const rss = String(text).match(/^\s*Maximum resident set size \(kbytes\):\s*(\d+)/m);
    const elapsed = String(text).match(/^\s*Elapsed \(wall clock\) time \(h:mm:ss or m:ss\):\s*([\d:.]+)/m);
    if (user) out.user_seconds = Number(user[1]);
    if (sys) out.system_seconds = Number(sys[1]);
    if (rss) out.max_rss_bytes = Number(rss[1]) * 1024;
    if (elapsed) {
      const parts = elapsed[1].split(':').map(Number);
      out.wall_ms = (parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : parts.length === 2 ? parts[0] * 60 + parts[1] : parts[0]) * 1000;
    }
  }
  if (out.wall_ms == null && out.user_seconds != null) out.wall_ms = null;
  return out;
}

const TIME_LINE = /^\s*(?:[\d.]+\s+real\s+[\d.]+\s+user\s+[\d.]+\s+sys|[\d.]+\s+(?:real|user|sys)|\d+\s+(?:maximum resident set size|average (?:shared|unshared)|page reclaims|page faults|swaps|block (?:input|output) operations|messages (?:sent|received)|signals received|voluntary context switches|involuntary context switches|instructions retired|cycles elapsed|peak memory footprint)|User time|System time|Elapsed \(wall clock\)|Maximum resident set size|Average|Minor|Major|Voluntary|Involuntary|Swaps|File system inputs|File system outputs|Socket messages|Signals delivered|Page size|Exit status)/;

export function runMeasured(command, args = [], { cwd = process.cwd(), env = process.env, timeoutMs = null } = {}) {
  return new Promise((resolve) => {
    const started = Date.now();
    const useTime = fs.existsSync(TIME) && process.platform !== 'win32';
    const bin = useTime ? TIME : command;
    const argv = useTime ? [process.platform === 'darwin' ? '-l' : '-v', command, ...args] : args;
    let stderr = '', timedOut = false, settled = false;
    const child = spawn(bin, argv, { cwd, env, stdio: ['inherit', 'inherit', 'pipe'] });
    let timer = null, killTimer = null;
    if (timeoutMs && timeoutMs > 0) timer = setTimeout(() => { timedOut = true; try { child.kill('SIGTERM'); } catch { /* gone */ } killTimer = setTimeout(() => { try { child.kill('SIGKILL'); } catch { /* gone */ } }, 5000); }, timeoutMs);
    child.stderr.on('data', (d) => { stderr += d; });
    const finish = (code, signal, error = null) => {
      if (settled) return; settled = true;
      if (timer) clearTimeout(timer); if (killTimer) clearTimeout(killTimer);
      const parsed = useTime ? parseTimeOutput(stderr) : { wall_ms: Date.now() - started, user_seconds: null, system_seconds: null, max_rss_bytes: null, read_ops: null, write_ops: null, format: 'none' };
      const visible = stderr.split('\n').filter((line) => !TIME_LINE.test(line)).join('\n').trim();
      resolve({
        status: code, signal, error, timedOut,
        wall_ms: parsed.wall_ms ?? Date.now() - started,
        user_seconds: parsed.user_seconds, system_seconds: parsed.system_seconds,
        max_rss_bytes: parsed.max_rss_bytes, read_ops: parsed.read_ops, write_ops: parsed.write_ops,
        time_format: parsed.format, stderr: visible,
      });
    };
    child.on('error', (error) => finish(null, null, error.message));
    child.on('close', (code, signal) => finish(code, signal));
  });
}
