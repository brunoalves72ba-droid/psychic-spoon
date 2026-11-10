// Sexteto — © Bruno Moura, único e exclusivo proprietário.
// Harmonia: ferramentas e trilha de aulas.
import { h } from '../core/ui.js';
import { events } from '../core/store.js';
import { AULAS } from '../data/aulas.js';

export default async function harmonia(el) {
  const done = new Set((await events('lesson')).map((e) => e.data.id));
  const tool = (href, c, t, d) => h('a.tool', { href, css: { '--c': c } }, h('b', t), h('span', d));
  el.append(
    h('header', h('div.eyebrow', 'Harmonia'), h('h1', 'Ouvir, entender, cantar')),
    h('section.tools',
      tool('#/harmonia/acordes', 'var(--v5)', 'Estúdio de acordes', 'Monte, ouça e cante a nota que falta'),
      tool('#/harmonia/imersao', 'var(--v2)', 'Imersão', 'Seis vozes em tela cheia'),
      tool('#/harmonia/cante', 'var(--v3)', 'Cante a sua voz', 'O microfone pontua cada nota'),
      tool('#/harmonia/ouvido', 'var(--v1)', 'Ouvido', 'Treino com dificuldade adaptativa'),
    ),
    h('h2', 'Trilha de aulas'),
    h('p.small.muted', `${done.size} de ${AULAS.length} concluídas. Cada aula tem texto curto, experimento, exercício de cantar e três perguntas.`),
    h('section.list', AULAS.map((a) => h('a.item' + (done.has(a.id) ? '.done' : ''), { href: `#/harmonia/aula/${a.id}` }, h('span.n', done.has(a.id) ? '✓' : String(a.id)), h('span.t', h('b', a.title), h('span', a.sub)), h('span.chev', '›')))),
    h('h2', 'Mais ferramentas'),
    h('section.tools',
      tool('#/harmonia/metronomo', 'var(--v4)', 'Metrônomo', 'Com vibração no tempo'),
      tool('#/harmonia/ritmo', 'var(--v0)', 'Ritmo', 'Aulas com toque na tela'),
      tool('#/harmonia/partitura', 'var(--v1)', 'Partitura', 'Leia as notas na pauta'),
      tool('#/harmonia/teclado', 'var(--v2)', 'Teclado', 'Na tela ou por MIDI'),
      tool('#/harmonia/glossario', 'var(--v5)', 'Glossário', 'Os termos, em uma frase'),
    ),
  );
}
