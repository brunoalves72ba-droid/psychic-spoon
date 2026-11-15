// Cálculos puros sobre o estado do app (sem tela, sem armazenamento) — testados em tests/calc.test.mjs.
import { GRUPO_PADRAO, grupoDaCategoria, CONTAS, NEUTRAS } from './plano.js';
import { mesDe, mesesEntre, somarMeses, dataNoMes, diasNoMes, hoje as hojeStr } from './datas.js';

export const PAGAMENTOS = ['Pix', 'Débito', 'Crédito', 'Dinheiro', 'Boleto', 'Transferência'];

/** Contas que já vêm no app: as do plano de contas pessoal marcadas como padrão. */
export const CATEGORIAS_PADRAO = CONTAS.filter((c) => c.padrao).map(({ id, nome, tipo, grupo }) => ({ id, nome, tipo, grupo }));
export const VERSAO_PLANO = 2;

// nomes que as contas tinham antes do plano pessoal: só são trocados se você não os renomeou
const NOMES_ANTIGOS = {
  casa: 'Moradia', salario: 'Salário', transporte: 'Transporte', saude: 'Saúde', lazer: 'Lazer', compras: 'Compras',
  assinaturas: 'Assinaturas', outros: 'Outros gastos', educacao: 'Educação', impostos: 'Impostos', internet: 'Internet e celular',
  consultas: 'Consultas e exames', carro: 'Carro (manutenção, IPVA, seguro)', 'app-transporte': 'Uber e táxi', reembolsos: 'Reembolsos e cashback',
  cursos: 'Cursos', vestuario: 'Roupas e calçados', eletronicos: 'Eletrônicos', apps: 'Apps e nuvem', emprestimos: 'Empréstimos e parcelas',
};

export const estadoVazio = () => ({
  versao: 1,
  planoVersao: VERSAO_PLANO,
  categorias: CATEGORIAS_PADRAO.map((c) => ({ ...c })),
  lancamentos: [],
  recorrentes: [],
  orcamentos: {}, // metas por escopo: { bruno: { _t, cats: { mercado: 50000 } }, rita: {...}, casal: {...} }
  pessoas: [{ id: 'bruno', nome: 'Bruno' }, { id: 'rita', nome: 'Rita' }],
  divisao: { _t: 0, bruno: 50, rita: 50 }, // % de cada um nas contas compartilhadas (definido à mão)
  acertos: {}, // mês → { _t, valor, de, para, quando }
  compartilharSempre: {}, // pessoa → { _t, cats: { casa: true } }
  aparelhos: {}, // celulares conectados: id → { _t, pessoa, modelo, ult }
  apagados: {}, // lápides para a sincronização: id → quando foi apagado
  regras: {}, // descrição do banco → categoria escolhida por você
  dispensadas: [], // sugestões do plano de contas que você recusou
  pendentes: [], // caixa "A confirmar": notificações lidas aguardando confirmação
  cartoes: {}, // final do cartão → { apelido, banco }
  notifVistas: [], // últimas notificações recebidas, para não duplicar
});

export const novoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

