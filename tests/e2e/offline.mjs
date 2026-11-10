// Teste do PWA: instala o service worker, corta a rede e percorre todas as rotas e arquivos offline.
// Também mede a fluidez da Imersão com a CPU desacelerada em 4× (celular intermediário).
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let chromium; try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); }
const root = fileURLToPath(new URL('../..', import.meta.url)), PORT = 8124;
const server = spawn(process.execPath, [root + 'tools/serve.mjs', String(PORT)], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 500));
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, locale: 'pt-BR' });
const page = await ctx.newPage(); const errors = []; let fails = 0;
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); }); page.on('pageerror', (e) => errors.push(e.message));
const ok = (c, msg) => { console.log(`${c ? 'ok ' : 'FALHOU'}  ${msg}`); if (!c) fails++; };
await page.goto(`http://localhost:${PORT}/index.html`);
await page.waitForFunction(async () => { const r = await navigator.serviceWorker.getRegistration(); return !!(r && r.active); }, null, { timeout: 30000 });
await page.waitForTimeout(800);
const assets = eval(readFileSync(root + 'sw-assets.js', 'utf8').replace(/self\./g, 'globalThis.') + '; globalThis.SEXTETO_ASSETS');
const cached = await page.evaluate(async () => { const k = (await caches.keys()).find((x) => x.startsWith('sexteto-')); return (await (await caches.open(k)).keys()).length; });
ok(cached === assets.length, `pré-cache completo: ${cached} de ${assets.length} arquivos`);
const man = JSON.parse(readFileSync(root + 'manifest.webmanifest', 'utf8'));
ok(man.icons.some((i) => i.purpose === 'maskable') && man.display === 'standalone' && man.start_url, 'manifest com ícone maskable, display standalone e start_url');
server.kill(); await ctx.setOffline(true); await page.waitForTimeout(300);
await page.reload(); await page.waitForTimeout(700);
ok(await page.locator('.tower button').count() === 6, 'app abre offline (servidor desligado e rede cortada)');
const views = readFileSync(root + 'js/app.js', 'utf8').match(/const VIEWS = new Set\(\[([\s\S]*?)\]\)/)[1].match(/'[^']+'/g).map((s) => s.slice(1, -1));
let bad = [];
for (const v of views) { const hash = '#/' + v.replace('-', '/') + (v === 'harmonia-aula' ? '/3' : v === 'estudio-licao' ? '/2.1' : ''); await page.evaluate((h) => { location.hash = h; }, hash); await page.waitForTimeout(450); const t = await page.locator('#view').textContent(); if (!t || t.length < 40 || /Não deu para abrir/.test(t)) bad.push(v); }
ok(bad.length === 0, `todas as ${views.length} telas abrem offline${bad.length ? ' — falharam: ' + bad.join(', ') : ''}`);
const missing = await page.evaluate(async (list) => { const out = []; for (const u of list) { try { const r = await fetch(u); if (!r.ok) out.push(u); } catch { out.push(u); } } return out; }, assets);
ok(missing.length === 0, `todos os arquivos respondem offline${missing.length ? ' — faltam: ' + missing.slice(0, 5).join(', ') : ''}`);
await page.evaluate(() => { location.hash = '#/estudio/licao/1.2'; }); await page.waitForTimeout(900);
ok(await page.evaluate(() => [...document.querySelectorAll('figure.photo img')].every((i) => i.complete && i.naturalWidth > 0) && document.querySelectorAll('figure.photo img').length >= 3), 'fotos do curso carregam offline');
ok(await page.evaluate(() => document.fonts.check('16px Figtree') && document.fonts.check('700 20px "Bricolage Grotesque"')), 'fontes locais carregadas offline');
// fluidez: Imersão tocando, CPU 4× mais lenta
const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
await page.evaluate(() => { location.hash = '#/harmonia/imersao'; }); await page.waitForTimeout(900); await page.getByRole('button', { name: 'Tocar' }).click(); await page.waitForTimeout(1500);
const fps = await page.evaluate(() => new Promise((res) => { let n = 0, worst = 0, last = performance.now(); const t0 = last; const f = (t) => { n++; worst = Math.max(worst, t - last); last = t; if (t - t0 < 3000) requestAnimationFrame(f); else res({ fps: Math.round(n / ((t - t0) / 1000)), worst: Math.round(worst) }); }; requestAnimationFrame(f); }));
ok(fps.fps >= 50, `Imersão com CPU 4× mais lenta: ${fps.fps} quadros/s (pior quadro ${fps.worst} ms)`);
await page.evaluate(() => { location.hash = '#/estudio/mesa'; }); await page.waitForSelector('.mesa', { timeout: 60000 }); await page.getByRole('button', { name: 'Tocar' }).click(); await page.waitForTimeout(1200);
const fps2 = await page.evaluate(() => new Promise((res) => { let n = 0; const t0 = performance.now(); const f = (t) => { n++; if (t - t0 < 3000) requestAnimationFrame(f); else res(Math.round(n / ((t - t0) / 1000))); }; requestAnimationFrame(f); }));
ok(fps2 >= 50, `Mesa virtual com CPU 4× mais lenta: ${fps2} quadros/s`);
await browser.close();
if (errors.length) { console.log('Erros de console:'); [...new Set(errors)].slice(0, 10).forEach((e) => console.log('  ' + e)); }
console.log(`\n${fails} falhas, ${errors.length} erros de console.`); process.exit(fails || errors.length ? 1 : 0);
