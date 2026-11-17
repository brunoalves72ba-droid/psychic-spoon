// Teste ponta a ponta da navegação: pergunta do nome na primeira abertura, saudação, menu lateral
// (abrir, foco, Esc, véu, arrastar, "voltar" do Android, itens) e a seção do menu no PC.
// Uso: node tests/e2e/navegacao.mjs
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); }
const root = fileURLToPath(new URL('../..', import.meta.url));
const PORT = 8131, URL0 = `http://localhost:${PORT}/index.html`;
const server = spawn(process.execPath, [root + 'tools/serve.mjs', String(PORT)], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 500));
const browser = await chromium.launch();
const falhas = [];
const ok = (c, msg) => { if (!c) { falhas.push(msg); console.log('  ✗', msg); } else console.log('  ✓', msg); };
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  // ---------- celular ----------
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: 'block', locale: 'pt-BR' });
  const p = await ctx.newPage();
  const erros = []; p.on('pageerror', (e) => erros.push(String(e))); p.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });
  await p.goto(URL0);
  await p.waitForSelector('.abertura #nome-campo');
  await p.waitForFunction(() => document.activeElement && document.activeElement.id === 'nome-campo', null, { timeout: 2000 }).catch(() => {});
  ok(await p.evaluate(() => document.activeElement && document.activeElement.id === 'nome-campo'), 'nome: foco no campo');
  await p.click('.abertura button[type=submit]');
  ok((await p.textContent('#nome-erro')).includes('Escreva'), 'nome vazio: mensagem de erro curta');
  ok(await p.isVisible('.abertura'), 'nome vazio: continua na pergunta');
  await p.fill('#nome-campo', '  Bruno  ');
  await p.click('.abertura button[type=submit]');
  await p.waitForSelector('.abertura', { state: 'detached' });
  await p.waitForSelector('button.saudacao');
  ok((await p.textContent('button.saudacao')).trim() === 'Oi, Bruno', 'saudação "Oi, Bruno" na tela Hoje');
  ok(await p.evaluate(() => document.querySelectorAll('.tabs > a').length === 5), 'barra de baixo com 5 abas');
  ok(await p.evaluate(() => !document.querySelector('.tabs a[href="#/mais/ajustes"]') || getComputedStyle(document.querySelector('.menu-pc')).display === 'none'), 'Ajustes fora da barra de baixo');
  // a barra não cobre o fim do conteúdo
  ok(await p.evaluate(() => { scrollTo(0, document.body.scrollHeight); const ult = [...document.querySelectorAll('#view .page > *')].pop(); const b = ult.getBoundingClientRect().bottom; const t = document.querySelector('.tabs').getBoundingClientRect().top; return b <= t + 1; }), 'fim do conteúdo acima da barra flutuante');
  await p.evaluate(() => scrollTo(0, 0));
  // abrir o menu
  const hist0 = await p.evaluate(() => history.length);
  await p.click('button.saudacao');
  await p.waitForSelector('.gaveta.on');
  ok(await p.getAttribute('button.saudacao', 'aria-expanded') === 'true', 'aria-expanded=true com o menu aberto');
  const itens = await p.$$eval('.gaveta-item', (xs) => xs.map((x) => x.textContent.trim()));
  ok(JSON.stringify(itens) === JSON.stringify(['Capturar pensamento', 'Pensamentos guardados', 'Ajustes', 'Sincronizar celular e PC', 'Instalar no celular', 'Sobre o app']), 'seis itens na ordem: ' + itens.join(' | '));
  ok(await p.evaluate(() => document.activeElement && document.activeElement.classList.contains('gaveta-item')), 'foco no primeiro item');
  const larg = await p.evaluate(() => document.querySelector('.gaveta').getBoundingClientRect().width);
  ok(larg > 280 && larg <= 320, `largura da gaveta ${larg.toFixed(0)} px (76%, máx. 320)`);
  // prende o foco
  for (let i = 0; i < 8; i++) await p.keyboard.press('Tab');
  ok(await p.evaluate(() => !!document.activeElement.closest('.gaveta')), 'Tab não sai do menu');
  await p.keyboard.press('Escape');
  await p.waitForSelector('.gaveta', { state: 'detached' });
  ok(await p.evaluate(() => document.activeElement && document.activeElement.classList.contains('saudacao')), 'Esc fecha e o foco volta à saudação');
  ok(await p.getAttribute('button.saudacao', 'aria-expanded') === 'false', 'aria-expanded=false depois de fechar');
  await espera(100);
  ok(await p.evaluate(() => history.length) >= hist0 && await p.evaluate(() => location.hash) === '#/hoje', 'continua em Hoje');
  // véu
  await p.click('button.saudacao'); await p.waitForSelector('.gaveta.on');
  await p.mouse.click(370, 400);
  await p.waitForSelector('.gaveta', { state: 'detached' });
  ok(true, 'toque no véu fecha');
  // voltar do Android
  await p.click('button.saudacao'); await p.waitForSelector('.gaveta.on');
  await p.goBack();
  await p.waitForSelector('.gaveta', { state: 'detached' });
  ok(await p.evaluate(() => location.hash) === '#/hoje', 'voltar fecha o menu e fica em Hoje');
  // arrastar para a esquerda
  await p.click('button.saudacao'); await p.waitForSelector('.gaveta.on'); await espera(320);
  await p.evaluate(async () => {
    const g = document.querySelector('.gaveta');
    const ev = (t, x) => g.dispatchEvent(new PointerEvent(t, { pointerId: 7, pointerType: 'touch', clientX: x, clientY: 300, bubbles: true }));
    ev('pointerdown', 250); for (let x = 240; x >= 120; x -= 20) { ev('pointermove', x); await new Promise((r) => setTimeout(r, 16)); } ev('pointerup', 120);
  });
  await p.waitForSelector('.gaveta', { state: 'detached' });
  ok(true, 'arrastar para a esquerda fecha');
  // item que navega: Ajustes; voltar leva para Hoje (sem passo extra)
  await p.click('button.saudacao'); await p.waitForSelector('.gaveta.on');
  await p.click('.gaveta-item:has-text("Ajustes")');
  await p.waitForFunction(() => location.hash === '#/mais/ajustes');
  await p.waitForSelector('#ajuste-nome');
  ok(await p.inputValue('#ajuste-nome') === 'Bruno', 'Ajustes mostra o nome');
  ok(await p.evaluate(() => !document.querySelector('.tabs > a[aria-current]')), 'nenhuma aba marcada em Ajustes');
  await p.fill('#ajuste-nome', 'Bru'); await p.click('form:has(#ajuste-nome) button[type=submit]');
  await p.goBack();
  await p.waitForFunction(() => location.hash === '#/hoje');
  await p.waitForSelector('button.saudacao');
  ok((await p.textContent('button.saudacao')).trim() === 'Oi, Bru', 'voltar de Ajustes leva a Hoje; nome trocado aparece');
  // capturar pensamento
  await p.click('button.saudacao'); await p.waitForSelector('.gaveta.on');
  await p.click('.gaveta-item:has-text("Capturar")');
  await p.waitForSelector('.sheet textarea');
  ok(true, 'Capturar pensamento abre a anotação');
  await p.keyboard.press('Escape');
  // Sobre
  await p.goto(URL0 + '#/mais/sobre'); await p.waitForSelector('text=Procurar atualização');
  ok(true, 'tela Sobre o app abre');
  // saudação nas cinco abas
  for (const t of ['trilha', 'revisar', 'projeto', 'progresso']) { await p.goto(URL0 + '#/' + t); await p.waitForSelector('button.saudacao'); }
  ok(true, 'saudação nas cinco abas');
  // o nome é pedido uma vez só
  await p.reload(); await p.waitForSelector('button.saudacao'); ok(!(await p.$('.abertura')), 'nome não é pedido de novo');
  ok(!erros.length, 'sem erros no console: ' + erros.join(' | '));
  await ctx.close();

  // ---------- luz do card de destaque ----------
  {
    const c3 = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
    await c3.addInitScript(() => { window.__FIA_SEM_ABERTURA = true; });
    const r = await c3.newPage();
    await r.goto(URL0 + '#/hoje'); await r.waitForSelector('.proximo > .luz');
    ok(await r.evaluate(() => document.querySelectorAll('.luz').length === 1), 'Hoje: uma luz só, no Próximo passo');
    await r.waitForFunction(() => document.querySelector('.proximo .luz-giro').getAnimations().length > 0, null, { timeout: 2000 }).catch(() => {});
    ok(await r.evaluate(() => { const a = document.querySelector('.proximo .luz-giro').getAnimations()[0]; return a && a.effect.getTiming().duration === 2400; }), 'Hoje: uma volta de 2,4 s ao entrar');
    const props = await r.evaluate(() => { const a = document.querySelector('.proximo .luz-giro').getAnimations()[0]; return [...new Set(a.effect.getKeyframes().flatMap((k) => Object.keys(k).filter((x) => !['offset', 'easing', 'composite', 'computedOffset'].includes(x))))]; });
    ok(props.every((x) => x === 'transform' || x === 'opacity'), 'só transform e opacity animam: ' + props.join(','));
    await r.click('.proximo .eyebrow');
    ok(await r.evaluate(() => document.querySelector('.proximo .luz-brilho').getAnimations().length === 1 && document.querySelector('.proximo .luz-giro').getAnimations().length === 1), 'toque no card: nova volta + brilho (sem acumular)');
    await r.click('.proximo .eyebrow'); await r.click('.proximo .eyebrow');
    ok(await r.evaluate(() => document.querySelector('.proximo .luz-giro').getAnimations().length === 1), 'toques repetidos reiniciam sem acumular');
    await r.evaluate(() => { document.querySelector('.proximo .btn.primary').addEventListener('click', (e) => e.preventDefault(), { once: true }); });
    await r.click('.proximo .btn.primary');
    ok(await r.evaluate(() => document.querySelector('.proximo .luz-flash').getAnimations().length === 1 && document.querySelector('.proximo .luz-giro').getAnimations().length === 0), 'botão principal: flash do contorno, sem a volta');
    for (const [aba, sel] of [['trilha', '.ilha.atual > .luz'], ['revisar', '.card > .luz'], ['projeto', '.item > .luz'], ['progresso', '.card > .luz']]) {
      await r.goto(URL0 + '#/' + aba); await r.waitForSelector(sel, { timeout: 3000 }).catch(() => {});
      ok(!!(await r.$(sel)) && await r.evaluate(() => document.querySelectorAll('.luz').length === 1), `${aba}: uma luz só no card de destaque`);
    }
    await r.evaluate(() => { location.hash = '#/hoje'; }); await r.waitForSelector('.proximo > .luz'); await r.waitForTimeout(150);
    ok(await r.evaluate(() => document.querySelector('.proximo .luz-giro').getAnimations().length === 0), 'segunda visita na sessão: sem volta de entrada');
    await c3.close();
    const c4 = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
    await c4.addInitScript(() => { window.__FIA_SEM_ABERTURA = true; });
    const s4 = await c4.newPage(); await s4.goto(URL0 + '#/hoje'); await s4.waitForSelector('.proximo > .luz'); await s4.waitForTimeout(150);
    ok(await s4.evaluate(() => document.querySelector('.proximo .luz-giro').getAnimations().length === 0), 'reduzir movimento: sem giro');
    await c4.close();
  }

  // ---------- PC ----------
  const c2 = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block', locale: 'pt-BR' });
  await c2.addInitScript(() => { window.__FIA_SEM_ABERTURA = true; });
  const q = await c2.newPage();
  await q.goto(URL0 + '#/hoje'); await q.waitForSelector('.saudacao');
  ok(!(await q.$('.abertura')), 'PC: abertura pulada pelo gancho de teste');
  ok(!(await q.$('button.saudacao')), 'PC: saudação é só o nome (sem botão)');
  const pc = await q.$$eval('.menu-pc [data-menu]', (xs) => xs.map((x) => x.textContent.trim()));
  ok(pc.length === 6 && pc[0] === 'Capturar pensamento' && pc[5] === 'Sobre o app', 'PC: seis itens abaixo das abas: ' + pc.join(' | '));
  ok(await q.evaluate(() => { const m = document.querySelector('.menu-pc'); const a = [...document.querySelectorAll('.tabs > a')].pop(); return m.getBoundingClientRect().top > a.getBoundingClientRect().bottom; }), 'PC: seção abaixo das cinco abas');
  await q.click('.menu-pc [data-menu=ajustes]'); await q.waitForFunction(() => location.hash === '#/mais/ajustes');
  ok(!!(await q.waitForSelector('.menu-pc [data-menu=ajustes][aria-current=page]', { timeout: 3000 }).catch(() => null)), 'PC: item Ajustes marcado');
  await c2.close();
} finally { await browser.close(); server.kill(); }
console.log(falhas.length ? `\n${falhas.length} falha(s).` : '\nNavegação: tudo certo.');
process.exit(falhas.length ? 1 : 0);
