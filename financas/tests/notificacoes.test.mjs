import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lerNotificacao, dividirParcelas } from '../js/core/notificacoes.js';

const H = '2026-11-15';
const ler = (texto, app = '') => lerNotificacao(texto, { app, hoje: H });
const resumo = (r) => r && [r.tipo, r.valor, r.descricao, r.pagamento, r.cartao, r.data, r.banco, r.ignorar];

// Textos no formato que cada banco costuma mandar (os bancos mudam detalhes de tempos em tempos).
test('compras no crédito de bancos tradicionais', () => {
  assert.deepEqual(resumo(ler('Compra aprovada no seu cartão final 1234 de R$ 89,90 em 15/11 às 14:32, em DROGASIL.', 'Itaú')),
    ['despesa', 8990, 'DROGASIL', 'Crédito', '1234', '2026-11-15', 'Itaú', '']);
  assert.deepEqual(resumo(ler('Itaú: Compra aprovada ITAU VISA final 1234 - PADARIA PAO QUENTE valor RS 23,50 em 14/11, as 08h12.')),
    ['despesa', 2350, 'PADARIA PAO QUENTE', 'Crédito', '1234', '2026-11-14', 'Itaú', '']);
  assert.deepEqual(resumo(ler('BRADESCO CARTOES: COMPRA APROVADA NO CARTAO FINAL 5678 EM 13/11/2026 19:05. VALOR DE R$ 152,30 SUPERMERCADO BOM DIA SAO PAULO.')),
    ['despesa', 15230, 'SUPERMERCADO BOM DIA', 'Crédito', '5678', '2026-11-13', 'Bradesco', '']);
  assert.deepEqual(resumo(ler('BB: Compra no crédito de R$ 45,00 em POSTO SHELL, cartão final 4321, em 12/11 18:40.', 'Banco do Brasil')),
    ['despesa', 4500, 'POSTO SHELL', 'Crédito', '4321', '2026-11-12', 'Banco do Brasil', '']);
  assert.deepEqual(resumo(ler('CAIXA: Compra aprovada em RESTAURANTE SABOR R$ 67,80 15/11 às 12:30 cartão final 9988.')),
    ['despesa', 6780, 'RESTAURANTE SABOR', 'Crédito', '9988', '2026-11-15', 'Caixa', '']);
  assert.deepEqual(resumo(ler('Santander: Compra aprovada no cartão final 1111, valor R$ 210,00, em 15/11/26 às 10:02, LOJAS RENNER.')),
    ['despesa', 21000, 'LOJAS RENNER', 'Crédito', '1111', '2026-11-15', 'Santander', '']);
});

test('compras de bancos digitais', () => {
  assert.deepEqual(resumo(ler('Compra de R$ 45,90 APROVADA em IFOOD *RESTAURANTE para o cartão com final 1234.', 'Nubank')),
    ['despesa', 4590, 'IFOOD RESTAURANTE', 'Crédito', '1234', H, 'Nubank', '']);
  assert.deepEqual(resumo(ler('Compra aprovada! Você comprou R$ 89,90 em DROGASIL no cartão de crédito final 2222.', 'Inter')),
    ['despesa', 8990, 'DROGASIL', 'Crédito', '2222', H, 'Inter', '']);
  assert.deepEqual(resumo(ler('Compra aprovada no seu cartão C6 final 3333 no valor de R$ 32,00 em UBER *TRIP.', 'C6 Bank')),
    ['despesa', 3200, 'UBER TRIP', 'Crédito', '3333', H, 'C6', '']);
  assert.deepEqual(resumo(ler('Pagamento de R$ 18,00 aprovado em PADARIA CENTRAL', 'PicPay')),
    ['despesa', 1800, 'PADARIA CENTRAL', 'Crédito', '', H, 'PicPay', '']);
  assert.deepEqual(resumo(ler('Você pagou R$ 59,90 a NETFLIX.COM', 'Mercado Pago')),
    ['despesa', 5990, 'NETFLIX.COM', 'Crédito', '', H, 'Mercado Pago', '']);
});

test('débito, Pix e boleto', () => {
  assert.deepEqual(resumo(ler('Compra no débito aprovada: R$ 12,50 em CAFE DO PONTO.', 'Nubank')),
    ['despesa', 1250, 'CAFE DO PONTO', 'Débito', '', H, 'Nubank', '']);
  assert.deepEqual(resumo(ler('Pix enviado: R$ 150,00 para JOANA SILVA.', 'Itaú')),
    ['despesa', 15000, 'JOANA SILVA', 'Pix', '', H, 'Itaú', '']);
  assert.deepEqual(resumo(ler('Você recebeu um Pix de R$ 250,00 de MARCOS SOUZA.', 'Nubank')),
    ['receita', 25000, 'MARCOS SOUZA', '', '', H, 'Nubank', '']);
  assert.deepEqual(resumo(ler('Pagamento de boleto realizado: R$ 189,90 ENEL DISTRIBUICAO.', 'Bradesco')),
    ['despesa', 18990, 'ENEL DISTRIBUICAO', 'Boleto', '', H, 'Bradesco', '']);
});

