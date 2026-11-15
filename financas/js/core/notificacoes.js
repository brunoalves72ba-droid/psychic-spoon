// Leitura de notificações de bancos e cartões (texto que o MacroDroid ou o "Compartilhar" entregam).
// Funções puras — testadas em tests/notificacoes.test.mjs com textos no formato de cada banco.
//
// Em vez de uma regra fechada por banco (que quebra quando o banco muda uma vírgula), o leitor
// procura as peças que todas as notificações têm: valor, tipo de operação, estabelecimento,
// final do cartão, data e parcelas. O nome do app (quando vem) só ajuda a dizer qual é o banco.
import { semAcento } from './plano.js';
import { hoje as hojeStr } from './datas.js';

const BANCOS = [
  [/nubank|\bnu\b|com\.nu\./, 'Nubank'], [/itau|itaú/, 'Itaú'], [/bradesco|bradescard/, 'Bradesco'],
  [/banco do brasil|\bbb\b|ourocard|br\.com\.bb/, 'Banco do Brasil'], [/caixa|cef\b/, 'Caixa'],
  [/santander/, 'Santander'], [/\binter\b|bancointer|br\.com\.intermedium/, 'Inter'], [/\bc6\b|c6 ?bank|c6bank/, 'C6'],
  [/picpay/, 'PicPay'], [/mercado ?pago|mercadopago/, 'Mercado Pago'], [/sicredi/, 'Sicredi'], [/sicoob/, 'Sicoob'],
  [/neon/, 'Neon'], [/next\b/, 'Next'], [/pagbank|pagseguro/, 'PagBank'], [/will ?bank/, 'Will Bank'], [/btg/, 'BTG'], [/xp\b/, 'XP'],
];

/** Notificações que NÃO são lançamento (vêm para a caixa como "ignoradas", com o motivo). */
const IGNORAR = [
  [/recusad|negad|nao aprovad|nao autorizad|nao foi aprovad|bloquead|insuficiente/, 'Compra recusada'],
  [/estorn|cancelad|devolvid|chargeback/, 'Estorno ou cancelamento'],
  [/pagamento (da |de )?fatura|fatura (paga|fechou|fechada|vence|disponivel|do cartao)|pgto fatura|sua fatura/, 'Fatura do cartão (as compras já entram uma a uma)'],
  [/codigo de (seguranca|verificacao|acesso)|\btoken\b|senha|\bcodigo\b.*\d{4,}/, 'Código de segurança'],
  [/saldo (disponivel|atual|em conta)|limite disponivel|seu limite/, 'Aviso de saldo ou limite'],
  [/agendad|agendamento/, 'Pagamento agendado (ainda não saiu)'],
  [/aplicacao|resgate|investimento|cdb|rdb|poupanca|caixinha|cofrinho/, 'Investimento ou transferência entre suas contas'],
];

const RECEITA = /voce recebeu|recebeu (um |uma )?(pix|transferencia|ted|doc|deposito)|pix recebido|transferencia recebida|deposito recebido|credito em conta|creditad|salario|caiu na (sua )?conta|recebimento/;
const VALOR = /(?:r\$|rs|brl)\s*-?\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})|\d+(?:,\d{2})|\d+(?:\.\d{2}))\b/i;

const lerNumero = (s) => {
  if (!s) return null;
  let t = s.trim();
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  const v = Math.round(parseFloat(t) * 100);
  return Number.isFinite(v) && v > 0 ? v : null;
};

