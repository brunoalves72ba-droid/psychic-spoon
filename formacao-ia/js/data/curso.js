// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Estrutura da trilha: 7 módulos (M0 a M6), aulas e a ordem das 98 micro-lições.
import { M0 } from './m0.js';
import { M1 } from './m1.js';
import { M2 } from './m2.js';
import { M3A } from './m3a.js';
import { M3B } from './m3b.js';
import { M4A } from './m4a.js';
import { M4B } from './m4b.js';
import { M4C } from './m4c.js';
import { M5A } from './m5a.js';
import { M5B } from './m5b.js';
import { M5C } from './m5c.js';
import { M6A } from './m6a.js';
import { M6B } from './m6b.js';
import { M6C } from './m6c.js';

const ids = (arr) => arr.map((l) => l.id);

export const MODULOS = [
  { n: 0, cor: 'var(--m0)', t: 'Pré-requisitos', sub: 'Computador, internet e lógica', horas: 6, ementa: 'Fora da ementa. Obrigatório para quem começa do zero.',
    ganha: 'A casa do projeto: pastas e diário de bordo', marco: 'Pastas e diário de bordo',
    aulas: [{ t: 'Base digital e lógica', ids: ids(M0) }] },
  { n: 1, cor: 'var(--m1)', t: 'IA generativa e LLMs', sub: 'Como os modelos funcionam e como usar com responsabilidade', horas: 10, ementa: '8 h na ementa',
    ganha: 'Modelos escolhidos e regras de ética e LGPD', marco: 'Ficha técnica de 1 página',
    aulas: [{ t: 'Aula 1 — Introdução à IA generativa e LLMs', ids: ids(M1).slice(0, 8) }, { t: 'Aula 2 — Ética, segurança e uso responsável', ids: ids(M1).slice(8) }] },
  { n: 2, cor: 'var(--m2)', t: 'Prompt engineering', sub: 'Pedir bem para receber bem', horas: 10, ementa: '8 h na ementa',
    ganha: 'A voz: biblioteca de prompts testados', marco: 'Biblioteca de 10 prompts',
    aulas: [{ t: 'Aula 1 — Fundamentos e técnicas', ids: ids(M2).slice(0, 8) }, { t: 'Aula 2 — Casos de negócio', ids: ids(M2).slice(8) }] },
  { n: 3, cor: 'var(--m3)', t: 'Fundamentos técnicos', sub: 'APIs, embeddings e RAG. O salto mais difícil', horas: 12, ementa: '8 h na ementa',
    ganha: 'A memória de consulta: primeira chamada de API e mini-RAG', marco: 'Mini-RAG que cita a fonte',
    aulas: [{ t: 'Aula 1 — APIs de modelos de linguagem', ids: ids(M3A) }, { t: 'Aula 2 — Embeddings, bancos vetoriais e RAG', ids: ids(M3B) }] },
  { n: 4, cor: 'var(--m4)', t: 'Automação com n8n', sub: 'Fluxos que trabalham por você', horas: 22, ementa: '20 h na ementa',
    ganha: 'Os braços: pergunta → IA → registro na planilha', marco: 'Fluxo conversacional no n8n',
    aulas: [{ t: 'Aula 1 — Fundamentos e fluxos', ids: ids(M4A) }, { t: 'Aula 2 — APIs, ferramentas e bancos de dados', ids: ids(M4B) }, { t: 'Aula 3 — Agentes de IA no n8n', ids: ids(M4C) }] },
  { n: 5, cor: 'var(--m5)', t: 'Python para IA', sub: 'Do print à fábrica de flashcards', horas: 28, ementa: '24 h na ementa',
    ganha: 'O motor: Python lê seus arquivos e gera cartões', marco: 'Repositório “Fábrica de flashcards”',
    aulas: [{ t: 'Aula 1 — Fundamentos', ids: ids(M5A) }, { t: 'Aula 2 — Automação de processos', ids: ids(M5B) }, { t: 'Aula 3 — Python com LLMs', ids: ids(M5C) }] },
  { n: 6, cor: 'var(--m6)', t: 'Agentes inteligentes', sub: 'RAG, memória, ferramentas e endereço público', horas: 28, ementa: '24 h na ementa',
    ganha: 'O corpo inteiro: agente com RAG, memória e endereço público', marco: 'APE-IA v1.0 com URL pública',
    aulas: [{ t: 'Aula 1 — Agentes com RAG', ids: ids(M6A) }, { t: 'Aula 2 — Multiagentes', ids: ids(M6B) }, { t: 'Aula 3 — Interfaces e deploy público', ids: ids(M6C) }] },
];

export const TODAS = [...M0, ...M1, ...M2, ...M3A, ...M3B, ...M4A, ...M4B, ...M4C, ...M5A, ...M5B, ...M5C, ...M6A, ...M6B, ...M6C];
export const ORDEM = TODAS.map((l) => l.id);
const MAPA = new Map(TODAS.map((l) => [l.id, l]));

export const PASSOS = ['Gancho', 'Ideia', 'Exemplo resolvido', 'Exercício', 'Quiz', 'Erro comum', 'Fim'];

export const licao = (id) => MAPA.get(id) || null;
export const moduloDe = (id) => +String(id).split('.')[0];
export const modulo = (n) => MODULOS[n];
export const idsDoModulo = (n) => MODULOS[n].aulas.flatMap((a) => a.ids);
export const aulaDe = (id) => { const m = MODULOS[moduloDe(id)]; return m ? m.aulas.find((a) => a.ids.includes(id)) : null; };

/** Próxima lição a estudar: a que está em andamento, senão a primeira ainda não concluída. null = trilha completa. */
export function proxima(licoes, emAndamento) {
  if (emAndamento && MAPA.has(emAndamento) && !(licoes[emAndamento] && licoes[emAndamento].feita)) return emAndamento;
  return ORDEM.find((id) => !(licoes[id] && licoes[id].feita)) || null;
}
export const seguinte = (id) => ORDEM[ORDEM.indexOf(id) + 1] || null;

export function progressoModulo(n, licoes) {
  const lista = idsDoModulo(n);
  const feitas = lista.filter((id) => licoes[id] && licoes[id].feita).length;
  return { feitas, total: lista.length, frac: lista.length ? feitas / lista.length : 0 };
}
export function progressoGeral(licoes) {
  const feitas = ORDEM.filter((id) => licoes[id] && licoes[id].feita).length;
  return { feitas, total: ORDEM.length, frac: ORDEM.length ? feitas / ORDEM.length : 0 };
}
/** Módulo em que a pessoa está (o da próxima lição; 6 se já concluiu tudo). */
export const moduloAtual = (licoes) => { const p = proxima(licoes); return p ? moduloDe(p) : 6; };

/** Cartão de revisão a partir do id: "1.3#0" (pergunta do quiz) ou "u12" (importado). */
export function cartao(cid, meus = []) {
  if (cid[0] === 'u') { const c = meus.find((x) => x.id === cid); return c ? { id: cid, f: c.f, v: c.v, w: '', meu: true } : null; }
  const [lid, i] = cid.split('#');
  const l = MAPA.get(lid); const q = l && l.quiz[+i];
  return q ? { id: cid, f: q.q, v: q.o[0], w: q.w || '', lid, licao: l.t, m: moduloDe(lid) } : null;
}
