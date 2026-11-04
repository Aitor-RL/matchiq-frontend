import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'apps/web/public/brand');
await fs.mkdir(output, { recursive: true });
const font = opentype.loadSync(path.join(root, 'apps/web/node_modules/@fontsource/barlow-condensed/files/barlow-condensed-latin-900-italic.woff'));
function text(value, x, y, height, color = '#111111') {
  const glyphs = font.getPath(value, 0, 0, 100); const b = glyphs.getBoundingBox(); const scale = height / (b.y2 - b.y1);
  return `<path fill="${color}" d="${glyphs.toPathData(2)}" transform="translate(${x},${y}) scale(${scale}) translate(${-b.x1},${-b.y1})"/>`;
}
const iq = (background = '#111111', ink = '#c5f451') => `<rect x="2" y="2" width="60" height="60" rx="16" fill="${background}"/><path d="M16 18h7v28h-7z" fill="${ink}"/><circle cx="40" cy="31" r="12" fill="none" stroke="${ink}" stroke-width="7"/><path d="m44 38 9 11" fill="none" stroke="${ink}" stroke-width="7" stroke-linecap="square"/>`;
const svg = (width, height, content, label = 'MatchIQ') => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${label}"><title>${label}</title>${content}</svg>`;
const primary = `${iq()}${text('MATCHIQ', 78, 14, 38)}`;
const assets = {
  'symbol.svg': svg(64, 64, iq()),
  'logo.svg': svg(260, 64, primary),
  'logo-dark.svg': svg(260, 64, `${iq('#c5f451', '#111111')}${text('MATCHIQ', 78, 14, 38, '#ffffff')}`),
  'logo-mono.svg': svg(260, 64, `${iq('#111111', '#ffffff')}${text('MATCHIQ', 78, 14, 38)}`),
  'logo-typographic.svg': svg(260, 64, `${text('MATCHIQ', 10, 10, 44)}<path d="M14 59h200" stroke="#7544db" stroke-width="5"/>`),
  'logo-pitch.svg': svg(260, 64, `<rect x="3" y="5" width="60" height="54" rx="10" fill="#c5f451" stroke="#111" stroke-width="3"/><path d="M33 7v50M13 43l12-13 10 5 17-18" fill="none" stroke="#111" stroke-width="4"/><circle cx="33" cy="32" r="10" fill="none" stroke="#111" stroke-width="2"/>${text('MATCHIQ', 78, 14, 38)}`),
};
for (const [name, source] of Object.entries(assets)) await fs.writeFile(path.join(output, name), source);
await fs.writeFile(path.join(root, 'apps/web/public/favicon.svg'), assets['symbol.svg']);
for (const [file, size] of [['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180]]) await sharp(Buffer.from(assets['symbol.svg'])).resize(size, size).png().toFile(path.join(output, file));
const social = svg(1200, 630, `<rect width="1200" height="630" fill="#f7f8f3"/><path d="M0 0h1200v16H0zM0 574h1200v56H0z" fill="#111"/><path d="M885 16h315v558H770z" fill="#c5f451"/><g transform="translate(70 65)">${primary}</g>${text('EL JUEGO,', 70, 220, 100)}${text('EN DATOS.', 70, 345, 100)}<g transform="translate(940 225) scale(2.5)">${iq()}</g>${text('COMPARA. EXPLORA. ENTIENDE.', 72, 500, 24)}${text('MATCHIQ', 70, 592, 22, '#c5f451')}`, 'MatchIQ — El juego, en datos');
await sharp(Buffer.from(social)).png().toFile(path.join(output, 'social-card.png'));
const board = svg(960, 500, `<rect width="960" height="500" fill="#e8e9e5"/>${text('UNA MARCA. TRES DIRECCIONES.', 40, 30, 30)}<rect x="24" y="92" width="912" height="110" rx="18" fill="white"/>${text('01', 50, 125, 30)}<g transform="translate(155 116)">${primary}</g>${text('PRINCIPAL / IQ', 525, 139, 19)}<rect x="24" y="218" width="912" height="110" rx="18" fill="white"/>${text('02', 50, 251, 30)}<g transform="translate(155 242)">${text('MATCHIQ', 10, 10, 44)}<path d="M14 59h200" stroke="#7544db" stroke-width="5"/></g>${text('TIPOGRAFICA', 525, 265, 19)}<rect x="24" y="344" width="912" height="110" rx="18" fill="white"/>${text('03', 50, 377, 30)}<g transform="translate(155 368)"><rect x="3" y="5" width="60" height="54" rx="10" fill="#c5f451" stroke="#111" stroke-width="3"/><path d="M33 7v50M13 43l12-13 10 5 17-18" fill="none" stroke="#111" stroke-width="4"/>${text('MATCHIQ', 78, 14, 38)}</g>${text('CAMPO Y TENDENCIA', 525, 391, 19)}`, 'Propuestas de identidad MatchIQ');
await fs.mkdir(path.join(root, 'docs/brand'), { recursive: true });
await fs.writeFile(path.join(root, 'docs/brand/proposals.svg'), board);
await sharp(Buffer.from(board)).png().toFile(path.join(root, 'docs/brand/proposals.png'));
console.log('Identidad SVG trazada, tres propuestas, iconos PNG e imagen social generados.');
