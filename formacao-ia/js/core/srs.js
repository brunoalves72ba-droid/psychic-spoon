// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Revisão espaçada em escada fixa: o conceito volta em 1, 3, 7 e 21 dias (depois 60 e 120).
// A escada fixa é previsível e deixa medir a retenção de 7 e de 21 dias diretamente. Funções puras.
import { addDays, diffDays } from './dia.js';

export const ESCADA = [1, 3, 7, 21, 60, 120];
export const TETO = 15; // cartões por dia: o teto evita a pilha desmotivadora
export const NOTAS = ['errei', 'dificil', 'lembrei'];

/** Cartão recém-criado (logo depois da lição): volta amanhã. */
export const novoCartao = (hoje) => ({ s: 0, due: addDays(hoje, ESCADA[0]), n: 0, l: 0 });

/**
 * Aplica a resposta. Devolve { cartao, log }.
 * errei → volta ao primeiro degrau (amanhã). dificil → repete o mesmo intervalo. lembrei → sobe um degrau.
 */
export function responder(c, nota, hoje) {
  if (!NOTAS.includes(nota)) throw new Error('nota inválida: ' + nota);
  const intervalo = ESCADA[c.s];
  const log = { int: intervalo, atraso: Math.max(0, diffDays(hoje, c.due)), ok: nota !== 'errei', nota };
  let s = c.s, l = c.l || 0;
  if (nota === 'errei') { s = 0; l += 1; } else if (nota === 'lembrei') s = Math.min(ESCADA.length - 1, c.s + 1);
  return { cartao: { s, due: addDays(hoje, ESCADA[s]), n: (c.n || 0) + 1, l, u: hoje }, log };
}

/** Ids dos cartões vencidos, do mais atrasado ao mais recente. */
export function vencidos(cartoes, hoje) {
  return Object.keys(cartoes).filter((id) => cartoes[id].due <= hoje)
    .sort((a, b) => (cartoes[a].due < cartoes[b].due ? -1 : cartoes[a].due > cartoes[b].due ? 1 : a < b ? -1 : 1));
}
/** Fila de hoje, respeitando o teto. */
export const fila = (cartoes, hoje, teto = TETO) => vencidos(cartoes, hoje).slice(0, teto);

/** Quantos cartões vencem em cada um dos próximos n dias (previsão honesta, sem contar o que será revisto). */
export function previsao(cartoes, hoje, n = 7) {
  const out = Array.from({ length: n }, () => 0);
  for (const id of Object.keys(cartoes)) { const d = diffDays(cartoes[id].due, hoje); if (d >= 1 && d <= n) out[d - 1]++; }
  return out;
}

/**
 * Retenção medida: fração de acertos nas revisões feitas depois de um intervalo de `dias`.
 * logs: [{int, ok}]. Devolve { n, taxa } (taxa = null se não houver dados).
 */
export function retencao(logs, dias) {
  const xs = logs.filter((x) => x.int === dias);
  return { n: xs.length, taxa: xs.length ? xs.filter((x) => x.ok).length / xs.length : null };
}

/** Resumo do baralho por degrau. */
export function resumo(cartoes) {
  const porDegrau = ESCADA.map(() => 0);
  for (const id of Object.keys(cartoes)) porDegrau[cartoes[id].s]++;
  return { total: Object.keys(cartoes).length, porDegrau, firmes: porDegrau.slice(3).reduce((a, b) => a + b, 0) };
}