/** Confere e completa um estado vindo do armazenamento ou de um backup. Lança erro se não for do app. */
export function normalizar(bruto) {
  if (!bruto || typeof bruto !== 'object' || !Array.isArray(bruto.lancamentos)) throw new Error('Arquivo não é um backup do Finanças.');
  const e = estadoVazio();
  if (Array.isArray(bruto.categorias) && bruto.categorias.length) e.categorias = bruto.categorias.filter((c) => c && c.id && c.nome && (c.tipo === 'despesa' || c.tipo === 'receita'));
  if ((bruto.planoVersao || 1) < VERSAO_PLANO && Array.isArray(bruto.categorias) && bruto.categorias.length) {
    // atualização para o plano de contas pessoal: entram as contas novas, os nomes antigos
    // não renomeados ganham o nome novo e cada conta vai para o grupo do plano
    const modelo = Object.fromEntries(CONTAS.map((c) => [c.id, c]));
    e.categorias = e.categorias.map((c) => modelo[c.id]
      ? { ...c, grupo: modelo[c.id].grupo, nome: c.nome === NOMES_ANTIGOS[c.id] ? modelo[c.id].nome : c.nome }
      : c);
    for (const c of CATEGORIAS_PADRAO) if (!e.categorias.some((x) => x.id === c.id)) e.categorias.push({ ...c });
  }
  e.planoVersao = VERSAO_PLANO;
  e.categorias = e.categorias.map((c) => ({ ...c, grupo: c.grupo || grupoDaCategoria(c) }));
  e.lancamentos = bruto.lancamentos.filter((l) => l && l.id && Number.isInteger(l.valor) && l.valor > 0 && /^\d{4}-\d{2}-\d{2}$/.test(l.data) && (l.tipo === 'despesa' || l.tipo === 'receita'));
  e.recorrentes = (bruto.recorrentes || []).filter((r) => r && r.id && Number.isInteger(r.valor) && /^\d{4}-\d{2}$/.test(r.inicio)).map((r) => ({ gerados: [], fim: null, ...r }));
  e.pendentes = Array.isArray(bruto.pendentes) ? bruto.pendentes.filter((p) => p && p.id && p.lido) : [];
  e.cartoes = bruto.cartoes && typeof bruto.cartoes === 'object' ? { ...bruto.cartoes } : {};
  e.notifVistas = Array.isArray(bruto.notifVistas) ? bruto.notifVistas.slice(-300) : [];
  e.dispensadas = Array.isArray(bruto.dispensadas) ? bruto.dispensadas.filter((x) => typeof x === 'string') : [];
  e.regras = bruto.regras && typeof bruto.regras === 'object' ? { ...bruto.regras } : {};
  const orc = bruto.orcamentos && typeof bruto.orcamentos === 'object' ? bruto.orcamentos : {};
  // formato antigo ({ mercado: 50000 }) vira as metas de quem usava o app: dono definido ao escolher a conta
  e.orcamentos = Object.values(orc).some((v) => typeof v === 'number') ? { _semDono: { _t: 0, cats: { ...orc } } } : { ...orc };
  const obj = (x, padrao) => (x && typeof x === 'object' && !Array.isArray(x) ? { ...x } : padrao);
  if (Array.isArray(bruto.pessoas) && bruto.pessoas.length) e.pessoas = bruto.pessoas;
  e.divisao = obj(bruto.divisao, e.divisao);
  e.acertos = obj(bruto.acertos, {});
  e.compartilharSempre = obj(bruto.compartilharSempre, {});
  e.aparelhos = obj(bruto.aparelhos, {});
  e.apagados = obj(bruto.apagados, {});
  return e;
}

/**
 * Cria os lançamentos das contas fixas (recorrentes) que já venceram até `hoje`.
 * Cada mês gerado fica anotado no recorrente, então apagar um lançamento gerado não o faz voltar.
 * Devolve quantos lançamentos foram criados (o estado é alterado no lugar).
 */
export function gerarRecorrentes(estado, hoje = hojeStr()) {
  let n = 0;
  const mesHoje = mesDe(hoje);
  for (const r of estado.recorrentes) {
    const ate = r.fim && r.fim < mesHoje ? r.fim : mesHoje;
    for (const mes of mesesEntre(r.inicio, ate)) {
      if (r.gerados.includes(mes)) continue;
      const data = dataNoMes(mes, r.dia);
      if (data > hoje) continue;
      const id = `rec-${r.id}-${mes}`; // id fixo: os dois celulares geram o mesmo lançamento, sem duplicar
      if (estado.lancamentos.some((l) => l.id === id) || estado.apagados?.[id]) { r.gerados.push(mes); continue; }
      estado.lancamentos.push({ id, tipo: r.tipo, valor: r.valor, data, categoria: r.categoria, descricao: r.descricao, pagamento: r.pagamento, recorrente: r.id,
        ...(r.dono && { dono: r.dono }), ...(r.compartilhado && { compartilhado: true }), ...(r.compartilhado && r.rateio && r.rateio !== 'dividir' && { rateio: r.rateio }), _t: 1 });
      r.gerados.push(mes);
      n++;
    }
  }
  return n;
}

export const doMes = (estado, mes) => estado.lancamentos.filter((l) => l.data.startsWith(mes));

/** Transferências, pagamento de fatura e aplicações movimentam dinheiro, mas não são gasto nem renda. */
export const conta = (l) => !NEUTRAS.has(l.categoria);

export function resumo(lancs) {
  let receitas = 0, despesas = 0;
  for (const l of lancs) if (conta(l)) l.tipo === 'receita' ? (receitas += l.valor) : (despesas += l.valor);
  return { receitas, despesas, saldo: receitas - despesas };
}

/** Totais por categoria, do maior para o menor. */
export function porCategoria(lancs, tipo = 'despesa') {
  const m = new Map();
  for (const l of lancs) {
    if (l.tipo !== tipo || !conta(l)) continue;
    const c = m.get(l.categoria) || { categoria: l.categoria, total: 0, qtd: 0 };
    c.total += l.valor; c.qtd++;
    m.set(l.categoria, c);
  }
  return [...m.values()].sort((a, b) => b.total - a.total);
}

