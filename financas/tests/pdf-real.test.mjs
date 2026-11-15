// PDFs de verdade (gerados por tools/gerar-exemplos-pdf.mjs) passando pelo pdf.js e pelo leitor de extratos.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
// no Node não há DOMMatrix/Path2D (só servem para desenhar a página; para ler o texto, basta existirem)
globalThis.DOMMatrix ??= class DOMMatrix { constructor(m) { [this.a, this.b, this.c, this.d, this.e, this.f] = m || [1, 0, 0, 1, 0, 0]; } };
globalThis.Path2D ??= class Path2D {};
const { linhasDoPDF, SenhaPDF, ehPDF } = await import('../js/core/pdf.js');
const { lerPDF } = await import('../js/core/importar.js');

const ex = (n) => readFileSync(new URL(`./exemplos/${n}`, import.meta.url));
const ler = async (n, senha) => lerPDF(await linhasDoPDF(ex(n), senha), { hoje: '2026-11-15' });
const resumo = (r) => r.itens.map((i) => [i.data, i.valor, i.descricao]);

test('reconhece PDF pelos bytes', () => {
  assert.equal(ehPDF(ex('extrato-colunas.pdf').buffer.slice(0, 64)), true);
  assert.equal(ehPDF(new TextEncoder().encode('Data;Valor').buffer), false);
});

test('extrato com colunas Valor e Saldo', async () => {
  assert.deepEqual(resumo(await ler('extrato-colunas.pdf')), [
    ['2026-10-01', -15000, 'PIX ENVIADO JOAO SILVA'],
    ['2026-10-02', 500000, 'SALARIO EMPRESA X'],
    ['2026-10-03', -89050, 'PAG BOLETO CONDOMINIO'],
    ['2026-10-05', -6290, 'IFOOD *RESTAURANTE'],
  ]);
});

test('extrato com Crédito/Débito e data só na primeira linha do dia', async () => {
  assert.deepEqual(resumo(await ler('extrato-credito-debito.pdf')), [
    ['2026-10-05', -20000, 'TRANSFERENCIA PIX · DES: MARIA SOUZA 05/10'],
    ['2026-10-05', 120000, 'RECEBIMENTO PIX'],
    ['2026-10-06', -2990, 'TARIFA BANCARIA'],
  ]);
});

test('extrato no formato do Nubank', async () => {
  const r = await ler('extrato-nubank.pdf');
  assert.deepEqual(resumo(r), [
    ['2026-10-01', 300000, 'Transferência recebida pelo Pix · EMPRESA X LTDA - 12.345.678/0001-90'],
    ['2026-10-01', -9540, 'Compra no débito PADARIA PAO BOM'],
    ['2026-10-02', -5000, 'Transferência enviada pelo Pix · JOSE DA SILVA - •••.123.456-••'],
  ]);
  assert.equal(r.duvidas, 0);
});

test('fatura do cartão (ano deduzido, dólar ignorado)', async () => {
  const r = await ler('fatura-cartao.pdf');
  assert.equal(r.cartao, true);
  assert.deepEqual(resumo(r), [
    ['2026-12-15', -12000, 'MERCADO LIVRE 3/6'],
    ['2026-12-28', -5500, 'NETFLIX.COM'],
    ['2027-01-02', 98000, 'PAGAMENTO RECEBIDO'],
    ['2027-01-03', -21600, 'POSTO SHELL'],
  ]);
});

test('PDF com senha: pede a senha, recusa a errada e abre com a certa', async () => {
  await assert.rejects(linhasDoPDF(ex('fatura-com-senha.pdf')), (e) => e instanceof SenhaPDF && !e.errada);
  await assert.rejects(linhasDoPDF(ex('fatura-com-senha.pdf'), '0000'), (e) => e instanceof SenhaPDF && e.errada);
  assert.equal((await ler('fatura-com-senha.pdf', '1234')).itens.length, 4);
});

test('PDF só com imagem avisa que não há texto', async () => {
  await assert.rejects(ler('extrato-imagem.pdf'), /imagem/);
});
