import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dados, receberNotificacao, confirmarPendente, pendentesAtivos, descartarPendente, nomeCartao, apelidarCartao } from '../js/core/store.js';
import { lerParametros } from '../js/views/receber.js';

test('endereço do MacroDroid: texto por último, com &, # e % dentro', () => {
  assert.deepEqual(lerParametros('app=Nubank&titulo=Compra%20aprovada&texto=Compra de R$ 10,00 em A&B LTDA #1 com 10% off'),
    { app: 'Nubank', titulo: 'Compra aprovada', texto: 'Compra de R$ 10,00 em A&B LTDA #1 com 10% off' });
  assert.deepEqual(lerParametros('?app=Ita%C3%BA&texto=Compra%20de%20R%24%205%2C00'), { app: 'Itaú', texto: 'Compra de R$ 5,00' });
  assert.deepEqual(lerParametros('titulo=x'), { titulo: 'x' });
});

test('caixa: recebe, não duplica, confirma parcelado mês a mês e aprende', () => {
  const t0 = Date.parse('2026-11-15T12:00:00');
  const txt = 'Compra aprovada no cartão final 1234: R$ 600,00 em 3x de R$ 200,00 em MAGAZINE LUIZA.';
  const r1 = receberNotificacao(txt, { app: 'Itaú', agora: t0 });
  assert.equal(r1.status, 'novo');
  assert.equal(receberNotificacao(txt, { app: 'Itaú', agora: t0 + 60_000 }).status, 'repetido');
  assert.equal(receberNotificacao('Seu código é 123456', { agora: t0 }).status, 'sem-valor');
  assert.equal(pendentesAtivos().length, 1);
  assert.equal(nomeCartao('1234'), 'Itaú •1234');
  apelidarCartao('1234', 'Itaú do Bruno');
  assert.equal(nomeCartao('1234'), 'Itaú do Bruno');

  const ids = confirmarPendente(r1.pendente.id, { categoria: 'compras', data: '2026-11-15' });
  assert.equal(ids.length, 3);
  const ls = dados().lancamentos.filter((l) => ids.includes(l.id));
  assert.deepEqual(ls.map((l) => [l.valor, l.data, l.descricao, l.cartao, l.pagamento]), [
    [20000, '2026-11-15', 'MAGAZINE LUIZA (1/3)', '1234', 'Crédito'],
    [20000, '2026-12-15', 'MAGAZINE LUIZA (2/3)', '1234', 'Crédito'],
    [20000, '2027-01-15', 'MAGAZINE LUIZA (3/3)', '1234', 'Crédito'],
  ]);
  assert.equal(pendentesAtivos().length, 0);

  // ignoradas não contam na caixa, mas ficam guardadas para conferência
  const r2 = receberNotificacao('Compra de R$ 99,00 RECUSADA em LOJA X.', { app: 'Nubank', agora: t0 });
  assert.equal(r2.pendente.lido.ignorar, 'Compra recusada');
  assert.equal(pendentesAtivos().length, 0);
  descartarPendente(r2.pendente.id);
  assert.equal(dados().pendentes.length, 0);

  // a correção de conta é lembrada para a próxima notificação da mesma loja
  const r3 = receberNotificacao('Compra de R$ 30,00 APROVADA em PADARIA DO ZE para o cartão com final 9999.', { app: 'Nubank', agora: t0 });
  confirmarPendente(r3.pendente.id, { categoria: 'mercado' });
  const r4 = receberNotificacao('Compra de R$ 12,00 APROVADA em PADARIA DO ZE para o cartão com final 9999.', { app: 'Nubank', agora: t0 + 3600_000 });
  assert.equal(r4.pendente.categoria, 'mercado');
});
