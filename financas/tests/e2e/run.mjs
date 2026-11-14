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
    const p = await ctx.newPage();
    p.on('pageerror', (e) => erros.push(e.message));
    p.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });
    await p.goto(`http://localhost:${PORTA}/`);
    await p.getByText('Comece anotando um gasto').waitFor();

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
    await p.getByText('Entrada de R$ 5.200,00 salvo (todo mês).').waitFor();

    // gastos
    await p.getByRole('button', { name: 'Gastei' }).click();
    for (const [v, cat, desc] of [['45890', 'Mercado', 'Feira'], ['3200', 'Transporte', 'Uber'], ['8990', 'Restaurante e delivery', 'Pizza'], ['150000', 'Moradia', 'Aluguel']]) {
      await p.locator('#valor').pressSequentially(v);
      await p.getByRole('button', { name: cat, exact: true }).click();
      await p.locator('#descricao').fill(desc);
      await p.getByRole('button', { name: 'Salvar', exact: true }).click();
      await p.waitForTimeout(80);
    }
    await p.screenshot({ path: `${shots}lancar-${tema}.png` });

    // resumo
    await p.locator('.abas a[data-aba=resumo]').click();
    await p.getByText('Para onde foi o dinheiro').waitFor();
    const saiu = await p.locator('.duo .v').nth(1).textContent();
    if (saiu !== 'R$ 2.080,80') falhar('total de saídas: ' + saiu);
    await p.locator('.grafico .alvo').nth(2).hover();
    await p.locator('.dica-flutuante:not([hidden])').waitFor();
    await p.screenshot({ path: `${shots}resumo-${tema}.png`, fullPage: true });

    // clicar na categoria leva ao extrato filtrado
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
    await p.getByRole('link', { name: /Uber/ }).click();
    await p.locator('#valor').fill('');
    await p.locator('#valor').pressSequentially('4500');
    await p.getByRole('button', { name: 'Salvar alterações' }).click();
    await p.getByText('− R$ 45,00').waitFor();

    // metas
    await p.locator('.abas a[data-aba=orcamento]').click();
    await p.getByText('Defina suas metas').waitFor();
    await p.getByLabel('Meta para Mercado').fill('500');
    await p.getByLabel('Meta para Restaurante e delivery').fill('80');
    await p.getByRole('button', { name: 'Salvar metas' }).click();
    await p.getByText('Passou da meta').waitFor();
    await p.getByText('Perto do limite').waitFor();
    await p.screenshot({ path: `${shots}metas-${tema}.png`, fullPage: true });

    // backup e planilha
    await p.locator('.abas a[data-aba=ajustes]').click();
    const [dl] = await Promise.all([p.waitForEvent('download'), p.getByRole('button', { name: 'Salvar cópia' }).click()]);
    const caminho = await dl.path();
    const [dl2] = await Promise.all([p.waitForEvent('download'), p.getByRole('button', { name: 'Planilha do mês' }).click()]);
    if (!dl2.suggestedFilename().endsWith('.csv')) falhar('csv');
    await p.screenshot({ path: `${shots}ajustes-${tema}.png`, fullPage: true });

    // apagar tudo e restaurar a cópia
    await p.getByRole('button', { name: 'Apagar todos os dados' }).click();
    await p.getByRole('button', { name: 'Apagar tudo' }).click();
    await p.getByText('Comece anotando um gasto').waitFor();
    await p.locator('.abas a[data-aba=ajustes]').click();
    await p.locator('#arquivo').setInputFiles(caminho);
    await p.getByRole('button', { name: 'Restaurar', exact: true }).click();
    await p.getByText(/Cópia restaurada: 20 lançamentos/).waitFor();

    // importar fatura do cartão e extrato da conta
    const ex = fileURLToPath(new URL('../exemplos/', import.meta.url));
    await p.goto(`http://localhost:${PORTA}/#/importar`);
    await p.locator('#arq').setInputFiles(ex + 'nubank-fatura.csv');
    await p.getByText('Conferir importação').waitFor();
    if ((await p.locator('#confirmar').textContent()) !== 'Importar 4') falhar('marcados na fatura: ' + await p.locator('#confirmar').textContent());
    await p.getByLabel('Categoria de Posto Shell').selectOption('lazer');
    await p.getByLabel('Categoria de Posto Shell').selectOption('transporte');
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
