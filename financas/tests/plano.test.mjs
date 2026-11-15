import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reconhecer, interpretarFrase, sugestoesPlano, grupoDaCategoria } from '../js/core/plano.js';
import { estadoVazio, normalizar, resumo } from '../js/core/calc.js';

const L = (id, tipo, valor, data, categoria, descricao, extra = {}) => ({ id, tipo, valor, data, categoria, descricao, pagamento: 'Pix', ...extra });

test('reconhecer: palavra conhecida vai para a conta do plano pessoal', () => {
  const e = estadoVazio();
  const c = (d, t = 'despesa') => reconhecer(d, t, e).categoria;
  assert.equal(c('SMART FIT MENSALIDADE'), 'academia');
  assert.equal(c('Uber Eats pedido'), 'restaurante'); // delivery (não criada) cai na conta-mãe, não em transporte
  assert.equal(reconhecer('Uber Eats pedido', 'despesa', e).sugerida, 'delivery');
  assert.equal(c('PIX ENVIADO UBER DO BRASIL'), 'app-transporte');
  assert.equal(c('Mercado Livre'), 'compras');
  assert.equal(c('Supermercado Bom Preço'), 'mercado');
  assert.equal(c('Moradia extremo sul'), 'outros'); // "trem"/"mora" não podem casar dentro de palavras
  assert.equal(c('Pagamento sexta-feira'), 'outros');
  assert.equal(c('Rendimento da conta', 'receita'), 'rendimentos');
  assert.equal(c('DIARISTA MARIA'), 'folha-domestica');
  assert.equal(c('DAE eSocial novembro'), 'dae');
  assert.equal(c('IPTU 2026 parcela 3'), 'iptu');
  assert.equal(c('DEPOSITO DE MATERIAL DE CONSTRUCAO SAO JOSE'), 'ref-alvenaria');
  assert.equal(c('Telha colonial'), 'ref-teto');
  assert.equal(c('PORTO SEGURO AUTO'), 'seguros');
  assert.equal(c('Seguro de vida Prudential'), 'seguro-vida');
  assert.equal(c('Aplicação CDB'), 'invest-auto');
});

test('reconhecer: o que você ensinou e o histórico vêm antes das palavras', () => {
  const e = estadoVazio();
  e.regras['despesa:padaria do ze'] = 'mercado';
  assert.deepEqual([reconhecer('Padaria do Zé', 'despesa', e).categoria, reconhecer('Padaria do Zé', 'despesa', e).fonte], ['mercado', 'regra']);
  e.lancamentos.push(L('a', 'despesa', 100, '2026-11-01', 'lazer', 'Posto do Zé 12'));
  assert.deepEqual([reconhecer('Posto do Zé 99', 'despesa', e).categoria, reconhecer('Posto do Zé 99', 'despesa', e).fonte], ['lazer', 'historico']);
  e.categorias.push({ id: 'x1', nome: 'Diarista', tipo: 'despesa', grupo: 'moradia' });
  assert.deepEqual([reconhecer('Pix para diarista Maria', 'despesa', e).categoria, reconhecer('Pix para diarista Maria', 'despesa', e).fonte], ['x1', 'nome']);
});

test('lançamento rápido entende frases do dia a dia', () => {
  const H = '2026-11-14'; // sábado
  assert.deepEqual(interpretarFrase('uber 23,50 ontem no pix', H), { tipo: 'despesa', data: '2026-11-13', pagamento: 'Pix', valor: 2350, descricao: 'Uber' });
  assert.deepEqual(interpretarFrase('gastei 45,90 no mercado no débito', H), { tipo: 'despesa', pagamento: 'Débito', valor: 4590, descricao: 'Mercado' });
  assert.deepEqual(interpretarFrase('recebi salário 5.200', H), { tipo: 'receita', valor: 520000, descricao: 'Salário' });
  assert.deepEqual(interpretarFrase('farmácia R$ 32 dia 10', H), { tipo: 'despesa', data: '2026-11-10', valor: 3200, descricao: 'Farmácia' });
  assert.deepEqual(interpretarFrase('ifood 59.9 sexta cartão', H), { tipo: 'despesa', data: '2026-11-13', pagamento: 'Crédito', valor: 5990, descricao: 'Ifood' });
  assert.deepEqual(interpretarFrase('aluguel 1,5 mil 05/11', H), { tipo: 'despesa', data: '2026-11-05', valor: 150000, descricao: 'Aluguel' });
  assert.equal(interpretarFrase('netflix 55,90 dia 20', H).data, '2026-10-20'); // dia 20 ainda não chegou: mês passado
  assert.deepEqual(interpretarFrase('', H), {});
});

test('sugestões: criar conta, classificar descrição e virar conta fixa', () => {
  const e = estadoVazio();
  const meses = ['2026-09', '2026-10', '2026-11'];
  meses.forEach((m, i) => {
    e.lancamentos.push(L('sf' + i, 'despesa', 11990, m + '-05', 'compras', 'PETZ RACAO'));
    e.lancamentos.push(L('nf' + i, 'despesa', 5590, m + '-12', 'restaurante', 'IFOOD'));
    e.lancamentos.push(L('dz' + i, 'despesa', 15000, m + '-08', 'outros', 'PIX JOANA SILVA'));
    e.lancamentos.push(L('mk' + i, 'despesa', 20000 + i * 9000, m + '-09', 'mercado', 'ASSAI ATACADISTA'));
  });
  const s = sugestoesPlano(e, '2026-11-14');
  assert.deepEqual(s.criar.map((x) => [x.conta.id, x.lancamentos.length]), [['pets', 3], ['delivery', 3]]);
  assert.deepEqual(s.classificar.map((x) => [x.descricao, x.lancamentos.length]), [['PIX JOANA SILVA', 3]]);
  // Assaí varia de valor: não é conta fixa
  assert.deepEqual(s.fixas.map((x) => [x.descricao, x.dia]).sort(), [['IFOOD', 12], ['PETZ RACAO', 5], ['PIX JOANA SILVA', 8]]);
  e.dispensadas.push('criar:pets', 'fixa:petz racao');
  const s2 = sugestoesPlano(e, '2026-11-14');
  assert.deepEqual(s2.criar.map((x) => x.conta.id), ['delivery']);
  assert.ok(!s2.fixas.some((x) => x.descricao === 'PETZ RACAO'));
});

