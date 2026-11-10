// Teste ponta a ponta: abre o app a 390×844 no Chromium com microfone falso (arquivo WAV),
// percorre as telas, falha em qualquer erro de console e salva capturas em tests/e2e/shots.
// Uso: node tests/e2e/run.mjs [filtro] [--w=360] [--h=740]
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { scenarios } from './scenarios.mjs';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); }
const root = fileURLToPath(new URL('../..', import.meta.url));
const shots = fileURLToPath(new URL('./shots/', import.meta.url));
mkdirSync(shots, { recursive: true });
const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a ? +a.split('=')[1] : d; };
const W = arg('w', 390), H = arg('h', 844), PORT = arg('port', 8123);
const filter = process.argv.slice(2).find((a) => !a.startsWith('--'));

const server = spawn(process.execPath, [root + 'tools/serve.mjs', String(PORT)], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 500));
const browser = await chromium.launch({ args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', `--use-file-for-fake-audio-capture=${root}tests/e2e/voz-falsa.wav`, '--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, hasTouch: true, isMobile: true, locale: 'pt-BR', permissions: ['microphone'], reducedMotion: process.argv.includes('--reduced') ? 'reduce' : 'no-preference' });
const page = await ctx.newPage();
const errors = []; let currentName = '';
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${currentName}] console.${m.type()}: ${m.text()}`); });
page.on('pageerror', (e) => errors.push(`[${currentName}] erro: ${e.message}`));
page.on('requestfailed', (r) => errors.push(`[${currentName}] requisição falhou: ${r.url()}`));
page.on('request', (r) => { if (!r.url().startsWith(`http://localhost:${PORT}/`) && !r.url().startsWith('blob:') && !r.url().startsWith('data:')) errors.push(`[${currentName}] requisição externa: ${r.url()}`); });
const base = `http://localhost:${PORT}/index.html`;
let n = 0, fails = 0;
const api = {
  page, W, H,
  wait: (ms) => page.waitForTimeout(ms),
  tap: async (sel, opts) => { const l = typeof sel === 'string' ? page.locator(sel).first() : sel; await l.scrollIntoViewIfNeeded(); await l.click(opts); },
  text: (t, o) => page.getByText(t, { exact: false, ...o }).first(),
  btn: (t) => page.getByRole('button', { name: t }).first(),
  shot: (name) => page.screenshot({ path: `${shots}${name}.png` }),
  assert: (cond, msg) => { if (!cond) throw new Error(msg); },
  eval: (fn, a) => page.evaluate(fn, a),
};
await page.goto(base); await page.waitForTimeout(400);
for (const sc of scenarios) {
  if (filter && !sc.name.includes(filter)) continue;
  currentName = sc.name; n++;
  try {
    if (await page.evaluate((hsh) => location.hash === hsh, sc.hash)) { await page.evaluate(() => { location.hash = '#/ajustes'; }); await page.waitForTimeout(250); }
    await page.evaluate((hsh) => { location.hash = hsh; }, sc.hash);
    await page.waitForTimeout(sc.wait ?? 450);
    if (sc.run) await sc.run(api);
    await page.screenshot({ path: `${shots}${sc.name}.png` });
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (over > 1) throw new Error(`rolagem horizontal de ${over}px`);
    const small = await page.evaluate(() => [...document.querySelectorAll('#view button, #view a.btn, #view a.item, #view .chip, .tabs a, #view input[type=range], #view select')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.height < 43.5 || r.width < 43.5); }).map((e) => `${e.tagName}.${e.className} "${(e.textContent || e.getAttribute('aria-label') || '').slice(0, 20)}" ${Math.round(e.getBoundingClientRect().width)}×${Math.round(e.getBoundingClientRect().height)}`));
    if (small.length) throw new Error(`alvos de toque menores que 44px: ${small.slice(0, 4).join(' | ')}`);
    console.log(`ok  ${sc.name}`);
  } catch (e) { fails++; console.log(`FALHOU  ${sc.name}: ${e.message.split('\n')[0]}`); try { await page.screenshot({ path: `${shots}${sc.name}-FALHA.png` }); } catch {} }
}
await browser.close(); server.kill();
if (errors.length) { console.log('\nErros de console:'); for (const e of [...new Set(errors)].slice(0, 40)) console.log('  ' + e); }
console.log(`\n${n} cenários, ${fails} falhas, ${errors.length} erros de console (${W}×${H}).`);
process.exit(fails || errors.length ? 1 : 0);
