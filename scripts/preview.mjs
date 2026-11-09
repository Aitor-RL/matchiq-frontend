import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const output = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../apps/web/dist');
const port = Number(process.env.MATCHIQ_PREVIEW_PORT || 4175);
const api = process.env.MATCHIQ_PREVIEW_API_URL;
const types = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.xml': 'application/xml', '.txt': 'text/plain', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff': 'font/woff', '.woff2': 'font/woff2' };
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://127.0.0.1:${port}`);
    const generating = req.method === 'POST' && url.pathname === '/api/compare/ai-analysis';
    if (req.method !== 'GET' && req.method !== 'HEAD' && !generating) { res.writeHead(405); res.end(); return; }
    if (url.pathname.startsWith('/api/')) {
      if (!api) { res.writeHead(503, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'No hay una API configurada para esta vista previa.' })); return; }
      const upstream = await fetch(`${api.replace(/\/$/, '')}/${url.pathname.slice('/api/'.length)}${url.search}`, {
        method: generating ? 'POST' : 'GET',
        signal: AbortSignal.timeout(generating ? 45000 : 20000),
      });
      res.writeHead(upstream.status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(await upstream.text()); return;
    }
    if (url.pathname === '/') { res.writeHead(308, { Location: '/inicio' }); res.end(); return; }
    let name = decodeURIComponent(url.pathname);
    if (['/inicio', '/equipos', '/comparador'].includes(name)) name += '.html';
    else if (/^\/(equipos|partidos)\/[^/]+$/.test(name)) name = '/app.html';
    const target = path.resolve(output, `.${name}`);
    if (!target.startsWith(output + path.sep)) { res.writeHead(404); res.end(); return; }
    let body; let status = 200;
    try { body = await fs.readFile(target); }
    catch { body = await fs.readFile(path.join(output, '404.html')); status = 404; name = '/404.html'; }
    res.writeHead(status, { 'Content-Type': types[path.extname(name)] || 'application/octet-stream', 'Cache-Control': name.startsWith('/assets/') ? 'public,max-age=31536000,immutable' : 'no-cache', ...(name === '/app.html' || status === 404 ? { 'X-Robots-Tag': 'noindex,follow' } : {}) });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch { res.writeHead(502); res.end('No se ha podido servir la vista previa.'); }
});
server.listen(port, '127.0.0.1', () => console.log(`MatchIQ preview: http://127.0.0.1:${port}/inicio`));
process.once('SIGINT', () => server.close()); process.once('SIGTERM', () => server.close());

