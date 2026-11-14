// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Mapa da trilha: 7 ilhas (M0 a M6) e o APE-IA crescendo a cada módulo concluído.
import { h, progressBar } from '../core/ui.js';
import { S } from '../core/estado.js';
import { MODULOS, progressoModulo, progressoGeral, moduloAtual } from '../data/curso.js';
import { robo, PARTES } from '../core/robo.js';
import { fotoDoModulo } from '../core/fotos.js';

export default async function (el) {
  const g = progressoGeral(S.licoes);
  const atual = moduloAtual(S.licoes);
  const feitos = MODULOS.map((m) => { const p = progressoModulo(m.n, S.licoes); return p.total > 0 && p.feitas === p.total; });
  const proximaParte = feitos.indexOf(false);
  el.append(
    h('header', h('div.eyebrow', `${g.feitas} de ${g.total} lições`), h('h1', 'Trilha')),
    h('section.card.flat', { style: { display: 'grid', gridTemplateColumns: '116px 1fr', gap: '12px', alignItems: 'center' } },
      robo(feitos, 116),
      h('div', h('h3', 'O seu APE-IA'), h('p.small.dim', 'Assistente Pessoal de Estudos com IA: o projeto único do curso. Cada módulo concluído monta uma parte dele.'),
        h('p.small', { style: { marginTop: '6px' } }, proximaParte < 0 ? 'Todas as partes montadas.' : ['Próxima parte: ', h('b', PARTES[proximaParte]), ` (Módulo ${proximaParte}).`]))),
    h('nav.ilhas.ilhas-grade', { 'aria-label': 'Módulos' }, MODULOS.map((m) => {
      const p = progressoModulo(m.n, S.licoes);
      const cheia = p.total > 0 && p.feitas === p.total;
      return h('a.ilha' + (cheia ? '.cheia' : '') + (m.n === atual && !cheia ? '.atual' : ''), { href: `#/trilha/m/${m.n}`, css: { '--c': m.cor } },
        h('span.orb.foto-orb', { style: fotoDoModulo(m.n) ? { backgroundImage: `linear-gradient(rgba(10,12,20,.45),rgba(10,12,20,.45)),url("${fotoDoModulo(m.n).arq}")` } : null }, cheia ? '✓' : `M${m.n}`),
        h('span.t', h('b', m.t), h('span', p.total ? `${p.feitas} de ${p.total} lições · cerca de ${m.horas} h com prática` : 'em preparação'), progressBar(p.frac, m.cor)));
    })),
    h('a.item', { href: '#/labs' }, h('span.n', '⚗'), h('span.t', h('b', 'Laboratórios'), h('span', 'Simuladores para mexer e ver acontecer: tokens, temperatura, JSON, API, RAG, n8n, Python.')), h('span.chev', '›')),
  );
}
