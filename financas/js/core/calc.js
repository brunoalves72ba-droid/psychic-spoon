// Cálculos puros sobre o estado do app (sem tela, sem armazenamento) — testados em tests/calc.test.mjs.
import { mesDe, mesesEntre, somarMeses, dataNoMes, diasNoMes, hoje as hojeStr } from './datas.js';

export const PAGAMENTOS = ['Pix', 'Débito', 'Crédito', 'Dinheiro', 'Boleto', 'Transferência'];

export const CATEGORIAS_PADRAO = [
  { id: 'mercado', nome: 'Mercado', tipo: 'despesa' },
  { id: 'casa', nome: 'Moradia', tipo: 'despesa' },
  { id: 'contas', nome: 'Contas (luz, água, internet)', tipo: 'despesa' },
  { id: 'transporte', nome: 'Transporte', tipo: 'despesa' },
  { id: 'restaurante', nome: 'Restaurante e delivery', tipo: 'despesa' },
  { id: 'saude', nome: 'Saúde', tipo: 'despesa' },
  { id: 'educacao', nome: 'Educação', tipo: 'despesa' },
  { id: 'lazer', nome: 'Lazer', tipo: 'despesa' },
  { id: 'compras', nome: 'Compras', tipo: 'despesa' },
  { id: 'assinaturas', nome: 'Assinaturas', tipo: 'despesa' },
  { id: 'outros', nome: 'Outros gastos', tipo: 'despesa' },
  { id: 'salario', nome: 'Salário', tipo: 'receita' },
  { id: 'extra', nome: 'Renda extra', tipo: 'receita' },
  { id: 'outras-receitas', nome: 'Outras entradas', tipo: 'receita' },
];

export const estadoVazio = () => ({
  versao: 1,
  categorias: CATEGORIAS_PADRAO.map((c) => ({ ...c })),
  lancamentos: [],
  recorrentes: [],
  orcamentos: {},
  regras: {}, // descrição do banco → categoria escolhida por você
});

export const novoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

/** Confere e completa um estado vindo do armazenamento ou de um backup. Lança erro se não for do app. */
export function normalizar(bruto) {
  if (!bruto || typeof bruto !== 'object' || !Array.isArray(bruto.lancamentos)) throw new Error('Arquivo não é um backup do Finanças.');
  const e = estadoVazio();
  if (Array.isArray(bruto.categorias) && bruto.categorias.length) e.categorias = bruto.categorias.filter((c) => c && c.id && c.nome && (c.tipo === 'despesa' || c.tipo === 'receita'));
  e.lancamentos = bruto.lancamentos.filter((l) => l && l.id && Number.isInteger(l.valor) && l.valor > 0 && /^\d{4}-\d{2}-\d{2}$/.test(l.data) && (l.tipo === 'despesa' || l.tipo === 'receita'));
  e.recorrentes = (bruto.recorrentes || []).filter((r) => r && r.id && Number.isInteger(r.valor) && /^\d{4}-\d{2}$/.test(r.inicio)).map((r) => ({ gerados: [], fim: null, ...r }));
  e.regras = bruto.regras && typeof bruto.regras === 'object' ? { ...bruto.regras } : {};
  e.orcamentos = bruto.orcamentos && typeof bruto.orcamentos === 'object' ? { ...bruto.orcamentos } : {};
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
      estado.lancamentos.push({ id: novoId(), tipo: r.tipo, valor: r.valor, data, categoria: r.categoria, descricao: r.descricao, pagamento: r.pagamento, recorrente: r.id });
      r.gerados.push(mes);
      n++;
    }
  }
  return n;
}

export const doMes = (estado, mes) => estado.lancamentos.filter((l) => l.data.startsWith(mes));

export function resumo(lancs) {
  let receitas = 0, despesas = 0;
  for (const l of lancs) l.tipo === 'receita' ? (receitas += l.valor) : (despesas += l.valor);
  return { receitas, despesas, saldo: receitas - despesas };
}

/** Totais por categoria, do maior para o menor. */
export function porCategoria(lancs, tipo = 'despesa') {
  const m = new Map();
  for (const l of lancs) {
    if (l.tipo !== tipo) continue;
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
  const lancs = doMes(estado, mes).filter((l) => l.tipo === 'despesa');
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
export function orcamentos(estado, mes) {
  const gastos = Object.fromEntries(porCategoria(doMes(estado, mes)).map((c) => [c.categoria, c.total]));
  return Object.entries(estado.orcamentos)
    .filter(([, limite]) => limite > 0)
    .map(([categoria, limite]) => {
      const gasto = gastos[categoria] || 0;
      const pct = gasto / limite;
      return { categoria, limite, gasto, resta: limite - gasto, pct, status: pct > 1 ? 'estourou' : pct >= 0.8 ? 'atencao' : 'ok' };
    })
    .sort((a, b) => b.pct - a.pct);
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
