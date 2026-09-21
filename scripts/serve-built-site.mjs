/** Local-only CI preview of Vercel's compiled static files and Astro fetch handler. */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const project = fileURLToPath(new URL('../', import.meta.url));
const staticRoot = path.join(project, '.vercel/output/static');
const functionRoot = path.join(project, '.vercel/output/functions/_render.func');
const config = JSON.parse(await readFile(path.join(functionRoot, '.vc-config.json'), 'utf8'));
const { default: app } = await import(pathToFileURL(path.join(functionRoot, config.handler)).href);
if (typeof app?.fetch !== 'function') throw new Error('Built Astro handler does not expose fetch');
const port = Number(process.env.LINK_CHECK_PORT || '4328');
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid link-check port');
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.ico': 'image/x-icon', '.pdf': 'application/pdf', '.txt': 'text/plain', '.xml': 'application/xml' };

const server = createServer(async (req, res) => {
  try {
    if (!['GET', 'HEAD'].includes(req.method || '')) { res.writeHead(405); res.end(); return; }
    const url = new URL(req.url || '/', `http://127.0.0.1:${port}`);
    const pathname = decodeURIComponent(url.pathname);
    const candidate = path.resolve(staticRoot, `.${pathname}`);
    if (!candidate.startsWith(staticRoot + path.sep) && candidate !== staticRoot) { res.writeHead(400); res.end(); return; }
    for (const file of [candidate, path.join(candidate, 'index.html'), `${candidate}.html`]) {
      const info = await stat(file).catch(() => null);
      if (!info?.isFile()) continue;
      res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
      res.end(req.method === 'HEAD' ? undefined : await readFile(file));
      return;
    }
    const request = new Request(url, { method: req.method, headers: req.headers });
    const response = await app.fetch(request);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(req.method === 'HEAD' ? undefined : Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error(error);
    if (!res.headersSent) res.writeHead(500);
    res.end('Built-site preview failed');
  }
});
server.listen(port, '127.0.0.1', () => console.log(`Built site available at http://127.0.0.1:${port}`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
