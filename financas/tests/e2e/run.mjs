// Percorre o app no Chromium em tela de celular (390×844): lança, edita, filtra, define metas e faz backup.
// Uso: npm run e2e   (precisa do Playwright: npm i -D playwright && npx playwright install chromium)
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
const PORTA = 8191;
const srv = spawn(process.execPath, ['tools/serve.mjs', String(PORTA)], { cwd: raiz, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 400));

const erros = [];
const falhar = (msg) => { throw new Error(msg); };
const browser = await pw.chromium.launch();
try {
  for (const tema of ['light', 'dark']) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: tema, acceptDownloads: true });
    // escuro é o padrão; na rodada "light" o teste escolhe o tema Claro, como nos Ajustes
    if (tema === 'light') await ctx.addInitScript(() => { try { localStorage.setItem('fin-tema', 'claro'); } catch {} });
    const p = await ctx.newPage();
    p.on('pageerror', (e) => erros.push(e.message));
    p.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });
    await p.goto(`http://localhost:${PORTA}/`);
    // primeiro uso: de quem é este celular
    await p.getByText('Este celular é de quem?').waitFor();
    await p.screenshot({ path: `${shots}quem-${tema}.png` });
    await p.getByRole('button', { name: /Conta Bruno/ }).click();
    await p.getByText('Comece anotando um gasto').waitFor();
    if ((await p.locator('.conta-de').first().textContent()) !== 'Conta Bruno') falhar('cabeçalho da conta');

    // dados de exemplo: meses anteriores via armazenamento, para o gráfico
    await p.evaluate(() => {
      const d = JSON.parse(localStorage.getItem('fin-dados')) || { lancamentos: [] };
      const hoje = new Date();
      for (let i = 1; i <= 5; i++) {
        const dt = new Date(hoje.getFullYear(), hoje.getMonth() - i, 10);
        const m = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
        d.lancamentos.push({ id: 'h' + i, tipo: 'receita', valor: 520000, data: m + '-05', categoria: 'salario', descricao: 'Salário', pagamento: '' });
        d.lancamentos.push({ id: 'g' + i, tipo: 'despesa', valor: 300000 + i * 41000, data: m + '-10', categoria: 'mercado', descricao: 'Mercado', pagamento: 'Débito' });
        d.lancamentos.push({ id: 'k' + i, tipo: 'despesa', valor: 90000 + i * 7000, data: m + '-12', categoria: 'lazer', descricao: 'Cinema', pagamento: 'Crédito' });
      }
      localStorage.setItem('fin-dados', JSON.stringify(d));
    });

    // lançar salário recorrente
    await p.goto(`http://localhost:${PORTA}/#/lancar?tipo=receita`);
    await p.reload();
    await p.locator('#valor').pressSequentially('520000');
    if ((await p.locator('#valor').inputValue()) !== 'R$ 5.200,00') falhar('máscara de valor: ' + await p.locator('#valor').inputValue());
    await p.locator('#descricao').fill('Salário');
    await p.locator('#repetir').check();
    await p.getByRole('button', { name: 'Salvar', exact: true }).click();
    await p.getByText('Entrada de R$ 5.200,00 salvo em Salário / pró-labore (todo mês).').waitFor();

    // gastos
    await p.getByRole('button', { name: 'Gastei' }).click();
    for (const [v, cat, desc] of [['45890', 'Mercado', 'Feira'], ['3200', 'Deslocamento (Uber, táxi)', 'Uber'], ['8990', 'Restaurante e delivery', 'Pizza'], ['150000', 'Aluguel', 'Aluguel']]) {
      await p.locator('#valor').pressSequentially(v);
      await p.getByRole('button', { name: cat, exact: true }).click();
      await p.locator('#descricao').fill(desc);
      await p.getByRole('button', { name: 'Salvar', exact: true }).click();
      await p.waitForTimeout(80);
    }
    // lançamento rápido por frase
    await p.locator('#frase').fill('taxi 23,50 ontem no pix');
    await p.getByText(/Entendi: gasto de R\$ 23,50 · Taxi · em Deslocamento \(Uber, táxi\) · ontem · Pix/).waitFor();
    await p.getByText(/Reconhecido: Deslocamento/).waitFor();
    await p.screenshot({ path: `${shots}lancar-${tema}.png`, fullPage: true });
    await p.locator('#frase').press('Enter');
    await p.getByText('Gasto de R$ 23,50 salvo em Deslocamento (Uber, táxi).').waitFor();

    // resumo
    await p.locator('.abas a[data-aba=resumo]').click();
    await p.getByText('Para onde foi o dinheiro').waitFor();
    const saiu = await p.locator('.duo .v').nth(1).textContent();
    if (saiu !== 'R$ 2.104,30') falhar('total de saídas: ' + saiu);
    await p.locator('.grafico .alvo').nth(2).hover();
    await p.locator('.dica-flutuante:not([hidden])').waitFor();
    await p.screenshot({ path: `${shots}resumo-${tema}.png`, fullPage: true });

    // clicar na categoria leva ao extrato filtrado
    await p.getByRole('button', { name: 'Por conta' }).click();
    await p.locator('[data-cat=mercado]').click();
    await p.waitForURL(/extrato.*cat=mercado/);
    await p.locator('#busca').waitFor();
    if ((await p.locator('.lista li').count()) !== 1) falhar('filtro por categoria: ' + await p.locator('.lista li').count());
    await p.locator('#cat').selectOption('');
    await p.locator('#busca').fill('pizza');
    if ((await p.locator('.lista li').count()) !== 1) falhar('busca');
    await p.locator('#busca').fill('');
    await p.screenshot({ path: `${shots}extrato-${tema}.png`, fullPage: true });

    // editar um lançamento
    await p.locator('a.item', { hasText: 'R$ 32,00' }).click();
    await p.locator('#valor').fill('');
    await p.locator('#valor').pressSequentially('4500');
    await p.getByRole('button', { name: 'Salvar alterações' }).click();
    await p.getByText('− R$ 45,00').waitFor();

    // metas
    await p.locator('.abas a[data-aba=mais]').click();
    await p.getByRole('link', { name: /Metas/ }).click();
    await p.getByText('Defina as metas').waitFor();
    await p.getByLabel('Meta para Mercado').fill('500');
    await p.getByLabel('Meta para Restaurante e delivery').fill('80');
    await p.getByRole('button', { name: 'Salvar metas' }).click();
    await p.getByText('Passou da meta').waitFor();
    await p.getByText('Perto do limite').waitFor();
    await p.screenshot({ path: `${shots}metas-${tema}.png`, fullPage: true });

    // backup e planilha
    await p.goto(`http://localhost:${PORTA}/#/ajustes`);
    const [dl] = await Promise.all([p.waitForEvent('download'), p.getByRole('button', { name: 'Salvar cópia' }).click()]);
    const caminho = await dl.path();
    const [dl2] = await Promise.all([p.waitForEvent('download'), p.getByRole('button', { name: 'Planilha do mês' }).click()]);
    if (!dl2.suggestedFilename().endsWith('.csv')) falhar('csv');
    await p.screenshot({ path: `${shots}ajustes-${tema}.png`, fullPage: true });

    // apagar tudo e restaurar a cópia
    await p.getByRole('button', { name: 'Apagar todos os dados' }).click();
    await p.getByRole('button', { name: 'Apagar tudo' }).click();
    await p.getByText('Comece anotando um gasto').waitFor();
    await p.goto(`http://localhost:${PORTA}/#/ajustes`);
    await p.locator('#arquivo').setInputFiles(caminho);
    await p.getByRole('button', { name: 'Restaurar', exact: true }).click();
    await p.getByText(/Cópia restaurada: 21 lançamentos/).waitFor();

    // importar fatura do cartão e extrato da conta
    const ex = fileURLToPath(new URL('../exemplos/', import.meta.url));
    await p.goto(`http://localhost:${PORTA}/#/importar`);
    await p.locator('#arq').setInputFiles(ex + 'nubank-fatura.csv');
    await p.getByText('Conferir importação').waitFor();
    if ((await p.locator('#confirmar').textContent()) !== 'Importar 4') falhar('marcados na fatura: ' + await p.locator('#confirmar').textContent());
    await p.getByLabel('Conta de Posto Shell').selectOption('lazer');
    await p.getByLabel('Conta de Posto Shell').selectOption('transporte');
    await p.screenshot({ path: `${shots}importar-${tema}.png`, fullPage: true });
    await p.locator('#confirmar').click();
    await p.getByText('4 lançamentos importados.').waitFor();
    await p.goto(`http://localhost:${PORTA}/#/importar`);
    await p.locator('#arq').setInputFiles(ex + 'nubank-fatura.csv');
    await p.getByText(/4.já tinham sido importados/).waitFor();
    if ((await p.locator('#confirmar').textContent()) !== 'Nada marcado') falhar('reimportação duplicou');
    await p.getByRole('button', { name: 'Cancelar' }).click();
    await p.locator('#arq').setInputFiles(ex + 'itau.ofx');
    await p.getByText('Conferir importação').waitFor();
    await p.locator('#confirmar').click();
    await p.waitForURL(/extrato/);
    await p.locator('.etq', { hasText: 'banco' }).first().waitFor();
    await p.screenshot({ path: `${shots}extrato-importado-${tema}.png`, fullPage: true });

    // captura automática: o MacroDroid abre /receber com o texto da notificação
    const base = `http://localhost:${PORTA}/`;
    await p.goto(base + '#/receber?app=Nubank&titulo=Compra aprovada&texto=Compra de R$ 45,90 APROVADA em IFOOD *RESTAURANTE para o cartão com final 1234.');
    await p.getByText('Nova notificação: gasto de R$ 45,90 em IFOOD RESTAURANTE.').waitFor();
    await p.goto(base + '#/receber?app=Itaú&texto=Compra aprovada no cartão final 5678: R$ 600,00 em 3x de R$ 200,00 em MAGAZINE LUIZA.');
    await p.getByText(/Nova notificação: gasto de R\$ 600,00 em MAGAZINE LUIZA/).waitFor();
    // "Compartilhar com o Finanças" (share target) chega por ?texto=
    await p.goto(base + 'index.html?titulo=SMS&texto=' + encodeURIComponent('Compra de R$ 300,00 RECUSADA em LOJA X.'));
    await p.getByText('Notificação ignorada: Compra recusada.').waitFor();
    if ((await p.locator('.abas .contador').textContent()) !== '2') falhar('contador da caixa');
    await p.getByText('Parcelado em 3x de R$ 200,00').waitFor();
    await p.screenshot({ path: `${shots}caixa-${tema}.png`, fullPage: true });
    await p.locator('.pend', { hasText: 'IFOOD' }).getByRole('button', { name: '✔ Confirmar' }).click();
    await p.getByText('Lançado em Restaurante e delivery.').waitFor();
    await p.getByRole('button', { name: '✔ Confirmar' }).click();
    await p.getByText('3 parcelas lançadas em Compras (outros).').waitFor();
    await p.getByText('Nada para confirmar').waitFor();
    if (await p.locator('.abas .contador').count()) falhar('contador deveria sumir');
    await p.goto(base + '#/captura');
    await p.getByText('Endereço para o MacroDroid').waitFor();
    await p.screenshot({ path: `${shots}captura-${tema}.png`, fullPage: true });

    // plano de contas: sugestão de criar conta a partir dos gastos
    await p.goto(`http://localhost:${PORTA}/#/plano`);
    await p.getByText('Sugestões para o seu plano').waitFor();
    await p.screenshot({ path: `${shots}plano-${tema}.png`, fullPage: true });
    const sugCinema = p.locator('.sug', { hasText: 'Cinema e shows' });
    await sugCinema.getByRole('button', { name: 'Criar e mover' }).click();
    await p.getByText(/Conta “Cinema e shows” criada com 5 lançamentos/).waitFor();
    await p.locator('.grupo[data-grupo=lazer]').getByText('Cinema e shows').waitFor();

    // resumo por grupo
    await p.locator('.abas a[data-aba=resumo]').click();
    await p.getByRole('button', { name: 'Por grupo' }).click();
    await p.locator('[data-cat="g:moradia"]').waitFor();

        // sem rolagem horizontal
    const largura = await p.evaluate(() => document.documentElement.scrollWidth);
    if (largura > 390) falhar('rolagem horizontal: ' + largura);
    await ctx.close();
    console.log(`ok — tema ${tema}`);
  }
  if (erros.length) falhar('erros no console:\n' + erros.join('\n'));
  console.log(`Tudo certo. Capturas em ${shots}`);
} finally {
  await browser.close();
  srv.kill();
}
