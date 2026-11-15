// Dois celulares (Conta Bruno e Conta Rita) sincronizando por um GitHub simulado:
// convite, compartilhar, aba Casal igual nos dois, acerto do mês e privacidade.
// Uso: npm run e2e:casal
import { createRequire } from 'node:module';
import { spawn, execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }
const raiz = fileURLToPath(new URL('../..', import.meta.url));
const shots = fileURLToPath(new URL('./shots/', import.meta.url));
mkdirSync(shots, { recursive: true });
const PORTA = 8192, BASE = `http://localhost:${PORTA}/`;
const srv = spawn(process.execPath, ['tools/serve.mjs', String(PORTA)], { cwd: raiz, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 400));
const falhar = (m) => { throw new Error(m); };

// ---- GitHub de mentira: guarda os gists em memória
const gists = new Map();
let seq = 0;
async function github(route) {
  const req = route.request(), url = new URL(req.url());
  if (req.headers().authorization !== 'Bearer ghp_teste_da_familia') return route.fulfill({ status: 401, body: '{}' });
  const json = (o, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(o) });
  const ver = (id) => ({ id, files: Object.fromEntries(Object.entries(gists.get(id)).map(([n, c]) => [n, { content: c, truncated: false }])) });
  if (url.pathname === '/gists' && req.method() === 'GET') return json([...gists.keys()].map(ver));
  if (url.pathname === '/gists' && req.method() === 'POST') { const id = 'g' + ++seq; gists.set(id, Object.fromEntries(Object.entries(req.postDataJSON().files).map(([n, f]) => [n, f.content]))); return json(ver(id), 201); }
  const m = url.pathname.match(/^\/gists\/(\w+)$/);
  if (m && gists.has(m[1]) && req.method() === 'GET') return json(ver(m[1]));
  if (m && gists.has(m[1]) && req.method() === 'PATCH') { for (const [n, f] of Object.entries(req.postDataJSON().files)) gists.get(m[1])[n] = f.content; return json(ver(m[1])); }
  return json({}, 404);
}

const erros = [];
const browser = await pw.chromium.launch();
async function celular() {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: 'dark' });
  await ctx.route('https://api.github.com/**', github);
  const p = await ctx.newPage();
  p.on('pageerror', (e) => erros.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/401|404/.test(m.text())) erros.push(m.text()); });
  return p;
}
async function lancar(p, frase, compartilhar) {
  await p.goto(BASE + '#/lancar');
  await p.locator('#frase').fill(frase);
  await p.locator('#compartilhar').setChecked(compartilhar);
  await p.getByRole('button', { name: 'Salvar', exact: true }).click();
  await p.getByText(/salvo em/).waitFor();
}

try {
  // ---- celular do Bruno
  const bruno = await celular();
  await bruno.goto(BASE);
  await bruno.getByRole('button', { name: /Conta Bruno/ }).click();
  await lancar(bruno, 'aluguel 1500', true);
  await lancar(bruno, 'farmácia 50 drogasil', false);
  await bruno.goto(BASE + '#/conectar');
  await bruno.screenshot({ path: `${shots}conectar-inicio.png`, fullPage: true });
  await bruno.locator('input[name=token]').fill('ghp_teste_da_familia');
  await bruno.getByRole('button', { name: 'Conectar' }).click();
  await bruno.getByText('Convidar o celular de Rita').waitFor();
  await bruno.screenshot({ path: `${shots}conectar-convite.png`, fullPage: true });
  const convite = await bruno.evaluate(async () => (await import('./js/core/nuvem.js')).linkConvite());
  if (!convite.includes('#/conectar?c=')) falhar('link de convite');

  // ---- celular da Rita: lê o QR (abre o link do convite)
  const rita = await celular();
  await rita.goto(convite);
  await rita.getByText('Conectar este celular').waitFor();
  await rita.getByRole('button', { name: /Conta Rita/ }).click();
  await rita.waitForURL(/#\/casal/);
  if ((await rita.evaluate(() => location.hash)).includes('c=')) falhar('a chave ficou no endereço');
  await rita.getByText('Contas do casal').waitFor();
  await rita.locator('.saldo .valor', { hasText: 'R$ 1.500,00' }).waitFor(); // aluguel compartilhado do Bruno já chegou
  await lancar(rita, 'mercado 300', true);
  await rita.evaluate(async () => (await import('./js/core/nuvem.js')).sincronizar());

  // ---- Bruno recebe e os dois veem a mesma aba Casal
  await bruno.evaluate(async () => (await import('./js/core/nuvem.js')).sincronizar());
  for (const [quem, p] of [['Bruno', bruno], ['Rita', rita]]) {
    await p.goto(BASE + '#/casal');
    await p.locator('.saldo .valor', { hasText: 'R$ 1.800,00' }).waitFor();
    await p.getByText('Rita transfere R$ 600,00 para Bruno').waitFor();
    const txt = await p.locator('main').textContent();
    if (/drogasil|farm[aá]cia/i.test(txt)) falhar(`gasto privado do Bruno apareceu no celular de ${quem}`);
    if (!txt.includes('R$ 50,00')) falhar('total de gastos pessoais do Bruno');
    await p.screenshot({ path: `${shots}casal-${quem.toLowerCase()}.png`, fullPage: true });
  }

  // ---- Bruno compartilha depois, pelo extrato; acerto marcado vale para os dois
  await bruno.goto(BASE + '#/extrato');
  await bruno.locator('li', { hasText: 'Drogasil' }).getByRole('button', { name: /Privado/ }).click();
  await bruno.getByText('Compartilhado com Rita.').waitFor();
  await bruno.screenshot({ path: `${shots}extrato-compartilhar.png`, fullPage: true });
  await bruno.goto(BASE + '#/casal');
  await bruno.getByText('Rita transfere R$ 625,00 para Bruno').waitFor();
  await bruno.getByRole('button', { name: 'Marcar como acertado' }).click();
  await bruno.evaluate(async () => (await import('./js/core/nuvem.js')).sincronizar());
  await rita.evaluate(async () => (await import('./js/core/nuvem.js')).sincronizar());
  await rita.goto(BASE + '#/casal');
  await rita.getByText(/Acertado em .* por Bruno/).waitFor();

  // ---- aparelhos conectados
  await rita.goto(BASE + '#/conectar');
  await rita.getByText('Conta Bruno').first().waitFor();
  if ((await rita.locator('.contas li').count()) !== 2) falhar('aparelhos conectados');
  await rita.screenshot({ path: `${shots}aparelhos.png`, fullPage: true });

  if (erros.length) falhar('erros no console:\n' + erros.join('\n'));
  console.log('Casal ok: convite, compartilhar, aba Casal igual nos dois, acerto e privacidade.');
} finally {
  await browser.close();
  srv.kill();
}
