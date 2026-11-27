// Loaded with NODE_OPTIONS=--import by tools/compare/hermetic.mjs (the static self-test): a connection to anything but this
// machine's loopback is refused and recorded, so a unit test that reaches the network, a DDEV site or the DDEV router fails the same
// way on every machine. Unix sockets (a path) are local and allowed. Nothing is changed outside a hermetic run: it is only loaded there.
import fs from 'node:fs';
import net from 'node:net';

const LOOPBACK = /^(localhost|127(?:\.\d{1,3}){3}|::1|0\.0\.0\.0|::|\[::1\])$/i;
const log = process.env.LAB_HERMETIC_LOG;
const original = net.Socket.prototype.connect;

net.Socket.prototype.connect = function connect(...args) {
  // Node passes either (options[, cb]), (port[, host][, cb]), (path[, cb]) or its own normalised [options, cb] array.
  const first = Array.isArray(args[0]) ? args[0][0] : args[0];
  const opts = first && typeof first === 'object' ? first : typeof first === 'string' && Number.isNaN(Number(first)) ? { path: first } : { port: first, host: typeof args[1] === 'string' ? args[1] : undefined };
  const host = opts.path ? null : (opts.host || 'localhost');
  if (host && !LOOPBACK.test(host)) {
    if (log) { try { fs.appendFileSync(log, `net ${host}:${opts.port ?? ''}\n`); } catch { /* the log went away: still refuse */ } }
    const err = Object.assign(new Error(`HERMETIC: the static self-test refused a connection to ${host}:${opts.port ?? ''} (only this machine's loopback is allowed; give the test a local server or a stub)`), { code: 'EHERMETIC' });
    process.nextTick(() => this.destroy(err));
    return this;
  }
  return original.apply(this, args);
};
