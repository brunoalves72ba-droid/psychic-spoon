// Ticket Alimentação e Ticket Refeição: crédito do benefício como entrada, compra paga com o ticket
// e o saldo do mês no Resumo. Uso: npm run e2e:tickets
import { createRequire } from 'node:module';
import { spawn, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { try { pw = require('/opt/node-tools/node_modules/playwright'); } catch { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); } }
const raiz = fileURLToPath(new URL('../..', import.meta.url));
const shots = raiz + 'tests/e2e/shots/'; mkdirSync(shots, { recursive: true });
const PORTA = 8198;
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
  const frase = async (txt) => {
    await ir('#/lancar');
    await p.locator('#frase').fill(txt);
    await p.waitForTimeout(250);
    const pag = await p.locator('#pagamento').inputValue();
    await p.getByRole('button', { name: 'Salvar', exact: true }).click();
    await p.waitForTimeout(200);
    return { pag, msg: (await p.locator('#avisos').innerText()).split('\n')[0] };
  };

  // 1. crédito do benefício entra como entrada, na conta do ticket
  let r = await frase('caiu o va 800');
  ok(/Entrada de R\$\s*800,00 salvo em Ticket Alimentação/.test(r.msg), `crédito do VA: ${r.msg}`);
  r = await frase('recebi o vr 600');
  ok(/Entrada de R\$\s*600,00 salvo em Ticket Refeição/.test(r.msg), `crédito do VR: ${r.msg}`);

  // 2. compras pagas com o ticket
  r = await frase('mercado 120 no ticket');
  ok(r.pag === 'Ticket Alimentação', `mercado no ticket → ${r.pag}`);
  r = await frase('almoço 42,50 no vr');
  ok(r.pag === 'Ticket Refeição', `almoço no vr → ${r.pag}`);
  await ir('#/lancar');
  const opcoes = await p.locator('#pagamento option').allTextContents();
  ok(opcoes.includes('Ticket Alimentação') && opcoes.includes('Ticket Refeição'), 'Lançar: as duas formas de pagamento na lista');

  // 3. saldo no Resumo
  await ir('#/resumo');
  const t = await p.locator('.tickets').innerText();
  ok(/Ticket Alimentação[\s\S]*entrou R\$\s*800,00 · gasto R\$\s*120,00[\s\S]*sobra R\$\s*680,00/.test(t), 'Resumo: Ticket Alimentação sobra R$ 680,00');
  ok(/Ticket Refeição[\s\S]*entrou R\$\s*600,00 · gasto R\$\s*42,50[\s\S]*sobra R\$\s*557,50/.test(t), 'Resumo: Ticket Refeição sobra R$ 557,50');
  await p.locator('.tickets').scrollIntoViewIfNeeded();
  await p.screenshot({ path: shots + 'tickets.png' });

  // 4. no Extrato, a busca por "ticket" acha o que foi pago com ele
  await ir('#/extrato');
  await p.locator('#busca').fill('ticket refeição');
  await p.waitForTimeout(200);
  ok((await p.locator('#lista li').count()) === 2, 'Extrato: busca “ticket refeição” acha o crédito e o almoço');
} catch (e) { erros.push(String(e.message || e).split('\n')[0]); try { await browser.contexts()[0].pages()[0].screenshot({ path: shots + 'tickets-falha.png', fullPage: true }); } catch {} }
await browser.close(); srv.kill();
console.log(erros.length ? `\n${erros.length} problema(s):\n- ${erros.join('\n- ')}` : '\nTudo certo.');
process.exit(erros.length ? 1 : 0);
