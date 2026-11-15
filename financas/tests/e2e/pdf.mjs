// Importar extratos em PDF pela tela, como no celular: os quatro formatos de exemplo, PDF com senha,
// PDF só com imagem, o botão "trocar entrada/saída" e a gravação no extrato.
// Uso: npm run e2e:pdf
import { createRequire } from 'node:module';
import { spawn, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { try { pw = require('/opt/node-tools/node_modules/playwright'); } catch { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); } }
const raiz = fileURLToPath(new URL('../..', import.meta.url));
const ex = raiz + 'tests/exemplos/';
const shots = raiz + 'tests/e2e/shots/'; mkdirSync(shots, { recursive: true });
const PORTA = 8193;
const srv = spawn(process.execPath, ['tools/serve.mjs', String(PORTA)], { cwd: raiz, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 400));
const browser = await pw.chromium.launch();
const erros = [];
const ok = (c, m) => { console.log((c ? 'ok  ' : 'FALHOU  ') + m); if (!c) erros.push(m); };
try {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => erros.push('erro na página: ' + e.message));
  p.on('request', (r) => { if (!r.url().startsWith(`http://localhost:${PORTA}/`) && !/^(blob|data):/.test(r.url())) erros.push('pedido externo: ' + r.url()); });
  // primeiro uso: de quem é este celular
  await p.goto(`http://localhost:${PORTA}/`);
  await p.getByText('Este celular é de quem?').waitFor();
  await p.getByRole('button', { name: /Conta Bruno/ }).click();
  await p.getByText('Comece anotando um gasto').waitFor();
  const importar = async (arq) => {
    for (let k = 0; k < 3; k++) {
      await p.evaluate(() => { location.hash = '#/'; }); await p.waitForTimeout(150);
      await p.evaluate(() => { location.hash = '#/importar'; });
      try { await p.locator('#arq').waitFor({ state: 'attached', timeout: 3000 }); break; } catch {}
    }
    await p.locator('#arq').setInputFiles(ex + arq);
  };
  const previa = async () => { await p.getByText('Conferir importação').waitFor({ timeout: 20000 }); await p.locator('[data-f=todos]').click(); return p.locator('#itens li').allInnerTexts(); };

  // 1. extrato com colunas
  await importar('extrato-colunas.pdf');
  let itens = await previa();
  ok(itens.length === 4, `extrato com colunas: ${itens.length} lançamentos`);
  ok(/PDF/.test(await p.locator('.etq').first().innerText()), 'prévia marca o formato PDF');
  ok(await p.locator('.aviso-pdf').count() === 1, 'aviso de conferir a leitura do PDF');
  ok(itens.some((t) => /SALARIO EMPRESA X/.test(t) && /\+\s*R\$\s*5\.000,00/.test(t)), 'salário entra como entrada de R$ 5.000,00');
  ok(itens.some((t) => /PIX ENVIADO JOAO SILVA/.test(t) && /−\s*R\$\s*150,00/.test(t)), 'Pix enviado sai como saída de R$ 150,00');
  await p.screenshot({ path: shots + 'importar-pdf.png', fullPage: true });

  // 2. trocar entrada/saída
  const linhaIfood = p.locator('#itens li', { hasText: 'IFOOD' });
  await linhaIfood.getByRole('button', { name: 'trocar entrada/saída' }).click();
  ok(/\+\s*R\$\s*62,90/.test(await linhaIfood.innerText()), 'trocar entrada/saída inverte o lançamento');
  await linhaIfood.getByRole('button', { name: 'trocar entrada/saída' }).click();
  ok(/−\s*R\$\s*62,90/.test(await linhaIfood.innerText()), 'e volta ao tocar de novo');

  // 3. gravar e reimportar sem duplicar
  await p.locator('#confirmar').click();
  await p.getByText(/4 lançamentos importados/).waitFor();
  await importar('extrato-colunas.pdf'); await previa();
  ok((await p.locator('#confirmar').textContent()) === 'Nada marcado', 'reimportar o mesmo PDF não duplica');

  // 4. outros formatos
  for (const [arq, n, alvo] of [['extrato-credito-debito.pdf', 3, /DES: MARIA SOUZA/], ['extrato-nubank.pdf', 3, /EMPRESA X LTDA/], ['fatura-cartao.pdf', 4, /15\/12\/2026/]]) {
    await importar(arq); itens = await previa();
    ok(itens.length === n && itens.some((t) => alvo.test(t)), `${arq}: ${itens.length} lançamentos`);
  }
  ok(/cartão/.test(await p.locator('.cartao .etq').first().innerText()), 'fatura reconhecida como cartão');

  // 5. PDF com senha
  await importar('fatura-com-senha.pdf');
  await p.locator('#senha-pdf').waitFor({ timeout: 20000 });
  ok(true, 'PDF com senha: o app pede a senha');
  await p.locator('#senha-pdf').fill('0000'); await p.getByRole('button', { name: 'Abrir' }).click();
  await p.getByText('Senha incorreta.').waitFor({ timeout: 20000 });
  ok(true, 'senha errada avisa');
  await p.screenshot({ path: shots + 'importar-pdf-senha.png' });
  await p.locator('#senha-pdf').fill('1234'); await p.getByRole('button', { name: 'Abrir' }).click();
  itens = await previa();
  ok(itens.length === 4, 'senha certa abre a fatura');

  // 6. PDF só com imagem
  await importar('extrato-imagem.pdf');
  await p.getByText(/parece ser uma imagem/).waitFor({ timeout: 20000 });
  ok(true, 'PDF escaneado: mensagem clara');

  // 7. sem internet também lê (o pdf.js fica guardado no aparelho)
  await p.evaluate(() => { location.hash = '#/importar'; });
  await p.waitForFunction(async () => { const r = await navigator.serviceWorker.getRegistration(); return r && r.active; }, null, { timeout: 30000 });
  await p.waitForTimeout(1500);
  await ctx.setOffline(true);
  await p.reload(); await p.locator('#arq').setInputFiles(ex + 'extrato-nubank.pdf');
  itens = await previa();
  ok(itens.length === 3, 'sem internet, o PDF é lido do mesmo jeito');
  await ctx.setOffline(false);
} catch (e) { erros.push(String(e.message || e).split('\n')[0]); try { const pg = browser.contexts()[0].pages()[0]; console.log('URL:', pg.url()); console.log((await pg.locator('main').innerText()).slice(0, 400)); await pg.screenshot({ path: shots + 'pdf-falha.png' }); } catch {} }
await browser.close(); srv.kill();
console.log(erros.length ? `\n${erros.length} problema(s):\n- ${erros.join('\n- ')}` : '\nTudo certo.');
process.exit(erros.length ? 1 : 0);
