// Teste offline e de convivência: serve o repositório inteiro (Sexteto na raiz, este app em /formacao-ia/),
// instala primeiro o service worker do Sexteto, depois abre este app, corta a rede e confere que tudo abre,
// inclusive o Python embutido e os kits.
// Uso: node tests/e2e/offline.mjs
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); }
const root = fileURLToPath(new URL('../..', import.meta.url));
const PORT = 8125;
const server = spawn(process.execPath, [root + 'tools/serve.mjs', String(PORT), '--raiz'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 500));
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const erros = [];
page.on('pageerror', (e) => erros.push(e.message));
const falha = (m) => { console.log('FALHOU  ' + m); erros.push(m); };

// 1. o Sexteto (raiz) instala o service worker dele
await page.goto(`http://localhost:${PORT}/index.html`);
await page.evaluate(() => navigator.serviceWorker.ready);
await page.waitForTimeout(1500);
console.log('ok  Sexteto instalado na raiz');

// 2. este app, no mesmo site
await page.goto(`http://localhost:${PORT}/formacao-ia/index.html#/hoje`);
await page.waitForFunction(() => document.querySelector('meta[name="app-id"][content="formacao-ia"]') && document.querySelector('#view h1'), null, { timeout: 30000 });
await page.evaluate(async () => { const reg = await navigator.serviceWorker.getRegistration('./'); if (!reg) throw new Error('sem service worker'); await navigator.serviceWorker.ready; });
await page.waitForFunction(async () => { const r = await navigator.serviceWorker.getRegistration('./'); return r && r.active && r.active.state === 'activated'; }, null, { timeout: 60000 });
await page.reload(); await page.waitForTimeout(1200);
const controlado = await page.evaluate(() => navigator.serviceWorker.controller && navigator.serviceWorker.controller.scriptURL);
if (!controlado || !controlado.includes('/formacao-ia/sw.js')) falha(`a página não está sob o service worker certo: ${controlado}`); else console.log('ok  service worker próprio controla /formacao-ia/');
const nCache = await page.evaluate(async () => { const ks = await caches.keys(); const k = ks.find((x) => x.startsWith('formacao-ia-')); return k ? (await (await caches.open(k)).keys()).length : 0; });
const esperado = readFileSync(root + 'sw-assets.js', 'utf8').match(/FIA_ASSETS = (\[.*\])/)[1];
if (nCache !== JSON.parse(esperado).length) falha(`pré-cache com ${nCache} de ${JSON.parse(esperado).length} arquivos`); else console.log(`ok  ${nCache} arquivos no pré-cache`);

await page.evaluate(() => { location.hash = '#/mais/instalar'; }); await page.waitForTimeout(1200);
const txtInst = await page.evaluate(() => document.getElementById('view').innerText);
if (!/Tudo guardado neste aparelho/.test(txtInst)) falha('a tela Instalar não confirmou tudo guardado'); else console.log('ok  a tela Instalar confirma tudo guardado no aparelho');
await page.screenshot({ path: root + 'tests/e2e/shots/instalar.png' });

// 3. sem rede
await ctx.setOffline(true);
await page.reload(); await page.waitForTimeout(800);
const rotas = ['#/hoje', '#/trilha', '#/trilha/m/4', '#/licao/3.5', '#/revisar', '#/revisar/importar', '#/projeto', '#/projeto/kits', '#/projeto/prompts/novo', '#/progresso', '#/progresso/cronograma', '#/mais/ficha', '#/mais/porque', '#/labs', '#/labs/x/api', '#/labs/x/rag', '#/foco'];
for (const r of rotas) {
  await page.evaluate((x) => { location.hash = x; }, r); await page.waitForTimeout(350);
  const t = await page.evaluate(() => document.getElementById('view').innerText);
  if (/Não deu para abrir|Algo deu errado/.test(t) || t.length < 40) falha(`offline: ${r}`);
}
console.log(`ok  ${rotas.length} telas abertas sem rede`);
await page.evaluate(() => { location.hash = '#/labs/x/python'; }); await page.waitForTimeout(500);
await page.locator('.lab .btn.primary').click();
await page.waitForFunction(() => /Olá, Ana/.test(document.querySelector('.saida').textContent), null, { timeout: 30000 }).then(() => console.log('ok  Python roda sem rede')).catch(() => falha('Python offline'));
const kit = await page.evaluate(async () => (await fetch('kits/m3/mini_rag.py')).ok);
if (!kit) falha('kit offline'); else console.log('ok  kits disponíveis sem rede');

// 4. o Sexteto continua funcionando sem rede (o service worker dele não foi afetado)
await page.goto(`http://localhost:${PORT}/index.html#/inicio`).catch(() => {});
await page.waitForTimeout(1500);
const sexteto = await page.evaluate(() => document.title);
if (!/Sexteto/.test(sexteto)) falha(`o Sexteto não abriu offline: ${sexteto}`); else console.log('ok  Sexteto continua abrindo sem rede');

await browser.close(); server.kill();
console.log(erros.length ? `\n${erros.length} problema(s).` : '\nTudo certo.');
process.exit(erros.length ? 1 : 0);
