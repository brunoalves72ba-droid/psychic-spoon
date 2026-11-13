// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Página de um módulo: aulas, micro-lições, missão do projeto e recursos externos.
import { h, top, progressBar } from '../core/ui.js';
import { S } from '../core/estado.js';
import { MODULOS, licao, progressoModulo, proxima } from '../data/curso.js';
import { PROJETO, progressoProjeto } from '../data/projeto.js';
import { RECURSOS } from '../data/recursos.js';

export default async function (el, [n]) {
  const m = MODULOS[+n];
  if (!m) { location.replace('#/trilha'); return; }
  const p = progressoModulo(m.n, S.licoes);
  const prox = proxima(S.licoes, S.sessao.licao);
  const pj = PROJETO[m.n];
  const pp = progressoProjeto(S.missoes, m.n);
  el.style.setProperty('--c', m.cor);
  el.append(
    top(`Módulo ${m.n}`, '#/trilha'),
    h('div', h('h2', m.t), h('p.dim', m.sub), h('div.row.wrap', { style: { margin: '8px 0' } }, h('span.tag.c', `${p.feitas} de ${p.total} lições`), h('span.tag', `cerca de ${m.horas} h com prática`), h('span.tag', m.ementa)), progressBar(p.frac, m.cor)),
  );
  if (!p.total) el.append(h('div.banner', 'As lições deste módulo ainda estão sendo escritas.'));
  for (const a of m.aulas) {
    if (!a.ids.length) continue;
    el.append(h('h3', { style: { marginTop: '6px' } }, a.t), h('div.list', a.ids.map((id) => {
      const L = licao(id); const st = S.licoes[id] || {};
      const andando = !st.feita && st.p > 0;
      return h('a.item' + (st.feita ? '.done' : '') + (id === prox ? '.now' : ''), { href: `#/licao/${id}` },
        h('span.n', st.feita ? '✓' : id), h('span.t', h('b', L.t), h('span', `${st.feita ? id + ' · ' : ''}${L.min} min${andando ? ` · parou no passo ${st.p + 1}` : ''}${st.mao === 'depois' ? ' · prática pendente' : ''}`)), h('span.chev', '›'));
    })));
  }
  el.append(h('section.card.flat', { style: { borderLeft: '4px solid var(--c)' } },
    h('div.eyebrow', 'Projeto deste módulo'), h('h3', pj.t), h('p.small.dim', pj.entrega),
    h('div.row.between', { style: { marginTop: '10px' } }, h('span.small.muted', `${pp.feitas} de ${pp.total} missões`), h('a.btn.small', { href: `#/projeto/m/${m.n}` }, 'Ver missões'))));
  const rec = RECURSOS[m.n] || [];
  if (rec.length) el.append(h('h3', 'Para ir além'), h('div.list', rec.map((r) => h('a.item', { href: r.u, target: '_blank', rel: 'noopener noreferrer' }, h('span.t', h('b', r.t), h('span', r.de)), h('span.chev', '↗')))));
}
