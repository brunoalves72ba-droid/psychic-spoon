// Capturas de tela das telas principais, no celular (390×844) e no PC (1440×900), com um pouco de progresso
// já feito (para as telas não ficarem vazias). Uso: node tests/e2e/capturas.mjs <nome-da-pasta>
// Salva em docs/capturas/<nome>/ — usado para comparar o antes e o depois de uma mudança visual.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); }
const root = fileURLToPath(new URL('../..', import.meta.url));
const nome = process.argv[2] || 'atual';
const dir = `${root}docs/capturas/${nome}/`;
mkdirSync(dir, { recursive: true });
const PORT = 8141;
const server = spawn(process.execPath, [root + 'tools/serve.mjs', String(PORT)], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 500));
const browser = await chromium.launch({ args: ['--autoplay-policy=user-gesture-required'] });
const TELAS = [
  ['hoje', '#/hoje'], ['trilha', '#/trilha'], ['modulo-1', '#/trilha/m/1'], ['licao', '#/licao/1.2'],
  ['revisar', '#/revisar'], ['projeto', '#/projeto'], ['progresso', '#/progresso'], ['ajustes', '#/mais/ajustes'],
];
for (const [disp, vp] of [['celular', { width: 390, height: 844, isMobile: true, hasTouch: true }], ['pc', { width: 1440, height: 900 }]]) {
  const { isMobile, hasTouch, ...viewport } = vp;
  const ctx = await browser.newContext({ viewport, isMobile: !!isMobile, hasTouch: !!hasTouch, colorScheme: 'dark', deviceScaleFactor: 1, serviceWorkers: 'block' });
  // não toca áudio sozinho nas capturas
  await ctx.addInitScript(() => { try { localStorage.setItem('fia-audio-auto', '0'); } catch {} });
  await ctx.addInitScript(() => { window.__FIA_SEM_ABERTURA = true; }); // os testes antigos pulam a pergunta do nome
  const p = await ctx.newPage();
  await p.goto(`http://localhost:${PORT}/index.html#/hoje`);
  await p.waitForSelector('#view h1, #view h2', { timeout: 20000 });
  // um pouco de progresso: M0 inteiro feito, lição 1.1 feita e a 1.2 parada no passo 2
  await p.evaluate(async () => {
    const e = await import('./js/core/estado.js');
    const c = await import('./js/data/curso.js');
    for (const id of [...c.idsDoModulo(0), '1.1']) { e.prog(id); e.registrarQuiz(id, 0, true); e.concluirLicao(id, c.licao(id).quiz.length); }
    e.irPasso('1.2', 1);
    for (const n of ['nome', 'perfil']) void n;
    e.S.perfil.boasVindas = true; e.salvar('perfil');
    await e.gravado();
    try { await (await import('./js/core/estado.js')).gravado(); } catch {}
  });
  for (const [t, h] of TELAS) {
    await p.goto(`http://localhost:${PORT}/index.html${h}`);
    await p.waitForTimeout(900);
    await p.screenshot({ path: `${dir}${disp}-${t}.png`, fullPage: disp === 'celular' && t !== 'licao' });
  }
  await ctx.close();
}
await browser.close(); server.kill();
console.log('capturas em', dir);
