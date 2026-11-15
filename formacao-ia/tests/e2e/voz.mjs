// Leitura em voz alta: troca a voz do navegador por uma falsa que anota o que seria falado e confere
// o que é lido em cada passo da lição, no quiz (sem entregar a resposta) e nos cartões.
// Uso: node tests/e2e/voz.mjs
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); }
const root = fileURLToPath(new URL('../..', import.meta.url));
const PORT = 8127;
const server = spawn(process.execPath, [root + 'tools/serve.mjs', String(PORT)], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 500));
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await ctx.addInitScript(() => {
  window.__falas = [];
  window.SpeechSynthesisUtterance = class { constructor(t) { this.text = t; } };
  const falsa = {
    getVoices: () => [{ name: 'Voz de teste', lang: 'pt-BR', localService: true }],
    speak(u) { window.__falas.push({ texto: u.text, voz: u.voice && u.voice.name, vel: u.rate }); setTimeout(() => u.onend && u.onend({}), 5); },
    cancel() {}, pause() {}, resume() {}, addEventListener() {}, removeEventListener() {},
  };
  Object.defineProperty(window, 'speechSynthesis', { value: falsa, configurable: true });
});
const page = await ctx.newPage();
const erros = [];
page.on('pageerror', (e) => erros.push(e.message));
const falha = (m) => { console.log('FALHOU  ' + m); erros.push(m); };
const ok = (cond, m) => (cond ? console.log('ok  ' + m) : falha(m));
const base = `http://localhost:${PORT}/index.html`;
const limparFalas = () => page.evaluate(() => { window.__falas = []; });
const falas = async (ms = 900) => { await page.waitForTimeout(ms); return page.evaluate(() => window.__falas.map((f) => f.texto).join('\n')); };
const tocarOuvir = () => page.locator('#view .voz-linha .ouvir').first().click();
const avancar = () => page.locator('.acao-bar .btn.primary').click();

// 1. desligada: só o convite discreto; um toque liga e já lê
await page.goto(base + '#/licao/3.5'); await page.waitForSelector('.passo');
ok(/Ouvir em voz alta/.test(await page.locator('.voz-linha').first().innerText()), 'desligada, a lição mostra só “Ouvir em voz alta”');
ok((await falas(400)) === '', 'desligada, nada é lido sozinho');
await tocarOuvir();
let t = await falas();
ok(/Hoje você conversa com um modelo/.test(t), 'um toque liga a voz e lê o gancho');
ok(!/\b\d+ min\b|7 passos/.test(t), 'as etiquetas (minutos, passos) não são lidas');

// 2. ideia: analogia e pronúncia
await avancar(); await limparFalas(); await tocarOuvir(); t = await falas();
ok(/preencher e postar a carta/.test(t), 'passo Ideia lê a analogia');
ok(/djêison/.test(t) && !/\bJSON\b/.test(t), 'JSON é falado como “djêison”');
ok(/rópscótch|róps cótch ponto io/.test(t), 'endereço vira “róps cótch ponto io”');

// 3. exemplo: código não é soletrado
await avancar(); await limparFalas(); await tocarOuvir(); t = await falas();
ok(/O código está na tela/.test(t) && !/Content-Type: application/.test(t), 'exemplo avisa do código sem ler o código');

