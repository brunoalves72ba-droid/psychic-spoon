// Fase 9: zoom de 130% sem quebrar (sem rolagem lateral), no máximo UM botão principal por tela,
// e medição de fluidez com a CPU 4x mais lenta (rolar a lista do Módulo 1 e abrir o menu lateral).
// Uso: node tests/e2e/acessibilidade.mjs
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); }
const root = fileURLToPath(new URL('../..', import.meta.url));
const PORT = 8133, URL0 = `http://localhost:${PORT}/index.html`;
const server = spawn(process.execPath, [root + 'tools/serve.mjs', String(PORT)], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 500));
const browser = await chromium.launch();
const falhas = [];
const ok = (c, msg) => { if (!c) { falhas.push(msg); console.log('  ✗', msg); } else console.log('  ✓', msg); };
const TELAS = ['#/hoje', '#/trilha', '#/trilha/m/1', '#/revisar', '#/projeto', '#/progresso', '#/mais/ajustes', '#/mais/sync', '#/mais/sobre', '#/mais/pensamentos', '#/licao/1.2'];

try {
  // zoom de 130% num celular de 390 px = 300 px de largura em CSS
  for (const [nome, vp, opts] of [['celular 130%', { width: 300, height: 649 }, { isMobile: true, hasTouch: true }], ['PC', { width: 1440, height: 900 }, {}]]) {
    const ctx = await browser.newContext({ viewport: vp, ...opts, serviceWorkers: 'block' });
    await ctx.addInitScript(() => { window.__FIA_SEM_ABERTURA = true; try { localStorage.setItem('fia-audio-auto', '0'); } catch {} });
    const p = await ctx.newPage();
    for (const t of TELAS) {
      await p.goto(URL0 + t); await p.waitForTimeout(700);
      const r = await p.evaluate(() => ({
        lateral: document.documentElement.scrollWidth - innerWidth,
        primarios: [...document.querySelectorAll('.btn.primary')].filter((b) => b.offsetParent && !b.closest('.sheet,.player-aula')).length,
      }));
      ok(r.lateral <= 1, `${nome} ${t}: sem rolagem lateral (${r.lateral}px)`);
      ok(r.primarios <= 1, `${nome} ${t}: ${r.primarios} botão principal`);
    }
    await ctx.close();
  }

  // fluidez: CPU 4x mais lenta
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
  await ctx.addInitScript(() => { window.__FIA_SEM_ABERTURA = true; });
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  await p.goto(URL0 + '#/trilha/m/1'); await p.waitForTimeout(1000);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const medir = (acao) => p.evaluate(async (acao) => {
    const ts = []; let vivo = true;
    const f = (t) => { ts.push(t); if (vivo) requestAnimationFrame(f); }; requestAnimationFrame(f);
    if (acao === 'rolar') { for (let y = 0; y <= 1400; y += 35) { scrollTo(0, y); await new Promise((r) => requestAnimationFrame(r)); } for (let y = 1400; y >= 0; y -= 35) { scrollTo(0, y); await new Promise((r) => requestAnimationFrame(r)); } }
    else { document.querySelector('button.saudacao').click(); await new Promise((r) => setTimeout(r, 450)); document.querySelector('.gaveta-veu').click(); await new Promise((r) => setTimeout(r, 450)); }
    vivo = false;
    const d = ts.slice(1).map((t, i) => t - ts[i]);
    const media = d.reduce((a, b) => a + b, 0) / d.length;
    return { fps: Math.round(1000 / media), longos: d.filter((x) => x > 50).length, quadros: d.length };
  }, acao);
  const rolar = await medir('rolar');
  await p.goto(URL0 + '#/hoje'); await p.waitForSelector('button.saudacao'); await p.waitForTimeout(800);
  const menu = await medir('menu');
  console.log(`  Fluidez (CPU 4x): rolar o Módulo 1 = ${rolar.fps} fps, ${rolar.longos} quadros longos de ${rolar.quadros}; abrir e fechar o menu = ${menu.fps} fps, ${menu.longos} quadros longos de ${menu.quadros}`);
  ok(rolar.fps >= 50 && menu.fps >= 50, 'fluidez acima de 50 fps');
  await ctx.close();
} finally { await browser.close(); server.kill(); }
console.log(falhas.length ? `\n${falhas.length} falha(s).` : '\nAcessibilidade e fluidez: tudo certo.');
process.exit(falhas.length ? 1 : 0);
