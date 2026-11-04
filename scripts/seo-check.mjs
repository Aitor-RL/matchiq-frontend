import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'apps/web/dist');
const { routeMeta, siteUrl, pageMeta, contextHref } = await import('../apps/web/.ssr/entry-server.js');
const titles = new Set();
for (const route of Object.keys(pageMeta)) {
  const html = await fs.readFile(path.join(dist, route.slice(1) + '.html'), 'utf8');
  assert.equal((html.match(/<title>/g) || []).length, 1);
  assert.equal((html.match(/rel="canonical"/g) || []).length, 1);
  assert(html.includes(`<title>${pageMeta[route].title}</title>`));
  assert(html.includes(`<meta name="description" content="${pageMeta[route].description}"`));
  assert(html.includes(`${siteUrl}${route}`));
  assert(html.includes('<h1>') && html.includes('<main'));
  assert(!html.includes('seo-head') && !html.includes('Versión local con datos sintéticos'));
  assert(html.includes('social-card.png') && html.includes('property="og:title"'));
  assert(!/modulepreload[^>]+charts-/.test(html));
  titles.add(pageMeta[route].title);
}
assert.equal(titles.size, 3);
assert(routeMeta('/comparador', '?a=one&b=two').noindex);
assert(routeMeta('/equipos/unknown').noindex);
assert(!routeMeta('/inicio').noindex);
assert((await fs.readFile(path.join(dist, '404.html'), 'utf8')).includes('noindex,follow'));
assert((await fs.readFile(path.join(dist, 'app.html'), 'utf8')).includes('noindex,follow'));
const image = await fs.readFile(path.join(dist, 'brand/social-card.png'));
assert.equal(image.readUInt32BE(16), 1200); assert.equal(image.readUInt32BE(20), 630);
const sitemap = await fs.readFile(path.join(dist, 'sitemap.xml'), 'utf8');
assert.equal((sitemap.match(/<loc>/g) || []).length, 3);
assert(!/<loc>[^<]*\?/.test(sitemap));
assert((await fs.readFile(path.join(dist, 'robots.txt'), 'utf8')).includes(`${siteUrl}/sitemap.xml`));
assert.equal(contextHref('/equipos/bruma', '?competition=fd-SP2&season=2026'), '/equipos/bruma?competition=fd-SP2&season=2026');
assert.equal(contextHref('/comparador?season=2025', '?competition=fd-SP1&season=2026'), '/comparador?season=2025&competition=fd-SP1');
assert.equal(contextHref('/equipos', '?competition=invalid'), '/equipos');
console.log('SEO comprobado: HTML inicial, títulos únicos, canonical, robots, sitemap, noindex y PNG social 1200×630.');
