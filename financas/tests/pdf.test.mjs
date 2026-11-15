// Leitura de extratos em PDF: as linhas imitam o que o pdf.js entrega (texto e posição).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lerPDF } from '../js/core/importar.js';

// cada linha: lista de [texto, x]; a largura sai do tamanho do texto (6 pt por letra)
let y = 800;
const L = (...cels) => ({ pagina: 1, y: (y -= 14), h: 10, itens: cels.map(([t, x]) => ({ t, x, w: t.length * 6, h: 10 })) });
const novo = () => { y = 800; };
// valores alinhados à direita: a borda direita da coluna é x + largura
const dir = (t, borda) => [t, borda - t.length * 6];

test('extrato com colunas Valor e Saldo (data em cada linha)', () => {
  novo();
  const linhas = [
    L(['Extrato de conta corrente', 40]), L(['Período: 01/10/2026 a 31/10/2026', 40]),
    L(['Data', 40], ['Lançamento', 120], dir('Valor (R$)', 420), dir('Saldo (R$)', 520)),
    L(['30/09/2026', 40], ['SALDO ANTERIOR', 120], dir('1.000,00', 520)),
    L(['01/10/2026', 40], ['PIX ENVIADO JOAO SILVA', 120], dir('-150,00', 420), dir('850,00', 520)),
    L(['02/10/2026', 40], ['SALARIO EMPRESA X', 120], dir('5.000,00', 420)),
    L(['03/10/2026', 40], ['PAG BOLETO CONDOMINIO', 120], dir('-890,50', 420), dir('4.959,50', 520)),
  ];
  const r = lerPDF(linhas);
  assert.equal(r.cartao, false);
  assert.deepEqual(r.itens.map((i) => [i.data, i.valor, i.descricao]), [
    ['2026-10-01', -15000, 'PIX ENVIADO JOAO SILVA'],
    ['2026-10-02', 500000, 'SALARIO EMPRESA X'],
    ['2026-10-03', -89050, 'PAG BOLETO CONDOMINIO'],
  ]);
  assert.equal(r.duvidas, 0);
});

test('colunas Crédito/Débito/Saldo e data só na primeira linha do dia', () => {
  novo();
  const linhas = [
    L(['Data', 40], ['Histórico', 110], dir('Crédito (R$)', 360), dir('Débito (R$)', 450), dir('Saldo (R$)', 540)),
    L(['05/10/2026', 40], ['TRANSFERENCIA PIX', 110], dir('200,00', 450)),
    L(['DES: MARIA SOUZA 05/10', 110]),
    L(['RECEBIMENTO PIX', 110], dir('1.200,00', 360), dir('3.000,00', 540)),
    L(['06/10/2026', 40], ['TARIFA BANCARIA', 110], dir('29,90', 450), dir('2.970,10', 540)),
  ];
  const r = lerPDF(linhas);
  assert.deepEqual(r.itens.map((i) => [i.data, i.valor]), [['2026-10-05', -20000], ['2026-10-05', 120000], ['2026-10-06', -2990]]);
  assert.equal(r.itens[0].descricao, 'TRANSFERENCIA PIX · DES: MARIA SOUZA 05/10');
});

test('formato Nubank: dia com “Total de entradas/saídas” e nome na linha de baixo', () => {
  novo();
  const linhas = [
    L(['Extrato de 01 OUT 2026 a 31 OUT 2026', 40]),
    L(['01 OUT 2026', 40], ['Total de entradas', 200], ['+ 3.000,00', 460]),
    L(['Transferência recebida pelo Pix', 40], ['3.000,00', 460]),
    L(['EMPRESA X LTDA - 12.345.678/0001-90', 40]),
    L(['Total de saídas', 200], ['- 95,40', 460]),
    L(['Compra no débito', 40], ['PADARIA PAO BOM', 200], ['95,40', 460]),
    L(['02 OUT 2026', 40], ['Total de saídas', 200], ['- 50,00', 460]),
    L(['Transferência enviada pelo Pix', 40], ['50,00', 460]),
    L(['Saldo final do período', 40], ['R$ 2.854,60', 460]),
  ];
  const r = lerPDF(linhas);
  assert.deepEqual(r.itens.map((i) => [i.data, i.valor]), [['2026-10-01', 300000], ['2026-10-01', -9540], ['2026-10-02', -5000]]);
  assert.equal(r.itens[0].descricao, 'Transferência recebida pelo Pix · EMPRESA X LTDA - 12.345.678/0001-90');
  assert.equal(r.itens[1].descricao, 'Compra no débito PADARIA PAO BOM');
  assert.equal(r.duvidas, 0);
});

