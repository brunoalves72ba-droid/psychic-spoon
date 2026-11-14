// Sincronização de ponta a ponta com dois aparelhos simulados (celular e PC) e uma API de Gist falsa.
// Confere: ligar com o mesmo token, levar progresso de um para o outro, estudar nos dois sem perder nada,
// exclusões chegarem ao outro lado, dados cifrados na nuvem e o layout de PC/celular.
// Uso: node tests/e2e/sync.mjs
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); }
const root = fileURLToPath(new URL('../..', import.meta.url));
const shots = fileURLToPath(new URL('./shots/', import.meta.url));
const PORT = 8126, TOKEN = 'ghp_tokenFalsoParaTeste1234567890';
const server = spawn(process.execPath, [root + 'tools/serve.mjs', String(PORT)], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 500));
const browser = await chromium.launch();

// ---- GitHub falso: guarda os gists em memória ----
const gists = new Map(); let seq = 0; const pedidos = [];
async function falsoGitHub(route) {
  const req = route.request(); const url = new URL(req.url()); const m = req.method();
  pedidos.push(`${m} ${url.pathname}`);
  if (req.headers().authorization !== `Bearer ${TOKEN}`) return route.fulfill({ status: 401, body: '{}' });
  const json = (o, s = 200) => route.fulfill({ status: s, contentType: 'application/json', body: JSON.stringify(o), headers: { 'Access-Control-Allow-Origin': '*' } });
  if (url.pathname === '/gists' && m === 'GET') return json([...gists.values()]);
  if (url.pathname === '/gists' && m === 'POST') { const b = req.postDataJSON(); const g = { id: 'g' + ++seq, files: {} }; for (const [k, v] of Object.entries(b.files)) g.files[k] = { content: v.content, truncated: false }; gists.set(g.id, g); return json(g, 201); }
  const id = url.pathname.split('/')[2];
  const g = gists.get(id); if (!g) return json({}, 404);
  if (m === 'GET') return json(g);
  if (m === 'PATCH') { const b = req.postDataJSON(); for (const [k, v] of Object.entries(b.files)) g.files[k] = { content: v.content, truncated: false }; return json(g); }
  return json({}, 400);
}
async function aparelho(nome, opts) {
  const ctx = await browser.newContext({ ...opts, locale: 'pt-BR', serviceWorkers: 'block' });
  await ctx.route('https://api.github.com/**', falsoGitHub);
  const page = await ctx.newPage();
  const erros = [];
  page.on('pageerror', (e) => erros.push(`${nome}: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') erros.push(`${nome}: ${m.text()}`); });
  await page.goto(`http://localhost:${PORT}/index.html#/hoje`); await page.waitForTimeout(700);
  return { page, ctx, erros, nome };
}
const estado = (page) => page.evaluate(async () => { const e = await import('./js/core/estado.js'); await e.gravado(); return { feitas: Object.keys(e.S.licoes).filter((k) => e.S.licoes[k].feita).sort(), xp: e.S.xp, diario: e.S.diario.map((x) => x.t), cartoes: Object.keys(e.S.cartoes).length }; });
const sincronizar = (page) => page.evaluate(async () => { const n = await import('./js/core/nuvem.js'); await n.sincronizar(); return n.status(); });
async function concluirRapido(page, id) {
  await page.evaluate((x) => { location.hash = '#/licao/' + x; }, id); await page.waitForTimeout(300);
  for (let i = 0; i < 3; i++) { await page.locator('.acao-bar .btn.primary').click(); await page.waitForTimeout(80); }
  await page.getByRole('button', { name: 'Pular o exercício por agora' }).click();
  await page.locator('.acao-bar .btn.primary').click();
  const n = await page.evaluate(async (x) => (await import('./js/data/curso.js')).licao(x).quiz.length, id);
  for (let q = 0; q < n; q++) { await page.locator('.passo .opt[data-k="0"]').click(); await page.locator('.acao-bar .btn.primary').click(); await page.waitForTimeout(60); }
  await page.locator('.acao-bar .btn.primary').click(); await page.waitForTimeout(250);
}
async function ligar(page) {
  await page.evaluate(() => { location.hash = '#/mais/sync'; }); await page.waitForTimeout(300);
  await page.locator('input[type=password]').fill(TOKEN);
  await page.getByRole('button', { name: 'Ligar a sincronização' }).click();
  await page.waitForFunction(() => /Sincronizado/.test(document.body.innerText), null, { timeout: 15000 });
}

let falhas = 0;
const conferir = (cond, msg) => { if (cond) console.log('ok  ' + msg); else { falhas++; console.log('FALHOU  ' + msg); } };

const cel = await aparelho('celular', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const pc = await aparelho('pc', { viewport: { width: 1366, height: 900 } });

conferir(await cel.page.evaluate(() => document.body.classList.contains('celular')), 'o celular é reconhecido como celular');
conferir(await pc.page.evaluate(() => document.body.classList.contains('pc')), 'o computador é reconhecido como PC');
conferir(await pc.page.evaluate(() => getComputedStyle(document.querySelector('.tabs')).flexDirection === 'column'), 'no PC, o menu fica na lateral');
await pc.page.screenshot({ path: shots + 'pc-hoje.png' });

// 1. celular estuda e liga a sincronização
await concluirRapido(cel.page, '0.1');
await cel.page.evaluate(async () => (await import('./js/core/estado.js')).escreverDiario('Estudei no ônibus.'));
await ligar(cel.page);
conferir(gists.size === 1, 'o primeiro aparelho cria um Gist');
const bruto = [...gists.values()][0].files['formacao-ia-sync.json'].content;
conferir(!bruto.includes('ônibus') && !bruto.includes('"licoes"'), 'o conteúdo na nuvem está cifrado');

// 2. PC liga com o mesmo token e recebe tudo
await ligar(pc.page);
let ePC = await estado(pc.page);
conferir(ePC.feitas.includes('0.1') && ePC.diario.includes('Estudei no ônibus.'), 'o PC recebeu a lição e o diário do celular');
conferir(gists.size === 1, 'o segundo aparelho achou o mesmo Gist (sem criar outro)');

// 3. os dois estudam “ao mesmo tempo”, sem sincronizar no meio
await concluirRapido(pc.page, '0.2');
await concluirRapido(cel.page, '0.3');
await sincronizar(pc.page); await sincronizar(cel.page); await sincronizar(pc.page);
const eCel = await estado(cel.page); ePC = await estado(pc.page);
conferir(JSON.stringify(eCel.feitas) === JSON.stringify(['0.1', '0.2', '0.3']) && JSON.stringify(ePC.feitas) === JSON.stringify(eCel.feitas), 'lições feitas nos dois aparelhos aparecem nos dois');
conferir(eCel.xp === ePC.xp && eCel.xp > 0, `o XP é o mesmo nos dois (${eCel.xp}) e não foi contado em dobro`);
conferir(eCel.cartoes === ePC.cartoes && eCel.cartoes >= 6, 'os cartões de revisão são os mesmos nos dois');

// 4. apagar no PC apaga no celular
await pc.page.evaluate(async () => { const e = await import('./js/core/estado.js'); e.apagarDiario(e.S.diario.find((x) => x.t === 'Estudei no ônibus.')); });
await sincronizar(pc.page); await sincronizar(cel.page);
conferir(!(await estado(cel.page)).diario.includes('Estudei no ônibus.'), 'o que foi apagado num aparelho some no outro');

// 5. continuar a lição de onde parou no outro aparelho
await cel.page.evaluate(() => { location.hash = '#/licao/0.4'; }); await cel.page.waitForTimeout(300);
await cel.page.locator('.acao-bar .btn.primary').click(); await cel.page.locator('.acao-bar .btn.primary').click(); await cel.page.waitForTimeout(200);
await sincronizar(cel.page); await sincronizar(pc.page);
await pc.page.evaluate(() => { location.hash = '#/hoje'; }); await pc.page.waitForTimeout(400);
conferir(/0\.4 Algoritmo/.test(await pc.page.locator('.proximo').innerText()) && /Continuar/.test(await pc.page.locator('#comecar').innerText()), 'o PC oferece continuar a lição que começou no celular');
await pc.page.screenshot({ path: shots + 'pc-hoje-sincronizado.png' });

// 6. navegação para trás na lição, com teclado, no PC
await pc.page.evaluate(() => { location.hash = '#/licao/0.4'; }); await pc.page.waitForTimeout(300);
await pc.page.keyboard.press('Enter'); await pc.page.waitForTimeout(100);
await pc.page.keyboard.press('ArrowRight'); await pc.page.waitForTimeout(100);
await pc.page.keyboard.press('ArrowRight'); await pc.page.waitForTimeout(150);
const nOrd = await pc.page.locator('.ord .pool .peca').count();
for (let i = 0; i < nOrd; i++) await pc.page.locator(`.ord .pool .peca[data-i="${i}"]`).click();
await pc.page.getByRole('button', { name: 'Conferir a ordem' }).click();
await pc.page.keyboard.press('ArrowRight'); await pc.page.waitForTimeout(150);
await pc.page.keyboard.press('1'); await pc.page.waitForTimeout(100);
conferir(await pc.page.locator('.passo .opt[disabled]').count() > 0, 'no PC, a tecla 1 responde o quiz');
await pc.page.getByRole('button', { name: /Passo 2: Ideia/ }).click(); await pc.page.waitForTimeout(150);
conferir(/Passo 2 de 7/i.test(await pc.page.locator('.passo').innerText()), 'tocar num passo já visto volta a ele');
await pc.page.keyboard.press('ArrowRight'); await pc.page.keyboard.press('ArrowRight'); await pc.page.waitForTimeout(150);
conferir(await pc.page.locator('.ord .slot .peca.ok').count() === nOrd, 'voltar e avançar não apaga o exercício já feito');
await pc.page.getByRole('button', { name: 'Rever a ideia e o exemplo' }).first().click(); await pc.page.waitForTimeout(150);
conferir(await pc.page.locator('.sheet .callout.analogia').count() === 1, 'dá para rever a ideia e o exemplo durante o exercício');
await pc.page.screenshot({ path: shots + 'pc-licao-consulta.png' });
await pc.page.keyboard.press('Escape');
await cel.page.evaluate(() => { location.hash = '#/licao/1.3'; }); await cel.page.waitForTimeout(300);
await cel.page.screenshot({ path: shots + 'celular-licao-foto.png' });
conferir(await cel.page.locator('figure.foto.capa img').count() === 1, 'a lição mostra a foto real com crédito');

const erros = [...cel.erros, ...pc.erros];
for (const e of erros) console.log('erro: ' + e);
await browser.close(); server.kill();
console.log(`\n${falhas} falha(s), ${erros.length} erro(s). Pedidos ao GitHub falso: ${pedidos.length}.`);
process.exit(falhas || erros.length ? 1 : 0);
