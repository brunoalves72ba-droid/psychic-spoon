import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { decodificar, lerExtrato, lerData, prepararImportacao, sugerirCategoria } from '../js/core/importar.js';
import { estadoVazio } from '../js/core/calc.js';

const ler = (n) => { const b = readFileSync(new URL('./exemplos/' + n, import.meta.url)); return lerExtrato(decodificar(b), n); };
const resumir = (itens) => itens.map((i) => [i.data, i.valor, i.descricao]);

test('OFX em Windows-1252 (Itaú)', () => {
  const r = ler('itau.ofx');
  assert.equal(r.formato, 'OFX');
  assert.equal(r.itens.length, 6);
  assert.deepEqual(resumir(r.itens).slice(0, 2), [['2026-11-05', 520000, 'PAGAMENTO DE SALÁRIO EMPRESA X'], ['2026-11-06', -45890, 'COMPRA CARTAO SUPERMERCADO BOM PREÇO']]);
  assert.equal(r.itens[0].idBanco, 'A001');
});

test('CSV da conta Nubank (vírgula e ponto decimal)', () => {
  const r = ler('nubank-conta.csv');
  assert.equal(r.cartao, false);
  assert.deepEqual(resumir(r.itens)[1], ['2026-11-08', -8990, 'Compra no débito - iFood']);
  assert.equal(r.itens[0].valor, 520000);
});

test('CSV da fatura Nubank: compra positiva vira saída', () => {
  const r = ler('nubank-fatura.csv');
  assert.equal(r.cartao, true);
  assert.deepEqual(resumir(r.itens)[0], ['2026-10-28', -14990, 'Amazon Marketplace']);
  assert.equal(r.itens.find((i) => i.descricao === 'Pagamento recebido').valor, 183055);
});

test('CSV com cabeçalho no meio, ponto e vírgula e colunas de crédito/débito', () => {
  const r = ler('banco-ponto-e-virgula.csv');
  assert.deepEqual(resumir(r.itens), [
    ['2026-11-03', 25000, 'PIX RECEBIDO JOAO'],
    ['2026-11-04', -9840, 'PAGAMENTO BOLETO SABESP'],
    ['2026-11-06', -123456, 'COMPRA DROGARIA SAO PAULO'],
    ['2026-11-06', -123456, 'COMPRA DROGARIA SAO PAULO'],
  ]);
});

test('datas em vários formatos', () => {
  assert.equal(lerData('5/1/26'), '2026-01-05');
  assert.equal(lerData('2026-11-03T10:00'), '2026-11-03');
  assert.equal(lerData('31.12.2025'), '2025-12-31');
  assert.equal(lerData('13/13/2026'), null);
});

test('categorias sugeridas por palavra e pelo que você já usou', () => {
  const e = estadoVazio();
  const cat = (descricao, valor = -100) => sugerirCategoria({ descricao, valor }, e);
  assert.equal(cat('Compra no débito - iFood'), 'restaurante');
  assert.equal(cat('PIX ENVIADO UBER DO BRASIL'), 'transporte');
  assert.equal(cat('DEB AUTOMATICO ENEL DISTRIBUICAO'), 'contas');
  assert.equal(cat('NETFLIX.COM'), 'assinaturas');
  assert.equal(cat('Drogasil'), 'saude');
  assert.equal(cat('PAGAMENTO DE SALÁRIO EMPRESA X', 100), 'salario');
  assert.equal(cat('Fatima Costureira'), 'outros'); // "tim" dentro de palavra não é a operadora
  e.lancamentos.push({ id: 'x', tipo: 'despesa', valor: 4500, data: '2026-10-01', categoria: 'lazer', descricao: 'Pix - Fulano de Tal 123' });
  assert.equal(cat('Transferência enviada pelo Pix - Fulano de Tal'), 'outros');
  assert.equal(cat('Pix - Fulano de Tal 456'), 'lazer');
  e.regras['despesa:compra cartao supermercado bom preco'] = 'compras';
  assert.equal(cat('COMPRA CARTAO SUPERMERCADO BOM PREÇO'), 'compras');
});

test('prévia: não duplica, reconhece lançamento manual e transferências', () => {
  const e = estadoVazio();
  const itens = ler('itau.ofx').itens;
  e.lancamentos.push({ id: 'm', tipo: 'despesa', valor: 3200, data: '2026-11-06', categoria: 'transporte', descricao: 'Uber' });
  const p1 = prepararImportacao(itens, e);
  const uber = p1.find((i) => i.descricao.includes('UBER'));
  assert.equal(uber.manual.id, 'm');
  assert.equal(uber.marcado, false);
  assert.equal(p1.find((i) => i.descricao.includes('FATURA')).marcado, false);
  assert.equal(p1.filter((i) => i.marcado).length, 4);
  // depois de importar, a mesma lista vem toda como "já importado"
  for (const i of p1.filter((x) => x.marcado)) e.lancamentos.push({ id: i.importId, tipo: i.tipo, valor: i.valor, data: i.data, categoria: i.categoria, descricao: i.descricao, importId: i.importId });
  const p2 = prepararImportacao(itens, e);
  assert.equal(p2.filter((i) => i.jaImportado).length, 4);
  assert.equal(p2.filter((i) => i.marcado).length, 0);
});

test('conta fixa lançada em outro dia do mês é reconhecida', () => {
  const e = estadoVazio();
  e.lancamentos.push({ id: 's', tipo: 'receita', valor: 520000, data: '2026-11-14', categoria: 'salario', descricao: 'Salário', recorrente: 'r1' });
  const p = prepararImportacao(ler('itau.ofx').itens, e);
  assert.equal(p.find((i) => i.valor === 520000).manual.id, 's');
});

test('duas compras iguais no mesmo dia continuam sendo duas', () => {
  const e = estadoVazio();
  const it = { data: '2026-11-06', valor: -1000, descricao: 'Café' };
  const p = prepararImportacao([it, { ...it }], e);
  assert.notEqual(p[0].importId, p[1].importId);
  assert.equal(p.filter((i) => i.marcado).length, 2);
});