test('backup antigo é atualizado para o plano pessoal sem perder o que a pessoa mudou', () => {
  const e = normalizar({ lancamentos: [], categorias: [
    { id: 'casa', nome: 'Moradia', tipo: 'despesa' }, // nome antigo padrão: vira "Aluguel"
    { id: 'saude', nome: 'Saúde da família', tipo: 'despesa' }, // renomeada pela pessoa: fica
    { id: 'zz', nome: 'Pet', tipo: 'despesa' }, { id: 'yy', nome: 'Bico', tipo: 'receita' },
  ] });
  const c = (id) => e.categorias.find((x) => x.id === id);
  assert.deepEqual([c('casa').nome, c('casa').grupo], ['Aluguel', 'moradia']);
  assert.deepEqual([c('saude').nome, c('saude').grupo], ['Saúde da família', 'saude']);
  assert.deepEqual([c('zz').grupo, c('yy').grupo], ['outros', 'receitas']);
  for (const id of ['iptu', 'dae', 'ref-teto', 'fatura-cartao', 'invest-auto']) assert.ok(c(id), id);
  assert.equal(e.planoVersao, 3);
  assert.equal(grupoDaCategoria({ id: 'farmacia' }), 'saude');
});

test('transferências e aplicações não entram nos totais', () => {
  const r = resumo([
    L('a', 'despesa', 10000, '2026-11-01', 'mercado', 'Mercado'),
    L('b', 'despesa', 180000, '2026-11-05', 'fatura-cartao', 'Pagamento fatura'),
    L('c', 'despesa', 50000, '2026-11-06', 'invest-auto', 'CDB'),
    L('d', 'receita', 30000, '2026-11-07', 'resgate', 'Resgate'),
    L('e', 'receita', 500000, '2026-11-05', 'salario', 'Salário'),
  ]);
  assert.deepEqual(r, { receitas: 500000, despesas: 10000, saldo: 490000 });
});

test('plano 3: Devoluções e Complemento de receita entram, e “Reembolsos e devoluções” vira “Reembolsos e cashback”', () => {
  const e = normalizar({ planoVersao: 2, lancamentos: [], categorias: [
    { id: 'reembolsos', nome: 'Reembolsos e devoluções', tipo: 'receita' },
    { id: 'salario', nome: 'Meu salário', tipo: 'receita' },
  ] });
  const c = (id) => e.categorias.find((x) => x.id === id);
  assert.equal(c('reembolsos').nome, 'Reembolsos e cashback');
  assert.equal(c('salario').nome, 'Meu salário');                 // renomeada pela pessoa: fica
  assert.deepEqual([c('devolucoes').nome, c('devolucoes').tipo, c('devolucoes').grupo], ['Devoluções', 'receita', 'receitas']);
  assert.deepEqual([c('complemento').nome, c('complemento').tipo, c('complemento').grupo], ['Complemento de receita', 'receita', 'receitas']);
  const est = { ...estadoVazio(), lancamentos: [], regras: {} };
  assert.equal(reconhecer('DEVOLUCAO COMPRA LOJA X', 'receita', est).categoria, 'devolucoes');
  assert.equal(reconhecer('Estorno Mercado Livre', 'receita', est).categoria, 'devolucoes');
  assert.equal(reconhecer('Complemento de renda', 'receita', est).categoria, 'complemento');
  assert.equal(reconhecer('Cashback Méliuz', 'receita', est).categoria, 'reembolsos');
  assert.equal(interpretarFrase('devolução 120 da loja ontem').tipo, 'receita');
  assert.equal(interpretarFrase('complemento 800').tipo, 'receita');
});

test('sugestões encontram entradas recorrentes, além dos gastos', () => {
  const ls = [];
  for (const [m, i] of [['2026-09', 1], ['2026-10', 2], ['2026-11', 3]]) {
    ls.push(L('s' + i, 'receita', 520000, m + '-05', 'salario', 'Salário Empresa X'));
    ls.push(L('n' + i, 'despesa', 4490, m + '-10', 'outros', 'Netflix'));
  }
  const sug = sugestoesPlano({ ...estadoVazio(), lancamentos: ls, recorrentes: [], regras: {} }, '2026-11-20').fixas;
  const porTipo = Object.fromEntries(sug.map((f) => [f.tipo, f]));
  assert.equal(porTipo.receita.descricao, 'Salário Empresa X');
  assert.equal(porTipo.receita.dia, 5);
  assert.equal(porTipo.despesa.descricao, 'Netflix');
  // já recorrente: não sugere de novo
  const comRec = sugestoesPlano({ ...estadoVazio(), lancamentos: ls, recorrentes: [{ id: 'r', tipo: 'receita', descricao: 'Salário Empresa X', valor: 520000, dia: 5, inicio: '2026-11', fim: null, gerados: [] }], regras: {} }, '2026-11-20').fixas;
  assert.deepEqual(comRec.map((f) => f.tipo), ['despesa']);
});