// 4. pular o exercício e ir ao quiz: opções na ordem da tela, sem a explicação
await avancar(); await page.locator('text=Pular o exercício por agora').click(); await avancar();
await limparFalas(); await tocarOuvir(); t = await falas();
const opcoes = await page.locator('#view .opt').allInnerTexts();
const lidas = [...t.matchAll(/Opção (\d): ([^\n]+)/g)].map((m) => m[2]);
const norm = (x) => x.toLowerCase().replace(/[^a-z0-9à-ú ]/g, '').slice(0, 8);
ok(lidas.length === opcoes.length && opcoes.every((o, i) => !/^[a-z]/i.test(o) || norm(lidas[i]) === norm(o) || /[`]/.test(o)), `quiz lido na ordem da tela: ${lidas.map((x) => x.slice(0, 18)).join(' | ')}`);
ok(!/orienta a conversa inteira/.test(t), 'antes de responder, a explicação não é lida');

// 5. Ajustes: leitura automática e velocidade
await page.evaluate(() => { location.hash = '#/mais/ajustes'; }); await page.waitForSelector('text=Leitura em voz alta');
await page.waitForTimeout(400);
ok(await page.locator('select[aria-label="Voz"] option', { hasText: 'Voz de teste' }).count() === 1, 'Ajustes lista a voz do aparelho');
await page.locator('label.switch', { hasText: 'Ler sozinho' }).locator('input').check();
await page.locator('[aria-label="Velocidade da voz"] button, [aria-label="Velocidade da voz"] [role=radio]', { hasText: 'Devagar' }).first().click();
await page.evaluate(() => { location.hash = '#/licao/0.1'; }); await page.waitForSelector('.passo'); await limparFalas();
await page.waitForTimeout(100);
const auto = await page.evaluate(() => new Promise((r) => setTimeout(() => r(window.__falas), 900)));
ok(auto.length > 0, 'com “ler sozinho”, a lição começa a ser lida ao abrir');
await avancar(); await page.waitForTimeout(900);
const vel = await page.evaluate(() => window.__falas.at(-1));
ok(vel && vel.vel === 0.8 && vel.voz === 'Voz de teste', `usa a voz e a velocidade escolhidas (${vel && vel.vel})`);

// 6. cartões: frente lida sozinha, verso ao mostrar
await page.evaluate(async () => {
  const e = await import('./js/core/estado.js');
  e.concluirLicao('0.1', 3);                                  // cria os cartões da lição 0.1
  const d = new Date(Date.now() + 3 * 864e5);                 // e avança o relógio do app 3 dias
  globalThis.__FIA_HOJE = d.toISOString().slice(0, 10);
  location.hash = '#/revisar/cartoes';
});
await page.waitForTimeout(1200);
if (await page.locator('.cartao').count()) {
  const frente = await page.locator('.cartao .frente').innerText();
  t = await falas(200);
  ok(t.includes(frente.slice(0, 15).replace(/`/g, '')) || t.length > 10, 'cartão: a frente é lida sozinha');
  await limparFalas();
  const verso = await (await page.locator('.acao-bar .btn.primary.big').click(), page.locator('.cartao .verso b').innerText());
  t = await falas();
  ok(t.length > 0 && !t.includes(frente.slice(0, 20)), `cartão: ao mostrar, lê só o verso (“${t.slice(0, 40)}…”)`);
} else falha('não apareceu cartão vencido');

// 7. desligar pelo botão da lição
await page.evaluate(() => { location.hash = '#/licao/0.2'; }); await page.waitForSelector('.voz-linha .mudo');
await page.locator('.voz-linha .mudo').first().click(); await limparFalas();
ok(/Ouvir em voz alta/.test(await page.locator('.voz-linha').first().innerText()), 'o botão de mudo desliga a voz');
await avancar(); ok((await falas(600)) === '', 'desligada, mudar de passo não lê nada');

await page.screenshot({ path: root + 'tests/e2e/shots/voz-licao.png' });
await page.evaluate(() => { location.hash = '#/mais/ajustes'; }); await page.waitForTimeout(500);
await page.locator('label.switch', { hasText: 'Ler em voz alta' }).locator('input').check(); await page.waitForTimeout(300);
await page.locator('text=Leitura em voz alta').scrollIntoViewIfNeeded();
await page.screenshot({ path: root + 'tests/e2e/shots/voz-ajustes.png' });

await browser.close(); server.kill();
console.log(erros.length ? `\n${erros.length} problema(s): ${erros.join(' | ')}` : '\nTudo certo.');
process.exit(erros.length ? 1 : 0);
