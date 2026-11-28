// A tiny static server for the dynamic accessibility-checkpoint fixture controls.
//
// The controls are single self-contained HTML files, so "the site" is a directory: this server serves those files by
// name with text/html and answers 404 for everything else. No network access is used or needed; the tests start it on a
// loopback port (127.0.0.1:0) and scan the pages through the lab's checkpoint code.
//
// Run it directly for manual exploration with Playwright MCP:
//
//   node tests/fixtures/a11y-mcp/serve.mjs
//
// prints the URL and the control list, and stays up until Ctrl+C.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

// Only a plain file name in this directory is servable: no paths, no traversal, no other extensions.
const HTML_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]*\.html$/;

function send(response, status, body) {
  response.writeHead(status, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
  response.end(body);
}

function fixtureFiles(root) {
  try {
    return fs.readdirSync(root).filter((name) => HTML_NAME.test(name)).sort();
  } catch {
    return [];
  }
}

// The index is generated, so it cannot drift from the controls on disk.
function indexPage(root, origin) {
  const items = fixtureFiles(root).map((name) => `    <li><a href="/${name}">${name}</a></li>`).join('\n');
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Dynamic checkpoint fixture controls</title></head>
<body>
<h1>Dynamic checkpoint fixture controls</h1>
<p>Open one control at a time. Each page is self-contained: inline CSS and JavaScript only, no external requests.</p>
<ul>
${items}
</ul>
<p>Served by <code>tests/fixtures/a11y-mcp/serve.mjs</code> from ${origin}.</p>
</body>
</html>
`;
}

export async function startFixtureServer({ root = HERE } = {}) {
  const base = path.resolve(root);
  const server = http.createServer((request, response) => {
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(request.url || '/', 'http://127.0.0.1').pathname);
    } catch {
      send(response, 400, '<!DOCTYPE html><title>Bad request</title><p>Bad request</p>');
      return;
    }
    if (pathname === '/' || pathname === '/index.html') {
      send(response, 200, indexPage(base, `http://${request.headers.host || '127.0.0.1'}`));
      return;
    }
    const name = pathname.replace(/^\/+/, '');
    if (!HTML_NAME.test(name)) {
      send(response, 404, '<!DOCTYPE html><title>Not found</title><p>Not found</p>');
      return;
    }
    const file = path.join(base, name);
    // Belt and braces: the resolved file must still be directly inside the served root.
    if (path.dirname(file) !== base) {
      send(response, 404, '<!DOCTYPE html><title>Not found</title><p>Not found</p>');
      return;
    }
    fs.readFile(file, (error, body) => {
      if (error) {
        send(response, 404, '<!DOCTYPE html><title>Not found</title><p>Not found</p>');
        return;
      }
      response.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
      response.end(body);
    });
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const { port } = server.address();
  return {
    url: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve()))),
  };
}

// Direct run: print the URL and stay up (for manual exploration with Playwright MCP).
const runDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (runDirectly) {
  const { url, close } = await startFixtureServer();
  console.log(`Fixture server: ${url}`);
  for (const name of fixtureFiles(HERE)) console.log(`  ${url}/${name}`);
  console.log('Press Ctrl+C to stop.');
  const stop = () => { close().then(() => process.exit(0), () => process.exit(1)); };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}
