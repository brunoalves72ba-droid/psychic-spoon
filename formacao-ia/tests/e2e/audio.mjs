// Player do áudio das aulas (voz neural), vídeo opcional e recompensas. Um MP3 de teste (feito com ffmpeg)
// faz o papel do áudio gerado; o índice e o arquivo de vídeos são trocados só neste teste.
// Uso: node tests/e2e/audio.mjs
import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); }
const root = fileURLToPath(new URL('../..', import.meta.url));
const tmp = mkdtempSync(join(tmpdir(), 'e2e-audio-'));
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', 'sine=frequency=330:duration=12', '-ac', '1', '-ar', '24000', '-b:a', '32k', join(tmp, 'a.mp3')]);
const MP3 = readFileSync(join(tmp, 'a.mp3'));
const INDICE = { '0.1': { arquivo: 'aula-0.1.mp3', duracao: 12, bytes: MP3.length, capitulos: [{ id: 'passo-0', nome: 'Começo', t: 0 }, { id: 'passo-1', nome: 'Ideia', t: 3 }, { id: 'passo-2', nome: 'Exemplo', t: 6 }, { id: 'passo-5', nome: 'Erro comum', t: 9 }], voz: 'pt-BR-Neural2-A', cortes: 'exatos' } };
const PORT = 8132;
const server = spawn(process.execPath, [root + 'tools/serve.mjs', String(PORT)], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 500));
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
const erros = [];
const ok = (c, m) => { console.log((c ? 'ok  ' : 'FALHOU  ') + m); if (!c) erros.push(m); };
await ctx.route('**/audio/indice.json', (r) => r.fulfill({ contentType: 'application/json', body: JSON.stringify(INDICE) }));
await ctx.route('**/audio/aula-0.1.mp3', (r) => r.fulfill({ contentType: 'audio/mpeg', body: MP3 }));
// tempos por parágrafo de teste: na Ideia (3 a 6 s), título 3,0; analogia 3,8; bloco 0 em 4,6; bloco 1 em 5,3
await ctx.route('**/audio/tempos.json', (r) => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ '0.1': { 'passo-0': [['tit', 0], ['gancho', 1.2]], 'passo-1': [['tit', 3], ['analogia', 3.8], ['b0', 4.6], ['b1', 5.3]] } }) }));
await ctx.route('**/js/data/videos.js', (r) => r.fulfill({ contentType: 'text/javascript', body: readFileSync(root + 'js/data/videos.js', 'utf8').replace("  // '0.1': 'https://youtu.be/XXXXXXXXXXX',", "  '0.1': 'https://youtu.be/abcdefghijk',") }));
await ctx.route(/youtube(-nocookie)?\.com/, (r) => r.fulfill({ contentType: 'text/html', body: '<p>vídeo de teste</p>' }));
await ctx.addInitScript(() => { window.__FIA_SEM_ABERTURA = true; }); // os testes antigos pulam a pergunta do nome
const page = await ctx.newPage();
page.on('pageerror', (e) => erros.push('erro na página: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/youtube/.test(m.text())) erros.push('console: ' + m.text()); });
const base = `http://localhost:${PORT}/index.html`;
try {
  // 1. aula com áudio: o player aparece no topo e toca sozinho só a parte aberta (Começo: 0 a 3 s)
  await page.goto(base + '#/licao/0.1');
  await page.locator('.player-aula').waitFor({ timeout: 8000 });
  ok(/Ouvir: Começo/.test(await page.locator('.parte-nome').innerText()), 'abre na parte Começo');
  ok((await page.locator('.vels .vel[aria-pressed=true]').innerText()) === '1,25x', 'velocidade padrão 1,25x');
  ok((await page.locator('.vel').allInnerTexts()).filter((t) => /x$/.test(t)).join(' ') === '1x 1,25x 1,5x', 'velocidades 1x, 1,25x e 1,5x');
  ok(await page.locator('.video iframe').count() === 1 && /youtube-nocookie\.com\/embed\/abcdefghijk/.test(await page.locator('.video iframe').getAttribute('src')), 'vídeo do YouTube no topo da aula');
  await page.waitForFunction(() => document.querySelector('.player-aula.tocando'), null, { timeout: 8000 });
  ok(true, 'começa a tocar sozinho ao abrir');
  await page.waitForFunction(() => document.querySelector('.player-aula.terminou'), null, { timeout: 8000 });
  const t0 = await page.locator('.player-aula .num').innerText();
  ok(/^0:03 \/ 0:03$/.test(t0), `para no fim da parte Começo (${t0})`);
  await page.screenshot({ path: root + 'tests/e2e/shots/audio-player.png' });
  // 2. passo seguinte: toca só a Ideia (3 a 6 s), com feedback visual do passo concluído
  await page.locator('.acao-bar .btn.primary').click();
  ok(await page.locator('.segs.passos .pp.celebra').count() === 1, 'passo concluído pulsa (feedback visual)');
  ok(/Ouvir: Ideia/.test(await page.locator('.parte-nome').innerText()), 'no passo Ideia, o player mostra a Ideia');
  await page.waitForFunction(() => document.querySelector('.player-aula.tocando'), null, { timeout: 8000 });
  await page.waitForFunction(() => document.querySelector('.player-aula.terminou'), null, { timeout: 8000 });
  ok(/^0:03 \/ 0:03$/.test(await page.locator('.player-aula .num').innerText()), 'toca a Ideia inteira e para no fim dela');
  // 3. tocar de novo recomeça a parte; pausa funciona; 1,5x é lembrada
  await page.locator('.player-aula .play').click();
  await page.waitForTimeout(500);
  ok(/^0:0[0-1] \/ 0:03$/.test(await page.locator('.player-aula .num').innerText()), 'tocar de novo recomeça a Ideia');
  await page.locator('.player-aula .play').click();
  await page.locator('.vel', { hasText: '1,5x' }).click();
  ok(await page.evaluate(() => localStorage.getItem('fia-vel')) === '1.5', 'velocidade 1,5x escolhida e lembrada');
  // 4. desligar "tocar ao abrir": o próximo passo só posiciona, não toca
  await page.locator('.vel.auto').click();
  await page.locator('.acao-bar .btn.primary').click();
  await page.waitForTimeout(700);
  ok(/Ouvir: Exemplo/.test(await page.locator('.parte-nome').innerText()) && !(await page.locator('.player-aula').getAttribute('class')).includes('tocando'), 'com “tocar ao abrir: não”, o Exemplo fica parado esperando o play');
  // 5. exercício (sem áudio): o player some
  await page.locator('.acao-bar .btn.primary').click();
  await page.waitForTimeout(300);
  ok(await page.locator('.player-aula').isHidden(), 'no exercício, o player some');
  // 4. aula sem áudio: só o texto, sem erro
  await page.evaluate(() => { location.hash = '#/licao/0.2'; });
  await page.locator('.passo h1').waitFor();
  await page.waitForTimeout(500);
  ok(await page.locator('.player-aula').count() === 0 && await page.locator('.video').count() === 0, 'aula sem áudio e sem vídeo: só o texto');
  // 5. dias seguidos no Hoje
  await page.evaluate(() => { location.hash = '#/hoje'; });
  await page.locator('.dias-seguidos').waitFor({ timeout: 5000 });
  ok(/1 dia de estudo hoje/.test(await page.locator('.dias-seguidos').innerText()), `Hoje mostra os dias de estudo: “${await page.locator('.dias-seguidos').innerText()}”`);
  // 6. Ajustes: áudio das aulas
  await page.evaluate(() => { location.hash = '#/mais/ajustes'; });
  await page.getByText('Áudio das aulas').waitFor();
  await page.waitForTimeout(400);
  ok(/1 aulas com áudio · 0 já estão neste aparelho/.test(await page.locator('main, #view').first().innerText()), 'Ajustes conta os áudios');
  ok(await page.getByText('Leitura em voz alta').count() === 0, 'a voz do aparelho (Web Speech) saiu');
  ok(await page.getByText('Texto grifado durante o áudio').count() === 1 && await page.locator('[aria-label="Texto grifado durante o áudio"] [aria-pressed=true]').innerText() === 'Ligado', 'Ajustes: texto grifado, ligado por padrão');
  // 7. texto grifado: o parágrafo da vez em destaque, os outros em cinza; modo de conferência
  await page.evaluate(() => { location.hash = '#/licao/0.1/conferir'; });
  await page.locator('.segs.passos .pp').nth(1).waitFor({ timeout: 8000 });
  await page.locator('.segs.passos .pp').nth(1).click(); // volta ao passo Ideia (a aula retoma onde parou)
  await page.locator('.player-aula').waitFor({ timeout: 8000 });
  await page.waitForTimeout(300);
  if (!(await page.locator('.player-aula.tocando').count())) await page.locator('.player-aula .play').click(); // "tocar ao abrir" foi desligado antes
  await page.waitForFunction(() => document.querySelector('.player-aula.tocando'), null, { timeout: 8000 });
  await page.waitForFunction(() => { const e = document.querySelector('.passo.grifando .lendo'); return e && e.getAttribute('data-trecho') === 'b0'; }, null, { timeout: 8000 });
  ok(true, 'grifo acompanha a voz: chegou ao bloco 0 da Ideia');
  const cores = await page.evaluate(() => { const l = document.querySelector('.lendo'), o = document.querySelector('.passo.grifando [data-trecho="analogia"]'); return [getComputedStyle(l).color, getComputedStyle(o).color]; });
  ok(cores[0] === 'rgb(241, 240, 245)' && cores[1] === 'rgb(163, 174, 199)', 'trecho da vez claro, os outros em cinza: ' + cores.join(' / '));
  ok(await page.evaluate(() => getComputedStyle(document.querySelector('.grifo-barra')).backgroundColor) === 'rgb(212, 211, 219)', 'barra cinza-clara à esquerda (sem violeta)');
  ok(/passo-1:b[01]/.test(await page.locator('.grifo-conferir').innerText()), 'modo de conferência mostra tempo e trecho: ' + await page.locator('.grifo-conferir').innerText());
  const y0 = await page.evaluate(() => scrollY);
  await page.waitForFunction(() => document.querySelector('.lendo') && document.querySelector('.lendo').getAttribute('data-trecho') === 'b1', null, { timeout: 8000 });
  ok(await page.evaluate(() => scrollY) === y0, 'sem rolar a tela sozinho');
  await page.waitForFunction(() => document.querySelector('.player-aula.terminou'), null, { timeout: 8000 });
  ok(await page.locator('.passo.grifando').count() === 0, 'áudio parado: o texto volta ao normal');
  // desligado nos Ajustes: sem grifo
  await page.evaluate(async () => { const e = await import('./js/core/estado.js'); e.S['v2.leitura.grifado'] = { ligado: false }; e.salvar('v2.leitura.grifado'); });
  await page.locator('.player-aula .play').click();
  await page.waitForTimeout(1200);
  ok(await page.locator('.passo.grifando').count() === 0, 'com o ajuste desligado, nada é grifado');
} catch (e) { erros.push(String(e.message || e).split('\n')[0]); await page.screenshot({ path: root + 'tests/e2e/shots/audio-falha.png', fullPage: true }).catch(() => {}); }
await browser.close(); server.kill();
console.log(erros.length ? `\n${erros.length} problema(s):\n- ${erros.join('\n- ')}` : '\nTudo certo.');
process.exit(erros.length ? 1 : 0);
