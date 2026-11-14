import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lerValor, digitosParaCentavos, reais, centavosParaCampo } from '../js/core/dinheiro.js';
import { somarMeses, dataNoMes, mesesEntre, nomeDia } from '../js/core/datas.js';
import { estadoVazio, normalizar, gerarRecorrentes, doMes, resumo, porCategoria, historico, previsao, orcamentos, filtrar, agruparPorDia, csv } from '../js/core/calc.js';

const L = (id, tipo, valor, data, categoria, extra = {}) => ({ id, tipo, valor, data, categoria, descricao: '', pagamento: 'Pix', ...extra });

test('dinheiro: leitura e formatação em reais', () => {
  assert.equal(lerValor('12,50'), 1250);
  assert.equal(lerValor('1.234,56'), 123456);
  assert.equal(lerValor('R$ 30'), 3000);
  assert.equal(lerValor('30.5'), 3050);
  assert.equal(lerValor('1.234'), 123400);
  assert.equal(lerValor('abc'), null);
  assert.equal(lerValor(''), null);
  assert.equal(digitosParaCentavos('R$ 0,012'), 12);
  assert.equal(digitosParaCentavos('123456'), 123456);
  assert.equal(reais(123456), 'R$ 1.234,56');
  assert.equal(centavosParaCampo(45000), '450,00');
});

test('datas: meses e dias', () => {
  assert.equal(somarMeses('2026-01', -1), '2025-12');
  assert.equal(somarMeses('2026-11', 3), '2027-02');
  assert.equal(dataNoMes('2026-02', 31), '2026-02-28');
  assert.equal(dataNoMes('2028-02', 31), '2028-02-29');
  assert.deepEqual(mesesEntre('2026-11', '2027-01'), ['2026-11', '2026-12', '2027-01']);
  assert.equal(nomeDia('2026-11-14', '2026-11-14'), 'Hoje');
  assert.equal(nomeDia('2026-11-13', '2026-11-14'), 'Ontem');
  assert.equal(nomeDia('2026-11-10', '2026-11-14'), 'terça, 10 de nov');
});

test('recorrentes: gera só o que venceu, uma vez por mês, e respeita o fim', () => {
  const e = estadoVazio();
  e.recorrentes.push({ id: 'r1', tipo: 'despesa', valor: 150000, dia: 31, categoria: 'casa', descricao: 'Aluguel', pagamento: 'Pix', inicio: '2026-09', fim: null, gerados: ['2026-09'] });
  assert.equal(gerarRecorrentes(e, '2026-11-14'), 1); // outubro (dia 31); novembro ainda não venceu
  assert.deepEqual(e.lancamentos.map((l) => l.data), ['2026-10-31']);
  assert.equal(gerarRecorrentes(e, '2026-11-14'), 0);
  assert.equal(gerarRecorrentes(e, '2026-11-30'), 1); // novembro tem 30 dias
  e.lancamentos = []; // apagar não faz voltar
  assert.equal(gerarRecorrentes(e, '2026-12-01'), 0);
  e.recorrentes[0].fim = '2026-12';
  assert.equal(gerarRecorrentes(e, '2027-03-31'), 1); // só dezembro
});

test('resumo, categorias e histórico', () => {
  const e = estadoVazio();
  e.lancamentos.push(
    L('a', 'receita', 500000, '2026-11-05', 'salario'),
    L('b', 'despesa', 30000, '2026-11-06', 'mercado'),
    L('c', 'despesa', 12000, '2026-11-07', 'mercado'),
    L('d', 'despesa', 80000, '2026-11-08', 'casa'),
    L('e', 'despesa', 99999, '2026-10-20', 'lazer'),
  );
  const nov = doMes(e, '2026-11');
  assert.deepEqual(resumo(nov), { receitas: 500000, despesas: 122000, saldo: 378000 });
  assert.deepEqual(porCategoria(nov).map((c) => [c.categoria, c.total, c.qtd]), [['casa', 80000, 1], ['mercado', 42000, 2]]);
  const h = historico(e, '2026-11', 3);
  assert.deepEqual(h.map((x) => x.mes), ['2026-09', '2026-10', '2026-11']);
  assert.equal(h[1].despesas, 99999);
});

test('previsão do mês corrente separa contas fixas do gasto do dia a dia', () => {
  const e = estadoVazio();
  e.recorrentes.push({ id: 'r', tipo: 'despesa', valor: 100000, dia: 20, categoria: 'casa', inicio: '2026-11', fim: null, gerados: [] });
  e.lancamentos.push(L('a', 'despesa', 30000, '2026-11-01', 'mercado'), L('b', 'despesa', 30000, '2026-11-10', 'mercado'));
  const p = previsao(e, '2026-11', '2026-11-10');
  assert.equal(p.mediaDia, 6000);
  assert.equal(p.diasRestantes, 20);
  assert.equal(p.fixasAVencer, 100000);
  assert.equal(p.gastoPrevisto, 6000 * 30 + 100000);
  assert.equal(previsao(e, '2026-10', '2026-11-10'), null);
});

test('orçamentos: ok, atenção e estourou', () => {
  const e = estadoVazio();
  e.orcamentos = { mercado: 100000, lazer: 10000, casa: 50000, saude: 0 };
  e.lancamentos.push(L('a', 'despesa', 85000, '2026-11-02', 'mercado'), L('b', 'despesa', 15000, '2026-11-02', 'lazer'), L('c', 'despesa', 1000, '2026-11-02', 'casa'));
  const o = Object.fromEntries(orcamentos(e, '2026-11').map((x) => [x.categoria, x.status]));
  assert.deepEqual(o, { lazer: 'estourou', mercado: 'atencao', casa: 'ok' });
});

test('filtro do extrato ignora acentos e aceita valor', () => {
  const ls = [L('a', 'despesa', 5000, '2026-11-01', 'saude', { descricao: 'Farmácia' }), L('b', 'despesa', 1250, '2026-11-02', 'mercado', { descricao: 'Pão' })];
  assert.deepEqual(filtrar(ls, { texto: 'farmacia' }).map((l) => l.id), ['a']);
  assert.deepEqual(filtrar(ls, { texto: '12,50' }).map((l) => l.id), ['b']);
  assert.deepEqual(filtrar(ls, { categoria: 'mercado' }).map((l) => l.id), ['b']);
  const g = agruparPorDia([...ls, L('c', 'receita', 10000, '2026-11-02', 'extra')]);
  assert.deepEqual(g.map((x) => [x.data, x.itens.length, x.saldo]), [['2026-11-02', 2, 8750], ['2026-11-01', 1, -5000]]);
});

test('CSV no formato brasileiro', () => {
  const s = csv([L('a', 'despesa', 123456, '2026-11-03', 'mercado', { descricao: 'Compra; mês' })], () => 'Mercado');
  assert.ok(s.startsWith('﻿Data;Tipo'));
  assert.ok(s.includes('03/11/2026;Saída;Mercado;"Compra; mês";Pix;-1234,56'));
});

test('normalizar recusa arquivo estranho e limpa itens inválidos', () => {
  assert.throws(() => normalizar({ foo: 1 }));
  const e = normalizar({ lancamentos: [L('a', 'despesa', 100, '2026-11-01', 'x'), { id: 'b', valor: -3 }] });
  assert.equal(e.lancamentos.length, 1);
  assert.ok(e.categorias.length > 5);
});
