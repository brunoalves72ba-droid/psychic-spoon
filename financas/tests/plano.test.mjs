import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reconhecer, interpretarFrase, sugestoesPlano, grupoDaCategoria } from '../js/core/plano.js';
import { estadoVazio, normalizar } from '../js/core/calc.js';

const L = (id, tipo, valor, data, categoria, descricao, extra = {}) => ({ id, tipo, valor, data, categoria, descricao, pagamento: 'Pix', ...extra });

test('reconhecer: palavra conhecida vai para a conta padrão e sugere a específica', () => {
  const e = estadoVazio();
  const r = reconhecer('SMART FIT MENSALIDADE', 'despesa', e);
  assert.deepEqual([r.categoria, r.fonte, r.sugerida], ['saude', 'palavra', 'academia']);
  e.categorias.push({ id: 'academia', nome: 'Academia e esporte', tipo: 'despesa', grupo: 'saude' });
  assert.equal(reconhecer('SMART FIT MENSALIDADE', 'despesa', e).categoria, 'academia');
  assert.equal(reconhecer('Uber Eats pedido', 'despesa', e).categoria, 'restaurante'); // delivery, não transporte
  assert.equal(reconhecer('PIX ENVIADO UBER DO BRASIL', 'despesa', e).categoria, 'transporte');
  assert.equal(reconhecer('Mercado Livre', 'despesa', e).categoria, 'compras');
  assert.equal(reconhecer('Supermercado Bom Preço', 'despesa', e).categoria, 'mercado');
  assert.equal(reconhecer('Moradia extremo sul', 'despesa', e).categoria, 'outros'); // "trem"/"mora" não podem casar dentro de palavras
  assert.equal(reconhecer('Pagamento sexta-feira', 'despesa', e).categoria, 'outros');
  assert.equal(reconhecer('Rendimento da conta', 'receita', e).categoria, 'extra');
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
    e.lancamentos.push(L('sf' + i, 'despesa', 11990, m + '-05', 'saude', 'SMART FIT'));
    e.lancamentos.push(L('nf' + i, 'despesa', 5590, m + '-12', 'assinaturas', 'NETFLIX.COM'));
    e.lancamentos.push(L('dz' + i, 'despesa', 15000, m + '-08', 'outros', 'PIX JOANA SILVA'));
    e.lancamentos.push(L('mk' + i, 'despesa', 20000 + i * 9000, m + '-09', 'mercado', 'ASSAI ATACADISTA'));
  });
  const s = sugestoesPlano(e, '2026-11-14');
  assert.deepEqual(s.criar.map((x) => [x.conta.id, x.lancamentos.length]), [['academia', 3], ['streaming', 3]]);
  assert.deepEqual(s.classificar.map((x) => [x.descricao, x.lancamentos.length]), [['PIX JOANA SILVA', 3]]);
  // Assaí varia de valor: não é conta fixa
  assert.deepEqual(s.fixas.map((x) => [x.descricao, x.dia]).sort(), [['NETFLIX.COM', 12], ['PIX JOANA SILVA', 8], ['SMART FIT', 5]]);
  e.dispensadas.push('criar:academia', 'fixa:smart fit');
  const s2 = sugestoesPlano(e, '2026-11-14');
  assert.deepEqual(s2.criar.map((x) => x.conta.id), ['streaming']);
  assert.ok(!s2.fixas.some((x) => x.descricao === 'SMART FIT'));
});

test('categorias antigas ganham grupo ao carregar', () => {
  const e = normalizar({ lancamentos: [], categorias: [{ id: 'mercado', nome: 'Mercado', tipo: 'despesa' }, { id: 'zz', nome: 'Pet', tipo: 'despesa' }, { id: 'yy', nome: 'Bico', tipo: 'receita' }] });
  assert.deepEqual(e.categorias.map((c) => c.grupo), ['alimentacao', 'outros', 'receitas']);
  assert.equal(grupoDaCategoria({ id: 'farmacia' }), 'saude');
});