function lerData(t, hoje) {
  const m = t.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (!m) return null;
  const [ha, hm] = hoje.split('-').map(Number);
  let a = m[3] ? (m[3].length === 2 ? 2000 + +m[3] : +m[3]) : ha;
  const mes = +m[2], dia = +m[1];
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
  if (!m[3] && (mes > hm + 1)) a -= 1; // "28/12" lido em janeiro é do ano anterior
  return `${a}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

// palavras que não podem ser nome de loja
const NAO_LOJA = /^(seu|sua|o|a|um|uma|cartao|credito|debito|conta|valor|compra|r\$|rs|\d|hoje|ontem|as\b|às\b|final|pix|loja|estabelecimento)\b/;
const FIM_LOJA = /\s*(?:,|;|!|\.(?=\s|$)|\s-\s|\bpara o\b|\bpara seu\b|\bno (?:seu |sua )?cart|\bcom (?:o )?(?:seu )?cart|\bcart[aã]o\b|\bvalor\b|\bno valor\b|\bR\$|\bRS\b|\bem \d|\bem \d{1,2}\/|\bàs\b|\bas \d|\bdia \d|\bfoi\b|\bparcelad|\baprovad|\bem (?:\d+|uma|duas|tres) ?(?:x|vezes|parcelas)|\b\d{1,2} ?x\b|\(|$)/i;

function limparLoja(s) {
  let x = String(s || '').replace(/\s+/g, ' ').trim();
  x = x.replace(/[.,;:!]+$/, '').replace(/^(?:o |a |no |na |em )/i, '').replace(/[*]+/g, ' ').replace(/\s+/g, ' ').trim();
  x = x.replace(/\s+(?:sao paulo|rio de janeiro|belo horizonte|curitiba|porto alegre|salvador|recife|fortaleza|brasilia|campinas|bra|br|sp|rj|mg)$/i, '').trim();
  if (x.length < 2 || NAO_LOJA.test(semAcento(x))) return '';
  return x.slice(0, 60);
}

/** Procura o nome do estabelecimento (ou da pessoa, em Pix) no texto. */
function lerLoja(t, receita) {
  const tentativas = [];
  const depois = (re) => { for (const m of t.matchAll(re)) { const resto = t.slice(m.index + m[0].length); const f = resto.search(FIM_LOJA); tentativas.push(resto.slice(0, f < 0 ? undefined : f)); } };
  if (receita) depois(/\b(?:de|do|da)\s+(?=[A-ZÀ-Ú0-9])/g);
  depois(/\b(?:estabelecimento|loja|local)\s*:?\s+/gi);
  depois(/\b(?:para|a)\s+(?=[A-ZÀ-Ú0-9])/g); // "Pix enviado para FULANO", "Você pagou R$ 10 a LOJA"
  depois(/\b(?:em|no|na)\s+(?!\d{1,2}\/)(?!\d+ ?(?:x|vezes|parcelas))(?=[A-ZÀ-Ú0-9*])/g); // "em DROGASIL"
  // "Itaú: ... final 1234 - DROGASIL valor RS 89,90"
  for (const m of t.matchAll(/\s-\s+([^-]+?)(?=\s+valor\b|\s+R\$|,|$)/gi)) tentativas.push(m[1]);
  // "VALOR DE R$ 89,90 MERCADO X SAO PAULO." (Bradesco): o que vem logo depois do valor
  const v = t.match(VALOR);
  if (v) { const resto = t.slice(v.index + v[0].length).replace(/^\s*[,.;-]?\s*/, ''); if (/^[A-ZÀ-Ú0-9*]{2}/.test(resto)) { const f = resto.search(/\.(\s|$)|,|;|\bem \d|\bàs\b/); tentativas.push(resto.slice(0, f < 0 ? undefined : f)); } }
  // "..., em 15/11/26 às 10:02, LOJAS RENNER." (Santander): último trecho em maiúsculas depois da vírgula
  const fim = t.match(/,\s*([A-ZÀ-Ú0-9][A-ZÀ-Ú0-9 *&.'-]{2,})\.?\s*$/);
  if (fim) tentativas.push(fim[1]);
  for (const c of tentativas) { const l = limparLoja(c); if (l) return l; }
  return '';
}

/**
 * Lê o texto de uma notificação.
 * Devolve null se não houver valor em reais; senão
 * { tipo, valor, descricao, data, pagamento, cartao, parcelas, valorParcela, banco, ignorar }.
 */
export function lerNotificacao(texto, { app = '', titulo = '', hoje = hojeStr() } = {}) {
  const bruto = [titulo, texto].filter(Boolean).join(' — ').replace(/\s+/g, ' ').trim();
  if (!bruto) return null;
  const n = semAcento(bruto);
  const v = bruto.match(VALOR) || bruto.match(/\bvalor(?: de)?:?\s*(\d{1,3}(?:\.\d{3})*,\d{2})\b/i);
  if (!v) return null;

  const banco = (BANCOS.find(([re]) => re.test(semAcento(app))) || BANCOS.find(([re]) => re.test(n)) || [, ''])[1];
  const motivo = IGNORAR.find(([re]) => re.test(n))?.[1] || '';
  const receita = RECEITA.test(n) && !/compra|pagamento (de|do|efetuado|realizado)|voce pagou|pix enviado|transferencia enviada/.test(n);

  // parcelas: "em 3x de R$ 50,00", "3x R$ 50,00", "parcelado em 3 vezes", "(3 parcelas)"
  let parcelas = 1, valorParcela = null;
  const p1 = bruto.match(/\b(\d{1,2})\s?x\s?(?:de\s)?(?:R\$|RS)\s?(\d{1,3}(?:\.\d{3})*,\d{2})/i);
  const p2 = n.match(/\b(?:em|parcelad[oa] em)\s(\d{1,2})\s?(?:x\b|vezes|parcelas)|\((\d{1,2}) ?parcelas\)|\b(\d{1,2}) parcelas\b/);
  if (p1) { parcelas = +p1[1]; valorParcela = lerNumero(p1[2]); }
  else if (p2) parcelas = +(p2[1] || p2[2] || p2[3]);
  if (!(parcelas >= 1 && parcelas <= 48)) parcelas = 1;

  // valor: o primeiro valor que não é o da parcela; se só houver o da parcela, total = parcela × n
  const valores = [...bruto.matchAll(new RegExp(VALOR.source, 'gi'))].map((m) => ({ v: lerNumero(m[1]), i: m.index }));
  let valor = null;
  const pIdx = p1 ? p1.index : -1;
  const fora = valores.filter((x) => !(p1 && x.i > pIdx && x.i <= pIdx + p1[0].length));
  if (fora.length) valor = fora[0].v;
  else if (valorParcela) valor = valorParcela * parcelas;
  else valor = lerNumero(v[1]);
  if (parcelas > 1 && !valorParcela) valorParcela = Math.floor(valor / parcelas);
  if (!valor) return null;

  let pagamento = '';
  if (/\bpix\b/.test(n)) pagamento = 'Pix';
  else if (/boleto|pagamento de conta|conta paga/.test(n)) pagamento = 'Boleto';
  else if (/debito/.test(n) && !/debito automatico/.test(n)) pagamento = 'Débito';
  else if (/credito|cartao|compra aprovada|compra de r\$|compra no valor/.test(n)) pagamento = 'Crédito';
  else if (/\bted\b|\bdoc\b|transferencia/.test(n)) pagamento = 'Transferência';
  if (/debito automatico/.test(n)) pagamento = 'Débito';

  const cartao = (bruto.match(/\bfinal\s*(?:do cart[aã]o\s*)?(?:n[ºo°.]?\s*)?[*•.]*\s*(\d{4})\b/i) || bruto.match(/[*•]{2,}\s?(\d{4})\b/) || [])[1] || '';
  const descricao = lerLoja(bruto, receita) || (receita ? 'Entrada' : pagamento === 'Pix' ? 'Pix enviado' : 'Compra');

  return {
    tipo: receita ? 'receita' : 'despesa',
    valor, descricao,
    data: lerData(bruto, hoje) || hoje,
    pagamento: receita ? '' : pagamento || 'Crédito',
    cartao, parcelas, valorParcela: parcelas > 1 ? valorParcela : null,
    banco, ignorar: motivo,
  };
}

/** Chave para não registrar a mesma notificação duas vezes (o MacroDroid às vezes dispara repetido). */
export const chaveNotificacao = (texto) => semAcento(texto).replace(/\s+/g, ' ').trim().slice(0, 300);

/**
 * Divide uma compra parcelada em lançamentos mês a mês (decisão: cada parcela no seu mês).
 * A diferença de centavos fica na primeira parcela.
 */
export function dividirParcelas({ valor, parcelas, valorParcela, data, descricao }) {
  if (!(parcelas > 1)) return [{ valor, data, descricao, parcela: null }];
  const base = valorParcela && valorParcela * parcelas <= valor + parcelas ? valorParcela : Math.floor(valor / parcelas);
  const resto = valor - base * parcelas;
  const [a, m, d] = data.split('-').map(Number);
  return Array.from({ length: parcelas }, (_, i) => {
    const t = (m - 1) + i, ano = a + Math.floor(t / 12), mes = (t % 12) + 1;
    const ult = new Date(ano, mes, 0).getDate();
    return {
      valor: base + (i === 0 ? resto : 0),
      data: `${ano}-${String(mes).padStart(2, '0')}-${String(Math.min(d, ult)).padStart(2, '0')}`,
      descricao: `${descricao} (${i + 1}/${parcelas})`,
      parcela: { n: i + 1, de: parcelas },
    };
  });
}