/** Receitas e despesas dos `n` meses que terminam em `mesFinal`. */
export function historico(estado, mesFinal, n = 6) {
  const meses = mesesEntre(somarMeses(mesFinal, -(n - 1)), mesFinal);
  const acc = Object.fromEntries(meses.map((m) => [m, { mes: m, receitas: 0, despesas: 0 }]));
  for (const l of estado.lancamentos) {
    if (!conta(l)) continue;
    const a = acc[mesDe(l.data)];
    if (a) l.tipo === 'receita' ? (a.receitas += l.valor) : (a.despesas += l.valor);
  }
  return meses.map((m) => acc[m]);
}

/** Recorrentes ativos num mês (já gerados ou ainda por vencer). */
export const recorrentesDoMes = (estado, mes) => estado.recorrentes.filter((r) => r.inicio <= mes && (!r.fim || r.fim >= mes));

/**
 * Para o mês corrente: ritmo de gasto e previsão de quanto vai ter saído no fim do mês.
 * Contas fixas entram pelo valor cheio; o resto segue a média por dia até hoje.
 */
export function previsao(estado, mes, hoje = hojeStr()) {
  if (mesDe(hoje) !== mes) return null;
  const dia = +hoje.slice(8, 10);
  const total = diasNoMes(mes);
  const lancs = doMes(estado, mes).filter((l) => l.tipo === 'despesa' && conta(l));
  const variaveis = lancs.filter((l) => !l.recorrente).reduce((s, l) => s + l.valor, 0);
  const fixas = recorrentesDoMes(estado, mes).filter((r) => r.tipo === 'despesa').reduce((s, r) => s + r.valor, 0);
  const fixasPagas = lancs.filter((l) => l.recorrente).reduce((s, l) => s + l.valor, 0);
  const mediaDia = Math.round(variaveis / dia);
  return {
    mediaDia,
    diasRestantes: total - dia,
    fixasAVencer: Math.max(0, fixas - fixasPagas),
    gastoPrevisto: Math.round(variaveis / dia * total) + Math.max(fixas, fixasPagas),
  };
}

/** Situação de cada orçamento no mês: ok (< 80%), atencao (80–100%), estourou (> 100%). */
/** Situação de cada meta: ok (< 80%), atencao (80–100%), estourou (> 100%). */
export function orcamentos(lancsDoMes, limites = {}) {
  const gastos = Object.fromEntries(porCategoria(lancsDoMes).map((c) => [c.categoria, c.total]));
  return Object.entries(limites)
    .filter(([, limite]) => limite > 0)
    .map(([categoria, limite]) => {
      const gasto = gastos[categoria] || 0;
      const pct = gasto / limite;
      return { categoria, limite, gasto, resta: limite - gasto, pct, status: pct > 1 ? 'estourou' : pct >= 0.8 ? 'atencao' : 'ok' };
    })
    .sort((a, b) => b.pct - a.pct);
}

// ---------- casal ----------
/** Lançamentos de uma visão: 'eu' (os meus), 'casal' (os compartilhados dos dois). */
export function daVisao(lancs, visao, eu) {
  if (visao === 'casal') return lancs.filter((l) => l.compartilhado);
  return lancs.filter((l) => !l.dono || l.dono === eu);
}

/** Sugestão de divisão pela renda do mês de cada um (o percentual usado é o definido à mão). */
export function divisaoPelaRenda(lancsDoMes, pessoas) {
  const renda = Object.fromEntries(pessoas.map((p) => [p.id, 0]));
  for (const l of lancsDoMes) if (l.tipo === 'receita' && conta(l) && l.dono in renda) renda[l.dono] += l.valor;
  const total = Object.values(renda).reduce((a, b) => a + b, 0);
  if (!total) return null;
  const pct = Object.fromEntries(pessoas.map((p) => [p.id, Math.round(renda[p.id] / total * 100)]));
  // fecha em 100%
  const soma = Object.values(pct).reduce((a, b) => a + b, 0);
  pct[pessoas[0].id] += 100 - soma;
  return { renda, pct };
}

// De quem é um gasto compartilhado (compartilhar diz quem vê; o rateio diz quem paga):
//   'dividir' — dos dois, pela divisão combinada (padrão)
//   'meu'     — só de quem lançou: o outro vê, mas não entra no acerto
//   'outro'   — só do outro: quem pagou recebe tudo de volta no acerto
export const RATEIOS = ['dividir', 'meu', 'outro'];
export const rateioDe = (l) => (l.rateio === 'meu' || l.rateio === 'outro' ? l.rateio : 'dividir');
/** Quem é o responsável por um gasto individual (null quando é dividido). */
export function responsavel(l, pessoas) {
  const r = rateioDe(l);
  if (r === 'dividir') return null;
  if (r === 'meu') return l.dono || null;
  return pessoas.find((p) => p.id !== l.dono)?.id || null;
}