test('fatura do cartão: compras viram saídas, pagamento vira entrada, ano deduzido e dólar ignorado', () => {
  novo();
  const linhas = [
    L(['Fatura do cartão de crédito', 40]), L(['Vencimento: 10/01/2027', 40]), L(['Total da fatura R$ 1.371,00', 40]),
    L(['15/12', 40], ['MERCADO LIVRE 3/6', 100], ['R$ 120,00', 460]),
    L(['28/12', 40], ['NETFLIX.COM', 100], ['US$ 10,00', 360], ['R$ 55,00', 460]),
    L(['02/01', 40], ['PAGAMENTO RECEBIDO', 100], ['-R$ 980,00', 460]),
    L(['03/01', 40], ['POSTO SHELL', 100], ['R$ 216,00', 460]),
  ];
  const r = lerPDF(linhas);
  assert.equal(r.cartao, true);
  assert.deepEqual(r.itens.map((i) => [i.data, i.valor, i.descricao]), [
    ['2026-12-15', -12000, 'MERCADO LIVRE 3/6'],
    ['2026-12-28', -5500, 'NETFLIX.COM US$ 10,00'.replace(' US$ 10,00', '')],
    ['2027-01-02', 98000, 'PAGAMENTO RECEBIDO'],
    ['2027-01-03', -21600, 'POSTO SHELL'],
  ]);
});

test('extrato que só marca as saídas: o que vem sem marca é entrada', () => {
  novo();
  const r = lerPDF([L(['01/10/2026', 40], ['PIX ENVIADO', 100], ['-50,00', 400]), L(['02/10/2026', 40], ['TED EMPRESA', 100], ['900,00', 400])]);
  assert.deepEqual(r.itens.map((i) => [i.valor, !!i.duvida]), [[-5000, false], [90000, false]]);
});

test('marcas D/C e sinal no fim; sem marca nenhuma, fica em dúvida', () => {
  novo();
  const linhas = [
    L(['10/10/2026', 40], ['COMPRA CARTAO DEBITO', 100], ['45,00 D', 400]),
    L(['11/10/2026', 40], ['DEPOSITO', 100], ['300,00 C', 400]),
    L(['12/10/2026', 40], ['APLICACAO', 100], ['500,00-', 400]),
    L(['13/10/2026', 40], ['PIX MARIA', 100], ['80,00', 400]),  // há marcas dos dois lados (D e C): sem marca, fica em dúvida
    L(['14/10/2026', 40], ['PIX RECEBIDO JOAO', 100], ['70,00', 400]),
  ];
  const r = lerPDF(linhas);
  assert.deepEqual(r.itens.map((i) => i.valor), [-4500, 30000, -50000, -8000, 7000]);
  assert.deepEqual(r.itens.map((i) => !!i.duvida), [false, false, false, true, true]);
  assert.equal(r.duvidas, 2);
});

test('PDF sem texto (escaneado) e PDF sem lançamentos dão mensagens claras', () => {
  novo();
  assert.throws(() => lerPDF([L(['  ', 10])]), /imagem/);
  novo();
  assert.throws(() => lerPDF([L(['Informe de rendimentos do ano-calendário 2025', 40]), L(['Nada a declarar neste período', 40])]), /Não encontrei lançamentos/);
});
