import { test } from 'node:test';
import assert from 'node:assert/strict';
import { estadoVazio, normalizar, acerto, divisaoPelaRenda, daVisao, gerarRecorrentes, rateioDe, responsavel } from '../js/core/calc.js';
import { mesclar, paraNuvem } from '../js/core/mesclar.js';

const P = [{ id: 'bruno', nome: 'Bruno' }, { id: 'rita', nome: 'Rita' }];
const L = (id, dono, tipo, valor, categoria, extra = {}) => ({ id, dono, tipo, valor, data: '2026-11-10', categoria, descricao: id, ...extra });

test('acerto do mês pela divisão definida à mão', () => {
  const ls = [
    L('a', 'bruno', 'despesa', 200000, 'casa', { compartilhado: true }),   // aluguel pago pelo Bruno
    L('b', 'rita', 'despesa', 100000, 'mercado', { compartilhado: true }), // mercado pago pela Rita
    L('c', 'rita', 'despesa', 50000, 'beleza'),                              // pessoal: fora do acerto
    L('d', 'bruno', 'despesa', 180000, 'fatura-cartao', { compartilhado: true }), // transferência: fora
  ];
  const r = acerto(ls, P, { bruno: 60, rita: 40 });
  assert.equal(r.total, 300000);
  assert.deepEqual(r.pagou, { bruno: 200000, rita: 100000 });
  assert.deepEqual(r.deveria, { bruno: 180000, rita: 120000 });
  assert.deepEqual(r.transf, { de: 'rita', para: 'bruno', valor: 20000 });
  assert.equal(acerto(ls, P, { bruno: 66.67, rita: 33.33 }).transf, null); // diferença menor que R$ 1: nada a acertar
});

test('gasto compartilhado individual: só de quem lançou ou só do outro', () => {
  const ls = [
    L('a', 'bruno', 'despesa', 200000, 'casa', { compartilhado: true }),                       // dividido 60/40
    L('b', 'rita', 'despesa', 30000, 'farmacia', { compartilhado: true, rateio: 'meu' }),      // só da Rita, pago por ela: fora
    L('c', 'bruno', 'despesa', 15000, 'roupas', { compartilhado: true, rateio: 'outro' }),     // só da Rita, pago pelo Bruno
    L('d', 'rita', 'despesa', 8000, 'barbearia', { compartilhado: true, rateio: 'outro' }),    // só do Bruno, pago pela Rita
  ];
  const r = acerto(ls, P, { bruno: 60, rita: 40 });
  assert.equal(r.total, 200000);                                  // só os divididos
  assert.deepEqual(r.deveria, { bruno: 120000, rita: 80000 });
  assert.deepEqual(r.individual, { bruno: 8000, rita: 45000 });
  assert.deepEqual(r.reembolsos, [{ de: 'rita', para: 'bruno', valor: 15000 }, { de: 'bruno', para: 'rita', valor: 8000 }]);
  // Bruno: pagou 2.000 dos divididos e devia 1.200 (+800); Rita lhe deve 150; ele deve 80 à Rita → Rita transfere 870
  assert.deepEqual(r.transf, { de: 'rita', para: 'bruno', valor: 87000 });
  assert.equal(r.totalCompartilhado, 253000);
  assert.equal(rateioDe({}), 'dividir');
  assert.equal(responsavel(ls[1], P), 'rita');
  assert.equal(responsavel(ls[2], P), 'rita');
  assert.equal(responsavel(ls[3], P), 'bruno');
  assert.equal(responsavel(ls[0], P), null);
});

test('só individuais: acerto devolve exatamente o que um pagou pelo outro', () => {
  const r = acerto([L('x', 'bruno', 'despesa', 12345, 'roupas', { compartilhado: true, rateio: 'outro' })], P, { bruno: 50, rita: 50 });
  assert.equal(r.total, 0);
  assert.deepEqual(r.transf, { de: 'rita', para: 'bruno', valor: 12345 });
});

