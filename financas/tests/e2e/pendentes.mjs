// Pendentes de classificação: o que o app não reconhece fica em amarelo; o que ele identifica sai da frente.
// Importação (prévia só com os pendentes), Extrato (filtro "A classificar" e classificar ali mesmo) e Resumo.
// Uso: npm run e2e:pendentes
import { createRequire } from 'node:module';
import { spawn, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { try { pw = require('/opt/node-tools/node_modules/playwright'); } catch { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); } }
const raiz = fileURLToPath(new URL('../..', import.meta.url));
const shots = raiz + 'tests/e2e/shots/'; mkdirSync(shots, { recursive: true });
const PORTA = 8196;
const srv = spawn(process.execPath, ['tools/serve.mjs', String(PORTA)], { cwd: raiz, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 400));
const browser = await pw.chromium.launch();
const erros = [];
const ok = (c, m) => { console.log((c ? 'ok  ' : 'FALHOU  ') + m); if (!c) erros.push(m); };
try {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => erros.push('erro na página: ' + e.message));
  const ir = async (h) => { await p.evaluate((x) => { location.hash = '#/'; setTimeout(() => { location.hash = x; }, 30); }, h); await p.waitForTimeout(400); };
  await p.goto(`http://localhost:${PORTA}/`);
  await p.getByText('Este celular é de quem?').waitFor();
  await p.getByRole('button', { name: /Conta Bruno/ }).click();
  await p.getByText('Comece anotando um gasto').waitFor();

  // 1. prévia da importação: só os pendentes, em amarelo
  await ir('#/importar');
  await p.locator('#arq').setInputFiles(raiz + 'tests/exemplos/conta-a-classificar.csv');
  await p.getByText('Conferir importação').waitFor();
  const pend = await p.locator('#itens li').allInnerTexts();
  ok((await p.locator('[data-f=pendentes]').getAttribute('aria-pressed')) === 'true', 'prévia abre em “A classificar”');
  ok(pend.length === 4 && (await p.locator('#itens li.a-classificar').count()) === 4, `só os 4 não reconhecidos aparecem, em amarelo (${pend.length})`);
  ok(!pend.some((t) => /iFood|Uber/.test(t.split('\n')[0])), `iFood e Uber (identificados) saíram da frente: ${pend.map((t) => t.split('\n')[0]).join(' | ')}`);
  ok(/2.*identificados automaticamente/.test(await p.locator('#resumo-ident').innerText()), 'resumo: 2 identificados vão entrar como estão');
  await p.screenshot({ path: shots + 'importar-pendentes.png', fullPage: true });

  // 2. classificar um pendente: ele (e o outro com a mesma descrição) sai da lista
  await p.getByLabel('Conta de Xyzabc Comercio Ltda').first().selectOption('vestuario').catch(async () => {
    const opts = await p.getByLabel('Conta de Xyzabc Comercio Ltda').first().locator('option').allTextContents();
    throw new Error('opções: ' + opts.slice(0, 12).join(', '));
  });
  await p.waitForTimeout(900);
  const depois = await p.locator('#itens li').allInnerTexts();
  ok(depois.length === 2 && !depois.some((t) => /Xyzabc/.test(t)), `classificado sai da lista, junto com o de mesma descrição (restam ${depois.length})`);
  ok((await p.locator('[data-f=identificados]').innerText()) === 'Identificados (4)', 'eles passam para “Identificados”');
  await p.locator('#confirmar').click();
  await p.getByText(/6 lançamentos importados/).waitFor();

  // 3. Extrato: os 2 que ficaram sem conta, em amarelo, com o filtro "A classificar"
  await ir('#/extrato');
  ok((await p.locator('li.a-classificar').count()) === 2, 'Extrato: 2 lançamentos em amarelo');
  ok((await p.locator('#f-pend').innerText()) === 'A classificar (2)', 'Extrato: filtro “A classificar (2)”');
  await p.locator('#f-pend').click();
  await p.waitForTimeout(200);
  ok((await p.locator('#lista li').count()) === 2, 'com o filtro, só os pendentes');
  await p.screenshot({ path: shots + 'extrato-pendentes.png', fullPage: true });
  await p.locator('[data-classificar]').first().selectOption({ index: 1 });
  await p.waitForTimeout(900);
  ok((await p.locator('#lista li').count()) === 1 && (await p.locator('#f-pend').innerText()) === 'A classificar (1)', 'classificado no Extrato sai da lista');

  // 4. Resumo avisa em amarelo
  await ir('#/resumo');
  ok(/1 lançamento a classificar/.test(await p.locator('.aviso-classificar').innerText()), 'Resumo: aviso amarelo “1 lançamento a classificar”');
  await p.locator('.aviso-classificar').click();
  await p.waitForTimeout(500);
  ok((await p.locator('#f-pend').getAttribute('aria-pressed')) === 'true', 'o aviso leva ao Extrato já filtrado');
  await p.locator('[data-classificar]').first().selectOption({ index: 2 });
  await p.waitForTimeout(900);
  ok(/Tudo classificado/.test(await p.locator('#lista').innerText()), 'Extrato: “Tudo classificado”');
  await ir('#/resumo');
  ok((await p.locator('.aviso-classificar').count()) === 0, 'Resumo: aviso some quando não há pendentes');

  // 5. reimportar: o que foi classificado volta já identificado (o app aprendeu)
  await ir('#/importar');
  await p.locator('#arq').setInputFiles(raiz + 'tests/exemplos/conta-a-classificar.csv');
  await p.getByText('Conferir importação').waitFor();
  ok(/Nada a classificar/.test(await p.locator('#itens').innerText()) || (await p.locator('[data-f=pendentes]').innerText()) === 'A classificar (0)', 'nova importação: nada a classificar');
} catch (e) { erros.push(String(e.message || e).split('\n')[0]); try { await browser.contexts()[0].pages()[0].screenshot({ path: shots + 'pendentes-falha.png', fullPage: true }); } catch {} }
await browser.close(); srv.kill();
console.log(erros.length ? `\n${erros.length} problema(s):\n- ${erros.join('\n- ')}` : '\nTudo certo.');
process.exit(erros.length ? 1 : 0);