test('compras parceladas', () => {
  const a = ler('Compra aprovada no cartão final 1234: R$ 600,00 em 3x de R$ 200,00 em MAGAZINE LUIZA.', 'Itaú');
  assert.deepEqual([a.valor, a.parcelas, a.valorParcela, a.descricao], [60000, 3, 20000, 'MAGAZINE LUIZA']);
  const b = ler('Compra de R$ 1.200,00 APROVADA em KABUM parcelada em 10 vezes, cartão final 1234.', 'Nubank');
  assert.deepEqual([b.valor, b.parcelas, b.valorParcela, b.descricao], [120000, 10, 12000, 'KABUM']);
  const c = ler('Compra aprovada: 4x R$ 25,00 em CENTAURO, cartão final 9999.', 'Santander');
  assert.deepEqual([c.valor, c.parcelas, c.valorParcela, c.descricao], [10000, 4, 2500, 'CENTAURO']);
});

test('o que não é lançamento fica marcado para ignorar', () => {
  assert.equal(ler('Compra de R$ 300,00 RECUSADA em LOJA X. Saldo insuficiente.', 'Nubank').ignorar, 'Compra recusada');
  assert.equal(ler('Estorno de R$ 45,90 de IFOOD no cartão final 1234.', 'Nubank').ignorar, 'Estorno ou cancelamento');
  assert.equal(ler('Pagamento da fatura de R$ 1.830,55 recebido.', 'Nubank').ignorar, 'Fatura do cartão (as compras já entram uma a uma)');
  assert.equal(ler('Sua fatura fechou: R$ 2.100,00. Vence em 20/11.', 'Itaú').ignorar, 'Fatura do cartão (as compras já entram uma a uma)');
  assert.equal(ler('Aplicação de R$ 500,00 na Caixinha realizada.', 'Nubank').ignorar, 'Investimento ou transferência entre suas contas');
  assert.equal(ler('Seu código de segurança é 482913. Não compartilhe.', 'Itaú'), null); // sem valor: nem entra
  assert.equal(ler('Promoção! Ganhe 10% de cashback.', 'Inter'), null);
});

test('parcelas viram um lançamento por mês, com os centavos na primeira', () => {
  const p = dividirParcelas({ valor: 10000, parcelas: 3, valorParcela: null, data: '2026-11-30', descricao: 'TV' });
  assert.deepEqual(p.map((x) => [x.valor, x.data, x.descricao]), [
    [3334, '2026-11-30', 'TV (1/3)'], [3333, '2026-12-30', 'TV (2/3)'], [3333, '2027-01-30', 'TV (3/3)'],
  ]);
  assert.equal(dividirParcelas({ valor: 30000, parcelas: 2, valorParcela: 15000, data: '2027-01-31', descricao: 'X' })[1].data, '2027-02-28');
  assert.deepEqual(dividirParcelas({ valor: 500, parcelas: 1, data: H, descricao: 'Y' }).map((x) => x.valor), [500]);
});

test('cartão-benefício: compra no Ticket Refeição/Alimentação e crédito do benefício', () => {
  const a = lerNotificacao('Compra aprovada de R$ 38,90 em RESTAURANTE BOM PRATO com seu Alelo Refeição.', { app: 'Alelo', hoje: H });
  assert.deepEqual([a.tipo, a.valor, a.pagamento, a.banco], ['despesa', 3890, 'Ticket Refeição', 'Alelo']);
  const b = lerNotificacao('Você fez uma compra de R$ 152,30 em SUPERMERCADO DIA no cartão Ticket Alimentação.', { app: 'Ticket', hoje: H });
  assert.deepEqual([b.tipo, b.valor, b.pagamento], ['despesa', 15230, 'Ticket Alimentação']);
  const c = lerNotificacao('O crédito do seu benefício foi realizado: R$ 800,00 disponível no seu Pluxee Alimentação.', { app: 'Pluxee', hoje: H });
  assert.deepEqual([c.tipo, c.valor, c.descricao], ['receita', 80000, 'Crédito Ticket Alimentação']);
  // banco comum continua igual
  const d = lerNotificacao('Compra aprovada no cartão final 1234 de R$ 89,90 em DROGASIL', { app: 'Nubank', hoje: H });
  assert.equal(d.pagamento, 'Crédito');
});
