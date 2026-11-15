// Recorrências: entradas e despesas recorrentes, sobra fixa, editar, encerrar; contas de entrada
// Devoluções e Complemento de receita. Uso: npm run e2e:recorrencias
import { createRequire } from 'node:module';
import { spawn, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { try { pw = require('/opt/node-tools/node_modules/playwright'); } catch { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); } }
const raiz = fileURLToPath(new URL('../..', import.meta.url));
const shots = raiz + 'tests/e2e/shots/'; mkdirSync(shots, { recursive: true });
const PORTA = 8195;
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

  const lancar = async (hash, centavos, desc, { repetir = false, conta } = {}) => {
    await ir(hash);
    await p.locator('#valor').pressSequentially(centavos);
    await p.locator('#descricao').fill(desc);
    if (conta) await p.getByRole('button', { name: conta, exact: true }).click();
    if (repetir) await p.locator('#repetir').check();
    await p.getByRole('button', { name: 'Salvar', exact: true }).click();
    return (await p.locator('#avisos').innerText().catch(() => ''));
  };

  // 1. entradas e despesas recorrentes
  await ir('#/lancar?tipo=receita');
  ok(/Entrada recorrente: salário/.test(await p.locator('#repetir-dica').innerText()), 'Lançar: dica de entrada recorrente');
  let msg = await lancar('#/lancar?tipo=receita', '600000', 'Salário', { repetir: true });
  ok(/entrada recorrente/.test(msg), `aviso: ${msg.split('\n')[0]}`);
  msg = await lancar('#/lancar?tipo=receita', '80000', 'Complemento de renda', { repetir: true });
  ok(/Complemento de receita/.test(msg), 'complemento reconhecido na conta “Complemento de receita”');
  msg = await lancar('#/lancar', '200000', 'Aluguel', { repetir: true, conta: 'Aluguel' });
  ok(/despesa recorrente/.test(msg), 'aluguel salvo como despesa recorrente');

  // 2. tela Recorrências
  await ir('#/mais');
  ok(await p.getByText('Recorrências', { exact: true }).count() === 1, 'Mais: item Recorrências');
  await ir('#/recorrentes');
  let txt = await p.locator('main').innerText();
  ok(/Sobra fixa por mês\s*R\$\s*4\.800,00/.test(txt), 'sobra fixa: 6.000 + 800 − 2.000 = R$ 4.800,00');
  ok(/Entradas recorrentes\s*R\$\s*6\.800,00\/mês/.test(txt) && /Despesas recorrentes\s*R\$\s*2\.000,00\/mês/.test(txt), 'totais de entradas e de despesas');
  ok((await p.locator('.etq.ok').count()) === 3, 'as três já entraram/saíram neste mês');
  await p.screenshot({ path: shots + 'recorrencias.png', fullPage: true });

  // 3. editar o aluguel: muda a recorrência e o lançamento deste mês
  await p.locator('[data-rec]', { hasText: 'Aluguel' }).click();
  await p.locator('dialog.rec-editar').waitFor();
  await p.locator('#rv').fill('');
  await p.locator('#rv').pressSequentially('215000');
  await p.screenshot({ path: shots + 'recorrencia-editar.png' });
  await p.getByRole('button', { name: 'Salvar' }).click();
  await p.waitForTimeout(300);
  txt = await p.locator('main').innerText();
  ok(/Despesas recorrentes\s*R\$\s*2\.150,00\/mês/.test(txt), 'valor novo do aluguel na recorrência');
  const aluguelMes = await p.evaluate(() => JSON.parse(localStorage.getItem('fin-dados')).lancamentos.find((l) => l.descricao === 'Aluguel').valor);
  ok(aluguelMes === 215000, 'o lançamento deste mês também mudou');

  // 4. encerrar o complemento
  await p.locator('[data-rec]', { hasText: 'Complemento' }).click();
  await p.getByRole('button', { name: 'Encerrar' }).click();
  await p.getByRole('button', { name: 'Encerrar' }).last().click();
  await p.waitForTimeout(300);
  const fim = await p.evaluate(() => JSON.parse(localStorage.getItem('fin-dados')).recorrentes.find((r) => /Complemento/.test(r.descricao)).fim);
  ok(/^\d{4}-\d{2}$/.test(fim || ''), `complemento encerrado (último mês ${fim})`);

  // 5. botão "Nova entrada recorrente" já abre o Lançar certo
  await ir('#/recorrentes');
  await p.getByRole('link', { name: '+ Nova entrada recorrente' }).click();
  await p.waitForTimeout(400);
  ok(await p.locator('#repetir').isChecked() && (await p.locator('[data-tipo=receita]').getAttribute('aria-pressed')) === 'true', 'Nova entrada recorrente: entrada com “Repetir todo mês” marcado');

  // 6. devolução pela frase rápida
  await ir('#/lancar');
  await p.locator('#frase').fill('devolução 120 da loja');
  await p.waitForTimeout(200);
  ok((await p.locator('[data-tipo=receita]').getAttribute('aria-pressed')) === 'true', 'frase “devolução 120”: vira entrada');
  await p.getByRole('button', { name: 'Salvar', exact: true }).click();
  msg = await p.locator('#avisos').innerText();
  ok(/R\$\s*120,00 salvo em Devoluções/.test(msg), `devolução vai para a conta Devoluções (${msg.split('\n')[0]})`);
} catch (e) { erros.push(String(e.message || e).split('\n')[0]); try { await browser.contexts()[0].pages()[0].screenshot({ path: shots + 'recorrencias-falha.png', fullPage: true }); } catch {} }
await browser.close(); srv.kill();
console.log(erros.length ? `\n${erros.length} problema(s):\n- ${erros.join('\n- ')}` : '\nTudo certo.');
process.exit(erros.length ? 1 : 0);
