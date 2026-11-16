// Gera os ícones PNG a partir de assets/icons/icon.svg (o desenho-fonte): icon-192/512 (cantos arredondados),
// maskable-192/512 (fundo inteiro, desenho a 80% para o recorte redondo do Android), apple-touch-icon (180, desenho a 86%)
// e favicon-32. Uso: node tools/gerar-icones.mjs   (precisa do Playwright/Chromium). Depois: npm run precache.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); }
const I = fileURLToPath(new URL('../assets/icons/', import.meta.url));
const svg = readFileSync(I + 'icon.svg', 'utf8');
const defs = svg.match(/<defs>[\s\S]*?<\/defs>/)[0];
const corpo = svg.replace(/^[\s\S]*?<\/defs>/, '').replace(/<\/svg>\s*$/, '');
const [fundo, ...resto] = corpo.split(/(?=<g filter|<path d="M\d+ \d+ C)/);
const cheio = (e) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${defs}${fundo.replace(/rx="112"/g, 'rx="0"')}<g transform="translate(${(512 - 512 * e) / 2} ${(512 - 512 * e) / 2}) scale(${e})">${resto.join('')}</g></svg>`;
const alvos = [['icon-192.png', svg, 192], ['icon-512.png', svg, 512], ['favicon-32.png', svg, 32], ['maskable-192.png', cheio(0.8), 192], ['maskable-512.png', cheio(0.8), 512], ['apple-touch-icon.png', cheio(0.86), 180]];
const b = await chromium.launch();
for (const [nome, s, t] of alvos) {
  const p = await b.newPage({ viewport: { width: t, height: t }, deviceScaleFactor: 1 });
  await p.setContent(`<body style="margin:0;background:transparent"><img src="data:image/svg+xml;base64,${Buffer.from(s).toString('base64')}" width="${t}" height="${t}" style="display:block"></body>`);
  await p.screenshot({ path: I + nome, omitBackground: true });
  await p.close();
  console.log('gerado', nome);
}
await b.close();
