// Contraste medido nos pixels reais: esconde o texto, fotografa a tela, mede o fundo atrás de cada trecho de texto
// e compara com a cor do texto (WCAG: 4,5:1 normal; 3:1 para texto grande). Repete em várias posições de rolagem,
// porque o fundo é fixo e um card pode passar por cima da parte violeta da tela. Uso: node tests/e2e/contraste.mjs [--pc]
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); }
const root = fileURLToPath(new URL('../..', import.meta.url));
const pc = process.argv.includes('--pc');
const PORT = 8143;
const server = spawn(process.execPath, [root + 'tools/serve.mjs', String(PORT)], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 500));
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: pc ? { width: 1440, height: 900 } : { width: 390, height: 844 }, isMobile: !pc, hasTouch: !pc, deviceScaleFactor: 1, serviceWorkers: 'block' });
await ctx.addInitScript(() => { try { localStorage.setItem('fia-audio-auto', '0'); } catch {} });
const page = await ctx.newPage();
const leitor = await ctx.newPage();
const TELAS = (process.env.TELAS || '#/hoje,#/trilha,#/trilha/m/1,#/licao/1.2,#/revisar,#/projeto,#/progresso,#/mais/ajustes,#/mais/sync,#/labs/x/tokens,#/projeto/m/1').split(',');
await page.goto(`http://localhost:${PORT}/index.html#/hoje`);
await page.waitForSelector('#view h1, #view h2');
await page.evaluate(async () => {
  const e = await import('./js/core/estado.js'); const c = await import('./js/data/curso.js');
  for (const id of [...c.idsDoModulo(0), '1.1']) { e.prog(id); e.registrarQuiz(id, 0, true); e.concluirLicao(id, c.licao(id).quiz.length); }
  e.irPasso('1.2', 1); await e.gravado();
});
const lum = (r, g, b) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const falhas = new Map();
for (const tela of TELAS) {
  await page.goto(`http://localhost:${PORT}/index.html${tela}`);
  await page.waitForTimeout(900);
  const altura = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  const vh = await page.evaluate(() => innerHeight);
  for (let y = 0; y <= Math.max(0, altura); y += Math.round(vh * 0.45)) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(120);
    // trechos de texto visíveis: retângulo, cor, tamanho e peso
    const trechos = await page.evaluate(() => {
      const out = [];
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let n = w.nextNode(); n; n = w.nextNode()) {
        if (!n.nodeValue.trim()) continue;
        const el = n.parentElement;
        if (!el || el.closest('[disabled],.trava,[aria-hidden="true"],.hide,.sr,.skip,noscript,script,style,option,.fundo')) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || +cs.opacity === 0) continue;
        let op = 1; for (let a = el; a; a = a.parentElement) op *= +getComputedStyle(a).opacity;
        if (op < 0.6) continue; // apagado de propósito (ex.: desabilitado)
        const r = document.createRange(); r.selectNodeContents(n);
        for (const q of r.getClientRects()) {
          if (q.width < 4 || q.height < 6 || q.bottom < 0 || q.top > innerHeight || q.right < 0 || q.left > innerWidth) continue;
          // coberto por outra camada (barra de abas, barra de ação, folha): não está visível, não conta
          const cx = Math.min(innerWidth - 1, Math.max(0, q.left + q.width / 2)), cy = Math.min(innerHeight - 1, Math.max(0, q.top + q.height / 2));
          const topo = document.elementFromPoint(cx, cy);
          if (!topo || !(topo === el || el.contains(topo) || topo.contains(el))) continue;
          out.push({ x: Math.max(0, q.left), y: Math.max(0, q.top), w: Math.min(innerWidth, q.right) - Math.max(0, q.left), h: Math.min(innerHeight, q.bottom) - Math.max(0, q.top),
            cor: cs.color, tam: parseFloat(cs.fontSize), peso: +cs.fontWeight, txt: n.nodeValue.trim().slice(0, 40),
            onde: `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : ''}` });
        }
      }
      return out;
    });
    // esconde o texto e fotografa só o fundo
    const est = await page.addStyleTag({ content: '*,*::before,*::after{color:transparent!important;text-shadow:none!important;caret-color:transparent!important;-webkit-text-fill-color:transparent!important}::placeholder{color:transparent!important}' });
    await page.waitForTimeout(60);
    const png = (await page.screenshot()).toString('base64');
    await est.evaluate((n) => n.remove());
    // lê os pixels numa página auxiliar (canvas)
    const res = await leitor.evaluate(async ({ png, trechos }) => {
      const img = new Image(); img.src = 'data:image/png;base64,' + png; await img.decode();
      const cv = new OffscreenCanvas(img.width, img.height); const g = cv.getContext('2d'); g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, img.width, img.height).data;
      return trechos.map((t) => {
        const ls = [];
        for (let yy = Math.floor(t.y + 1); yy < t.y + t.h - 1; yy += 2) for (let xx = Math.floor(t.x + 1); xx < t.x + t.w - 1; xx += 2) { const i = (yy * img.width + xx) * 4; ls.push([d[i], d[i + 1], d[i + 2]]); }
        return ls;
      });
    }, { png, trechos });
    trechos.forEach((t, k) => {
      const px = res[k]; if (!px.length) return;
      const m = t.cor.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/); if (!m) return;
      const a = m[4] === undefined ? 1 : +m[4];
      if (a === 0) return; // texto transparente de propósito (ex.: marca de dia ainda não feito)
      const lt = px.map(([r, g, b]) => lum(r, g, b)).sort((x, y) => x - y);
      const pior = (fundoL) => { const lt2 = lum(+m[1], +m[2], +m[3]); return lt2 > fundoL ? (lt2 + 0.05) / (fundoL + 0.05) : (fundoL + 0.05) / (lt2 + 0.05); };
      // texto claro: o pior fundo é o mais claro (percentil 90); texto escuro: o mais escuro (percentil 10)
      const claro = lum(+m[1], +m[2], +m[3]) > lt[Math.floor(lt.length / 2)];
      const fundoL = claro ? lt[Math.floor(lt.length * 0.9)] : lt[Math.floor(lt.length * 0.1)];
      let ratio = pior(fundoL); if (a < 1) ratio = 1 + (ratio - 1) * a;
      const grande = t.tam >= 24 || (t.tam >= 18.66 && t.peso >= 700);
      const min = grande ? 3 : 4.5;
      if (ratio < min) { const ch = `${tela} ${t.onde} “${t.txt}”`; const ant = falhas.get(ch); if (!ant || ant.ratio > ratio) falhas.set(ch, { ratio, min, y }); }
    });
  }
}
await browser.close(); server.kill();
const lista = [...falhas.entries()].sort((a, b) => a[1].ratio - b[1].ratio);
for (const [k, v] of lista.slice(0, 60)) console.log(`${v.ratio.toFixed(2)} < ${v.min}  ${k}  (rolagem ${v.y})`);
console.log(`\n${lista.length} trecho(s) abaixo do mínimo (${pc ? 'PC 1440×900' : 'celular 390×844'}).`);
process.exit(lista.length ? 1 : 0);