test('conta fixa compartilhada leva o rateio para os meses gerados', () => {
  const e = normalizar({ ...estadoVazio(), recorrentes: [{ id: 'r1', tipo: 'despesa', valor: 9000, dia: 5, categoria: 'academia', descricao: 'Academia', inicio: '2026-10', fim: null, gerados: [], dono: 'bruno', compartilhado: true, rateio: 'meu' }] });
  gerarRecorrentes(e, '2026-11-20');
  assert.deepEqual(e.lancamentos.map((l) => [l.data, l.rateio]), [['2026-10-05', 'meu'], ['2026-11-05', 'meu']]);
});

test('sugestão de divisão pela renda de cada um', () => {
  const s = divisaoPelaRenda([L('s1', 'bruno', 'receita', 600000, 'salario'), L('s2', 'rita', 'receita', 400000, 'salario'), L('r', 'rita', 'receita', 90000, 'resgate')], P);
  assert.deepEqual(s.pct, { bruno: 60, rita: 40 });
  assert.equal(divisaoPelaRenda([], P), null);
});

test('visões: minhas (privadas e compartilhadas) e casal (compartilhadas dos dois)', () => {
  const ls = [L('a', 'bruno', 'despesa', 1, 'x'), L('b', 'bruno', 'despesa', 1, 'x', { compartilhado: true }), L('c', 'rita', 'despesa', 1, 'x'), L('d', 'rita', 'despesa', 1, 'x', { compartilhado: true })];
  assert.deepEqual(daVisao(ls, 'eu', 'bruno').map((l) => l.id), ['a', 'b']);
  assert.deepEqual(daVisao(ls, 'casal', 'bruno').map((l) => l.id), ['b', 'd']);
});

test('sincronização: junta os dois celulares sem perder nem ressuscitar nada', () => {
  const bruno = normalizar({ lancamentos: [
    { ...L('a', 'bruno', 'despesa', 100, 'mercado'), _t: 10 },
    { ...L('x', 'bruno', 'despesa', 100, 'mercado'), _t: 10 },
  ], pendentes: [{ id: 'p', lido: {} }] });
  const rita = normalizar({ lancamentos: [
    { ...L('a', 'bruno', 'despesa', 999, 'mercado', { compartilhado: true }), _t: 20 }, // editado depois no outro celular
    { ...L('b', 'rita', 'despesa', 200, 'beleza'), _t: 15 },
  ], apagados: { x: 30 }, divisao: { _t: 50, bruno: 70, rita: 30 } });
  const m = mesclar(bruno, paraNuvem(rita));
  assert.deepEqual(m.lancamentos.map((l) => [l.id, l.valor]).sort(), [['a', 999], ['b', 200]]);
  assert.equal(m.divisao.bruno, 70);
  assert.deepEqual(m.pendentes, [{ id: 'p', lido: {} }]); // a caixa A confirmar é deste celular
  assert.equal('pendentes' in paraNuvem(bruno), false);
  // a mesma junção nos dois sentidos dá o mesmo resultado
  const m2 = mesclar(rita, paraNuvem(bruno));
  assert.deepEqual(m2.lancamentos.map((l) => [l.id, l.valor]).sort(), [['a', 999], ['b', 200]]);
});

test('conta fixa gerada nos dois celulares não duplica', () => {
  const base = () => { const e = estadoVazio(); e.recorrentes.push({ id: 'r1', tipo: 'despesa', valor: 150000, dia: 5, categoria: 'casa', descricao: 'Aluguel', inicio: '2026-11', fim: null, gerados: [], dono: 'bruno', compartilhado: true }); return e; };
  const a = base(), b = base();
  gerarRecorrentes(a, '2026-11-14'); gerarRecorrentes(b, '2026-11-14');
  const m = mesclar(a, paraNuvem(b));
  assert.equal(m.lancamentos.length, 1);
  assert.deepEqual([m.lancamentos[0].id, m.lancamentos[0].dono, m.lancamentos[0].compartilhado], ['rec-r1-2026-11', 'bruno', true]);
});
