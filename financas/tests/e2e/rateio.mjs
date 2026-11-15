// Gasto compartilhado individual x dividido: lançar com "Dos dois", "Só meu" e "Só de Rita", conferir
// o acerto na aba Casal, o reconhecimento pela descrição, a escolha no Extrato e no A confirmar.
// Uso: npm run e2e:rateio
import { createRequire } from 'node:module';
import { spawn, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { try { pw = require('/opt/node-tools/node_modules/playwright'); } catch { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); } }
const raiz = fileURLToPath(new URL('../..', import.meta.url));
const shots = raiz + 'tests/e2e/shots/'; mkdirSync(shots, { recursive: true });
const PORTA = 8194;
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

  const lancar = async (centavos, conta, desc, rateio, foto) => {
    await ir('#/lancar');
    await p.locator('#valor').pressSequentially(centavos);
    await p.getByRole('button', { name: conta, exact: true }).click();
    await p.locator('#descricao').fill(desc);
    await p.locator('#compartilhar').check();
    await p.locator('#rateio').waitFor();
    if (rateio) await p.locator(`[data-rateio=${rateio}]`).click();
    if (foto) await p.screenshot({ path: shots + foto, fullPage: true });
    await p.getByRole('button', { name: 'Salvar', exact: true }).click();
    await p.waitForTimeout(150);
  };

  // 1. o seletor só aparece ao compartilhar um gasto
  await ir('#/lancar');
  ok(await p.locator('#rateio').isHidden(), 'sem compartilhar, a escolha “de quem é” fica escondida');
  await p.locator('#compartilhar').check();
  ok(await p.locator('#rateio').isVisible() && (await p.locator('[data-rateio=dividir]').getAttribute('aria-pressed')) === 'true', 'ao compartilhar, aparece com “Dos dois” marcado');

  // 2. três gastos compartilhados, um de cada tipo
  await lancar('20000', 'Mercado', 'Feira', 'dividir');
  await lancar('15000', 'Mercado', 'Loja Renner', 'outro', 'lancar-rateio.png');
  await lancar('5000', 'Mercado', 'Academia', 'meu');

  // 3. aba Casal: divididos, individuais e acerto
  await ir('#/casal');
  const casal = await p.locator('main').innerText();
  ok(/Gastos divididos[\s\S]*R\$\s*200,00/.test(casal), 'Casal: R$ 200,00 divididos');
  ok(/Só de Rita\s*R\$\s*150,00/.test(casal) && /Só de Bruno\s*R\$\s*50,00/.test(casal), 'Casal: individuais de cada um separados');
  ok(/Bruno pagou R\$\s*150,00 em gastos só de Rita/.test(casal), 'Casal: explica o que Bruno pagou pela Rita');
  ok(/Rita transfere R\$\s*250,00 para Bruno/.test(casal), `Casal: acerto 100 (metade da feira) + 150 (só da Rita) = R$ 250,00`);
  ok((await p.locator('.etq.ind', { hasText: 'só de Rita' }).count()) === 1 && (await p.locator('.etq', { hasText: 'dividido' }).count()) === 1, 'Casal: lista marca “dividido” e “só de …”');
  await p.screenshot({ path: shots + 'casal-rateio.png', fullPage: true });

  // 4. reconhece pela descrição
  await ir('#/lancar');
  await p.locator('#valor').pressSequentially('9000');
  await p.locator('#descricao').fill('Loja Renner');
  await p.locator('#compartilhar').check();
  ok((await p.locator('[data-rateio=outro]').getAttribute('aria-pressed')) === 'true' && /como da última vez/.test(await p.locator('#rateio legend').innerText()), 'mesma descrição: já vem “Só de Rita”, como da última vez');
  ok(/Rita devolve R\$\s*90,00/.test(await p.locator('#rateio-exp').innerText()), 'explica quanto volta no acerto');

  // 5. Extrato: mudar de quem é
  await ir('#/extrato');
  const btFeira = p.locator('li', { hasText: 'Feira' }).locator('.btn-comp');
  ok((await btFeira.innerText()).includes('Dividido'), 'Extrato: botão mostra “Dividido”');
  await btFeira.click();
  await p.locator('dialog.escolha').waitFor();
  await p.screenshot({ path: shots + 'extrato-rateio.png' });
  await p.locator('dialog.escolha .opcao', { hasText: 'Só meu' }).click();
  await p.waitForTimeout(200);
  ok((await p.locator('li', { hasText: 'Feira' }).locator('.btn-comp').innerText()).includes('Só meu'), 'Extrato: agora “Só meu”');
  await ir('#/casal');
  ok(/Rita transfere R\$\s*150,00 para Bruno/.test(await p.locator('main').innerText()), 'Casal: acerto refeito (só os R$ 150,00 da Rita)');
  await ir('#/extrato');
  await p.locator('li', { hasText: 'Academia' }).locator('.btn-comp').click();
  await p.locator('dialog.escolha .opcao', { hasText: 'Privado' }).click();
  await p.waitForTimeout(200);
  ok((await p.locator('li', { hasText: 'Academia' }).locator('.btn-comp').innerText()).includes('Privado'), 'Extrato: dá para voltar a privado');

  // 6. A confirmar: a escolha aparece ao marcar compartilhar
  await ir('#/caixa');
  await p.locator('details.colar summary').click();
  await p.locator('#colado').fill('Compra aprovada no cartão final 1234 de R$ 89,90 em DROGASIL');
  await p.locator('#ler').click();
  await p.locator('.pend').first().waitFor();
  const card = p.locator('.pend').first();
  ok(await card.locator('.rateio-caixa').isHidden(), 'A confirmar: sem compartilhar, sem a escolha');
  await card.locator('[data-campo=compartilhado]').check();
  ok(await card.locator('.rateio-caixa').isVisible(), 'A confirmar: ao compartilhar, aparece “De quem é”');
  await card.locator('[data-campo=rateio]').selectOption('meu');
  await card.locator('[data-confirmar]').click();
  await p.waitForTimeout(300);
  const salvo = await p.evaluate(() => JSON.parse(localStorage.getItem('fin-dados')).lancamentos.find((l) => /DROGASIL/i.test(l.descricao)));
  ok(salvo && salvo.compartilhado && salvo.rateio === 'meu', 'A confirmar: grava compartilhado e “só meu”');
} catch (e) { erros.push(String(e.message || e).split('\n')[0]); try { await browser.contexts()[0].pages()[0].screenshot({ path: shots + 'rateio-falha.png', fullPage: true }); } catch {} }
await browser.close(); srv.kill();
console.log(erros.length ? `\n${erros.length} problema(s):\n- ${erros.join('\n- ')}` : '\nTudo certo.');
process.exit(erros.length ? 1 : 0);
