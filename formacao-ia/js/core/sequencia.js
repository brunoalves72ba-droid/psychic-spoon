// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Sequência que perdoa: meta semanal de 4 dias em 7, dois congelamentos automáticos, zero culpa.
// Um dia conta quando houve qualquer estudo (o "dia mínimo" é 1 cartão). Funções puras.
import { addDays, weekStart, weekDays, diffDays } from './dia.js';

export const META = 4;
export const GELOS_MAX = 2;
export const novaSequencia = () => ({ seq: 0, gelos: GELOS_MAX, ult: null, hist: {} });

const ativo = (dias, d) => { const x = dias[d]; return !!x && ((x.l || 0) + (x.c || 0) + (x.m || 0) + (x.p || 0) > 0); };
export const diasAtivos = (dias, start) => weekDays(start).filter((d) => ativo(dias, d)).length;

/**
 * Fecha as semanas já terminadas (anteriores à semana de `hoje`) que ainda não foram contadas.
 * - semana com 4+ dias: sequência +1 e recarrega um congelamento (até 2);
 * - semana abaixo da meta: gasta um congelamento e mantém a sequência; sem congelamento, a sequência zera;
 * - a primeira semana de uso nunca conta como falha (você pode ter começado numa sexta).
 * Devolve { estado, eventos: [{semana, tipo}] } sem alterar a entrada.
 */
export function fechar(estado, dias, hoje) {
  const e = { ...estado, hist: { ...estado.hist } };
  const eventos = [];
  const todos = Object.keys(dias).filter((d) => ativo(dias, d)).sort();
  if (!todos.length) return { estado: e, eventos };
  const primeira = weekStart(todos[0]);
  const atual = weekStart(hoje);
  let w = e.ult ? addDays(e.ult, 7) : primeira;
  // ausência muito longa: não percorre centenas de semanas; depois de 2 congelamentos a sequência já zerou
  if (e.ult && diffDays(atual, w) > 7 * 12) w = addDays(atual, -7 * 12);
  for (; w < atual; w = addDays(w, 7)) {
    const n = diasAtivos(dias, w);
    let tipo;
    if (n >= META) { e.seq += 1; e.gelos = Math.min(GELOS_MAX, e.gelos + 1); tipo = 'ok'; }
    else if (w === primeira) tipo = 'inicio';
    else if (e.gelos > 0) { e.gelos -= 1; tipo = 'gelo'; }
    else { e.seq = 0; tipo = 'pausa'; }
    e.hist[w] = tipo; e.ult = w;
    eventos.push({ semana: w, tipo, dias: n });
  }
  return { estado: e, eventos };
}

/** Situação da semana atual: 7 dias com marcação, contagem e quanto falta para a meta. */
export function semanaAtual(dias, hoje) {
  const start = weekStart(hoje);
  const lista = weekDays(start).map((d) => ({ d, on: ativo(dias, d), hoje: d === hoje, futuro: d > hoje }));
  const feitos = lista.filter((x) => x.on).length;
  const restam = lista.filter((x) => !x.on && x.d >= hoje).length; // dias ainda possíveis (hoje incluso, se ainda não contou)
  return { start, lista, feitos, falta: Math.max(0, META - feitos), possivel: feitos + restam >= META, batida: feitos >= META };
}
