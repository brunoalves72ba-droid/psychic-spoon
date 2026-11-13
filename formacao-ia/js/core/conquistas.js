// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Conquistas por habilidade: marcam coisas que você passou a saber fazer, não tempo de tela.
import { S, revs, salvar } from './estado.js';
import { hoje } from './dia.js';
import { retencao } from './srs.js';
import { MODULOS, progressoModulo, progressoGeral } from '../data/curso.js';

const feitas = () => progressoGeral(S.licoes).feitas;
const moduloCompleto = (n) => { const p = progressoModulo(n, S.licoes); return p.total > 0 && p.feitas === p.total; };
const maos = () => Object.values(S.licoes).filter((x) => x.mao === 'feito').length;

export const CONQUISTAS = [
  { id: 'primeira', t: 'Primeiro passo', d: 'Concluiu a primeira micro-lição.', ok: () => feitas() >= 1 },
  { id: 'dez', t: 'Dez lições', d: 'Dez micro-lições concluídas.', ok: () => feitas() >= 10 },
  ...MODULOS.map((m) => ({ id: 'm' + m.n, t: `Módulo ${m.n} completo`, d: `Todas as lições de “${m.t}”.`, ok: () => moduloCompleto(m.n) })),
  { id: 'json', t: 'JSON sem erro', d: 'Fez um JSON passar no validador.', ok: () => !!S.marcos.json },
  { id: 'api200', t: 'Primeira chamada de API', d: 'Recebeu um 200 no laboratório de API.', ok: () => !!S.marcos.api200 },
  { id: 'rag', t: 'Busca com fonte', d: 'Fez o mini-RAG achar o trecho certo.', ok: () => !!S.marcos.rag },
  { id: 'n8n', t: 'Primeira expressão no n8n', d: 'Montou uma expressão {{ }} que funciona.', ok: () => !!S.marcos.n8n },
  { id: 'python', t: 'Olá, Python', d: 'Seu primeiro programa passou nos testes.', ok: () => !!S.marcos.python },
  { id: 'agente', t: 'Dentro do agente', d: 'Conduziu o laço pensar, agir e observar até a resposta.', ok: () => !!S.marcos.agente },
  { id: 'mao5', t: 'Mão na massa', d: 'Cinco práticas feitas fora do app.', ok: () => maos() >= 5 },
  { id: 'rev50', t: 'Cinquenta revisões', d: 'Cinquenta cartões respondidos.', ok: () => revs.length >= 50 },
  { id: 'ret7', t: 'Memória de 7 dias', d: '80% ou mais de acerto nas revisões de 7 dias (mínimo de 10).', ok: () => { const r = retencao(revs, 7); return r.n >= 10 && r.taxa >= 0.8; } },
  { id: 'ret21', t: 'Memória de 21 dias', d: '80% ou mais de acerto nas revisões de 21 dias (mínimo de 10).', ok: () => { const r = retencao(revs, 21); return r.n >= 10 && r.taxa >= 0.8; } },
  { id: 'semana', t: 'Semana 4 de 7', d: 'Bateu a meta semanal pela primeira vez.', ok: () => Object.values(S.semana.hist).includes('ok') },
  { id: 'seq3', t: 'Três semanas seguidas', d: 'Três semanas batendo a meta.', ok: () => S.semana.seq >= 3 },
  { id: 'volta', t: 'Voltou depois de uma pausa', d: 'Recomeçar também é habilidade.', ok: () => Object.values(S.semana.hist).includes('pausa') && Object.keys(S.dias).some((d) => d >= (S.semana.ult || '')) && !!S.dias[hoje()] },
  { id: 'diario7', t: 'Diário de bordo', d: 'Sete entradas no diário.', ok: () => S.diario.length >= 7 },
  { id: 'prompts10', t: 'Biblioteca de 10 prompts', d: 'Dez prompts guardados e versionados.', ok: () => S.prompts.length >= 10 },
  { id: 'apeia', t: 'APE-IA v1.0 no ar', d: 'Concluiu a missão final do projeto.', ok: () => !!(S.missoes['m6-final'] && S.missoes['m6-final'].feita) },
];

/** Confere e registra conquistas novas. Devolve a lista das recém-ganhas. */
export function verificarConquistas() {
  const novas = [];
  for (const c of CONQUISTAS) {
    if (S.conquistas[c.id]) continue;
    let ok = false;
    try { ok = !!c.ok(); } catch { ok = false; }
    if (ok) { S.conquistas[c.id] = hoje(); novas.push(c); }
  }
  if (novas.length) salvar('conquistas');
  return novas;
}