/**
 * Acerto do mês. Os gastos compartilhados “dividir” são rateados pela divisão combinada; os
 * individuais pagos por quem não é o responsável voltam inteiros para quem pagou; os individuais
 * pagos pelo próprio responsável ficam fora. Devolve também os totais de cada tipo.
 */
export function acerto(lancsDoMes, pessoas, divisao) {
  const ids = pessoas.map((p) => p.id);
  const zero = () => Object.fromEntries(ids.map((id) => [id, 0]));
  const comp = lancsDoMes.filter((l) => l.compartilhado && l.tipo === 'despesa' && conta(l));
  const divididos = comp.filter((l) => rateioDe(l) === 'dividir');
  const total = divididos.reduce((a, l) => a + l.valor, 0);
  const pagou = zero(), individual = zero();
  for (const l of divididos) if (l.dono in pagou) pagou[l.dono] += l.valor;
  const deveria = Object.fromEntries(ids.map((id) => [id, Math.round(total * (divisao[id] ?? 50) / 100)]));
  // individuais: reembolsos[devedor][credor] — o que um pagou e era do outro
  const reembolsos = [];
  for (const l of comp) {
    const resp = responsavel(l, pessoas);
    if (!resp) continue;
    if (resp in individual) individual[resp] += l.valor;
    if (resp !== l.dono && l.dono in pagou) {
      const r = reembolsos.find((x) => x.de === resp && x.para === l.dono);
      if (r) r.valor += l.valor; else reembolsos.push({ de: resp, para: l.dono, valor: l.valor });
    }
  }
  const [a, b] = ids;
  // positivo: A pagou a mais e deve receber
  let saldoA = pagou[a] - deveria[a];
  for (const r of reembolsos) saldoA += r.para === a ? r.valor : -r.valor;
  const transf = Math.abs(saldoA) < 100 ? null : saldoA > 0 ? { de: b, para: a, valor: saldoA } : { de: a, para: b, valor: -saldoA };
  const totalCompartilhado = comp.reduce((s, l) => s + l.valor, 0);
  return { total, pagou, deveria, transf, individual, reembolsos, totalCompartilhado };
}

const semAcento = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Filtro do extrato: texto livre (descrição, categoria, pagamento, valor), tipo e categoria. */
export function filtrar(lancs, { texto = '', tipo = '', categoria = '' } = {}, nomeCategoria = (id) => id) {
  const q = semAcento(texto).trim();
  return lancs.filter((l) => {
    if (tipo && l.tipo !== tipo) return false;
    if (categoria && l.categoria !== categoria) return false;
    if (!q) return true;
    const alvo = semAcento([l.descricao, nomeCategoria(l.categoria), l.pagamento, (l.valor / 100).toFixed(2).replace('.', ',')].join(' '));
    return q.split(/\s+/).every((p) => alvo.includes(p));
  });
}

/** Ordena do mais recente para o mais antigo e agrupa por dia. */
export function agruparPorDia(lancs) {
  const ord = [...lancs].sort((a, b) => (b.data.localeCompare(a.data)) || (b.id.localeCompare(a.id)));
  const grupos = [];
  for (const l of ord) {
    const g = grupos[grupos.length - 1];
    if (g && g.data === l.data) { g.itens.push(l); g.saldo += l.tipo === 'receita' ? l.valor : -l.valor; }
    else grupos.push({ data: l.data, itens: [l], saldo: l.tipo === 'receita' ? l.valor : -l.valor });
  }
  return grupos;
}

/** CSV para abrir no Excel / Planilhas (ponto e vírgula e vírgula decimal, como no Brasil). */
export function csv(lancs, nomeCategoria = (id) => id) {
  const esc = (v) => /[";\n]/.test(v) ? `"${String(v).replace(/"/g, '""')}"` : String(v);
  const linhas = [['Data', 'Tipo', 'Categoria', 'Descrição', 'Pagamento', 'Valor'].join(';')];
  for (const l of [...lancs].sort((a, b) => a.data.localeCompare(b.data))) {
    const [a, m, d] = l.data.split('-');
    const valor = ((l.tipo === 'despesa' ? -l.valor : l.valor) / 100).toFixed(2).replace('.', ',');
    linhas.push([`${d}/${m}/${a}`, l.tipo === 'receita' ? 'Entrada' : 'Saída', nomeCategoria(l.categoria), l.descricao || '', l.pagamento || '', valor].map(esc).join(';'));
  }
  return '﻿' + linhas.join('\r\n') + '\r\n';
}
