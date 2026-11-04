import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { render, routeMeta, siteUrl, pageMeta } from '../apps/web/.ssr/entry-server.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'apps/web/dist');
const template = await fs.readFile(path.join(output, 'index.html'), 'utf8');
const escape = (value) => value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function html(pathname, content, canonical = true) {
  const meta = routeMeta(pathname);
  const head = `<meta name="description" content="${escape(meta.description)}"/><meta name="robots" content="${meta.noindex ? 'noindex,follow' : 'index,follow'}"/>${canonical ? `<link rel="canonical" href="${escape(meta.canonical)}"/>` : ''}<meta property="og:title" content="${escape(meta.title)}"/><meta property="og:description" content="${escape(meta.description)}"/><meta property="og:url" content="${escape(meta.canonical)}"/><meta property="og:image" content="${siteUrl}/brand/social-card.png"/><meta property="og:image:width" content="1200"/><meta property="og:image:height" content="630"/><meta property="og:image:alt" content="MatchIQ: el juego, en datos"/><meta name="twitter:image" content="${siteUrl}/brand/social-card.png"/><meta name="twitter:title" content="${escape(meta.title)}"/><meta name="twitter:description" content="${escape(meta.description)}"/>`;
  return template.replace(/<title>.*?<\/title>/, `<title>${escape(meta.title)}</title>`).replace('<!--seo-head-->', head).replace('<div id="root"></div>', `<div id="root">${content}</div>`);
}
for (const route of Object.keys(pageMeta)) {
  let result = html(route, render(route));
  if (route === '/inicio') {
    const structured = { '@context': 'https://schema.org', '@type': 'WebSite', name: 'MatchIQ', url: `${siteUrl}/inicio`, description: pageMeta[route].description, inLanguage: 'es', image: `${siteUrl}/brand/social-card.png` };
    result = result.replace('</head>', `<script type="application/ld+json">${JSON.stringify(structured).replace(/</g, '\\u003c')}</script></head>`);
    await fs.writeFile(path.join(output, 'index.html'), result);
  }
  await fs.writeFile(path.join(output, `${route.slice(1)}.html`), result);
}
await fs.writeFile(path.join(output, 'app.html'), html('/equipos/consulta', '', false));
await fs.writeFile(path.join(output, '404.html'), html('/pagina-no-encontrada', render('/pagina-no-encontrada'), false));
await fs.writeFile(path.join(output, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`);
await fs.writeFile(path.join(output, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${Object.keys(pageMeta).map((route) => `<url><loc>${siteUrl}${route}</loc></url>`).join('')}</urlset>`);
console.log('Prerender completo: Inicio, Equipos, Comparador, HTML dinámico noindex, 404, robots y sitemap. Sin peticiones a la API.');
