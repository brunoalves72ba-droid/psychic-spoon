// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Cronograma: Plano A (4–5 h/semana, ≈26 semanas) e Plano B (2–3 h/semana, ≈48 semanas).
// Se uma semana for ruim, as datas são recalculadas a partir de hoje, sem cobrança. Funções puras.
import { addDays, diffDays, weekStart } from './dia.js';

// [semana inicial, semana final] de cada módulo (M0…M6); a última semana de cada bloco é de respiro e revisão.
export const PLANOS = {
  A: { nome: 'Plano A', ritmo: '4 a 5 horas por semana', total: 26, sem: [[1, 2], [3, 4], [5, 6], [7, 9], [10, 14], [15, 20], [21, 26]],
    tipo: '4 sessões de 45 a 60 min (2 micro-lições + 1 missão), cartões de 15 min nos dias livres e 20 min de revisão semanal.' },
  B: { nome: 'Plano B', ritmo: '2 a 3 horas por semana', total: 48, sem: [[1, 3], [4, 7], [8, 11], [12, 16], [17, 25], [26, 36], [37, 48]],
    tipo: '3 sessões de 30 a 40 min e cartões de 5 min nos outros dias.' },
};

/** Datas de cada módulo a partir do dia de início (a semana 1 começa na segunda-feira da semana do início). */
export function calendario(plano, inicio) {
  const p = PLANOS[plano]; const s0 = weekStart(inicio);
  return p.sem.map(([a, b], m) => ({ m, semIni: a, semFim: b, de: addDays(s0, (a - 1) * 7), ate: addDays(s0, b * 7 - 1) }));
}

/** Em que semana do plano estamos e qual módulo o calendário esperava para hoje. */
export function situacao(plano, inicio, hoje, moduloAtual) {
  const p = PLANOS[plano];
  const semana = Math.floor(diffDays(hoje, weekStart(inicio)) / 7) + 1;
  let esperado = p.sem.findIndex(([a, b]) => semana >= a && semana <= b);
  if (esperado < 0) esperado = semana < 1 ? 0 : 6;
  const fimAtual = p.sem[Math.min(6, moduloAtual)][1];
  return { semana, esperado, atraso: Math.max(0, semana - fimAtual), adiantado: moduloAtual > esperado, fim: addDays(weekStart(inicio), p.total * 7 - 1) };
}

/**
 * Novo dia de início para que o plano "encaixe" no ponto em que você está hoje:
 * módulo atual + fração já feita dele. Não muda o que foi feito; só move as datas.
 */
export function recalcular(plano, hoje, moduloAtual, fracFeita = 0) {
  const [a, b] = PLANOS[plano].sem[Math.min(6, moduloAtual)];
  const semanasFeitas = (a - 1) + Math.floor((b - a + 1) * Math.min(1, Math.max(0, fracFeita)));
  return addDays(weekStart(hoje), -semanasFeitas * 7);
}
